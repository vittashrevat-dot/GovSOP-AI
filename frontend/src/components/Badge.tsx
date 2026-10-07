import type { Badge as BadgeData } from "@/lib/types";

const SEVERITY_STYLES: Record<string, string> = {
  warning: "border-warn/60 bg-warn-bg text-warn",
  none: "border-base-600 bg-base-800 text-slate-400",
};

export function Badge({ badge }: { badge: BadgeData }) {
  const style = SEVERITY_STYLES[badge.severity] ?? SEVERITY_STYLES.none;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${style}`}
      data-severity={badge.severity}
    >
      {badge.label}
    </span>
  );
}

export function BadgeList({ badges }: { badges: BadgeData[] }) {
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b, i) => (
        <Badge key={`${b.label}-${i}`} badge={b} />
      ))}
    </div>
  );
}
