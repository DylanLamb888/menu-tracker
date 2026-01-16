"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function PdfUpload({ onFileSelect, selectedFile }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }

  function handleRemove() {
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  if (selectedFile) {
    return (
      <div className="rounded-lg border border-[#3D2E2E]/20 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#E07A5F]/10 p-2">
              <FileText className="h-5 w-5 text-[#E07A5F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#3D2E2E]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[#3D2E2E]/50">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-[#3D2E2E]/50 hover:text-[#3D2E2E]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        isDragging
          ? "border-[#E07A5F] bg-[#E07A5F]/5"
          : "border-[#3D2E2E]/20 hover:border-[#E07A5F]/50 hover:bg-[#E07A5F]/5"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-full bg-[#E07A5F]/10 p-3">
          <Upload className="h-6 w-6 text-[#E07A5F]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#3D2E2E]">
            Drop your PDF here or click to browse
          </p>
          <p className="text-xs text-[#3D2E2E]/50 mt-1">
            PDF files only, max 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
