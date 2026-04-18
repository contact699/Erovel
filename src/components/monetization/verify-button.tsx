"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/components/ui/toast";
import { ShieldCheck, ExternalLink, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export function VerifyButton() {
  const { user, refreshProfile } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [veriffUrl, setVeriffUrl] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-poll for verification status once Veriff window is opened
  useEffect(() => {
    if (!veriffUrl || !open) return;

    setPolling(true);
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes at 5s intervals

    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollRef.current) clearInterval(pollRef.current);
        setPolling(false);
        return;
      }

      try {
        const res = await fetch("/api/veriff/check", { method: "POST" });
        const data = await res.json();
        if (data.verified) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPolling(false);
          await refreshProfile();
          toast("success", "Identity verified!");
          setOpen(false);
          setVeriffUrl(null);
        }
      } catch {
        // silently retry
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setPolling(false);
    };
  }, [veriffUrl, open, refreshProfile]);

  if (!user || user.role !== "creator") return null;

  if (user.is_verified) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle size={16} />
        Identity Verified
      </div>
    );
  }

  async function handleStartVerification() {
    setLoading(true);
    try {
      const res = await fetch("/api/veriff/session", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast("error", data.error || "Failed to start verification");
        setLoading(false);
        return;
      }

      setVeriffUrl(data.url);
    } catch {
      toast("error", "Failed to connect to verification service");
    }
    setLoading(false);
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <ShieldCheck size={14} />
        Verify Identity
      </Button>

      <Modal open={open} onClose={() => { setOpen(false); setVeriffUrl(null); }} title="Identity Verification" size="sm">
        <div className="space-y-4">
          {!veriffUrl ? (
            <>
              <div className="flex items-start gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                <AlertCircle size={20} className="text-accent shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Why verify?</p>
                  <p className="text-muted mt-1">
                    Identity verification is required for 2257 compliance before
                    you can publish content. Your information is securely processed
                    by Veriff and never stored on our servers.
                  </p>
                </div>
              </div>

              <div className="text-sm text-muted space-y-2">
                <p>You will need:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>A government-issued photo ID (passport, driver&apos;s license)</li>
                  <li>A device with a camera for a selfie</li>
                  <li>About 2 minutes</li>
                </ul>
              </div>

              <Button className="w-full" onClick={handleStartVerification} loading={loading}>
                <ShieldCheck size={16} />
                Start Verification
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                Complete the verification in the window that opens. You&apos;ll be redirected back when done.
              </p>

              <a
                href={veriffUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
              >
                <ExternalLink size={16} />
                Open Verification
              </a>

              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted">
                  <Loader2 size={14} className="animate-spin" />
                  Checking verification status automatically...
                </div>
              )}

              <Button
                variant="secondary"
                className="w-full"
                loading={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch("/api/veriff/check", { method: "POST" });
                    const data = await res.json();
                    if (data.verified) {
                      if (pollRef.current) clearInterval(pollRef.current);
                      await refreshProfile();
                      toast("success", "Identity verified!");
                      setOpen(false);
                      setVeriffUrl(null);
                      setLoading(false);
                      return;
                    }
                  } catch {
                    // fall through to profile check
                  }
                  await refreshProfile();
                  const state = useAuthStore.getState();
                  if (state.user?.is_verified) {
                    if (pollRef.current) clearInterval(pollRef.current);
                    toast("success", "Identity verified!");
                    setOpen(false);
                    setVeriffUrl(null);
                  } else {
                    toast("info", "Verification still in progress. Check back shortly.");
                  }
                  setLoading(false);
                }}
              >
                I&apos;ve completed verification
              </Button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
