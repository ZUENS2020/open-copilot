/**
 * Type definitions for context-related callback data
 */

import type { TFile } from "obsidian";

/**
 * Categories of context items that can be mentioned in chat
 */
export type AtMentionCategory = "note" | "folder" | "url" | "tool" | "tag";

/**
 * Data structure for note context items
 */
export interface NoteContextData {
  type: "note";
  path: string;
  basename: string;
  file?: TFile;
}

/**
 * Data structure for folder context items
 */
export interface FolderContextData {
  type: "folder";
  path: string;
}

/**
 * Data structure for URL context items
 */
export interface URLContextData {
  type: "url";
  url: string;
}

/**
 * Data structure for tool context items
 */
export interface ToolContextData {
  type: "tool";
  name: string;
  description?: string;
}

/**
 * Data structure for tag context items
 */
export interface TagContextData {
  type: "tag";
  tag: string;
}

/**
 * Union type for all context data types
 */
export type ContextData =
  | NoteContextData
  | FolderContextData
  | URLContextData
  | ToolContextData
  | TagContextData;

/**
 * Type guard to check if context data is for a note
 */
export function isNoteContextData(data: ContextData): data is NoteContextData {
  return data.type === "note";
}

/**
 * Type guard to check if context data is for a folder
 */
export function isFolderContextData(data: ContextData): data is FolderContextData {
  return data.type === "folder";
}

/**
 * Type guard to check if context data is for a URL
 */
export function isURLContextData(data: ContextData): data is URLContextData {
  return data.type === "url";
}

/**
 * Type guard to check if context data is for a tool
 */
export function isToolContextData(data: ContextData): data is ToolContextData {
  return data.type === "tool";
}

/**
 * Type guard to check if context data is for a tag
 */
export function isTagContextData(data: ContextData): data is TagContextData {
  return data.type === "tag";
}
