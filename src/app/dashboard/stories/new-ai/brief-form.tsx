"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { Brief } from "@/lib/ai/schemas";

interface Props {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
  onNext: () => void;
}

const PLANNING_STYLES: { value: "A" | "B" | "C"; label: string; blurb: string }[] = [
  { value: "A", label: "I write synopses", blurb: "You write one sentence per chapter in the next step." },
  { value: "B", label: "AI drafts an outline", blurb: "Gemini proposes chapter titles + synopses; you edit/approve." },
  { value: "C", label: "Improvise", blurb: "Skip planning. Each chapter is invented on the fly." },
];

export function BriefForm({ brief, onChange, onNext }: Props) {
  const [themeInput, setThemeInput] = useState("");

  function addTheme() {
    const v = themeInput.trim();
    if (!v) return;
    onChange({ themes: [...brief.themes, v] });
    setThemeInput("");
  }

  function removeTheme(idx: number) {
    onChange({ themes: brief.themes.filter((_, i) => i !== idx) });
  }

  function updateCharacter(idx: number, patch: Partial<{ name: string; description: string }>) {
    const next = brief.characters.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChange({ characters: next });
  }

  function addCharacter() {
    onChange({ characters: [...brief.characters, { name: "", description: "" }] });
  }

  function removeCharacter(idx: number) {
    onChange({ characters: brief.characters.filter((_, i) => i !== idx) });
  }

  // Chat format locks to exactly 2 characters
  function setFormat(format: "prose" | "chat") {
    const chars =
      format === "chat"
        ? brief.characters.length === 2
          ? brief.characters
          : [
              brief.characters[0] ?? { name: "", description: "" },
              brief.characters[1] ?? { name: "", description: "" },
            ]
        : brief.characters;
    onChange({ format, characters: chars });
  }

  const canContinue =
    brief.title.trim().length > 0 &&
    brief.description.trim().length > 0 &&
    brief.categoryId.length > 0 &&
    brief.characters.every((c) => c.name.trim() && c.description.trim()) &&
    (brief.format !== "chat" || brief.characters.length === 2);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={brief.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="A Wife Let Loose"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Short description</label>
        <Textarea
          value={brief.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="A bored wife's first affair — slow burn over five chapters."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={brief.categoryId}
            onChange={(e) => onChange({ categoryId: e.target.value })}
            options={[
              { value: "", label: "Pick a category…" },
              ...CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Format</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={brief.format === "prose" ? "accent" : "secondary"}
              size="sm"
              onClick={() => setFormat("prose")}
            >
              Prose
            </Button>
            <Button
              type="button"
              variant={brief.format === "chat" ? "accent" : "secondary"}
              size="sm"
              onClick={() => setFormat("chat")}
            >
              Chat (sext)
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Characters</label>
          {brief.format !== "chat" && (
            <Button type="button" variant="ghost" size="sm" onClick={addCharacter}>
              <Plus size={14} /> Add character
            </Button>
          )}
        </div>
        {brief.characters.map((c, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <Input
              value={c.name}
              onChange={(e) => updateCharacter(idx, { name: e.target.value })}
              placeholder="Name"
              className="w-40"
            />
            <Input
              value={c.description}
              onChange={(e) => updateCharacter(idx, { description: e.target.value })}
              placeholder="One-line description"
              className="flex-1"
            />
            {brief.format !== "chat" && brief.characters.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCharacter(idx)}
              >
                <X size={14} />
              </Button>
            )}
          </div>
        ))}
        {brief.format === "chat" && (
          <p className="text-xs text-muted">
            Chat format requires exactly two characters.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Themes / kinks</label>
        <div className="flex gap-2">
          <Input
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTheme();
              }
            }}
            placeholder="affair, power-imbalance, slow-burn…"
            className="flex-1"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addTheme}>
            Add
          </Button>
        </div>
        {brief.themes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {brief.themes.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-surface-hover text-muted"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTheme(i)}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Chapter count</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={brief.chapterCount}
            onChange={(e) =>
              onChange({
                chapterCount: Math.min(20, Math.max(1, Number(e.target.value) || 1)),
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Planning style</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PLANNING_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ planningStyle: s.value })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                brief.planningStyle === s.value
                  ? "border-accent bg-accent/5"
                  : "border-border hover:bg-surface-hover"
              }`}
            >
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted mt-1">{s.blurb}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button onClick={onNext} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
