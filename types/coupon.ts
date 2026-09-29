export type CouponDiscountType = "percentage" | "fixed";

export type CouponStatus = "Active" | "Scheduled" | "Expired" | "Disabled";

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  minCartValue: number;
  maxDiscountAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCouponInput {
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  minCartValue?: number;
  maxDiscountAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

export interface UpdateCouponInput {
  code?: string;
  description?: string | null;
  discountType?: CouponDiscountType;
  discountValue?: number;
  minCartValue?: number;
  maxDiscountAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  errorMessage?: string;
}
