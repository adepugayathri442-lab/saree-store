/**
 * Supabase Database Helper for Offers & Coupons
 * SaiSrujana Saree Boutique
 * Table: `public.coupons`
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultClient, createBrowserClient } from "./client";
import {
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
  CouponStatus,
  CouponValidationResult,
} from "@/types/coupon";

export interface DbCouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_cart_value: number;
  max_discount_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Maps a raw Supabase database row to the TypeScript `Coupon` interface.
 */
export function mapDbRowToCoupon(row: DbCouponRow): Coupon {
  return {
    id: row.id,
    code: (row.code || "").toUpperCase().trim(),
    description: row.description,
    discountType: row.discount_type === "fixed" ? "fixed" : "percentage",
    discountValue: Number(row.discount_value) || 0,
    minCartValue: Number(row.min_cart_value) || 0,
    maxDiscountAmount:
      row.max_discount_amount !== null && row.max_discount_amount !== undefined
        ? Number(row.max_discount_amount)
        : null,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Computes the lifecycle status of a coupon.
 */
export function getCouponStatus(coupon: Coupon): CouponStatus {
  if (!coupon.isActive) {
    return "Disabled";
  }

  const now = new Date();

  if (coupon.startDate) {
    const start = new Date(coupon.startDate);
    if (!isNaN(start.getTime()) && now < start) {
      return "Scheduled";
    }
  }

  if (coupon.endDate) {
    const end = new Date(coupon.endDate);
    if (!isNaN(end.getTime()) && now > end) {
      return "Expired";
    }
  }

  return "Active";
}

/**
 * Fetches all coupons from Supabase (for Admin management).
 */
export async function fetchCouponsFromDb(client?: SupabaseClient): Promise<Coupon[]> {
  const supabase = client || defaultClient || createBrowserClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching coupons from Supabase:", error);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return (data as DbCouponRow[]).map(mapDbRowToCoupon);
  } catch (err) {
    console.error("Exception fetching coupons:", err);
    return [];
  }
}

/**
 * Creates a new coupon in Supabase.
 */
export async function createCouponInDb(
  input: CreateCouponInput,
  client?: SupabaseClient
): Promise<{ success: boolean; data?: Coupon; error?: string }> {
  const supabase = client || defaultClient || createBrowserClient();
  if (!supabase) {
    return { success: false, error: "Database client is not available" };
  }

  const cleanCode = input.code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, error: "Coupon code is required" };
  }

  if (input.discountValue <= 0) {
    return { success: false, error: "Discount value must be greater than 0" };
  }

  try {
    const insertPayload = {
      code: cleanCode,
      description: input.description?.trim() || null,
      discount_type: input.discountType,
      discount_value: Number(input.discountValue),
      min_cart_value: Number(input.minCartValue || 0),
      max_discount_amount:
        input.maxDiscountAmount !== null && input.maxDiscountAmount !== undefined && input.maxDiscountAmount > 0
          ? Number(input.maxDiscountAmount)
          : null,
      start_date: input.startDate ? new Date(input.startDate).toISOString() : null,
      end_date: input.endDate ? new Date(input.endDate).toISOString() : null,
      is_active: input.isActive !== false,
    };

    const { data, error } = await supabase
      .from("coupons")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.message.includes("unique")) {
        return { success: false, error: `Coupon code "${cleanCode}" already exists. Please use a unique code.` };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: mapDbRowToCoupon(data as DbCouponRow) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create coupon";
    return { success: false, error: message };
  }
}

/**
 * Updates an existing coupon in Supabase.
 */
export async function updateCouponInDb(
  id: string,
  input: UpdateCouponInput,
  client?: SupabaseClient
): Promise<{ success: boolean; data?: Coupon; error?: string }> {
  const supabase = client || defaultClient || createBrowserClient();
  if (!supabase || !id) {
    return { success: false, error: "Database client is not available or missing ID" };
  }

  try {
    const updatePayload: Record<string, unknown> = {};

    if (input.code !== undefined) {
      const cleanCode = input.code.trim().toUpperCase();
      if (!cleanCode) return { success: false, error: "Coupon code cannot be empty" };
      updatePayload.code = cleanCode;
    }

    if (input.description !== undefined) {
      updatePayload.description = input.description?.trim() || null;
    }

    if (input.discountType !== undefined) {
      updatePayload.discount_type = input.discountType;
    }

    if (input.discountValue !== undefined) {
      if (input.discountValue <= 0) return { success: false, error: "Discount value must be greater than 0" };
      updatePayload.discount_value = Number(input.discountValue);
    }

    if (input.minCartValue !== undefined) {
      updatePayload.min_cart_value = Number(input.minCartValue || 0);
    }

    if (input.maxDiscountAmount !== undefined) {
      updatePayload.max_discount_amount =
        input.maxDiscountAmount !== null && input.maxDiscountAmount !== undefined && input.maxDiscountAmount > 0
          ? Number(input.maxDiscountAmount)
          : null;
    }

    if (input.startDate !== undefined) {
      updatePayload.start_date = input.startDate ? new Date(input.startDate).toISOString() : null;
    }

    if (input.endDate !== undefined) {
      updatePayload.end_date = input.endDate ? new Date(input.endDate).toISOString() : null;
    }

    if (input.isActive !== undefined) {
      updatePayload.is_active = input.isActive;
    }

    const { data, error } = await supabase
      .from("coupons")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.message.includes("unique")) {
        return { success: false, error: `A coupon with this code already exists.` };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: mapDbRowToCoupon(data as DbCouponRow) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update coupon";
    return { success: false, error: message };
  }
}

/**
 * Toggles coupon active/inactive status.
 */
export async function toggleCouponStatusInDb(
  id: string,
  isActive: boolean,
  client?: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const supabase = client || defaultClient || createBrowserClient();
  if (!supabase || !id) return { success: false, error: "Missing ID or client" };

  try {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update status" };
  }
}

/**
 * Deletes a coupon from Supabase.
 */
export async function deleteCouponFromDb(
  id: string,
  client?: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const supabase = client || defaultClient || createBrowserClient();
  if (!supabase || !id) return { success: false, error: "Missing ID or client" };

  try {
    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete coupon" };
  }
}

/**
 * Validates a coupon code entered by a customer in the Cart.
 * Checks existence, active state, date validity, and minimum cart value.
 */
export async function validateCouponCode(
  code: string,
  cartSubtotal: number,
  client?: SupabaseClient
): Promise<CouponValidationResult> {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { isValid: false, errorMessage: "Please enter a coupon code." };
  }

  const supabase = client || defaultClient || createBrowserClient();
  if (!supabase) {
    return { isValid: false, errorMessage: "Could not connect to store database." };
  }

  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error) {
      console.error("Error checking coupon:", error);
      return { isValid: false, errorMessage: "Failed to validate coupon code. Please try again." };
    }

    if (!data) {
      return { isValid: false, errorMessage: `Coupon "${cleanCode}" is invalid or does not exist.` };
    }

    const coupon = mapDbRowToCoupon(data as DbCouponRow);
    const status = getCouponStatus(coupon);

    if (status === "Disabled") {
      return { isValid: false, errorMessage: `Coupon "${cleanCode}" is currently inactive.` };
    }

    if (status === "Scheduled") {
      const startFormatted = coupon.startDate
        ? new Date(coupon.startDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "a future date";
      return {
        isValid: false,
        errorMessage: `Coupon "${cleanCode}" will be active starting ${startFormatted}.`,
      };
    }

    if (status === "Expired") {
      const endFormatted = coupon.endDate
        ? new Date(coupon.endDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "previously";
      return {
        isValid: false,
        errorMessage: `Coupon "${cleanCode}" expired on ${endFormatted}.`,
      };
    }

    // Check minimum cart value requirement
    if (cartSubtotal < coupon.minCartValue) {
      return {
        isValid: false,
        errorMessage: `Minimum cart value of ₹${coupon.minCartValue.toLocaleString("en-IN")} is required to apply "${cleanCode}". Current subtotal: ₹${cartSubtotal.toLocaleString("en-IN")}.`,
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((cartSubtotal * coupon.discountValue) / 100);
      if (
        coupon.maxDiscountAmount !== null &&
        coupon.maxDiscountAmount !== undefined &&
        coupon.maxDiscountAmount > 0
      ) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      // Fixed amount
      discountAmount = Math.min(coupon.discountValue, cartSubtotal);
    }

    return {
      isValid: true,
      coupon,
      discountAmount,
    };
  } catch (err: unknown) {
    console.error("Exception during coupon validation:", err);
    return { isValid: false, errorMessage: "An error occurred while validating the coupon." };
  }
}
