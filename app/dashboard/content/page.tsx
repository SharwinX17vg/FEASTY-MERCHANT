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
import type { ContentAnalyticsDashboard } from "@/lib/validation/contentAnalytics";

type ContentItem = {
  id: string;
  content_type: ContentType;
  title: string;
  body: string;
  starts_at: string | null;
  ends_at: string | null;
  original_price: number | null;
  offer_price: number | null;
  discount_percentage: number | null;
  offer_code: string | null;
  publication_status: string;
  submitted_at: string | null;
  published_at: string | null;
  rejection_reason: string | null;
  image_path: string | null;
  image_url: string | null;
  created_at: string;
  view_count?: number;
  click_count?: number;
  redemption_count?: number;
};

type ContentResponse = {
  items?: ContentItem[];
  analytics?: ContentAnalyticsDashboard;
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
  const [analytics, setAnalytics] = useState<ContentAnalyticsDashboard | null>(null);
  const [role, setRole] = useState("");
  const [contentType, setContentType] = useState<ContentType>("post");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [offerCode, setOfferCode] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [action, setAction] = useState<"submit" | "approve" | "publish" | "reject" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<ContentType>("post");
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editOfferPrice, setEditOfferPrice] = useState("");
  const [editDiscountPercentage, setEditDiscountPercentage] = useState("");
  const [editOfferCode, setEditOfferCode] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [removeEditImage, setRemoveEditImage] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
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
          setAnalytics(content.analytics ?? null);
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
      const formData = new FormData();
      formData.set("content_type", contentType);
      formData.set("title", title);
      formData.set("body", body);
      formData.set("starts_at", startsAt);
      formData.set("ends_at", endsAt);
      formData.set("original_price", originalPrice);
      formData.set("offer_price", offerPrice);
      formData.set("discount_percentage", discountPercentage);
      formData.set("offer_code", offerCode);
      if (image) formData.set("image", image);
      const response = await fetch("/api/content", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as ContentResponse & { item?: ContentItem };
      if (!response.ok || !result.item) {
        setError(result.message ?? "Unable to save content.");
        return;
      }
      setItems((current) => [result.item as ContentItem, ...current]);
      setTitle("");
      setBody("");
      setStartsAt("");
      setEndsAt("");
      setOriginalPrice("");
      setOfferPrice("");
      setDiscountPercentage("");
      setOfferCode("");
      setImage(null);
      setMessage(result.message ?? "Content saved.");
    } catch {
      setError("Unable to reach the content service.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item: ContentItem) {
    setEditingId(item.id);
    setEditType(item.content_type);
    setEditTitle(item.title);
    setEditBody(item.body);
    setEditStartsAt(item.starts_at ? item.starts_at.slice(0, 16) : "");
    setEditEndsAt(item.ends_at ? item.ends_at.slice(0, 16) : "");
    setEditOriginalPrice(item.original_price === null ? "" : String(item.original_price));
    setEditOfferPrice(item.offer_price === null ? "" : String(item.offer_price));
    setEditDiscountPercentage(item.discount_percentage === null ? "" : String(item.discount_percentage));
    setEditOfferCode(item.offer_code ?? "");
    setEditImage(null);
    setRemoveEditImage(false);
    setError("");
  }

  async function saveEdit(item: ContentItem) {
    if (actionId) return;
    setActionId(item.id);
    setAction("edit");
    setError("");
    try {
      const formData = new FormData();
      formData.set("content_type", editType);
      formData.set("title", editTitle);
      formData.set("body", editBody);
      formData.set("starts_at", editStartsAt);
      formData.set("ends_at", editEndsAt);
      formData.set("original_price", editOriginalPrice);
      formData.set("offer_price", editOfferPrice);
      formData.set("discount_percentage", editDiscountPercentage);
      formData.set("offer_code", editOfferCode);
      formData.set("remove_image", String(removeEditImage));
      if (editImage) formData.set("image", editImage);
      const response = await fetch(`/api/content/${item.id}`, {
        method: "PUT",
        body: formData,
      });
      const result = (await response.json()) as { item?: ContentItem; message?: string };
      if (!response.ok || !result.item) {
        setError(result.message ?? "Unable to update content.");
        return;
      }
      setItems((current) => current.map((entry) => (entry.id === item.id ? result.item as ContentItem : entry)));
      setEditingId(null);
      setMessage(result.message ?? "Content updated.");
    } catch {
      setError("Unable to reach the content service.");
    } finally {
      setActionId(null);
      setAction(null);
    }
  }

  async function rejectContent(item: ContentItem) {
    if (actionId) return;
    setActionId(item.id);
    setAction("reject");
    setError("");
    try {
      const response = await fetch(`/api/content/${item.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      const result = (await response.json()) as { item?: ContentItem; message?: string };
      if (!response.ok || !result.item) {
        setError(result.message ?? "Unable to reject content.");
        return;
      }
      setItems((current) => current.map((entry) => (entry.id === item.id ? result.item as ContentItem : entry)));
      setRejectionReason("");
      setMessage(result.message ?? "Content rejected.");
    } catch {
      setError("Unable to reach the content service.");
    } finally {
      setActionId(null);
      setAction(null);
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
          {analytics ? (
            <section className="mt-8" aria-labelledby="content-analytics-heading">
              <h2 className="text-xl font-semibold text-white" id="content-analytics-heading">Content analytics</h2>
              <p className="mt-1 text-sm text-muted">Published and currently active content, measured over the last 30 days.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Total views", analytics.summary.total_views],
                  ["Total clicks", analytics.summary.total_clicks],
                  ["Total redemptions", analytics.summary.total_redemptions],
                  ["Engagement rate", `${analytics.summary.engagement_rate}%`],
                ].map(([label, value]) => (
                  <Card className="p-5" key={String(label)}>
                    <p className="text-sm text-muted">{label}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                  </Card>
                ))}
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="p-5">
                  <h3 className="font-semibold text-white">Daily activity</h3>
                  <p className="mt-1 text-xs text-muted">Last 7 days, with the last 30 days available below.</p>
                  <div className="mt-4 space-y-2">
                    {analytics.daily7.map((day) => (
                      <div className="grid grid-cols-[1fr_repeat(3,auto)] gap-4 text-sm" key={day.date}>
                        <span className="text-muted">{day.date}</span><span>V {day.views}</span><span>C {day.clicks}</span><span>R {day.redemptions}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="font-semibold text-white">Best-performing published content</h3>
                  <div className="mt-4 space-y-3">
                    {analytics.best_performing.length === 0 ? <p className="text-sm text-muted">No active published content yet.</p> : analytics.best_performing.map((item) => (
                      <div className="border-b border-white/10 pb-3 last:border-0 last:pb-0" key={item.content_id}>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted">Views {item.views} · Clicks {item.clicks} · Redemptions {item.redemptions}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <Card className="mt-5 overflow-x-auto p-5">
                <h3 className="font-semibold text-white">Daily activity · last 30 days</h3>
                <div className="mt-4 min-w-[560px] space-y-2 text-sm">
                  {analytics.daily30.map((day) => <div className="grid grid-cols-[1fr_repeat(3,auto)] gap-4" key={day.date}><span className="text-muted">{day.date}</span><span>Views {day.views}</span><span>Clicks {day.clicks}</span><span>Redemptions {day.redemptions}</span></div>)}
                </div>
              </Card>
            </section>
          ) : null}
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Starts (optional)" onChange={(event) => setStartsAt(event.target.value)} type="datetime-local" value={startsAt} />
                <Input label="Ends (optional)" onChange={(event) => setEndsAt(event.target.value)} type="datetime-local" value={endsAt} />
              </div>
              {contentType === "offer" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Original price (optional)" min="0" onChange={(event) => setOriginalPrice(event.target.value)} step="0.01" type="number" value={originalPrice} />
                  <Input label="Offer price (optional)" min="0" onChange={(event) => setOfferPrice(event.target.value)} step="0.01" type="number" value={offerPrice} />
                  <Input label="Discount % (optional)" max="100" min="0" onChange={(event) => setDiscountPercentage(event.target.value)} step="0.01" type="number" value={discountPercentage} />
                  <Input label="Offer code (optional)" onChange={(event) => setOfferCode(event.target.value)} value={offerCode} />
                </div>
              ) : null}
              <label className="block space-y-2 text-sm font-medium text-foreground">
                Image (optional)
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-medium file:text-background"
                  onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <span className="text-xs text-muted">JPG, PNG, or WEBP up to 5 MB.</span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Starts (optional)" onChange={(event) => setEditStartsAt(event.target.value)} type="datetime-local" value={editStartsAt} />
                <Input label="Ends (optional)" onChange={(event) => setEditEndsAt(event.target.value)} type="datetime-local" value={editEndsAt} />
              </div>
              {editType === "offer" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Original price (optional)" min="0" onChange={(event) => setEditOriginalPrice(event.target.value)} step="0.01" type="number" value={editOriginalPrice} />
                  <Input label="Offer price (optional)" min="0" onChange={(event) => setEditOfferPrice(event.target.value)} step="0.01" type="number" value={editOfferPrice} />
                  <Input label="Discount % (optional)" max="100" min="0" onChange={(event) => setEditDiscountPercentage(event.target.value)} step="0.01" type="number" value={editDiscountPercentage} />
                  <Input label="Offer code (optional)" onChange={(event) => setEditOfferCode(event.target.value)} value={editOfferCode} />
                </div>
              ) : null}
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
                    {editingId === item.id ? (
                      <div className="mt-4 space-y-4">
                        <label className="block space-y-2 text-sm font-medium text-foreground">
                          Content type
                          <select className="min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-foreground" onChange={(event) => setEditType(event.target.value as ContentType)} value={editType}>
                            <option value="post">Post</option>
                            <option value="offer">Offer</option>
                          </select>
                        </label>
                        <Input label="Title" onChange={(event) => setEditTitle(event.target.value)} value={editTitle} />
                        <label className="block space-y-2 text-sm font-medium text-foreground">
                          Message
                          <textarea className="min-h-32 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-foreground" onChange={(event) => setEditBody(event.target.value)} value={editBody} />
                        </label>
                        <label className="block space-y-2 text-sm font-medium text-foreground">
                          Replace image
                          <input
                            accept="image/jpeg,image/png,image/webp"
                            className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-medium file:text-background"
                            onChange={(event) => {
                              setEditImage(event.target.files?.[0] ?? null);
                              setRemoveEditImage(false);
                            }}
                            type="file"
                          />
                        </label>
                        {item.image_url ? (
                          <label className="flex items-center gap-2 text-sm text-muted">
                            <input checked={removeEditImage} onChange={(event) => setRemoveEditImage(event.target.checked)} type="checkbox" />
                            Remove current image
                          </label>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        {item.image_url ? <img alt="" className="mt-4 max-h-64 w-full rounded-xl object-cover" src={item.image_url} /> : null}
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted">{item.body}</p>
                        {item.content_type === "offer" ? (
                          <div className="mt-4 flex flex-wrap gap-2 text-sm text-primary">
                            {item.original_price !== null ? <span>Was {item.original_price}</span> : null}
                            {item.offer_price !== null ? <span>Now {item.offer_price}</span> : null}
                            {item.discount_percentage !== null ? <span>{item.discount_percentage}% off</span> : null}
                            {item.offer_code ? <span>Code: {item.offer_code}</span> : null}
                          </div>
                        ) : null}
                      </>
                    )}
                    {item.publication_status === "rejected" && item.rejection_reason ? (
                      <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                        <span className="font-semibold">Review feedback:</span> {item.rejection_reason}
                      </p>
                    ) : null}
                    <dl className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-xs text-muted sm:grid-cols-2">
                      <div><dt className="font-medium text-foreground">Active dates</dt><dd className="mt-1">{dateRange(item)}</dd></div>
                      <div><dt className="font-medium text-foreground">Created</dt><dd className="mt-1">{formatDate(item.created_at)}</dd></div>
                      {item.submitted_at ? <div><dt className="font-medium text-foreground">Submitted</dt><dd className="mt-1">{formatDate(item.submitted_at)}</dd></div> : null}
                      {item.published_at ? <div><dt className="font-medium text-foreground">Published</dt><dd className="mt-1">{formatDate(item.published_at)}</dd></div> : null}
                    </dl>
                    {item.publication_status === "published" ? (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted">
                        <p className="font-medium text-foreground">Analytics</p>
                        <div className="mt-2 flex gap-5">
                          <span>Views: {item.view_count ?? 0}</span>
                          <span>Clicks: {item.click_count ?? 0}</span>
                          {item.content_type === "offer" && item.offer_code ? <span>Redemptions: {item.redemption_count ?? 0}</span> : null}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-3">
                      {editingId === item.id ? (
                        <>
                          <PrimaryButton disabled={actionId === item.id} onClick={() => void saveEdit(item)}>
                            {actionId === item.id && action === "edit" ? "Saving…" : "Save changes"}
                          </PrimaryButton>
                          <SecondaryButton disabled={actionId === item.id} onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
                        </>
                      ) : null}
                      {canSubmitContent(role, item.publication_status) && !editingId ? (
                        <SecondaryButton disabled={actionId === item.id} onClick={() => void startEditing(item)}>
                          Edit
                        </SecondaryButton>
                      ) : null}
                      {canSubmitContent(role, item.publication_status) ? (
                        <SecondaryButton disabled={actionId === item.id || editingId === item.id} onClick={() => void updatePublication(item, "submit")}>
                          {actionId === item.id && action === "submit" ? "Submitting…" : "Submit for Review"}
                        </SecondaryButton>
                      ) : null}
                      {canApproveContent(role, item.publication_status) ? (
                        <SecondaryButton disabled={actionId === item.id} onClick={() => void updatePublication(item, "approve")}>
                          {actionId === item.id && action === "approve" ? "Approving…" : "Approve"}
                        </SecondaryButton>
                      ) : null}
                      {canApproveContent(role, item.publication_status) ? (
                        <div className="flex w-full flex-col gap-2 sm:max-w-md">
                          <Input label="Rejection reason" onChange={(event) => setRejectionReason(event.target.value)} value={rejectionReason} />
                          <SecondaryButton disabled={actionId === item.id} onClick={() => void rejectContent(item)}>
                            {actionId === item.id && action === "reject" ? "Rejecting…" : "Reject"}
                          </SecondaryButton>
                        </div>
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
