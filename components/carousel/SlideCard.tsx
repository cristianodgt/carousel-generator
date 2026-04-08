"use client";
import type { CarouselSlide } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface SlideCardProps {
  slide: CarouselSlide;
  format: "square" | "portrait";
  onClick?: () => void;
}

export function SlideCard({ slide, format, onClick }: SlideCardProps) {
  const aspectRatio = format === "square" ? "aspect-square" : "aspect-[4/5]";
  const imageData = slide.composedImageBase64 || slide.generatedImageBase64;

  return (
    <div
      onClick={onClick}
      className={`
        ${aspectRatio} rounded-xl overflow-hidden cursor-pointer
        border-2 border-transparent hover:border-primary/50 transition-all
        flex-shrink-0 w-[280px] relative bg-muted
      `}
    >
      {imageData ? (
        <img
          src={`data:image/png;base64,${imageData}`}
          alt={`Slide ${slide.slideNumber}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <Skeleton className="w-full h-full" />
      )}
      <div className="absolute bottom-2 left-2">
        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {slide.slideNumber}
        </span>
      </div>
    </div>
  );
}
