"use client";

import { useEffect, useState, type FormEvent } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardNotice } from "@/components/dashboard/DashboardNotice";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Card, Input, PrimaryButton, SecondaryButton } from "@/components/ui";
import type { BusinessProfileValues } from "@/lib/validation/business-profile";

type BusinessProfile = BusinessProfileValues & {
  id: string;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const emptyValues: BusinessProfileValues = {
  name: "",
  category: "",
  description: "",
  email: "",
  phone: "",
  website_url: "",
};

function displayValue(value: string | null | undefined) {
  return value?.trim() || "Not provided";
}

export default function MerchantProfilePage() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [values, setValues] = useState<BusinessProfileValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessProfileValues, string>>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/merchant-profile")
      .then(async (response) => {
        const result = (await response.json()) as { business?: BusinessProfile; message?: string };
        if (!response.ok || !result.business) throw new Error(result.message ?? "Unable to load the business profile.");
        setBusiness(result.business);
        setValues({
          name: result.business.name,
          category: result.business.category,
          description: result.business.description ?? "",
          email: result.business.email ?? "",
          phone: result.business.phone ?? "",
          website_url: result.business.website_url ?? "",
        });
      })
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!editing) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editing]);

  function startEditing() {
    setMessage("");
    setError("");
    setErrors({});
    setEditing(true);
  }

  function cancelEditing() {
    if (!business || !window.confirm("Discard your unsaved changes?")) return;
    setValues({
      name: business.name,
      category: business.category,
      description: business.description ?? "",
      email: business.email ?? "",
      phone: business.phone ?? "",
      website_url: business.website_url ?? "",
    });
    setErrors({});
    setError("");
    setEditing(false);
  }

  function updateValue(field: keyof BusinessProfileValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/merchant-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as {
        business?: BusinessProfile;
        errors?: Partial<Record<keyof BusinessProfileValues, string>>;
        message?: string;
      };
      if (!response.ok || !result.business) {
        setErrors(result.errors ?? {});
        setError(result.message ?? "Unable to save the business profile.");
        return;
      }
      setBusiness(result.business);
      setValues({
        name: result.business.name,
        category: result.business.category,
        description: result.business.description ?? "",
        email: result.business.email ?? "",
        phone: result.business.phone ?? "",
        website_url: result.business.website_url ?? "",
      });
      setEditing(false);
      setMessage(result.message ?? "Business profile saved.");
    } catch {
      setError("Unable to reach the profile service. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout activeItem="Profile">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <DashboardPageHeader
            action={!loading && business && !editing ? <PrimaryButton onClick={startEditing}>Edit profile</PrimaryButton> : undefined}
            description="Keep the information customers see about your business accurate and up to date."
            eyebrow="Business workspace"
            title="Business profile"
          />

          {loading ? <Card className="mt-8 p-6"><p className="text-sm text-muted" role="status">Loading your business profile…</p></Card> : null}
          {error ? <DashboardNotice kind="error">{error}</DashboardNotice> : null}
          {message ? <DashboardNotice kind="success">{message}</DashboardNotice> : null}

          {!loading && business ? (
            <Card className="mt-8 p-5 sm:p-7">
              {editing ? (
                <form className="space-y-6" onSubmit={saveProfile}>
                  <div><h2 className="text-lg font-semibold text-white">Edit business details</h2><p className="mt-1 text-sm text-muted">Only business profile details can be changed here. Verification and system fields are protected.</p></div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input error={errors.name} label="Business name" maxLength={160} name="name" onChange={(event) => updateValue("name", event.target.value)} required value={values.name} />
                    <Input error={errors.category} label="Category" maxLength={80} name="category" onChange={(event) => updateValue("category", event.target.value)} required value={values.category} />
                    <Input autoComplete="email" error={errors.email} label="Business email" name="email" onChange={(event) => updateValue("email", event.target.value)} type="email" value={values.email} />
                    <Input autoComplete="tel" error={errors.phone} label="Business phone" maxLength={40} name="phone" onChange={(event) => updateValue("phone", event.target.value)} value={values.phone} />
                    <Input className="sm:col-span-2" error={errors.website_url} hint="Include https:// or http://" label="Website" name="website_url" onChange={(event) => updateValue("website_url", event.target.value)} type="url" value={values.website_url} />
                    <label className="block space-y-2 sm:col-span-2" htmlFor="description">
                      <span className="block text-sm font-medium text-foreground">Description</span>
                      <textarea aria-describedby={errors.description ? "description-error" : undefined} aria-invalid={Boolean(errors.description)} className={`min-h-32 w-full resize-y rounded-xl border bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.description ? "border-red-400" : "border-white/15"}`} id="description" maxLength={2000} name="description" onChange={(event) => updateValue("description", event.target.value)} value={values.description} />
                      {errors.description ? <span className="block text-sm text-red-300" id="description-error">{errors.description}</span> : null}
                    </label>
                  </div>
                  <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                    <SecondaryButton disabled={saving} onClick={cancelEditing}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={saving} type="submit">{saving ? "Saving…" : "Save changes"}</PrimaryButton>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{displayValue(business.category)}</p><h2 className="mt-2 text-2xl font-semibold text-white">{business.name}</h2><p className="mt-2 text-sm text-muted">{displayValue(business.description)}</p></div>
                    <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium capitalize text-muted">{business.status.replace("_", " ")}</span>
                  </div>
                  <dl className="grid gap-x-8 gap-y-6 pt-6 sm:grid-cols-2">
                    <div><dt className="text-xs uppercase tracking-wide text-muted">Business code</dt><dd className="mt-1 text-sm text-white">{business.code}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-muted">Email</dt><dd className="mt-1 break-words text-sm text-white">{displayValue(business.email)}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-muted">Phone</dt><dd className="mt-1 text-sm text-white">{displayValue(business.phone)}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-muted">Website</dt><dd className="mt-1 break-words text-sm text-white">{displayValue(business.website_url)}</dd></div>
                  </dl>
                </div>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
