import { CustomModel, ModelConfig } from "@/aiParams";
import { ModelCapability } from "@/constants";
import { getDecryptedKey } from "@/encryptionService";
import { logError, logInfo } from "@/logger";
import {
  CopilotSettings,
  getSettings,
  subscribeToSettingsChange,
} from "@/settings/model";
import { getModelInfo, safeFetch } from "@/utils";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { Notice } from "obsidian";

type ChatConstructorType = {
  new (config: any): any;
};

export default class ChatModelManager {
  private static instance: ChatModelManager;
  private static chatModel: BaseChatModel | null;
  private static modelMap: Record<
    string,
    {
      hasApiKey: boolean;
      AIConstructor: ChatConstructorType;
    }
  >;

  private static readonly ANTHROPIC_THINKING_BUDGET_TOKENS = 2048;

  private constructor() {
    this.buildModelMap();
    subscribeToSettingsChange(() => {
      this.buildModelMap();
      this.validateCurrentModel();
    });
  }

  static getInstance(): ChatModelManager {
    if (!ChatModelManager.instance) {
      ChatModelManager.instance = new ChatModelManager();
    }
    return ChatModelManager.instance;
  }

  private static readonly REASONING_MODEL_TEMPERATURE = 1;

  /**
   * Determines the appropriate temperature for a model
   */
  private getTemperatureForModel(
    modelName: string,
    settings: CopilotSettings
  ): number | undefined {
    const modelInfo = getModelInfo(modelName);

    // Thinking-enabled models don't accept temperature
    if (modelInfo.isThinkingEnabled) {
      return undefined;
    }

    // O-series and GPT-5 models require temperature = 1
    if (modelInfo.isOSeries || modelInfo.isGPT5) {
      return ChatModelManager.REASONING_MODEL_TEMPERATURE;
    }

    // All other models use configured temperature
    return settings.temperature;
  }

  private async getModelConfig(modelName: string, settings: CopilotSettings): Promise<ModelConfig> {
    const resolvedTemperature = this.getTemperatureForModel(modelName, settings);
    const maxTokens = settings.maxTokens;
    const modelInfo = getModelInfo(modelName);

    // Base config using unified API settings
    const config: Omit<ModelConfig, "maxTokens" | "maxCompletionTokens"> = {
      modelName: modelName,
      streaming: true,
      maxRetries: 3,
      maxConcurrency: 3,
      enableCors: false,
      ...(!modelInfo.isThinkingEnabled && resolvedTemperature !== undefined
        ? { temperature: resolvedTemperature }
        : {}),
    };

    // Unified API configuration - all models use ChatOpenAI with the global API settings
    const providerConfig = {
      modelName: modelName,
      apiKey: await getDecryptedKey(settings.apiKey),
      configuration: {
        baseURL: settings.apiBaseUrl,
        fetch: safeFetch,
        defaultHeaders: { "dangerously-allow-browser": "true" },
      },
      maxTokens,
      temperature: resolvedTemperature,
    };

    // Add reasoning parameters for models that support it
    if (modelInfo.isOSeries || modelInfo.isGPT5) {
      (providerConfig as any).reasoning = {
        effort: settings.reasoningEffort,
      };

      // Add verbosity for GPT-5 models
      if (modelInfo.isGPT5 && settings.verbosity) {
        (providerConfig as any).text = {
          verbosity: settings.verbosity,
        };
        (providerConfig as any).useResponsesApi = true;
      }
    }

    return {
      ...config,
      ...providerConfig,
    } as ModelConfig;
  }

  /**
   * Build a map of modelId to model config
   */
  public buildModelMap() {
    const chatModels = getSettings().chatModels;
    ChatModelManager.modelMap = {};
    const modelMap = ChatModelManager.modelMap;

    chatModels.forEach((model) => {
      if (model.enabled && model.type === "chat") {
        const hasCredentials = Boolean(getSettings().apiKey);
        modelMap[model.id] = {
          hasApiKey: hasCredentials,
          AIConstructor: ChatOpenAI,
        };
      }
    });
  }

  getChatModel(): BaseChatModel {
    if (!ChatModelManager.chatModel) {
      throw new Error("No valid chat model available. Please check your API configuration.");
    }
    return ChatModelManager.chatModel;
  }

  /**
   * Find a model by its ID
   */
  private findModelById(modelId: string): CustomModel | undefined {
    const settings = getSettings();
    return settings.chatModels.find((model) => model.id === modelId);
  }

  /**
   * Resolve the current model for operations
   */
  private resolveCurrentModel(): CustomModel {
    const settings = getSettings();

    // Try to get the default chat model
    const defaultModel = this.findModelById(settings.defaultChatModelKey);
    if (defaultModel && defaultModel.enabled && settings.apiKey) {
      return defaultModel;
    }

    // Fallback to first enabled chat model
    const firstEnabled = settings.chatModels.find(
      (model) => model.enabled && model.type === "chat"
    );

    if (firstEnabled && settings.apiKey) {
      return firstEnabled;
    }

    throw new Error(
      "No valid chat model available. " +
        "Please add a chat model in Models settings and ensure your API key is configured."
    );
  }

  /**
   * Get a chat model instance with temperature override
   */
  async getChatModelWithTemperature(temperature: number): Promise<BaseChatModel> {
    const model = this.resolveCurrentModel();
    const settings = getSettings();

    // Create model config with temperature override
    const resolvedTemperature = this.getTemperatureForModel(model.name, settings);
    const finalTemperature = resolvedTemperature !== undefined ? temperature : resolvedTemperature;

    const modelInstance = new ChatOpenAI({
      modelName: model.name,
      apiKey: await getDecryptedKey(settings.apiKey),
      configuration: {
        baseURL: settings.apiBaseUrl,
        fetch: safeFetch,
        defaultHeaders: { "dangerously-allow-browser": "true" },
      },
      streaming: true,
      maxRetries: 3,
      maxConcurrency: 3,
      maxTokens: settings.maxTokens,
      temperature: finalTemperature,
    });

    return modelInstance;
  }

  async setChatModel(model: CustomModel): Promise<void> {
    try {
      const modelInstance = await this.createModelInstance(model);
      ChatModelManager.chatModel = modelInstance;

      const modelInfo = getModelInfo(model.name);
      if (modelInfo.isGPT5) {
        logInfo(`Chat model set with Responses API for GPT-5: ${model.name}`);
      }
    } catch (error) {
      logError(error);
      throw error;
    }
  }

  async createModelInstance(model: CustomModel): Promise<BaseChatModel> {
    const settings = getSettings();
    const modelKey = model.id;
    const selectedModel = ChatModelManager.modelMap[modelKey];

    if (!selectedModel) {
      throw new Error(`No model found for: ${modelKey}`);
    }

    if (!selectedModel.hasApiKey) {
      const errorMessage = `API key is not configured. Please set your API key in Basic Settings.`;
      throw new Error(errorMessage);
    }

    const modelConfig = await this.getModelConfig(model.name, settings);
    const newModelInstance = new ChatOpenAI(modelConfig);

    return newModelInstance;
  }

  validateChatModel(chatModel: BaseChatModel): boolean {
    return chatModel !== undefined && chatModel !== null;
  }

  // Simple token estimation
  private estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  async countTokens(inputStr: string): Promise<number> {
    try {
      return ChatModelManager.chatModel?.getNumTokens(inputStr) ?? 0;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unknown model")) {
        logInfo("Using estimated token count due to tokenizer error");
        return this.estimateTokens(inputStr);
      }
      throw error;
    }
  }

  private validateCurrentModel(): void {
    if (!ChatModelManager.chatModel) return;

    const settings = getSettings();

    // If API key is missing, clear the current chat model
    if (!settings.apiKey) {
      ChatModelManager.chatModel = null;
      logInfo("Failed to reinitialize model due to missing API key");
    }
  }

  async ping(model: CustomModel): Promise<boolean> {
    const settings = getSettings();
    const tryPing = async () => {
      const modelInfo = getModelInfo(model.name);
      const resolvedTemperature = this.getTemperatureForModel(model.name, settings);

      // For thinking-enabled models, maxTokens must be greater than thinking budget
      const pingMaxTokens = modelInfo.isThinkingEnabled ? 4096 : 30;

      const testModel = new ChatOpenAI({
        modelName: model.name,
        apiKey: await getDecryptedKey(settings.apiKey),
        configuration: {
          baseURL: settings.apiBaseUrl,
          fetch: safeFetch,
          defaultHeaders: { "dangerously-allow-browser": "true" },
        },
        maxTokens: pingMaxTokens,
        temperature: resolvedTemperature,
      });

      await testModel.invoke([{ role: "user", content: "hello" }], {
        timeout: 8000,
      });
    };

    try {
      await tryPing();
      return true;
    } catch (error) {
      logError(error);
      throw error;
    }
  }

  findModelByName(modelName: string): CustomModel | undefined {
    const settings = getSettings();
    return settings.chatModels.find((model) => model.name === modelName);
  }
}
