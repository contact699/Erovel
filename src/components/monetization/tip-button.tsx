"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TIP_PRESETS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Heart } from "lucide-react";

interface TipButtonProps {
  creatorId: string;
  creatorName: string;
  storyId?: string;
  storyTitle?: string;
  variant?: "button" | "icon";
}

export function TipButton({ creatorId, creatorName, storyId, storyTitle, variant = "button" }: TipButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSend() {
    const tipAmount = amount || parseFloat(customAmount);
    if (!tipAmount || tipAmount < 1) return;

    // Wire through the splits engine. CCBill integration replaces this
    // with a redirect → webhook flow that calls createPaymentWithSplits
    // server-side. For now we exercise the engine directly to validate
    // the resolver and snapshot pipeline.
    const { createClient } = await import("@/lib/supabase/client");
    const { useAuthStore } = await import("@/store/auth-store");
    const supabase = createClient();
    const reader = useAuthStore.getState().user;

    if (supabase && reader) {
      const { createPaymentWithSplits } = await import("@/lib/payments");
      await createPaymentWithSplits({
        supabase,
        source_type: "tip",
        reader_id: reader.id,
        creator_id: creatorId,
        story_id: storyId ?? null,
        gross: tipAmount,
        currency: "USD",
      });
    }

    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
      setAmount(null);
      setCustomAmount("");
    }, 2000);
  }

  const trigger =
    variant === "icon" ? (
      <button onClick={() => setOpen(true)} className="text-accent hover:text-accent-hover p-2 transition-colors cursor-pointer" title="Send a tip">
        <DollarSign size={20} />
      </button>
    ) : (
      <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
        <DollarSign size={14} />
        Tip
      </Button>
    );

  return (
    <>
      {trigger}
      <Modal open={open} onClose={() => setOpen(false)} title={`Tip ${creatorName}`} size="sm">
        {sent ? (
          <div className="text-center py-6 space-y-2">
            <Heart size={32} className="text-accent mx-auto" />
            <p className="font-medium">Tip sent!</p>
            <p className="text-sm text-muted">Thank you for supporting {creatorName}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {storyTitle && (
              <p className="text-sm text-muted">For: {storyTitle}</p>
            )}

            <div className="grid grid-cols-4 gap-2">
              {TIP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => { setAmount(preset); setCustomAmount(""); }}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    amount === preset
                      ? "bg-accent text-white"
                      : "bg-surface-hover text-foreground hover:bg-accent/10"
                  }`}
                >
                  {formatCurrency(preset)}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
                min="1"
                step="1"
                className="w-full rounded-lg border border-border bg-surface pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            <Button onClick={handleSend} className="w-full" disabled={!amount && !customAmount}>
              Send {amount ? formatCurrency(amount) : customAmount ? formatCurrency(parseFloat(customAmount)) : "Tip"}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
