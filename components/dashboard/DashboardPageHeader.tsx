import type { ReactNode } from "react";

type DashboardPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  action,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm text-muted">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
