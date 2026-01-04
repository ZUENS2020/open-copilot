import { CustomModel } from "@/aiParams";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MobileCard, MobileCardDropdownAction } from "@/components/ui/mobile-card";
import { ModelCapabilityIcons } from "@/components/ui/model-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { MODEL_CAPABILITIES, ModelCapability } from "@/constants";
import { cn } from "@/lib/utils";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  Eye,
  Globe,
  GripVertical,
  Lightbulb,
  LucideProps,
  MoreVertical,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import React, { ForwardRefExoticComponent, RefAttributes, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CAPABILITY_ICONS: Record<
  ModelCapability,
  {
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
    color: string;
    tooltip: string;
  }
> = {
  [ModelCapability.REASONING]: {
    icon: Lightbulb,
    color: "tw-text-model-capabilities-blue",
    tooltip: MODEL_CAPABILITIES.reasoning,
  },
  [ModelCapability.VISION]: {
    icon: Eye,
    color: "tw-text-model-capabilities-green",
    tooltip: MODEL_CAPABILITIES.vision,
  },
  [ModelCapability.WEB_SEARCH]: {
    icon: Globe,
    color: "tw-text-model-capabilities-blue",
    tooltip: MODEL_CAPABILITIES.websearch,
  },
} as const;

const CAPABILITY_ORDER = [
  ModelCapability.REASONING,
  ModelCapability.VISION,
  ModelCapability.WEB_SEARCH,
] as const;

interface ModelTableHeaderProps {
  title: string;
  description?: string;
  onAdd: () => void;
}

/**
 * Renders the model table header with a title and aligned action buttons.
 */
const ModelTableHeader: React.FC<ModelTableHeaderProps> = ({ title, description, onAdd }) => (
  <div className="tw-mb-3 tw-flex tw-flex-col tw-gap-2 md:tw-flex-row md:tw-items-center md:tw-justify-between">
    <div>
      <h3 className="tw-text-xl tw-font-bold">{title}</h3>
      {description && <p className="tw-text-sm tw-text-muted">{description}</p>}
    </div>
    <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-end">
      <Button onClick={onAdd} variant="default" className="tw-flex tw-items-center tw-gap-2">
        <Plus className="tw-size-2 md:tw-size-4" />
        Add Model
      </Button>
    </div>
  </div>
);

const renderCapabilities = (model: CustomModel) => {
  return (
    <div className="tw-mx-auto tw-grid tw-w-16 tw-grid-cols-3 tw-gap-1">
      {CAPABILITY_ORDER.map((capability) => {
        const config = CAPABILITY_ICONS[capability];
        if (!config) return <div key={capability} className="tw-w-4" />;

        const Icon = config.icon;
        const hasCapability = model.capabilities?.includes(capability);

        return hasCapability ? (
          <HelpTooltip key={capability} content={config.tooltip} side="bottom">
            <div className="tw-flex tw-items-center tw-justify-center">
              <Icon className={cn("tw-size-4", config.color)} />
            </div>
          </HelpTooltip>
        ) : (
          <div key={capability} className="tw-flex tw-items-center tw-justify-center">
            <div className="tw-size-4" />
          </div>
        );
      })}
    </div>
  );
};

interface ModelCardProps {
  model: CustomModel;
  onEdit?: (model: CustomModel) => void;
  onCopy?: (model: CustomModel) => void;
  onDelete: (modelId: string) => void;
  onSetAsDefault?: (modelId: string) => void;
  onUpdateModel: (model: CustomModel) => void;
  id: string;
  containerRef: React.RefObject<HTMLDivElement>;
  isDefault: boolean;
}

const ModelCard: React.FC<ModelCardProps> = ({
  model,
  onEdit,
  onCopy,
  onDelete,
  onSetAsDefault,
  onUpdateModel,
  id,
  containerRef,
  isDefault,
}) => {
  const dropdownActions: MobileCardDropdownAction<CustomModel>[] = [];

  if (onSetAsDefault && !isDefault) {
    dropdownActions.push({
      icon: <Star className="tw-size-4" />,
      label: "Set as Default",
      onClick: () => onSetAsDefault(model.id),
    });
  }

  // Edit functionality is disabled until ModelEditDialog is refactored
  // if (onEdit) {
  //   dropdownActions.push({
  //     icon: <PencilLine className="tw-size-4" />,
  //     label: "Edit",
  //     onClick: () => onEdit(model),
  //   });
  // }

  dropdownActions.push({
    icon: <Copy className="tw-size-4" />,
    label: "Copy",
    onClick: () => onCopy?.(model),
  });

  dropdownActions.push({
    icon: <Trash2 className="tw-size-4" />,
    label: "Delete",
    onClick: () => onDelete(model.id),
    variant: "destructive",
  });

  const expandedContent = (
    <div className="tw-flex tw-justify-around">
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-sm">Enabled</span>
        <Checkbox
          checked={model.enabled}
          onCheckedChange={(checked: boolean) => onUpdateModel({ ...model, enabled: checked })}
        />
      </div>
    </div>
  );

  return (
    <MobileCard
      id={id}
      item={model}
      title={model.name}
      subtitle={model.type === "chat" ? "Chat Model" : "Embedding Model"}
      badge={
        isDefault ? (
          <div className="tw-bg-accent tw-flex tw-items-center tw-gap-1 tw-rounded-md tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-on-accent">
            <Star className="tw-size-3 tw-fill-current" />
            Default
          </div>
        ) : model.capabilities && model.capabilities.length > 0 ? (
          <ModelCapabilityIcons capabilities={model.capabilities} iconSize={14} />
        ) : undefined
      }
      isDraggable
      isExpandable
      expandedContent={expandedContent}
      primaryAction={undefined /* Edit disabled until ModelEditDialog is refactored */}
      dropdownActions={dropdownActions}
      containerRef={containerRef}
    />
  );
};

const DesktopSortableTableRow: React.FC<{
  model: CustomModel;
  onEdit?: (model: CustomModel) => void;
  onCopy?: (model: CustomModel) => void;
  onDelete: (modelId: string) => void;
  onSetAsDefault?: (modelId: string) => void;
  onUpdateModel: (model: CustomModel) => void;
  isEmbeddingModel: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  isDefault: boolean;
}> = ({
  model,
  onEdit,
  onCopy,
  onDelete,
  onSetAsDefault,
  onUpdateModel,
  isEmbeddingModel,
  containerRef,
  isDefault,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: model.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const showDropdownMenu = true;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "tw-transition-colors tw-duration-200 hover:tw-bg-interactive-accent/10",
        isDragging &&
          "tw-relative tw-z-[100] tw-cursor-grabbing tw-shadow-lg tw-backdrop-blur-sm tw-border-accent/50 tw-bg-primary/90"
      )}
    >
      <TableCell className="tw-w-6 tw-px-2">
        <Button
          variant="ghost"
          size="icon"
          className="tw-size-6 tw-cursor-grab tw-touch-none tw-p-0 hover:tw-cursor-grab active:tw-cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="tw-size-4 tw-transition-colors" />
        </Button>
      </TableCell>
      <TableCell className="tw-pl-0">
        <div className="tw-flex tw-items-center tw-gap-2">
          <span>{model.name}</span>
          {isDefault && (
            <div className="tw-bg-accent tw-flex tw-items-center tw-gap-1 tw-rounded-md tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-on-accent">
              <Star className="tw-size-3 tw-fill-current" />
              Default
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>{renderCapabilities(model)}</TableCell>
      {!isEmbeddingModel && (
        <TableCell className="tw-text-center">
          <Checkbox
            id={`${model.id}-enabled`}
            checked={model.enabled}
            onCheckedChange={(checked: boolean) => onUpdateModel({ ...model, enabled: checked })}
            className="tw-mx-auto"
          />
        </TableCell>
      )}
      <TableCell className="tw-text-center">
        <div className="tw-flex tw-justify-center tw-gap-2">
          {onSetAsDefault && !isDefault && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSetAsDefault(model.id)}
              className="tw-shadow-sm tw-transition-shadow hover:tw-shadow-md"
              title="Set as Default"
            >
              <Star className="tw-size-4" />
            </Button>
          )}

          {showDropdownMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="tw-size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" container={containerRef.current}>
                {onSetAsDefault && !isDefault && (
                  <DropdownMenuItem onClick={() => onSetAsDefault(model.id)}>
                    <Star className="tw-mr-2 tw-size-4" />
                    Set as Default
                  </DropdownMenuItem>
                )}

                {/* Edit disabled until ModelEditDialog is refactored */}
                {/* {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(model)}>
                    <PencilLine className="tw-mr-2 tw-size-4" />
                    Edit
                  </DropdownMenuItem>
                )} */}

                {onCopy && (
                  <DropdownMenuItem onClick={() => onCopy(model)}>
                    <Copy className="tw-mr-2 tw-size-4" />
                    Copy
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => onDelete(model.id)} className="tw-text-error">
                  <Trash2 className="tw-mr-2 tw-size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

interface ModelTableProps {
  models: CustomModel[];
  onEdit?: (model: CustomModel) => void; // TODO: Disabled until ModelEditDialog is refactored
  onCopy?: (model: CustomModel) => void;
  onDelete: (modelId: string) => void;
  onAdd: () => void;
  onUpdateModel: (model: CustomModel) => void;
  onReorderModels?: (newModels: CustomModel[]) => void;
  onSetAsDefault?: (modelId: string) => void;
  defaultModelId?: string;
  title: string;
  description?: string;
}

export const ModelTable: React.FC<ModelTableProps> = ({
  models,
  onEdit,
  onCopy,
  onDelete,
  onAdd,
  onUpdateModel,
  onReorderModels,
  onSetAsDefault,
  defaultModelId,
  title,
  description,
}) => {
  const isEmbeddingModel = !!(models.length > 0 && models[0].type === "embedding");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorderModels) {
      const oldIndex = models.findIndex((model) => model.id === active.id);
      const newIndex = models.findIndex((model) => model.id === over.id);

      const newModels = arrayMove(models, oldIndex, newIndex);
      onReorderModels(newModels);
    }
  };

  // Mobile view rendering
  const renderMobileView = () => (
    <div className="tw-relative md:tw-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        autoScroll={{
          enabled: true,
          acceleration: 10,
          threshold: {
            x: 0,
            y: 0.2,
          },
        }}
      >
        <SortableContext
          items={models.map((model) => model.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="tw-relative tw-touch-auto tw-space-y-2 tw-overflow-auto tw-pb-2">
            {models.map((model) => (
              <ModelCard
                key={model.id}
                id={model.id}
                containerRef={containerRef}
                model={model}
                onEdit={onEdit}
                onCopy={onCopy}
                onDelete={onDelete}
                onSetAsDefault={onSetAsDefault}
                onUpdateModel={onUpdateModel}
                isDefault={model.id === defaultModelId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );

  return (
    <div ref={containerRef} className="tw-mb-4">
      <ModelTableHeader title={title} description={description} onAdd={onAdd} />
      {/* Desktop view */}
      <div className="tw-hidden md:tw-block">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="tw-relative tw-overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="tw-w-6 tw-px-2"></TableHead>
                  <TableHead className="tw-pl-0">Model</TableHead>
                  <TableHead className="tw-text-center">Capabilities</TableHead>
                  {!isEmbeddingModel && <TableHead className="tw-text-center">Enable</TableHead>}
                  <TableHead className="tw-w-[100px] tw-text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tw-relative">
                <SortableContext
                  items={models.map((model) => model.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {models.map((model) => (
                    <DesktopSortableTableRow
                      key={model.id}
                      containerRef={containerRef}
                      model={model}
                      onEdit={onEdit}
                      onCopy={onCopy}
                      onDelete={onDelete}
                      onSetAsDefault={onSetAsDefault}
                      onUpdateModel={onUpdateModel}
                      isEmbeddingModel={isEmbeddingModel}
                      isDefault={model.id === defaultModelId}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </div>
        </DndContext>
      </div>

      {/* Mobile view */}
      {renderMobileView()}
    </div>
  );
};
