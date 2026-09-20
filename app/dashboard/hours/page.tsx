"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  createDefaultBusinessHours,
  DAYS_OF_WEEK,
  type BusinessHours,
  type DayOfWeek,
} from "@/lib/validation/business-hours";

type Branch = { id: string; name: string; status: string };

function normalizeHours(value: unknown): BusinessHours {
  const schedule = createDefaultBusinessHours();
  if (!value || typeof value !== "object" || Array.isArray(value)) return schedule;
  for (const day of DAYS_OF_WEEK) {
    const entry = (value as Record<string, unknown>)[day];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const dayEntry = entry as Record<string, unknown>;
    schedule[day] = {
      is_open: dayEntry.is_open === true,
      open_time: typeof dayEntry.open_time === "string" ? dayEntry.open_time : null,
      close_time: typeof dayEntry.close_time === "string" ? dayEntry.close_time : null,
    };
  }
  return schedule;
}

function dayLabel(day: DayOfWeek) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatTime(value: string | null) {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export default function HoursPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [hours, setHours] = useState<BusinessHours>(createDefaultBusinessHours);
  const [loading, setLoading] = useState(true);
  const [loadingHours, setLoadingHours] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<DayOfWeek, string>>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = useMemo(() => {
    const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
    return day.toLowerCase() as DayOfWeek;
  }, []);
  const todayHours = hours[today];

  useEffect(() => {
    fetch("/api/branches")
      .then(async (response) => {
        const result = (await response.json()) as { branches?: Branch[]; message?: string };
        if (!response.ok) throw new Error(result.message ?? "Unable to load branches.");
        const availableBranches = (result.branches ?? []).filter((branch) => branch.status !== "archived");
        setBranches(availableBranches);
        setBranchId(availableBranches[0]?.id ?? "");
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load branches.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!branchId) return;
    void Promise.resolve().then(() => {
      setLoadingHours(true);
      setError("");
      return fetch(`/api/branches/${branchId}/hours`)
        .then(async (response) => {
          const result = (await response.json()) as { hours?: unknown; message?: string };
          if (!response.ok) throw new Error(result.message ?? "Unable to load business hours.");
          setHours(normalizeHours(result.hours));
        })
        .catch((loadError) => {
          setError(loadError instanceof Error ? loadError.message : "Unable to load business hours.");
        })
        .finally(() => setLoadingHours(false));
    });
  }, [branchId]);

  useEffect(() => {
    if (!editing) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editing]);

  function cancelEdit() {
    if (!window.confirm("Discard your unsaved hours changes?")) return;
    setEditing(false);
    setErrors({});
    if (branchId) {
      fetch(`/api/branches/${branchId}/hours`)
        .then((response) => response.json())
        .then((result: { hours?: unknown }) => setHours(normalizeHours(result.hours)))
        .catch(() => setError("Unable to restore the saved hours."));
    }
  }

  function updateDay(day: DayOfWeek, field: "is_open" | "open_time" | "close_time", value: boolean | string) {
    setHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
        ...(field === "is_open" && value === false
          ? { open_time: null, close_time: null }
          : {}),
      },
    }));
    setErrors((current) => ({ ...current, [day]: undefined }));
  }

  async function saveHours() {
    if (!branchId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/branches/${branchId}/hours`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      const result = (await response.json()) as {
        hours?: unknown;
        errors?: Partial<Record<DayOfWeek, string>>;
        message?: string;
      };
      if (!response.ok) {
        setErrors(result.errors ?? {});
        setError(result.message ?? "Unable to save business hours.");
        return;
      }
      setHours(normalizeHours(result.hours ?? hours));
      setEditing(false);
      setMessage(result.message ?? "Business hours saved.");
    } catch {
      setError("Unable to reach the hours service. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout activeItem="Branches">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-muted">Branch operations</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Business hours</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Set the weekly opening schedule customers see for each branch.</p>
            </div>
            {branchId && !editing ? <PrimaryButton onClick={() => { setMessage(""); setError(""); setEditing(true); }}>Edit hours</PrimaryButton> : null}
          </div>

          {error ? <p className="mt-8 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}
          {message ? <p className="mt-8 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200" role="status">{message}</p> : null}

          {loading ? <Card className="mt-8 p-6"><p className="text-sm text-muted" role="status">Loading branches…</p></Card> : null}
          {!loading && branches.length === 0 ? <Card className="mt-8 p-8 text-center"><h2 className="text-lg font-semibold text-white">No active branches</h2><p className="mt-2 text-sm text-muted">Add a branch before setting its operating hours.</p></Card> : null}
          {!loading && branches.length > 0 ? (
            <>
              <Card className="mt-8 p-5 sm:p-7">
                <label className="block max-w-md space-y-2" htmlFor="hours-branch">
                  <span className="block text-sm font-medium text-foreground">Branch</span>
                  <select className="min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={editing || loadingHours} id="hours-branch" onChange={(event) => setBranchId(event.target.value)} value={branchId}>
                    {branches.map((branch) => <option className="bg-[#1c1c1c]" key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </select>
                </label>
                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/10 p-4" role="status">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Today · {dayLabel(today)}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{todayHours.is_open ? `${formatTime(todayHours.open_time)} – ${formatTime(todayHours.close_time)}` : "Closed today"}</p>
                </div>
              </Card>
              <Card className="mt-5 p-5 sm:p-7">
                <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold text-white">Weekly schedule</h2><p className="mt-1 text-sm text-muted">Use 24-hour time inputs for precise, mobile-friendly editing.</p></div>{loadingHours ? <span className="text-xs text-muted" role="status">Loading…</span> : null}</div>
                <div className="mt-6 divide-y divide-white/10">
                  {DAYS_OF_WEEK.map((day) => (
                    <div className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[7rem_7rem_1fr_1fr]" key={day}>
                      <div className="flex items-center gap-3"><input aria-label={`${dayLabel(day)} open`} checked={hours[day].is_open} className="size-4 accent-primary" disabled={!editing || saving || loadingHours} onChange={(event) => updateDay(day, "is_open", event.target.checked)} type="checkbox" /><span className="text-sm font-medium text-white">{dayLabel(day)}</span></div>
                      {!hours[day].is_open ? <span className="text-sm text-muted sm:col-span-3">Closed</span> : <><label className="space-y-1 text-xs text-muted"><span>Opens</span><input aria-label={`${dayLabel(day)} opening time`} className={`min-h-10 w-full rounded-xl border bg-white/5 px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors[day] ? "border-red-400" : "border-white/15"}`} disabled={!editing || saving || loadingHours} onChange={(event) => updateDay(day, "open_time", event.target.value)} type="time" value={hours[day].open_time ?? ""} /></label><label className="space-y-1 text-xs text-muted"><span>Closes</span><input aria-label={`${dayLabel(day)} closing time`} className={`min-h-10 w-full rounded-xl border bg-white/5 px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors[day] ? "border-red-400" : "border-white/15"}`} disabled={!editing || saving || loadingHours} onChange={(event) => updateDay(day, "close_time", event.target.value)} type="time" value={hours[day].close_time ?? ""} /></label></>}
                      {errors[day] ? <p className="text-sm text-red-300 sm:col-span-4" role="alert">{errors[day]}</p> : null}
                    </div>
                  ))}
                </div>
                {editing ? <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end"><SecondaryButton disabled={saving} onClick={cancelEdit}>Cancel</SecondaryButton><PrimaryButton disabled={saving || loadingHours} onClick={saveHours}>{saving ? "Saving…" : "Save hours"}</PrimaryButton></div> : null}
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
