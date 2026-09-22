"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrganizationSummary = { code: string; id: string; name: string };
type BusinessSummary = { code: string; id: string; name: string; organization_id: string };

type ContextState = {
  business: BusinessSummary | null;
  businesses: BusinessSummary[];
  businessId: string | null;
  organization: OrganizationSummary | null;
  organizationId: string;
  organizations: OrganizationSummary[];
};

export function WorkspaceSwitcher() {
  const router = useRouter();
  const [context, setContext] = useState<ContextState | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/workspace/select")
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as ContextState;
        setContext(data);
      })
      .catch(() => {
        // Workspace context loading failed silently
      });
  }, []);

  if (!context || (context.organizations.length <= 1 && context.businesses.length <= 1)) {
    if (!context?.organization && !context?.business) return null;
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-muted">
        <span className="block font-semibold uppercase tracking-wider text-accent text-[10px]">
          {context.organization?.name ?? "Workspace"}
        </span>
        <span className="block mt-0.5 font-medium text-white truncate">
          {context.business?.name ?? "No Business Selected"}
        </span>
      </div>
    );
  }

  async function handleSwitch(nextOrgId: string, nextBizId?: string) {
    setUpdating(true);
    try {
      const response = await fetch("/api/workspace/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: nextBizId, organizationId: nextOrgId }),
      });
      const result = (await response.json()) as { context?: ContextState; ok?: boolean };
      if (response.ok && result.context) {
        setContext(result.context);
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-accent text-[10px]">
          Workspace Context
        </span>
        {updating ? <span className="text-[10px] text-muted">Updating…</span> : null}
      </div>

      {context.organizations.length > 1 ? (
        <label className="block space-y-1 text-xs">
          <span className="text-muted">Organization</span>
          <select
            className="w-full rounded-lg border border-white/10 bg-[#1c1c1c] px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
            disabled={updating}
            onChange={(e) => void handleSwitch(e.target.value)}
            value={context.organizationId}
          >
            {context.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-xs text-muted">
          Org: <span className="text-white font-medium">{context.organization?.name}</span>
        </p>
      )}

      {context.businesses.length > 1 ? (
        <label className="block space-y-1 text-xs">
          <span className="text-muted">Business</span>
          <select
            className="w-full rounded-lg border border-white/10 bg-[#1c1c1c] px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
            disabled={updating}
            onChange={(e) => void handleSwitch(context.organizationId, e.target.value)}
            value={context.businessId ?? ""}
          >
            {context.businesses.map((biz) => (
              <option key={biz.id} value={biz.id}>
                {biz.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-xs text-muted">
          Business: <span className="text-white font-medium">{context.business?.name ?? "None"}</span>
        </p>
      )}
    </div>
  );
}
