"use client";

import { useEffect, useState } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, Input, PrimaryButton, SecondaryButton } from "@/components/ui";
import type { MenuItemValues } from "@/lib/validation/menu-item";

type Branch = { id: string; name: string; status: string };
type MenuItem = MenuItemValues & {
  id: string;
  branch_id: string;
  code: string;
  status: "active" | "archived";
};
type FieldErrors = Partial<Record<keyof MenuItemValues, string>>;

const emptyItem: MenuItemValues = {
  name: "",
  description: null,
  category: null,
  price: 0,
  is_available: true,
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

export default function MenuPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [values, setValues] = useState<MenuItemValues>(emptyItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/branches")
      .then(async (response) => {
        const result = (await response.json()) as { branches?: Branch[]; message?: string };
        if (!response.ok) throw new Error(result.message ?? "Unable to load branches.");
        const activeBranches = (result.branches ?? []).filter((branch) => branch.status !== "archived");
        setBranches(activeBranches);
        setBranchId(activeBranches[0]?.id ?? "");
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load branches."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!branchId) return;
    void Promise.resolve().then(() => {
      setLoadingItems(true);
      return fetch(`/api/branches/${branchId}/menu-items`)
        .then(async (response) => {
          const result = (await response.json()) as { items?: MenuItem[]; message?: string };
          if (!response.ok) throw new Error(result.message ?? "Unable to load menu items.");
          setItems(result.items ?? []);
        })
        .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load menu items."))
        .finally(() => setLoadingItems(false));
    });
  }, [branchId]);

  useEffect(() => {
    if (!editingId) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [editingId]);

  function startAdd() {
    setEditingId("new");
    setValues(emptyItem);
    setErrors({});
    setMessage("");
    setError("");
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setValues({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      is_available: item.is_available,
    });
    setErrors({});
    setMessage("");
    setError("");
  }

  function cancelEdit() {
    if (!window.confirm("Discard your unsaved menu changes?")) return;
    setEditingId(null);
    setValues(emptyItem);
    setErrors({});
  }

  function updateValue(field: keyof MenuItemValues, value: string | number | boolean | null) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function saveItem() {
    if (!branchId || !editingId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        editingId === "new"
          ? `/api/branches/${branchId}/menu-items`
          : `/api/branches/${branchId}/menu-items/${editingId}`,
        {
          method: editingId === "new" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const result = (await response.json()) as { item?: MenuItem; errors?: FieldErrors; message?: string };
      if (!response.ok || !result.item) {
        setErrors(result.errors ?? {});
        setError(result.message ?? "Unable to save menu item.");
        return;
      }
      setItems((current) =>
        editingId === "new"
          ? [...current, result.item as MenuItem]
          : current.map((item) => (item.id === editingId ? (result.item as MenuItem) : item)),
      );
      setEditingId(null);
      setValues(emptyItem);
      setMessage(result.message ?? "Menu item saved.");
    } catch {
      setError("Unable to reach the menu service. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item: MenuItem, changes: { is_available?: boolean; status?: "active" | "archived" }) {
    const confirmation = changes.status === "archived"
      ? "Archive this menu item?"
      : `${changes.is_available ? "Make" : "Mark"} this item ${changes.is_available ? "available" : "unavailable"}?`;
    if (!window.confirm(confirmation)) return;
    try {
      const response = await fetch(`/api/branches/${branchId}/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const result = (await response.json()) as { item?: MenuItem; message?: string };
      if (!response.ok || !result.item) throw new Error(result.message ?? "Unable to update menu item.");
      setItems((current) => current.map((entry) => (entry.id === item.id ? (result.item as MenuItem) : entry)));
      setMessage(result.message ?? "Menu item status updated.");
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update menu item.");
    }
  }

  return (
    <DashboardLayout activeItem="Menu">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-muted">Branch operations</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Menu</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage the items customers can discover at each branch.</p>
            </div>
            {branchId && !editingId ? <PrimaryButton onClick={startAdd}>Add menu item</PrimaryButton> : null}
          </div>
          {error ? <p className="mt-8 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}
          {message ? <p className="mt-8 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200" role="status">{message}</p> : null}
          {loading ? <Card className="mt-8 p-6"><p className="text-sm text-muted" role="status">Loading branches…</p></Card> : null}
          {!loading && branches.length === 0 ? <Card className="mt-8 p-8 text-center"><h2 className="text-lg font-semibold text-white">No active branches</h2><p className="mt-2 text-sm text-muted">Add a branch before managing menu items.</p></Card> : null}
          {!loading && branches.length > 0 ? (
            <>
              <Card className="mt-8 p-5 sm:p-7">
                <label className="block max-w-md space-y-2" htmlFor="menu-branch">
                  <span className="block text-sm font-medium text-foreground">Branch</span>
                  <select className="min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={Boolean(editingId) || loadingItems} id="menu-branch" onChange={(event) => setBranchId(event.target.value)} value={branchId}>
                    {branches.map((branch) => <option className="bg-[#1c1c1c]" key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </select>
                </label>
              </Card>
              {editingId ? (
                <Card className="mt-5 p-5 sm:p-7">
                  <h2 className="text-lg font-semibold text-white">{editingId === "new" ? "Add menu item" : "Edit menu item"}</h2>
                  <p className="mt-1 text-sm text-muted">Keep item details concise and customer-friendly.</p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Input className="sm:col-span-2" error={errors.name} label="Item name" maxLength={160} onChange={(event) => updateValue("name", event.target.value)} required value={values.name} />
                    <Input error={errors.category} label="Category / section" maxLength={80} onChange={(event) => updateValue("category", event.target.value)} value={values.category ?? ""} />
                    <Input error={errors.price} label="Price (INR)" min="0" onChange={(event) => updateValue("price", event.target.value)} required step="0.01" type="number" value={values.price || ""} />
                    <label className="block space-y-2 sm:col-span-2" htmlFor="menu-description">
                      <span className="block text-sm font-medium text-foreground">Description</span>
                      <textarea aria-invalid={Boolean(errors.description)} className={`min-h-28 w-full resize-y rounded-xl border bg-white/5 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.description ? "border-red-400" : "border-white/15"}`} id="menu-description" maxLength={2000} onChange={(event) => updateValue("description", event.target.value)} value={values.description ?? ""} />
                      {errors.description ? <span className="block text-sm text-red-300">{errors.description}</span> : null}
                    </label>
                    <label className="flex items-center gap-3 text-sm text-white sm:col-span-2"><input checked={values.is_available} className="size-4 accent-primary" onChange={(event) => updateValue("is_available", event.target.checked)} type="checkbox" />Available to customers</label>
                  </div>
                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end"><SecondaryButton disabled={saving} onClick={cancelEdit}>Cancel</SecondaryButton><PrimaryButton disabled={saving} onClick={saveItem}>{saving ? "Saving…" : "Save item"}</PrimaryButton></div>
                </Card>
              ) : null}
              {!editingId && loadingItems ? <Card className="mt-5 p-6"><p className="text-sm text-muted" role="status">Loading menu items…</p></Card> : null}
              {!editingId && !loadingItems && items.filter((item) => item.status !== "archived").length === 0 ? <Card className="mt-5 p-8 text-center"><h2 className="text-lg font-semibold text-white">No menu items yet</h2><p className="mt-2 text-sm text-muted">Add your first item to start building this branch&apos;s menu.</p><PrimaryButton className="mt-5" onClick={startAdd}>Add your first item</PrimaryButton></Card> : null}
              {!editingId && !loadingItems && items.filter((item) => item.status !== "archived").length > 0 ? <div className="mt-5 grid gap-5 lg:grid-cols-2">{items.filter((item) => item.status !== "archived").map((item) => <Card className="p-5 sm:p-6" key={item.id}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{item.category || "Menu item"}</p><h2 className="mt-2 text-xl font-semibold text-white">{item.name}</h2></div><span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${item.is_available ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>{item.is_available ? "Available" : "Unavailable"}</span></div><p className="mt-4 min-h-6 text-sm leading-6 text-muted">{item.description || "No description provided."}</p><p className="mt-5 text-lg font-semibold text-white">{currency(Number(item.price))}</p><div className="mt-5 flex flex-wrap gap-3"><SecondaryButton onClick={() => startEdit(item)}>Edit</SecondaryButton><SecondaryButton onClick={() => updateStatus(item, { is_available: !item.is_available })}>{item.is_available ? "Mark unavailable" : "Mark available"}</SecondaryButton><SecondaryButton onClick={() => updateStatus(item, { status: "archived" })}>Archive</SecondaryButton></div></Card>)}</div> : null}
            </>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
