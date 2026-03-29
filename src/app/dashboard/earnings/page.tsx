"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  mockEarnings,
  mockTips,
  mockPayouts,
  mockReader,
  mockCreator2,
} from "@/lib/mock-data";
import { MIN_PAYOUT } from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import type { PayoutStatus } from "@/lib/types";
import {
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  ArrowUpRight,
  CreditCard,
  AlertCircle,
} from "lucide-react";

/* Expanded transactions list with subscriptions mixed in */
const mockTransactions = [
  {
    id: "tx-1",
    date: "2026-03-25T08:00:00Z",
    type: "tip" as const,
    from: mockReader.display_name,
    story: "Late Night Texts",
    amount: 2,
  },
  {
    id: "tx-2",
    date: "2026-03-22T15:00:00Z",
    type: "tip" as const,
    from: mockReader.display_name,
    story: "Room 804",
    amount: 10,
  },
  {
    id: "tx-3",
    date: "2026-03-20T10:00:00Z",
    type: "tip" as const,
    from: mockReader.display_name,
    story: "The Arrangement",
    amount: 5,
  },
  {
    id: "tx-4",
    date: "2026-03-18T12:00:00Z",
    type: "subscription" as const,
    from: "LitFanatic",
    story: "--",
    amount: 9.99,
  },
  {
    id: "tx-5",
    date: "2026-03-15T06:30:00Z",
    type: "subscription" as const,
    from: "NovelNerd",
    story: "--",
    amount: 9.99,
  },
  {
    id: "tx-6",
    date: "2026-03-12T20:45:00Z",
    type: "tip" as const,
    from: mockCreator2.display_name,
    story: "The Arrangement",
    amount: 20,
  },
];

const payoutStatusVariant: Record<PayoutStatus, "success" | "accent" | "default" | "danger"> = {
  completed: "success",
  processing: "accent",
  pending: "default",
  failed: "danger",
};

const chartMonths = [
  { month: "Oct", amount: 180 },
  { month: "Nov", amount: 290 },
  { month: "Dec", amount: 340 },
  { month: "Jan", amount: 410 },
  { month: "Feb", amount: 380 },
  { month: "Mar", amount: 342 },
];
const maxChart = Math.max(...chartMonths.map((m) => m.amount));

const statsCards = [
  {
    label: "Total Earnings",
    value: formatCurrency(mockEarnings.total_earnings),
    icon: DollarSign,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    sub: "Lifetime",
  },
  {
    label: "Pending Payout",
    value: formatCurrency(mockEarnings.pending_payout),
    icon: Wallet,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    sub: "Available to withdraw",
  },
  {
    label: "Tips This Month",
    value: formatCurrency(mockEarnings.tips_this_month),
    icon: TrendingUp,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    sub: "March 2026",
  },
  {
    label: "Subscribers",
    value: mockEarnings.subscriber_count.toString(),
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    sub: `${formatCurrency(mockEarnings.subscriptions_this_month)} this month`,
  },
];

export default function EarningsPage() {
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("paxum");
  const [payoutAmount, setPayoutAmount] = useState(
    mockEarnings.pending_payout.toString()
  );
  const [payoutRequested, setPayoutRequested] = useState(false);

  function handleRequestPayout() {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount < MIN_PAYOUT) return;
    setPayoutRequested(true);
    setTimeout(() => {
      setPayoutOpen(false);
      setPayoutRequested(false);
    }, 2000);
  }

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
        <Button
          variant="primary"
          size="md"
          onClick={() => setPayoutOpen(true)}
        >
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

      {/* Chart placeholder */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-6">Monthly Earnings</h2>
        <div className="flex items-end gap-3 h-48">
          {chartMonths.map((m) => {
            const height = (m.amount / maxChart) * 100;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-muted">
                  {formatCurrency(m.amount)}
                </span>
                <div
                  className="w-full bg-accent/20 rounded-t-md relative group transition-all hover:bg-accent/30"
                  style={{ height: `${height}%` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-md transition-all"
                    style={{ height: `${Math.min(100, (m.amount / maxChart) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Recent Transactions</h2>
        </div>
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
              {mockTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-surface-hover transition-colors"
                >
                  <td className="px-5 py-3 text-muted whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={tx.type === "tip" ? "accent" : "success"}
                    >
                      {tx.type === "tip" ? "Tip" : "Subscription"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 font-medium">{tx.from}</td>
                  <td className="px-5 py-3 text-muted">{tx.story}</td>
                  <td className="px-5 py-3 text-right font-medium text-success">
                    +{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Payout History</h2>
        </div>
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
              {mockPayouts.map((payout) => (
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

            <Input
              label="Amount"
              type="number"
              id="payout-amount"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              min={MIN_PAYOUT}
              max={mockEarnings.pending_payout}
              error={
                parseFloat(payoutAmount) > 0 &&
                parseFloat(payoutAmount) < MIN_PAYOUT
                  ? `Minimum ${formatCurrency(MIN_PAYOUT)}`
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
                {formatCurrency(mockEarnings.pending_payout)}
              </span>
            </div>

            <Button
              onClick={handleRequestPayout}
              className="w-full"
              disabled={
                !payoutAmount ||
                parseFloat(payoutAmount) < MIN_PAYOUT ||
                parseFloat(payoutAmount) > mockEarnings.pending_payout
              }
            >
              <CreditCard size={16} />
              Request {formatCurrency(parseFloat(payoutAmount) || 0)} Payout
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
