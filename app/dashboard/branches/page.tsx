"use client";

import { useEffect, useState, type FormEvent } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, Input, PrimaryButton, SecondaryButton } from "@/components/ui";
import type { BranchValues } from "@/lib/validation/branch";

type Branch = BranchValues & {
  id: string;
  business_id: string;
  code: string;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
};

const emptyValues: BranchValues = {
  name: "",
  address_line_1: "",
  address_line_2: null,
  city: "",
  state: null,
  postal_code: null,
  country_code: "IN",
  phone: null,
};

type FieldErrors = Partial<Record<keyof BranchValues, string>>;

function valuesFromBranch(branch: Branch): BranchValues {
  return {
    name: branch.name,
    address_line_1: branch.address_line_1,
    address_line_2: branch.address_line_2,
    city: branch.city,
    state: branch.state,
    postal_code: branch.postal_code,
    country_code: branch.country_code,
    phone: branch.phone,
  };
}

function displayValue(value: string | null | undefined) {
  return value?.trim() || "Not provided";
}

function BranchFields({
  values,
  errors,
  onChange,
}: {
  values: BranchValues;
  errors: FieldErrors;
  onChange: (field: keyof BranchValues, value: string) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Input className="sm:col-span-2" error={errors.name} label="Location name" maxLength={160} name="name" onChange={(event) => onChange("name", event.target.value)} required value={values.name} />
      <Input className="sm:col-span-2" error={errors.address_line_1} label="Address" maxLength={240} name="address_line_1" onChange={(event) => onChange("address_line_1", event.target.value)} required value={values.address_line_1} />
      <Input error={errors.address_line_2} label="Address line 2" maxLength={240} name="address_line_2" onChange={(event) => onChange("address_line_2", event.target.value)} value={values.address_line_2 ?? ""} />
      <Input error={errors.city} label="City" maxLength={120} name="city" onChange={(event) => onChange("city", event.target.value)} required value={values.city} />
      <Input error={errors.state} label="State / region" maxLength={120} name="state" onChange={(event) => onChange("state", event.target.value)} value={values.state ?? ""} />
      <Input error={errors.postal_code} label="Postal code" maxLength={30} name="postal_code" onChange={(event) => onChange("postal_code", event.target.value)} value={values.postal_code ?? ""} />
      <Input error={errors.country_code} hint="Use a two-letter code, such as IN." label="Country code" maxLength={2} name="country_code" onChange={(event) => onChange("country_code", event.target.value)} required value={values.country_code} />
      <Input autoComplete="tel" error={errors.phone} label="Location phone" maxLength={40} name="phone" onChange={(event) => onChange("phone", event.target.value)} value={values.phone ?? ""} />
    </div>
  );
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [values, setValues] = useState<BranchValues>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadBranches() {
    setLoading(true);
    try {
      const response = await fetch("/api/branches");
      const result = (await response.json()) as { branches?: Branch[]; message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to load branches.");
      setBranches(result.branches ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load branches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadBranches());
  }, []);

  useEffect(() => {
    if (!editingId) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editingId]);

  function startAdd() {
    setEditingId("new");
    setValues(emptyValues);
    setErrors({});
    setMessage("");
    setError("");
  }

  function startEdit(branch: Branch) {
    setEditingId(branch.id);
    setValues(valuesFromBranch(branch));
    setErrors({});
    setMessage("");
    setError("");
  }

  function cancelEdit() {
    if (!window.confirm("Discard your unsaved branch changes?")) return;
    setEditingId(null);
    setValues(emptyValues);
    setErrors({});
  }

  function updateValue(field: keyof BranchValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function saveBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(editingId === "new" ? "/api/branches" : `/api/branches/${editingId}`, {
        method: editingId === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { branch?: Branch; errors?: FieldErrors; message?: string };
      if (!response.ok || !result.branch) {
        setErrors(result.errors ?? {});
        setError(result.message ?? "Unable to save the branch.");
        return;
      }
      setBranches((current) => editingId === "new" ? [...current, result.branch as Branch] : current.map((branch) => branch.id === editingId ? result.branch as Branch : branch));
      setEditingId(null);
      setValues(emptyValues);
      setMessage(result.message ?? "Branch saved.");
    } catch {
      setError("Unable to reach the branch service. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(branch: Branch, requestedStatus?: "active" | "inactive" | "archived") {
    const nextStatus = requestedStatus ?? (branch.status === "active" ? "inactive" : "active");
    if (!window.confirm(`${nextStatus === "archived" ? "Archive" : "Mark"} this branch ${nextStatus}?`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = (await response.json()) as { branch?: Branch; message?: string };
      if (!response.ok || !result.branch) throw new Error(result.message ?? "Unable to update branch status.");
      setBranches((current) => current.map((item) => item.id === branch.id ? result.branch as Branch : item));
      setMessage(result.message ?? "Branch status updated.");
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update branch status.");
    }
  }

  return (
    <DashboardLayout activeItem="Branches">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-muted">Business workspace</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Branches</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage the locations customers can find for your business.</p>
            </div>
            {!editingId ? <PrimaryButton onClick={startAdd}>Add branch</PrimaryButton> : null}
          </div>

          {error ? <p className="mt-8 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}
          {message ? <p className="mt-8 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200" role="status">{message}</p> : null}

          {editingId ? (
            <Card className="mt-8 p-5 sm:p-7">
              <div className="mb-6"><h2 className="text-lg font-semibold text-white">{editingId === "new" ? "Add a branch" : "Edit branch"}</h2><p className="mt-1 text-sm text-muted">Enter the customer-facing location details. System and ownership fields are protected.</p></div>
              <form className="space-y-6" onSubmit={saveBranch}>
                <BranchFields errors={errors} onChange={updateValue} values={values} />
                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                  <SecondaryButton disabled={saving} onClick={cancelEdit}>Cancel</SecondaryButton>
                  <PrimaryButton disabled={saving} type="submit">{saving ? "Saving…" : editingId === "new" ? "Add branch" : "Save changes"}</PrimaryButton>
                </div>
              </form>
            </Card>
          ) : null}

          {loading ? <Card className="mt-8 p-6"><p className="text-sm text-muted" role="status">Loading branches…</p></Card> : null}
          {!loading && !editingId && branches.length === 0 ? <Card className="mt-8 p-8 text-center"><h2 className="text-lg font-semibold text-white">No branches yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Add your first location to help customers find the right place to visit.</p><PrimaryButton className="mt-5" onClick={startAdd}>Add your first branch</PrimaryButton></Card> : null}
          {!loading && !editingId && branches.length > 0 ? (
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {branches.map((branch) => (
                <Card className="p-5 sm:p-6" key={branch.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{branch.code}</p><h2 className="mt-2 text-xl font-semibold text-white">{branch.name}</h2></div>
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${branch.status === "active" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-muted"}`}>{branch.status}</span>
                  </div>
                  <address className="mt-5 not-italic text-sm leading-6 text-muted">{branch.address_line_1}{branch.address_line_2 ? <><br />{branch.address_line_2}</> : null}<br />{branch.city}{branch.state ? `, ${branch.state}` : ""}{branch.postal_code ? ` ${branch.postal_code}` : ""}<br />{branch.country_code}</address>
                  <dl className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-sm sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-wide text-muted">Phone</dt><dd className="mt-1 text-white">{displayValue(branch.phone)}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted">Country</dt><dd className="mt-1 text-white">{branch.country_code}</dd></div></dl>
                  <div className="mt-6 flex flex-wrap gap-3"><SecondaryButton onClick={() => startEdit(branch)}>Edit</SecondaryButton>{branch.status !== "archived" ? <><SecondaryButton onClick={() => updateStatus(branch)}>{branch.status === "active" ? "Deactivate" : "Activate"}</SecondaryButton><SecondaryButton onClick={() => updateStatus(branch, "archived")}>Archive</SecondaryButton></> : null}</div>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
