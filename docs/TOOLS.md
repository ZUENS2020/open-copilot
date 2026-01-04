# Tool System Documentation

## Overview

The Copilot tool system uses a centralized registry pattern that makes it easy to add new tools, including future MCP (Model Context Protocol) tools. All tools are managed through a singleton `ToolRegistry` that provides a unified interface for tool discovery, configuration, and execution.

## Tool Prompt Architecture

### How Tool Instructions Flow to the LLM

The system uses a three-layer approach for providing tool instructions to LLMs:

1. **Tool Schema Descriptions** (in tool implementations like `ComposerTools.ts`)

   - Defines parameter formats, rules, and validation
   - NO XML examples - focuses on data contract only

2. **Custom Prompt Instructions** (in `builtinTools.ts`)

   - Contains XML `<use_tool>` invocation examples
   - Shows when and how to call the tool

3. **Model-Specific Adaptations** (in `modelAdapter.ts`)
   - Last resort for model-specific quirks

### Layered Prompt Integration

- `ContextManager` promotes user-attached artifacts from earlier turns into **L2 (Context Library)**, so every chain runner starts with the same cacheable system prefix.
- When a tool executes during the current turn, its XML payload is prepended to the **user message** (L3 + L5) using `renderCiCMessage(...)`. Nothing is injected into the system message, keeping L1/L2 stable.
- `LayerToMessagesConverter.convert(envelope, { includeSystemMessage: true, mergeUserContent: true })` materializes the base messages; runners then append tool XML before sending to the model.
- `promptPayloadRecorder` inspects the final payload and highlights tool blocks in its layered view, making it easy to debug the L1-L5 structure.

## Current Implementation

### Core Files

- `src/tools/ToolRegistry.ts` - Central registry for all tools
- `src/tools/builtinTools.ts` - Built-in tool definitions and initialization
- `src/LLMProviders/chainRunner/AutonomousAgentChainRunner.ts` - Tool execution in the agent
- `src/settings/v2/components/ToolSettingsSection.tsx` - Settings UI for tool configuration

### Tool Registry Pattern

The `ToolRegistry` is a singleton that manages all tools:

```typescript
class ToolRegistry {
  static getInstance(): ToolRegistry;
  register(definition: ToolDefinition): void;
  registerAll(definitions: ToolDefinition[]): void;
  getAllTools(): ToolDefinition[];
  getEnabledTools(enabledToolIds: Set<string>, vaultAvailable: boolean): SimpleTool<any, any>[];
  getToolsByCategory(): Map<string, ToolDefinition[]>;
  getConfigurableTools(): ToolDefinition[];
  getToolMetadata(id: string): ToolMetadata | undefined;
  clear(): void;
}
```

## Built-in Tools

The following tools are currently implemented in `src/tools/builtinTools.ts`:

### Search Tools
- **localSearch** (`Vault Search`): Search through your vault notes.
- **webSearch** (`Web Search`): Search the INTERNET (NOT vault notes) when user explicitly asks for web/online information.

### Time Tools
- **getCurrentTime** (`Get Current Time`): Get the current time in any timezone.
- **getTimeInfoByEpoch** (`Get Time Info`): Convert epoch timestamp to human-readable format.
- **getTimeRangeMs** (`Get Time Range`): Convert time expressions to date ranges.
- **convertTimeBetweenTimezones** (`Convert Timezones`): Convert time between different timezones.

### File Tools
- **readNote** (`Read Note`): Read a specific note in sequential chunks.
- **writeToFile** (`Write to File`): Create or modify files in your vault (overwrite/create).
- **replaceInFile** (`Replace in File`): Make targeted changes to existing files using SEARCH/REPLACE blocks.
- **getFileTree** (`File Tree`): Browse vault file structure.
- **getTagList** (`Tag List`): List vault tags with occurrence statistics.

### Memory Tools
- **updateMemory** (`Update Memory`): Save information to user memory when explicitly asked.

### Media Tools
- **youtubeTranscription** (`YouTube Transcription`): Get transcripts from YouTube videos.

## Adding a New Built-in Tool

### 1. Implement the Tool

Create your tool following the `SimpleTool` interface:

```typescript
// Example: New built-in tool
import { z } from "zod";
import { SimpleTool } from "./SimpleTool";

export const myNewTool: SimpleTool<{ input: string }, { result: string }> = {
  name: "myNewTool",
  description: "Description for the LLM to understand when to use this tool",
  schema: z.object({
    input: z.string().describe("The input parameter description"),
  }),
  func: async (params) => {
    // Tool implementation
    const result = await performOperation(params.input);
    return { result };
  },
};
```

### 2. Add to Built-in Tools

Update `src/tools/builtinTools.ts`:

```typescript
export const BUILTIN_TOOLS: ToolDefinition[] = [
  // ... existing tools ...
  {
    tool: myNewTool,
    metadata: {
      id: "myNewTool",
      displayName: "My New Tool",
      description: "User-friendly description for settings UI",
      category: "custom", // Choose appropriate category
      // Optional flags:
      isAlwaysEnabled: false, // Set true if tool should always be available
      requiresVault: true, // Set true if tool needs vault access
      customPromptInstructions: "Special instructions for the AI when using this tool",
    },
  },
];
```

### 3. Update Default Settings (if configurable)

If the tool is configurable (not always-enabled), add its ID to the default enabled tools in `src/constants.ts`:

```typescript
autonomousAgentEnabledToolIds: [
  "localSearch",
  "webSearch",
  "pomodoro",
  "youtubeTranscription",
  "writeToFile",
  "replaceInFile",
  "updateMemory",
  "myNewTool"  // Add your tool ID here
],
```

## Adding MCP Tools (Future Implementation)

### 1. MCP Tool Wrapper

Create a wrapper to convert MCP tools to the SimpleTool interface:

```typescript
function createMcpToolWrapper(serverName: string, mcpTool: McpTool): SimpleTool<any, any> {
  return {
    name: `${serverName}_${mcpTool.name}`,
    description: mcpTool.description || `MCP tool from ${serverName}`,
    schema: convertMcpSchemaToZod(mcpTool.inputSchema),
    func: async (params) => {
      // Call the MCP server
      const result = await mcpHub.callTool(serverName, mcpTool.name, params);

      // Convert MCP response to expected format
      return {
        result: formatMcpResponse(result),
      };
    },
  };
}
```

### 2. Dynamic MCP Tool Registration

Register MCP tools when servers connect:

```typescript
// In your MCP initialization code
export async function registerMcpServerTools(serverName: string, mcpTools: McpTool[]) {
  const registry = ToolRegistry.getInstance();

  for (const mcpTool of mcpTools) {
    registry.register({
      tool: createMcpToolWrapper(serverName, mcpTool),
      metadata: {
        id: `mcp_${serverName}_${mcpTool.name}`,
        displayName: mcpTool.displayName || mcpTool.name,
        description: mcpTool.description || `MCP tool from ${serverName}`,
        category: "mcp",
        // MCP tools are user-configurable by default
        isAlwaysEnabled: false,
        // Add any MCP-specific prompt instructions
        customPromptInstructions: mcpTool.systemPrompt,
      },
    });
  }
}

// When MCP server disconnects
export function unregisterMcpServerTools(serverName: string) {
  const registry = ToolRegistry.getInstance();
  const allTools = registry.getAllTools();

  // Remove tools from this server
  const toolsToKeep = allTools.filter((t) => !t.metadata.id.startsWith(`mcp_${serverName}_`));

  registry.clear();
  registry.registerAll(toolsToKeep);

  // Re-initialize built-in tools
  initializeBuiltinTools(app.vault);
}
```
