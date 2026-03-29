"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { PLATFORM_NAME } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleDemoLogin(role: "reader" | "creator" | "admin") {
    login(role);
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & heading */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-accent">
            <BookOpen className="h-8 w-8" />
            <span className="text-2xl font-bold">{PLATFORM_NAME}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted">
            Sign in to continue reading and creating
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
          {/* Email & password form */}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              // Demo: just log in as reader
              handleDemoLogin("reader");
            }}
          >
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" size="lg" className="w-full">
              Log in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-muted">
                or try a demo account
              </span>
            </div>
          </div>

          {/* Demo login buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleDemoLogin("reader")}
            >
              Log in as Reader
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleDemoLogin("creator")}
            >
              Log in as Creator
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleDemoLogin("admin")}
            >
              Log in as Admin
            </Button>
          </div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
