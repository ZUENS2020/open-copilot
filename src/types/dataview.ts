/**
 * Types for Dataview plugin integration
 *
 * Dataview is an optional third-party plugin for Obsidian.
 * These types provide type safety when working with Dataview API.
 */

/**
 * Supported Dataview result types
 */
export type DataviewResultType = "list" | "table" | "task";

/**
 * A single value in Dataview results
 */
export interface DataviewValue {
  path?: string;
  display?: string;
  [key: string]: unknown;
}

/**
 * List-type query result
 */
export interface DataviewListResult {
  type: "list";
  values: DataviewValue[];
}

/**
 * Table-type query result
 */
export interface DataviewTableResult {
  type: "table";
  headers: string[];
  values: unknown[][];
}

/**
 * Task query result value
 */
export interface DataviewTaskValue {
  completed: boolean;
  text: string;
  [key: string]: unknown;
}

/**
 * Task-type query result
 */
export interface DataviewTaskResult {
  type: "task";
  values: DataviewTaskValue[];
}

/**
 * Union type for all Dataview result types
 */
export type DataviewResult =
  | DataviewListResult
  | DataviewTableResult
  | DataviewTaskResult
  | DataviewValue[]
  | string;

/**
 * Dataview query result wrapper
 */
export interface DataviewQueryResult {
  successful: boolean;
  error?: string;
  value: DataviewResult;
}

/**
 * Dataview API interface
 */
export interface DataviewApi {
  query(query: string, sourcePath: string): Promise<DataviewQueryResult>;
}

/**
 * Dataview plugin interface
 */
export interface DataviewPlugin {
  api?: DataviewApi;
}

/**
 * Type guard for DataviewPlugin
 */
export function isDataviewPlugin(plugin: unknown): plugin is DataviewPlugin {
  return typeof plugin === "object" && plugin !== null && "api" in plugin;
}

/**
 * Format a Dataview result as a string
 */
export function formatDataviewResult(result: DataviewResult): string {
  if (!result) {
    return "No results";
  }

  if (typeof result === "string") {
    return result;
  }

  if (Array.isArray(result)) {
    return result.map((item) => formatDataviewValue(item)).join("\n");
  }

  if (typeof result === "object" && "type" in result) {
    switch ((result as { type: DataviewResultType }).type) {
      case "list":
        return (result as DataviewListResult).values
          .map((item) => `- ${formatDataviewValue(item)}`)
          .join("\n");
      case "table": {
        const tableResult = result as DataviewTableResult;
        let table = `| ${tableResult.headers.join(" | ")} |\n`;
        table += `| ${tableResult.headers.map(() => "---").join(" | ")} |\n`;
        for (const row of tableResult.values) {
          table += `| ${row.map((cell) => formatDataviewValue(cell)).join(" | ")} |\n`;
        }
        return table;
      }
      case "task":
        return (result as DataviewTaskResult).values
          .map((task) => {
            const checkbox = task.completed ? "[x]" : "[ ]";
            return `- ${checkbox} ${formatDataviewValue(task.text || task)}`;
          })
          .join("\n");
    }
  }

  return String(result);
}

/**
 * Format a single Dataview value
 */
function formatDataviewValue(value: DataviewValue | unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => formatDataviewValue(v)).join(", ");
  }

  if (typeof value === "object" && value !== null && "path" in value) {
    return `[[${(value as { path: string }).path}]]`;
  }

  return String(value);
}
