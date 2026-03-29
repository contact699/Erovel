"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  LayoutDashboard,
  Flag,
  Users,
  Shield,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield size={48} className="mx-auto text-muted" />
          <h1 className="text-2xl font-bold">Not authorized</h1>
          <p className="text-muted">You do not have permission to access the admin panel.</p>
          <Link href="/" className="inline-block text-accent hover:text-accent-hover transition-colors">
            &larr; Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Branding */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-md bg-foreground/90 flex items-center justify-center">
            <Shield size={16} className="text-background" />
          </div>
          <span className="font-bold text-base tracking-tight">
            Admin Panel
          </span>
          <button
            className="ml-auto lg:hidden text-muted hover:text-foreground cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to site */}
        <div className="p-3 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <ChevronLeft size={18} />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="h-16 flex items-center gap-4 px-4 border-b border-border bg-surface lg:hidden shrink-0">
          <button
            className="text-muted hover:text-foreground cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-foreground" />
            <span className="font-bold text-sm">Admin Panel</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
