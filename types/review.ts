/**
 * TypeScript Type Definitions for Customer Reviews & Ratings
 * SaiSrujana Boutique
 */

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  sareeId: string;
  customerName: string;
  customerEmail?: string | null;
  rating: number; // 1 to 5
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  // Optional joined data from sarees
  sareeName?: string | null;
  sareeSku?: string | null;
  sareeImage?: string | null;
}

export interface DbReviewRow {
  id: string;
  saree_id: string;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  sarees?: {
    name: string;
    sku: string;
    image_url: string | null;
  } | null;
}

export interface CreateReviewInput {
  sareeId: string;
  customerName: string;
  customerEmail?: string | null;
  rating: number;
  comment: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>; // 1: count, 2: count, etc.
}
