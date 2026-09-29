/**
 * Supabase Database Helper for Saree Colour Variants
 * SaiSrujana Saree Boutique
 * Table: `public.saree_variants`
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultClient, createBrowserClient } from "./client";
import { SareeVariant } from "@/types/saree";
import { deleteMultipleSareeImages } from "./storage";

export interface DbSareeVariantRow {
  id: string;
  saree_id: string;
  color_name: string;
  color_code: string | null;
  price: number | null;
  stock_quantity: number;
  image_urls: string[] | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSareeVariantInput {
  sareeId: string;
  colorName: string;
  colorCode?: string | null;
  price?: number | string | null;
  stockQuantity?: number;
  imageUrls?: string[] | null;
  isAvailable?: boolean;
}

export interface UpdateSareeVariantInput {
  colorName?: string;
  colorCode?: string | null;
  price?: number | string | null;
  stockQuantity?: number;
  imageUrls?: string[] | null;
  isAvailable?: boolean;
}

/**
 * Maps a raw Supabase `saree_variants` database row to the TypeScript `SareeVariant` interface.
 */
export function mapDbRowToSareeVariant(row: DbSareeVariantRow): SareeVariant {
  return {
    id: row.id,
    sareeId: row.saree_id,
    colorName: row.color_name || "Standard",
    colorCode: row.color_code || null,
    price: row.price !== null && row.price !== undefined ? Number(row.price) : 0,
    stockQuantity: typeof row.stock_quantity === "number" ? row.stock_quantity : 0,
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
    isAvailable: row.is_available !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetches all colour variants for a specific saree ID.
 */
export async function fetchVariantsBySareeId(
  sareeId: string,
  client?: SupabaseClient
): Promise<SareeVariant[]> {
  const supabase = client || defaultClient || createBrowserClient();
  if (!supabase || !sareeId) return [];

  try {
    const { data, error } = await supabase
      .from("saree_variants")
      .select("*")
      .eq("saree_id", sareeId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching saree variants from Supabase:", error);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return (data as DbSareeVariantRow[]).map(mapDbRowToSareeVariant);
  } catch (err) {
    console.error("Exception fetching saree variants:", err);
    return [];
  }
}

/**
 * Batch fetches colour variants for multiple saree IDs at once.
 * Returns a dictionary keyed by `sareeId`.
 */
export async function fetchVariantsForMultipleSarees(
  sareeIds: string[],
  client?: SupabaseClient
): Promise<Record<string, SareeVariant[]>> {
  const result: Record<string, SareeVariant[]> = {};
  if (!sareeIds || sareeIds.length === 0) return result;

  const supabase = client || defaultClient || createBrowserClient();
  if (!supabase) return result;

  try {
    const { data, error } = await supabase
      .from("saree_variants")
      .select("*")
      .in("saree_id", sareeIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error batch fetching variants:", error);
      return result;
    }

    if (data && Array.isArray(data)) {
      (data as DbSareeVariantRow[]).forEach((row) => {
        const variant = mapDbRowToSareeVariant(row);
        if (!result[variant.sareeId]) {
          result[variant.sareeId] = [];
        }
        result[variant.sareeId].push(variant);
      });
    }

    return result;
  } catch (err) {
    console.error("Exception batch fetching variants:", err);
    return result;
  }
}

/**
 * Creates a new colour variant row in `saree_variants`.
 */
export async function createSareeVariant(
  input: CreateSareeVariantInput,
  client?: SupabaseClient
): Promise<{ data: SareeVariant | null; error: string | null }> {
  const supabase = client || createBrowserClient();
  if (!supabase) {
    return { data: null, error: "Supabase client is not available." };
  }

  const numericPrice =
    input.price !== undefined && input.price !== null && input.price !== ""
      ? Number(input.price)
      : null;

  const payload = {
    saree_id: input.sareeId,
    color_name: input.colorName.trim(),
    color_code: input.colorCode?.trim() || null,
    price: !isNaN(Number(numericPrice)) ? numericPrice : null,
    stock_quantity: Math.max(0, input.stockQuantity ?? 0),
    image_urls: input.imageUrls || [],
    is_available: input.isAvailable !== false,
  };

  try {
    const { data, error } = await supabase
      .from("saree_variants")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert variant error:", error);
      return { data: null, error: error.message };
    }

    return { data: mapDbRowToSareeVariant(data as DbSareeVariantRow), error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create colour variant.";
    return { data: null, error: msg };
  }
}

/**
 * Bulk creates multiple colour variants for a saree.
 */
export async function createMultipleSareeVariants(
  inputs: CreateSareeVariantInput[],
  client?: SupabaseClient
): Promise<{ data: SareeVariant[]; error: string | null }> {
  if (!inputs || inputs.length === 0) {
    return { data: [], error: null };
  }

  const supabase = client || createBrowserClient();
  if (!supabase) {
    return { data: [], error: "Supabase client is not available." };
  }

  const payloads = inputs.map((input) => {
    const numericPrice =
      input.price !== undefined && input.price !== null && input.price !== ""
        ? Number(input.price)
        : null;

    return {
      saree_id: input.sareeId,
      color_name: input.colorName.trim(),
      color_code: input.colorCode?.trim() || null,
      price: !isNaN(Number(numericPrice)) ? numericPrice : null,
      stock_quantity: Math.max(0, input.stockQuantity ?? 0),
      image_urls: input.imageUrls || [],
      is_available: input.isAvailable !== false,
    };
  });

  try {
    const { data, error } = await supabase
      .from("saree_variants")
      .insert(payloads)
      .select();

    if (error) {
      console.error("Supabase bulk insert variants error:", error);
      return { data: [], error: error.message };
    }

    const mapped = (data as DbSareeVariantRow[]).map(mapDbRowToSareeVariant);
    return { data: mapped, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to bulk create colour variants.";
    return { data: [], error: msg };
  }
}

/**
 * Updates an existing colour variant by its UUID.
 */
export async function updateSareeVariant(
  id: string,
  input: UpdateSareeVariantInput,
  client?: SupabaseClient
): Promise<{ data: SareeVariant | null; error: string | null }> {
  const supabase = client || createBrowserClient();
  if (!supabase) {
    return { data: null, error: "Supabase client is not available." };
  }

  const payload: Partial<DbSareeVariantRow> = {
    updated_at: new Date().toISOString(),
  };

  if (input.colorName !== undefined) {
    payload.color_name = input.colorName.trim();
  }
  if (input.colorCode !== undefined) {
    payload.color_code = input.colorCode?.trim() || null;
  }
  if (input.price !== undefined) {
    const numericPrice = input.price !== null && input.price !== "" ? Number(input.price) : null;
    payload.price = !isNaN(Number(numericPrice)) ? numericPrice : null;
  }
  if (input.stockQuantity !== undefined) {
    payload.stock_quantity = Math.max(0, Number(input.stockQuantity));
  }
  if (input.imageUrls !== undefined) {
    payload.image_urls = input.imageUrls;
  }
  if (input.isAvailable !== undefined) {
    payload.is_available = input.isAvailable;
  }

  try {
    const { data, error } = await supabase
      .from("saree_variants")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update variant error:", error);
      return { data: null, error: error.message };
    }

    return { data: mapDbRowToSareeVariant(data as DbSareeVariantRow), error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update colour variant.";
    return { data: null, error: msg };
  }
}

/**
 * Safely deletes a colour variant from Supabase.
 * If `imageUrlsToDelete` are provided, deletes those storage files only AFTER successful DB row deletion.
 */
export async function deleteSareeVariant(
  id: string,
  client?: SupabaseClient,
  imageUrlsToDelete?: string[]
): Promise<{ success: boolean; error: string | null }> {
  const supabase = client || createBrowserClient();
  if (!supabase) {
    return { success: false, error: "Supabase client is not available." };
  }

  try {
    const { error } = await supabase.from("saree_variants").delete().eq("id", id);

    if (error) {
      console.error("Supabase delete variant error:", error);
      return { success: false, error: error.message };
    }

    // After successful database deletion, clean up storage photos safely
    if (imageUrlsToDelete && imageUrlsToDelete.length > 0) {
      try {
        await deleteMultipleSareeImages(imageUrlsToDelete, supabase);
      } catch (storageErr) {
        console.warn("Storage cleanup warning after variant deletion:", storageErr);
      }
    }

    return { success: true, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete colour variant.";
    return { success: false, error: msg };
  }
}
