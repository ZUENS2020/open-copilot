/**
 * Multimodal message content types for LLM communication
 * These types replace the use of `any[]` for message content arrays
 */

/**
 * Text content part for messages
 */
export interface TextContentPart {
  type: "text";
  text: string;
}

/**
 * Image content part for messages
 * URL should be in data URL format: data:{mimeType};base64,{base64}
 */
export interface ImageContentPart {
  type: "image_url";
  image_url: {
    url: string;
  };
}

/**
 * Tool use content part for messages
 */
export interface ToolContentPart {
  type: "tool_use";
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

/**
 * Thinking content part for reasoning display
 */
export interface ThinkingContentPart {
  type: "thinking";
  content: string;
}

/**
 * Discriminated union for all message content parts
 */
export type MessageContentPart =
  | TextContentPart
  | ImageContentPart
  | ToolContentPart
  | ThinkingContentPart;

/**
 * Message content can be a string or an array of content parts
 */
export type MessageContent = string | MessageContentPart[];

/**
 * Array form of message content for backward compatibility
 */
export type MessageContentArray = MessageContentPart[];
