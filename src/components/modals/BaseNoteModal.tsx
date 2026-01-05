import { App, FuzzySuggestModal, TAbstractFile, TFile } from "obsidian";
import { isAllowedFileForChainContext } from "@/utils";
import { ChainType } from "@/chainFactory";

export abstract class BaseNoteModal<T> extends FuzzySuggestModal<T> {
  protected activeNote: TFile | null;
  protected availableNotes: T[];
  protected chainType: ChainType;

  constructor(app: App, chainType: ChainType = ChainType.LLM_CHAIN) {
    super(app);
    this.activeNote = app.workspace.getActiveFile();
    this.chainType = chainType;
  }

  protected getOrderedNotes(excludeNotePaths: string[] = []): TFile[] {
    // Get recently opened files first
    const recentFiles = this.app.workspace
      .getLastOpenFiles()
      .map((filePath: string) => this.app.vault.getAbstractFileByPath(filePath))
      .filter(
        (file: TAbstractFile | null): file is TFile =>
          file instanceof TFile &&
          isAllowedFileForChainContext(file, this.chainType) &&
          !excludeNotePaths.includes(file.path) &&
          file.path !== this.activeNote?.path
      );

    // Get all other files that weren't recently opened
    const allFiles = this.app.vault
      .getFiles()
      .filter((file: TFile) => isAllowedFileForChainContext(file, this.chainType));

    const otherFiles = allFiles.filter(
      (file: TFile) =>
        !recentFiles.some((recent: TFile) => recent.path === file.path) &&
        !excludeNotePaths.includes(file.path) &&
        file.path !== this.activeNote?.path
    );

    // Combine active note (if exists and is allowed type) with recent files and other files
    const activeNoteArray =
      this.activeNote && isAllowedFileForChainContext(this.activeNote, this.chainType)
        ? [this.activeNote]
        : [];
    return [...activeNoteArray, ...recentFiles, ...otherFiles];
  }

  protected formatNoteTitle(basename: string, isActive: boolean, extension?: string): string {
    let title = basename;
    if (isActive) {
      title += " (current)";
    }
    if (extension === "pdf") {
      title += " (PDF)";
    } else if (extension === "canvas") {
      title += " (Canvas)";
    }
    return title;
  }
}
