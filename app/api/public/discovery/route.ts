import { NextResponse } from "next/server";

import { CONTENT_IMAGE_BUCKET } from "@/lib/content/storage";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  mapPublicDiscoveryContent,
  parseDiscoveryPagination,
  type PublicDiscoveryBranch,
  type PublicDiscoveryBusiness,
} from "@/lib/public/discovery";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const pagination = parseDiscoveryPagination(searchParams);
  if ("error" in pagination) return NextResponse.json({ message: pagination.error }, { status: 400 });

  const category = searchParams.get("category")?.trim() ?? "";
  const search = searchParams.get("search")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  if (category.length > 80 || search.length > 80 || city.length > 100) {
    return NextResponse.json({ message: "Search filters are too long." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  let cityBusinessIds: string[] | null = null;
  if (city) {
    const { data: cityBranches, error: cityError } = await supabase
      .from("branches")
      .select("business_id")
      .eq("status", "active")
      .ilike("city", city);
    if (cityError) return NextResponse.json({ message: "Unable to load public discovery data." }, { status: 503 });
    cityBusinessIds = Array.from(new Set((cityBranches ?? []).map((branch) => branch.business_id)));
    if (cityBusinessIds.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { page: pagination.page, limit: pagination.limit, total: 0, has_next: false },
      });
    }
  }
  let businessQuery = supabase
    .from("businesses")
    .select("id,code,name,category,description,website_url,status", { count: "exact" })
    .eq("status", "approved");
  if (category) businessQuery = businessQuery.ilike("category", category);
  if (cityBusinessIds) businessQuery = businessQuery.in("id", cityBusinessIds);
  if (search) {
    const safeSearch = search.replace(/[%_,]/g, (character) => `\\${character}`);
    businessQuery = businessQuery.or(`name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
  }

  const { data: businesses, count, error: businessError } = await businessQuery
    .order("name", { ascending: true })
    .range((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit - 1);
  if (businessError) return NextResponse.json({ message: "Unable to load public discovery data." }, { status: 503 });

  const businessRows = businesses ?? [];
  const businessIds = businessRows.map((business) => business.id);
  const businessById = new Map(businessRows.map((business) => [business.id, business]));
  const { data: branches, error: branchError } = businessIds.length
    ? await supabase
        .from("branches")
        .select("id,code,business_id,name,address_line_1,address_line_2,city,state,postal_code,country_code,latitude,longitude,status")
        .in("business_id", businessIds)
        .eq("status", "active")
        .order("name", { ascending: true })
    : { data: [], error: null };
  if (branchError) return NextResponse.json({ message: "Unable to load public locations." }, { status: 503 });

  const { data: content, error: contentError } = businessIds.length
    ? await supabase
        .from("merchant_content")
        .select("id,business_id,title,body,content_type,image_path,starts_at,ends_at,publish_at,publication_status,original_price,offer_price,discount_percentage,offer_code")
        .in("business_id", businessIds)
        .eq("publication_status", "published")
        .order("published_at", { ascending: false })
    : { data: [], error: null };
  if (contentError) return NextResponse.json({ message: "Unable to load public content." }, { status: 503 });

  const branchesByBusiness = new Map<string, PublicDiscoveryBranch[]>();
  for (const branch of branches ?? []) {
    if (city && branch.city.toLowerCase() !== city.toLowerCase()) continue;
    const business = businessById.get(branch.business_id);
    if (!business) continue;
    const mapped: PublicDiscoveryBranch = {
      public_id: branch.code,
      business_public_id: business.code,
      name: branch.name,
      address: [branch.address_line_1, branch.address_line_2].filter(Boolean).join(", "),
      city: branch.city,
      state: branch.state,
      postal_code: branch.postal_code,
      country_code: branch.country_code,
      latitude: branch.latitude === null ? null : Number(branch.latitude),
      longitude: branch.longitude === null ? null : Number(branch.longitude),
    };
    const existing = branchesByBusiness.get(branch.business_id) ?? [];
    existing.push(mapped);
    branchesByBusiness.set(branch.business_id, existing);
  }

  const contentByBusiness = new Map<string, PublicDiscoveryBusiness["content"]>();
  const now = new Date();
  for (const item of content ?? []) {
    const business = businessById.get(item.business_id);
    if (!business) continue;
    const mapped = mapPublicDiscoveryContent(
      item,
      business.code,
      item.image_path
        ? supabase.storage.from(CONTENT_IMAGE_BUCKET).getPublicUrl(item.image_path).data.publicUrl
        : null,
      now,
    );
    if (!mapped) continue;
    const existing = contentByBusiness.get(item.business_id) ?? [];
    existing.push(mapped);
    contentByBusiness.set(item.business_id, existing);
  }

  const data: PublicDiscoveryBusiness[] = businessRows.map((business) => ({
    public_id: business.code,
    name: business.name,
    category: business.category,
    description: business.description,
    website_url: business.website_url,
    status: "approved",
    branches: branchesByBusiness.get(business.id) ?? [],
    content: contentByBusiness.get(business.id) ?? [],
  }));

  return NextResponse.json({
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: count ?? 0,
      has_next: pagination.page * pagination.limit < (count ?? 0),
    },
  });
}
