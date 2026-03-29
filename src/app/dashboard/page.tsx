"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import {
  mockCreator,
  mockEarnings,
  mockStories,
  mockTips,
  mockComments,
  mockReader,
} from "@/lib/mock-data";
import {
  formatCurrency,
  formatNumber,
  formatRelativeDate,
} from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  PlusCircle,
  BarChart3,
  Wallet,
  BookOpen,
  Heart,
  UserPlus,
} from "lucide-react";

const creatorStories = mockStories.filter(
  (s) => s.creator_id === "creator-1"
);

const recentActivity = [
  {
    id: "a1",
    icon: Heart,
    iconColor: "text-accent",
    text: (
      <>
        <span className="font-medium">{mockReader.display_name}</span> tipped{" "}
        <span className="font-medium">{formatCurrency(10)}</span> on{" "}
        <span className="font-medium">Room 804</span>
      </>
    ),
    time: "2026-03-22T15:00:00Z",
  },
  {
    id: "a2",
    icon: MessageCircle,
    iconColor: "text-blue-500",
    text: (
      <>
        <span className="font-medium">{mockReader.display_name}</span> commented on{" "}
        <span className="font-medium">The Arrangement</span>
      </>
    ),
    time: "2026-03-20T22:00:00Z",
  },
  {
    id: "a3",
    icon: Heart,
    iconColor: "text-accent",
    text: (
      <>
        <span className="font-medium">{mockReader.display_name}</span> tipped{" "}
        <span className="font-medium">{formatCurrency(5)}</span> on{" "}
        <span className="font-medium">The Arrangement</span>
      </>
    ),
    time: "2026-03-20T10:00:00Z",
  },
  {
    id: "a4",
    icon: UserPlus,
    iconColor: "text-success",
    text: (
      <>
        <span className="font-medium">NewReader99</span> subscribed to your
        profile
      </>
    ),
    time: "2026-03-19T08:30:00Z",
  },
  {
    id: "a5",
    icon: MessageCircle,
    iconColor: "text-blue-500",
    text: (
      <>
        <span className="font-medium">Midnight Ink</span> commented on{" "}
        <span className="font-medium">The Arrangement</span>
      </>
    ),
    time: "2026-03-17T09:15:00Z",
  },
];

const statsCards = [
  {
    label: "Total Earnings",
    value: formatCurrency(mockEarnings.total_earnings),
    icon: DollarSign,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    change: "+12.5%",
    changePositive: true,
  },
  {
    label: "Pending Payout",
    value: formatCurrency(mockEarnings.pending_payout),
    icon: Wallet,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    change: null,
    changePositive: false,
  },
  {
    label: "Tips This Month",
    value: formatCurrency(mockEarnings.tips_this_month),
    icon: TrendingUp,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    change: "+8.2%",
    changePositive: true,
  },
  {
    label: "Subscribers",
    value: mockEarnings.subscriber_count.toString(),
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    change: "+3",
    changePositive: true,
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const creator = user ?? mockCreator;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {creator.display_name}
        </h1>
        <p className="text-muted mt-1">
          Here is what is happening with your stories today.
        </p>
      </div>

      {/* Stats cards */}
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
                  className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}
                >
                  <Icon size={18} className={card.iconColor} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{card.value}</span>
                {card.change && (
                  <span
                    className={`text-xs font-medium pb-0.5 ${
                      card.changePositive ? "text-success" : "text-danger"
                    }`}
                  >
                    {card.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/stories">
          <Button variant="primary" size="md">
            <PlusCircle size={16} />
            New Story
          </Button>
        </Link>
        <Link href="/dashboard/earnings">
          <Button variant="secondary" size="md">
            <BarChart3 size={16} />
            View Analytics
          </Button>
        </Link>
        <Link href="/dashboard/earnings">
          <Button variant="secondary" size="md">
            <Wallet size={16} />
            Request Payout
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent stories */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold">Your Stories</h2>
            <Link
              href="/dashboard/stories"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {creatorStories.map((story) => (
              <div
                key={story.id}
                className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BookOpen size={18} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium truncate">
                      {story.title}
                    </h3>
                    <Badge
                      variant={
                        story.status === "published"
                          ? "success"
                          : story.status === "draft"
                          ? "default"
                          : "accent"
                      }
                    >
                      {story.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {formatNumber(story.view_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={12} />
                      {formatCurrency(story.tip_total)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {story.comment_count}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted hidden sm:block">
                  {formatRelativeDate(story.updated_at)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-surface border border-border rounded-xl">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex gap-3 p-4">
                  <div
                    className={`shrink-0 mt-0.5 ${activity.iconColor}`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{activity.text}</p>
                    <p className="text-xs text-muted mt-1">
                      {formatRelativeDate(activity.time)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
