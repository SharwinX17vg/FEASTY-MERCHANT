import { NextResponse } from "next/server";

import { getScopedItem } from "@/app/api/branches/[branchId]/menu-items/[itemId]/route";
import { menuItemSelect } from "@/app/api/branches/[branchId]/menu-items/route";
import {
  canPublishMenuItem,
  getMenuItemPublicationUpdate,
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

    if (!canPublishMenuItem(result.role, result.item.publication_status)) {
      if (!["admin", "moderator"].includes(result.role)) {
        return NextResponse.json(
          { message: "You do not have permission to publish menu items." },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { message: "Only approved menu items can be published." },
        { status: 409 },
      );
    }

    const publishedAt = new Date().toISOString();
    const changes = getMenuItemPublicationUpdate(
      result.item.publication_status,
      publishedAt,
    );

    if (!changes) {
      return NextResponse.json(
        { message: "Only approved menu items can be published." },
        { status: 409 },
      );
    }

    const { data: item, error } = await result.supabase
      .from("menu_items")
      .update(changes)
      .eq("id", itemId)
      .eq("branch_id", branchId)
      .eq("publication_status", "approved")
      .select(menuItemSelect)
      .maybeSingle();

    if (error || !item) {
      const response = error
        ? mutationErrorResponse(error, "Unable to publish the menu item.")
        : {
          message: "Only approved menu items can be published.",
          status: 409,
        };

      return NextResponse.json(
        { message: response.message },
        { status: response.status },
      );
    }

    return NextResponse.json({
      item,
      message: "Menu item published.",
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to publish the menu item." },
      { status: 503 },
    );
  }
}
