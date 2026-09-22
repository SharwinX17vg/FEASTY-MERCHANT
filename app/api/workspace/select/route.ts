import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACTIVE_BIZ_COOKIE,
  ACTIVE_ORG_COOKIE,
  getValidatedWorkspaceContext,
} from "@/lib/workspace/context";

export async function POST(request: Request) {
  try {
    const input = (await request.json().catch(() => ({}))) as {
      businessId?: string;
      organizationId?: string;
    };

    const result = await getValidatedWorkspaceContext({
      preferredOrganizationId: input.organizationId,
      preferredBusinessId: input.businessId,
      request,
    });

    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    const { businessId, organizationId } = result.data;
    const cookieStore = await cookies();

    cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    if (businessId) {
      cookieStore.set(ACTIVE_BIZ_COOKIE, businessId, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return NextResponse.json({
      ok: true,
      context: {
        organizationId,
        businessId,
        organization: result.data.organization,
        business: result.data.business,
        organizations: result.data.organizations,
        businesses: result.data.businesses,
      },
    });
  } catch {
    return NextResponse.json({ message: "Unable to update active workspace." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  try {
    const result = await getValidatedWorkspaceContext({ request });
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    return NextResponse.json({
      organizationId: result.data.organizationId,
      businessId: result.data.businessId,
      organization: result.data.organization,
      business: result.data.business,
      organizations: result.data.organizations,
      businesses: result.data.businesses,
    });
  } catch {
    return NextResponse.json({ message: "Unable to load workspace context." }, { status: 503 });
  }
}
