import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "accent" | "success" | "danger" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-hover text-foreground",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  outline: "border border-border text-muted",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
