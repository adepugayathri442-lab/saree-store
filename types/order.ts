/**
 * Types for SaiSrujana Checkout & Order Management System
 */

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentMethod =
  | "cod"
  | "upi_phonepe";

export interface OrderItemSnapshot {
  id?: string;
  orderId?: string;
  sareeId?: string | null;
  variantId?: string | null;
  sareeNameSnapshot: string;
  skuSnapshot: string;
  selectedColour?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrlSnapshot?: string | null;
  categoryLabelSnapshot?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  houseNo: string;
  street: string;
  landmark?: string | null;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  deliveryDistanceKm?: number | null;
  subtotal: number;
  deliveryCharge: number;
  couponCode?: string | null;
  couponDiscount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  expectedDeliveryDate?: string | null;
  adminDeliveryNote?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationRequestStatus?: "none" | "pending" | "approved" | "rejected" | null;
  cancellationRequestReason?: string | null;
  cancellationRequestedAt?: string | null;
  cancellationRejectReason?: string | null;
  cancellationReviewedAt?: string | null;
  cancellationReviewedBy?: string | null;
  items: OrderItemSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  oldStatus?: OrderStatus | null;
  newStatus: OrderStatus;
  changedBy: string;
  changedAt: string;
  note?: string | null;
}

export interface CustomerNotification {
  id: string;
  userId: string;
  orderId?: string | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateOrderInput {
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  houseNo: string;
  street: string;
  landmark?: string | null;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  deliveryDistanceKm?: number | null;
  subtotal: number;
  deliveryCharge: number;
  couponCode?: string | null;
  couponDiscount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  expectedDeliveryDate?: string | null;
  items: {
    sareeId?: string | null;
    variantId?: string | null;
    sareeNameSnapshot: string;
    skuSnapshot: string;
    selectedColour?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrlSnapshot?: string | null;
    categoryLabelSnapshot?: string | null;
  }[];
}

export interface DeliveryRule {
  id: string;
  name: string;
  minDistanceKm: number;
  maxDistanceKm: number | null;
  charge: number;
  estimatedDays: number;
  isActive: boolean;
  description?: string | null;
}
