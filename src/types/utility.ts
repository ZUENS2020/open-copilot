/**
 * Utility types for common patterns
 */

/**
 * A safe JSON-parsed value type
 * Represents all possible JSON values
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * A parsed JSON value or the original string if parsing fails
 */
export type ParsedJson = JsonValue | string;

/**
 * Generic record type for unknown object properties
 */
export type PropertiesRecord = Record<string, unknown>;

/**
 * Type guard for plain objects
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    !(value instanceof Error)
  );
}

/**
 * Type guard for arrays
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard for strings
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard for numbers
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Safe JSON parse that returns the original string on failure
 */
export function safeJsonParse(text: string): ParsedJson {
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return text;
  }
}
