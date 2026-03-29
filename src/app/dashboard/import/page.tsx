"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  formatDate,
  formatRelativeDate,
} from "@/lib/utils";
import type { StoryFormat } from "@/lib/types";
import {
  Download,
  Image,
  FileText,
  CheckCircle,
  ExternalLink,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Eye,
  Upload,
} from "lucide-react";

type ImportStep = "input" | "preview" | "review";

interface ImportHistoryItem {
  id: string;
  url: string;
  title: string;
  format: StoryFormat;
  imageCount: number;
  status: "published" | "draft";
  importedAt: string;
}

const mockImportHistory: ImportHistoryItem[] = [
  {
    id: "imp-1",
    url: "https://imgchest.com/p/abc123",
    title: "Midnight Rendezvous Gallery",
    format: "prose",
    imageCount: 12,
    status: "published",
    importedAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "imp-2",
    url: "https://imgchest.com/p/def456",
    title: "Whispered Confessions",
    format: "chat",
    imageCount: 8,
    status: "draft",
    importedAt: "2026-03-10T14:30:00Z",
  },
  {
    id: "imp-3",
    url: "https://imgchest.com/p/ghi789",
    title: "Summer Heat Series",
    format: "prose",
    imageCount: 15,
    status: "published",
    importedAt: "2026-02-28T08:00:00Z",
  },
];

const mockPreviewImages = [
  { id: 1, alt: "Scene 1", width: 400, height: 600 },
  { id: 2, alt: "Scene 2", width: 400, height: 500 },
  { id: 3, alt: "Scene 3", width: 400, height: 550 },
  { id: 4, alt: "Scene 4", width: 400, height: 480 },
  { id: 5, alt: "Scene 5", width: 400, height: 620 },
  { id: 6, alt: "Scene 6", width: 400, height: 530 },
];

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("input");
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<StoryFormat>("prose");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  function handleImport() {
    if (!url.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("preview");
    }, 1500);
  }

  function handleProceedToReview() {
    setStep("review");
  }

  function handlePublish(asDraft: boolean) {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
      setTimeout(() => {
        setStep("input");
        setUrl("");
        setPublished(false);
      }, 2000);
    }, 1500);
  }

  function handleReset() {
    setStep("input");
    setUrl("");
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
            {i > 0 && (
              <ArrowRight size={14} className="text-muted" />
            )}
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

            <Select
              label="Import Format"
              id="import-format"
              options={[
                { value: "prose", label: "Prose - Traditional story with inline images" },
                { value: "chat", label: "Chat - Message bubbles with images" },
              ]}
              value={format}
              onChange={(e) => setFormat(e.target.value as StoryFormat)}
            />
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Image size={20} className="text-green-500" />
                </div>
                <div>
                  <h2 className="font-semibold">Import Preview</h2>
                  <p className="text-xs text-muted">
                    {mockPreviewImages.length} images found in gallery
                  </p>
                </div>
              </div>
              <Badge variant="accent">
                {format === "prose" ? "Prose" : "Chat"}
              </Badge>
            </div>

            {/* Image grid preview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {mockPreviewImages.map((img) => (
                <div
                  key={img.id}
                  className="aspect-[3/4] bg-gradient-to-br from-accent/5 to-accent/15 rounded-lg border border-border flex flex-col items-center justify-center gap-2 relative overflow-hidden"
                >
                  <Image size={24} className="text-accent/40" />
                  <span className="text-xs text-muted">{img.alt}</span>
                  <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {img.width}x{img.height}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleProceedToReview}
              >
                Continue to Review
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Eye size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold">Review & Publish</h2>
                <p className="text-xs text-muted">
                  Preview how your imported content will look
                </p>
              </div>
            </div>

            {published ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle size={40} className="text-success mx-auto" />
                <p className="font-semibold text-lg">Successfully Imported!</p>
                <p className="text-sm text-muted">
                  Your story has been created and is ready to go.
                </p>
              </div>
            ) : (
              <>
                {/* Editor-like preview */}
                <div className="border border-border rounded-lg p-6 mb-6 max-h-[400px] overflow-y-auto space-y-4">
                  {format === "prose" ? (
                    <div className="space-y-4">
                      <p className="text-muted italic text-sm">
                        [Imported gallery content - Prose format]
                      </p>
                      {mockPreviewImages.map((img, i) => (
                        <div key={img.id} className="space-y-3">
                          {i > 0 && (
                            <p className="text-sm text-muted leading-relaxed">
                              The scene continued, building with each passing
                              moment. Every detail was captured perfectly, telling
                              a story without words...
                            </p>
                          )}
                          <div className="aspect-[3/4] max-w-xs bg-gradient-to-br from-accent/5 to-accent/15 rounded-lg border border-border flex items-center justify-center">
                            <div className="text-center">
                              <Image
                                size={32}
                                className="text-accent/40 mx-auto mb-1"
                              />
                              <span className="text-xs text-muted">
                                {img.alt}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-muted italic text-sm">
                        [Imported gallery content - Chat format]
                      </p>
                      {mockPreviewImages.map((img, i) => (
                        <div
                          key={img.id}
                          className={`flex ${
                            i % 2 === 0 ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[240px] rounded-xl p-2 ${
                              i % 2 === 0
                                ? "bg-surface-hover rounded-tl-none"
                                : "bg-accent/10 rounded-tr-none"
                            }`}
                          >
                            <div className="aspect-[3/4] bg-gradient-to-br from-accent/5 to-accent/15 rounded-lg border border-border flex items-center justify-center">
                              <Image
                                size={24}
                                className="text-accent/40"
                              />
                            </div>
                            <p className="text-[10px] text-muted mt-1 text-right">
                              {img.alt}
                            </p>
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

      {/* Import history */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Import History</h2>
        </div>
        <div className="divide-y divide-border">
          {mockImportHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-surface-hover transition-colors"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                {item.format === "chat" ? (
                  <MessageSquare size={16} className="text-accent" />
                ) : (
                  <BookOpen size={16} className="text-accent" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium truncate">
                    {item.title}
                  </h3>
                  <Badge
                    variant={
                      item.status === "published" ? "success" : "default"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Image size={11} />
                    {item.imageCount} images
                  </span>
                  <span>
                    Imported {formatRelativeDate(item.importedAt)}
                  </span>
                </div>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-foreground transition-colors shrink-0"
                title="View original"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
