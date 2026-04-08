"use client";
import { useCallback, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { isImageFile } from "@/lib/image-utils";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files).filter(isImageFile);
      if (files.length > 0) onFiles(files);
    },
    [onFiles, disabled]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.heic,.heif";
    input.onchange = () => {
      const files = Array.from(input.files || []).filter(isImageFile);
      if (files.length > 0) onFiles(files);
    };
    input.click();
  }, [onFiles, disabled]);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-200
        ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div className="flex flex-col items-center gap-4">
        {isDragging ? (
          <ImagePlus className="w-12 h-12 text-primary animate-pulse" />
        ) : (
          <Upload className="w-12 h-12 text-muted-foreground" />
        )}
        <div>
          <p className="text-lg font-medium">
            {isDragging ? "Solte as imagens aqui" : "Arraste imagens ou clique para selecionar"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            JPG, PNG, WebP, HEIC - Max 10 imagens, 10MB cada
          </p>
        </div>
      </div>
    </div>
  );
}
