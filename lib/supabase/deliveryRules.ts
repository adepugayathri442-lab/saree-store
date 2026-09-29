/**
 * Supabase Service for Delivery Rules Configuration
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultClient, createBrowserClient } from "./client";
import { DeliveryRule } from "@/types/order";
import { DEFAULT_DELIVERY_RULES } from "@/lib/delivery";

function getClient(customClient?: SupabaseClient): SupabaseClient | null {
  if (customClient) return customClient;
  if (defaultClient) return defaultClient;
  try {
    return createBrowserClient();
  } catch {
    return null;
  }
}

export interface DbDeliveryRuleRow {
  id: string;
  name: string;
  min_distance_km: number;
  max_distance_km: number | null;
  charge: number;
  estimated_days: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function mapDbRowToDeliveryRule(row: DbDeliveryRuleRow): DeliveryRule {
  return {
    id: row.id,
    name: row.name,
    minDistanceKm: Number(row.min_distance_km) || 0,
    maxDistanceKm: row.max_distance_km !== null ? Number(row.max_distance_km) : null,
    charge: Number(row.charge) || 0,
    estimatedDays: Number(row.estimated_days) || 3,
    isActive: Boolean(row.is_active),
    description: row.description || undefined,
  };
}

/**
 * Fetches all active delivery rules for public checkout calculation.
 */
export async function fetchDeliveryRulesFromDb(): Promise<DeliveryRule[]> {
  const supabase = getClient();
  if (!supabase) {
    return DEFAULT_DELIVERY_RULES;
  }

  try {
    const { data, error } = await supabase
      .from("delivery_rules")
      .select("*")
      .order("min_distance_km", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_DELIVERY_RULES;
    }

    return (data as DbDeliveryRuleRow[]).map(mapDbRowToDeliveryRule);
  } catch (err) {
    console.warn("Exception fetching delivery rules, using defaults:", err);
    return DEFAULT_DELIVERY_RULES;
  }
}

/**
 * Admin: Update a delivery rule (charge, distance slabs, estimated days, active toggle).
 */
export async function updateDeliveryRuleInDb(
  rule: DeliveryRule,
  supabaseClient: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseClient
      .from("delivery_rules")
      .upsert({
        id: rule.id,
        name: rule.name,
        min_distance_km: rule.minDistanceKm,
        max_distance_km: rule.maxDistanceKm,
        charge: rule.charge,
        estimated_days: rule.estimatedDays,
        is_active: rule.isActive,
        description: rule.description || null,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update delivery rule.";
    return { success: false, error: msg };
  }
}
