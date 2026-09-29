"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Package,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  MessageCircle,
  ExternalLink,
  Printer,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Ban,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Order, OrderStatus, OrderStatusHistory } from "@/types/order";
import { formatCurrency } from "@/config/shop";
import { getGoogleMapsPinUrl } from "@/lib/delivery";
import { getCustomerOrderWhatsAppUrl, fetchOrderStatusHistory } from "@/lib/supabase/orders";
import CancelOrderModal from "@/components/CancelOrderModal";

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  userId?: string | null;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

interface StageStep {
  key: string;
  label: string;
  description: string;
}

const STAGES: StageStep[] = [
  { key: "placed", label: "Placed", description: "Order received at Armoor boutique" },
  { key: "confirmed", label: "Confirmed", description: "Verified by boutique" },
  { key: "preparing", label: "Preparing", description: "Handloom inspection & luxury packing" },
  { key: "out_for_delivery", label: "Out for Delivery", description: "Dispatched & on the way" },
  { key: "delivered", label: "Delivered", description: "Handed over to customer" },
];

function getStageIndex(status: OrderStatus): number {
  switch (status) {
    case "placed":
      return 0;
    case "confirmed":
      return 1;
    case "preparing":
      return 2;
    case "out_for_delivery":
      return 3;
    case "delivered":
      return 4;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function OrderDetailsModal({
  order: initialOrder,
  isOpen,
  userId,
  onClose,
  onOrderUpdated,
}: OrderDetailsModalProps) {
  const [updatedOrderOverride, setUpdatedOrderOverride] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Derive current order from override or initialOrder
  const order =
    updatedOrderOverride && updatedOrderOverride.id === initialOrder?.id
      ? updatedOrderOverride
      : initialOrder;

  // Load Order Status Transition History
  const loadHistory = useCallback(async (orderId: string) => {
    setIsLoadingHistory(true);
    try {
      const data = await fetchOrderStatusHistory(orderId);
      setHistory(data);
    } catch (err) {
      console.error("Error loading order status history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    if (isOpen && initialOrder?.id) {
      Promise.resolve().then(() => {
        if (isSubscribed) setIsLoadingHistory(true);
      });
      fetchOrderStatusHistory(initialOrder.id)
        .then((data) => {
          if (isSubscribed) {
            setHistory(data);
          }
        })
        .catch((err) => {
          console.error("Error loading order status history:", err);
        })
        .finally(() => {
          if (isSubscribed) {
            setIsLoadingHistory(false);
          }
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, initialOrder?.id, initialOrder?.orderStatus]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isCancelModalOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCancelModalOpen, onClose]);

  if (!isOpen || !order) return null;

  const isCancelled = order.orderStatus === "cancelled";
  const isDelivered = order.orderStatus === "delivered";
  const isCancellable = !isCancelled && !isDelivered && Boolean(userId);
  const currentStageIdx = getStageIndex(order.orderStatus);
  const whatsappUrl = getCustomerOrderWhatsAppUrl(order);
  const hasGps = order.latitude !== null && order.latitude !== undefined && order.longitude !== null && order.longitude !== undefined;
  const mapsUrl = hasGps ? getGoogleMapsPinUrl(order.latitude!, order.longitude!) : null;

  const handleOrderCancelled = (cancelledOrder: Order) => {
    setUpdatedOrderOverride(cancelledOrder);
    if (cancelledOrder.id) {
      loadHistory(cancelledOrder.id);
    }
    if (onOrderUpdated) {
      onOrderUpdated(cancelledOrder);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        {/* Modal Container */}
        <div
          className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#FDFBF7] rounded-3xl border border-[#C5A059]/50 shadow-2xl overflow-hidden text-[#1E1715]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#E8E0D2] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0DC] border border-[#C5A059]/40 flex items-center justify-center text-[#6E121E] shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif-luxury font-bold text-base sm:text-lg text-[#1E1715] truncate">
                    Order #{order.orderNumber}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isDelivered
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : isCancelled
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40"
                    }`}
                  >
                    {order.orderStatus.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-[#8C7A6B] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-[#C5A059]" />
                  <span>Placed on {formatDate(order.createdAt)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                title="Print Order Receipt"
                className="p-2 rounded-xl text-[#8C7A6B] hover:text-[#1E1715] hover:bg-[#FAF6EE] border border-transparent hover:border-[#E8E0D2] transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#8C7A6B] hover:text-[#6E121E] hover:bg-[#FAF6EE] border border-transparent hover:border-[#E8E0D2] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Status Timeline / Cancelled Notice */}
            {!isCancelled ? (
              <div className="bg-white p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C7A6B] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Live Fulfillment Stages</span>
                  </span>
                  <span className="text-xs font-semibold text-[#1E3F34]">
                    {order.orderStatus === "delivered"
                      ? "Order Delivered"
                      : order.orderStatus === "out_for_delivery"
                      ? "Out for Delivery"
                      : order.orderStatus === "preparing"
                      ? "Preparing Drape & Packing"
                      : order.orderStatus === "confirmed"
                      ? "Order Confirmed"
                      : "Order Placed"}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="relative pt-2 pb-1">
                  {/* Horizontal Track for desktop */}
                  <div className="hidden sm:block absolute top-6 left-6 right-6 h-0.5 bg-stone-200 -z-0" />
                  <div
                    className="hidden sm:block absolute top-6 left-6 h-0.5 bg-[#1E3F34] transition-all duration-500 -z-0"
                    style={{
                      width: `${Math.max(0, Math.min(100, (currentStageIdx / (STAGES.length - 1)) * 100))}%`,
                    }}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-1">
                    {STAGES.map((stage, sIdx) => {
                      const isPassed = sIdx <= currentStageIdx;
                      const isCurrent = sIdx === currentStageIdx;

                      return (
                        <div
                          key={stage.key}
                          className="flex flex-col items-center text-center relative z-10"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                              isCurrent
                                ? "bg-[#6E121E] text-white ring-4 ring-[#C5A059]/40 scale-110"
                                : isPassed
                                ? "bg-[#1E3F34] text-white"
                                : "bg-stone-200 text-stone-500"
                            }`}
                          >
                            {isPassed ? <CheckCircle2 className="w-4 h-4" /> : sIdx + 1}
                          </div>
                          <span
                            className={`text-xs font-bold mt-1.5 ${
                              isCurrent
                                ? "text-[#6E121E]"
                                : isPassed
                                ? "text-[#1E3F34]"
                                : "text-[#8C7A6B]"
                            }`}
                          >
                            {stage.label}
                          </span>
                          <span className="text-[10px] text-[#8C7A6B] leading-tight hidden sm:block mt-0.5">
                            {stage.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-base text-rose-900">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Cancelled</span>
                </div>

                <div className="pl-7 space-y-1 text-rose-800">
                  <p>
                    <strong>Cancellation Reason:</strong>{" "}
                    {order.cancellationReason || order.adminDeliveryNote || "Cancelled upon request"}
                  </p>
                  {order.cancelledAt && (
                    <p className="text-[11px] text-rose-700">
                      Cancelled on {formatDate(order.cancelledAt)}
                      {order.cancelledBy ? ` by ${order.cancelledBy}` : ""}
                    </p>
                  )}
                  <p className="text-[11px] text-rose-600 pt-1">
                    If you have questions or wish to place a fresh order, feel free to chat with Gangadhar on WhatsApp.
                  </p>
                </div>
              </div>
            )}

            {/* Cancellation Request Status Banner */}
            {!isCancelled && order.cancellationRequestStatus === "pending" && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Cancellation requested — waiting for SaiSrujana confirmation.
                  </span>
                  <span className="text-[11.5px] text-amber-800">
                    Reason submitted: &ldquo;{order.cancellationRequestReason || "Customer cancellation request"}&rdquo;
                  </span>
                </div>
              </div>
            )}

            {!isCancelled && order.cancellationRequestStatus === "rejected" && (
              <div className="p-4 bg-stone-100 border border-stone-300 rounded-2xl text-xs text-stone-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Cancellation Request Not Approved</span>
                  <span className="text-[11.5px] text-stone-700">
                    Reason from boutique: {order.cancellationRejectReason || "Order is already in active fulfillment."}
                  </span>
                </div>
              </div>
            )}

            {/* Order Status History Log */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-3">
              <span className="text-xs uppercase font-bold tracking-wider text-[#8C7A6B] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Status &amp; Fulfillment History</span>
              </span>

              {isLoadingHistory ? (
                <div className="py-3 text-center text-xs text-[#8C7A6B]">
                  Loading timeline history...
                </div>
              ) : history.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-[#C5A059]/40 space-y-3 pt-1">
                  {history.map((h, hIdx) => (
                    <div key={hIdx} className="relative text-xs">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#6E121E] border-2 border-white" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#1E1715] capitalize">
                          {h.newStatus === "preparing" ? "Packed / Preparing" : h.newStatus.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-[#8C7A6B]">
                          • {formatDate(h.changedAt)}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-stone-100 text-stone-600 uppercase font-semibold">
                          {h.changedBy}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-[#5A4E46] text-[11px] mt-0.5 bg-[#FAF7F2] p-2 rounded-lg border border-[#E8E0D2]/60">
                          {h.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#5A4E46] pl-2">
                  <span>{formatDate(order.createdAt)} — Order Placed</span>
                </div>
              )}
            </div>

            {/* Ordered Saree Items */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E0D2] pb-3">
                <span className="text-xs uppercase font-bold tracking-wider text-[#8C7A6B]">
                  Ordered Sarees ({order.items.length})
                </span>
                <span className="text-xs text-[#8C7A6B]">
                  Price &amp; Subtotal
                </span>
              </div>

              <div className="divide-y divide-[#E8E0D2]/60">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex items-center gap-4 first:pt-0 last:pb-0">
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden border border-[#E8E0D2] bg-stone-100 shrink-0 shadow-2xs">
                      <Image
                        src={item.imageUrlSnapshot || "/images/kanchipuram.jpg"}
                        alt={item.sareeNameSnapshot}
                        fill
                        className="object-cover object-top"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif-luxury font-bold text-sm text-[#1E1715] truncate">
                        {item.sareeNameSnapshot}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#8C7A6B] mt-0.5">
                        <span>SKU: {item.skuSnapshot}</span>
                        {item.selectedColour && (
                          <>
                            <span>•</span>
                            <span>Colour: <strong className="text-[#5A4E46]">{item.selectedColour}</strong></span>
                          </>
                        )}
                        {item.categoryLabelSnapshot && (
                          <>
                            <span>•</span>
                            <span>{item.categoryLabelSnapshot}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#5A4E46] mt-1.5">
                        <span>{formatCurrency(item.unitPrice)} × {item.quantity}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-sm text-[#6E121E]">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery & Address Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address Snapshot */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C7A6B] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Delivery Address Snapshot</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#FAF0DC] text-[#6E121E]">
                    Doorstep Delivery
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-sm text-[#1E1715]">
                    {order.customerName}
                  </p>
                  <p className="text-[#8C7A6B]">
                    Phone: <strong className="text-[#1E1715]">{order.customerPhone}</strong>
                    {order.customerEmail ? ` • Email: ${order.customerEmail}` : ""}
                  </p>
                  <p className="text-[#5A4E46] leading-relaxed pt-1">
                    {order.houseNo}, {order.street}
                    {order.landmark ? `, Near ${order.landmark}` : ""}
                    <br />
                    {order.city}, {order.district}, {order.state} -{" "}
                    <strong className="text-[#1E1715]">{order.pincode}</strong>
                  </p>
                </div>

                {/* GPS Coordinates & Google Maps Link */}
                {hasGps && mapsUrl && (
                  <div className="pt-2 border-t border-[#E8E0D2]/70 flex items-center justify-between text-xs">
                    <span className="text-[#1E3F34] font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#6E121E]" />
                      <span>
                        GPS: {Number(order.latitude).toFixed(4)}, {Number(order.longitude).toFixed(4)}
                      </span>
                    </span>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#6E121E] hover:underline"
                    >
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Logistics & Delivery Details */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C7A6B] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Logistics &amp; Dispatch</span>
                  </span>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[#8C7A6B] block">Expected Delivery:</span>
                      <p className="font-bold text-sm text-[#1E1715]">
                        {order.expectedDeliveryDate || "Not Set"}
                      </p>
                    </div>

                    {order.deliveryDistanceKm !== null && order.deliveryDistanceKm !== undefined && (
                      <div className="text-[#5A4E46]">
                        <span className="text-[#8C7A6B]">Distance from Armoor Boutique: </span>
                        <strong className="text-[#1E1715]">{Number(order.deliveryDistanceKm).toFixed(1)} km</strong>
                      </div>
                    )}

                    {order.adminDeliveryNote && (
                      <div className="p-2.5 rounded-xl bg-[#FAF6EE] border border-[#C5A059]/30 text-[11px] text-[#5A4E46]">
                        <strong className="text-[#6E121E] block mb-0.5">Boutique Delivery Note:</strong>
                        <span>{order.adminDeliveryNote}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E8E0D2]/70 flex items-center gap-1.5 text-[11px] text-[#1E3F34]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1E3F34]" />
                  <span>Insured boutique saree shipping from Armoor, Telangana</span>
                </div>
              </div>
            </div>

            {/* Payment & Price Summary */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E0D2] pb-3">
                <span className="text-xs uppercase font-bold tracking-wider text-[#8C7A6B] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Payment &amp; Billing Breakdown</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#1E1715]">
                    {order.paymentMethod === "upi_phonepe" ? "PhonePe / UPI" : "Cash on Delivery (COD)"}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#5A4E46]">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-[#1E1715]">{formatCurrency(order.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-[#5A4E46]">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-[#1E1715]">
                    {order.deliveryCharge === 0 ? "FREE" : formatCurrency(order.deliveryCharge)}
                  </span>
                </div>

                {order.couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount ({order.couponCode || "COUPON"})</span>
                    <span>-{formatCurrency(order.couponDiscount)}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-[#E8E0D2] flex items-baseline justify-between text-base font-bold text-[#1E1715]">
                  <span>Total Amount</span>
                  <span className="text-lg text-[#6E121E]">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="sticky bottom-0 z-20 bg-[#FAF7F2] px-6 py-4 border-t border-[#E8E0D2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-bold tracking-wider uppercase transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                <span>Contact SaiSrujana on WhatsApp</span>
              </a>

              {/* Customer Request Cancellation Button */}
              {isCancellable && (
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="py-3 px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Ban className="w-4 h-4 text-rose-600" />
                  <span>Request Cancellation</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/sarees"
                onClick={onClose}
                className="flex-1 sm:flex-none py-3 px-4 rounded-xl border border-[#E8E0D2] bg-white hover:bg-[#FAF6EE] text-[#1E1715] text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Explore More</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none py-3 px-5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Order Cancellation Modal */}
      {userId && (
        <CancelOrderModal
          order={order}
          isOpen={isCancelModalOpen}
          userId={userId}
          onClose={() => setIsCancelModalOpen(false)}
          onOrderCancelled={handleOrderCancelled}
        />
      )}
    </>
  );
}
