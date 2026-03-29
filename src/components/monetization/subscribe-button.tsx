"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { useSubscriptionStore } from "@/store/subscription-store";
import { Crown, Check } from "lucide-react";

interface SubscribeButtonProps {
  targetType: "creator" | "story";
  targetName: string;
  price: number;
  /** The id used to persist the subscription in the store */
  storyId?: string;
  creatorId?: string;
  isSubscribed?: boolean;
}

export function SubscribeButton({
  targetType,
  targetName,
  price,
  storyId,
  creatorId,
  isSubscribed: isSubscribedProp = false,
}: SubscribeButtonProps) {
  const [open, setOpen] = useState(false);

  const { subscribe, isSubscribed: checkSubscribed } = useSubscriptionStore();

  // Determine the target id based on targetType
  const targetId = targetType === "story" ? storyId : creatorId;

  // Check store for subscription state; fall back to prop
  const subscribed = targetId
    ? checkSubscribed(targetType, targetId)
    : isSubscribedProp;

  function handleSubscribe() {
    // Persist in the shared store
    if (targetId) {
      subscribe(targetType, targetId);
    }
    setTimeout(() => setOpen(false), 1500);
  }

  if (subscribed) {
    return (
      <Button variant="secondary" size="sm" disabled>
        <Check size={14} />
        Subscribed
      </Button>
    );
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Crown size={14} />
        {targetType === "story" ? "Unlock All Chapters" : "Subscribe"}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Subscribe to ${targetName}`} size="sm">
        <div className="space-y-4">
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-accent" />
              <span className="font-medium">
                {targetType === "creator" ? "Creator Subscription" : "Story Access"}
              </span>
            </div>
            <p className="text-sm text-muted">
              {targetType === "creator"
                ? `Get full access to all gated content from ${targetName}. New stories included automatically.`
                : `Unlock all chapters of this story immediately, including future scheduled chapters.`}
            </p>
            <p className="text-lg font-bold text-accent">
              {formatCurrency(price)}{targetType === "creator" ? "/month" : " one-time"}
            </p>
          </div>

          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><Check size={14} className="text-success" /> Immediate access to all gated content</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-success" /> Early access to scheduled chapters</li>
            {targetType === "creator" && (
              <li className="flex items-center gap-2"><Check size={14} className="text-success" /> Cancel anytime</li>
            )}
          </ul>

          <Button onClick={handleSubscribe} className="w-full" size="lg">
            {targetType === "creator" ? `Subscribe for ${formatCurrency(price)}/mo` : `Unlock for ${formatCurrency(price)}`}
          </Button>

          <p className="text-xs text-muted text-center">
            Payment processed securely via CCBill.
          </p>
        </div>
      </Modal>
    </>
  );
}
