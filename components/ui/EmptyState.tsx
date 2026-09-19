type EmptyStateProps = {
  description: string;
  title: string;
};

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
