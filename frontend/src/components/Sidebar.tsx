"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "AI Assistant", hint: "Ask in natural language" },
  { href: "/search", label: "Search", hint: "Find documents fast" },
  { href: "/directory", label: "Directory", hint: "Browse & compliance" },
  { href: "/dashboard", label: "Dashboard", hint: "Extracted insights" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-base-700 bg-base-900">
      <div className="border-b border-base-700 px-5 py-4">
        <div className="font-mono text-sm uppercase tracking-widest text-accent">
          GovSOP AI
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-md px-3 py-2 transition ${
                active
                  ? "bg-base-700 text-slate-100"
                  : "text-slate-400 hover:bg-base-800 hover:text-slate-200"
              }`}
            >
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-slate-500">{item.hint}</div>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
