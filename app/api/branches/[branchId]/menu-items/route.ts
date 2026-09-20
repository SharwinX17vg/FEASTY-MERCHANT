import { NextResponse } from "next/server";

import { getAuthorizedWorkspace } from "@/app/api/branches/route";
import { validateMenuItem, type MenuItemInput } from "@/lib/validation/menu-item";

type RouteContext = { params: Promise<{ branchId: string }> };
const managerRoles = new Set(["org_owner", "admin", "moderator", "branch_manager"]);
const editableFields = ["name", "description", "category", "price", "is_available"] as const;
const menuItemSelect =
  "id,branch_id,code,name,description,category,price,is_available,status,created_by,created_at,updated_at";

async function getScopedBranch(branchId: string) {
  const result = await getAuthorizedWorkspace();
  if ("error" in result) return result;
  const { data: branch, error } = await result.supabase
    .from("branches")
    .select("id,business_id,name,status")
    .eq("id", branchId)
    .eq("business_id", result.businessId)
    .maybeSingle();
  if (error) return { supabase: result.supabase, error: "Unable to load the branch.", status: 503 as const };
  if (!branch) return { supabase: result.supabase, error: "Branch not found.", status: 404 as const };
  return { ...result, branch };
}

function hasUnexpectedFields(input: Record<string, unknown>) {
  return Object.keys(input).some(
    (field) => !editableFields.includes(field as (typeof editableFields)[number]),
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { branchId } = await context.params;
    const result = await getScopedBranch(branchId);
    if ("error" in result || !("branch" in result)) return NextResponse.json({ message: result.error }, { status: result.status });
    const { data: items, error } = await result.supabase
      .from("menu_items")
      .select(menuItemSelect)
      .eq("branch_id", branchId)
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (error) return NextResponse.json({ message: "Unable to load menu items." }, { status: 503 });
    return NextResponse.json({ branch: result.branch, items });
  } catch {
    return NextResponse.json({ message: "Unable to load menu items." }, { status: 503 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { branchId } = await context.params;
    const result = await getScopedBranch(branchId);
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
    if (!managerRoles.has(result.role ?? "")) {
      return NextResponse.json({ message: "You do not have permission to manage menu items." }, { status: 403 });
    }
    const input = (await request.json()) as MenuItemInput;
    if (hasUnexpectedFields(input as Record<string, unknown>)) {
      return NextResponse.json({ message: "This menu field cannot be changed." }, { status: 400 });
    }
    const validation = validateMenuItem(input);
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json({ errors: validation.errors, message: "Review the highlighted fields." }, { status: 400 });
    }
    const { data: user } = await result.supabase.auth.getUser();
    if (!user.user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
    const { data: item, error } = await result.supabase
      .from("menu_items")
      .insert({ branch_id: branchId, created_by: user.user.id, ...validation.values })
      .select(menuItemSelect)
      .single();
    if (error || !item) return NextResponse.json({ message: "Unable to save the menu item." }, { status: 403 });
    return NextResponse.json({ item, message: "Menu item added." }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to save the menu item." }, { status: 503 });
  }
}

export { editableFields, menuItemSelect, getScopedBranch, hasUnexpectedFields, managerRoles };
