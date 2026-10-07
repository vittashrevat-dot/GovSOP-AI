import { NotificationBell } from "@/components/NotificationBell";

/** Thin global top bar holding system-wide controls (compliance alerts). */
export function TopBar() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-end gap-3 border-b border-base-700 bg-base-950/80 px-6">
      <NotificationBell />
    </header>
  );
}
