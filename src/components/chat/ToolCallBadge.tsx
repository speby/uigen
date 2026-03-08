"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

export function getToolCallLabel(
  toolName: string,
  args: Record<string, unknown>
): string {
  const path = typeof args.path === "string" ? args.path : "";
  const filename = path.split("/").filter(Boolean).pop() ?? path;
  const command = typeof args.command === "string" ? args.command : "";

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":     return `Creating ${filename}`;
      case "str_replace": return `Editing ${filename}`;
      case "insert":     return `Editing ${filename}`;
      case "view":       return `Viewing ${filename}`;
      case "undo_edit":  return `Undoing edit in ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename": return `Renaming ${filename}`;
      case "delete": return `Deleting ${filename}`;
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getToolCallLabel(
    toolInvocation.toolName,
    toolInvocation.args as Record<string, unknown>
  );
  const isDone = toolInvocation.state === "result" && toolInvocation.result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
