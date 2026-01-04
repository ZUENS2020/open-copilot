import { ChainType } from "@/chainFactory";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { SettingItem } from "@/components/ui/setting-item";
import { DEFAULT_OPEN_AREA, SEND_SHORTCUT } from "@/constants";
import { cn } from "@/lib/utils";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { formatDateTime } from "@/utils";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Notice } from "obsidian";
import React, { useState } from "react";

const ChainType2Label: Record<ChainType, string> = {
  [ChainType.LLM_CHAIN]: "Chat",
  [ChainType.VAULT_QA_CHAIN]: "Vault QA (Basic)",
  [ChainType.PROJECT_CHAIN]: "Projects (alpha)",
};

export const BasicSettings: React.FC = () => {
  const settings = useSettingsValue();
  const [isChecking, setIsChecking] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [conversationNoteName, setConversationNoteName] = useState(
    settings.defaultConversationNoteName || "{$topic}@{$date}_{$time}"
  );

  const applyCustomNoteFormat = () => {
    setIsChecking(true);

    try {
      // Check required variables
      const format = conversationNoteName || "{$topic}@{$date}_{$time}";
      const requiredVars = ["{$date}", "{$time}", "{$topic}"];
      const missingVars = requiredVars.filter((v) => !format.includes(v));

      if (missingVars.length > 0) {
        new Notice(`Error: Missing required variables: ${missingVars.join(", ")}`, 4000);
        return;
      }

      // Check illegal characters (excluding variable placeholders)
      const illegalChars = /[\\/:*?"<>|]/;
      const formatWithoutVars = format
        .replace(/\{\$date}/g, "")
        .replace(/\{\$time}/g, "")
        .replace(/\{\$topic}/g, "");

      if (illegalChars.test(formatWithoutVars)) {
        new Notice(`Error: Format contains illegal characters (\\/:*?"<>|)`, 4000);
        return;
      }

      // Generate example filename
      const { fileName: timestampFileName } = formatDateTime(new Date());
      const firstTenWords = "test topic name";

      // Create example filename
      const customFileName = format
        .replace("{$topic}", firstTenWords.slice(0, 100).replace(/\s+/g, "_"))
        .replace("{$date}", timestampFileName.split("_")[0])
        .replace("{$time}", timestampFileName.split("_")[1]);

      // Save settings
      updateSetting("defaultConversationNoteName", format);
      setConversationNoteName(format);
      new Notice(`Format applied successfully! Example: ${customFileName}`, 4000);
    } catch (error) {
      new Notice(`Error applying format: ${error.message}`, 4000);
    } finally {
      setIsChecking(false);
    }
  };

  // Get enabled embedding models for selection
  const enabledEmbeddingModels = settings.embeddingModels
    .filter((m) => m.enabled)
    .map((model) => ({
      label: model.name,
      value: model.id,
    }));

  const defaultEmbeddingModelActivated = settings.embeddingModels.some(
    (m) => m.enabled && m.id === settings.defaultEmbeddingModelKey
  );

  return (
    <div className="tw-space-y-4">
      {/* API Configuration Section */}
      <section>
        <div className="tw-mb-3 tw-text-xl tw-font-bold">API Configuration</div>
        <div className="tw-space-y-4">
          <SettingItem
            type="text"
            title="API Base URL"
            description={
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <span className="tw-leading-none">
                  Your API endpoint (e.g., https://api.openai.com/v1)
                </span>
                <HelpTooltip
                  content={
                    <div className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2 tw-py-4">
                      <div className="tw-text-sm tw-font-medium tw-text-accent">
                        Enter your API endpoint
                      </div>
                      <div className="tw-text-xs tw-text-muted">
                        Provide the base URL of your API provider. Examples:
                        <ul className="tw-ml-4 tw-mt-2 tw-list-disc">
                          <li>OpenAI: https://api.openai.com/v1</li>
                          <li>Custom endpoint: https://your-api.com/v1</li>
                        </ul>
                      </div>
                    </div>
                  }
                />
              </div>
            }
            value={settings.apiBaseUrl}
            onChange={(value) => updateSetting("apiBaseUrl", value)}
            placeholder="https://api.openai.com/v1"
          />

          <SettingItem
            type="custom"
            title="API Key"
            description={
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <span className="tw-leading-none">Your API key for chat and embedding models</span>
                <HelpTooltip
                  content={
                    <div className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2 tw-py-4">
                      <div className="tw-text-sm tw-font-medium tw-text-accent">
                        API key required
                      </div>
                      <div className="tw-text-xs tw-text-muted">
                        Provide your API key to enable chat and QA functionality. This key will be
                        used for all configured models.
                      </div>
                    </div>
                  }
                />
              </div>
            }
          >
            <div className="tw-flex tw-w-full tw-items-center tw-gap-2">
              <div className="tw-relative tw-grow">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) => updateSetting("apiKey", e.target.value)}
                  placeholder="sk-..."
                  // eslint-disable-next-line tailwindcss/no-custom-classname
                  className={cn(
                    "tw-w-full tw-rounded-md tw-border tw-border-border",
                    "tw-bg-secondary tw-px-3 tw-py-2 tw-text-sm",
                    "tw-placeholder:text-muted-foreground",
                    "focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-ring",
                    "focus:tw-ring-offset-2"
                  )}
                />
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="hover:tw-bg-accent tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-2 tw-transition-colors"
              >
                {showApiKey ? <EyeOff className="tw-size-4" /> : <Eye className="tw-size-4" />}
              </button>
            </div>
          </SettingItem>

          <SettingItem
            type="select"
            title="Default Embedding Model"
            description={
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <span className="tw-leading-none">Select the default embedding model for RAG</span>
                <HelpTooltip
                  content={
                    <div className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2 tw-py-4">
                      <div className="tw-text-sm tw-font-medium tw-text-accent">
                        Embedding model for vault search
                      </div>
                      <div className="tw-text-xs tw-text-muted">
                        This model will be used for semantic search in your vault. Add embedding
                        models in the Models tab.
                      </div>
                    </div>
                  }
                />
              </div>
            }
            value={
              defaultEmbeddingModelActivated ? settings.defaultEmbeddingModelKey : "Select Model"
            }
            onChange={(value) => updateSetting("defaultEmbeddingModelKey", value)}
            options={
              defaultEmbeddingModelActivated
                ? enabledEmbeddingModels
                : [{ label: "Select Model", value: "Select Model" }, ...enabledEmbeddingModels]
            }
            placeholder="Model"
          />
        </div>
      </section>

      {/* General Section */}
      <section>
        <div className="tw-mb-3 tw-text-xl tw-font-bold">General</div>
        <div className="tw-space-y-4">
          {/* Basic Configuration Group */}
          <SettingItem
            type="select"
            title="Default Mode"
            description={
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <span className="tw-leading-none">Select the default chat mode</span>
                <HelpTooltip
                  content={
                    <div className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2">
                      <ul className="tw-pl-4 tw-text-sm tw-text-muted">
                        <li>
                          <strong>Chat:</strong> Regular chat mode for general conversations and
                          tasks. <i>Free to use with your own API key.</i>
                        </li>
                        <li>
                          <strong>Vault QA (Basic):</strong> Ask questions about your vault content
                          with semantic search. <i>Free to use with your own API key.</i>
                        </li>
                        <li>
                          <strong>Projects (alpha):</strong> Organize your notes into projects for
                          focused conversations and context management.
                        </li>
                      </ul>
                    </div>
                  }
                />
              </div>
            }
            value={settings.defaultChainType}
            onChange={(value) => updateSetting("defaultChainType", value as ChainType)}
            options={Object.entries(ChainType2Label).map(([key, value]) => ({
              label: value,
              value: key,
            }))}
          />

          <SettingItem
            type="select"
            title="Open Plugin In"
            description="Choose where to open the plugin"
            value={settings.defaultOpenArea}
            onChange={(value) => updateSetting("defaultOpenArea", value as DEFAULT_OPEN_AREA)}
            options={[
              { label: "Sidebar View", value: DEFAULT_OPEN_AREA.VIEW },
              { label: "Editor", value: DEFAULT_OPEN_AREA.EDITOR },
            ]}
          />

          <SettingItem
            type="select"
            title="Send Shortcut"
            description={
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <span className="tw-leading-none">Choose keyboard shortcut to send messages</span>
                <HelpTooltip
                  content={
                    <div className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2 tw-py-4">
                      <div className="tw-text-sm tw-font-medium tw-text-accent">
                        Shortcut not working?
                      </div>
                      <div className="tw-text-xs tw-text-muted">
                        If your selected shortcut doesn&apos;t work, check
                        <strong> Obsidian&apos;s Settings → Hotkeys</strong> to see if another
                        command is using the same key combination. <br />
                        You may need to remove or change the conflicting hotkey first.
                      </div>
                    </div>
                  }
                />
              </div>
            }
            value={settings.defaultSendShortcut}
            onChange={(value) => updateSetting("defaultSendShortcut", value as SEND_SHORTCUT)}
            options={[
              { label: "Enter", value: SEND_SHORTCUT.ENTER },
              { label: "Shift + Enter", value: SEND_SHORTCUT.SHIFT_ENTER },
            ]}
          />

          <SettingItem
            type="switch"
            title="Include Current Note in Context Menu"
            description="Automatically include the current note in the chat context menu by default when sending messages to the AI."
            checked={settings.includeActiveNoteAsContext}
            onCheckedChange={(checked) => {
              updateSetting("includeActiveNoteAsContext", checked);
            }}
          />

          <SettingItem
            type="switch"
            title="Auto-Add Text Selection to Context"
            description="Automatically add selected text to chat context when you make a text selection in markdown notes. Disable to use manual command instead."
            checked={settings.autoIncludeTextSelection}
            onCheckedChange={(checked) => {
              updateSetting("autoIncludeTextSelection", checked);
            }}
          />

          <SettingItem
            type="switch"
            title="Images in Markdown"
            description="Pass embedded images in markdown to the AI along with the text. Only works with multimodal models."
            checked={settings.passMarkdownImages}
            onCheckedChange={(checked) => {
              updateSetting("passMarkdownImages", checked);
            }}
          />

          <SettingItem
            type="switch"
            title="Suggested Prompts"
            description="Show suggested prompts in the chat view"
            checked={settings.showSuggestedPrompts}
            onCheckedChange={(checked) => updateSetting("showSuggestedPrompts", checked)}
          />

          <SettingItem
            type="switch"
            title="Relevant Notes"
            description="Show relevant notes in the chat view"
            checked={settings.showRelevantNotes}
            onCheckedChange={(checked) => updateSetting("showRelevantNotes", checked)}
          />
        </div>
      </section>

      {/* Saving Conversations Section */}
      <section>
        <div className="tw-mb-3 tw-text-xl tw-font-bold">Saving Conversations</div>
        <div className="tw-space-y-4">
          <SettingItem
            type="switch"
            title="Autosave Chat"
            description="Automatically saves the chat after every user message and AI response."
            checked={settings.autosaveChat}
            onCheckedChange={(checked) => updateSetting("autosaveChat", checked)}
          />

          <SettingItem
            type="switch"
            title="Generate AI Chat Title on Save"
            description="When enabled, uses an AI model to generate a concise title for saved chat notes. When disabled, uses the first 10 words of the first user message."
            checked={settings.generateAIChatTitleOnSave}
            onCheckedChange={(checked) => updateSetting("generateAIChatTitleOnSave", checked)}
          />

          <SettingItem
            type="text"
            title="Default Conversation Folder Name"
            description="The default folder name where chat conversations will be saved. Default is 'copilot/copilot-conversations'"
            value={settings.defaultSaveFolder}
            onChange={(value) => updateSetting("defaultSaveFolder", value)}
            placeholder="copilot/copilot-conversations"
          />

          <SettingItem
            type="text"
            title="Default Conversation Tag"
            description="The default tag to be used when saving a conversation. Default is 'copilot-conversation'"
            value={settings.defaultConversationTag}
            onChange={(value) => updateSetting("defaultConversationTag", value)}
            placeholder="copilot-conversation"
          />

          <SettingItem
            type="custom"
            title="Conversation Filename Template"
            description={
              <div className="tw-flex tw-items-start tw-gap-1.5 ">
                <span className="tw-leading-none">
                  Customize the format of saved conversation note names.
                </span>
                <HelpTooltip
                  content={
                    <div className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2 tw-py-4">
                      <div className="tw-text-sm tw-font-medium tw-text-accent">
                        Note: All the following variables must be included in the template.
                      </div>
                      <div>
                        <div className="tw-text-sm tw-font-medium tw-text-muted">
                          Available variables:
                        </div>
                        <ul className="tw-pl-4 tw-text-sm tw-text-muted">
                          <li>
                            <strong>{"{$date}"}</strong>: Date in YYYYMMDD format
                          </li>
                          <li>
                            <strong>{"{$time}"}</strong>: Time in HHMMSS format
                          </li>
                          <li>
                            <strong>{"{$topic}"}</strong>: Chat conversation topic
                          </li>
                        </ul>
                        <i className="tw-mt-2 tw-text-sm tw-text-muted">
                          Example: {"{$topic}@{$date}_{$time}"} →
                          polish_this_article__20250114_153232
                        </i>
                      </div>
                    </div>
                  }
                />
              </div>
            }
          >
            <div className="tw-flex tw-w-[320px] tw-items-center tw-gap-1.5">
              <input
                type="text"
                // eslint-disable-next-line tailwindcss/no-custom-classname
                className={cn(
                  "tw-min-w-[80px] tw-grow tw-rounded-md tw-border tw-border-border",
                  "tw-bg-secondary tw-px-3 tw-py-2 tw-text-sm",
                  "tw-placeholder:text-muted-foreground",
                  "focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-ring",
                  "tw-transition-all tw-duration-200 focus:tw-ring-offset-2",
                  isChecking ? "tw-w-[80px]" : "tw-w-[120px]"
                )}
                placeholder="{$topic}@{$date}_{$time}"
                value={conversationNoteName}
                onChange={(e) => setConversationNoteName(e.target.value)}
                disabled={isChecking}
              />

              <button
                onClick={() => applyCustomNoteFormat()}
                disabled={isChecking}
                className="hover:tw-bg-accent tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-bg-secondary tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-transition-colors disabled:tw-opacity-50"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="tw-mr-2 tw-size-4 tw-animate-spin" />
                    Apply
                  </>
                ) : (
                  "Apply"
                )}
              </button>
            </div>
          </SettingItem>
        </div>
      </section>
    </div>
  );
};
