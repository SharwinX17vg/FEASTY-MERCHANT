"use client";

import { useEffect, useState } from "react";

import { DashboardNotice } from "@/components/dashboard/DashboardNotice";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, SecondaryButton } from "@/components/ui";
import {
  canReviewMenuItems,
  getMenuItemPublicationLabel,
  type MenuPublicationStatus,
} from "@/lib/menu-items/publication";

type Branch = { id: string; name: string; status: string };
type MenuItem = {
  id: string;
  branch_id: string;
  category: string | null;
  description: string | null;
  name: string;
  price: number;
  publication_status: MenuPublicationStatus;
};

export default function MenuReviewPage() {
  const [role, setRole] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReviewItems() {
      try {
        const workspaceResponse = await fetch("/api/workspace/select");
        const workspace = (await workspaceResponse.json()) as { role?: string; message?: string };
        if (!workspaceResponse.ok) throw new Error(workspace.message ?? "Unable to load workspace.");
        if (!canReviewMenuItems(workspace.role)) {
          if (!cancelled) setRole(workspace.role ?? "");
          return;
        }
        if (!cancelled) setRole(workspace.role ?? "");

        const branchesResponse = await fetch("/api/branches");
        const branchesResult = (await branchesResponse.json()) as { branches?: Branch[]; message?: string };
        if (!branchesResponse.ok) throw new Error(branchesResult.message ?? "Unable to load branches.");

        const branchItems = await Promise.all(
          (branchesResult.branches ?? [])
            .filter((branch) => branch.status !== "archived")
            .map(async (branch) => {
              const response = await fetch(`/api/branches/${branch.id}/menu-items`);
              const result = (await response.json()) as { items?: MenuItem[]; message?: string };
              if (!response.ok) throw new Error(result.message ?? "Unable to load menu items.");
              return result.items ?? [];
            }),
        );

        if (!cancelled) setItems(branchItems.flat().filter((item) => item.publication_status === "pending_review"));
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load menu review items.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReviewItems();
    return () => {
      cancelled = true;
    };
  }, []);

  async function approveItem(item: MenuItem) {
    if (approvingId) return;
    setApprovingId(item.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/branches/${item.branch_id}/menu-items/${item.id}/approve`, {
        method: "POST",
      });
      const result = (await response.json()) as { item?: MenuItem; message?: string };
      if (!response.ok || !result.item) throw new Error(result.message ?? "Unable to approve menu item.");
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage(result.message ?? "Menu item approved.");
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Unable to approve menu item.");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <DashboardLayout activeItem="Menu">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <DashboardPageHeader
            description="Review menu items submitted by merchant managers."
            eyebrow="Menu operations"
            title="Menu review"
          />
          {error ? <DashboardNotice kind="error">{error}</DashboardNotice> : null}
          {message ? <DashboardNotice kind="success">{message}</DashboardNotice> : null}
          {!loading && !canReviewMenuItems(role) ? <Card className="mt-8 p-6"><p className="text-sm text-muted">You do not have permission to review menu items.</p></Card> : null}
          {loading ? <Card className="mt-8 p-6"><p className="text-sm text-muted" role="status">Loading pending menu items…</p></Card> : null}
          {!loading && canReviewMenuItems(role) && items.length === 0 ? <Card className="mt-8 p-6"><p className="text-sm text-muted">No menu items are pending review.</p></Card> : null}
          {!loading && canReviewMenuItems(role) && items.length > 0 ? <div className="mt-8 grid gap-5 lg:grid-cols-2">{items.map((item) => <Card className="p-5 sm:p-6" key={item.id}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{item.category || "Menu item"}</p><h2 className="mt-2 text-xl font-semibold text-white">{item.name}</h2></div><span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">{getMenuItemPublicationLabel(item.publication_status)}</span></div><p className="mt-4 min-h-6 text-sm leading-6 text-muted">{item.description || "No description provided."}</p><p className="mt-5 text-lg font-semibold text-white">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(item.price))}</p><SecondaryButton className="mt-5" disabled={approvingId === item.id} onClick={() => void approveItem(item)}>{approvingId === item.id ? "Approving…" : "Approve"}</SecondaryButton></Card>)}</div> : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
