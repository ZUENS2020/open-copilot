import { setChainType, setModelKey } from "@/aiParams";
import { ChainType } from "@/chainFactory";
import {
  ChatModelProviders,
  ChatModels,
  DEFAULT_SETTINGS,
  EmbeddingModelProviders,
  EmbeddingModels,
  PlusUtmMedium,
} from "@/constants";
import { logInfo } from "@/logger";
import { getSettings, setSettings, updateSetting, useSettingsValue } from "@/settings/model";
import { Notice } from "obsidian";

// Default models for free users (imported from DEFAULT_SETTINGS)
export const DEFAULT_FREE_CHAT_MODEL_KEY = DEFAULT_SETTINGS.defaultModelKey;
export const DEFAULT_FREE_EMBEDDING_MODEL_KEY = DEFAULT_SETTINGS.embeddingModelKey;

// Copilot Plus models are deprecated - point to default free models
export const DEFAULT_COPILOT_PLUS_CHAT_MODEL = DEFAULT_FREE_CHAT_MODEL_KEY;
export const DEFAULT_COPILOT_PLUS_EMBEDDING_MODEL = DEFAULT_FREE_EMBEDDING_MODEL_KEY;
export const DEFAULT_COPILOT_PLUS_EMBEDDING_MODEL_KEY = DEFAULT_FREE_EMBEDDING_MODEL_KEY;

/** Check if the model key is a Copilot Plus model. Always returns false since Plus is removed. */
export function isPlusModel(modelKey: string): boolean {
  return false;
}

/** Hook to get the isPlusUser setting. Always returns false since Plus is removed. */
export function useIsPlusUser(): boolean | undefined {
  const settings = useSettingsValue();
  // Note: isPlusUser field has been removed from settings, return false for compatibility
  return false;
}

/** Check if the user is a Plus user. Always returns false since Plus is removed. */
export async function checkIsPlusUser(context?: Record<string, any>): Promise<boolean | undefined> {
  return false;
}

/** Check if the user is on the believer plan. Always returns false since Plus is removed. */
export async function isBelieverPlan(): Promise<boolean> {
  return false;
}

/**
 * Apply the Copilot Plus settings. Now a no-op since Plus is removed.
 * Users should configure their custom API models instead.
 */
export function applyPlusSettings(): void {
  logInfo("applyPlusSettings: Plus functionality has been removed. Please configure custom API models.");
  // No-op - users should configure their custom API models instead
}

export function createPlusPageUrl(medium: PlusUtmMedium): string {
  return `https://www.obsidiancopilot.com?utm_source=obsidian&utm_medium=${medium}`;
}

export function navigateToPlusPage(medium: PlusUtmMedium): void {
  window.open(createPlusPageUrl(medium), "_blank");
}

export function turnOnPlus(): void {
  // No-op - Plus functionality has been removed
}

/**
 * Turn off Plus user status. Now a no-op since Plus is removed.
 * The expired modal is no longer shown.
 */
export function turnOffPlus(): void {
  // No-op - Plus functionality has been removed, no expired modal shown
}
