type DashboardNoticeProps = {
  kind: "error" | "success";
  children: string;
};

export function DashboardNotice({ kind, children }: DashboardNoticeProps) {
  const styles =
    kind === "error"
      ? "border-red-400/20 bg-red-400/10 text-red-200"
      : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";

  return (
    <p
      className={`mt-8 rounded-xl border px-4 py-3 text-sm ${styles}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
