"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";

type DashboardLayoutProps = {
  activeItem?: string;
  children: ReactNode;
};

export function DashboardLayout({
  activeItem = "Dashboard",
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        activeItem={activeItem}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="min-h-screen lg:pl-72">
        <TopNavbar
          mobileOpen={mobileOpen}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main>{children}</main>
      </div>
    </div>
  );
}
