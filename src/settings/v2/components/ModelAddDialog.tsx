import { CustomModel, generateModelId } from "@/aiParams";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODEL_CAPABILITIES, ModelCapability } from "@/constants";
import { useTab } from "@/contexts/TabContext";
import { Loader2 } from "lucide-react";
import { Notice } from "obsidian";
import React, { useState } from "react";

interface ModelAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (model: CustomModel) => void;
}

type ModelType = "chat" | "embedding";

export const ModelAddDialog: React.FC<ModelAddDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const { modalContainer } = useTab();
  const [dialogElement, setDialogElement] = useState<HTMLDivElement | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [modelName, setModelName] = useState("");
  const [modelType, setModelType] = useState<ModelType>("chat");
  const [capabilities, setCapabilities] = useState<ModelCapability[]>([]);
  const [enabled, setEnabled] = useState(true);

  // Check if the form has required fields filled
  const isFormValid = (): boolean => {
    return Boolean(modelName.trim());
  };

  // Check if buttons should be disabled
  const isButtonDisabled = (): boolean => {
    return isVerifying || !isFormValid();
  };

  const handleAdd = () => {
    if (!isFormValid()) {
      new Notice("Please enter a model name");
      return;
    }

    const newModel: CustomModel = {
      id: generateModelId(),
      name: modelName.trim(),
      type: modelType,
      enabled,
      capabilities: modelType === "chat" ? capabilities : undefined,
    };

    onAdd(newModel);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setModelName("");
    setModelType("chat");
    setCapabilities([]);
    setEnabled(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const toggleCapability = (capability: ModelCapability) => {
    setCapabilities((prev) =>
      prev.includes(capability)
        ? prev.filter((c) => c !== capability)
        : [...prev, capability]
    );
  };

  const capabilityOptions = Object.entries(MODEL_CAPABILITIES).map(([id, description]) => ({
    id: id as ModelCapability,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    description,
  }));

  const exampleModelNames = {
    chat: "gpt-4, claude-3-5-sonnet-20241022, gemini-2.5-flash",
    embedding: "text-embedding-3-small, text-embedding-ada-002",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:tw-max-w-[425px]"
        container={modalContainer}
        ref={(el) => setDialogElement(el)}
      >
        <DialogHeader>
          <DialogTitle>Add Model</DialogTitle>
          <DialogDescription>
            Add a new chat or embedding model to your collection.
          </DialogDescription>
        </DialogHeader>

        <div className="tw-space-y-4">
          {/* Model Type Selection */}
          <FormField label="Model Type">
            <Select
              value={modelType}
              onValueChange={(value) => setModelType(value as ModelType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model type" />
              </SelectTrigger>
              <SelectContent container={dialogElement}>
                <SelectItem value="chat">Chat Model</SelectItem>
                <SelectItem value="embedding">Embedding Model</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* Model Name */}
          <FormField
            label="Model Name"
            required
            description={`The model name to use in API calls. Examples: ${exampleModelNames[modelType]}`}
          >
            <Input
              type="text"
              placeholder={`e.g., ${modelType === "chat" ? "gpt-4" : "text-embedding-3-small"}`}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </FormField>

          {/* Capabilities - Only for Chat Models */}
          {modelType === "chat" && (
            <FormField
              label={
                <div className="tw-flex tw-items-center tw-gap-1.5">
                  <span className="tw-leading-none">Model Capabilities</span>
                  <HelpTooltip
                    content={
                      <div className="tw-text-sm tw-text-muted">
                        These are for display purposes only and don&apos;t affect model
                        functionality.
                      </div>
                    }
                    contentClassName="tw-max-w-96"
                  />
                </div>
              }
            >
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
                {capabilityOptions.map(({ id, label, description }) => (
                  <div key={id} className="tw-flex tw-items-center tw-gap-2">
                    <Checkbox
                      id={id}
                      checked={capabilities.includes(id)}
                      onCheckedChange={() => toggleCapability(id)}
                    />
                    <HelpTooltip content={description}>
                      <Label htmlFor={id} className="tw-cursor-pointer tw-text-sm">
                        {label}
                      </Label>
                    </HelpTooltip>
                  </div>
                ))}
              </div>
            </FormField>
          )}

          {/* Enabled Toggle */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <Checkbox
              id="model-enabled"
              checked={enabled}
              onCheckedChange={(checked: boolean) => setEnabled(checked)}
            />
            <Label htmlFor="model-enabled" className="tw-cursor-pointer">
              Enable this model
            </Label>
          </div>

          {/* Info Message */}
          <div className="tw-rounded-md tw-bg-muted tw-px-3 tw-py-2 tw-text-xs tw-text-muted">
            The API configuration (Base URL and API Key) from Basic Settings will be used for
            all models.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleAdd} disabled={isButtonDisabled()}>
            {isVerifying ? (
              <>
                <Loader2 className="tw-mr-2 tw-size-4 tw-animate-spin" />
                Adding...
              </>
            ) : (
              "Add Model"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
