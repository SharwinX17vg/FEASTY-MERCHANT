import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  DashboardIcon,
  ProgressBar,
  StatCard,
} from "@/components/dashboard/DashboardWidgets";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";

const activities = [
  ["Offer published", "Lunch special is now live on FEASTYMAP.", "10 min ago", "offer"],
  ["Business verification submitted", "Your documents are under review.", "2 hours ago", "check"],
  ["Menu updated", "You added 3 new menu items.", "Yesterday", "menu"],
  ["Event scheduled", "Friday evening event was added.", "Yesterday", "calendar"],
] as const;

const notifications = [
  ["Verification reminder", "Complete your documents to get verified.", "Complete now", "clock"],
  ["Missing opening hours", "Add hours so customers know when to visit.", "Add hours", "clock"],
  ["New feature available", "Try publishing a special for today.", "Explore", "sparkle"],
] as const;

const checklist = [
  ["Business Information", true],
  ["Location", true],
  ["Menu", true],
  ["Opening Hours", false],
  ["Verification Documents", false],
] as const;

export default function DashboardPage() {
  return (
    <DashboardLayout activeItem="Dashboard">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm text-muted">Welcome back,</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Merchant Name</h1>
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
              <PrimaryButton className="shrink-0">Complete Profile <DashboardIcon name="arrow" className="ml-2 size-4" /></PrimaryButton>
            </div>
          </Card>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard accent="bg-primary/15 text-primary" icon="offer" label="Active Offers" value="08" change="+12%" />
            <StatCard accent="bg-sky-400/15 text-sky-300" icon="calendar" label="Upcoming Events" value="03" change="+2 this week" />
            <StatCard accent="bg-violet-400/15 text-violet-300" icon="menu" label="Menu Items" value="42" change="+3 new" />
            <StatCard accent="bg-amber-400/15 text-amber-300" icon="review" label="Customer Reviews" value="128" change="+8 this month" />
          </div>

          <section className="mt-8">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Quick actions</h2><span className="text-xs text-muted">Keep your presence fresh</span></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Add Offer", "offer"],
                ["Add Event", "calendar"],
                ["Add Today&apos;s Special", "sparkle"],
                ["Update Menu", "menu"],
                ["Add Branch", "pin"],
              ].map(([label, icon]) => (
                <SecondaryButton className="justify-start" key={label}><DashboardIcon name={icon as "offer"} className="mr-3 size-4 text-primary" />{label}</SecondaryButton>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Recent activity</h2><button className="text-xs font-medium text-primary hover:text-accent" type="button">View all</button></div>
              <div className="mt-6 space-y-5">
                {activities.map(([title, description, time, icon], index) => (
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
                {notifications.map(([title, description, action, icon]) => (
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
                {[["Views", "12,480", 78], ["Offer Clicks", "3,240", 56], ["Profile Visits", "8,920", 68], ["Customer Engagement", "74%", 74]].map(([label, value, progress]) => <div key={label}><div className="flex justify-between text-sm"><span className="text-muted">{label}</span><span className="font-semibold text-white">{value}</span></div><div className="mt-3"><ProgressBar value={progress as number} /></div></div>)}
              </div>
            </Card>
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-white">Profile completion</h2><p className="mt-1 text-xs text-muted">3 of 5 steps complete</p></div><span className="text-xl font-semibold text-primary">60%</span></div>
              <div className="mt-5 space-y-3">{checklist.map(([label, complete]) => <div className="flex items-center gap-3 text-sm" key={label}><span className={`flex size-5 items-center justify-center rounded-full ${complete ? "bg-primary text-primary-foreground" : "border border-white/20 text-transparent"}`}><DashboardIcon name="check" className="size-3" /></span><span className={complete ? "text-white" : "text-muted"}>{label}</span>{complete ? <span className="ml-auto text-xs text-emerald-400">Done</span> : <span className="ml-auto text-xs text-primary">Add</span>}</div>)}</div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
