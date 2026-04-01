"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  src: string;
  alt?: string;
  /** All images in the gallery for prev/next navigation */
  gallery?: string[];
  onClose: () => void;
  /** Called when navigating to a different image */
  onNavigate?: (src: string) => void;
}

export function Lightbox({ src, alt, gallery, onClose, onNavigate }: LightboxProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const currentIndex = gallery?.indexOf(currentSrc) ?? -1;
  const hasPrev = gallery && currentIndex > 0;
  const hasNext = gallery && currentIndex < gallery.length - 1;

  const goNext = useCallback(() => {
    if (!gallery || currentIndex >= gallery.length - 1) return;
    const next = gallery[currentIndex + 1];
    setCurrentSrc(next);
    onNavigate?.(next);
  }, [gallery, currentIndex, onNavigate]);

  const goPrev = useCallback(() => {
    if (!gallery || currentIndex <= 0) return;
    const prev = gallery[currentIndex - 1];
    setCurrentSrc(prev);
    onNavigate?.(prev);
  }, [gallery, currentIndex, onNavigate]);

  // Sync if parent changes src
  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  // Touch swipe handling
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 cursor-pointer"
      >
        <X size={28} />
      </button>

      {/* Counter */}
      {gallery && gallery.length > 1 && (
        <div className="absolute top-4 left-4 text-white/60 text-sm z-10">
          {currentIndex + 1} / {gallery.length}
        </div>
      )}

      {/* Previous button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-10 cursor-pointer p-2"
        >
          <ChevronLeft size={36} />
        </button>
      )}

      {/* Image */}
      <img
        src={currentSrc}
        alt={alt || ""}
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-10 cursor-pointer p-2"
        >
          <ChevronRight size={36} />
        </button>
      )}
    </div>
  );
}
