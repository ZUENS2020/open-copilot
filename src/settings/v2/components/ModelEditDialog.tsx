// TODO: ModelEditDialog needs to be completely refactored to work with the new CustomModel structure.
// The new CustomModel only has: id, name, type, enabled, capabilities
// Old properties that no longer exist: provider, displayName, apiKey, baseUrl, bedrockRegion,
// azureOpenAIApiInstanceName, azureOpenAIApiDeploymentName, azureOpenAIApiVersion, etc.
//
// This dialog was designed for the old multi-provider model system and needs significant updates
// to work with the new unified API structure.
//
// For now, models can be managed through the settings UI using the ModelTable component.
// The onEdit functionality should be disabled in ModelTable until this dialog is updated.

// Export a placeholder to avoid breaking imports
export const ModelEditModalContent = () => null;
export class ModelEditModal {
  constructor() {
    throw new Error("ModelEditModal is disabled. Use ModelTable to manage models instead.");
  }
}
