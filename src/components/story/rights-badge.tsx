import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileCheck, Sparkles } from "lucide-react";
import type { BadgeLevel } from "@/lib/types";

interface RightsBadgeProps {
  badgeLevel: BadgeLevel;
  size?: "sm" | "md";
}

const badgeConfig: Record<string, {
  label: string;
  icon: typeof ShieldCheck;
  variant: "success" | "default" | "accent";
  tooltip: string;
} | null> = {
  verified_permission: {
    label: "Verified Permission",
    icon: ShieldCheck,
    variant: "success",
    tooltip: "This creator has admin-verified permission from the featured person",
  },
  permission_documented: {
    label: "Permission Documented",
    icon: FileCheck,
    variant: "default",
    tooltip: "This creator has submitted permission documentation for the featured person",
  },
  ai_generated: {
    label: "AI-Generated",
    icon: Sparkles,
    variant: "accent",
    tooltip: "This story contains AI-generated imagery — no real person is depicted",
  },
  none: null,
};

export function RightsBadge({ badgeLevel, size = "sm" }: RightsBadgeProps) {
  const config = badgeConfig[badgeLevel];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span className="relative group">
      <Badge variant={config.variant} className="gap-1">
        <Icon size={size === "sm" ? 12 : 14} />
        {size === "md" && config.label}
        {size === "sm" && (
          <span className="hidden sm:inline">{config.label}</span>
        )}
      </Badge>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {config.tooltip}
      </span>
    </span>
  );
}
