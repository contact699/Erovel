"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Home, Search, Compass, PenTool, User } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const items = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/browse", icon: Compass, label: "Browse" },
    { href: "/search", icon: Search, label: "Search" },
    ...(isAuthenticated && user?.role === "creator"
      ? [{ href: "/dashboard", icon: PenTool, label: "Dashboard" }]
      : []),
    {
      href: isAuthenticated
        ? user?.role === "creator"
          ? `/creator/${user?.username}`
          : "/settings"
        : "/login",
      icon: User,
      label: isAuthenticated ? "Profile" : "Login",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${
                isActive ? "text-accent" : "text-muted"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
