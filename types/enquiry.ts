/**
 * TypeScript Type Definitions for Customer Enquiry Management
 * SaiSrujana Boutique
 */

export type EnquiryStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface Enquiry {
  id: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  sareeId?: string | null;
  sareeName?: string | null;
  sareeSku?: string | null;
  variantId?: string | null;
  selectedColor?: string | null;
  variantPrice?: number | string | null;
  quantity: number;
  message?: string | null;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DbEnquiryRow {
  id: string;
  user_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  saree_id: string | null;
  saree_name: string | null;
  saree_sku: string | null;
  variant_id?: string | null;
  selected_color?: string | null;
  variant_price?: number | null;
  quantity: number;
  message: string | null;
  status: EnquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateEnquiryInput {
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  sareeId?: string | null;
  sareeName?: string | null;
  sareeSku?: string | null;
  variantId?: string | null;
  selectedColor?: string | null;
  variantPrice?: number | string | null;
  quantity?: number;
  message?: string | null;
  status?: EnquiryStatus;
}

export interface UpdateEnquiryStatusInput {
  id: string;
  status: EnquiryStatus;
}
