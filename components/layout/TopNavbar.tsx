type TopNavbarProps = {
  mobileOpen: boolean;
  onMenuClick: () => void;
};

function Icon({
  name,
  className = "size-5",
}: {
  name: "bell" | "menu" | "search";
  className?: string;
}) {
  const paths = {
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    menu: "M4 6h16M4 12h16M4 18h16",
    search: "m21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z",
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
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

export function TopNavbar({ mobileOpen, onMenuClick }: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between border-b border-white/10 bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        className="rounded-xl p-2 text-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
        onClick={onMenuClick}
        type="button"
      >
        <Icon name="menu" />
      </button>
      <div className="hidden text-sm font-medium text-muted lg:block">
        Good morning, <span className="text-white">merchant</span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <label className="relative hidden sm:block">
          <span className="sr-only">Search workspace</span>
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            name="search"
          />
          <input
            className="h-10 w-52 rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 lg:w-64"
            placeholder="Search workspace"
            type="search"
          />
        </label>
        <button
          aria-label="Notifications"
          className="relative rounded-xl p-2.5 text-muted transition hover:bg-white/10 hover:text-white"
          type="button"
        >
          <Icon name="bell" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </button>
        <button
          aria-label="Open merchant profile"
          className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-white/10"
          type="button"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-300 text-sm font-bold text-primary-foreground">
            M
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium text-white">Merchant</span>
            <span className="block text-xs text-muted">Owner</span>
          </span>
        </button>
      </div>
    </header>
  );
}
