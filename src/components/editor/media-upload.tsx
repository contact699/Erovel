"use client";

import { cn } from "@/lib/utils";
import { Upload, X, FileImage, FileVideo } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface MediaUploadProps {
  onUpload: (url: string, file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUpload({
  onUpload,
  accept = "image/*,video/*,.gif",
  maxSize = 50 * 1024 * 1024,
  className,
}: MediaUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (f: File) => {
      setError(null);

      if (f.size > maxSize) {
        setError(`File too large. Maximum size is ${formatFileSize(maxSize)}.`);
        return;
      }

      const url = URL.createObjectURL(f);
      setFile(f);
      setPreview(url);
      onUpload(url, f);
    },
    [maxSize, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [preview]);

  const isVideo = file?.type.startsWith("video/");

  return (
    <div className={cn("space-y-3", className)}>
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
            isDragging
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50 hover:bg-surface-hover"
          )}
        >
          <Upload className="h-8 w-8 text-muted" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drop a file here, or click to browse
            </p>
            <p className="text-xs text-muted mt-1">
              Images, GIFs, and videos up to {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg border border-border overflow-hidden bg-surface">
          {isVideo ? (
            <div className="flex items-center justify-center p-6 bg-surface-hover">
              <FileVideo className="h-12 w-12 text-muted" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-64 object-contain"
            />
          )}
          <div className="flex items-center justify-between p-3 border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              {isVideo ? (
                <FileVideo className="h-4 w-4 text-muted shrink-0" />
              ) : (
                <FileImage className="h-4 w-4 text-muted shrink-0" />
              )}
              <span className="text-sm text-foreground truncate">
                {file?.name}
              </span>
              <span className="text-xs text-muted shrink-0">
                {file ? formatFileSize(file.size) : ""}
              </span>
            </div>
            <button
              onClick={handleRemove}
              className="text-muted hover:text-danger transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
