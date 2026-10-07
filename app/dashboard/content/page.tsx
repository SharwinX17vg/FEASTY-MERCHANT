"use client";

import { useEffect, useState } from "react";

import { DashboardNotice } from "@/components/dashboard/DashboardNotice";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, Input, PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  canApproveContent,
  canPublishContent,
  canSubmitContent,
  getContentPublicationLabel,
} from "@/lib/content/publication";
import { type ContentType } from "@/lib/validation/content";

type ContentItem = {
  id: string;
  content_type: ContentType;
  title: string;
  body: string;
  starts_at: string | null;
  ends_at: string | null;
  publication_status: string;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
};

type ContentResponse = {
  items?: ContentItem[];
  message?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
}

function dateRange(item: ContentItem) {
  if (!item.starts_at && !item.ends_at) return "Always active";
  return `${formatDate(item.starts_at)} – ${formatDate(item.ends_at)}`;
}

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [role, setRole] = useState("");
  const [contentType, setContentType] = useState<ContentType>("post");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [action, setAction] = useState<"submit" | "approve" | "publish" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadContent() {
      try {
        const [workspaceResponse, contentResponse] = await Promise.all([
          fetch("/api/workspace/select"),
          fetch("/api/content"),
        ]);
        const workspace = (await workspaceResponse.json()) as { role?: string; message?: string };
        const content = (await contentResponse.json()) as ContentResponse;
        if (!workspaceResponse.ok) throw new Error(workspace.message ?? "Unable to load workspace.");
        if (!contentResponse.ok) throw new Error(content.message ?? "Unable to load content.");
        if (!cancelled) {
          setRole(workspace.role ?? "");
          setItems(content.items ?? []);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load content.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadContent();
    return () => {
      cancelled = true;
    };
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
      const result = (await response.json()) as ContentResponse & { item?: ContentItem };
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

  async function updatePublication(
    item: ContentItem,
    nextAction: "submit" | "approve" | "publish",
  ) {
    if (actionId) return;
    setActionId(item.id);
    setAction(nextAction);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/content/${item.id}/${nextAction}`, { method: "POST" });
      const result = (await response.json()) as { item?: ContentItem; message?: string };
      if (!response.ok || !result.item) {
        setError(result.message ?? `Unable to ${nextAction} content.`);
        return;
      }
      setItems((current) => current.map((entry) => (entry.id === item.id ? result.item as ContentItem : entry)));
      setMessage(result.message ?? "Content updated.");
    } catch {
      setError("Unable to reach the content service.");
    } finally {
      setActionId(null);
      setAction(null);
    }
  }

  return (
    <DashboardLayout activeItem="Content">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <DashboardPageHeader
            description="Create and manage posts and offers for customer visibility on FEASTYMAP."
            eyebrow="FEASTYMAP content"
            title="Content management"
          />
          {error ? <DashboardNotice kind="error">{error}</DashboardNotice> : null}
          {message ? <DashboardNotice kind="success">{message}</DashboardNotice> : null}

          <Card className="mt-8 max-w-2xl p-6">
            <h2 className="text-lg font-semibold text-white">Create a post or offer</h2>
            <p className="mt-1 text-sm text-muted">New content starts as a draft and must pass the existing review workflow.</p>
            <div className="mt-5 space-y-5">
              <label className="block space-y-2 text-sm font-medium text-foreground">
                Content type
                <select
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setContentType(event.target.value as ContentType)}
                  value={contentType}
                >
                  <option value="post">Post</option>
                  <option value="offer">Offer</option>
                </select>
              </label>
              <Input label="Title" onChange={(event) => setTitle(event.target.value)} value={title} />
              <label className="block space-y-2 text-sm font-medium text-foreground">
                Message
                <textarea
                  className="min-h-32 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setBody(event.target.value)}
                  value={body}
                />
              </label>
              <PrimaryButton disabled={saving} onClick={() => void createContent()}>
                {saving ? "Saving…" : "Save draft"}
              </PrimaryButton>
            </div>
          </Card>

          <div className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Current business content</h2>
                <p className="mt-1 text-sm text-muted">Only content belonging to the active business is shown.</p>
              </div>
              {!loading ? <span className="text-sm text-muted">{items.length} item{items.length === 1 ? "" : "s"}</span> : null}
            </div>
            {loading ? <Card className="mt-5 p-6"><p className="text-sm text-muted" role="status">Loading content…</p></Card> : null}
            {!loading && items.length === 0 ? <Card className="mt-5 p-6"><p className="text-sm text-muted">No posts or offers yet.</p></Card> : null}
            {!loading && items.length > 0 ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {items.map((item) => (
                  <Card className="p-5 sm:p-6" key={item.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{item.content_type}</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
                      </div>
                      <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                        {getContentPublicationLabel(item.publication_status)}
                      </span>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted">{item.body}</p>
                    <dl className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-xs text-muted sm:grid-cols-2">
                      <div><dt className="font-medium text-foreground">Active dates</dt><dd className="mt-1">{dateRange(item)}</dd></div>
                      <div><dt className="font-medium text-foreground">Created</dt><dd className="mt-1">{formatDate(item.created_at)}</dd></div>
                      {item.submitted_at ? <div><dt className="font-medium text-foreground">Submitted</dt><dd className="mt-1">{formatDate(item.submitted_at)}</dd></div> : null}
                      {item.published_at ? <div><dt className="font-medium text-foreground">Published</dt><dd className="mt-1">{formatDate(item.published_at)}</dd></div> : null}
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {canSubmitContent(role, item.publication_status) ? (
                        <SecondaryButton disabled={actionId === item.id} onClick={() => void updatePublication(item, "submit")}>
                          {actionId === item.id && action === "submit" ? "Submitting…" : "Submit for Review"}
                        </SecondaryButton>
                      ) : null}
                      {canApproveContent(role, item.publication_status) ? (
                        <SecondaryButton disabled={actionId === item.id} onClick={() => void updatePublication(item, "approve")}>
                          {actionId === item.id && action === "approve" ? "Approving…" : "Approve"}
                        </SecondaryButton>
                      ) : null}
                      {canPublishContent(role, item.publication_status) ? (
                        <SecondaryButton disabled={actionId === item.id} onClick={() => void updatePublication(item, "publish")}>
                          {actionId === item.id && action === "publish" ? "Publishing…" : "Publish"}
                        </SecondaryButton>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
