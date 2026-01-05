/**
 * Derive a user-facing label from a readNote tool path.
 *
 * @param rawNotePath - Original note path supplied to the readNote tool.
 * @returns Sanitized display name without directories, extensions, or wiki syntax.
 */
export function deriveReadNoteDisplayName(rawNotePath: string): string {
  const trimmed = rawNotePath.trim();
  if (!trimmed) {
    return "note";
  }

  const wikiMatch = trimmed.match(/^\[\[([\s\S]+?)\]\]$/);
  const withoutWiki = wikiMatch ? wikiMatch[1] : trimmed;

  const [targetPartRaw = "", aliasPartRaw = ""] = withoutWiki.split("|");
  const aliasPart = aliasPartRaw.trim();
  if (aliasPart.length > 0) {
    return aliasPart;
  }

  const targetPart = targetPartRaw.trim();
  const [withoutSection] = targetPart.split("#");
  const coreTarget = (withoutSection || targetPart).trim() || trimmed;

  const segments = coreTarget.split("/").filter(Boolean);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : coreTarget;

  const withoutExtension = lastSegment.replace(/\.[^/.]+$/, "");
  return withoutExtension || lastSegment || "note";
}

const READ_NOTE_SUMMARY_MAX_LENGTH = 180;

function clampReadNoteMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= READ_NOTE_SUMMARY_MAX_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, READ_NOTE_SUMMARY_MAX_LENGTH)}…`;
}

function summarizeReadNotePayload(payload: Record<string, unknown>): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const status = typeof payload.status === "string" ? payload.status : null;
  const message =
    typeof payload.message === "string" && payload.message.trim().length > 0
      ? clampReadNoteMessage(payload.message)
      : null;
  const notePath = typeof payload.notePath === "string" ? payload.notePath : "";
  const noteTitle =
    typeof payload.noteTitle === "string" && payload.noteTitle.trim().length > 0
      ? payload.noteTitle.trim()
      : deriveReadNoteDisplayName(notePath);
  const displayName = noteTitle || deriveReadNoteDisplayName(notePath);

  if (status === "invalid_path") {
    return message ?? `⚠️ Invalid note path "${displayName}"`;
  }
  if (status === "not_found") {
    return message ?? `⚠️ Note "${displayName}" not found`;
  }
  if (status === "not_unique") {
    const candidateCount = Array.isArray(payload.candidates) ? payload.candidates.length : 0;
    if (message) {
      return message;
    }
    return candidateCount > 0
      ? `⚠️ Multiple matches for "${displayName}" (${candidateCount} candidates)`
      : `⚠️ Multiple matches for "${displayName}"`;
  }
  if (status === "empty") {
    return message ?? `⚠️ "${displayName}" contains no readable content`;
  }
  if (status === "out_of_range") {
    if (message) {
      return message;
    }
    const totalChunks =
      typeof payload.totalChunks === "number" && Number.isFinite(payload.totalChunks)
        ? payload.totalChunks
        : null;
    const requested =
      typeof payload.chunkIndex === "number" && Number.isFinite(payload.chunkIndex)
        ? payload.chunkIndex
        : null;
    if (requested !== null && totalChunks !== null) {
      const maxIndex = Math.max(totalChunks - 1, 0);
      return `⚠️ Chunk ${requested} exceeds available range (max index ${maxIndex})`;
    }
    return "⚠️ Requested chunk is out of range";
  }

  const chunkIndex =
    typeof payload.chunkIndex === "number" && Number.isFinite(payload.chunkIndex)
      ? payload.chunkIndex
      : 0;
  const totalChunks =
    typeof payload.totalChunks === "number" && Number.isFinite(payload.totalChunks)
      ? payload.totalChunks
      : null;
  const hasMore = Boolean(payload.hasMore);

  const parts: string[] = [`✅ Read "${displayName || "note"}"`];
  if (totalChunks && totalChunks > 0) {
    parts.push(`chunk ${chunkIndex + 1} of ${totalChunks}`);
  } else {
    parts.push(`chunk ${chunkIndex + 1}`);
  }
  if (hasMore) {
    parts.push("more available");
  }

  return parts.join(" · ");
}

/**
 * Format tool results for display in the UI
 * Each formatter should return a user-friendly representation of the tool result
 */
export class ToolResultFormatter {
  static format(toolName: string, result: string): string {
    try {
      // Decode tool marker encoding if present (ENC:...)
      let normalized = result;
      if (typeof normalized === "string" && normalized.startsWith("ENC:")) {
        try {
          normalized = decodeURIComponent(normalized.slice(4));
        } catch {
          // fall back to original
        }
      }

      // Try to parse as JSON for all tools now that they return JSON
      let parsedResult: unknown;
      try {
        parsedResult = JSON.parse(normalized);
      } catch {
        // If not JSON, use the raw string (for backward compatibility)
        parsedResult = normalized;
      }

      // Route to specific formatter based on tool name
      switch (toolName) {
        case "localSearch":
          return this.formatLocalSearch(parsedResult);
        case "webSearch":
          return this.formatWebSearch(parsedResult);
        case "youtubeTranscription":
          return this.formatYoutubeTranscription(parsedResult);
        case "writeToFile":
          return this.formatWriteToFile(parsedResult);
        case "replaceInFile":
          return this.formatReplaceInFile(parsedResult);
        case "readNote":
          return this.formatReadNote(parsedResult);
        default:
          // For all other tools, return the raw result
          return result;
      }
    } catch {
      // If formatting fails, return the original result
      return result;
    }
  }

  /**
   * Create a condensed summary for local search documents suitable for UI rendering.
   * @param documents Array of parsed local search documents
   * @returns Display-friendly summary string
   */
  static formatLocalSearchDocuments(documents: unknown[]): string {
    if (!Array.isArray(documents) || documents.length === 0) {
      return "📚 Found 0 relevant notes\n\nNo matching notes found.";
    }

    const total = documents.length;
    const topResults = documents.slice(0, 10);
    const hasScoringData = topResults.some(
      (item) =>
        typeof item?.rerank_score === "number" || typeof item?.score === "number" || item?.source
    );

    const formattedItems = topResults
      .map((item, index) =>
        hasScoringData
          ? this.formatSearchItem(item, index)
          : this.formatBasicSearchItem(item, index)
      )
      .join("\n\n");

    const footer = total > 10 ? `\n\n... and ${total - 10} more results` : "";

    return `📚 Found ${total} relevant notes\n\nTop results:\n\n${formattedItems}${footer}`;
  }

  private static formatLocalSearch(result: unknown): string {
    // Handle XML-wrapped results from chain runners
    if (typeof result === "string") {
      // Check if it's XML-wrapped content
      const xmlMatch = result.match(/<localSearch[^>]*>([\s\S]*)<\/localSearch>/);
      if (xmlMatch) {
        // Extract the content from XML wrapper
        const xmlContent = xmlMatch[1].trim();

        // Count documents in the XML
        const documentMatches = xmlContent.match(/<document>/g);
        const count = documentMatches ? documentMatches.length : 0;

        if (count === 0) {
          return "📚 Found 0 relevant notes\n\nNo matching notes found.";
        }

        // Robustly extract document information regardless of tag ordering
        const documents: Array<{ title: string; path: string; mtime: string | null }> = [];
        const blockRegex = /<document>([\s\S]*?)<\/document>/g;
        let blockMatch;
        while ((blockMatch = blockRegex.exec(xmlContent)) !== null) {
          const block = blockMatch[1];
          const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
          const pathMatch = block.match(/<path>([\s\S]*?)<\/path>/);
          const modifiedMatch = block.match(/<modified>([\s\S]*?)<\/modified>/);
          const title = (titleMatch?.[1] || "Untitled").trim();
          const path = (pathMatch?.[1] || "").trim();
          const mtime = (modifiedMatch?.[1] || "").trim();
          documents.push({ title, path, mtime: mtime || null });
        }
        return this.formatLocalSearchDocuments(documents);
      }
    }

    // Fall back to original JSON parsing logic
    const searchResults = this.parseSearchResults(result);

    if (!Array.isArray(searchResults)) {
      return typeof result === "string" ? result : JSON.stringify(result, null, 2);
    }
    if (searchResults.length === 0) {
      if (
        typeof result === "string" &&
        !result.includes("<localSearch") &&
        !result.includes('"type":"local_search"')
      ) {
        return result;
      }
      return "📚 Found 0 relevant notes\n\nNo matching notes found.";
    }
    return this.formatLocalSearchDocuments(searchResults);
  }

  private static parseSearchResults(result: unknown): unknown[] {
    // Only support the new structured format or pre-formatted XML flow
    if (typeof result === "object" && result !== null) {
      const typedResult = result as Record<string, unknown>;
      if (typedResult.type === "local_search" && Array.isArray(typedResult.documents)) {
        return typedResult.documents as unknown[];
      }
      return [];
    }
    if (typeof result === "string") {
      // Allow parsing of structured JSON string
      try {
        const parsed = JSON.parse(result);
        if (parsed && parsed.type === "local_search" && Array.isArray(parsed.documents)) {
          return parsed.documents;
        }
      } catch {
        // ignore JSON parse errors; fall through to empty array
      }
      return [];
    }
    return [];
  }

  private static formatSearchItem(item: Record<string, unknown>, index: number): string {
    const filename =
      (typeof item.path === "string"
        ? item.path.split("/").pop()?.replace(/\.md$/, "")
        : undefined) ||
      (typeof item.title === "string" ? item.title : undefined) ||
      "Untitled";
    const score =
      typeof item.rerank_score === "number"
        ? item.rerank_score
        : typeof item.score === "number"
          ? item.score
          : 0;
    const scoreDisplay = typeof score === "number" ? score.toFixed(4) : score;

    // For time-filtered results, show as "Recency" instead of "Relevance"
    const scoreLabel = item.source === "time-filtered" ? "Recency" : "Relevance";

    const lines = [`${index + 1}. ${filename}`];

    // For time-filtered queries, show actual modified time instead of a recency score
    if (item.source === "time-filtered") {
      if (item.mtime) {
        try {
          const d = new Date(item.mtime);
          const iso = isNaN(d.getTime()) ? String(item.mtime) : d.toISOString();
          lines.push(`   🕒 Modified: ${iso}${item.includeInContext ? " ✓" : ""}`);
        } catch {
          lines.push(`   🕒 Modified: ${String(item.mtime)}${item.includeInContext ? " ✓" : ""}`);
        }
      }
    } else if (item.source === "title-match") {
      // For title matches, avoid misleading numeric scores; mark as a title match
      lines.push(`   🔖 Title match${item.includeInContext ? " ✓" : ""}`);
    } else {
      // Default: show relevance-like score line
      lines.push(`   📊 ${scoreLabel}: ${scoreDisplay}${item.includeInContext ? " ✓" : ""}`);
    }

    const snippet = this.extractContentSnippet(
      typeof item.content === "string" ? item.content : ""
    );
    if (snippet) {
      const content = item.content as string | undefined;
      lines.push(`   💬 "${snippet}${content && content.length > 150 ? "..." : ""}"`);
    }

    if (typeof item.path === "string" && item.path && !item.path.endsWith(`/${filename}.md`)) {
      lines.push(`   📁 ${item.path}`);
    }

    return lines.join("\n");
  }

  private static formatBasicSearchItem(item: Record<string, unknown>, index: number): string {
    const title =
      typeof item.title === "string"
        ? item.title
        : typeof item.path === "string"
          ? item.path
          : `Result ${index + 1}`;
    const lines = [`${index + 1}. ${title}`];

    const modified = item.mtime || item.modified || item.modified_at || item.updated_at;
    if (modified) {
      lines.push(`   🕒 Modified: ${String(modified)}`);
    }

    if (typeof item.path === "string" && item.path && item.path !== title) {
      lines.push(`   📁 ${item.path}`);
    }

    return lines.join("\n");
  }

  private static extractContentSnippet(content: string, maxLength = 150): string {
    if (!content) return "";

    // Try to extract content after NOTE BLOCK CONTENT: pattern
    const contentMatch = content.match(/NOTE BLOCK CONTENT:\s*([\s\S]*)/);
    const cleanContent = contentMatch?.[1] || content;

    return cleanContent.substring(0, maxLength).replace(/\s+/g, " ").trim();
  }

  private static formatWebSearch(result: unknown): string {
    // Handle new JSON array format from webSearch tool
    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0] as Record<string, unknown>;
      if (firstItem.type === "web_search") {
        const output: string[] = ["🌐 Web Search Results"];
        const item = firstItem;

        // Add the main content
        if (typeof item.content === "string" && item.content) {
          output.push("");
          output.push(item.content);
        }

        // Add citations if present
        if (item.citations && Array.isArray(item.citations) && item.citations.length > 0) {
          output.push("");
          output.push("Sources:");
          (item.citations as string[]).forEach((url: string, index: number) => {
            output.push(`[${index + 1}] ${url}`);
          });
        }

        // Add instruction for the model
        if (typeof item.instruction === "string" && item.instruction) {
          output.push("");
          output.push(`Note: ${item.instruction}`);
        }

        return output.join("\n");
      }
    }

    // Fallback for old string format (for backward compatibility)
    if (typeof result === "string") {
      // Web search results include instructions and citations
      // Extract the main content and citations
      const lines = result.split("\n");
      const output: string[] = ["🌐 Web Search Results"];

      let inSources = false;
      const mainContent: string[] = [];
      const sources: string[] = [];

      for (const line of lines) {
        if (line.includes("Sources:")) {
          inSources = true;
          continue;
        }

        if (inSources) {
          sources.push(line);
        } else if (!line.includes("Here are the web search results")) {
          mainContent.push(line);
        }
      }

      // Add main content
      if (mainContent.length > 0) {
        output.push("");
        output.push(...mainContent.filter((line) => line.trim()));
      }

      // Add sources
      if (sources.length > 0) {
        output.push("");
        output.push("Sources:");
        sources.forEach((source) => {
          if (source.trim()) {
            output.push(source);
          }
        });
      }

      return output.join("\n");
    }

    return result;
  }

  private static formatYoutubeTranscription(result: unknown): string {
    // Handle both string and object results
    let parsed: Record<string, unknown> | null = null;

    if (typeof result === "string") {
      try {
        parsed = JSON.parse(result) as Record<string, unknown>;
      } catch {
        // If not JSON, return as is
        return result;
      }
    } else if (typeof result === "object" && result !== null) {
      parsed = result as Record<string, unknown>;
    } else {
      return String(result);
    }

    // Handle error case
    if (parsed && parsed.success === false && typeof parsed.message === "string") {
      return `📺 YouTube Transcription Failed\n\n${parsed.message}`;
    }

    // Handle new multi-URL format
    if (parsed && parsed.results && Array.isArray(parsed.results)) {
      const output: string[] = [
        `📺 YouTube Transcripts (${typeof parsed.total_urls === "number" ? parsed.total_urls : 0} video${typeof parsed.total_urls === "number" && parsed.total_urls > 1 ? "s" : ""})`,
      ];
      output.push("");

      for (const videoResult of parsed.results) {
        const vr = videoResult as Record<string, unknown>;
        if (vr.success && typeof vr.url === "string" && typeof vr.transcript === "string") {
          output.push(`📹 Video: ${vr.url}`);
          output.push("");

          // Format transcript
          const lines = vr.transcript.split("\n");
          let formattedLines = 0;

          for (const line of lines) {
            if (line.trim()) {
              // Check if line starts with a timestamp pattern [MM:SS]
              const timestampMatch = line.match(/^\[(\d+:\d+)\]/);
              if (timestampMatch) {
                if (formattedLines > 0) output.push(""); // Add spacing
                output.push(`⏰ ${line}`);
              } else {
                output.push(`   ${line.trim()}`);
              }
              formattedLines++;

              // Limit output to prevent overwhelming display
              if (formattedLines > 30) {
                output.push("");
                output.push("... (transcript truncated for display)");
                break;
              }
            }
          }

          if (typeof vr.elapsed_time_ms === "number") {
            output.push("");
            output.push(`Processing time: ${(vr.elapsed_time_ms / 1000).toFixed(1)}s`);
          }
        } else {
          const url = typeof vr.url === "string" ? vr.url : "unknown URL";
          output.push(`❌ Failed to transcribe: ${url}`);
          if (typeof vr.message === "string") {
            output.push(`   ${vr.message}`);
          }
        }

        output.push("");
        output.push("---");
        output.push("");
      }

      return output.join("\n").trimEnd();
    }

    // Handle old single-video format
    if (parsed && typeof parsed.transcript === "string") {
      const output: string[] = ["📺 YouTube Transcript"];
      output.push("");

      // Split transcript into manageable chunks
      const lines = parsed.transcript.split("\n");
      let formattedLines = 0;

      for (const line of lines) {
        if (line.trim()) {
          // Check if line starts with a timestamp pattern [MM:SS]
          const timestampMatch = line.match(/^\[(\d+:\d+)\]/);
          if (timestampMatch) {
            if (formattedLines > 0) output.push(""); // Add spacing
            output.push(`⏰ ${line}`);
          } else {
            output.push(`   ${line.trim()}`);
          }
          formattedLines++;

          // Limit output to prevent overwhelming display
          if (formattedLines > 50) {
            output.push("");
            output.push("... (transcript truncated for display)");
            break;
          }
        }
      }

      if (parsed && typeof parsed.elapsed_time_ms === "number") {
        output.push("");
        output.push(`Processing time: ${(parsed.elapsed_time_ms / 1000).toFixed(1)}s`);
      }

      return output.join("\n");
    }

    // If we can't format it, return as string
    return typeof result === "object" ? JSON.stringify(result, null, 2) : String(result);
  }

  private static formatWriteToFile(result: unknown): string {
    // Extract result status from object or use string directly
    const status =
      typeof result === "object" && result !== null
        ? (result as Record<string, unknown>).result
        : result;
    const statusStr = String(status).toLowerCase();

    if (statusStr.includes("accepted")) {
      return "✅ File change: accepted";
    } else if (statusStr.includes("rejected")) {
      return "❌ File change: rejected";
    }

    // Return message if available, otherwise the raw result
    return typeof result === "object" &&
      result !== null &&
      (result as Record<string, unknown>).message
      ? String((result as Record<string, unknown>).message)
      : String(status);
  }

  private static formatReplaceInFile(result: unknown): string {
    // Extract block count from object or string
    let blockCount = 0;
    let status = "";

    if (typeof result === "object" && result !== null) {
      const r = result as Record<string, unknown>;
      blockCount = typeof r.blocksApplied === "number" ? r.blocksApplied : 0;
      status = typeof r.result === "string" ? r.result : "";
    } else if (typeof result === "string") {
      const match = result.match(/Applied (\d+) SEARCH\/REPLACE block/);
      if (match) blockCount = parseInt(match[1]);
      status = result;
    }

    const statusStr = String(status).toLowerCase();

    if (statusStr.includes("accepted")) {
      const replacementText = blockCount === 1 ? "replacement" : "replacements";
      return blockCount > 0
        ? `✅ ${blockCount} ${replacementText} accepted`
        : "✅ File replacements: accepted";
    } else if (statusStr.includes("rejected")) {
      return blockCount === 0 ? "❌ No replacements made" : "❌ File replacements: rejected";
    }

    // Return message if available, otherwise the raw result
    return typeof result === "object" &&
      result !== null &&
      (result as Record<string, unknown>).message
      ? String((result as Record<string, unknown>).message)
      : String(status);
  }

  private static formatReadNote(result: unknown): string {
    let payload: Record<string, unknown> | null = null;
    if (typeof result === "string") {
      try {
        payload = JSON.parse(result) as Record<string, unknown>;
      } catch {
        payload = null;
      }
    }

    const summary = summarizeReadNotePayload(payload);
    if (summary) {
      return summary;
    }

    return typeof result === "string" ? result : JSON.stringify(result, null, 2);
  }
}
