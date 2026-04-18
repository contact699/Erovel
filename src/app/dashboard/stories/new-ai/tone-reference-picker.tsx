"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface MyStory {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  toneReferenceText: string | undefined;
  onChange: (text: string | undefined) => void;
}

type Tab = "my_stories" | "platform_story" | "paste";

export function ToneReferencePicker({ toneReferenceText, onChange }: Props) {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("my_stories");
  const [myStories, setMyStories] = useState<MyStory[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [platformSlug, setPlatformSlug] = useState("");
  const [pasted, setPasted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user) return;
    (async () => {
      const { data } = await supabase
        .from("stories")
        .select("id, title, slug")
        .eq("creator_id", user.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
      setMyStories(data ?? []);
    })();
  }, [user]);

  async function fetchToneFromStory(payload: { storyId?: string; storySlug?: string }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/story/tone-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        onChange(undefined);
        return;
      }
      onChange(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      onChange(undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border">
        {(
          [
            ["my_stories", "My stories"],
            ["platform_story", "Platform story"],
            ["paste", "Paste text"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`px-3 py-2 text-sm transition-colors cursor-pointer ${
              tab === value
                ? "border-b-2 border-accent text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "my_stories" && (
        <div className="space-y-2">
          <Select
            value={selectedStoryId}
            onChange={(e) => setSelectedStoryId(e.target.value)}
            options={[
              { value: "", label: myStories.length ? "Pick one of your stories…" : "You have no published stories" },
              ...myStories.map((s) => ({ value: s.id, label: s.title })),
            ]}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!selectedStoryId || loading}
            onClick={() => fetchToneFromStory({ storyId: selectedStoryId })}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Use this as the voice sample
          </Button>
        </div>
      )}

      {tab === "platform_story" && (
        <div className="flex gap-2">
          <Input
            value={platformSlug}
            onChange={(e) => setPlatformSlug(e.target.value)}
            placeholder="Paste a story slug (e.g. a-wife-let-loose-rzjsbt)"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!platformSlug.trim() || loading}
            onClick={() => fetchToneFromStory({ storySlug: platformSlug.trim() })}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Fetch
          </Button>
        </div>
      )}

      {tab === "paste" && (
        <Textarea
          value={pasted}
          onChange={(e) => {
            setPasted(e.target.value);
            onChange(e.target.value.trim() || undefined);
          }}
          placeholder="Paste ~2000 words of writing you want the AI to mimic for tone."
          rows={8}
        />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {toneReferenceText && (
        <div className="text-xs text-muted">
          Voice sample loaded ({toneReferenceText.split(/\s+/).length} words).
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="ml-2 underline hover:text-foreground cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
