/**
 * UniversalActionBar — PRD Sections 5.2 & 5.3
 * REQUIRED on every page. Text buttons only.
 * Only allowed icon: 📎 (paperclip) for Upload.
 */

import React, { useRef } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEditContext } from "@/context/EditContext";

interface UniversalActionBarProps {
  pageName?: string;
  onUpload?: (file: File) => void;
  onDownload?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  hide?: Array<"upload" | "download" | "save" | "delete" | "edit" | "share">;
}

export function UniversalActionBar({
  pageName = "Page",
  onUpload,
  onDownload,
  onSave,
  onDelete,
  onEdit,
  onShare,
  hide = [],
}: UniversalActionBarProps) {
  const { isEditing, toggleEditing, handleSave, handleDownload, handleUpload } = useEditContext();
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onUpload) { onUpload(file); } else { handleUpload(file); }
    toast.success(`File uploaded to ${pageName}`);
    e.target.value = "";
  };

  const handleDownloadClick = () => {
    if (onDownload) { onDownload(); } else { handleDownload(); }
    toast.success(`${pageName} data exported`);
  };

  const handleSaveClick = () => {
    if (onSave) { onSave(); } else { handleSave(); }
    toast.success(`${pageName} saved`);
  };

  const handleEditClick = () => {
    if (onEdit) { onEdit(); } else { toggleEditing(); }
  };

  const handleShareClick = () => {
    if (onShare) { onShare(); } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) { onDelete(); } else { toast.info("Select an item to delete"); }
  };

  const isHidden = (action: string) => hide.includes(action as any);

  return (
    <div role="toolbar" aria-label="Page actions" className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card p-3">
      {!isHidden("upload") && (
        <>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => uploadRef.current?.click()}>
            <Paperclip className="h-3.5 w-3.5" />
            Upload
          </Button>
          <input ref={uploadRef} type="file" accept=".json,.csv,.txt,.pdf,.doc,.docx,.xlsx,.pptx,.md,.html,image/*,audio/*,video/*" className="hidden" onChange={handleFileUpload} />
        </>
      )}
      {!isHidden("download") && (<Button size="sm" variant="outline" className="h-8 rounded-xl text-xs" onClick={handleDownloadClick}>Download</Button>)}
      {!isHidden("save") && (<Button size="sm" variant="outline" className="h-8 rounded-xl text-xs" onClick={handleSaveClick}>{isEditing ? "Save changes" : "Save"}</Button>)}
      {!isHidden("edit") && (<Button size="sm" variant={isEditing ? "default" : "outline"} className="h-8 rounded-xl text-xs" onClick={handleEditClick}>{isEditing ? "Done editing" : "Edit"}</Button>)}
      {!isHidden("share") && (<Button size="sm" variant="outline" className="h-8 rounded-xl text-xs" onClick={handleShareClick}>Share</Button>)}
      {!isHidden("delete") && (<Button size="sm" variant="outline" className="h-8 rounded-xl border-destructive/40 text-xs text-destructive hover:bg-destructive/10" onClick={handleDeleteClick}>Delete</Button>)}
    </div>
  );
}
