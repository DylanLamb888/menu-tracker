"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type {
  AnnotationTool,
  AnnotationColor,
  AnnotationData,
  AnnotationWithAuthor,
  Point,
  PenData,
  TextData,
  CheckmarkData,
  HighlightData,
} from "@/lib/annotation-types";
import { ANNOTATION_COLORS } from "@/lib/annotation-types";
import { AnnotationToolbar } from "./annotation-toolbar";

interface AnnotationCanvasProps {
  versionId: string;
  pageNumber: number;
  width: number;
  height: number;
  canAnnotate: boolean;
}

export function AnnotationCanvas({
  versionId,
  pageNumber,
  width,
  height,
  canAnnotate,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<AnnotationWithAuthor[]>([]);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("pen");
  const [activeColor, setActiveColor] = useState<AnnotationColor>(ANNOTATION_COLORS.coral);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [highlightStart, setHighlightStart] = useState<Point | null>(null);
  const [currentHighlight, setCurrentHighlight] = useState<{ start: Point; end: Point } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState("");
  const [localAnnotations, setLocalAnnotations] = useState<AnnotationData[]>([]);
  const [undoHistory, setUndoHistory] = useState<Array<{ type: "saved"; id: string }>>([]);
  const [draggingText, setDraggingText] = useState<{
    annotationId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Fetch annotations on mount and page change
  useEffect(() => {
    async function fetchAnnotations() {
      try {
        const res = await fetch(`/api/versions/${versionId}/annotations?page=${pageNumber}`);
        if (res.ok) {
          const data = await res.json();
          setAnnotations(data.annotations);
          setLocalAnnotations([]);
        }
      } catch (error) {
        console.error("Failed to fetch annotations:", error);
      }
    }
    fetchAnnotations();
  }, [versionId, pageNumber]);

  // Draw all annotations
  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw saved annotations
    annotations.forEach((annotation) => {
      drawAnnotation(ctx, annotation.data, annotation.color, width, height);
    });

    // Draw local unsaved annotations
    localAnnotations.forEach((data) => {
      drawAnnotation(ctx, data, activeColor, width, height);
    });

    // Draw current stroke in progress
    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const startX = currentStroke[0].x * width;
      const startY = currentStroke[0].y * height;
      ctx.moveTo(startX, startY);
      currentStroke.slice(1).forEach((point) => {
        ctx.lineTo(point.x * width, point.y * height);
      });
      ctx.stroke();
    }

    // Draw highlight preview
    if (currentHighlight) {
      const x = Math.min(currentHighlight.start.x, currentHighlight.end.x) * width;
      const y = Math.min(currentHighlight.start.y, currentHighlight.end.y) * height;
      const w = Math.abs(currentHighlight.end.x - currentHighlight.start.x) * width;
      const h = Math.abs(currentHighlight.end.y - currentHighlight.start.y) * height;
      ctx.fillStyle = activeColor + "40"; // 25% opacity
      ctx.fillRect(x, y, w, h);
    }
  }, [annotations, localAnnotations, currentStroke, currentHighlight, activeColor, width, height]);

  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  // Focus text input when it appears
  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput]);

  const normalizeCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / width,
      y: (e.clientY - rect.top) / height,
    };
  };

  // Hit test for text annotations - returns annotation if clicked, null otherwise
  const hitTestTextAnnotation = (point: Point): AnnotationWithAuthor | null => {
    // Check saved annotations (most recent first)
    for (let i = annotations.length - 1; i >= 0; i--) {
      const annotation = annotations[i];
      if (annotation.data.type === "text") {
        const textData = annotation.data as TextData;
        // Approximate text bounds (fontSize in pixels, convert to normalized)
        const fontSize = textData.fontSize / Math.min(width, height);
        const textWidth = textData.content.length * fontSize * 0.6; // Rough char width estimate
        const textHeight = fontSize;

        if (
          point.x >= textData.x &&
          point.x <= textData.x + textWidth &&
          point.y >= textData.y - textHeight &&
          point.y <= textData.y
        ) {
          return annotation;
        }
      }
    }
    return null;
  };

  const saveAnnotation = async (data: AnnotationData) => {
    try {
      const res = await fetch(`/api/versions/${versionId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageNumber,
          tool: data.type,
          color: activeColor,
          data,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setAnnotations((prev) => [...prev, result.annotation]);
        // Remove from local annotations since it's now saved
        setLocalAnnotations((prev) => prev.filter((a) => a !== data));
        // Add to undo history
        setUndoHistory((prev) => [...prev, { type: "saved", id: result.annotation.id }]);
      }
    } catch (error) {
      console.error("Failed to save annotation:", error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canAnnotate || !showToolbar) return;
    const point = normalizeCoords(e);

    switch (activeTool) {
      case "pen":
        setIsDrawing(true);
        setCurrentStroke([point]);
        break;
      case "text": {
        // Check if clicking on existing text annotation to drag it
        const hitAnnotation = hitTestTextAnnotation(point);
        if (hitAnnotation && hitAnnotation.data.type === "text") {
          const textData = hitAnnotation.data as TextData;
          setDraggingText({
            annotationId: hitAnnotation.id,
            offsetX: point.x - textData.x,
            offsetY: point.y - textData.y,
          });
          break;
        }

        // If there's existing text input, save it first
        if (textInput && textValue.trim()) {
          const textData: TextData = {
            type: "text",
            x: textInput.x,
            y: textInput.y,
            content: textValue.trim(),
            fontSize: 14,
          };
          setLocalAnnotations((prev) => [...prev, textData]);
          saveAnnotation(textData);
        }
        // Create new input at clicked position
        setTextInput({ x: point.x, y: point.y });
        setTextValue("");
        break;
      }
      case "checkmark": {
        const checkData: CheckmarkData = {
          type: "checkmark",
          x: point.x,
          y: point.y,
          size: 0.03,
        };
        setLocalAnnotations((prev) => [...prev, checkData]);
        saveAnnotation(checkData);
        break;
      }
      case "highlight":
        setIsDrawing(true);
        setHighlightStart(point);
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = normalizeCoords(e);

    // Handle text dragging
    if (draggingText && canAnnotate) {
      const newX = point.x - draggingText.offsetX;
      const newY = point.y - draggingText.offsetY;
      // Update annotation position in state for immediate visual feedback
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === draggingText.annotationId && a.data.type === "text"
            ? { ...a, data: { ...a.data, x: newX, y: newY } as TextData }
            : a
        )
      );
      return;
    }

    if (!isDrawing || !canAnnotate) return;

    if (activeTool === "pen") {
      setCurrentStroke((prev) => [...prev, point]);
    } else if (activeTool === "highlight" && highlightStart) {
      setCurrentHighlight({ start: highlightStart, end: point });
    }
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canAnnotate) return;

    // Handle text drag end - save position to server
    if (draggingText) {
      const annotation = annotations.find((a) => a.id === draggingText.annotationId);
      if (annotation) {
        try {
          await fetch(`/api/versions/${versionId}/annotations`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              annotationId: draggingText.annotationId,
              data: annotation.data,
            }),
          });
        } catch (error) {
          console.error("Failed to update annotation position:", error);
        }
      }
      setDraggingText(null);
      return;
    }

    if (activeTool === "pen" && currentStroke.length > 1) {
      const penData: PenData = {
        type: "pen",
        points: currentStroke,
        strokeWidth: 2,
      };
      setLocalAnnotations((prev) => [...prev, penData]);
      saveAnnotation(penData);
    }

    if (activeTool === "highlight" && highlightStart) {
      const point = normalizeCoords(e);
      const highlightData: HighlightData = {
        type: "highlight",
        x: Math.min(highlightStart.x, point.x),
        y: Math.min(highlightStart.y, point.y),
        width: Math.abs(point.x - highlightStart.x),
        height: Math.abs(point.y - highlightStart.y),
      };
      if (highlightData.width > 0.01 && highlightData.height > 0.01) {
        setLocalAnnotations((prev) => [...prev, highlightData]);
        saveAnnotation(highlightData);
      }
    }

    setIsDrawing(false);
    setCurrentStroke([]);
    setHighlightStart(null);
    setCurrentHighlight(null);
  };

  const handleTextSubmit = (forceClose = false) => {
    if (!textInput) return;

    // If there's text, save it
    if (textValue.trim()) {
      const textData: TextData = {
        type: "text",
        x: textInput.x,
        y: textInput.y,
        content: textValue.trim(),
        fontSize: 14,
      };
      setLocalAnnotations((prev) => [...prev, textData]);
      saveAnnotation(textData);
      setTextInput(null);
      setTextValue("");
    } else if (forceClose) {
      // Only close empty input if explicitly requested (Escape key or clicking outside canvas)
      setTextInput(null);
      setTextValue("");
    }
    // Otherwise keep the input open so user can type
  };

  const handleUndo = useCallback(async () => {
    if (undoHistory.length === 0) return;

    const lastAction = undoHistory[undoHistory.length - 1];

    // Remove from undo history first
    setUndoHistory((prev) => prev.slice(0, -1));

    // Call DELETE API
    try {
      const res = await fetch(
        `/api/versions/${versionId}/annotations?annotationId=${lastAction.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        // Remove from annotations state
        setAnnotations((prev) => prev.filter((a) => a.id !== lastAction.id));
      } else {
        // If failed, restore undo history
        setUndoHistory((prev) => [...prev, lastAction]);
        console.error("Failed to undo annotation");
      }
    } catch (error) {
      // If failed, restore undo history
      setUndoHistory((prev) => [...prev, lastAction]);
      console.error("Failed to undo annotation:", error);
    }
  }, [undoHistory, versionId]);

  if (width === 0 || height === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Toggle button */}
      {canAnnotate && (
        <button
          className={`absolute top-2 right-2 z-10 px-3 py-1.5 text-xs font-medium rounded-md shadow-sm pointer-events-auto transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E07A5F] ${
            showToolbar
              ? "bg-[#E07A5F] text-white"
              : "bg-white text-[#3D2E2E] border border-[#3D2E2E]/20 hover:bg-[#3D2E2E]/5"
          }`}
          onClick={() => setShowToolbar(!showToolbar)}
          aria-pressed={showToolbar}
        >
          {showToolbar ? "Done" : "Annotate"}
        </button>
      )}

      {/* Toolbar */}
      {canAnnotate && showToolbar && (
        <div className="absolute top-2 left-2 z-10 pointer-events-auto">
          <AnnotationToolbar
            activeTool={activeTool}
            activeColor={activeColor}
            onToolChange={setActiveTool}
            onColorChange={setActiveColor}
            onUndo={handleUndo}
            canUndo={undoHistory.length > 0}
          />
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`absolute inset-0 ${
          showToolbar && canAnnotate
            ? draggingText
              ? "pointer-events-auto cursor-grabbing"
              : "pointer-events-auto cursor-crosshair"
            : ""
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDrawing) {
            setIsDrawing(false);
            setCurrentStroke([]);
            setHighlightStart(null);
            setCurrentHighlight(null);
          }
          if (draggingText) {
            setDraggingText(null);
          }
        }}
      />

      {/* Text input */}
      {textInput && (
        <input
          ref={textInputRef}
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={() => handleTextSubmit(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTextSubmit(true);
            if (e.key === "Escape") handleTextSubmit(true);
          }}
          className="absolute pointer-events-auto bg-white border border-[#3D2E2E]/30 rounded px-1 py-0.5 text-sm focus:border-[#E07A5F] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30"
          style={{
            left: textInput.x * width,
            top: textInput.y * height,
            minWidth: "100px",
          }}
          aria-label="Annotation text"
          autoComplete="off"
        />
      )}
    </div>
  );
}

function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  data: AnnotationData,
  color: string,
  width: number,
  height: number
) {
  switch (data.type) {
    case "pen": {
      if (data.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = data.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(data.points[0].x * width, data.points[0].y * height);
      data.points.slice(1).forEach((point) => {
        ctx.lineTo(point.x * width, point.y * height);
      });
      ctx.stroke();
      break;
    }
    case "text": {
      ctx.font = `${data.fontSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(data.content, data.x * width, data.y * height);
      break;
    }
    case "checkmark": {
      const x = data.x * width;
      const y = data.y * height;
      const size = data.size * Math.min(width, height);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(x - size * 0.3, y);
      ctx.lineTo(x, y + size * 0.3);
      ctx.lineTo(x + size * 0.6, y - size * 0.4);
      ctx.stroke();
      break;
    }
    case "highlight": {
      ctx.fillStyle = color + "40"; // 25% opacity
      ctx.fillRect(
        data.x * width,
        data.y * height,
        data.width * width,
        data.height * height
      );
      break;
    }
  }
}
