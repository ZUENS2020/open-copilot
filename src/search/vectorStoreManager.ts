// DEPRECATED: v3 semantic indexing uses MemoryIndexManager (JSONL snapshots). This file remains only
// for legacy Orama-based flows and should not be referenced by new code.
import { CustomError } from "@/error";
import EmbeddingsManager from "@/LLMProviders/embeddingManager";
import { logError, logInfo } from "@/logger";
import { CopilotSettings, getSettings, subscribeToSettingsChange } from "@/settings/model";
import { Orama } from "@orama/orama";
import { Notice, Platform, TFile } from "obsidian";
import { DBOperations } from "./dbOperations";
import { IndexEventHandler } from "./indexEventHandler";
import { IndexOperations } from "./indexOperations";

export default class VectorStoreManager {
  private static instance: VectorStoreManager;
  private indexOps: IndexOperations;
  private eventHandler: IndexEventHandler;
  private initializationPromise: Promise<void>;
  private initializationError: Error | null = null;
  private lastKnownSettings: CopilotSettings | undefined;
  private embeddingsManager: EmbeddingsManager;
  private dbOps: DBOperations;

  private constructor() {
    this.embeddingsManager = EmbeddingsManager.getInstance();
    this.dbOps = new DBOperations(app);
    this.indexOps = new IndexOperations(app, this.dbOps, this.embeddingsManager);
    this.eventHandler = new IndexEventHandler(app, this.indexOps, this.dbOps);

    this.initializationPromise = this.initialize();
    this.setupSettingsSubscription();
  }

  static getInstance(): VectorStoreManager {
    if (!VectorStoreManager.instance) {
      VectorStoreManager.instance = new VectorStoreManager();
    }
    return VectorStoreManager.instance;
  }

  private setupSettingsSubscription() {
    // Initialize lastKnownSettings
    this.lastKnownSettings = { ...getSettings() };

    const reinitialize = async () => {
      const settings = getSettings();
      const prevSettings = this.lastKnownSettings;
      this.lastKnownSettings = { ...settings };

      // Handle path changes (enableIndexSync)
      if (settings.enableIndexSync !== prevSettings?.enableIndexSync) {
        const newPath = await this.dbOps.getDbPath();
        const oldPath = this.dbOps.getCurrentDbPath();

        if (oldPath !== newPath) {
          await this.dbOps.initializeDB(await this.embeddingsManager.getEmbeddingsAPI());
        }
      }
    };

    subscribeToSettingsChange(() => {
      this.initializationPromise = reinitialize();
    });
  }

  private async initialize(): Promise<void> {
    // Do not initialize or show notices if semantic search is disabled
    const settings = getSettings();
    if (!settings.enableSemanticSearchV3) {
      logInfo("VectorStoreManager: Semantic search V3 is disabled, skipping initialization.");
      return;
    }
    logInfo("VectorStoreManager: Initializing...");
    try {
      let retries = 3;
      while (retries > 0) {
        try {
          logInfo(`VectorStoreManager: Attempting initialization (retries left: ${retries})`);
          const embeddingAPI = await this.embeddingsManager.getEmbeddingsAPI();
          const db = await this.dbOps.initializeDB(embeddingAPI);
          if (!db) {
            throw new Error(
              "Database initialization failed (DBOperations returned undefined). Check console for 'Error initializing semantic index database'."
            );
          }
          this.initializationError = null;
          logInfo("VectorStoreManager: Initialization successful.");
          break;
        } catch (error) {
          logError(`VectorStoreManager: Initialization attempt failed:`, error);
          if (
            error instanceof CustomError &&
            error.message.includes("Vault adapter not available")
          ) {
            retries--;
            if (retries > 0) {
              logInfo("VectorStoreManager: Vault adapter not available, retrying...");
              await new Promise((resolve) => setTimeout(resolve, 100));
              continue;
            }
          }
          this.initializationError = error instanceof Error ? error : new Error(String(error));
          new Notice(
            "Failed to initialize vector store. Please make sure you have a valid API key " +
              "for your embedding model and restart the plugin."
          );
          logError("Failed to initialize vector store (final error):", error);
          break;
        }
      }
    } catch (error) {
      this.initializationError = error instanceof Error ? error : new Error(String(error));
      logError("Failed to initialize vector store (unexpected error):", error);
    }
  }

  private async waitForInitialization(): Promise<void> {
    await this.initializationPromise;
  }

  public async indexVaultToVectorStore(overwrite?: boolean): Promise<number> {
    await this.waitForInitialization();
    if (Platform.isMobile && getSettings().disableIndexOnMobile) {
      new Notice("Indexing is disabled on mobile devices");
      return 0;
    }
    return this.indexOps.indexVaultToVectorStore(overwrite);
  }

  public async clearIndex(): Promise<void> {
    await this.waitForInitialization();
    await this.dbOps.clearIndex(await this.embeddingsManager.getEmbeddingsAPI());
  }

  public async garbageCollectVectorStore(): Promise<number> {
    await this.waitForInitialization();
    return this.dbOps.garbageCollect();
  }

  public async getIndexedFiles(): Promise<string[]> {
    await this.waitForInitialization();
    return this.dbOps.getIndexedFiles();
  }

  public async isIndexEmpty(): Promise<boolean> {
    await this.waitForInitialization();
    return await this.dbOps.isIndexEmpty();
  }

  public async hasIndex(notePath: string): Promise<boolean> {
    await this.waitForInitialization();
    return this.dbOps.hasIndex(notePath);
  }

  public onunload(): void {
    this.eventHandler.cleanup();
    this.dbOps.onunload();
  }

  public async getDbOps(): Promise<DBOperations> {
    await this.waitForInitialization();
    return this.dbOps;
  }

  public async getDb(): Promise<Orama<any>> {
    await this.waitForInitialization();

    if (!getSettings().enableSemanticSearchV3) {
      throw new Error("Semantic Search V3 is disabled in settings.");
    }

    const db = this.dbOps.getDb();
    if (!db) {
      if (this.initializationError) {
        throw new Error(
          `Database failed to load: ${this.initializationError.message}. Please check your embedding settings and restart the plugin.`
        );
      }
      // If we are here, initialization likely succeeded but db is missing (e.g. mobile disabled, or cleared)
      // Try one last attempt to initialize if it's not explicitly disabled
      if (!Platform.isMobile || !getSettings().disableIndexOnMobile) {
        logInfo("VectorStoreManager: Database missing but should be present. Attempting lazy initialization...");
        try {
          const embeddingAPI = await this.embeddingsManager.getEmbeddingsAPI();
          const newDb = await this.dbOps.initializeDB(embeddingAPI);
          if (newDb) return newDb;
        } catch (err) {
          logError("VectorStoreManager: Lazy initialization failed:", err);
        }
      }

      throw new Error("Database is not loaded. Please restart the plugin.");
    }
    return db;
  }

  public async reindexFile(file: TFile): Promise<void> {
    await this.waitForInitialization();
    await this.indexOps.reindexFile(file);
  }
}
