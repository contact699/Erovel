"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  url?: string;
  title?: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = url || window.location.href;
    const shareTitle = title || document.title;

    // Use native share on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch {
        // User cancelled or not supported, fall through to copy
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard failed
    }
  }

  return (
    <button
      onClick={handleShare}
      className="text-muted hover:text-foreground transition-colors cursor-pointer p-1"
      title={copied ? "Copied!" : "Share"}
    >
      {copied ? <Check size={16} className="text-success" /> : <Share2 size={16} />}
    </button>
  );
}
