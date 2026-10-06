import { NextResponse } from "next/server";

import { getScopedItem } from "@/app/api/branches/[branchId]/menu-items/[itemId]/route";
import {
  managerRoles,
  menuItemSelect,
} from "@/app/api/branches/[branchId]/menu-items/route";
import {
  canSubmitMenuItem,
  getMenuItemSubmissionUpdate,
} from "@/lib/menu-items/publication";
import { mutationErrorResponse } from "@/lib/supabase/errors";

type RouteContext = { params: Promise<{ branchId: string; itemId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { branchId, itemId } = await context.params;
    const result = await getScopedItem(branchId, itemId);

    if ("error" in result) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status },
      );
    }
    if (!("item" in result)) {
      return NextResponse.json(
        { message: "Unable to load the menu item." },
        { status: 503 },
      );
    }

    if (!managerRoles.has(result.role ?? "")) {
      return NextResponse.json(
        { message: "You do not have permission to submit menu items for review." },
        { status: 403 },
      );
    }

    if (!canSubmitMenuItem(result.role, result.item.publication_status)) {
      return NextResponse.json(
        { message: "Only draft menu items can be submitted for review." },
        { status: 409 },
      );
    }

    const submittedAt = new Date().toISOString();
    const changes = getMenuItemSubmissionUpdate(
      result.item.publication_status,
      submittedAt,
    );

    if (!changes) {
      return NextResponse.json(
        { message: "Only draft menu items can be submitted for review." },
        { status: 409 },
      );
    }

    const { data: item, error } = await result.supabase
      .from("menu_items")
      .update(changes)
      .eq("id", itemId)
      .eq("branch_id", branchId)
      .eq("publication_status", "draft")
      .select(menuItemSelect)
      .maybeSingle();

    if (error || !item) {
      const response = error
        ? mutationErrorResponse(error, "Unable to submit the menu item for review.")
        : {
          message: "Only draft menu items can be submitted for review.",
          status: 409,
        };

      return NextResponse.json(
        { message: response.message },
        { status: response.status },
      );
    }

    return NextResponse.json({
      item,
      message: "Menu item submitted for review.",
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to submit the menu item for review." },
      { status: 503 },
    );
  }
}
