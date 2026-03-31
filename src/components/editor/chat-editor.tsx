"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  X,
  Check,
  Users,
  MessageSquarePlus,
} from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import { CHAT_BUBBLE_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatContent, ChatCharacter, ChatMessage, MediaType } from "@/lib/types";

interface ChatEditorProps {
  initialContent?: ChatContent;
  onChange?: (content: ChatContent) => void;
  className?: string;
}

export function ChatEditor({
  initialContent,
  onChange,
  className,
}: ChatEditorProps) {
  const [characters, setCharacters] = useState<ChatCharacter[]>(
    initialContent?.characters || []
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialContent?.messages || []
  );

  // Character form state
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [charName, setCharName] = useState("");
  const [charColor, setCharColor] = useState(CHAT_BUBBLE_COLORS[0]);
  const [charAlignment, setCharAlignment] = useState<"left" | "right">("left");
  const [showCharForm, setShowCharForm] = useState(false);

  // Message composer state
  const [msgCharId, setMsgCharId] = useState("");
  const [msgText, setMsgText] = useState("");
  const [msgMediaUrl, setMsgMediaUrl] = useState<string | null>(null);
  const [msgMediaType, setMsgMediaType] = useState<MediaType | null>(null);

  // Editing message state
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgText, setEditMsgText] = useState("");

  const emitChange = useCallback(
    (chars: ChatCharacter[], msgs: ChatMessage[]) => {
      onChange?.({
        type: "chat",
        characters: chars,
        messages: msgs,
      });
    },
    [onChange]
  );

  // ── Character management ──

  const openNewCharForm = () => {
    setEditingCharId(null);
    setCharName("");
    setCharColor(
      CHAT_BUBBLE_COLORS[characters.length % CHAT_BUBBLE_COLORS.length]
    );
    setCharAlignment(characters.length === 0 ? "left" : "right");
    setShowCharForm(true);
  };

  const openEditCharForm = (char: ChatCharacter) => {
    setEditingCharId(char.id);
    setCharName(char.name);
    setCharColor(char.color);
    setCharAlignment(char.alignment);
    setShowCharForm(true);
  };

  const saveCharacter = () => {
    if (!charName.trim()) return;

    let updated: ChatCharacter[];
    if (editingCharId) {
      updated = characters.map((c) =>
        c.id === editingCharId
          ? { ...c, name: charName.trim(), color: charColor, alignment: charAlignment }
          : c
      );
    } else {
      const newChar: ChatCharacter = {
        id: generateId(),
        name: charName.trim(),
        avatar_url: null,
        color: charColor,
        alignment: charAlignment,
      };
      updated = [...characters, newChar];
    }

    setCharacters(updated);
    emitChange(updated, messages);
    setShowCharForm(false);
    setEditingCharId(null);
    setCharName("");
  };

  const removeCharacter = (id: string) => {
    const updated = characters.filter((c) => c.id !== id);
    const updatedMsgs = messages.filter((m) => m.character_id !== id);
    setCharacters(updated);
    setMessages(updatedMsgs);
    emitChange(updated, updatedMsgs);
  };

  // ── Message management ──

  const addMessage = () => {
    if (!msgText.trim() || !msgCharId) return;

    const newMsg: ChatMessage = {
      id: generateId(),
      character_id: msgCharId,
      text: msgText.trim(),
      media_url: msgMediaUrl,
      media_type: msgMediaType,
      order: messages.length + 1,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    emitChange(characters, updated);
    setMsgText("");
    setMsgMediaUrl(null);
    setMsgMediaType(null);
  };

  const removeMessage = (id: string) => {
    const updated = messages
      .filter((m) => m.id !== id)
      .map((m, i) => ({ ...m, order: i + 1 }));
    setMessages(updated);
    emitChange(characters, updated);
  };

  const startEditMessage = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditMsgText(msg.text);
  };

  const saveEditMessage = () => {
    if (!editMsgText.trim() || !editingMsgId) return;
    const updated = messages.map((m) =>
      m.id === editingMsgId ? { ...m, text: editMsgText.trim() } : m
    );
    setMessages(updated);
    emitChange(characters, updated);
    setEditingMsgId(null);
    setEditMsgText("");
  };

  const moveMessage = (id: string, direction: "up" | "down") => {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === messages.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...messages];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const reordered = updated.map((m, i) => ({ ...m, order: i + 1 }));
    setMessages(reordered);
    emitChange(characters, reordered);
  };

  const handleMediaUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*,.gif";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      let type: MediaType = "image";
      if (file.type.startsWith("video/")) type = "video";
      else if (file.type === "image/gif") type = "gif";
      setMsgMediaUrl(url);
      setMsgMediaType(type);
    };
    input.click();
  };

  const getCharacter = (id: string) => characters.find((c) => c.id === id);

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}>
      {/* Left: Controls */}
      <div className="space-y-6">
        {/* Character Management */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Characters
            </h3>
            <Button size="sm" variant="ghost" onClick={openNewCharForm}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {/* Character list */}
          <div className="space-y-2">
            {characters.map((char) => (
              <div
                key={char.id}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: char.color }}
                />
                <span className="text-sm font-medium flex-1 truncate">
                  {char.name}
                </span>
                <span className="text-xs text-muted">{char.alignment}</span>
                <button
                  onClick={() => openEditCharForm(char)}
                  className="text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removeCharacter(char.id)}
                  className="text-muted hover:text-danger transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {characters.length === 0 && !showCharForm && (
              <p className="text-sm text-muted text-center py-4">
                Add at least two characters to start
              </p>
            )}
          </div>

          {/* Character form */}
          {showCharForm && (
            <div className="mt-3 space-y-3 rounded-md border border-border p-3 bg-background">
              <Input
                placeholder="Character name"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Bubble color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CHAT_BUBBLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCharColor(color)}
                      className={cn(
                        "h-7 w-7 rounded-full transition-all cursor-pointer",
                        charColor === color
                          ? "ring-2 ring-offset-2 ring-offset-background ring-accent scale-110"
                          : "hover:scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Alignment
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCharAlignment("left")}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md border transition-colors cursor-pointer",
                      charAlignment === "left"
                        ? "bg-accent text-white border-accent"
                        : "border-border text-muted hover:text-foreground"
                    )}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setCharAlignment("right")}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md border transition-colors cursor-pointer",
                      charAlignment === "right"
                        ? "bg-accent text-white border-accent"
                        : "border-border text-muted hover:text-foreground"
                    )}
                  >
                    Right
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={saveCharacter} disabled={!charName.trim()}>
                  <Check className="h-3.5 w-3.5" />
                  {editingCharId ? "Update" : "Add"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCharForm(false);
                    setEditingCharId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Message Composer */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <MessageSquarePlus className="h-4 w-4" />
            Add Message
          </h3>

          {characters.length < 1 ? (
            <p className="text-sm text-muted text-center py-4">
              Add characters first
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Character
                </label>
                <select
                  value={msgCharId}
                  onChange={(e) => setMsgCharId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent cursor-pointer"
                >
                  <option value="">Select character...</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Message
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder="Type a message..."
                    rows={2}
                    className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        addMessage();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Media preview */}
              {msgMediaUrl && (
                <div className="relative rounded-md border border-border overflow-hidden">
                  <img
                    src={msgMediaUrl}
                    alt="Attachment"
                    className="w-full max-h-32 object-contain"
                  />
                  <button
                    onClick={() => {
                      setMsgMediaUrl(null);
                      setMsgMediaType(null);
                    }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 cursor-pointer hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={addMessage}
                  disabled={!msgText.trim() || !msgCharId}
                >
                  Add Message
                </Button>
                <Button size="sm" variant="ghost" onClick={handleMediaUpload}>
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Message list (reorderable) */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3">
            Messages ({messages.length})
          </h3>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {messages.map((msg, idx) => {
              const char = getCharacter(msg.character_id);
              return (
                <div
                  key={msg.id}
                  className="flex items-start gap-2 rounded-md border border-border px-2 py-1.5 group"
                >
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <button
                      onClick={() => moveMessage(msg.id, "up")}
                      disabled={idx === 0}
                      className="text-muted hover:text-foreground disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveMessage(msg.id, "down")}
                      disabled={idx === messages.length - 1}
                      className="text-muted hover:text-foreground disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>

                  <div
                    className="h-2 w-2 rounded-full mt-2 shrink-0"
                    style={{ backgroundColor: char?.color || "#999" }}
                  />

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-muted">
                      {char?.name || "Unknown"}
                    </span>
                    {editingMsgId === msg.id ? (
                      <div className="flex gap-1 mt-0.5">
                        <input
                          value={editMsgText}
                          onChange={(e) => setEditMsgText(e.target.value)}
                          className="flex-1 rounded border border-border bg-background px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditMessage();
                            if (e.key === "Escape") setEditingMsgId(null);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={saveEditMessage}
                          className="text-success cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingMsgId(null)}
                          className="text-muted cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground truncate">
                        {msg.text}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => startEditMessage(msg)}
                      className="text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeMessage(msg.id)}
                      className="text-muted hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && (
              <p className="text-sm text-muted text-center py-4">
                No messages yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Live Preview</h3>
        </div>
        <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto bg-background">
          {messages.length === 0 ? (
            <p className="text-sm text-muted text-center py-12">
              Messages will appear here as you add them
            </p>
          ) : (
            messages.map((msg) => {
              const char = getCharacter(msg.character_id);
              const isRight = char?.alignment === "right";

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    isRight ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <span className="text-xs text-muted mb-1 px-1">
                    {char?.name}
                  </span>
                  {msg.media_url && (
                    <img
                      src={msg.media_url}
                      alt=""
                      className="max-w-full max-h-48 rounded-lg mb-1"
                    />
                  )}
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-white",
                      isRight ? "rounded-br-md" : "rounded-bl-md"
                    )}
                    style={{ backgroundColor: char?.color || "#666" }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
