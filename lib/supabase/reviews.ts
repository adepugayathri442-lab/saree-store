import { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Review,
  DbReviewRow,
  CreateReviewInput,
  ReviewStatus,
  ReviewStats,
} from "@/types/review";

/**
 * Maps a raw Supabase `reviews` database row to the typed `Review` domain model.
 */
export function mapDbRowToReview(row: DbReviewRow): Review {
  return {
    id: row.id,
    sareeId: row.saree_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email || null,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sareeName: row.sarees?.name || null,
    sareeSku: row.sarees?.sku || null,
    sareeImage: row.sarees?.image_url || null,
  };
}

/**
 * Fetch approved reviews for a specific saree (Public customer view).
 */
export async function fetchApprovedReviewsBySareeId(
  sareeId: string,
  customClient?: SupabaseClient
): Promise<Review[]> {
  const supabase = customClient || createBrowserClient();

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("saree_id", sareeId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching approved reviews:", error.message || error);
      return [];
    }

    return (data as DbReviewRow[] || []).map(mapDbRowToReview);
  } catch (err) {
    console.error("Exception fetching approved reviews:", err);
    return [];
  }
}

/**
 * Calculates review statistics (average rating, review count, rating breakdown) from approved reviews.
 */
export async function fetchReviewStatsBySareeId(
  sareeId: string,
  customClient?: SupabaseClient
): Promise<ReviewStats> {
  const reviews = await fetchApprovedReviewsBySareeId(sareeId, customClient);
  
  const initialBreakdown: Record<number, number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: initialBreakdown,
    };
  }

  let totalScore = 0;
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    initialBreakdown[star] = (initialBreakdown[star] || 0) + 1;
    totalScore += r.rating;
  });

  const averageRating = Number((totalScore / reviews.length).toFixed(1));

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingBreakdown: initialBreakdown,
  };
}

/**
 * Submit a new customer review (Status defaults to 'pending' for admin approval).
 */
export async function submitCustomerReview(
  input: CreateReviewInput,
  customClient?: SupabaseClient
): Promise<{ data: Review | null; error: Error | null }> {
  const supabase = customClient || createBrowserClient();

  try {
    const ratingClamped = Math.min(5, Math.max(1, Math.round(input.rating)));
    const payload = {
      saree_id: input.sareeId,
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail?.trim() || null,
      rating: ratingClamped,
      comment: input.comment.trim(),
      status: "pending" as ReviewStatus,
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert review error:", error);
      return { data: null, error: new Error(error.message || "Failed to submit review.") };
    }

    return { data: mapDbRowToReview(data as DbReviewRow), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected error submitting review.";
    return { data: null, error: new Error(msg) };
  }
}

/**
 * Fetch all reviews for admin management (includes saree join for title and SKU).
 */
export async function fetchAllReviewsAdmin(
  customClient?: SupabaseClient
): Promise<Review[]> {
  const supabase = customClient || createBrowserClient();

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        sarees:saree_id (
          name,
          sku,
          image_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin reviews:", error.message || error);
      return [];
    }

    return (data as DbReviewRow[] || []).map(mapDbRowToReview);
  } catch (err) {
    console.error("Exception fetching admin reviews:", err);
    return [];
  }
}

/**
 * Update a review's approval status (approved / rejected / pending).
 */
export async function updateReviewStatusInDb(
  id: string,
  status: ReviewStatus,
  customClient?: SupabaseClient
): Promise<{ data: Review | null; error: Error | null }> {
  const supabase = customClient || createBrowserClient();

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({ status })
      .eq("id", id)
      .select(`
        *,
        sarees:saree_id (
          name,
          sku,
          image_url
        )
      `)
      .single();

    if (error) {
      console.error("Error updating review status:", error);
      return { data: null, error: new Error(error.message || "Failed to update review status.") };
    }

    return { data: mapDbRowToReview(data as DbReviewRow), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected error updating review status.";
    return { data: null, error: new Error(msg) };
  }
}

/**
 * Delete a review from the database.
 */
export async function deleteReviewFromDb(
  id: string,
  customClient?: SupabaseClient
): Promise<{ error: Error | null }> {
  const supabase = customClient || createBrowserClient();

  try {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting review:", error);
      return { error: new Error(error.message || "Failed to delete review.") };
    }

    return { error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected error deleting review.";
    return { error: new Error(msg) };
  }
}
