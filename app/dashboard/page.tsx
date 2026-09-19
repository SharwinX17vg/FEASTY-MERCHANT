import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getCurrentOnboarding } from "@/lib/onboarding/server";
import { getOnboardingRoute, ONBOARDING_STATES } from "@/lib/onboarding/state";
import { redirect } from "next/navigation";
import {
  DashboardIcon,
  type DashboardIconName,
  ProgressBar,
  StatCard,
} from "@/components/dashboard/DashboardWidgets";
import { Card, EmptyState, PrimaryButton, SecondaryButton } from "@/components/ui";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const activities: Array<[string, string, string, DashboardIconName]> = [];
const notifications: Array<[string, string, string, DashboardIconName]> = [];

const quickActions: Array<[string, DashboardIconName]> = [
  ["Add Offer", "offer"],
  ["Add Event", "calendar"],
  ["Add Today's Special", "sparkle"],
  ["Update Menu", "menu"],
  ["Add Branch", "pin"],
];

export default async function DashboardPage() {
  const onboarding = await getCurrentOnboarding().catch(() => null);
  if (onboarding && onboarding.state !== ONBOARDING_STATES.COMPLETED && onboarding.state !== ONBOARDING_STATES.VERIFICATION_IN_PROGRESS) {
    redirect(getOnboardingRoute(onboarding.state));
  }

  let userName = "merchant";
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userName = data.user?.user_metadata?.display_name ?? data.user?.email?.split("@")[0] ?? userName;
  } catch {
    // The proxy allows the visual shell to render without local Supabase configuration.
  }

  return (
    <DashboardLayout activeItem="Dashboard" userName={userName}>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm text-muted">Welcome back,</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{userName}</h1>
              <p className="mt-2 text-sm text-muted">Here&apos;s what&apos;s happening with your business today.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-300">
              <span className="size-2 rounded-full bg-amber-300" /> Pending verification
            </span>
          </section>

          <Card className="mt-8 overflow-hidden border-primary/20 bg-gradient-to-r from-primary/15 via-white/[0.04] to-transparent p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary"><DashboardIcon name="sparkle" /></span>
                  <div><p className="font-semibold text-white">Complete your business profile</p><p className="mt-1 text-sm text-muted">A complete profile helps customers choose you.</p></div>
                </div>
                <div className="mt-5 flex items-center gap-3"><ProgressBar value={60} /><span className="text-sm font-semibold text-primary">60%</span></div>
              </div>
              <a href="/register/business-type">
                <PrimaryButton className="shrink-0">Complete Profile <DashboardIcon name="arrow" className="ml-2 size-4" /></PrimaryButton>
              </a>
            </div>
          </Card>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard accent="bg-primary/15 text-primary" icon="offer" label="Active Offers" value="—" change="No data yet" />
            <StatCard accent="bg-sky-400/15 text-sky-300" icon="calendar" label="Upcoming Events" value="—" change="No data yet" />
            <StatCard accent="bg-violet-400/15 text-violet-300" icon="menu" label="Menu Items" value="—" change="No data yet" />
            <StatCard accent="bg-amber-400/15 text-amber-300" icon="review" label="Customer Reviews" value="—" change="No data yet" />
          </div>

          <section className="mt-8">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Quick actions</h2><span className="text-xs text-muted">Keep your presence fresh</span></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {quickActions.map(([label, icon]) => (
                <SecondaryButton className="justify-start" disabled key={label} title="This workspace action is not available yet"><DashboardIcon name={icon} className="mr-3 size-4 text-primary" />{label}</SecondaryButton>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Recent activity</h2><button className="text-xs font-medium text-primary hover:text-accent" type="button">View all</button></div>
              <div className="mt-6 space-y-5">
                {activities.length === 0 ? (
                  <EmptyState
                    description="Published offers, menu updates, and events will appear here."
                    title="No recent activity"
                  />
                ) : activities.map(([title, description, time, icon], index) => (
                  <div className="flex gap-4" key={title}>
                    <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-primary">{index < activities.length - 1 ? <span className="absolute left-1/2 top-9 h-8 w-px bg-white/10" /> : null}<DashboardIcon name={icon} className="size-4" /></div>
                    <div className="min-w-0"><p className="text-sm font-medium text-white">{title}</p><p className="mt-1 text-xs leading-5 text-muted">{description}</p><p className="mt-1 text-[11px] text-muted">{time}</p></div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <div className="mt-5 space-y-3">
                {notifications.length === 0 ? (
                  <EmptyState description="Important account updates will appear here." title="No notifications" />
                ) : notifications.map(([title, description, action, icon]) => (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4" key={title}>
                    <div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><DashboardIcon name={icon} className="size-4" /></span><div><p className="text-sm font-medium text-white">{title}</p><p className="mt-1 text-xs leading-5 text-muted">{description}</p><button className="mt-2 text-xs font-semibold text-primary hover:text-accent" type="button">{action} →</button></div></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-white">Analytics preview</h2><p className="mt-1 text-xs text-muted">Last 30 days</p></div><DashboardIcon name="chart" className="text-primary" /></div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <EmptyState description="Analytics will appear after your business profile is published." title="No analytics yet" />
              </div>
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-white">Profile completion</h2>
              <div className="mt-5">
                <EmptyState
                  description="Complete onboarding to see your profile progress."
                  title="No profile data yet"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
