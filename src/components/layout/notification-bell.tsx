"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from "@/lib/supabase/queries";
import { Bell, Check } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    getUnreadNotificationCount(user.id).then(setUnreadCount);
  }, [user]);

  async function handleOpen() {
    if (!user) return;
    if (!open) {
      const data = await getNotifications(user.id, 10);
      setNotifications(data as Notification[]);
    }
    setOpen(!open);
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="text-muted hover:text-foreground p-2 cursor-pointer relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || "#"}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border last:border-0 ${
                      !n.read ? "bg-accent/5" : ""
                    }`}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-muted mt-1">
                      {formatRelativeDate(n.created_at)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
