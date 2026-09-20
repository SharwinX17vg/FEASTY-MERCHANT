import { NextResponse } from "next/server";

import {
  getScopedBranch,
  hasUnexpectedFields,
  managerRoles,
  menuItemSelect,
} from "@/app/api/branches/[branchId]/menu-items/route";
import { validateMenuItem, type MenuItemInput } from "@/lib/validation/menu-item";

type RouteContext = { params: Promise<{ branchId: string; itemId: string }> };

async function getScopedItem(branchId: string, itemId: string) {
  const result = await getScopedBranch(branchId);
  if ("error" in result) return result;
  const { data: item, error } = await result.supabase
    .from("menu_items")
    .select(menuItemSelect)
    .eq("id", itemId)
    .eq("branch_id", branchId)
    .maybeSingle();
  if (error) return { supabase: result.supabase, error: "Unable to load the menu item.", status: 503 as const };
  if (!item) return { supabase: result.supabase, error: "Menu item not found.", status: 404 as const };
  return { ...result, item };
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { branchId, itemId } = await context.params;
    const result = await getScopedItem(branchId, itemId);
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
    if (!managerRoles.has(result.role ?? "")) {
      return NextResponse.json({ message: "You do not have permission to edit menu items." }, { status: 403 });
    }
    const input = (await request.json()) as MenuItemInput;
    if (hasUnexpectedFields(input as Record<string, unknown>)) {
      return NextResponse.json({ message: "This menu field cannot be changed." }, { status: 400 });
    }
    const validation = validateMenuItem(input);
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json({ errors: validation.errors, message: "Review the highlighted fields." }, { status: 400 });
    }
    const { data: item, error } = await result.supabase
      .from("menu_items")
      .update(validation.values)
      .eq("id", itemId)
      .eq("branch_id", branchId)
      .select(menuItemSelect)
      .single();
    if (error || !item) return NextResponse.json({ message: "Unable to save the menu item." }, { status: 403 });
    return NextResponse.json({ item, message: "Menu item changes saved." });
  } catch {
    return NextResponse.json({ message: "Unable to save the menu item." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { branchId, itemId } = await context.params;
    const result = await getScopedItem(branchId, itemId);
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
    if (!managerRoles.has(result.role ?? "")) {
      return NextResponse.json({ message: "You do not have permission to change menu item status." }, { status: 403 });
    }
    const input = (await request.json()) as { is_available?: unknown; status?: unknown };
    const changes: { is_available?: boolean; status?: "active" | "archived" } = {};
    if (typeof input.is_available === "boolean") changes.is_available = input.is_available;
    if (input.status === "active" || input.status === "archived") changes.status = input.status;
    if (Object.keys(changes).length === 0 || (input.status !== undefined && !changes.status)) {
      return NextResponse.json({ message: "Choose a valid availability or lifecycle status." }, { status: 400 });
    }
    const { data: item, error } = await result.supabase
      .from("menu_items")
      .update(changes)
      .eq("id", itemId)
      .eq("branch_id", branchId)
      .select(menuItemSelect)
      .single();
    if (error || !item) return NextResponse.json({ message: "Unable to update menu item status." }, { status: 403 });
    return NextResponse.json({ item, message: "Menu item status updated." });
  } catch {
    return NextResponse.json({ message: "Unable to update menu item status." }, { status: 503 });
  }
}
