"use client";

import { cn } from "@/lib/utils";
import { Upload, X, FileImage, FileVideo, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface MediaUploadProps {
  onUpload: (url: string, file: File) => void;
  accept?: string;
  maxSize?: number;
  videoMaxSize?: number;
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
  videoMaxSize = 2 * 1024 * 1024 * 1024, // 2 GB — Bunny Stream's hard limit is much higher
  className,
}: MediaUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const acceptsVideo = accept.includes("video/");
  const helperText = acceptsVideo
    ? videoMaxSize === maxSize
      ? `Files up to ${formatFileSize(maxSize)}`
      : `Files up to ${formatFileSize(maxSize)}. Videos up to ${formatFileSize(videoMaxSize)}`
    : accept.includes("image/")
      ? `Images up to ${formatFileSize(maxSize)}`
      : `Files up to ${formatFileSize(maxSize)}`;

  const uploadImage = useCallback(async (f: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", f);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.media.url as string;
  }, []);

  const uploadVideo = useCallback(async (f: File): Promise<string> => {
    // Step 1: get upload session from server
    const sessionResponse = await fetch("/api/upload/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: f.name }),
    });

    if (!sessionResponse.ok) {
      const data = await sessionResponse.json().catch(() => ({}));
      throw new Error(data.error || "Failed to create upload session");
    }

    const session = await sessionResponse.json();

    // Step 2: dynamically import tus-js-client (keeps it out of the main bundle)
    const tus = await import("tus-js-client");

    // Step 3: upload directly to Bunny Stream via TUS
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(f, {
        endpoint: session.uploadUrl,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: session.authorizationSignature,
          AuthorizationExpire: String(session.authorizationExpire),
          VideoId: session.videoGuid,
          LibraryId: session.libraryId,
        },
        metadata: {
          filetype: f.type,
          title: f.name,
        },
        chunkSize: 50 * 1024 * 1024, // 50 MB chunks (Bunny recommends multi-MB chunks)
        onError: (err) => {
          reject(new Error(`Video upload failed: ${err.message}`));
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
        },
        onSuccess: async () => {
          // Step 4: tell our server the upload is done so it inserts the media row
          try {
            const completeResponse = await fetch("/api/upload/stream/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoGuid: session.videoGuid,
                fileSize: f.size,
              }),
            });

            if (!completeResponse.ok) {
              const data = await completeResponse.json().catch(() => ({}));
              reject(new Error(data.error || "Failed to record upload"));
              return;
            }

            const data = await completeResponse.json();
            resolve(data.media.url as string);
          } catch (err) {
            reject(err instanceof Error ? err : new Error("Failed to record upload"));
          }
        },
      });

      upload.start();
    });
  }, []);

  const handleFile = useCallback(
    async (f: File) => {
      setError(null);
      setProgress(0);

      const isVideoFile = f.type.startsWith("video/");
      const fileMaxSize = isVideoFile ? videoMaxSize : maxSize;
      if (f.size > fileMaxSize) {
        setError(`File too large. Maximum size is ${formatFileSize(fileMaxSize)}.`);
        return;
      }

      const localPreview = URL.createObjectURL(f);
      setFile(f);
      setPreview(localPreview);
      setUploading(true);

      try {
        const url = isVideoFile ? await uploadVideo(f) : await uploadImage(f);
        onUpload(url, f);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(msg);
        URL.revokeObjectURL(localPreview);
        setPreview(null);
        setFile(null);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [maxSize, onUpload, videoMaxSize, uploadImage, uploadVideo]
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
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setError(null);
    setProgress(0);
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
            <p className="text-xs text-muted mt-1">{helperText}</p>
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
            <img src={preview} alt="Preview" className="w-full max-h-64 object-contain" />
          )}
          <div className="flex items-center justify-between p-3 border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              {isVideo ? (
                <FileVideo className="h-4 w-4 text-muted shrink-0" />
              ) : (
                <FileImage className="h-4 w-4 text-muted shrink-0" />
              )}
              <span className="text-sm text-foreground truncate">{file?.name}</span>
              <span className="text-xs text-muted shrink-0">
                {file ? formatFileSize(file.size) : ""}
              </span>
            </div>
            {uploading ? (
              <div className="flex items-center gap-2 shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-xs text-muted">{progress}%</span>
              </div>
            ) : (
              <button
                onClick={handleRemove}
                className="text-muted hover:text-danger transition-colors shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {uploading && (
            <div className="h-1 bg-surface-hover overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
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
