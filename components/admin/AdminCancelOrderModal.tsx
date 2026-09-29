"use client";

import { useState } from "react";
import { AlertTriangle, X, Ban, MessageCircle, RefreshCw } from "lucide-react";
import { Order } from "@/types/order";
import { formatCurrency } from "@/config/shop";
import { cancelAdminOrderInDb, getAdminOrderCancellationWhatsAppUrl } from "@/lib/supabase/orders";
import { createBrowserClient } from "@/lib/supabase/client";

interface AdminCancelOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  adminEmail?: string | null;
  onClose: () => void;
  onOrderCancelled: (cancelledOrder: Order) => void;
}

export default function AdminCancelOrderModal({
  order,
  isOpen,
  adminEmail,
  onClose,
  onOrderCancelled,
}: AdminCancelOrderModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const cleanReason = reason.trim();
  const whatsappNotificationUrl = getAdminOrderCancellationWhatsAppUrl(order, cleanReason || "Order cancelled by boutique");

  const handleConfirmCancel = async () => {
    if (!cleanReason) {
      setErrorMessage("Reason for cancellation is mandatory.");
      return;
    }

    if (order.orderStatus === "delivered" || order.orderStatus === "cancelled") {
      setErrorMessage(`Cannot cancel an order that is already ${order.orderStatus}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createBrowserClient();
      const res = await cancelAdminOrderInDb({
        orderId: order.id,
        reason: cleanReason,
        adminEmail: adminEmail || "admin",
        customSupabaseClient: supabase,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to cancel order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const now = new Date().toISOString();
      const updatedOrder: Order = res.order || {
        ...order,
        orderStatus: "cancelled",
        cancellationReason: cleanReason,
        cancelledAt: now,
        cancelledBy: adminEmail || "admin",
        updatedAt: now,
      };

      onOrderCancelled(updatedOrder);
      onClose();
    } catch {
      setErrorMessage("An unexpected error occurred while cancelling the order.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#FDFBF7] rounded-3xl border border-rose-300/80 shadow-2xl p-6 sm:p-7 space-y-5 text-[#1E1715] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">
                Admin Action
              </span>
              <h3 className="font-serif-luxury font-bold text-xl text-[#1E1715]">
                Cancel Order
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-[#8C7A6B] hover:text-[#1E1715] hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Snapshot */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E0D2] shadow-2xs space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#8C7A6B]">Order Number:</span>
            <span className="font-mono font-bold text-[#6E121E] text-sm">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8C7A6B]">Customer Name:</span>
            <span className="font-bold text-[#1E1715]">
              {order.customerName}{" "}
              <span className="text-[11px] font-normal text-[#8C7A6B]">({order.customerPhone})</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8C7A6B]">Order Total:</span>
            <span className="font-bold text-sm text-[#6E121E]">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8C7A6B]">Current Status:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
              {order.orderStatus.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Reason for Cancellation Input */}
        <div className="space-y-2">
          <label
            htmlFor="adminCancellationReason"
            className="block text-xs font-bold text-[#1E1715] uppercase tracking-wider"
          >
            Reason for cancellation <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="adminCancellationReason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please enter the mandatory cancellation reason (e.g. Customer requested cancellation / Item damaged in transit)..."
            className="w-full p-3 rounded-xl border border-[#C5A059] bg-white text-xs font-medium text-[#2C2420] focus:ring-2 focus:ring-[#6E121E] outline-hidden resize-none"
            required
          />
          <p className="text-[11px] text-[#8C7A6B]">
            This reason will be recorded in the order status history and delivered to the customer.
          </p>
        </div>

        {/* Info Note: Stock & Notification */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
          <strong>Note:</strong> Cancelling this order will restore product stock quantity, record an entry in status history, and post an in-app cancellation notification to the customer.
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-[#E8E0D2] space-y-2">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[#E8E0D2] text-xs font-semibold text-[#5A4E46] hover:bg-white transition cursor-pointer"
            >
              Keep Order
            </button>

            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isSubmitting || !cleanReason}
              className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Order</span>
                </>
              )}
            </button>
          </div>

          {/* WhatsApp Notification Link to Customer */}
          {cleanReason && (
            <div className="pt-1 text-center">
              <a
                href={whatsappNotificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1E3F34] hover:text-[#285345] hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Notify Customer on WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
