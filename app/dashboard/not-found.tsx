import { Card, PrimaryButton } from "@/components/ui";

export default function DashboardNotFound() {
  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center sm:p-8">
          <p className="text-sm text-muted">Merchant workspace</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Page not found</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            The page you&apos;re looking for may have moved or is no longer available.
          </p>
          <a className="mt-6 inline-flex" href="/dashboard">
            <PrimaryButton>Back to dashboard</PrimaryButton>
          </a>
        </Card>
      </div>
    </main>
  );
}
