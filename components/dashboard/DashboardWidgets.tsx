import { Card } from "@/components/ui";

export type DashboardIconName =
  | "arrow"
  | "calendar"
  | "chart"
  | "check"
  | "clock"
  | "menu"
  | "offer"
  | "pin"
  | "review"
  | "sparkle";

export function DashboardIcon({
  name,
  className = "size-5",
}: {
  name: DashboardIconName;
  className?: string;
}) {
  const paths: Record<DashboardIconName, string> = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z",
    chart: "M4 19V5m0 14h16M8 16v-4m4 4V8m4 8v-7",
    check: "m5 12 4 4L19 6",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2",
    menu: "M4 6h16M4 12h16M4 18h16",
    offer: "M20 12 12 20 4 12l8-8 8 8Zm-5-1h.01M11 14h.01",
    pin: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    review: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
    sparkle: "m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z",
  };

  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d={paths[name]} />
    </svg>
  );
}

export function StatCard({
  accent,
  icon,
  label,
  value,
  change,
}: {
  accent: string;
  icon: DashboardIconName;
  label: string;
  value: string;
  change: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className={`flex size-10 items-center justify-center rounded-xl ${accent}`}>
          <DashboardIcon name={icon} />
        </span>
        <span className="text-xs text-emerald-400">{change}</span>
      </div>
      <p className="mt-6 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </Card>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}
