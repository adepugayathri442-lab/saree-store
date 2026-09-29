/**
 * Supabase Service for Customer Saved Addresses
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultClient, createBrowserClient } from "./client";
import { CustomerAddress, SaveAddressInput } from "@/types/address";

function getClient(customClient?: SupabaseClient): SupabaseClient | null {
  if (customClient) return customClient;
  if (defaultClient) return defaultClient;
  try {
    return createBrowserClient();
  } catch {
    return null;
  }
}

export interface DbCustomerAddressRow {
  id: string;
  user_id: string;
  address_label: string;
  customer_name: string | null;
  phone: string | null;
  house_no: string;
  street: string;
  area: string | null;
  landmark: string | null;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  formatted_address: string | null;
  google_maps_url: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function mapDbAddressToCustomerAddress(row: DbCustomerAddressRow): CustomerAddress {
  return {
    id: row.id,
    userId: row.user_id,
    addressLabel: row.address_label || "Home",
    customerName: row.customer_name,
    phone: row.phone,
    houseNo: row.house_no || "",
    street: row.street || "",
    area: row.area,
    landmark: row.landmark,
    city: row.city || "Armoor",
    district: row.district || "Nizamabad",
    state: row.state || "Telangana",
    pincode: row.pincode || "503224",
    latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
    formattedAddress: row.formatted_address,
    googleMapsUrl: row.google_maps_url,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all saved addresses for an authenticated user.
 */
export async function fetchCustomerAddresses(
  userId: string,
  client?: SupabaseClient
): Promise<CustomerAddress[]> {
  const supabase = getClient(client);
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not load customer addresses:", {
        message: error.message,
        code: error.code,
      });
      return [];
    }

    return (data || []).map((row) => mapDbAddressToCustomerAddress(row as DbCustomerAddressRow));
  } catch (err) {
    console.error("Exception in fetchCustomerAddresses:", err);
    return [];
  }
}

/**
 * Fetch the default saved address for an authenticated user.
 */
export async function fetchDefaultCustomerAddress(
  userId: string,
  client?: SupabaseClient
): Promise<CustomerAddress | null> {
  const supabase = getClient(client);
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle();

    if (error) {
      console.warn("Could not load default customer address:", error.message);
      return null;
    }

    if (data) {
      return mapDbAddressToCustomerAddress(data as DbCustomerAddressRow);
    }

    // If no explicit default, fallback to first address
    const all = await fetchCustomerAddresses(userId, client);
    return all.length > 0 ? all[0] : null;
  } catch (err) {
    console.error("Exception in fetchDefaultCustomerAddress:", err);
    return null;
  }
}

/**
 * Save (create or update) a customer address.
 */
export async function saveCustomerAddress(
  input: SaveAddressInput,
  client?: SupabaseClient
): Promise<{ address: CustomerAddress | null; error: string | null }> {
  const supabase = getClient(client);
  if (!supabase) return { address: null, error: "Database client not initialized." };
  if (!input.userId) return { address: null, error: "User ID is required to save address." };

  try {
    // If setting as default, unset other defaults for this user
    if (input.isDefault) {
      await supabase
        .from("customer_addresses")
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq("user_id", input.userId);
    }

    const payload = {
      user_id: input.userId,
      address_label: (input.addressLabel || "Home").trim(),
      customer_name: input.customerName ? input.customerName.trim() : null,
      phone: input.phone ? input.phone.trim() : null,
      house_no: input.houseNo.trim(),
      street: input.street.trim(),
      area: input.area ? input.area.trim() : null,
      landmark: input.landmark ? input.landmark.trim() : null,
      city: input.city.trim(),
      district: input.district.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
      latitude: input.latitude !== undefined && input.latitude !== null ? input.latitude : null,
      longitude: input.longitude !== undefined && input.longitude !== null ? input.longitude : null,
      formatted_address: input.formattedAddress ? input.formattedAddress.trim() : null,
      google_maps_url: input.googleMapsUrl ? input.googleMapsUrl.trim() : null,
      is_default: Boolean(input.isDefault),
      updated_at: new Date().toISOString(),
    };

    let result;
    if (input.id) {
      // Update existing
      result = await supabase
        .from("customer_addresses")
        .update(payload)
        .eq("id", input.id)
        .eq("user_id", input.userId)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from("customer_addresses")
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single();
    }

    if (result.error || !result.data) {
      console.error("Error saving customer address:", {
        message: result.error?.message,
        code: result.error?.code,
        details: result.error?.details,
        hint: result.error?.hint,
      });
      return {
        address: null,
        error: result.error?.message || "Failed to save address. Please check your connection.",
      };
    }

    return {
      address: mapDbAddressToCustomerAddress(result.data as DbCustomerAddressRow),
      error: null,
    };
  } catch (err) {
    console.error("Exception in saveCustomerAddress:", err);
    return { address: null, error: "An unexpected error occurred while saving your address." };
  }
}

/**
 * Set an address as the default address for the user.
 */
export async function setDefaultCustomerAddress(
  userId: string,
  addressId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = getClient(client);
  if (!supabase || !userId || !addressId) return false;

  try {
    // Unset current default
    await supabase
      .from("customer_addresses")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    // Set new default
    const { error } = await supabase
      .from("customer_addresses")
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq("id", addressId)
      .eq("user_id", userId);

    return !error;
  } catch (err) {
    console.error("Exception in setDefaultCustomerAddress:", err);
    return false;
  }
}

/**
 * Delete a customer address.
 */
export async function deleteCustomerAddress(
  userId: string,
  addressId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = getClient(client);
  if (!supabase || !userId || !addressId) return false;

  try {
    const { error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId);

    return !error;
  } catch (err) {
    console.error("Exception in deleteCustomerAddress:", err);
    return false;
  }
}
