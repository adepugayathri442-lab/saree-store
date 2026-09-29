"use client";

import { useState } from "react";
import { X, Ban, MessageCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Order } from "@/types/order";
import { cancelCustomerOrderInDb, getCustomerCancellationWhatsAppUrl } from "@/lib/supabase/orders";

interface CancelOrderModalProps {
  order: Order;
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onOrderCancelled: (updatedOrder: Order) => void;
}

export default function CancelOrderModal({
  order,
  isOpen,
  userId,
  onClose,
  onOrderCancelled,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cancelledOrder, setCancelledOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const cleanReason = reason.trim();
  const whatsappOwnerUrl = getCustomerCancellationWhatsAppUrl(order, cleanReason || "Order cancelled by customer");

  const handleConfirmCancel = async () => {
    if (!cleanReason) {
      setErrorMessage("Reason for cancellation is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await cancelCustomerOrderInDb({
        orderId: order.id,
        userId,
        reason: cleanReason,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to cancel order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const now = new Date().toISOString();
      const updated: Order = res.order || {
        ...order,
        orderStatus: "cancelled",
        cancellationReason: cleanReason,
        cancelledAt: now,
        cancelledBy: "customer",
        updatedAt: now,
      };

      setCancelledOrder(updated);
      setIsSuccess(true);
      onOrderCancelled(updated);
    } catch {
      setErrorMessage("An unexpected error occurred while cancelling your order.");
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (cancelledOrder) {
      onOrderCancelled(cancelledOrder);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 sm:p-7 space-y-5 text-[#1E1715]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury font-bold text-lg text-[#1E1715]">
                Cancel Order
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Order #{order.orderNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#1E1715] hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                Order Cancelled
              </h4>
              <p className="text-xs text-[#5A4E46] leading-relaxed">
                Your order #{order.orderNumber} has been successfully cancelled and product inventory has been restored.
              </p>
            </div>

            {/* WhatsApp Action to Notify Boutique Owner */}
            <div className="p-3 bg-[#FAF7F2] border border-[#E8E0D2] rounded-2xl space-y-2">
              <p className="text-xs text-[#8C7A6B]">
                You can notify the SaiSrujana boutique owner directly:
              </p>
              <a
                href={whatsappOwnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-bold uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                <span>Notify Owner on WhatsApp</span>
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2.5 rounded-xl border border-[#E8E0D2] bg-white hover:bg-[#FAF6EE] text-[#1E1715] text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Error message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMessage}
              </div>
            )}

            {/* Reason for Cancellation Input */}
            <div className="space-y-2">
              <label
                htmlFor="cancellationReasonText"
                className="block text-xs font-bold uppercase tracking-wider text-[#1E1715]"
              >
                Reason for cancellation <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="cancellationReasonText"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you need to cancel this order..."
                className="w-full p-3 rounded-xl border border-[#E8E0D2] text-xs text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#6E121E] resize-none"
                required
              />
              <p className="text-[11px] text-[#8C7A6B]">
                A cancellation reason is required to process your request.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#E8E0D2] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-[#E8E0D2] bg-white hover:bg-[#FAF6EE] text-[#5A4E46] text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmitting || !cleanReason}
                className="px-5 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Cancel Order</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
