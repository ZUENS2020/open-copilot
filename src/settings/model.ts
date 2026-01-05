import { CustomModel, ProjectConfig } from "@/aiParams";
import { atom, createStore, useAtomValue } from "jotai";
import { v4 as uuidv4 } from "uuid";
import { UserMemoryManager } from "@/memory/UserMemoryManager";

import { type ChainType } from "@/chainFactory";
import {
  COPILOT_FOLDER_ROOT,
  DEFAULT_OPEN_AREA,
  DEFAULT_QA_EXCLUSIONS_SETTING,
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_PROMPT,
  SEND_SHORTCUT,
} from "@/constants";
import { logInfo } from "@/logger";

/**
 * We used to store commands in the settings file with the following interface.
 * It has been migrated to CustomCommand. This interface is needed to migrate
 * the legacy commands to the new format.
 */
export interface LegacyCommandSettings {
  /**
   * The name of the command. The name will be turned into id by replacing
   * spaces with underscores.
   */
  name: string;

  /**
   * The model key of the command. If not provided, the current chat model will
   * be used.
   */
  modelKey?: string;

  /**
   * The prompt of the command.
   */
  prompt: string;

  /**
   * Whether to show the command in the context menu.
   */
  showInContextMenu: boolean;
}

export interface CopilotSettings {
  userId: string;

  // Unified API configuration
  apiBaseUrl: string;
  apiKey: string;

  // Model configuration
  chatModels: CustomModel[];
  embeddingModels: CustomModel[];
  defaultChatModelKey: string;
  defaultEmbeddingModelKey: string;

  // Chain configuration
  defaultChainType: ChainType;

  // Model parameters
  temperature: number;
  maxTokens: number;
  contextTurns: number;
  reasoningEffort: "minimal" | "low" | "medium" | "high";
  verbosity: "low" | "medium" | "high";

  // UI state
  lastDismissedVersion: string | null;
  userSystemPrompt: string;
  stream: boolean;

  // Saving conversations
  defaultSaveFolder: string;
  defaultConversationTag: string;
  autosaveChat: boolean;
  generateAIChatTitleOnSave: boolean;
  defaultConversationNoteName: string;

  // Context settings
  includeActiveNoteAsContext: boolean;
  customPromptsFolder: string;
  indexVaultToVectorStore: string;
  chatNoteContextPath: string;
  chatNoteContextTags: string[];
  enableIndexSync: boolean;

  // QA settings
  qaExclusions: string;
  qaInclusions: string;
  maxSourceChunks: number;
  enableInlineCitations: boolean;
  embeddingRequestsPerMin: number;
  embeddingBatchSize: number;
  disableIndexOnMobile: boolean;

  // Search settings
  enableSemanticSearchV3: boolean;
  enableLexicalBoosts: boolean;
  lexicalSearchRamLimit: number;

  // UI settings
  debug: boolean;
  enableEncryption: boolean;
  defaultOpenArea: DEFAULT_OPEN_AREA;
  defaultSendShortcut: SEND_SHORTCUT;
  showSuggestedPrompts: boolean;
  showRelevantNotes: boolean;
  passMarkdownImages: boolean;
  autoIncludeTextSelection: boolean;

  // Command settings
  promptUsageTimestamps: Record<string, number>;
  promptSortStrategy: string;
  numPartitions: number;
  suggestedDefaultCommands: boolean;

  // Project settings
  projectList: Array<ProjectConfig>;
  memoryFolderName: string;
  enableRecentConversations: boolean;
  maxRecentConversations: number;
  enableSavedMemory: boolean;

  // Agent settings
  enableAutonomousAgent: boolean;
  enableCustomPromptTemplating: boolean;
  autonomousAgentMaxIterations: number;
  autonomousAgentEnabledToolIds: string[];

  // Quick command settings
  quickCommandModelKey: string | undefined;
  quickCommandIncludeNoteContext: boolean;
}

export const settingsStore = createStore();
export const settingsAtom = atom<CopilotSettings>(DEFAULT_SETTINGS);

/**
 * Sets the settings in the atom.
 */
export function setSettings(settings: Partial<CopilotSettings>) {
  const newSettings = { ...getSettings(), ...settings };
  settingsStore.set(settingsAtom, newSettings);
}

/**
 * Normalize QA exclusion patterns and guarantee the Copilot folder root is excluded.
 * @param rawValue - Persisted QA exclusion setting value.
 * @returns Encoded QA exclusion patterns string.
 */
export function sanitizeQaExclusions(rawValue: unknown): string {
  const rawValueString = typeof rawValue === "string" ? rawValue : DEFAULT_QA_EXCLUSIONS_SETTING;

  const decodedPatterns: string[] = rawValueString
    .split(",")
    .map((pattern: string) => decodeURIComponent(pattern.trim()))
    .filter((pattern: string) => pattern.length > 0);

  const canonicalToOriginalPattern = new Map<string, string>();

  decodedPatterns.forEach((pattern) => {
    const canonical = pattern.replace(/\/+$/, "");
    const canonicalKey = canonical.length > 0 ? canonical : pattern;
    if (canonicalKey === COPILOT_FOLDER_ROOT) {
      canonicalToOriginalPattern.set(COPILOT_FOLDER_ROOT, COPILOT_FOLDER_ROOT);
      return;
    }
    if (!canonicalToOriginalPattern.has(canonicalKey)) {
      const normalizedValue =
        canonical.length > 0 && pattern.endsWith("/") ? `${canonical}/` : pattern;
      canonicalToOriginalPattern.set(canonicalKey, normalizedValue);
    }
  });

  canonicalToOriginalPattern.set(COPILOT_FOLDER_ROOT, COPILOT_FOLDER_ROOT);

  return Array.from(canonicalToOriginalPattern.values())
    .map((pattern) => encodeURIComponent(pattern))
    .join(",");
}

/**
 * Sets a single setting in the atom.
 */
export function updateSetting<K extends keyof CopilotSettings>(key: K, value: CopilotSettings[K]) {
  const settings = getSettings();
  setSettings({ ...settings, [key]: value });
}

/**
 * Gets the settings from the atom. Use this if you don't need to subscribe to
 * changes.
 */
export function getSettings(): Readonly<CopilotSettings> {
  return settingsStore.get(settingsAtom);
}

/**
 * Resets the settings to the default values.
 */
export function resetSettings(): void {
  const defaultSettingsWithBuiltIns = {
    ...DEFAULT_SETTINGS,
    chatModels: DEFAULT_SETTINGS.chatModels.map((model: unknown) => ({ ...model, enabled: true })),
    embeddingModels: DEFAULT_SETTINGS.embeddingModels.map((model: unknown) => ({
      ...model,
      enabled: true,
    })),
  };
  setSettings(defaultSettingsWithBuiltIns);
}

/**
 * Subscribes to changes in the settings atom.
 */
export function subscribeToSettingsChange(
  callback: (prev: CopilotSettings, next: CopilotSettings) => void
): () => void {
  let previousValue = getSettings();

  return settingsStore.sub(settingsAtom, () => {
    const currentValue = getSettings();
    callback(previousValue, currentValue);
    previousValue = currentValue;
  });
}

/**
 * Hook to get the settings value from the atom.
 */
export function useSettingsValue(): Readonly<CopilotSettings> {
  return useAtomValue(settingsAtom, {
    store: settingsStore,
  });
}

/**
 * Migration function to convert old settings format to new format
 */
function migrateSettings(settings: unknown): CopilotSettings {
  const migrated: CopilotSettings = { ...settings };

  // Migrate API configuration
  if (!migrated.apiBaseUrl) {
    migrated.apiBaseUrl =
      settings.openAIProxyBaseUrl || settings.apiBaseUrl || "https://api.openai.com/v1";
  }
  if (!migrated.apiKey) {
    migrated.apiKey = settings.customApiApiKey || settings.apiKey || "";
  }

  // Migrate activeModels to chatModels
  if (settings.activeModels && !settings.chatModels) {
    migrated.chatModels = settings.activeModels
      .filter((m: unknown) => !m.isEmbeddingModel)
      .map((m: unknown) => ({
        id: m.id || `${m.name}|${m.provider}`,
        name: m.name,
        type: "chat" as const,
        enabled: m.enabled ?? true,
        capabilities: m.capabilities || [],
      }));
  }

  // Initialize chatModels if it doesn't exist
  if (!migrated.chatModels) {
    migrated.chatModels = [];
  }

  // Migrate activeEmbeddingModels to embeddingModels
  if (settings.activeEmbeddingModels && !settings.embeddingModels) {
    migrated.embeddingModels = settings.activeEmbeddingModels.map((m: unknown) => ({
      id: m.id || `${m.name}|${m.provider}`,
      name: m.name,
      type: "embedding" as const,
      enabled: m.enabled ?? true,
    }));
  }

  // Initialize embeddingModels if it doesn't exist
  if (!migrated.embeddingModels) {
    migrated.embeddingModels = [];
  }

  // Migrate defaultModelKey to defaultChatModelKey
  if (settings.defaultModelKey && !settings.defaultChatModelKey) {
    migrated.defaultChatModelKey = settings.defaultModelKey;
  }

  // Migrate embeddingModelKey to defaultEmbeddingModelKey
  if (settings.embeddingModelKey && !settings.defaultEmbeddingModelKey) {
    migrated.defaultEmbeddingModelKey = settings.embeddingModelKey;
  }

  return migrated;
}

/**
 * Sanitizes the settings to ensure they are valid.
 * Note: This will be better handled by Zod in the future.
 */
export function sanitizeSettings(settings: CopilotSettings): CopilotSettings {
  // If settings is null/undefined, use DEFAULT_SETTINGS
  const settingsToSanitize = settings || DEFAULT_SETTINGS;

  // First, run migration if needed
  const migratedSettings = migrateSettings(settingsToSanitize);

  if (!migratedSettings.userId) {
    migratedSettings.userId = uuidv4();
  }

  const sanitizedSettings: CopilotSettings = { ...migratedSettings };

  // Stuff in settings are string even when the interface has number type!
  const temperature = Number(settingsToSanitize.temperature);
  sanitizedSettings.temperature = isNaN(temperature) ? DEFAULT_SETTINGS.temperature : temperature;

  const maxTokens = Number(settingsToSanitize.maxTokens);
  sanitizedSettings.maxTokens = isNaN(maxTokens) ? DEFAULT_SETTINGS.maxTokens : maxTokens;

  const contextTurns = Number(settingsToSanitize.contextTurns);
  sanitizedSettings.contextTurns = isNaN(contextTurns)
    ? DEFAULT_SETTINGS.contextTurns
    : contextTurns;

  const embeddingRequestsPerMin = Number(settingsToSanitize.embeddingRequestsPerMin);
  sanitizedSettings.embeddingRequestsPerMin = isNaN(embeddingRequestsPerMin)
    ? DEFAULT_SETTINGS.embeddingRequestsPerMin
    : embeddingRequestsPerMin;

  const embeddingBatchSize = Number(settingsToSanitize.embeddingBatchSize);
  sanitizedSettings.embeddingBatchSize = isNaN(embeddingBatchSize)
    ? DEFAULT_SETTINGS.embeddingBatchSize
    : embeddingBatchSize;

  // Sanitize lexicalSearchRamLimit (20-1000 MB range)
  const lexicalSearchRamLimit = Number(settingsToSanitize.lexicalSearchRamLimit);
  if (isNaN(lexicalSearchRamLimit)) {
    sanitizedSettings.lexicalSearchRamLimit = DEFAULT_SETTINGS.lexicalSearchRamLimit;
  } else {
    // Clamp to valid range
    sanitizedSettings.lexicalSearchRamLimit = Math.min(1000, Math.max(20, lexicalSearchRamLimit));
  }

  // Ensure includeActiveNoteAsContext has a default value
  if (typeof sanitizedSettings.includeActiveNoteAsContext !== "boolean") {
    sanitizedSettings.includeActiveNoteAsContext = DEFAULT_SETTINGS.includeActiveNoteAsContext;
  }

  // Ensure generateAIChatTitleOnSave has a default value
  if (typeof sanitizedSettings.generateAIChatTitleOnSave !== "boolean") {
    sanitizedSettings.generateAIChatTitleOnSave = DEFAULT_SETTINGS.generateAIChatTitleOnSave;
  }

  // Ensure passMarkdownImages has a default value
  if (typeof sanitizedSettings.passMarkdownImages !== "boolean") {
    sanitizedSettings.passMarkdownImages = DEFAULT_SETTINGS.passMarkdownImages;
  }

  // Ensure enableInlineCitations has a default value
  if (typeof sanitizedSettings.enableInlineCitations !== "boolean") {
    sanitizedSettings.enableInlineCitations = DEFAULT_SETTINGS.enableInlineCitations;
  }

  // Ensure enableCustomPromptTemplating has a default value
  if (typeof sanitizedSettings.enableCustomPromptTemplating !== "boolean") {
    sanitizedSettings.enableCustomPromptTemplating = DEFAULT_SETTINGS.enableCustomPromptTemplating;
  }

  // Ensure autonomousAgentMaxIterations has a valid value
  const autonomousAgentMaxIterations = Number(settingsToSanitize.autonomousAgentMaxIterations);
  if (
    isNaN(autonomousAgentMaxIterations) ||
    autonomousAgentMaxIterations < 4 ||
    autonomousAgentMaxIterations > 8
  ) {
    sanitizedSettings.autonomousAgentMaxIterations = DEFAULT_SETTINGS.autonomousAgentMaxIterations;
  } else {
    sanitizedSettings.autonomousAgentMaxIterations = autonomousAgentMaxIterations;
  }

  // Ensure autonomousAgentEnabledToolIds is an array
  if (!Array.isArray(sanitizedSettings.autonomousAgentEnabledToolIds)) {
    sanitizedSettings.autonomousAgentEnabledToolIds =
      DEFAULT_SETTINGS.autonomousAgentEnabledToolIds;
  }

  // Ensure memoryFolderName has a default value
  if (
    !sanitizedSettings.memoryFolderName ||
    typeof sanitizedSettings.memoryFolderName !== "string"
  ) {
    sanitizedSettings.memoryFolderName = DEFAULT_SETTINGS.memoryFolderName;
  }

  // Ensure enableRecentConversations has a default value
  if (typeof sanitizedSettings.enableRecentConversations !== "boolean") {
    sanitizedSettings.enableRecentConversations = DEFAULT_SETTINGS.enableRecentConversations;
  }

  // Ensure enableSavedMemory has a default value
  if (typeof sanitizedSettings.enableSavedMemory !== "boolean") {
    sanitizedSettings.enableSavedMemory = DEFAULT_SETTINGS.enableSavedMemory;
  }

  // Ensure maxRecentConversations has a valid value (10-50 range)
  const maxRecentConversations = Number(settingsToSanitize.maxRecentConversations);
  if (isNaN(maxRecentConversations) || maxRecentConversations < 10 || maxRecentConversations > 50) {
    sanitizedSettings.maxRecentConversations = DEFAULT_SETTINGS.maxRecentConversations;
  } else {
    sanitizedSettings.maxRecentConversations = maxRecentConversations;
  }

  // Ensure autosaveChat has a default value
  if (typeof sanitizedSettings.autosaveChat !== "boolean") {
    sanitizedSettings.autosaveChat = DEFAULT_SETTINGS.autosaveChat;
  }

  // Ensure quickCommandIncludeNoteContext has a default value
  if (typeof sanitizedSettings.quickCommandIncludeNoteContext !== "boolean") {
    sanitizedSettings.quickCommandIncludeNoteContext =
      DEFAULT_SETTINGS.quickCommandIncludeNoteContext;
  }

  // Ensure quickCommandModelKey is either undefined or a string
  if (
    settingsToSanitize.quickCommandModelKey !== undefined &&
    typeof settingsToSanitize.quickCommandModelKey !== "string"
  ) {
    sanitizedSettings.quickCommandModelKey = DEFAULT_SETTINGS.quickCommandModelKey;
  }

  // Ensure autoIncludeTextSelection has a default value
  if (typeof sanitizedSettings.autoIncludeTextSelection !== "boolean") {
    sanitizedSettings.autoIncludeTextSelection = DEFAULT_SETTINGS.autoIncludeTextSelection;
  }

  // Ensure defaultSendShortcut has a valid value
  if (!Object.values(SEND_SHORTCUT).includes(sanitizedSettings.defaultSendShortcut)) {
    sanitizedSettings.defaultSendShortcut = DEFAULT_SETTINGS.defaultSendShortcut;
  }

  // Ensure folder settings fall back to defaults when empty/whitespace
  const saveFolder = (settingsToSanitize.defaultSaveFolder || "").trim();
  sanitizedSettings.defaultSaveFolder =
    saveFolder.length > 0 ? saveFolder : DEFAULT_SETTINGS.defaultSaveFolder;

  const promptsFolder = (settingsToSanitize.customPromptsFolder || "").trim();
  sanitizedSettings.customPromptsFolder =
    promptsFolder.length > 0 ? promptsFolder : DEFAULT_SETTINGS.customPromptsFolder;

  sanitizedSettings.qaExclusions = sanitizeQaExclusions(settingsToSanitize.qaExclusions);

  return sanitizedSettings;
}

export function getSystemPrompt(): string {
  const userPrompt = getSettings().userSystemPrompt;
  const basePrompt = DEFAULT_SYSTEM_PROMPT;

  if (userPrompt) {
    return `${basePrompt}
<user_custom_instructions>
${userPrompt}
</user_custom_instructions>`;
  }
  return basePrompt;
}

export async function getSystemPromptWithMemory(
  userMemoryManager: UserMemoryManager | undefined
): Promise<string> {
  const systemPrompt = getSystemPrompt();

  if (!userMemoryManager) {
    logInfo("No UserMemoryManager provided to getSystemPromptWithMemory");
    return systemPrompt;
  }
  const memoryPrompt = await userMemoryManager.getUserMemoryPrompt();

  // Only include user_memory section if there's actual memory content
  if (!memoryPrompt) {
    return systemPrompt;
  }

  return `${memoryPrompt}\n${systemPrompt}`;
}

/**
 * Get a unique model key from a CustomModel instance
 * In the new structure, this is just the model's ID
 */
export function getModelKeyFromModel(model: CustomModel): string {
  return model.id;
}
