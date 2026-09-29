/**
 * Supabase Service for Customer Orders & Management
 */

import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import { supabase as defaultClient, createBrowserClient } from "./client";
import {
  Order,
  OrderItemSnapshot,
  CreateOrderInput,
  OrderStatus,
  PaymentStatus,
  OrderStatusHistory,
  CustomerNotification,
} from "@/types/order";
import { SHOP_CONFIG, getWhatsAppUrl, formatCurrency } from "@/config/shop";
import { getGoogleMapsPinUrl } from "@/lib/delivery";

function getClient(customClient?: SupabaseClient): SupabaseClient | null {
  if (customClient) return customClient;
  if (defaultClient) return defaultClient;
  try {
    return createBrowserClient();
  } catch {
    return null;
  }
}

export interface DbOrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  house_no: string;
  street: string;
  landmark: string | null;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  delivery_distance_km: number | null;
  subtotal: number;
  delivery_charge: number;
  coupon_code: string | null;
  coupon_discount: number;
  total_amount: number;
  payment_method: "cod" | "upi_phonepe";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  order_status: "placed" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  expected_delivery_date: string | null;
  admin_delivery_note: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_request_status?: "none" | "pending" | "approved" | "rejected" | null;
  cancellation_request_reason?: string | null;
  cancellation_requested_at?: string | null;
  cancellation_reject_reason?: string | null;
  cancellation_reviewed_at?: string | null;
  cancellation_reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: DbOrderItemRow[];
}

export interface DbOrderItemRow {
  id: string;
  order_id: string;
  saree_id: string | null;
  variant_id: string | null;
  saree_name_snapshot: string;
  sku_snapshot: string;
  selected_colour: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url_snapshot: string | null;
  category_label_snapshot: string | null;
  created_at: string;
}

export function mapDbOrderItemToSnapshot(row: DbOrderItemRow): OrderItemSnapshot {
  return {
    id: row.id,
    orderId: row.order_id,
    sareeId: row.saree_id,
    variantId: row.variant_id,
    sareeNameSnapshot: row.saree_name_snapshot,
    skuSnapshot: row.sku_snapshot,
    selectedColour: row.selected_colour || undefined,
    quantity: Number(row.quantity) || 1,
    unitPrice: Number(row.unit_price) || 0,
    totalPrice: Number(row.total_price) || 0,
    imageUrlSnapshot: row.image_url_snapshot || undefined,
    categoryLabelSnapshot: row.category_label_snapshot || undefined,
  };
}

export function mapDbOrderToOrder(row: DbOrderRow): Order {
  const items: OrderItemSnapshot[] = Array.isArray(row.order_items)
    ? row.order_items.map(mapDbOrderItemToSnapshot)
    : [];

  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || undefined,
    houseNo: row.house_no,
    street: row.street,
    landmark: row.landmark || undefined,
    city: row.city,
    district: row.district,
    state: row.state,
    pincode: row.pincode,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    deliveryDistanceKm: row.delivery_distance_km !== null ? Number(row.delivery_distance_km) : null,
    subtotal: Number(row.subtotal) || 0,
    deliveryCharge: Number(row.delivery_charge) || 0,
    couponCode: row.coupon_code || undefined,
    couponDiscount: Number(row.coupon_discount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    expectedDeliveryDate: row.expected_delivery_date || undefined,
    adminDeliveryNote: row.admin_delivery_note || undefined,
    cancellationReason: row.cancellation_reason || undefined,
    cancelledAt: row.cancelled_at || undefined,
    cancelledBy: row.cancelled_by || undefined,
    cancellationRequestStatus: row.cancellation_request_status || undefined,
    cancellationRequestReason: row.cancellation_request_reason || undefined,
    cancellationRequestedAt: row.cancellation_requested_at || undefined,
    cancellationRejectReason: row.cancellation_reject_reason || undefined,
    cancellationReviewedAt: row.cancellation_reviewed_at || undefined,
    cancellationReviewedBy: row.cancellation_reviewed_by || undefined,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Alias to adhere to mapDbRowTo<Entity> naming conventions across the project
 */
export const mapDbRowToOrder = mapDbOrderToOrder;


/**
 * Generates an official SaiSrujana Order Number (e.g., SS-20260928-842)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(100 + Math.random() * 900); // 3-digit random
  return `SS-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Creates an order in Supabase with item snapshots and safe stock deduction.
 */
export async function createOrderInDb(
  input: CreateOrderInput,
  customSupabaseClient?: SupabaseClient
): Promise<{ order: Order | null; error: string | null }> {
  const supabase = getClient(customSupabaseClient);
  if (!supabase) {
    return { order: null, error: "Database connection unavailable. Please try again." };
  }

  try {
    // 1. Validate stock availability for each item
    for (const item of input.items) {
      if (item.variantId) {
        const { data: variantRow } = await supabase
          .from("saree_variants")
          .select("stock_quantity, color_name")
          .eq("id", item.variantId)
          .maybeSingle();

        if (variantRow && typeof variantRow.stock_quantity === "number") {
          if (variantRow.stock_quantity < item.quantity) {
            return {
              order: null,
              error: `Only ${variantRow.stock_quantity} piece(s) available for "${item.sareeNameSnapshot} (${variantRow.color_name})". Please adjust your quantity.`,
            };
          }
        }
      } else if (item.sareeId) {
        const { data: sareeRow } = await supabase
          .from("sarees")
          .select("stock_quantity, name, stock_status")
          .eq("id", item.sareeId)
          .maybeSingle();

        if (sareeRow && typeof sareeRow.stock_quantity === "number") {
          if (sareeRow.stock_quantity < item.quantity) {
            return {
              order: null,
              error: `Only ${sareeRow.stock_quantity} piece(s) available for "${sareeRow.name}". Please adjust your quantity.`,
            };
          }
        }
      }
    }

    // 2. Generate unique order number
    let orderNumber = generateOrderNumber();
    // Ensure uniqueness
    const { data: existingNum } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (existingNum) {
      orderNumber = `${generateOrderNumber()}-${Math.floor(10 + Math.random() * 90)}`;
    }

    // 3. Insert order record
    const orderPayload = {
      order_number: orderNumber,
      user_id: input.userId || null,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      customer_email: input.customerEmail?.trim() || null,
      house_no: input.houseNo.trim(),
      street: input.street.trim(),
      landmark: input.landmark?.trim() || null,
      city: input.city.trim(),
      district: input.district.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
      latitude: input.latitude !== undefined ? input.latitude : null,
      longitude: input.longitude !== undefined ? input.longitude : null,
      delivery_distance_km: input.deliveryDistanceKm !== undefined ? input.deliveryDistanceKm : null,
      subtotal: input.subtotal,
      delivery_charge: input.deliveryCharge,
      coupon_code: input.couponCode || null,
      coupon_discount: input.couponDiscount || 0,
      total_amount: input.totalAmount,
      payment_method: input.paymentMethod,
      payment_status: input.paymentStatus || "pending",
      order_status: "placed",
      expected_delivery_date: input.expectedDeliveryDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();

    if (orderError || !orderData) {
      console.error("Error creating order in Supabase:", {
        message: orderError?.message,
        code: orderError?.code,
        details: orderError?.details,
        hint: orderError?.hint,
      });
      const detailedMsg = orderError?.message
        ? `Order placement failed: ${orderError.message}${orderError.hint ? ` (${orderError.hint})` : ""}${orderError.code ? ` [Code: ${orderError.code}]` : ""}`
        : "Failed to create order. Please check your database connection.";
      return { order: null, error: detailedMsg };
    }

    const orderId = orderData.id;

    // 4. Insert order item snapshot records
    const itemsPayload = input.items.map((item) => ({
      order_id: orderId,
      saree_id: item.sareeId || null,
      variant_id: item.variantId || null,
      saree_name_snapshot: item.sareeNameSnapshot,
      sku_snapshot: item.skuSnapshot,
      selected_colour: item.selectedColour || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      image_url_snapshot: item.imageUrlSnapshot || null,
      category_label_snapshot: item.categoryLabelSnapshot || null,
      created_at: new Date().toISOString(),
    }));

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload)
      .select();

    if (itemsError) {
      console.error("Error inserting order items in Supabase:", {
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint,
      });
    }

    // 5. Safely decrement stock for purchased items
    for (const item of input.items) {
      try {
        if (item.variantId) {
          const { data: v } = await supabase
            .from("saree_variants")
            .select("stock_quantity")
            .eq("id", item.variantId)
            .single();
          if (v && typeof v.stock_quantity === "number") {
            const nextQty = Math.max(0, v.stock_quantity - item.quantity);
            await supabase
              .from("saree_variants")
              .update({ stock_quantity: nextQty, is_available: nextQty > 0 })
              .eq("id", item.variantId);
          }
        }
        if (item.sareeId) {
          const { data: s } = await supabase
            .from("sarees")
            .select("stock_quantity")
            .eq("id", item.sareeId)
            .single();
          if (s && typeof s.stock_quantity === "number") {
            const nextQty = Math.max(0, s.stock_quantity - item.quantity);
            await supabase
              .from("sarees")
              .update({
                stock_quantity: nextQty,
                stock_status: nextQty === 0 ? "Out of Stock" : "In Stock",
              })
              .eq("id", item.sareeId);
          }
        }
      } catch (stockErr) {
        console.warn("Non-fatal stock decrement warning:", stockErr);
      }
    }

    // 6. Record initial status history
    try {
      await supabase.from("order_status_history").insert([
        {
          order_id: orderId,
          old_status: null,
          new_status: "placed",
          changed_by: "customer",
          note: "Order placed successfully by customer",
          changed_at: new Date().toISOString(),
        },
      ]);
    } catch (historyErr) {
      console.warn("Non-fatal initial status history error:", historyErr);
    }

    // 7. Create initial customer notification for authenticated patrons
    if (input.userId) {
      try {
        await createCustomerNotification({
          userId: input.userId,
          orderId,
          title: "Order Placed",
          message: `Your SaiSrujana order ${orderNumber} has been placed successfully.`,
          type: "order_placed",
          customSupabaseClient: supabase,
        });
      } catch (notifErr) {
        console.warn("Non-fatal initial notification error:", notifErr);
      }
    }

    const createdOrder = mapDbOrderToOrder({
      ...orderData,
      order_items: itemsData || [],
    });

    return { order: createdOrder, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred during order placement.";
    return { order: null, error: msg };
  }
}

/**
 * Fetches an order by its UUID id or human-readable order number.
 */
export async function fetchOrderByIdOrNumber(
  idOrNumber: string,
  customSupabaseClient?: SupabaseClient
): Promise<Order | null> {
  const supabase = getClient(customSupabaseClient);
  if (!supabase) return null;

  try {
    const clean = idOrNumber.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    let query = supabase.from("orders").select("*, order_items(*)");
    if (isUuid) {
      query = query.eq("id", clean);
    } else {
      query = query.eq("order_number", clean.toUpperCase());
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;

    return mapDbOrderToOrder(data as DbOrderRow);
  } catch (err) {
    console.error("Error fetching order:", err);
    return null;
  }
}

/**
/**
 * Fetches all orders belonging to a customer (by user_id, email, or phone).
 * Strictly queries that specific customer's own orders without exposing other customers' records.
 */
export async function fetchCustomerOrdersFromDb(params: {
  userId?: string;
  phone?: string;
  email?: string;
}): Promise<Order[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const cleanUserId = params.userId?.trim() || null;
  const cleanEmail = params.email?.trim().toLowerCase() || null;
  const cleanPhone = params.phone?.trim() || null;

  if (!cleanUserId && !cleanEmail && !cleanPhone) {
    return [];
  }

  try {
    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (cleanUserId && cleanEmail) {
      query = query.or(`user_id.eq.${cleanUserId},customer_email.eq.${cleanEmail}`);
    } else if (cleanUserId) {
      query = query.eq("user_id", cleanUserId);
    } else if (cleanEmail) {
      query = query.eq("customer_email", cleanEmail);
    } else if (cleanPhone) {
      query = query.eq("customer_phone", cleanPhone);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching customer orders from Supabase:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(error.message || "Failed to load orders.");
    }

    return ((data as DbOrderRow[]) || []).map(mapDbOrderToOrder);
  } catch (err) {
    console.error("Error fetching customer orders:", err);
    throw err;
  }
}

/**
 * Fetches all orders for the Admin Order Management dashboard.
 */
export async function fetchAdminOrdersFromDb(
  filters?: {
    orderStatus?: OrderStatus | "all";
    paymentStatus?: PaymentStatus | "all";
    search?: string;
  },
  customSupabaseClient?: SupabaseClient
): Promise<Order[]> {
  const supabase = getClient(customSupabaseClient);
  if (!supabase) return [];

  try {
    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (filters?.orderStatus && filters.orderStatus !== "all") {
      query = query.eq("order_status", filters.orderStatus);
    }

    if (filters?.paymentStatus && filters.paymentStatus !== "all") {
      query = query.eq("payment_status", filters.paymentStatus);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    let orders = (data as DbOrderRow[]).map(mapDbOrderToOrder);

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
          o.city.toLowerCase().includes(q) ||
          o.district.toLowerCase().includes(q) ||
          o.items.some((it) => it.sareeNameSnapshot.toLowerCase().includes(q) || it.skuSnapshot.toLowerCase().includes(q))
      );
    }

    return orders;
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    return [];
  }
}

/**
 * Fetches order status transition history.
 */
export async function fetchOrderStatusHistory(
  orderId: string,
  customSupabaseClient?: SupabaseClient
): Promise<OrderStatusHistory[]> {
  const supabase = getClient(customSupabaseClient);
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("changed_at", { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      oldStatus: row.old_status,
      newStatus: row.new_status,
      changedBy: row.changed_by,
      changedAt: row.changed_at,
      note: row.note,
    }));
  } catch (err) {
    console.error("Error fetching order status history:", err);
    return [];
  }
}

/**
 * Creates a customer notification in public.customer_notifications.
 */
export async function createCustomerNotification(params: {
  userId: string;
  orderId?: string | null;
  title: string;
  message: string;
  type?: string;
  customSupabaseClient?: SupabaseClient;
}): Promise<boolean> {
  const supabase = getClient(params.customSupabaseClient);
  if (!supabase || !params.userId) return false;

  try {
    const { error } = await supabase.from("customer_notifications").insert([
      {
        user_id: params.userId,
        order_id: params.orderId || null,
        title: params.title,
        message: params.message,
        type: params.type || "order_update",
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      console.warn("Non-fatal notification insert error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Non-fatal notification error:", err);
    return false;
  }
}

/**
 * Fetches all notifications for a customer.
 */
export async function fetchCustomerNotifications(
  userId: string,
  customSupabaseClient?: SupabaseClient
): Promise<CustomerNotification[]> {
  const supabase = getClient(customSupabaseClient);
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from("customer_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      orderId: row.order_id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("Error fetching customer notifications:", err);
    return [];
  }
}

/**
 * Marks a customer notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
  customSupabaseClient?: SupabaseClient
): Promise<boolean> {
  const supabase = getClient(customSupabaseClient);
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("customer_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Marks all customer notifications as read.
 */
export async function markAllNotificationsAsRead(
  userId: string,
  customSupabaseClient?: SupabaseClient
): Promise<boolean> {
  const supabase = getClient(customSupabaseClient);
  if (!supabase || !userId) return false;

  try {
    const { error } = await supabase
      .from("customer_notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Customer Order Cancellation with stock recovery, history, and notification.
 */
export async function cancelCustomerOrderInDb(params: {
  orderId: string;
  userId: string;
  reason: string;
  customSupabaseClient?: SupabaseClient;
}): Promise<{ success: boolean; error?: string; order?: Order }> {
  const supabase = getClient(params.customSupabaseClient);
  if (!supabase) return { success: false, error: "Database connection unavailable." };

  const cleanReason = (params.reason || "").trim();
  if (!cleanReason) {
    return { success: false, error: "Please provide a valid cancellation reason." };
  }

  try {
    // 1. Fetch current order to verify ownership and cancellable status
    const { data: orderData, error: fetchErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", params.orderId)
      .maybeSingle();

    if (fetchErr || !orderData) {
      return { success: false, error: "Order not found." };
    }

    if (orderData.user_id && orderData.user_id !== params.userId) {
      return { success: false, error: "Unauthorized. You can only cancel your own orders." };
    }

    const currentStatus = orderData.order_status as OrderStatus;
    if (currentStatus === "delivered") {
      return {
        success: false,
        error: "Delivered orders cannot be cancelled.",
      };
    }
    if (currentStatus === "cancelled") {
      return {
        success: false,
        error: "This order is already cancelled.",
      };
    }

    const now = new Date().toISOString();

    // 2. Update order to cancelled
    let updatedRow: (DbOrderRow & { order_items?: unknown[] }) | null = null;
    let updateErr: PostgrestError | null = null;

    const res1 = await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
        cancellation_reason: cleanReason,
        cancelled_at: now,
        cancelled_by: "customer",
        updated_at: now,
      })
      .eq("id", params.orderId)
      .select("*, order_items(*)")
      .maybeSingle();

    if (res1.error && res1.error.message.includes("cancelled_by")) {
      const res2 = await supabase
        .from("orders")
        .update({
          order_status: "cancelled",
          cancellation_reason: cleanReason,
          cancelled_at: now,
          updated_at: now,
        })
        .eq("id", params.orderId)
        .select("*, order_items(*)")
        .maybeSingle();
      updatedRow = res2.data;
      updateErr = res2.error;
    } else {
      updatedRow = res1.data;
      updateErr = res1.error;
    }

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 3. Record status history
    try {
      await supabase.from("order_status_history").insert([
        {
          order_id: params.orderId,
          old_status: currentStatus,
          new_status: "cancelled",
          changed_by: "customer",
          note: `Cancelled by customer: ${cleanReason}`,
          changed_at: now,
        },
      ]);
    } catch (histErr) {
      console.warn("Non-fatal cancellation history error:", histErr);
    }

    // 4. Create customer notification
    if (orderData.user_id) {
      await createCustomerNotification({
        userId: orderData.user_id,
        orderId: params.orderId,
        title: "Order Cancelled",
        message: `Your SaiSrujana order ${orderData.order_number} was cancelled. Reason: ${cleanReason}`,
        type: "order_cancelled",
        customSupabaseClient: supabase,
      });
    }

    // 5. Restore stock for items
    if (Array.isArray(orderData.order_items)) {
      for (const item of orderData.order_items) {
        try {
          if (item.variant_id) {
            const { data: v } = await supabase
              .from("saree_variants")
              .select("stock_quantity")
              .eq("id", item.variant_id)
              .single();
            if (v && typeof v.stock_quantity === "number") {
              const nextQty = v.stock_quantity + Number(item.quantity || 1);
              await supabase
                .from("saree_variants")
                .update({ stock_quantity: nextQty, is_available: true })
                .eq("id", item.variant_id);
            }
          } else if (item.saree_id) {
            const { data: s } = await supabase
              .from("sarees")
              .select("stock_quantity")
              .eq("id", item.saree_id)
              .single();
            if (s && typeof s.stock_quantity === "number") {
              const nextQty = s.stock_quantity + Number(item.quantity || 1);
              await supabase
                .from("sarees")
                .update({
                  stock_quantity: nextQty,
                  stock_status: "In Stock",
                })
                .eq("id", item.saree_id);
            }
          }
        } catch (stockErr) {
          console.warn("Non-fatal stock restoration warning:", stockErr);
        }
      }
    }

    const mappedOrder = updatedRow ? mapDbOrderToOrder(updatedRow as DbOrderRow) : undefined;
    return { success: true, order: mappedOrder };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to cancel order.";
    return { success: false, error: msg };
  }
}

/**
 * Customer: Request an order cancellation (real-world workflow).
 * Does not immediately cancel the order, but submits a pending cancellation request for admin review.
 */
export async function requestCustomerOrderCancellationInDb(params: {
  orderId: string;
  userId: string;
  reason: string;
  customSupabaseClient?: SupabaseClient;
}): Promise<{ success: boolean; error?: string; order?: Order }> {
  const supabase = getClient(params.customSupabaseClient);
  if (!supabase) return { success: false, error: "Database connection unavailable." };

  try {
    const { data: orderData, error: fetchErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", params.orderId)
      .maybeSingle();

    if (fetchErr || !orderData) {
      return { success: false, error: "Order not found." };
    }

    if (orderData.user_id && orderData.user_id !== params.userId) {
      return { success: false, error: "Unauthorized. You can only request cancellation for your own orders." };
    }

    const currentStatus = orderData.order_status as OrderStatus;
    if (currentStatus === "delivered" || currentStatus === "cancelled") {
      return {
        success: false,
        error: `Cannot request cancellation for an order that is already ${currentStatus}.`,
      };
    }

    if (orderData.cancellation_request_status === "pending") {
      return {
        success: false,
        error: "A cancellation request is already pending review for this order.",
      };
    }

    const now = new Date().toISOString();
    const cleanReason = params.reason.trim();

    const { data: updatedRow, error: updateErr } = await supabase
      .from("orders")
      .update({
        cancellation_request_status: "pending",
        cancellation_request_reason: cleanReason,
        cancellation_requested_at: now,
        updated_at: now,
      })
      .eq("id", params.orderId)
      .select("*, order_items(*)")
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Status history record
    try {
      await supabase.from("order_status_history").insert([
        {
          order_id: params.orderId,
          old_status: currentStatus,
          new_status: currentStatus,
          changed_by: "customer",
          note: `Customer submitted cancellation request: ${cleanReason}`,
          changed_at: now,
        },
      ]);
    } catch (histErr) {
      console.warn("Non-fatal cancellation request history error:", histErr);
    }

    // Customer confirmation notification
    if (orderData.user_id) {
      await createCustomerNotification({
        userId: orderData.user_id,
        orderId: params.orderId,
        title: "Cancellation Request Received",
        message: `Your cancellation request for order ${orderData.order_number} has been received and is waiting for SaiSrujana confirmation.`,
        type: "cancellation_requested",
        customSupabaseClient: supabase,
      });
    }

    const mappedOrder = updatedRow ? mapDbOrderToOrder(updatedRow as DbOrderRow) : undefined;
    return { success: true, order: mappedOrder };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit cancellation request.";
    return { success: false, error: msg };
  }
}

/**
 * Admin: Approve a customer cancellation request.
 * Transitions order status to cancelled, restores stock, adds history, and notifies customer.
 */
export async function approveCustomerCancellationInDb(params: {
  orderId: string;
  adminEmail?: string | null;
  customSupabaseClient?: SupabaseClient;
}): Promise<{ success: boolean; error?: string; order?: Order }> {
  const supabase = getClient(params.customSupabaseClient);
  if (!supabase) return { success: false, error: "Database connection unavailable." };

  try {
    const { data: orderData, error: fetchErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", params.orderId)
      .maybeSingle();

    if (fetchErr || !orderData) {
      return { success: false, error: "Order not found." };
    }

    const currentStatus = orderData.order_status as OrderStatus;
    if (currentStatus === "delivered") {
      return { success: false, error: "Delivered orders cannot be cancelled." };
    }
    if (currentStatus === "cancelled") {
      return { success: false, error: "This order is already cancelled." };
    }

    const now = new Date().toISOString();
    const adminIdentifier = params.adminEmail || "admin";
    const finalReason = orderData.cancellation_request_reason || "Customer cancellation request approved";

    // Update order to cancelled with approved request status
    let updatedRow: (DbOrderRow & { order_items?: unknown[] }) | null = null;
    let updateErr: PostgrestError | null = null;

    const res1 = await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
        cancellation_reason: finalReason,
        cancelled_at: now,
        cancelled_by: adminIdentifier,
        cancellation_request_status: "approved",
        cancellation_reviewed_at: now,
        cancellation_reviewed_by: adminIdentifier,
        updated_at: now,
      })
      .eq("id", params.orderId)
      .select("*, order_items(*)")
      .maybeSingle();

    if (res1.error) {
      const res2 = await supabase
        .from("orders")
        .update({
          order_status: "cancelled",
          cancellation_reason: finalReason,
          cancelled_at: now,
          updated_at: now,
        })
        .eq("id", params.orderId)
        .select("*, order_items(*)")
        .maybeSingle();
      updatedRow = res2.data;
      updateErr = res2.error;
    } else {
      updatedRow = res1.data;
      updateErr = res1.error;
    }

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Record order status history
    try {
      await supabase.from("order_status_history").insert([
        {
          order_id: params.orderId,
          old_status: currentStatus,
          new_status: "cancelled",
          changed_by: "admin",
          note: `Cancellation request approved by admin (${adminIdentifier}): ${finalReason}`,
          changed_at: now,
        },
      ]);
    } catch (histErr) {
      console.warn("Non-fatal history logging error:", histErr);
    }

    // Customer notification
    if (orderData.user_id) {
      await createCustomerNotification({
        userId: orderData.user_id,
        orderId: params.orderId,
        title: "Order Cancelled",
        message: `Your cancellation request for order ${orderData.order_number} has been approved. The order is now cancelled.`,
        type: "order_cancelled",
        customSupabaseClient: supabase,
      });
    }

    // Restore stock
    if (Array.isArray(orderData.order_items)) {
      for (const item of orderData.order_items) {
        try {
          if (item.variant_id) {
            const { data: v } = await supabase
              .from("saree_variants")
              .select("stock_quantity")
              .eq("id", item.variant_id)
              .single();
            if (v && typeof v.stock_quantity === "number") {
              const nextQty = v.stock_quantity + Number(item.quantity || 1);
              await supabase
                .from("saree_variants")
                .update({ stock_quantity: nextQty, is_available: true })
                .eq("id", item.variant_id);
            }
          } else if (item.saree_id) {
            const { data: s } = await supabase
              .from("sarees")
              .select("stock_quantity")
              .eq("id", item.saree_id)
              .single();
            if (s && typeof s.stock_quantity === "number") {
              const nextQty = s.stock_quantity + Number(item.quantity || 1);
              await supabase
                .from("sarees")
                .update({ stock_quantity: nextQty, stock_status: "In Stock" })
                .eq("id", item.saree_id);
            }
          }
        } catch (stkErr) {
          console.warn("Non-fatal stock restoration warning:", stkErr);
        }
      }
    }

    const mappedOrder = updatedRow ? mapDbOrderToOrder(updatedRow as DbOrderRow) : undefined;
    return { success: true, order: mappedOrder };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to approve cancellation.";
    return { success: false, error: msg };
  }
}

/**
 * Admin: Reject a customer cancellation request.
 * Keeps the order's active status unchanged, marks request as rejected, and creates notification.
 */
export async function rejectCustomerCancellationInDb(params: {
  orderId: string;
  rejectReason: string;
  adminEmail?: string | null;
  customSupabaseClient?: SupabaseClient;
}): Promise<{ success: boolean; error?: string; order?: Order }> {
  const supabase = getClient(params.customSupabaseClient);
  if (!supabase) return { success: false, error: "Database connection unavailable." };

  try {
    const { data: orderData, error: fetchErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", params.orderId)
      .maybeSingle();

    if (fetchErr || !orderData) {
      return { success: false, error: "Order not found." };
    }

    const now = new Date().toISOString();
    const adminIdentifier = params.adminEmail || "admin";
    const cleanReason = params.rejectReason.trim();

    const { data: updatedRow, error: updateErr } = await supabase
      .from("orders")
      .update({
        cancellation_request_status: "rejected",
        cancellation_reject_reason: cleanReason,
        cancellation_reviewed_at: now,
        cancellation_reviewed_by: adminIdentifier,
        updated_at: now,
      })
      .eq("id", params.orderId)
      .select("*, order_items(*)")
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Status history note
    try {
      await supabase.from("order_status_history").insert([
        {
          order_id: params.orderId,
          old_status: orderData.order_status,
          new_status: orderData.order_status,
          changed_by: "admin",
          note: `Cancellation request rejected by admin (${adminIdentifier}): ${cleanReason}`,
          changed_at: now,
        },
      ]);
    } catch (histErr) {
      console.warn("Non-fatal history logging error:", histErr);
    }

    // Customer notification
    if (orderData.user_id) {
      await createCustomerNotification({
        userId: orderData.user_id,
        orderId: params.orderId,
        title: "Cancellation Request Rejected",
        message: `Your cancellation request for order ${orderData.order_number} was reviewed and could not be approved. Reason: ${cleanReason}`,
        type: "cancellation_rejected",
        customSupabaseClient: supabase,
      });
    }

    const mappedOrder = updatedRow ? mapDbOrderToOrder(updatedRow as DbOrderRow) : undefined;
    return { success: true, order: mappedOrder };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to reject cancellation request.";
    return { success: false, error: msg };
  }
}

/**
 * Admin: Cancel an order with mandatory reason, stock restoration, status history, and customer notification.
 */
export async function cancelAdminOrderInDb(params: {
  orderId: string;
  reason: string;
  adminEmail?: string | null;
  customSupabaseClient?: SupabaseClient;
}): Promise<{ success: boolean; error?: string; order?: Order }> {
  const supabase = getClient(params.customSupabaseClient);
  if (!supabase) return { success: false, error: "Database connection unavailable." };

  try {
    // 1. Fetch current order to check cancellability
    const { data: orderData, error: fetchErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", params.orderId)
      .maybeSingle();

    if (fetchErr || !orderData) {
      return { success: false, error: "Order not found." };
    }

    const currentStatus = orderData.order_status as OrderStatus;
    if (currentStatus === "delivered") {
      return { success: false, error: "Delivered orders cannot be cancelled." };
    }
    if (currentStatus === "cancelled") {
      return { success: false, error: "This order is already cancelled." };
    }

    const now = new Date().toISOString();
    const cleanReason = params.reason.trim();
    const adminIdentifier = params.adminEmail || "admin";

    // 2. Update order to cancelled
    let updatedRow: (DbOrderRow & { order_items?: unknown[] }) | null = null;
    let updateErr: PostgrestError | null = null;

    const res1 = await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
        cancellation_reason: cleanReason,
        cancelled_at: now,
        cancelled_by: adminIdentifier,
        updated_at: now,
      })
      .eq("id", params.orderId)
      .select("*, order_items(*)")
      .maybeSingle();

    if (res1.error && res1.error.message.includes("cancelled_by")) {
      const res2 = await supabase
        .from("orders")
        .update({
          order_status: "cancelled",
          cancellation_reason: cleanReason,
          cancelled_at: now,
          updated_at: now,
        })
        .eq("id", params.orderId)
        .select("*, order_items(*)")
        .maybeSingle();
      updatedRow = res2.data;
      updateErr = res2.error;
    } else {
      updatedRow = res1.data;
      updateErr = res1.error;
    }

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 3. Record order status history
    try {
      await supabase.from("order_status_history").insert([
        {
          order_id: params.orderId,
          old_status: currentStatus,
          new_status: "cancelled",
          changed_by: "admin",
          note: `Cancelled by admin (${adminIdentifier}): ${cleanReason}`,
          changed_at: now,
        },
      ]);
    } catch (histErr) {
      console.warn("Non-fatal cancellation history error:", histErr);
    }

    // 4. Create customer notification
    if (orderData.user_id) {
      await createCustomerNotification({
        userId: orderData.user_id,
        orderId: params.orderId,
        title: "Order Cancelled",
        message: `Your order ${orderData.order_number} has been cancelled by SaiSrujana. Reason: ${cleanReason}.`,
        type: "order_cancelled",
        customSupabaseClient: supabase,
      });
    }

    // 5. Restore product stock
    if (Array.isArray(orderData.order_items)) {
      for (const item of orderData.order_items) {
        try {
          if (item.variant_id) {
            const { data: v } = await supabase
              .from("saree_variants")
              .select("stock_quantity")
              .eq("id", item.variant_id)
              .single();
            if (v && typeof v.stock_quantity === "number") {
              const nextQty = v.stock_quantity + Number(item.quantity || 1);
              await supabase
                .from("saree_variants")
                .update({ stock_quantity: nextQty, is_available: true })
                .eq("id", item.variant_id);
            }
          } else if (item.saree_id) {
            const { data: s } = await supabase
              .from("sarees")
              .select("stock_quantity")
              .eq("id", item.saree_id)
              .single();
            if (s && typeof s.stock_quantity === "number") {
              const nextQty = s.stock_quantity + Number(item.quantity || 1);
              await supabase
                .from("sarees")
                .update({
                  stock_quantity: nextQty,
                  stock_status: "In Stock",
                })
                .eq("id", item.saree_id);
            }
          }
        } catch (stockErr) {
          console.warn("Non-fatal stock restoration warning:", stockErr);
        }
      }
    }

    const mappedOrder = updatedRow ? mapDbOrderToOrder(updatedRow as DbOrderRow) : undefined;
    return { success: true, order: mappedOrder };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to cancel order.";
    return { success: false, error: msg };
  }
}

/**
 * CUSTOMER CANCELS: Generates WhatsApp URL to notify OWNER with the required details.
 */
export function getCustomerCancellationWhatsAppUrl(order: Order, reason: string): string {
  const text =
    `*SAISRUJANA — ORDER CANCELLED*\n\n` +
    `*Order Number:* ${order.orderNumber}\n\n` +
    `*Customer:* ${order.customerName}\n` +
    `*Phone:* ${order.customerPhone}\n\n` +
    `*Status:* CANCELLED\n\n` +
    `*Reason:* ${reason}\n\n` +
    `*Order Total:* ${formatCurrency(order.totalAmount)}\n\n` +
    `Customer cancelled this order.`;
  return getWhatsAppUrl(text);
}

/**
 * OWNER CANCELS: Generates WhatsApp URL to notify CUSTOMER with the required details.
 */
export function getAdminOrderCancellationWhatsAppUrl(order: Order, reason: string): string {
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
  const targetPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const text =
    `*SAISRUJANA — ORDER UPDATE*\n\n` +
    `*Order Number:* ${order.orderNumber}\n\n` +
    `Hello ${order.customerName},\n\n` +
    `Your order has been CANCELLED by SaiSrujana.\n\n` +
    `*Reason:* ${reason}\n\n` +
    `*Order Total:* ${formatCurrency(order.totalAmount)}\n\n` +
    `For assistance, please contact SaiSrujana.`;
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["placed", "confirmed", "cancelled"],
  confirmed: ["confirmed", "preparing", "cancelled"],
  preparing: ["preparing", "out_for_delivery", "cancelled"],
  out_for_delivery: ["out_for_delivery", "delivered", "cancelled"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

/**
 * Admin: Update order status, payment status, delivery date, or delivery note.
 * Automatically records status history and generates customer notifications.
 */
export async function updateAdminOrderInDb(
  orderId: string,
  updates: {
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    expectedDeliveryDate?: string | null;
    adminDeliveryNote?: string | null;
    cancellationReason?: string | null;
  },
  supabaseClient: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch current order before update for history & notification
    const { data: existingOrder } = await supabaseClient
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle();

    const oldStatus = (existingOrder?.order_status as OrderStatus) || null;

    // Validate valid workflow transitions
    if (oldStatus === "delivered" && updates.orderStatus && updates.orderStatus !== "delivered") {
      return { success: false, error: "Delivered orders cannot be modified or cancelled." };
    }
    if (oldStatus === "cancelled" && updates.orderStatus && updates.orderStatus !== "cancelled") {
      return { success: false, error: "Cancelled orders cannot be reopened." };
    }
    if (oldStatus && updates.orderStatus && updates.orderStatus !== oldStatus) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[oldStatus] || [];
      if (!allowed.includes(updates.orderStatus)) {
        return {
          success: false,
          error: `Invalid status transition from "${oldStatus}" to "${updates.orderStatus}". Follow progression: Placed → Confirmed → Preparing → Out for Delivery → Delivered.`,
        };
      }
    }

    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      updated_at: now,
    };

    if (updates.orderStatus !== undefined) payload.order_status = updates.orderStatus;
    if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;
    if (updates.expectedDeliveryDate !== undefined) payload.expected_delivery_date = updates.expectedDeliveryDate;
    if (updates.adminDeliveryNote !== undefined) payload.admin_delivery_note = updates.adminDeliveryNote;

    if (updates.orderStatus === "cancelled") {
      payload.cancellation_reason = updates.cancellationReason || updates.adminDeliveryNote || "Cancelled by admin";
      payload.cancelled_at = now;
      payload.cancelled_by = "admin";
    }

    let { error } = await supabaseClient
      .from("orders")
      .update(payload)
      .eq("id", orderId);

    if (error && error.message.includes("cancelled_by")) {
      delete payload.cancelled_by;
      const retry = await supabaseClient
        .from("orders")
        .update(payload)
        .eq("id", orderId);
      error = retry.error;
    }

    if (error) return { success: false, error: error.message };

    // 2. If status changed, record status history and send notification
    if (updates.orderStatus !== undefined && updates.orderStatus !== oldStatus) {
      const newStatus = updates.orderStatus;
      const orderNum = existingOrder?.order_number || "Order";

      // Status history record
      try {
        await supabaseClient.from("order_status_history").insert([
          {
            order_id: orderId,
            old_status: oldStatus,
            new_status: newStatus,
            changed_by: "admin",
            note: updates.adminDeliveryNote || (newStatus === "cancelled" ? updates.cancellationReason : null),
            changed_at: now,
          },
        ]);
      } catch (hErr) {
        console.warn("Non-fatal history logging error:", hErr);
      }

      // Customer notification
      if (existingOrder?.user_id) {
        let title = "Order Update";
        let message = `Your SaiSrujana order ${orderNum} status has been updated to ${newStatus}.`;

        if (newStatus === "confirmed") {
          title = "Order Confirmed";
          message = `Your SaiSrujana order ${orderNum} has been confirmed.`;
        } else if (newStatus === "preparing") {
          title = "Order Preparing";
          message = `Your SaiSrujana order ${orderNum} is being prepared.`;
        } else if (newStatus === "out_for_delivery") {
          title = "Out for Delivery";
          message = `Your SaiSrujana order ${orderNum} is on the way.`;
        } else if (newStatus === "delivered") {
          title = "Order Delivered";
          message = `Your SaiSrujana order ${orderNum} has been delivered.`;
        } else if (newStatus === "cancelled") {
          title = "Order Cancelled";
          const r = updates.cancellationReason || updates.adminDeliveryNote || "Cancelled by boutique administrator";
          message = `Your SaiSrujana order ${orderNum} was cancelled. Reason: ${r}`;
        }

        await createCustomerNotification({
          userId: existingOrder.user_id,
          orderId,
          title,
          message,
          type: `order_${newStatus}`,
          customSupabaseClient: supabaseClient,
        });
      }

      // If cancelled by admin, restore stock
      if (newStatus === "cancelled" && existingOrder && Array.isArray(existingOrder.order_items)) {
        for (const item of existingOrder.order_items) {
          try {
            if (item.variant_id) {
              const { data: v } = await supabaseClient
                .from("saree_variants")
                .select("stock_quantity")
                .eq("id", item.variant_id)
                .single();
              if (v && typeof v.stock_quantity === "number") {
                const nextQty = v.stock_quantity + Number(item.quantity || 1);
                await supabaseClient
                  .from("saree_variants")
                  .update({ stock_quantity: nextQty, is_available: true })
                  .eq("id", item.variant_id);
              }
            } else if (item.saree_id) {
              const { data: s } = await supabaseClient
                .from("sarees")
                .select("stock_quantity")
                .eq("id", item.saree_id)
                .single();
              if (s && typeof s.stock_quantity === "number") {
                const nextQty = s.stock_quantity + Number(item.quantity || 1);
                await supabaseClient
                  .from("sarees")
                  .update({ stock_quantity: nextQty, stock_status: "In Stock" })
                  .eq("id", item.saree_id);
              }
            }
          } catch (stkErr) {
            console.warn("Non-fatal stock restoration warning:", stkErr);
          }
        }
      }
    }

    // 3. Payment status change notification
    const oldPaymentStatus = (existingOrder?.payment_status as PaymentStatus) || null;
    if (updates.paymentStatus !== undefined && updates.paymentStatus !== oldPaymentStatus && existingOrder?.user_id) {
      const orderNum = existingOrder.order_number || "Order";
      let pTitle = "Payment Status Updated";
      let pMessage = `Payment status for order ${orderNum} has been updated to ${updates.paymentStatus}.`;

      if (updates.paymentStatus === "paid") {
        pTitle = "Payment Received";
        pMessage = `Payment for your SaiSrujana order ${orderNum} has been confirmed and marked as Paid.`;
      } else if (updates.paymentStatus === "failed") {
        pTitle = "Payment Failed";
        pMessage = `Payment for your order ${orderNum} was marked as Failed. Please contact boutique support.`;
      } else if (updates.paymentStatus === "refunded") {
        pTitle = "Payment Refunded";
        pMessage = `Payment for your order ${orderNum} has been marked as Refunded.`;
      } else if (updates.paymentStatus === "pending") {
        pTitle = "Payment Pending";
        pMessage = `Payment status for your order ${orderNum} is currently Pending.`;
      }

      await createCustomerNotification({
        userId: existingOrder.user_id,
        orderId,
        title: pTitle,
        message: pMessage,
        type: `payment_${updates.paymentStatus}`,
        customSupabaseClient: supabaseClient,
      });
    }

    // 4. Delivery date change notification
    const oldDeliveryDate = existingOrder?.expected_delivery_date || null;
    const newDeliveryDate = updates.expectedDeliveryDate || null;
    if (updates.expectedDeliveryDate !== undefined && newDeliveryDate !== oldDeliveryDate && existingOrder?.user_id) {
      const orderNum = existingOrder.order_number || "Order";
      await createCustomerNotification({
        userId: existingOrder.user_id,
        orderId,
        title: "Delivery Date Updated",
        message: newDeliveryDate
          ? `Expected delivery date for order ${orderNum} has been set to ${newDeliveryDate}.`
          : `Expected delivery date for order ${orderNum} has been updated.`,
        type: "delivery_date_updated",
        customSupabaseClient: supabaseClient,
      });
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update order.";
    return { success: false, error: msg };
  }
}

/**
 * Formats a clean, structured WhatsApp message containing complete real order details.
 */
export function generateWhatsAppOrderMessage(order: Order): string {
  const itemsText = order.items
    .map((item, idx) => {
      const lines = [
        `${idx + 1}. ${item.sareeNameSnapshot}`,
        `   SKU: ${item.skuSnapshot}`,
        item.selectedColour ? `   Colour: ${item.selectedColour}` : null,
        `   Quantity: ${item.quantity}`,
        `   Unit Price: ${formatCurrency(item.unitPrice)}`,
        `   Total: ${formatCurrency(item.totalPrice)}`,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");

  const addressLines = [
    `${order.houseNo}, ${order.street}`.trim(),
    order.landmark ? `Landmark: ${order.landmark}` : null,
    `${order.city}, ${order.district}, ${order.state} - ${order.pincode}`.trim(),
  ].filter(Boolean);
  const addressText = addressLines.join("\n");

  const mapsUrl =
    order.latitude !== null &&
    order.latitude !== undefined &&
    order.longitude !== null &&
    order.longitude !== undefined
      ? getGoogleMapsPinUrl(order.latitude, order.longitude)
      : undefined;

  const paymentMethodLabel =
    order.paymentMethod === "upi_phonepe" ? "PhonePe / UPI" : "Cash on Delivery (COD)";

  const paymentStatusLabels: Record<PaymentStatus, string> = {
    paid: "Paid (Verified)",
    pending: "Pending / Awaiting Payment",
    failed: "Failed",
    refunded: "Refunded",
  };
  const paymentStatusLabel =
    paymentStatusLabels[order.paymentStatus] || order.paymentStatus.toUpperCase();

  const statusDescriptions: Record<OrderStatus, string> = {
    placed: "Order placed / pending verification",
    confirmed: "Order confirmed",
    preparing: "Order is being prepared",
    out_for_delivery: "Order is out for delivery",
    delivered: "Order delivered",
    cancelled: "Order cancelled",
  };
  const statusDescription =
    statusDescriptions[order.orderStatus] || order.orderStatus.toUpperCase();

  const msg =
    `*SAISRUJANA BOUTIQUE — ORDER DETAILS*\n\n` +
    `*Order Number:* ${order.orderNumber}\n\n` +
    `*Customer Details:*\n` +
    `Name: ${order.customerName}\n` +
    `Phone: ${order.customerPhone}\n` +
    (order.customerEmail ? `Email: ${order.customerEmail}\n` : "") +
    `\n*Order Items:*\n\n` +
    `${itemsText}\n\n` +
    `---------------------------\n` +
    `*Subtotal:* ${formatCurrency(order.subtotal)}\n` +
    `*Delivery Charge:* ${formatCurrency(order.deliveryCharge)}\n` +
    (order.couponCode && order.couponDiscount > 0
      ? `*Coupon Discount (${order.couponCode}):* -${formatCurrency(order.couponDiscount)}\n`
      : "") +
    `*GRAND TOTAL:* ${formatCurrency(order.totalAmount)}\n` +
    `---------------------------\n\n` +
    `*Payment Method:* ${paymentMethodLabel}\n` +
    `*Payment Status:* ${paymentStatusLabel}\n` +
    `*Order Status:* ${statusDescription}\n` +
    (order.orderStatus === "cancelled" && order.cancellationReason
      ? `*Cancellation Reason:* ${order.cancellationReason}\n`
      : "") +
    `\n*Delivery Address:*\n${addressText}\n\n` +
    (mapsUrl ? `*Google Maps Location:*\n${mapsUrl}\n\n` : "") +
    (order.expectedDeliveryDate && order.expectedDeliveryDate.trim()
      ? `*Expected Delivery:* ${order.expectedDeliveryDate}\n\n`
      : "") +
    `Thank you for choosing ${SHOP_CONFIG.brandName}, Armoor!`;

  return msg;
}

/**
 * Returns WhatsApp click-to-chat URL for an order sending summary to the boutique.
 */
export function getOrderWhatsAppUrl(order: Order): string {
  const msg = generateWhatsAppOrderMessage(order);
  return getWhatsAppUrl(msg);
}

/**
 * Returns WhatsApp URL for the Admin to contact the customer directly with the complete order details.
 */
export function getAdminOrderWhatsAppUrl(order: Order): string {
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
  const targetPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const msg = generateWhatsAppOrderMessage(order);
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
}

/**
 * Returns WhatsApp URL for customer support inquiry regarding a specific order.
 */
export function getCustomerOrderWhatsAppUrl(order: { orderNumber: string }): string {
  const msg = `Hello SaiSrujana, I need help regarding my order ${order.orderNumber}.`;
  return getWhatsAppUrl(msg);
}
