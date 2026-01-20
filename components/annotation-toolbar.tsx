"use client";

import { Button } from "@/components/ui/button";
import {
  Pencil,
  Type,
  Check,
  Highlighter,
  Undo2,
} from "lucide-react";
import type { AnnotationTool, AnnotationColor } from "@/lib/annotation-types";
import { ANNOTATION_COLORS } from "@/lib/annotation-types";

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  activeColor: AnnotationColor;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: AnnotationColor) => void;
  onUndo: () => void;
  canUndo: boolean;
}

const tools: { id: AnnotationTool; icon: React.ReactNode; label: string }[] = [
  { id: "pen", icon: <Pencil className="size-4" aria-hidden="true" />, label: "Pen" },
  { id: "text", icon: <Type className="size-4" aria-hidden="true" />, label: "Text" },
  { id: "checkmark", icon: <Check className="size-4" aria-hidden="true" />, label: "Checkmark" },
  { id: "highlight", icon: <Highlighter className="size-4" aria-hidden="true" />, label: "Highlight" },
];

const colors: { id: AnnotationColor; label: string }[] = [
  { id: ANNOTATION_COLORS.coral, label: "Coral" },
  { id: ANNOTATION_COLORS.blue, label: "Blue" },
  { id: ANNOTATION_COLORS.black, label: "Black" },
];

export function AnnotationToolbar({
  activeTool,
  activeColor,
  onToolChange,
  onColorChange,
  onUndo,
  canUndo,
}: AnnotationToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white border border-[#3D2E2E]/10 rounded-lg shadow-sm">
      {/* Tool buttons */}
      <div className="flex items-center gap-1 border-r border-[#3D2E2E]/10 pr-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "ghost"}
            size="sm"
            className={`size-8 p-0 ${
              activeTool === tool.id
                ? "bg-[#E07A5F] hover:bg-[#E07A5F]/90"
                : ""
            }`}
            onClick={() => onToolChange(tool.id)}
            aria-label={tool.label}
            aria-pressed={activeTool === tool.id}
          >
            {tool.icon}
          </Button>
        ))}
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-1 border-r border-[#3D2E2E]/10 pr-2">
        {colors.map((color) => (
          <button
            key={color.id}
            className={`size-6 rounded-full border-2 transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E07A5F] ${
              activeColor === color.id
                ? "border-[#3D2E2E] scale-110"
                : "border-transparent hover:border-[#3D2E2E]/30"
            }`}
            style={{ backgroundColor: color.id }}
            onClick={() => onColorChange(color.id)}
            aria-label={`${color.label} color`}
            aria-pressed={activeColor === color.id}
          />
        ))}
      </div>

      {/* Undo */}
      <Button
        variant="ghost"
        size="sm"
        className="size-8 p-0"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last annotation"
      >
        <Undo2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
