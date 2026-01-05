/**
 * Type extensions and utilities for LangChain integration
 *
 * These types provide better type safety when working with LangChain
 * objects and responses.
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Base chat model with common metadata properties
 */
export interface ChatModelWithMetadata extends BaseChatModel {
  modelName?: string;
  model?: string;
  _model?: string;
}

/**
 * Get the model name from a chat model
 */
export function getModelName(model: BaseChatModel): string {
  return (
    (model as Partial<ChatModelWithMetadata>).modelName ||
    (model as Partial<ChatModelWithMetadata>).model ||
    (model as Partial<ChatModelWithMetadata>)._model ||
    ""
  );
}

/**
 * Text stream chunk type
 */
export interface TextStreamChunk {
  type: "text";
  content: string;
}

/**
 * Tool stream chunk type
 */
export interface ToolStreamChunk {
  type: "tool";
  tool: string;
  input: Record<string, unknown>;
}

/**
 * Metadata stream chunk type
 */
export interface MetadataStreamChunk {
  type: "metadata";
  metadata: Record<string, unknown>;
}

/**
 * Discriminated union for stream chunks
 */
export type StreamChunk = TextStreamChunk | ToolStreamChunk | MetadataStreamChunk;

/**
 * Tool call executor
 */
export interface ToolCallExecutor {
  tool: {
    name: string;
    schema?: unknown;
    call: (args: unknown) => Promise<unknown>;
  };
  args: Record<string, unknown>;
}

/**
 * Tool execution output
 */
export interface ToolExecutionOutput {
  tool: string;
  output: unknown;
}

/**
 * Search result document type
 */
export interface SearchResultDocument {
  title?: string;
  path?: string;
  content?: string;
  score?: number;
  ctime?: number;
  mtime?: number;
  includeInContext?: boolean;
  chunkId?: string;
  explanation?: string | unknown;
}

/**
 * Source result type
 */
export interface SourceResult {
  title: string;
  path: string;
  score: number;
  explanation?: string | unknown;
}
