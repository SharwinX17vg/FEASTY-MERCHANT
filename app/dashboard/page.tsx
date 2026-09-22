import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardNotice } from "@/components/dashboard/DashboardNotice";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { getCurrentOnboarding } from "@/lib/onboarding/server";
import { getOnboardingRoute, ONBOARDING_STATES } from "@/lib/onboarding/state";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createDefaultBusinessHours,
  DAYS_OF_WEEK,
  type BusinessHours,
  type DayOfWeek,
} from "@/lib/validation/business-hours";
import { getValidatedWorkspaceContext } from "@/lib/workspace/context";

type Branch = {
  id: string;
  name: string;
  code: string;
  status: string;
  opening_hours: unknown;
};

type Business = {
  id: string;
  name: string;
  category: string;
  code: string;
  status: string;
};

type DashboardData = {
  business: Business;
  branches: Branch[];
  verificationStatus: string | null;
  activeBranch: Branch | null;
  hours: BusinessHours | null;
  menuSummary: { total: number; available: number; unavailable: number } | null;
  detailError: string | null;
};

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

function getToday(): DayOfWeek {
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long" })
    .format(new Date())
    .toLowerCase();
  return DAYS_OF_WEEK.includes(day as DayOfWeek) ? (day as DayOfWeek) : "monday";
}

function formatTime(value: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function loadDashboardData(): Promise<
  { data: DashboardData } | { error: string; status: number }
> {
  const contextResult = await getValidatedWorkspaceContext();
  if ("error" in contextResult) {
    return { error: contextResult.error, status: contextResult.status };
  }

  const { business, organizationId } = contextResult.data;
  if (!business) {
    return { error: "No business profile is available for this workspace.", status: 404 };
  }

  const supabase = await getSupabaseServerClient();

  const [
    { data: branches, error: branchesError },
    { data: verifications, error: verificationError },
  ] = await Promise.all([
    supabase
      .from("branches")
      .select("id,name,code,status,opening_hours")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("verification_requests")
      .select("status")
      .eq("organization_id", organizationId)
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  if (branchesError) return { error: "Unable to load branch information.", status: 503 };

  const verification = verifications?.[0] ?? null;
  const availableBranches = (branches ?? []) as Branch[];
  const activeBranch = availableBranches.find((branch) => branch.status === "active") ?? null;
  if (!activeBranch) {
    return {
      data: {
        business: business as Business,
        branches: availableBranches,
        verificationStatus: verification?.status ?? null,
        activeBranch: null,
        hours: null,
        menuSummary: null,
        detailError: verificationError
          ? "Verification status could not be loaded. Refresh to try again."
          : null,
      },
    };
  }

  const [{ data: menuItems, error: menuError }, { data: branch, error: hoursError }] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("is_available,status")
        .eq("branch_id", activeBranch.id),
      supabase
        .from("branches")
        .select("opening_hours")
        .eq("id", activeBranch.id)
        .eq("business_id", business.id)
        .single(),
    ]);

  const detailError =
    menuError || hoursError || verificationError
      ? "Some dashboard details could not be loaded. Refresh to try again."
      : null;
  type MenuItemRow = { is_available: boolean; status: string };
  const activeItems = (menuItems ?? []).filter((item: MenuItemRow) => item.status === "active");

  return {
    data: {
      business: business as Business,
      branches: availableBranches,
      verificationStatus: verification?.status ?? null,
      activeBranch,
      hours: hoursError ? null : normalizeHours(branch?.opening_hours),
      menuSummary: menuError
        ? null
        : {
            total: activeItems.length,
            available: activeItems.filter((item: MenuItemRow) => item.is_available).length,
            unavailable: activeItems.filter((item: MenuItemRow) => !item.is_available).length,
          },
      detailError,
    },
  };
}

function StatusBadge({ label, tone }: { label: string; tone: "success" | "warning" | "neutral" }) {
  const styles = {
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    neutral: "border-white/15 bg-white/5 text-muted",
  };
  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-medium ${styles[tone]}`}>
      {label}
    </span>
  );
}

function Stat({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const onboarding = await getCurrentOnboarding().catch(() => null);
  if (
    onboarding &&
    onboarding.state !== ONBOARDING_STATES.COMPLETED &&
    onboarding.state !== ONBOARDING_STATES.VERIFICATION_IN_PROGRESS
  ) {
    redirect(getOnboardingRoute(onboarding.state));
  }

  const result = await loadDashboardData().catch(() => ({
    error: "Unable to load the dashboard overview. Refresh and try again.",
    status: 503,
  }));
  if ("error" in result) {
    return (
      <DashboardLayout activeItem="Dashboard">
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
            <DashboardPageHeader
              description="Review the current state of your merchant workspace."
              eyebrow="Merchant workspace"
              title="Dashboard"
            />
            <DashboardNotice kind="error">{result.error}</DashboardNotice>
            <a className="mt-5 inline-flex" href="/dashboard">
              <PrimaryButton>Refresh dashboard</PrimaryButton>
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { data } = result;
  const todayHours = data.hours?.[getToday()] ?? null;
  const isVerified = data.verificationStatus === "approved" || data.business.status === "approved";
  const verificationLabel = data.verificationStatus
    ? statusLabel(data.verificationStatus)
    : isVerified
      ? "Approved"
      : "Not submitted";

  return (
    <DashboardLayout activeItem="Dashboard">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <DashboardPageHeader
            description="Review the current state of your merchant workspace."
            eyebrow="Merchant workspace"
            title={data.business.name}
          />

          {data.detailError ? (
            <div className="mt-8">
              <DashboardNotice kind="error">{data.detailError}</DashboardNotice>
              <a className="mt-4 inline-flex" href="/dashboard">
                <SecondaryButton>Refresh details</SecondaryButton>
              </a>
            </div>
          ) : null}

          <section aria-label="Business summary" className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <Card className="p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm text-muted">Business summary</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{data.business.name}</h2>
                  <p className="mt-1 text-sm text-muted">{data.business.category}</p>
                </div>
                <StatusBadge
                  label={statusLabel(data.business.status)}
                  tone={data.business.status === "approved" ? "success" : data.business.status === "suspended" || data.business.status === "rejected" ? "warning" : "neutral"}
                />
              </div>
              <dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
                <div><dt className="text-xs text-muted">Business code</dt><dd className="mt-1 font-medium text-white">{data.business.code}</dd></div>
                <div><dt className="text-xs text-muted">Verification</dt><dd className="mt-1 font-medium text-white">{verificationLabel}</dd></div>
                <div><dt className="text-xs text-muted">Branches</dt><dd className="mt-1 font-medium text-white">{data.branches.length}</dd></div>
              </dl>
            </Card>
            <Card className="p-5 sm:p-7">
              <p className="text-sm text-muted">Today&apos;s status</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{data.activeBranch?.name ?? "No active branch"}</h2>
              {todayHours ? (
                <div className="mt-5">
                  <StatusBadge label={todayHours.is_open ? "Open today" : "Closed today"} tone={todayHours.is_open ? "success" : "neutral"} />
                  <p className="mt-4 text-sm text-muted">
                    {todayHours.is_open && todayHours.open_time && todayHours.close_time
                      ? `${formatTime(todayHours.open_time)} – ${formatTime(todayHours.close_time)}`
                      : "No opening hours set for today."}
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-muted">Add an active branch and its hours to see today&apos;s status.</p>
              )}
            </Card>
          </section>

          <section aria-label="Workspace statistics" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat description="Active and inactive records" label="Total branches" value={String(data.branches.length)} />
            <Stat description={data.activeBranch ? data.activeBranch.name : "No active branch"} label="Active branch" value={data.activeBranch ? "1" : "0"} />
            <Stat description={data.menuSummary ? `${data.menuSummary.available} available` : "Unavailable"} label="Menu items" value={data.menuSummary ? String(data.menuSummary.total) : "—"} />
            <Stat description={data.menuSummary ? `${data.menuSummary.unavailable} unavailable` : "Unavailable"} label="Available items" value={data.menuSummary ? String(data.menuSummary.available) : "—"} />
          </section>

          <section aria-labelledby="quick-actions-heading" className="mt-8">
            <h2 className="text-lg font-semibold text-white" id="quick-actions-heading">Quick actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Edit profile", "/dashboard/profile"],
                ["Manage branches", "/dashboard/branches"],
                ["Manage hours", "/dashboard/hours"],
                ["Manage menu", "/dashboard/menu"],
              ].map(([label, href]) => (
                <Link
                  className="inline-flex min-h-11 items-center justify-start rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm shadow-black/10 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
