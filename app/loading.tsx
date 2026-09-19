export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading FEASTY MERCHANT"
      className="flex min-h-screen items-center justify-center bg-background px-6"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="size-10 animate-spin rounded-full border-2 border-white/15 border-t-primary"
        />
        <p className="text-sm text-muted">Loading your workspace…</p>
      </div>
    </main>
  );
}
