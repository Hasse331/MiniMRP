"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import packageJson from "../../package.json";

const navigation = [
  { href: "/products", label: "Products" },
  { href: "/components", label: "Components" },
  { href: "/inventory", label: "Inventory" },
  { href: "/production", label: "Production" },
  { href: "/purchasing", label: "Purchasing" },
  { href: "/settings", label: "Settings" },
  { href: "/history", label: "History" },
];

export function AppShell({
  children
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/forbidden") {
    return <main className="content">{children}</main>;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>MiniMRP</h1>
        <p className="small muted">Version {packageJson.version}</p>
        <p>Internal component, BOM and inventory management for SAI.</p>
        <nav className="nav">
          {navigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className={pathname.startsWith(item.href) ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="content">
        <div className="live-demo-banner" role="status">
          <strong>LIVE DEMO</strong>
          <span>
            All visitors share the same demo data. Changes are temporary and
            the demo resets periodically. Do not enter real or sensitive
            information.
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
