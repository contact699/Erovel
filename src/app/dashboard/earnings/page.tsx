"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { createClient } from "@/lib/supabase/client";
import { MIN_PAYOUT } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PayoutStatus, PayoutMethod } from "@/lib/types";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  ArrowUpRight,
  CreditCard,
  AlertCircle,
  Loader2,
  LogIn,
} from "lucide-react";

interface TipRow {
  id: string;
  reader_id: string;
  creator_id: string;
  story_id: string | null;
  amount: number;
  currency: string;
  created_at: string;
  reader: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  story: {
    title: string;
    slug: string;
  } | null;
}

interface PayoutRow {
  id: string;
  creator_id: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  processed_at: string | null;
  created_at: string;
}

const payoutStatusVariant: Record<
  PayoutStatus,
  "success" | "accent" | "default" | "danger"
> = {
  completed: "success",
  processing: "accent",
  pending: "default",
  failed: "danger",
};

export default function EarningsPage() {
  const { user, isAuthenticated } = useAuthStore();

  // Data state
  const [tips, setTips] = useState<TipRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);
  const [tipsThisMonth, setTipsThisMonth] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [monthlyChart, setMonthlyChart] = useState<
    { month: string; amount: number }[]
  >([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("paxum");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);

    try {
      // Fetch tips with reader profile and story info
      const { data: tipsData } = await supabase
        .from("tips")
        .select(
          "*, reader:profiles!reader_id(username, display_name, avatar_url), story:stories(title, slug)"
        )
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      const fetchedTips: TipRow[] = (tipsData as TipRow[] | null) ?? [];
      setTips(fetchedTips);

      // Calculate total earnings from all tips
      const total = fetchedTips.reduce((sum, t) => sum + (t.amount ?? 0), 0);
      setTotalEarnings(total);

      // Tips this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyTips = fetchedTips
        .filter((t) => new Date(t.created_at) >= startOfMonth)
        .reduce((sum, t) => sum + (t.amount ?? 0), 0);
      setTipsThisMonth(monthlyTips);

      // Build monthly chart data (last 6 months)
      const chartData: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
        const monthTotal = fetchedTips
          .filter((t) => {
            const tDate = new Date(t.created_at);
            return tDate >= d && tDate <= monthEnd;
          })
          .reduce((sum, t) => sum + (t.amount ?? 0), 0);
        chartData.push({ month: monthLabel, amount: monthTotal });
      }
      setMonthlyChart(chartData);

      // Fetch payouts
      const { data: payoutsData } = await supabase
        .from("payouts")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      const fetchedPayouts: PayoutRow[] =
        (payoutsData as PayoutRow[] | null) ?? [];
      setPayouts(fetchedPayouts);

      // Pending payout = total earnings minus completed/processing payouts
      const paidOut = fetchedPayouts
        .filter((p) => p.status === "completed" || p.status === "processing")
        .reduce((sum, p) => sum + (p.amount ?? 0), 0);
      setPendingPayout(Math.max(0, total - paidOut));

      // Fetch active subscriber count
      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("target_id", user.id)
        .eq("target_type", "creator")
        .eq("status", "active");

      setSubscriberCount(count ?? 0);
    } catch {
      // Silently handle — data will show zeros
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchData]);

  // Open payout modal and pre-fill amount
  function openPayoutModal() {
    setPayoutAmount(pendingPayout > 0 ? pendingPayout.toString() : "");
    setPayoutError(null);
    setPayoutRequested(false);
    setPayoutOpen(true);
  }

  async function handleRequestPayout() {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount < MIN_PAYOUT) return;
    if (amount > pendingPayout) return;
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    setPayoutSubmitting(true);
    setPayoutError(null);

    const { error } = await supabase.from("payouts").insert({
      creator_id: user.id,
      amount,
      method: payoutMethod as PayoutMethod,
      status: "pending" as PayoutStatus,
    });

    if (error) {
      setPayoutError(error.message);
      setPayoutSubmitting(false);
      return;
    }

    setPayoutSubmitting(false);
    setPayoutRequested(true);

    // Refresh data after a brief delay so user sees the success state
    setTimeout(() => {
      setPayoutOpen(false);
      setPayoutRequested(false);
      fetchData();
    }, 2000);
  }

  // Login prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LogIn size={48} className="text-muted" />
        <h2 className="text-xl font-semibold">Sign in to view your earnings</h2>
        <p className="text-muted text-sm text-center max-w-md">
          You need to be logged in as a creator to access the earnings dashboard.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium px-4 py-2 text-sm bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const statsCards = [
    {
      label: "Total Earnings",
      value: formatCurrency(totalEarnings),
      icon: DollarSign,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      sub: "Lifetime",
    },
    {
      label: "Pending Payout",
      value: formatCurrency(pendingPayout),
      icon: Wallet,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      sub: "Available to withdraw",
    },
    {
      label: "Tips This Month",
      value: formatCurrency(tipsThisMonth),
      icon: TrendingUp,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
      sub: currentMonthLabel,
    },
    {
      label: "Subscribers",
      value: subscriberCount.toString(),
      icon: Users,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      sub: "Active subscribers",
    },
  ];

  const maxChart = Math.max(...monthlyChart.map((m) => m.amount), 1);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Earnings</h1>
          <p className="text-muted mt-1">
            Track your income and manage payouts.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openPayoutModal}>
          <Wallet size={16} />
          Request Payout
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-surface border border-border rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{card.label}</span>
                <div
                  className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}
                >
                  <Icon size={20} className={card.iconColor} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold">{card.value}</span>
                <p className="text-xs text-muted mt-1">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-6">Monthly Earnings</h2>
        <div className="flex items-end gap-3 h-48">
          {monthlyChart.map((m) => {
            const height = maxChart > 0 ? (m.amount / maxChart) * 100 : 0;
            return (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <span className="text-xs font-medium text-muted">
                  {formatCurrency(m.amount)}
                </span>
                <div
                  className="w-full bg-accent/20 rounded-t-md relative group transition-all hover:bg-accent/30"
                  style={{ height: `${height}%`, minHeight: m.amount > 0 ? "4px" : "0px" }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-md transition-all"
                    style={{
                      height: `${Math.min(100, height)}%`,
                      minHeight: m.amount > 0 ? "4px" : "0px",
                    }}
                  />
                </div>
                <span className="text-xs text-muted">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent transactions (tips) */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Recent Transactions</h2>
        </div>
        {tips.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            No tips received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-left px-5 py-3 font-medium">From</th>
                  <th className="text-left px-5 py-3 font-medium">Story</th>
                  <th className="text-right px-5 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tips.map((tip) => (
                  <tr
                    key={tip.id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-5 py-3 text-muted whitespace-nowrap">
                      {formatDate(tip.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="accent">Tip</Badge>
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {tip.reader?.display_name ?? tip.reader?.username ?? "Anonymous"}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {tip.story?.title ?? "--"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-success">
                      +{formatCurrency(tip.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout history */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Payout History</h2>
        </div>
        {payouts.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            No payouts yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Method</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((payout) => (
                  <tr
                    key={payout.id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-5 py-3 text-muted whitespace-nowrap">
                      {formatDate(payout.created_at)}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="px-5 py-3 capitalize">{payout.method}</td>
                    <td className="px-5 py-3">
                      <Badge variant={payoutStatusVariant[payout.status]}>
                        {payout.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout modal */}
      <Modal
        open={payoutOpen}
        onClose={() => setPayoutOpen(false)}
        title="Request Payout"
        size="sm"
      >
        {payoutRequested ? (
          <div className="text-center py-6 space-y-2">
            <ArrowUpRight size={32} className="text-success mx-auto" />
            <p className="font-medium">Payout Requested!</p>
            <p className="text-sm text-muted">
              Your payout is being processed. You will receive it within 3-5
              business days.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle
                size={16}
                className="text-amber-500 shrink-0 mt-0.5"
              />
              <p className="text-xs text-muted">
                Minimum payout amount is{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(MIN_PAYOUT)}
                </span>
                . Payouts are processed within 3-5 business days.
              </p>
            </div>

            {payoutError && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
                {payoutError}
              </div>
            )}

            <Input
              label="Amount"
              type="number"
              id="payout-amount"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              min={MIN_PAYOUT}
              max={pendingPayout}
              error={
                parseFloat(payoutAmount) > 0 &&
                parseFloat(payoutAmount) < MIN_PAYOUT
                  ? `Minimum ${formatCurrency(MIN_PAYOUT)}`
                  : parseFloat(payoutAmount) > pendingPayout
                    ? "Exceeds available balance"
                    : undefined
              }
            />

            <Select
              label="Payout Method"
              id="payout-method"
              options={[
                { value: "paxum", label: "Paxum" },
                { value: "crypto", label: "Cryptocurrency" },
              ]}
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
            />

            <div className="pt-2 flex items-center justify-between text-sm">
              <span className="text-muted">Available balance</span>
              <span className="font-semibold">
                {formatCurrency(pendingPayout)}
              </span>
            </div>

            <Button
              onClick={handleRequestPayout}
              className="w-full"
              disabled={
                payoutSubmitting ||
                !payoutAmount ||
                parseFloat(payoutAmount) < MIN_PAYOUT ||
                parseFloat(payoutAmount) > pendingPayout
              }
            >
              {payoutSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CreditCard size={16} />
              )}
              {payoutSubmitting
                ? "Submitting..."
                : `Request ${formatCurrency(parseFloat(payoutAmount) || 0)} Payout`}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
