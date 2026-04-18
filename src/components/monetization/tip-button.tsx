"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TIP_PRESETS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Heart, CreditCard, Wallet, Loader2 } from "lucide-react";

interface TipButtonProps {
  creatorId: string;
  creatorName: string;
  storyId?: string;
  storyTitle?: string;
  variant?: "button" | "icon";
}

interface OnRampProviderInfo {
  id: "moonpay" | "ramp";
  label: string;
  blurb: string;
}

type CheckoutStep =
  | { step: "amount" }
  | { step: "pay_method"; orderId: string; invoiceUrl: string; amountUsd: number };

export function TipButton({ creatorId, creatorName, storyId, storyTitle, variant = "button" }: TipButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkout, setCheckout] = useState<CheckoutStep>({ step: "amount" });
  const [providers, setProviders] = useState<OnRampProviderInfo[]>([]);
  const [onRampLoadingId, setOnRampLoadingId] = useState<string | null>(null);

  // Fetch available on-ramp providers once the modal opens. They only
  // render if their env keys are configured server-side.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/payments/onramp/providers")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setProviders(d.providers ?? []);
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function resetForNextOpen() {
    setOpen(false);
    setSent(false);
    setAmount(null);
    setCustomAmount("");
    setError(null);
    setSubmitting(false);
    setCheckout({ step: "amount" });
    setOnRampLoadingId(null);
  }

  async function handleCryptoPay() {
    const tipAmount = amount || parseFloat(customAmount);
    if (!tipAmount || tipAmount < 1) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/btcpay/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_id: creatorId,
          story_id: storyId,
          amount: tipAmount,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Failed to create crypto payment. Please try again.");
        setSubmitting(false);
        return;
      }

      const { invoice_url, order_id } = (await response.json()) as {
        invoice_url: string;
        order_id: string;
      };

      setCheckout({
        step: "pay_method",
        orderId: order_id,
        invoiceUrl: invoice_url,
        amountUsd: tipAmount,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOnRamp(providerId: OnRampProviderInfo["id"]) {
    if (checkout.step !== "pay_method") return;
    setOnRampLoadingId(providerId);
    setError(null);
    try {
      const res = await fetch("/api/payments/onramp/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: checkout.orderId,
          provider: providerId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || `Couldn't open ${providerId} — try the crypto wallet option.`);
        setOnRampLoadingId(null);
        return;
      }
      const popup = window.open(data.url, "_blank", "noopener,noreferrer");
      if (!popup) {
        // Popup blocked — fall back to full-page redirect.
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setOnRampLoadingId(null);
    }
  }

  function handleWalletPay() {
    if (checkout.step !== "pay_method") return;
    window.location.href = checkout.invoiceUrl;
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
      <Modal
        open={open}
        onClose={resetForNextOpen}
        title={
          checkout.step === "pay_method"
            ? `Pay ${formatCurrency(checkout.amountUsd)}`
            : `Tip ${creatorName}`
        }
        size="sm"
      >
        {sent ? (
          <div className="text-center py-6 space-y-2">
            <Heart size={32} className="text-accent mx-auto" />
            <p className="font-medium">Tip sent!</p>
            <p className="text-sm text-muted">Thank you for supporting {creatorName}.</p>
          </div>
        ) : checkout.step === "pay_method" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Pick how you want to pay. The tip arrives at {creatorName} either way.
            </p>

            <button
              type="button"
              onClick={handleWalletPay}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-surface-hover transition-colors cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Wallet size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Pay from a crypto wallet</p>
                <p className="text-xs text-muted">Bitcoin or Lightning — you&apos;re redirected to the invoice page.</p>
              </div>
            </button>

            {providers.map((p) => {
              const isLoading = onRampLoadingId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleOnRamp(p.id)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-surface-hover transition-colors cursor-pointer text-left disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin text-muted" />
                    ) : (
                      <CreditCard size={18} className="text-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Buy crypto with card — {p.label}</p>
                    <p className="text-xs text-muted">{p.blurb}</p>
                  </div>
                </button>
              );
            })}

            {providers.length === 0 && (
              <p className="text-xs text-muted text-center pt-1">
                Card checkout isn&apos;t available yet — use a crypto wallet above.
              </p>
            )}

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <div className="text-[11px] text-muted text-center pt-1">
              Card purchases go through licensed crypto exchanges that charge a
              small fee on top of the tip amount.
            </div>
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

            <Button
              onClick={handleCryptoPay}
              className="w-full"
              loading={submitting}
              disabled={submitting || (!amount && !customAmount)}
            >
              Continue to payment
            </Button>

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
