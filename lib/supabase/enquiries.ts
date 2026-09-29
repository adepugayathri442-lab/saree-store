import { createBrowserClient } from "@/lib/supabase/client";
import {
  Enquiry,
  DbEnquiryRow,
  CreateEnquiryInput,
  EnquiryStatus,
} from "@/types/enquiry";

/**
 * Helper to safely format Supabase/PostgREST error objects for structured logging.
 * Prevents empty `{}` logs caused by non-enumerable properties on PostgrestError.
 */
function formatSupabaseError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }
  const err = error as Record<string, unknown>;
  return {
    message: typeof err.message === "string" ? err.message : "Supabase database error",
    code: typeof err.code === "string" ? err.code : undefined,
    details: err.details !== null && err.details !== undefined ? err.details : undefined,
    hint: err.hint !== null && err.hint !== undefined ? err.hint : undefined,
  };
}

/**
 * Maps a raw Supabase `enquiries` database row to the typed `Enquiry` domain model.
 */
export function mapDbRowToEnquiry(row: DbEnquiryRow): Enquiry {
  return {
    id: row.id,
    userId: row.user_id || null,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || null,
    sareeId: row.saree_id || null,
    sareeName: row.saree_name || null,
    sareeSku: row.saree_sku || null,
    variantId: row.variant_id || null,
    selectedColor: row.selected_color || null,
    variantPrice: row.variant_price !== null && row.variant_price !== undefined ? row.variant_price : null,
    quantity: row.quantity ?? 1,
    message: row.message || null,
    status: row.status || "new",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Insert a customer enquiry into Supabase.
 * Uses the canonical columns from the live `enquiries` table schema:
 * `customer_name`, `customer_phone`, `customer_email`, `saree_id`, `saree_name`, `saree_sku`, `quantity`, `message`, `status`.
 * Appends selected colour and price to `message` if provided so details are fully preserved.
 */
export async function createEnquiryInDb(
  input: CreateEnquiryInput
): Promise<Enquiry> {
  const supabase = createBrowserClient();

  const numericVariantPrice =
    input.variantPrice !== undefined && input.variantPrice !== null && input.variantPrice !== ""
      ? Number(input.variantPrice)
      : null;

  // Build a formatted message incorporating variant and custom specifications
  let formattedMessage = input.message?.trim() || "";
  const extraSpecs: string[] = [];
  if (input.selectedColor && !formattedMessage.toLowerCase().includes(input.selectedColor.toLowerCase())) {
    extraSpecs.push(`Colour: ${input.selectedColor}`);
  }
  if (numericVariantPrice !== null && !isNaN(numericVariantPrice)) {
    extraSpecs.push(`Price: ₹${numericVariantPrice.toLocaleString("en-IN")}`);
  }
  if (extraSpecs.length > 0) {
    const specsSuffix = `[Details: ${extraSpecs.join(", ")}]`;
    formattedMessage = formattedMessage ? `${formattedMessage}\n\n${specsSuffix}` : specsSuffix;
  }

  // Payload matching the real database table schema
  const payload: Record<string, unknown> = {
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone.trim(),
    customer_email: input.customerEmail?.trim().toLowerCase() || null,
    saree_id: input.sareeId || null,
    saree_name: input.sareeName?.trim() || null,
    saree_sku: input.sareeSku?.trim() || null,
    quantity: Math.max(1, input.quantity ?? 1),
    message: formattedMessage || null,
    status: input.status || "new",
  };

  const { data, error } = await supabase
    .from("enquiries")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    console.error("Supabase create enquiry error:", formatSupabaseError(error));
    throw new Error(error.message || "Failed to record customer enquiry.");
  }

  return mapDbRowToEnquiry(data as DbEnquiryRow);
}

/**
 * Fetch enquiries placed by a specific customer using the real database column `customer_email`.
 * Strictly queries the real schema without referencing non-existent columns like `user_id`.
 */
export async function fetchCustomerEnquiriesFromDb(options: {
  email?: string | null;
  userId?: string | null;
}): Promise<Enquiry[]> {
  const supabase = createBrowserClient();

  const cleanEmail = options.email?.trim().toLowerCase() || null;

  // Unauthenticated / no email provided -> return empty array cleanly without query
  if (!cleanEmail) {
    return [];
  }

  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .eq("customer_email", cleanEmail)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase fetch customer enquiries error:", formatSupabaseError(error));
    throw new Error(error.message || "Failed to load customer enquiry history.");
  }

  return ((data as DbEnquiryRow[]) || []).map(mapDbRowToEnquiry);
}

/**
 * Fetch enquiries for admin dashboard with optional status filtering.
 */
export async function fetchEnquiriesFromDb(options?: {
  status?: EnquiryStatus | "all";
  searchTerm?: string;
}): Promise<Enquiry[]> {
  const supabase = createBrowserClient();

  let query = supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase fetch enquiries error:", formatSupabaseError(error));
    throw new Error(error.message || "Failed to load enquiries.");
  }

  let enquiries = (data as DbEnquiryRow[]).map(mapDbRowToEnquiry);

  if (options?.searchTerm && options.searchTerm.trim() !== "") {
    const term = options.searchTerm.trim().toLowerCase();
    enquiries = enquiries.filter((e) => {
      const nameMatch = e.customerName.toLowerCase().includes(term);
      const phoneMatch = e.customerPhone.toLowerCase().includes(term);
      const emailMatch = e.customerEmail?.toLowerCase().includes(term);
      const sareeMatch = e.sareeName?.toLowerCase().includes(term);
      const skuMatch = e.sareeSku?.toLowerCase().includes(term);
      const msgMatch = e.message?.toLowerCase().includes(term);
      return (
        nameMatch ||
        phoneMatch ||
        emailMatch ||
        sareeMatch ||
        skuMatch ||
        msgMatch
      );
    });
  }

  return enquiries;
}

/**
 * Update an enquiry's status in Supabase (requires admin authentication).
 */
export async function updateEnquiryStatusInDb(
  id: string,
  status: EnquiryStatus
): Promise<Enquiry> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Supabase update enquiry status error:", formatSupabaseError(error));
    throw new Error(error.message || "Failed to update enquiry status.");
  }

  return mapDbRowToEnquiry(data as DbEnquiryRow);
}

/**
 * Delete an enquiry from Supabase (requires admin authentication).
 */
export async function deleteEnquiryFromDb(id: string): Promise<void> {
  const supabase = createBrowserClient();

  const { error } = await supabase.from("enquiries").delete().eq("id", id);

  if (error) {
    console.error("Supabase delete enquiry error:", formatSupabaseError(error));
    throw new Error(error.message || "Failed to delete enquiry.");
  }
}
