import { ToolManager } from "@/tools/toolManager";
import { ToolResultFormatter } from "@/tools/ToolResultFormatter";

interface StreamingChunk {
  content?: string | unknown[];
  [key: string]: unknown;
}

/**
 * ActionBlockStreamer processes streaming chunks to detect and handle writeToFile blocks.
 *
 * 1. Accumulates chunks in a buffer
 * 2. Detects complete writeToFile blocks
 * 3. Calls the writeToFile tool when a complete block is found
 * 4. Returns chunks as-is otherwise
 */
export class ActionBlockStreamer {
  private buffer = "";

  constructor(
    private toolManager: typeof ToolManager,
    private writeToFileTool: unknown
  ) {}

  private findCompleteBlock(str: string) {
    // Regex for both formats
    const regex = /<writeToFile>[\s\S]*?<\/writeToFile>/;
    const match = str.match(regex);

    if (!match || match.index === undefined) {
      return null;
    }

    return {
      block: match[0],
      endIdx: match.index + match[0].length,
    };
  }

  async *processChunk(chunk: unknown): AsyncGenerator<StreamingChunk, void, unknown> {
    // Handle different chunk formats
    let chunkContent = "";
    const streamingChunk = chunk as StreamingChunk;

    // Handle Claude thinking model array-based content
    if (Array.isArray(streamingChunk.content)) {
      for (const item of streamingChunk.content) {
        if (
          typeof item === "object" &&
          item !== null &&
          "type" in item &&
          item.type === "text" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          chunkContent += item.text;
        }
      }
    }
    // Handle standard string content
    else if (typeof streamingChunk.content === "string") {
      chunkContent = streamingChunk.content;
    }

    // Add to buffer
    if (chunkContent) {
      this.buffer += chunkContent;
    }

    // Yield the original chunk as-is
    yield streamingChunk;

    // Process all complete blocks in the buffer
    let blockInfo = this.findCompleteBlock(this.buffer);

    while (blockInfo) {
      const { block, endIdx } = blockInfo;

      // Extract content from the block
      const pathMatch = block.match(/<path>([\s\S]*?)<\/path>/);
      const contentMatch = block.match(/<content>([\s\S]*?)<\/content>/);
      const filePath = pathMatch ? pathMatch[1].trim() : undefined;
      const fileContent = contentMatch ? contentMatch[1].trim() : undefined;

      // Call the tool
      try {
        const result = await this.toolManager.callTool(this.writeToFileTool, {
          path: filePath,
          content: fileContent,
        });

        // Format tool result using ToolResultFormatter for consistency with agent mode
        const formattedResult = ToolResultFormatter.format("writeToFile", result);
        yield { ...streamingChunk, content: `\n${formattedResult}\n` };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        yield { ...streamingChunk, content: `\nError: ${errorMessage}\n` };
      }

      // Remove processed block from buffer
      this.buffer = this.buffer.substring(endIdx);

      // Check for another complete block in the remaining buffer
      blockInfo = this.findCompleteBlock(this.buffer);
    }
  }
}
