"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function toast(type: ToastType, message: string) {
  addToastFn?.(type, message);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right ${
            t.type === "success"
              ? "bg-surface border-success/30 text-success"
              : t.type === "error"
              ? "bg-surface border-danger/30 text-danger"
              : "bg-surface border-accent/30 text-accent"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle size={18} />
          ) : t.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <Info size={18} />
          )}
          <p className="text-sm text-foreground flex-1">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="text-muted hover:text-foreground cursor-pointer">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
