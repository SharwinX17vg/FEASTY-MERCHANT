import { Card } from "@/components/ui";

function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-lg bg-white/10 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading merchant dashboard"
      className="min-h-screen bg-background text-foreground"
      role="status"
    >
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>

        <section aria-label="Loading business summary" className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="p-5 sm:p-7">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-4 h-8 w-72 max-w-full" />
            <Skeleton className="mt-2 h-4 w-40" />
            <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
              <div><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-5 w-24" /></div>
              <div><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-5 w-28" /></div>
              <div><Skeleton className="h-3 w-16" /><Skeleton className="mt-2 h-5 w-10" /></div>
            </div>
          </Card>
          <Card className="p-5 sm:p-7">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-7 w-44 max-w-full" />
            <Skeleton className="mt-5 h-7 w-28" />
            <Skeleton className="mt-4 h-4 w-40" />
          </Card>
        </section>

        <section aria-label="Loading dashboard statistics" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["branches", "active-branch", "menu-items", "available-items"].map((item) => (
            <Card className="p-5" key={item}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-9 w-14" />
              <Skeleton className="mt-2 h-3 w-32" />
            </Card>
          ))}
        </section>

        <section aria-label="Loading quick actions" className="mt-8">
          <Skeleton className="h-6 w-32" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["profile", "branches", "hours", "menu"].map((item) => (
              <Skeleton className="h-11 w-full rounded-xl" key={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
