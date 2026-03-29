"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Moon, Sun, Menu, X, BookOpen, PenTool } from "lucide-react";
import { useState } from "react";
import { PLATFORM_NAME } from "@/lib/constants";

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
          <Link href="/browse/romance" className="text-muted hover:text-foreground transition-colors">
            Romance
          </Link>
          <Link href="/browse/fantasy" className="text-muted hover:text-foreground transition-colors">
            Fantasy
          </Link>
          <Link href="/browse/chat" className="text-muted hover:text-foreground transition-colors">
            Chat Stories
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
            <button onClick={() => setSearchOpen(true)} className="text-muted hover:text-foreground p-2 cursor-pointer">
              <Search size={18} />
            </button>
          )}

          <button onClick={toggleTheme} className="text-muted hover:text-foreground p-2 cursor-pointer">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated && user ? (
            <div className="hidden md:flex items-center gap-3">
              {user.role === "creator" && (
                <Link href="/dashboard">
                  <Button variant="accent" size="sm">
                    <PenTool size={14} />
                    Dashboard
                  </Button>
                </Link>
              )}
              <Link href={`/creator/${user.username}`}>
                <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
              </Link>
              <button onClick={logout} className="text-sm text-muted hover:text-foreground cursor-pointer">
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
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
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface p-4 space-y-3">
          <Link href="/browse" className="block text-sm text-muted hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
            Browse All
          </Link>
          <Link href="/browse/romance" className="block text-sm text-muted hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
            Romance
          </Link>
          <Link href="/browse/fantasy" className="block text-sm text-muted hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
            Fantasy
          </Link>
          <Link href="/browse/chat" className="block text-sm text-muted hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
            Chat Stories
          </Link>
          <hr className="border-border" />
          {isAuthenticated && user ? (
            <>
              {user.role === "creator" && (
                <Link href="/dashboard" className="block text-sm text-accent" onClick={() => setMobileMenuOpen(false)}>
                  Creator Dashboard
                </Link>
              )}
              <Link href={`/creator/${user.username}`} className="block text-sm text-muted hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                My Profile
              </Link>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block text-sm text-muted hover:text-foreground cursor-pointer">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block text-sm text-muted hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                Log in
              </Link>
              <Link href="/signup" className="block text-sm text-accent font-medium" onClick={() => setMobileMenuOpen(false)}>
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
