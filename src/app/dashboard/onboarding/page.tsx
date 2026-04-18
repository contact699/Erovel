"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { updateProfile } from "@/lib/supabase/queries";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import {
  BookOpen,
  PenTool,
  Download,
  ArrowRight,
  Check,
  DollarSign,
  User,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [subscriptionPrice, setSubscriptionPrice] = useState(
    user?.subscription_price || 9.99
  );
  const [saving, setSaving] = useState(false);

  // Verification state
  const [veriffUrl, setVeriffUrl] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyPolling, setVerifyPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVerified = user?.is_verified ?? false;

  // Auto-poll for verification status once Veriff window is opened
  useEffect(() => {
    if (!veriffUrl || step !== 2 || isVerified) return;

    setVerifyPolling(true);
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes at 5s intervals

    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollRef.current) clearInterval(pollRef.current);
        setVerifyPolling(false);
        return;
      }

      try {
        const res = await fetch("/api/veriff/check", { method: "POST" });
        const data = await res.json();
        if (data.verified) {
          if (pollRef.current) clearInterval(pollRef.current);
          setVerifyPolling(false);
          await refreshProfile();
          toast("success", "Identity verified!");
          setStep(3);
        }
      } catch {
        // silently retry
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setVerifyPolling(false);
    };
  }, [veriffUrl, step, isVerified, refreshProfile]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted">Please log in to continue.</p>
        <Link href="/login" className="text-accent hover:underline text-sm">
          Log in
        </Link>
      </div>
    );
  }

  // If already verified, skip to step 3 on mount
  const effectiveStep = step === 2 && user.is_verified ? 3 : step;

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        display_name: displayName,
        bio,
      });
      await refreshProfile();
      setStep(2);
    } catch {
      toast("error", "Failed to save profile");
    }
    setSaving(false);
  }

  async function handleStartVerification() {
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/veriff/session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error || "Failed to start verification");
        setVerifyLoading(false);
        return;
      }
      setVeriffUrl(data.url);
    } catch {
      toast("error", "Failed to connect to verification service");
    }
    setVerifyLoading(false);
  }

  async function handleCheckVerification() {
    setVerifyChecking(true);
    try {
      const res = await fetch("/api/veriff/check", { method: "POST" });
      const data = await res.json();
      if (data.verified) {
        if (pollRef.current) clearInterval(pollRef.current);
        await refreshProfile();
        toast("success", "Identity verified!");
        setStep(3);
        setVerifyChecking(false);
        return;
      }
      await refreshProfile();
      const state = useAuthStore.getState();
      if (state.user?.is_verified) {
        if (pollRef.current) clearInterval(pollRef.current);
        toast("success", "Identity verified!");
        setStep(3);
      } else {
        toast("info", "Verification still in progress. This can take a few minutes.");
      }
    } catch {
      toast("error", "Failed to check status");
    }
    setVerifyChecking(false);
  }

  async function handleSavePricing() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        subscription_price: subscriptionPrice,
      });
      await refreshProfile();
      setStep(4);
    } catch {
      toast("error", "Failed to save pricing");
    }
    setSaving(false);
  }

  function handleComplete() {
    localStorage.setItem("onboarding-complete", "true");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= effectiveStep ? "bg-accent w-10" : "bg-border w-6"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Profile */}
        {effectiveStep === 1 && (
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <User size={24} className="text-accent" />
              </div>
              <h1 className="text-xl font-bold">Welcome to Erovel!</h1>
              <p className="text-sm text-muted">
                Let&apos;s set up your creator profile. This is what readers will see.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Avatar src={user.avatar_url} name={displayName} size="xl" />
              <div className="text-sm text-muted">
                <p>Avatar can be updated in Settings.</p>
              </div>
            </div>

            <Input
              id="display-name"
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your creator name"
            />

            <Textarea
              id="bio"
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell readers about yourself and what you write..."
              rows={4}
            />

            <Button
              className="w-full"
              onClick={handleSaveProfile}
              loading={saving}
              disabled={!displayName.trim()}
            >
              Continue
              <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {/* Step 2: Identity Verification */}
        {effectiveStep === 2 && (
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck size={24} className="text-accent" />
              </div>
              <h1 className="text-xl font-bold">Verify Your Identity</h1>
              <p className="text-sm text-muted">
                Identity verification is required for 2257 compliance before
                you can publish content on Erovel.
              </p>
            </div>

            {!veriffUrl ? (
              <>
                <div className="flex items-start gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <AlertCircle size={20} className="text-accent shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Why is this required?</p>
                    <p className="text-muted mt-1">
                      All platforms hosting adult content must verify that creators
                      are over 18 and maintain identity records. This is a one-time
                      process that takes about 2 minutes. Your information is
                      securely processed by Veriff and never stored on our servers.
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

                <Button className="w-full" onClick={handleStartVerification} loading={verifyLoading}>
                  <ShieldCheck size={16} />
                  Start Verification
                </Button>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-3">
                  <CheckCircle size={32} className="text-success mx-auto" />
                  <p className="text-sm text-muted">
                    Complete the verification in the window that opens.
                    Once done, click the button below to continue.
                  </p>
                </div>

                <a
                  href={veriffUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
                >
                  <ExternalLink size={16} />
                  Open Verification
                </a>

                {verifyPolling && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted">
                    <Loader2 size={14} className="animate-spin" />
                    Checking verification status automatically...
                  </div>
                )}

                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={handleCheckVerification}
                  loading={verifyChecking}
                >
                  <Check size={16} />
                  I&apos;ve completed verification
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step 3: Pricing */}
        {effectiveStep === 3 && (
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <DollarSign size={24} className="text-accent" />
              </div>
              <h1 className="text-xl font-bold">Set Your Pricing</h1>
              <p className="text-sm text-muted">
                Readers can subscribe monthly to access all your gated content.
                You can also set per-story prices when publishing.
              </p>
            </div>

            <div>
              <Input
                id="sub-price"
                label="Monthly Subscription Price ($)"
                type="number"
                min="1"
                max="999"
                step="0.01"
                value={subscriptionPrice}
                onChange={(e) =>
                  setSubscriptionPrice(parseFloat(e.target.value) || 0)
                }
              />
              <p className="text-xs text-muted mt-2">
                You keep 85% of all earnings. Change anytime in Settings.
              </p>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-medium">How monetization works</h3>
              <ul className="text-xs text-muted space-y-1">
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-accent mt-0.5 shrink-0" />
                  Readers tip you directly on any story
                </li>
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-accent mt-0.5 shrink-0" />
                  Monthly subscriptions unlock all your gated content
                </li>
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-accent mt-0.5 shrink-0" />
                  Per-story pricing for one-time purchases
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button className="flex-1" onClick={handleSavePricing} loading={saving}>
                Continue
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Quick Start */}
        {effectiveStep === 4 && (
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={24} className="text-accent" />
              </div>
              <h1 className="text-xl font-bold">You&apos;re all set!</h1>
              <p className="text-sm text-muted">
                Your identity is verified and your profile is ready.
                What would you like to do first?
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/dashboard/stories/new" onClick={handleComplete}>
                <div className="flex items-center gap-4 p-4 bg-surface-hover rounded-xl hover:bg-accent/5 border border-border hover:border-accent/30 transition-all cursor-pointer">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <PenTool size={20} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Create a new story</h3>
                    <p className="text-xs text-muted">
                      Start writing in prose or chat format
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-muted ml-auto" />
                </div>
              </Link>

              <Link href="/dashboard/import" onClick={handleComplete}>
                <div className="flex items-center gap-4 p-4 bg-surface-hover rounded-xl hover:bg-accent/5 border border-border hover:border-accent/30 transition-all cursor-pointer mt-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <Download size={20} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Import from imgchest</h3>
                    <p className="text-xs text-muted">
                      Bulk import existing galleries as chapters
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-muted ml-auto" />
                </div>
              </Link>

              <button
                onClick={handleComplete}
                className="flex items-center gap-4 p-4 w-full text-left bg-surface-hover rounded-xl hover:bg-accent/5 border border-border hover:border-accent/30 transition-all cursor-pointer mt-3"
              >
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Explore the dashboard</h3>
                  <p className="text-xs text-muted">
                    Browse your dashboard and settings
                  </p>
                </div>
                <ArrowRight size={16} className="text-muted ml-auto" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
