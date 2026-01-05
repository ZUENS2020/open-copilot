// src/components/SourcesModal.tsx
import { App, Modal } from "obsidian";

export class SourcesModal extends Modal {
  sources: { title: string; path: string; score: number; explanation?: unknown }[];

  constructor(
    app: App,
    sources: { title: string; path: string; score: number; explanation?: unknown }[]
  ) {
    super(app);
    this.sources = sources;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Sources" });

    // Display all sources sorted by score (already sorted from chain)
    this.createSourceList(contentEl, this.sources);
  }

  private createSourceList(
    container: HTMLElement,
    sources: { title: string; path: string; score: number; explanation?: unknown }[]
  ) {
    const list = container.createEl("ul", { cls: "copilot-sources-list" });

    sources.forEach((source) => {
      const item = list.createEl("li", { cls: "copilot-sources-item" });

      // Create collapsible container
      const itemContainer = item.createDiv({ cls: "copilot-sources-item-container" });

      // Add expand/collapse indicator
      const expandIndicator = itemContainer.createSpan({ cls: "copilot-sources-expand-indicator" });
      expandIndicator.textContent = source.explanation ? "▶" : "";

      // Display title, but show path in parentheses if there are duplicates
      const displayText =
        source.path && source.path !== source.title
          ? `${source.title} (${source.path})`
          : source.title;

      const link = itemContainer.createEl("a", {
        href: `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(source.path || source.title)}`,
        text: displayText,
      });
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Use the path if available, otherwise fall back to title
        this.app.workspace.openLinkText(source.path || source.title, "");
      });

      // Display with 4 decimals to match SearchCore logs and avoid apparent ties
      if (typeof source.score === "number") {
        itemContainer.appendChild(
          document.createTextNode(` - Relevance score: ${source.score.toFixed(4)}`)
        );
      }

      // Add explanation if available (initially hidden)
      let explanationDiv: HTMLElement | null = null;
      if (source.explanation) {
        explanationDiv = this.addExplanation(item, source.explanation);
        explanationDiv.addClass("copilot-sources-explanation-collapsed");

        // Toggle expansion on click
        itemContainer.addEventListener("click", (e) => {
          if (e.target === link) return; // Don't toggle when clicking the link

          if (explanationDiv) {
            const isExpanded = !explanationDiv.hasClass("copilot-sources-explanation-collapsed");
            if (isExpanded) {
              explanationDiv.addClass("copilot-sources-explanation-collapsed");
              explanationDiv.removeClass("copilot-sources-explanation-expanded");
              expandIndicator.removeClass("copilot-sources-expand-indicator-expanded");
            } else {
              explanationDiv.removeClass("copilot-sources-explanation-collapsed");
              explanationDiv.addClass("copilot-sources-explanation-expanded");
              expandIndicator.addClass("copilot-sources-expand-indicator-expanded");
            }
          }
        });
      }
    });
  }

  private addExplanation(container: HTMLElement, explanation: unknown): HTMLElement {
    const explanationDiv = container.createDiv({
      cls: "search-explanation copilot-sources-explanation",
    });

    const details: string[] = [];

    // Add lexical matches
    if (explanation.lexicalMatches && explanation.lexicalMatches.length > 0) {
      const fields = new Set(explanation.lexicalMatches.map((m: unknown) => m.field));
      const queries = new Set(explanation.lexicalMatches.map((m: unknown) => m.query));
      details.push(
        `Lexical: matched "${Array.from(queries).join('", "')}" in ${Array.from(fields).join(", ")}`
      );
    }

    // Add semantic score
    if (explanation.semanticScore !== undefined && explanation.semanticScore > 0) {
      details.push(`Semantic: ${(explanation.semanticScore * 100).toFixed(1)}% similarity`);
    }

    // Add folder boost
    if (explanation.folderBoost) {
      details.push(
        `Folder boost: ${explanation.folderBoost.boostFactor.toFixed(2)}x (${explanation.folderBoost.documentCount} docs in ${explanation.folderBoost.folder || "root"})`
      );
    }

    // Add graph connections (new query-aware boost)
    if (explanation.graphConnections) {
      const gc = explanation.graphConnections;
      const connectionParts = [];
      if (gc.backlinks > 0) connectionParts.push(`${gc.backlinks} backlinks`);
      if (gc.coCitations > 0) connectionParts.push(`${gc.coCitations} co-citations`);
      if (gc.sharedTags > 0) connectionParts.push(`${gc.sharedTags} shared tags`);

      if (connectionParts.length > 0) {
        details.push(
          `Graph connections: ${gc.score.toFixed(1)} score (${connectionParts.join(", ")})`
        );
      }
    }

    // Add old graph boost (if still present for backwards compatibility)
    if (explanation.graphBoost && !explanation.graphConnections) {
      details.push(
        `Graph boost: ${explanation.graphBoost.boostFactor.toFixed(2)}x (${explanation.graphBoost.connections} connections)`
      );
    }

    // Add base vs final score if boosted
    if (explanation.baseScore !== explanation.finalScore) {
      details.push(
        `Score: ${explanation.baseScore.toFixed(4)} → ${explanation.finalScore.toFixed(4)}`
      );
    }

    // Create explanation text without "Why this ranked here:" header
    if (details.length > 0) {
      details.forEach((detail) => {
        const detailDiv = explanationDiv.createEl("div", {
          cls: "copilot-sources-explanation-detail",
        });
        detailDiv.textContent = `• ${detail}`;
      });
    }

    return explanationDiv;
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
