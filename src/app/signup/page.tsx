"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Check, Feather, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { PLATFORM_NAME } from "@/lib/constants";

type Role = "reader" | "creator" | null;

const CREATOR_BENEFITS = [
  "Earn tips directly from your readers",
  "Build a loyal audience for your stories",
  "Flexible scheduling — publish at your own pace",
  "Import existing work from other platforms",
];

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!ageConfirmed) {
      setError("You must confirm you are 18 years or older.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!selectedRole) {
      setError("Please select a role.");
      return;
    }

    login(selectedRole);
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo & heading */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-accent">
            <BookOpen className="h-8 w-8" />
            <span className="text-2xl font-bold">{PLATFORM_NAME}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Join {PLATFORM_NAME}
          </h1>
          <p className="text-sm text-muted">
            Choose how you want to get started
          </p>
        </div>

        {/* Role selection cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Reader card */}
          <button
            type="button"
            onClick={() => setSelectedRole("reader")}
            className={`group cursor-pointer rounded-xl border-2 p-6 text-left transition-all ${
              selectedRole === "reader"
                ? "border-accent bg-accent/5"
                : "border-border bg-surface hover:border-accent/40 hover:bg-surface-hover"
            }`}
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  selectedRole === "reader"
                    ? "bg-accent text-white"
                    : "bg-accent/10 text-accent"
                }`}
              >
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                I&apos;m a Reader
              </h3>
            </div>
            <p className="text-sm text-muted">
              Discover stories, follow your favourite creators, and support the
              writers you love.
            </p>
          </button>

          {/* Creator card */}
          <button
            type="button"
            onClick={() => setSelectedRole("creator")}
            className={`group cursor-pointer rounded-xl border-2 p-6 text-left transition-all ${
              selectedRole === "creator"
                ? "border-accent bg-accent/5"
                : "border-border bg-surface hover:border-accent/40 hover:bg-surface-hover"
            }`}
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  selectedRole === "creator"
                    ? "bg-accent text-white"
                    : "bg-accent/10 text-accent"
                }`}
              >
                <Feather className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                I&apos;m a Creator
              </h3>
            </div>
            <p className="text-sm text-muted">
              Publish your stories, grow your readership, and earn from your
              craft.
            </p>
          </button>
        </div>

        {/* Creator benefits */}
        {selectedRole === "creator" && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Why become a creator?
            </h4>
            <ul className="space-y-2">
              {CREATOR_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Signup form */}
        {selectedRole && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="username"
                label="Username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                id="confirm-password"
                label="Confirm password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              {/* Age confirmation */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
                />
                <span className="text-sm text-muted">
                  I confirm I am 18 years or older
                </span>
              </label>

              {/* Error message */}
              {error && (
                <p className="text-sm text-danger">{error}</p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!ageConfirmed}
              >
                Create {selectedRole === "creator" ? "creator" : "reader"} account
              </Button>
            </form>
          </div>
        )}

        {/* Login link */}
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
