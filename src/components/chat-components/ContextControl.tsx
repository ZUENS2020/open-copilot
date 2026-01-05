import React from "react";

import { SelectedTextContext } from "@/types/message";
import { TFile } from "obsidian";
import { ChatContextMenu } from "./ChatContextMenu";
import type { LexicalEditor } from "lexical";

interface ChatControlsProps {
  contextNotes: TFile[];
  includeActiveNote: boolean;
  activeNote: TFile | null;
  contextUrls: string[];
  contextFolders: string[];
  selectedTextContexts?: SelectedTextContext[];
  showProgressCard: () => void;
  lexicalEditorRef?: React.RefObject<LexicalEditor>;

  // Unified handlers
  onAddToContext: (category: string, data: unknown) => void;
  onRemoveFromContext: (category: string, data: unknown) => void;
}

export const ContextControl: React.FC<ChatControlsProps> = ({
  contextNotes,
  includeActiveNote,
  activeNote,
  contextUrls,
  contextFolders,
  selectedTextContexts,
  showProgressCard,
  lexicalEditorRef,
  onAddToContext,
  onRemoveFromContext,
}) => {
  const handleRemoveContext = (category: string, data: unknown) => {
    // Delegate to unified handler
    onRemoveFromContext(category, data);
  };

  const handleTypeaheadSelect = (category: string, data: unknown) => {
    // Delegate to unified handler
    onAddToContext(category, data);
  };

  // Context menu is now available for all chain types

  return (
    <ChatContextMenu
      includeActiveNote={includeActiveNote}
      currentActiveFile={activeNote}
      contextNotes={contextNotes}
      onRemoveContext={handleRemoveContext}
      contextUrls={contextUrls}
      contextFolders={contextFolders}
      selectedTextContexts={selectedTextContexts}
      showProgressCard={showProgressCard}
      onTypeaheadSelect={handleTypeaheadSelect}
      lexicalEditorRef={lexicalEditorRef}
    />
  );
};
