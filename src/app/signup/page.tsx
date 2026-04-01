"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { PLATFORM_NAME } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"reader" | "creator">("reader");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !username || !displayName) return;
    await signup(email, password, username, displayName, role);
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      router.push(role === "creator" ? "/dashboard/onboarding" : "/");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-accent">
            <BookOpen className="h-8 w-8" />
            <span className="text-2xl font-bold">{PLATFORM_NAME}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
          <p className="text-sm text-muted">Join {PLATFORM_NAME} as a reader or creator</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="username"
                label="Username"
                placeholder="yourname"
                value={username}
                onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")); clearError(); }}
                autoComplete="username"
              />
              <Input
                id="displayName"
                label="Display Name"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); clearError(); }}
              />
            </div>
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              autoComplete="email"
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Choose a password (min 6 chars)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              autoComplete="new-password"
            />
            <Select
              id="role"
              label="I want to..."
              options={[
                { value: "reader", label: "Read stories" },
                { value: "creator", label: "Write and publish stories" },
              ]}
              value={role}
              onChange={(e) => setRole(e.target.value as "reader" | "creator")}
            />
            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}
            <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!email || !password || !username || !displayName}>
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
