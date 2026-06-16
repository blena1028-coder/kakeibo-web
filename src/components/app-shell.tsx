"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, History, Home, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/history", label: "履歴", icon: History },
  { href: "/analytics", label: "分析", icon: BarChart3 },
  { href: "/settings", label: "設定", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const staticSegments = new Set(["history", "analytics", "settings", "deploy"]);
  const hideNav = firstSegment === "deploy";
  const basePath = firstSegment && !staticSegments.has(firstSegment) ? `/${firstSegment}` : "";

  return (
    <div className="app-shell">
      <div className="app-frame">{children}</div>
      {hideNav ? null : (
      <nav className="bottom-nav" aria-label="メインナビゲーション">
        {navItems.map((item) => {
          const Icon = item.icon;
          const href = item.href === "/" ? basePath || "/" : `${basePath}${item.href}`;
          const active = pathname === href;
          return (
            <Link className={active ? "nav-item active" : "nav-item"} href={href} key={item.href}>
              <Icon aria-hidden size={20} strokeWidth={2.2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      )}
    </div>
  );
}
