"use client";

import { useState, type ReactNode } from "react";

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        activeItem={activeItem}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="min-h-screen lg:pl-72">
        <TopNavbar onMenuClick={() => setMobileOpen(true)} />
        <main>{children}</main>
      </div>
    </div>
  );
}
