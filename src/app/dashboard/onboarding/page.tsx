"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { updateProfile } from "@/lib/supabase/queries";
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
      // silently fail
    }
    setSaving(false);
  }

  async function handleSavePricing() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        subscription_price: subscriptionPrice,
      });
      await refreshProfile();
      setStep(3);
    } catch {
      // silently fail
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
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? "bg-accent w-12" : "bg-border w-8"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
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

        {/* Step 2: Pricing */}
        {step === 2 && (
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
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button className="flex-1" onClick={handleSavePricing} loading={saving}>
                Continue
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Quick Start */}
        {step === 3 && (
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={24} className="text-accent" />
              </div>
              <h1 className="text-xl font-bold">You&apos;re all set!</h1>
              <p className="text-sm text-muted">
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
