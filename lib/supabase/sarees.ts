import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Saree, SareeCategory } from "@/types/saree";
import { deleteSareeImage, deleteSareeVideo } from "@/lib/supabase/storage";
import {
  fetchVariantsBySareeId,
  fetchVariantsForMultipleSarees,
} from "./sareeVariants";
import { createBrowserClient } from "./client";

export interface DbSareeRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number | null;
  fabric: string | null;
  craft: string | null;
  zari_type: string | null;
  occasion: string | null;
  color: string | null;
  description: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  stock_status: string;
  stock_quantity?: number | null;
  is_new_arrival?: boolean | null;
  is_featured?: boolean | null;
  is_best_seller?: boolean | null;
  is_limited_stock?: boolean | null;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  "heritage-silks": "Heritage Silks (Pattu Sarees)",
  "contemporary-elegance": "Contemporary Elegance (Fancy Sarees)",
  "everyday-grace": "Everyday Grace (Daily Wear Sarees)",
};

const CATEGORY_IMAGES: Record<string, string> = {
  "heritage-silks": "/images/kanchipuram.jpg",
  "contemporary-elegance": "/images/organza.jpg",
  "everyday-grace": "/images/handloom.jpg",
};

let serverClientInstance: SupabaseClient | null = null;

function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!serverClientInstance) {
    serverClientInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (input, init) => {
          return fetch(input, {
            ...init,
            cache: "no-store",
          });
        },
      },
    });
  }

  return serverClientInstance;
}

function resolveSupabaseClient(client?: SupabaseClient | null): SupabaseClient | null {
  if (client) {
    return client;
  }
  if (typeof window !== "undefined") {
    try {
      return createBrowserClient();
    } catch {
      // browser env vars missing or unavailable
    }
  }
  return getSupabaseServerClient();
}

/**
 * Maps a Supabase `public.sarees` table row to the application's `Saree` interface.
 */
export function mapDbRowToSaree(row: DbSareeRow): Saree {
  const categoryKey = (row.category || "heritage-silks") as SareeCategory;
  const categoryLabel = CATEGORY_LABELS[categoryKey] || row.category || "Curated Saree";
  const fallbackImage = CATEGORY_IMAGES[categoryKey] || "/images/kanchipuram.jpg";
  const displayImage =
    row.image_url && row.image_url.trim() !== "" ? row.image_url.trim() : fallbackImage;

  // Build gallery array preserving multiple photos if present
  let galleryUrls: string[] = [];
  if (Array.isArray(row.image_urls) && row.image_urls.length > 0) {
    const validUrls = row.image_urls.filter(
      (u): u is string => typeof u === "string" && u.trim() !== ""
    );
    if (validUrls.length > 0) {
      // Ensure the cover/display image is at index 0
      if (displayImage && !validUrls.includes(displayImage)) {
        galleryUrls = [displayImage, ...validUrls];
      } else if (displayImage && validUrls.includes(displayImage)) {
        galleryUrls = [
          displayImage,
          ...validUrls.filter((u) => u !== displayImage),
        ];
      } else {
        galleryUrls = validUrls;
      }
    }
  }

  if (galleryUrls.length === 0) {
    galleryUrls = [displayImage];
  }

  return {
    id: row.id,
    name: row.name,
    category: categoryKey,
    categoryLabel,
    sku: row.sku,
    fabric: row.fabric || "Boutique Silk Weave",
    craft: row.craft || "Handcrafted Weave",
    zariType: row.zari_type || "Traditional Border",
    occasion: row.occasion || "Weddings & Festive Occasions",
    color: row.color || "Traditional Shade",
    price:
      row.price !== null && row.price !== undefined && !isNaN(Number(row.price))
        ? Number(row.price)
        : "Available on Inquiry",
    image: displayImage,
    gallery: galleryUrls,
    videoUrl:
      row.video_url && row.video_url.trim() !== ""
        ? row.video_url.trim()
        : undefined,
    description:
      row.description ||
      `Exquisite ${categoryLabel} from SaiSrujana, Armoor. Contact Gangadhar on WhatsApp for direct pricing and inquiries.`,
    stockStatus: row.stock_status || "Available on Inquiry",
    stockQuantity:
      typeof row.stock_quantity === "number" && !isNaN(row.stock_quantity)
        ? Math.max(0, row.stock_quantity)
        : 0,
    isNewArrival: Boolean(row.is_new_arrival),
    isFeatured: Boolean(row.is_featured),
    isBestSeller: Boolean(row.is_best_seller),
    isLimitedStock: Boolean(row.is_limited_stock),
    features: [
      "Direct boutique consultation with Gangadhar",
      "Available for in-store preview in Armoor",
      "Video drape request available on WhatsApp",
      "Directly from our Armoor showroom",
    ],
  };
}

/**
 * Fetches all sarees from the live Supabase `sarees` table.
 * Returns an empty array if the table has zero rows or on connection failure.
 */
export async function fetchSareesFromDb(): Promise<Saree[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("sarees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sarees from Supabase:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const sarees = (data as DbSareeRow[]).map(mapDbRowToSaree);

    // Fetch and attach variants for all sarees in batch
    try {
      const sareeIds = sarees.map((s) => s.id);
      const variantsMap = await fetchVariantsForMultipleSarees(sareeIds, supabase);
      sarees.forEach((saree) => {
        saree.variants = variantsMap[saree.id] || [];
      });
    } catch (varErr) {
      console.warn("Could not batch load variants for sarees (non-fatal):", varErr);
    }

    return sarees;
  } catch (err) {
    console.error("Exception fetching sarees from Supabase:", err);
    return [];
  }
}

export async function fetchSareeByIdFromDb(idOrSku: string): Promise<Saree | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  try {
    const trimmed = (idOrSku || "").trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

    let foundRow: DbSareeRow | null = null;

    // Attempt lookup by UUID ID if format is valid
    if (isUuid) {
      const { data: byIdData, error: byIdError } = await supabase
        .from("sarees")
        .select("*")
        .eq("id", trimmed)
        .maybeSingle();

      if (!byIdError && byIdData) {
        foundRow = byIdData as DbSareeRow;
      }
    }

    // Lookup by SKU (uppercase normalized)
    if (!foundRow) {
      const { data: bySkuData, error: bySkuError } = await supabase
        .from("sarees")
        .select("*")
        .eq("sku", trimmed.toUpperCase())
        .maybeSingle();

      if (!bySkuError && bySkuData) {
        foundRow = bySkuData as DbSareeRow;
      }
    }

    // Fallback: exact match on SKU if different from uppercase
    if (!foundRow && trimmed !== trimmed.toUpperCase()) {
      const { data: bySkuExact, error: bySkuExactError } = await supabase
        .from("sarees")
        .select("*")
        .eq("sku", trimmed)
        .maybeSingle();

      if (!bySkuExactError && bySkuExact) {
        foundRow = bySkuExact as DbSareeRow;
      }
    }

    if (!foundRow) return null;

    const saree = mapDbRowToSaree(foundRow);

    // Fetch and attach variants for this specific saree
    try {
      saree.variants = await fetchVariantsBySareeId(saree.id, supabase);
    } catch (varErr) {
      console.warn("Could not load variants for saree (non-fatal):", varErr);
      saree.variants = [];
    }

    return saree;
  } catch (err) {
    console.error("Exception fetching saree by ID from Supabase:", err);
    return null;
  }
}

export interface CreateSareeInput {
  name: string;
  sku: string;
  category: SareeCategory;
  price?: number | null;
  fabric?: string | null;
  craft?: string | null;
  zari_type?: string | null;
  occasion?: string | null;
  color?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  gallery?: string[] | null;
  video_url?: string | null;
  videoUrl?: string | null;
  stock_status?: string;
  stock_quantity?: number | null;
  stockQuantity?: number | null;
  is_new_arrival?: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  is_limited_stock?: boolean;
}

export interface InsertSareeError {
  message: string;
  code?: string;
  details?: string;
  isDuplicateSku?: boolean;
}

export interface InsertSareeResult {
  data: Saree | null;
  error: InsertSareeError | null;
}

/**
 * Inserts a new saree into the live Supabase `sarees` table.
 * Uses the authenticated client instance so Row Level Security recognizes the admin session.
 */
export async function insertSareeIntoDb(
  input: CreateSareeInput,
  supabaseClient: SupabaseClient
): Promise<InsertSareeResult> {
  try {
    const trimmedSku = input.sku.trim().toUpperCase();

    // Determine multiple image URLs array if provided
    let imageUrlsValue: string[] | null = null;
    if (Array.isArray(input.image_urls) && input.image_urls.length > 0) {
      imageUrlsValue = input.image_urls;
    } else if (Array.isArray(input.gallery) && input.gallery.length > 0) {
      imageUrlsValue = input.gallery;
    } else if (input.image_url && input.image_url.trim() !== "") {
      imageUrlsValue = [input.image_url.trim()];
    }

    const stockQty =
      typeof input.stockQuantity === "number" && !isNaN(input.stockQuantity)
        ? Math.max(0, Math.floor(input.stockQuantity))
        : typeof input.stock_quantity === "number" && !isNaN(input.stock_quantity)
        ? Math.max(0, Math.floor(input.stock_quantity))
        : 0;

    const payload = {
      name: input.name.trim(),
      sku: trimmedSku,
      category: input.category,
      price:
        input.price !== undefined && input.price !== null && !isNaN(Number(input.price))
          ? Number(input.price)
          : null,
      fabric: input.fabric?.trim() || null,
      craft: input.craft?.trim() || null,
      zari_type: input.zari_type?.trim() || null,
      occasion: input.occasion?.trim() || null,
      color: input.color?.trim() || null,
      description: input.description?.trim() || null,
      image_url: input.image_url?.trim() || null,
      image_urls: imageUrlsValue,
      video_url: input.video_url?.trim() || input.videoUrl?.trim() || null,
      stock_status: input.stock_status || "Available on Inquiry",
      stock_quantity: stockQty,
      is_new_arrival: Boolean(input.is_new_arrival),
      is_featured: Boolean(input.is_featured),
      is_best_seller: Boolean(input.is_best_seller),
      is_limited_stock: Boolean(input.is_limited_stock),
    };

    const { data, error } = await supabaseClient
      .from("sarees")
      .insert([payload])
      .select();

    if (error) {
      const isDuplicateSku =
        error.code === "23505" ||
        error.message.toLowerCase().includes("duplicate key") ||
        error.message.toLowerCase().includes("sarees_sku_key") ||
        error.message.toLowerCase().includes("unique constraint");

      const message = isDuplicateSku
        ? `A saree with SKU "${trimmedSku}" already exists in the catalogue. Please use a unique SKU code.`
        : error.message;

      return {
        data: null,
        error: {
          message,
          code: error.code,
          details: error.details,
          isDuplicateSku,
        },
      };
    }

    let insertedRow: DbSareeRow | null = null;
    if (data && Array.isArray(data) && data.length > 0) {
      insertedRow = data[0] as DbSareeRow;
    } else if (data && !Array.isArray(data)) {
      insertedRow = data as DbSareeRow;
    }

    if (!insertedRow) {
      insertedRow = {
        id: "",
        name: payload.name,
        sku: payload.sku,
        category: payload.category,
        price: payload.price,
        fabric: payload.fabric,
        craft: payload.craft,
        zari_type: payload.zari_type,
        occasion: payload.occasion,
        color: payload.color,
        description: payload.description,
        image_url: payload.image_url,
        image_urls: payload.image_urls,
        video_url: payload.video_url,
        stock_status: payload.stock_status,
        stock_quantity: payload.stock_quantity,
        is_new_arrival: payload.is_new_arrival,
        is_featured: payload.is_featured,
        is_best_seller: payload.is_best_seller,
        is_limited_stock: payload.is_limited_stock,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return { data: mapDbRowToSaree(insertedRow), error: null };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while saving the saree.";
    return {
      data: null,
      error: {
        message: errorMsg,
      },
    };
  }
}

export interface UpdateSareeInput {
  name?: string;
  sku?: string;
  category?: SareeCategory;
  price?: number | null;
  fabric?: string | null;
  craft?: string | null;
  zari_type?: string | null;
  occasion?: string | null;
  color?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  gallery?: string[] | null;
  video_url?: string | null;
  videoUrl?: string | null;
  stock_status?: string;
  stockStatus?: string;
  stock_quantity?: number | null;
  stockQuantity?: number | null;
  is_new_arrival?: boolean;
  isNewArrival?: boolean;
  is_featured?: boolean;
  isFeatured?: boolean;
  is_best_seller?: boolean;
  isBestSeller?: boolean;
  is_limited_stock?: boolean;
  isLimitedStock?: boolean;
}

export interface UpdateSareeResult {
  success: boolean;
  data: Saree | null;
  error: InsertSareeError | null;
}

/**
 * Updates an existing saree in the live Supabase `sarees` table.
 * Preserves the existing row id and prevents duplicate creation.
 */
export async function updateSareeInDb(
  id: string,
  input: UpdateSareeInput,
  supabaseClient?: SupabaseClient | null
): Promise<UpdateSareeResult> {
  try {
    const trimmedId = (id || "").trim();
    if (!trimmedId) {
      return {
        success: false,
        data: null,
        error: { message: "Invalid saree ID provided for update." },
      };
    }

    const client = resolveSupabaseClient(supabaseClient);
    if (!client) {
      return {
        success: false,
        data: null,
        error: { message: "Supabase client is not available." },
      };
    }

    const trimmedSku = input.sku !== undefined ? input.sku.trim().toUpperCase() : undefined;
    const videoUrlValue =
      input.video_url !== undefined
        ? (input.video_url?.trim() || null)
        : input.videoUrl !== undefined
        ? (input.videoUrl?.trim() || null)
        : undefined;

    let imageUrlsValue: string[] | null | undefined = undefined;
    if (input.image_urls !== undefined) {
      imageUrlsValue = input.image_urls;
    } else if (input.gallery !== undefined) {
      imageUrlsValue = input.gallery;
    }

    const stockQty =
      input.stockQuantity !== undefined && input.stockQuantity !== null
        ? Math.max(0, Math.floor(Number(input.stockQuantity) || 0))
        : input.stock_quantity !== undefined && input.stock_quantity !== null
        ? Math.max(0, Math.floor(Number(input.stock_quantity) || 0))
        : undefined;

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) {
      payload.name = input.name.trim();
    }
    if (trimmedSku !== undefined) {
      payload.sku = trimmedSku;
    }
    if (input.category !== undefined) {
      payload.category = input.category;
    }
    if (input.price !== undefined) {
      payload.price =
        input.price !== null && !isNaN(Number(input.price))
          ? Number(input.price)
          : null;
    }
    if (input.fabric !== undefined) {
      payload.fabric = input.fabric?.trim() || null;
    }
    if (input.craft !== undefined) {
      payload.craft = input.craft?.trim() || null;
    }
    if (input.zari_type !== undefined) {
      payload.zari_type = input.zari_type?.trim() || null;
    }
    if (input.occasion !== undefined) {
      payload.occasion = input.occasion?.trim() || null;
    }
    if (input.color !== undefined) {
      payload.color = input.color?.trim() || null;
    }
    if (input.description !== undefined) {
      payload.description = input.description?.trim() || null;
    }
    if (input.image_url !== undefined) {
      payload.image_url = input.image_url?.trim() || null;
    }
    if (imageUrlsValue !== undefined) {
      payload.image_urls = imageUrlsValue;
    }
    if (videoUrlValue !== undefined) {
      payload.video_url = videoUrlValue;
    }
    if (input.stock_status !== undefined) {
      payload.stock_status = input.stock_status;
    } else if (input.stockStatus !== undefined) {
      payload.stock_status = input.stockStatus;
    }
    if (stockQty !== undefined) {
      payload.stock_quantity = stockQty;
    }
    if (input.is_new_arrival !== undefined) {
      payload.is_new_arrival = Boolean(input.is_new_arrival);
    } else if (input.isNewArrival !== undefined) {
      payload.is_new_arrival = Boolean(input.isNewArrival);
    }
    if (input.is_featured !== undefined) {
      payload.is_featured = Boolean(input.is_featured);
    } else if (input.isFeatured !== undefined) {
      payload.is_featured = Boolean(input.isFeatured);
    }
    if (input.is_best_seller !== undefined) {
      payload.is_best_seller = Boolean(input.is_best_seller);
    } else if (input.isBestSeller !== undefined) {
      payload.is_best_seller = Boolean(input.isBestSeller);
    }
    if (input.is_limited_stock !== undefined) {
      payload.is_limited_stock = Boolean(input.is_limited_stock);
    } else if (input.isLimitedStock !== undefined) {
      payload.is_limited_stock = Boolean(input.isLimitedStock);
    }

    // Ensure active Supabase Auth session is loaded
    await client.auth.getSession();

    // Target exactly the existing saree by its UUID id (or fallback to SKU if id is not a UUID)
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedId);

    let query = client.from("sarees").update(payload);
    if (isUuid) {
      query = query.eq("id", trimmedId);
    } else {
      query = query.eq("sku", trimmedSku || trimmedId);
    }

    const { data, error } = await query.select();

    if (error) {
      const isDuplicateSku =
        error.code === "23505" ||
        error.message.toLowerCase().includes("duplicate key") ||
        error.message.toLowerCase().includes("sarees_sku_key") ||
        error.message.toLowerCase().includes("unique constraint");

      const message = isDuplicateSku
        ? `A saree with SKU "${trimmedSku || trimmedId}" already exists in the catalogue. Please use a unique SKU code.`
        : error.message;

      return {
        success: false,
        data: null,
        error: {
          message,
          code: error.code,
          details: error.details,
          isDuplicateSku,
        },
      };
    }

    // If update returned 0 rows, the row was not updated (likely blocked by RLS or id mismatch)
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error("updateSareeInDb: 0 rows updated in Supabase.", {
        trimmedId,
        trimmedSku,
        isUuid,
      });
      return {
        success: false,
        data: null,
        error: {
          message: `The database update affected 0 rows for saree "${trimmedSku || trimmedId}". Please verify that an UPDATE policy exists for role 'authenticated' on the public.sarees table in Supabase.`,
        },
      };
    }

    const updatedRow = data[0] as DbSareeRow;
    return { success: true, data: mapDbRowToSaree(updatedRow), error: null };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while updating the saree.";
    return {
      success: false,
      data: null,
      error: {
        message: errorMsg,
      },
    };
  }
}

/**
 * Fetches a single raw saree DB row by UUID or SKU using the provided Supabase client.
 */
export async function fetchRawSareeByIdOrSku(
  idOrSku: string,
  supabaseClient: SupabaseClient
): Promise<DbSareeRow | null> {
  try {
    const trimmed = (idOrSku || "").trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

    // Attempt lookup by UUID ID if format is valid
    if (isUuid) {
      const { data: byIdData, error: byIdError } = await supabaseClient
        .from("sarees")
        .select("*")
        .eq("id", trimmed)
        .maybeSingle();

      if (!byIdError && byIdData) {
        return byIdData as DbSareeRow;
      }
    }

    // Fallback: Attempt lookup by SKU
    const { data: bySkuData, error: bySkuError } = await supabaseClient
      .from("sarees")
      .select("*")
      .eq("sku", trimmed.toUpperCase())
      .maybeSingle();

    if (!bySkuError && bySkuData) {
      return bySkuData as DbSareeRow;
    }

    if (trimmed !== trimmed.toUpperCase()) {
      const { data: bySkuExact, error: bySkuExactError } = await supabaseClient
        .from("sarees")
        .select("*")
        .eq("sku", trimmed)
        .maybeSingle();

      if (!bySkuExactError && bySkuExact) {
        return bySkuExact as DbSareeRow;
      }
    }

    return null;
  } catch (err) {
    console.error("Exception fetching raw saree:", err);
    return null;
  }
}

/**
 * Safely deletes a single saree from the Supabase `public.sarees` table.
 * Strictly targets only the specific row matching the UUID (or SKU).
 * Safely removes any associated photographs and video from storage buckets.
 */
export async function deleteSareeFromDb(
  id: string,
  supabaseClient?: SupabaseClient | null,
  imageUrlOrGallery?: string | string[] | null,
  videoUrl?: string | null
): Promise<{ success: boolean; error: { message: string } | null }> {
  try {
    const trimmedId = (id || "").trim();
    if (!trimmedId) {
      return { success: false, error: { message: "Invalid saree ID provided for deletion." } };
    }

    const client = resolveSupabaseClient(supabaseClient);
    if (!client) {
      return { success: false, error: { message: "Supabase client is not available." } };
    }

    // Ensure session is active
    await client.auth.getSession();

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedId);

    // 1. Delete row from Supabase
    let query = client.from("sarees").delete();
    if (isUuid) {
      query = query.eq("id", trimmedId);
    } else {
      query = query.eq("sku", trimmedId);
    }

    const { error } = await query;

    if (error) {
      console.error("Error deleting saree from Supabase:", error);
      return { success: false, error: { message: error.message } };
    }

    // 2. If saree row deletion succeeded, safely remove all associated photographs from storage bucket
    const imagesToDelete: string[] = [];
    if (Array.isArray(imageUrlOrGallery)) {
      imagesToDelete.push(...imageUrlOrGallery);
    } else if (typeof imageUrlOrGallery === "string" && imageUrlOrGallery.trim()) {
      imagesToDelete.push(imageUrlOrGallery.trim());
    }

    for (const imgUrl of imagesToDelete) {
      try {
        await deleteSareeImage(imgUrl, client);
      } catch (storageErr) {
        console.warn("Storage image deletion warning (non-fatal):", storageErr);
      }
    }

    // 3. If saree row deletion succeeded, safely remove associated video from storage bucket
    if (videoUrl) {
      try {
        await deleteSareeVideo(videoUrl, client);
      } catch (videoErr) {
        console.warn("Storage video deletion warning (non-fatal):", videoErr);
      }
    }

    // 4. Trigger revalidation on the server if executed in the browser
    if (typeof window !== "undefined") {
      try {
        fetch("/api/revalidate-sarees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: trimmedId }),
        }).catch((e) => console.warn("API revalidation fetch notice:", e));
      } catch {
        // non-blocking
      }
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while deleting the saree.";
    return {
      success: false,
      error: { message: errorMsg },
    };
  }
}


