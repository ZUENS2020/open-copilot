import { CustomModel } from "@/aiParams";
import { SettingItem } from "@/components/ui/setting-item";
import EmbeddingManager from "@/LLMProviders/embeddingManager";
import ProjectManager from "@/LLMProviders/projectManager";
import { logError } from "@/logger";
import {
  CopilotSettings,
  setSettings,
  updateSetting,
  useSettingsValue,
} from "@/settings/model";
import { ModelAddDialog } from "@/settings/v2/components/ModelAddDialog";
import { ModelTable } from "@/settings/v2/components/ModelTable";
import { Notice } from "obsidian";
import React, { useState } from "react";

export const ModelSettings: React.FC = () => {
  const settings = useSettingsValue();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddEmbeddingDialog, setShowAddEmbeddingDialog] = useState(false);

  const onCopyModel = (model: CustomModel, isEmbeddingModel: boolean = false) => {
    const newModel: CustomModel = {
      ...model,
      id: crypto.randomUUID(),
      name: `${model.name} (copy)`,
    };

    const settingField: keyof CopilotSettings = isEmbeddingModel
      ? "embeddingModels"
      : "chatModels";

    updateSetting(settingField, [...settings[settingField], newModel]);
  };

  const handleModelReorder = (newModels: CustomModel[], isEmbeddingModel: boolean = false) => {
    const settingField: keyof CopilotSettings = isEmbeddingModel
      ? "embeddingModels"
      : "chatModels";
    updateSetting(settingField, newModels);
  };

  const onDeleteModel = (modelId: string) => {
    const updatedModels = settings.chatModels.filter((model) => model.id !== modelId);

    let newDefaultModelKey = settings.defaultChatModelKey;
    if (modelId === settings.defaultChatModelKey) {
      const newDefaultModel = updatedModels.find((model) => model.enabled);
      newDefaultModelKey = newDefaultModel?.id || "";
    }

    setSettings({
      chatModels: updatedModels,
      defaultChatModelKey: newDefaultModelKey,
    });
  };

  const onSetAsDefault = (modelId: string, isEmbeddingModel: boolean = false) => {
    const settingField: keyof CopilotSettings = isEmbeddingModel
      ? "defaultEmbeddingModelKey"
      : "defaultChatModelKey";
    updateSetting(settingField, modelId);
    new Notice(
      `Default ${isEmbeddingModel ? "embedding" : "chat"} model updated successfully`
    );
  };

  // Handler for updates originating from the ModelTable itself (e.g., checkbox toggles)
  const handleTableUpdate = (updatedModel: CustomModel) => {
    const updatedModels = settings.chatModels.map((m) =>
      m.id === updatedModel.id ? updatedModel : m
    );
    updateSetting("chatModels", updatedModels);
  };

  const onDeleteEmbeddingModel = (modelId: string) => {
    const updatedModels = settings.embeddingModels.filter((model) => model.id !== modelId);

    let newDefaultModelKey = settings.defaultEmbeddingModelKey;
    if (modelId === settings.defaultEmbeddingModelKey) {
      const newDefaultModel = updatedModels.find((model) => model.enabled);
      newDefaultModelKey = newDefaultModel?.id || "";
    }

    setSettings({
      embeddingModels: updatedModels,
      defaultEmbeddingModelKey: newDefaultModelKey,
    });
  };

  const handleEmbeddingModelUpdate = (updatedModel: CustomModel) => {
    const updatedModels = settings.embeddingModels.map((m) =>
      m.id === updatedModel.id ? updatedModel : m
    );
    updateSetting("embeddingModels", updatedModels);
  };

  const handleEditModel = (model: CustomModel, isEmbeddingModel: boolean = false) => {
    // For now, we'll implement inline editing in the ModelTable
    // This can be extended to use a modal if needed
    new Notice("Model editing is coming soon. Please delete and re-add the model.");
  };

  return (
    <div className="tw-space-y-4">
      <section>
        <ModelTable
          models={settings.chatModels}
          onEdit={(model) => handleEditModel(model)}
          onCopy={(model) => onCopyModel(model)}
          onDelete={onDeleteModel}
          onAdd={() => setShowAddDialog(true)}
          onUpdateModel={handleTableUpdate}
          onReorderModels={(newModels) => handleModelReorder(newModels)}
          onSetAsDefault={(modelId) => onSetAsDefault(modelId)}
          defaultModelId={settings.defaultChatModelKey}
          title="Chat Models"
          description="Add your chat models here. These models will be available in the chat interface."
        />

        {/* Chat model add dialog */}
        <ModelAddDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={(model) => {
            const updatedModels = [...settings.chatModels, model];
            updateSetting("chatModels", updatedModels);
            // If this is the first chat model, set it as default
            if (updatedModels.filter((m) => m.enabled).length === 1 && model.enabled) {
              updateSetting("defaultChatModelKey", model.id);
            }
          }}
        />

        <div className="tw-space-y-4">
          <SettingItem
            type="slider"
            title="Conversation turns in context"
            description="The number of previous conversation turns to include in the context. Default is 15 turns, i.e. 30 messages."
            value={settings.contextTurns}
            onChange={(value) => updateSetting("contextTurns", value)}
            min={1}
            max={50}
            step={1}
          />
        </div>
      </section>

      <section>
        <ModelTable
          models={settings.embeddingModels}
          onEdit={(model) => handleEditModel(model, true)}
          onDelete={onDeleteEmbeddingModel}
          onCopy={(model) => onCopyModel(model, true)}
          onAdd={() => setShowAddEmbeddingDialog(true)}
          onUpdateModel={handleEmbeddingModelUpdate}
          onReorderModels={(newModels) => handleModelReorder(newModels, true)}
          onSetAsDefault={(modelId) => onSetAsDefault(modelId, true)}
          defaultModelId={settings.defaultEmbeddingModelKey}
          title="Embedding Models"
          description="Add your embedding models here. These models are used for semantic search in your vault."
        />

        {/* Embedding model add dialog */}
        <ModelAddDialog
          open={showAddEmbeddingDialog}
          onOpenChange={setShowAddEmbeddingDialog}
          onAdd={(model) => {
            const updatedModels = [...settings.embeddingModels, model];
            updateSetting("embeddingModels", updatedModels);
            // If this is the first embedding model, set it as default
            if (updatedModels.filter((m) => m.enabled).length === 1 && model.enabled) {
              updateSetting("defaultEmbeddingModelKey", model.id);
            }
          }}
        />
      </section>
    </div>
  );
};
