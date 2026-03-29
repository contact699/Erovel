"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  DollarSign,
  Download,
  Settings,
  Menu,
  X,
  CheckCircle,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/stories", label: "Stories", icon: BookOpen },
  { href: "/dashboard/earnings", label: "Earnings", icon: DollarSign },
  { href: "/dashboard/import", label: "Import", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || user?.role !== "creator") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <BookOpen size={48} className="mx-auto text-muted" />
          <h1 className="text-2xl font-bold">Not authorized</h1>
          <p className="text-muted">You must be a creator to access this page.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="text-accent hover:text-accent-hover transition-colors">
              &larr; Back to home
            </Link>
            <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const creator = user;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Creator profile summary */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar src={creator.avatar_url} name={creator.display_name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate">{creator.display_name}</span>
              {creator.is_verified && (
                <CheckCircle size={14} className="text-accent shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted truncate">@{creator.username}</p>
            <Badge variant="accent" className="mt-1">Creator</Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => {
            logout();
            setSidebarOpen(false);
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors w-full cursor-pointer"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-border bg-surface shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border z-50 shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-foreground p-1 cursor-pointer"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-sm">Dashboard</span>
          <div className="w-8" />
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
