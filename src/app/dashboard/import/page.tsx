"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { StoryFormat } from "@/lib/types";
import {
  Download,
  Image,
  FileText,
  CheckCircle,
  ArrowRight,
  Eye,
  Upload,
  AlertCircle,
  X,
} from "lucide-react";

type ImportStep = "input" | "preview" | "review";

interface ImportMedia {
  id: string;
  url: string;
  description: string | null;
  position: number;
  type: "image" | "video";
  selected: boolean;
}

interface GalleryData {
  id: string;
  title: string;
  imageCount: number;
  nsfw: boolean;
  images: ImportMedia[];
}

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("input");
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<StoryFormat>("chat");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  type MediaItem = Omit<ImportMedia, "selected">;
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  async function handleImport() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to import gallery");
        return;
      }

      setGallery({
        ...data,
        images: data.images.map((img: MediaItem) => ({
          ...img,
          selected: true,
        })),
      });
      setStep("preview");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleImage(id: string) {
    if (!gallery) return;
    setGallery({
      ...gallery,
      images: gallery.images.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img
      ),
    });
  }

  function selectedImages() {
    return gallery?.images.filter((img) => img.selected) || [];
  }

  function handlePublish(asDraft: boolean) {
    setPublishing(true);
    // TODO: wire up real story creation with selected images
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
    }, 1500);
  }

  function handleReset() {
    setStep("input");
    setUrl("");
    setError("");
    setGallery(null);
    setPublished(false);
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Import from imgchest</h1>
        <p className="text-muted mt-1">
          Import image galleries from imgchest and convert them into Erovel
          stories. Paste a gallery URL, preview the content, choose your format,
          and publish.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(["input", "preview", "review"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <ArrowRight size={14} className="text-muted" />}
            <button
              onClick={() => {
                if (s === "input") handleReset();
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                step === s
                  ? "bg-accent text-white"
                  : "bg-surface-hover text-muted"
              }`}
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          </div>
        ))}
      </div>

      {/* Step: Input */}
      {step === "input" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Download size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="font-semibold">Gallery URL</h2>
                <p className="text-xs text-muted">
                  Paste an imgchest gallery link to get started
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  id="import-url"
                  placeholder="https://imgchest.com/p/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleImport();
                  }}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleImport}
                loading={loading}
                disabled={!url.trim()}
              >
                <Upload size={16} />
                Import
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Select
              label="Import Format"
              id="import-format"
              options={[
                {
                  value: "chat",
                  label: "Chat - Message bubbles with images",
                },
                {
                  value: "prose",
                  label: "Prose - Traditional story with inline images",
                },
              ]}
              value={format}
              onChange={(e) => setFormat(e.target.value as StoryFormat)}
            />
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && gallery && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Image size={20} className="text-green-500" />
                </div>
                <div>
                  <h2 className="font-semibold">{gallery.title}</h2>
                  <p className="text-xs text-muted">
                    {gallery.images.length} images found &middot;{" "}
                    {selectedImages().length} selected
                  </p>
                </div>
              </div>
              <Badge variant="accent">
                {format === "prose" ? "Prose" : "Chat"}
              </Badge>
            </div>

            <p className="text-xs text-muted mb-3">
              Click an image to deselect it from the import.
            </p>

            {/* Real image grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {gallery.images.map((media) => (
                <button
                  key={media.id}
                  onClick={() => toggleImage(media.id)}
                  className={`relative aspect-[3/4] rounded-lg border overflow-hidden transition-all cursor-pointer ${
                    media.selected
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-border opacity-40 grayscale"
                  }`}
                >
                  {media.type === "video" ? (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt={media.description || `Image ${media.position}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {!media.selected && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <X size={32} className="text-white/70" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {media.position}
                  </span>
                  {media.type === "video" && (
                    <span className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      VIDEO
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep("review")}
                disabled={selectedImages().length === 0}
              >
                Continue to Review ({selectedImages().length} images)
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && gallery && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Eye size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold">Review & Publish</h2>
                <p className="text-xs text-muted">
                  Preview how your imported content will look as a{" "}
                  {format === "prose" ? "prose story" : "chat story"}
                </p>
              </div>
            </div>

            {published ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle size={40} className="text-success mx-auto" />
                <p className="font-semibold text-lg">Successfully Imported!</p>
                <p className="text-sm text-muted">
                  Your story has been created with {selectedImages().length}{" "}
                  images.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  className="mt-4"
                >
                  Import Another
                </Button>
              </div>
            ) : (
              <>
                {/* Live preview with real images */}
                <div className="border border-border rounded-lg p-6 mb-6 max-h-[500px] overflow-y-auto space-y-4">
                  {format === "prose" ? (
                    <div className="space-y-6 max-w-lg mx-auto">
                      {selectedImages().map((media) => (
                        <div key={media.id}>
                          {media.type === "video" ? (
                            <video
                              src={media.url}
                              controls
                              playsInline
                              className="w-full rounded-lg"
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={media.url}
                              alt={media.description || `Image ${media.position}`}
                              className="w-full rounded-lg"
                              loading="lazy"
                            />
                          )}
                          {media.description && (
                            <p className="text-xs text-muted mt-1 text-center italic">
                              {media.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-md mx-auto">
                      {selectedImages().map((media, i) => (
                        <div
                          key={media.id}
                          className={`flex ${
                            i % 2 === 0 ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[260px] rounded-xl p-1.5 ${
                              i % 2 === 0
                                ? "bg-surface-hover rounded-tl-none"
                                : "bg-accent/10 rounded-tr-none"
                            }`}
                          >
                            {media.type === "video" ? (
                              <video
                                src={media.url}
                                controls
                                playsInline
                                className="w-full rounded-lg"
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={media.url}
                                alt={media.description || `Image ${media.position}`}
                                className="w-full rounded-lg"
                                loading="lazy"
                              />
                            )}
                            {media.description && (
                              <p className="text-[10px] text-muted mt-1 px-1">
                                {media.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setStep("preview")}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePublish(false)}
                    loading={publishing}
                  >
                    <Upload size={14} />
                    Publish
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePublish(true)}
                    loading={publishing}
                  >
                    <FileText size={14} />
                    Save as Draft
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
