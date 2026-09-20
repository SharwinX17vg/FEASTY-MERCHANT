import Link from "next/link";

type SidebarProps = {
  activeItem?: string;
  mobileOpen: boolean;
  onClose: () => void;
};

type IconName =
  | "analytics"
  | "bell"
  | "branch"
  | "calendar"
  | "dashboard"
  | "menu"
  | "clock"
  | "offer"
  | "review"
  | "settings"
  | "shop"
  | "star";

const navigationItems: Array<{ label: string; icon: IconName }> = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Businesses", icon: "shop" },
  { label: "Branches", icon: "branch" },
  { label: "Hours", icon: "clock" },
  { label: "Menu", icon: "menu" },
  { label: "Today's Special", icon: "star" },
  { label: "Offers", icon: "offer" },
  { label: "Events", icon: "calendar" },
  { label: "Reviews", icon: "review" },
  { label: "Analytics", icon: "analytics" },
  { label: "Notifications", icon: "bell" },
  { label: "Settings", icon: "settings" },
];

function NavigationIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    analytics: "M4 19V5m0 14h16M8 16v-4m4 4V8m4 8v-7",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    branch: "M6 20V6m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 7h12m0 0V6m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 7H6",
    clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z",
    dashboard: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    menu: "M4 6h16M4 12h16M4 18h16",
    offer: "M20 12 12 20 4 12l8-8 8 8Zm-5-1h.01M11 14h.01",
    review: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2m9-8.5h-2m-14 0H3m15.4-6.4-1.4 1.4M7 16.9l-1.4 1.4m12.8 0-1.4-1.4M7 7.1 5.6 5.7",
    shop: "M4 10h16l-1 10H5L4 10Zm2-5h12l2 5H4l2-5Zm3 9v6m6-6v6",
    star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  };

  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Sidebar({
  activeItem = "Dashboard",
  mobileOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      <button
        aria-label="Close navigation"
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Merchant workspace navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#111] px-4 py-5 transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3">
          <Link
            className="flex items-center gap-2 rounded-lg text-base font-bold tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            href="/"
            onClick={onClose}
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground">
              F
            </span>
            FEASTY<span className="text-primary">MERCHANT</span>
          </Link>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <p className="px-3 pb-3 pt-10 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          Workspace
        </p>
        <nav aria-label="Dashboard navigation" className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = item.label === activeItem;

            return (
              <Link
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isActive
                    ? "bg-primary/15 font-semibold text-primary"
                    : "text-muted hover:bg-white/[0.06] hover:text-white"
                }`}
                href={item.label === "Businesses" ? "/dashboard/profile" : item.label === "Branches" ? "/dashboard/branches" : item.label === "Hours" ? "/dashboard/hours" : isActive ? "/dashboard" : "#"}
                aria-current={isActive ? "page" : undefined}
                key={item.label}
                onClick={onClose}
              >
                <NavigationIcon name={item.icon} />
                <span>{item.label}</span>
                {item.label === "Notifications" ? (
                  <span className="ml-auto size-2 rounded-full bg-primary" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <p className="text-sm font-semibold text-white">Make your presence count.</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Keep your business information fresh for FEASTYMAP customers.
          </p>
          <Link
            href="/dashboard/profile"
            className="mt-4 text-xs font-semibold text-primary transition hover:text-accent"
            onClick={onClose}
          >
            View your profile →
          </Link>
        </div>
      </aside>
    </>
  );
}
