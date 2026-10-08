import { isContentPubliclyAvailable } from "../content/publication.ts";

export type PublicDiscoveryBranch = {
  public_id: string;
  business_public_id: string;
  name: string;
  address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
};

export type PublicDiscoveryContent = {
  public_id: string;
  business_public_id: string;
  title: string;
  description: string;
  content_type: "post" | "offer";
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  offer: {
    original_price: number | null;
    offer_price: number | null;
    discount_percentage: number | null;
    offer_code: string | null;
  } | null;
};

export type PublicDiscoveryBusiness = {
  public_id: string;
  name: string;
  category: string;
  description: string | null;
  website_url: string | null;
  status: "approved";
  branches: PublicDiscoveryBranch[];
  content: PublicDiscoveryContent[];
};

export type PublicDiscoveryResponse = {
  data: PublicDiscoveryBusiness[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
  };
};

export function parseDiscoveryPagination(searchParams: URLSearchParams) {
  const pageValue = searchParams.get("page") ?? "1";
  const limitValue = searchParams.get("limit") ?? "20";
  if (!/^\d+$/.test(pageValue) || !/^\d+$/.test(limitValue)) {
    return { error: "Page and limit must be positive integers." };
  }
  const page = Number(pageValue);
  const limit = Number(limitValue);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    return { error: "Page must be at least 1 and limit must be between 1 and 50." };
  }
  return { page, limit };
}

export function mapPublicDiscoveryContent(
  item: {
    id: string;
    business_id: string;
    title: string;
    body: string;
    content_type: "post" | "offer";
    image_path: string | null;
    starts_at: string | null;
    ends_at: string | null;
    publish_at: string | null;
    publication_status: string;
    original_price: number | null;
    offer_price: number | null;
    discount_percentage: number | null;
    offer_code: string | null;
  },
  businessPublicId: string,
  imageUrl: string | null,
  now = new Date(),
): PublicDiscoveryContent | null {
  if (!isContentPubliclyAvailable(item.publication_status, item.publish_at, item.starts_at, item.ends_at, now)) {
    return null;
  }
  return {
    public_id: item.id,
    business_public_id: businessPublicId,
    title: item.title,
    description: item.body,
    content_type: item.content_type,
    image_url: imageUrl,
    starts_at: item.starts_at,
    ends_at: item.ends_at,
    offer: item.content_type === "offer"
      ? {
          original_price: item.original_price,
          offer_price: item.offer_price,
          discount_percentage: item.discount_percentage,
          offer_code: item.offer_code,
        }
      : null,
  };
}
