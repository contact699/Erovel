"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  Search,
  Moon,
  Sun,
  Menu,
  X,
  BookOpen,
  PenTool,
  User,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PLATFORM_NAME } from "@/lib/constants";

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the profile dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <BookOpen size={24} className="text-accent" />
          <span className="text-xl font-bold tracking-tight">{PLATFORM_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/browse" className="text-muted hover:text-foreground transition-colors">
            Browse
          </Link>
          <Link href="/creators" className="text-muted hover:text-foreground transition-colors">
            Creators
          </Link>
        </nav>

        {/* Search + actions */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search stories..."
                className="w-48 md:w-64 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
              />
              <button onClick={() => setSearchOpen(false)} className="text-muted hover:text-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="text-muted hover:text-foreground p-2 cursor-pointer" aria-label="Search">
              <Search size={18} />
            </button>
          )}

          {isAuthenticated && <NotificationBell />}

          {isAuthenticated && user ? (
            <div className="hidden md:flex items-center gap-2">
              {user.role === "creator" && (
                <Link href="/dashboard/stories/new">
                  <Button variant="accent" size="sm">
                    <Plus size={14} />
                    Create
                  </Button>
                </Link>
              )}

              {/* Profile dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                >
                  <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-surface shadow-lg py-1 z-50"
                  >
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium truncate">{user.display_name}</p>
                      <p className="text-xs text-muted truncate">@{user.username}</p>
                    </div>

                    <Link
                      href={`/creator/${user.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                      role="menuitem"
                    >
                      <User size={14} />
                      My Profile
                    </Link>

                    {user.role === "creator" && (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                        role="menuitem"
                      >
                        <LayoutDashboard size={14} />
                        Dashboard
                      </Link>
                    )}

                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                        role="menuitem"
                      >
                        <ShieldCheck size={14} />
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        toggleTheme();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                      {theme === "dark" ? "Light mode" : "Dark mode"}
                    </button>

                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                        role="menuitem"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button onClick={toggleTheme} className="text-muted hover:text-foreground p-2 cursor-pointer" aria-label="Toggle theme">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-muted hover:text-foreground p-2 cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface p-4 space-y-1">
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 px-2 py-3 border-b border-border mb-2">
              <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.display_name}</p>
                <p className="text-xs text-muted truncate">@{user.username}</p>
              </div>
            </div>
          )}

          <Link
            href="/browse"
            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <BookOpen size={16} />
            Browse
          </Link>
          <Link
            href="/creators"
            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <User size={16} />
            Creators
          </Link>

          {isAuthenticated && user ? (
            <>
              <div className="border-t border-border my-2" />
              {user.role === "creator" && (
                <>
                  <Link
                    href="/dashboard/stories/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-accent hover:bg-surface-hover transition-colors"
                  >
                    <Plus size={16} />
                    Create story
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                </>
              )}
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  <ShieldCheck size={16} />
                  Admin Panel
                </Link>
              )}
              <Link
                href={`/creator/${user.username}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <User size={16} />
                My Profile
              </Link>
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="border-t border-border my-2" />
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-accent font-medium hover:bg-surface-hover transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
