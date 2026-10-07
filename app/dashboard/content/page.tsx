"use client";

import { useEffect, useState } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Card, Input, PrimaryButton } from "@/components/ui";
import { type ContentType } from "@/lib/validation/content";

type ContentItem = {
  id: string;
  content_type: ContentType;
  title: string;
  body: string;
  publication_status: string;
};

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [contentType, setContentType] = useState<ContentType>("post");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/content")
      .then(async (response) => {
        const result = (await response.json()) as { items?: ContentItem[]; message?: string };
        if (!response.ok) throw new Error(result.message ?? "Unable to load content.");
        setItems(result.items ?? []);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load content."));
  }, []);

  async function createContent() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: contentType, title, body }),
      });
      const result = (await response.json()) as { item?: ContentItem; message?: string };
      if (!response.ok || !result.item) {
        setError(result.message ?? "Unable to save content.");
        return;
      }
      setItems((current) => [result.item as ContentItem, ...current]);
      setTitle("");
      setBody("");
      setMessage(result.message ?? "Content saved.");
    } catch {
      setError("Unable to reach the content service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout activeItem="Content">
      <DashboardPageHeader
        eyebrow="FEASTYMAP content"
        title="Create a post or offer"
        description="Create content as a draft. Approved content can be published for customer visibility."
      />
      {error ? <p className="mb-5 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}
      {message ? <p className="mb-5 rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200" role="status">{message}</p> : null}
      <Card className="max-w-2xl p-6">
        <div className="space-y-5">
          <label className="block space-y-2 text-sm font-medium text-foreground">
            Content type
            <select className="min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" onChange={(event) => setContentType(event.target.value as ContentType)} value={contentType}>
              <option value="post">Post</option>
              <option value="offer">Offer</option>
            </select>
          </label>
          <Input label="Title" onChange={(event) => setTitle(event.target.value)} value={title} />
          <label className="block space-y-2 text-sm font-medium text-foreground">
            Message
            <textarea className="min-h-32 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20" onChange={(event) => setBody(event.target.value)} value={body} />
          </label>
          <PrimaryButton disabled={saving} onClick={createContent}>{saving ? "Saving…" : "Save draft"}</PrimaryButton>
        </div>
      </Card>
      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <Card className="p-5" key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">{item.content_type}</p>
                <h2 className="mt-1 font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm text-muted">{item.body}</p>
              </div>
              <span className="text-xs text-muted">{item.publication_status}</span>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
