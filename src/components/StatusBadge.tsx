import { cn } from "@/lib/utils";

type BadgeVariant = 'active' | 'inactive' | 'on-leave' | 'prospect' | 'at-risk' | 'on-track' | 'exceeding' | 'underperforming' | 'high' | 'medium' | 'low';

const variantStyles: Record<BadgeVariant, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-muted text-muted-foreground',
  'on-leave': 'bg-warning/10 text-warning',
  prospect: 'bg-chart-4/10 text-chart-4',
  'at-risk': 'bg-destructive/10 text-destructive',
  'on-track': 'bg-success/10 text-success',
  exceeding: 'bg-accent/15 text-accent-foreground',
  underperforming: 'bg-destructive/10 text-destructive',
  high: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-destructive/10 text-destructive',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = status as BadgeVariant;
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap",
      variantStyles[variant] || 'bg-muted text-muted-foreground',
      className
    )}>
      {status}
    </span>
  );
}
