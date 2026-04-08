"use client";
import { X } from "lucide-react";
import type { UploadedImage } from "@/lib/types";

interface ImagePreviewGridProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
}

export function ImagePreviewGrid({ images, onRemove }: ImagePreviewGridProps) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
      {images.map((img) => (
        <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
          <img
            src={img.previewUrl}
            alt={img.filename}
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => onRemove(img.id)}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-xs truncate">
            {img.filename}
          </div>
        </div>
      ))}
    </div>
  );
}
