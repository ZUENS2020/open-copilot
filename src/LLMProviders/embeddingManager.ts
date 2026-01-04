import { CustomModel } from "@/aiParams";
import { getDecryptedKey } from "@/encryptionService";
import { CustomError } from "@/error";
import { getSettings, subscribeToSettingsChange } from "@/settings/model";
import { safeFetch } from "@/utils";
import { Embeddings } from "@langchain/core/embeddings";
import { OpenAIEmbeddings } from "@langchain/openai";

type EmbeddingConstructorType = new (config: any) => Embeddings;

export default class EmbeddingManager {
  private embeddingModels: CustomModel[];
  private static instance: EmbeddingManager;
  private static embeddingModel: Embeddings;
  private static modelMap: Record<
    string,
    {
      hasApiKey: boolean;
      EmbeddingConstructor: EmbeddingConstructorType;
    }
  >;

  private constructor() {
    this.initialize();
    subscribeToSettingsChange(() => this.initialize());
  }

  private initialize() {
    const embeddingModels = getSettings().embeddingModels;
    this.embeddingModels = embeddingModels;
    this.buildModelMap(embeddingModels);
  }

  static getInstance(): EmbeddingManager {
    if (!EmbeddingManager.instance) {
      EmbeddingManager.instance = new EmbeddingManager();
    }
    return EmbeddingManager.instance;
  }

  /**
   * Find a model by its ID
   */
  private findModelById(modelId: string): CustomModel | undefined {
    return this.embeddingModels.find((model) => model.id === modelId);
  }

  // Build a map of modelId to model config
  private buildModelMap(embeddingModels: CustomModel[]) {
    EmbeddingManager.modelMap = {};
    const modelMap = EmbeddingManager.modelMap;

    embeddingModels.forEach((model) => {
      if (model.enabled && model.type === "embedding") {
        const hasCredentials = Boolean(getSettings().apiKey);
        modelMap[model.id] = {
          hasApiKey: hasCredentials,
          EmbeddingConstructor: OpenAIEmbeddings,
        };
      }
    });
  }

  static getModelName(embeddingsInstance: Embeddings): string {
    const emb = embeddingsInstance as any;
    if ("model" in emb && emb.model) {
      return emb.model as string;
    } else if ("modelName" in emb && emb.modelName) {
      return emb.modelName as string;
    } else {
      throw new Error(
        `Embeddings instance missing model or modelName properties: ${embeddingsInstance}`
      );
    }
  }

  async getEmbeddingsAPI(): Promise<Embeddings> {
    const settings = getSettings();
    const { defaultEmbeddingModelKey } = settings;

    // Find the default embedding model
    let customModel = this.findModelById(defaultEmbeddingModelKey);

    // Fallback to first enabled embedding model
    if (!customModel) {
      customModel = this.embeddingModels.find(
        (model) => model.enabled && model.type === "embedding"
      );
    }

    if (!customModel) {
      throw new CustomError(
        "No embedding model available. Please add an embedding model in Models settings."
      );
    }

    const modelKey = customModel.id;
    if (!EmbeddingManager.modelMap.hasOwnProperty(modelKey)) {
      throw new CustomError(`No embedding model found for: ${modelKey}`);
    }

    const selectedModel = EmbeddingManager.modelMap[modelKey];
    if (!selectedModel.hasApiKey) {
      throw new CustomError(
        "API key is not configured. Please set your API key in Basic Settings."
      );
    }

    const config = await this.getEmbeddingConfig(customModel);

    try {
      EmbeddingManager.embeddingModel = new selectedModel.EmbeddingConstructor(config);
      return EmbeddingManager.embeddingModel;
    } catch (error) {
      throw new CustomError(
        `Error creating embedding model: ${customModel.name}. ${error.message}`
      );
    }
  }

  private async getEmbeddingConfig(customModel: CustomModel): Promise<any> {
    const settings = getSettings();
    const modelName = customModel.name;

    // Unified API configuration - all embedding models use OpenAIEmbeddings with global API settings
    return {
      modelName,
      apiKey: await getDecryptedKey(settings.apiKey),
      timeout: 10000,
      batchSize: settings.embeddingBatchSize,
      configuration: {
        baseURL: settings.apiBaseUrl,
        fetch: safeFetch,
        dangerouslyAllowBrowser: true,
      },
    };
  }

  async ping(model: CustomModel): Promise<boolean> {
    const settings = getSettings();
    const config = await this.getEmbeddingConfig(model);
    const testModel = new OpenAIEmbeddings(config);
    await testModel.embedQuery("test");
    return true;
  }
}
