"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, AlertTriangle, Clock, User, Phone, ShieldCheck } from "lucide-react";
import { Order } from "@/types/order";
import { formatCurrency } from "@/config/shop";
import { approveCustomerCancellationInDb, rejectCustomerCancellationInDb } from "@/lib/supabase/orders";

interface AdminReviewCancellationModalProps {
  order: Order | null;
  isOpen: boolean;
  adminEmail?: string | null;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Just now";
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

export default function AdminReviewCancellationModal({
  order,
  isOpen,
  adminEmail,
  onClose,
  onOrderUpdated,
}: AdminReviewCancellationModalProps) {
  const [mode, setMode] = useState<"review" | "rejecting">("review");
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await approveCustomerCancellationInDb({
        orderId: order.id,
        adminEmail,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to approve cancellation.");
        setIsProcessing(false);
        return;
      }

      if (res.order) {
        onOrderUpdated(res.order);
      }
      onClose();
    } catch {
      setErrorMessage("An unexpected error occurred while approving cancellation.");
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMessage("Please provide a reason for rejecting the cancellation request.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await rejectCustomerCancellationInDb({
        orderId: order.id,
        rejectReason: rejectReason.trim(),
        adminEmail,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to reject cancellation request.");
        setIsProcessing(false);
        return;
      }

      if (res.order) {
        onOrderUpdated(res.order);
      }
      onClose();
    } catch {
      setErrorMessage("An unexpected error occurred while rejecting the request.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl border border-[#C5A059]/50 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#C5A059] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Admin Decision</span>
            </span>
            <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
              Review Cancellation Request
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-[#8C7A6B] hover:text-[#6E121E] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Order & Request Summary */}
        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#E8E0D2]/60 pb-2">
            <div>
              <span className="font-mono font-bold text-sm text-[#6E121E]">
                Order {order.orderNumber}
              </span>
              <p className="text-[11px] text-[#8C7A6B]">
                Current Status: <strong className="capitalize text-[#1E1715]">{order.orderStatus.replace(/_/g, " ")}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#8C7A6B] block">Grand Total</span>
              <span className="font-bold text-sm text-[#1E1715]">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="space-y-0.5">
              <span className="text-[#8C7A6B] block">Customer</span>
              <p className="font-bold text-[#1E1715] flex items-center gap-1 truncate">
                <User className="w-3 h-3 text-[#C5A059]" /> {order.customerName}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#8C7A6B] block">Phone</span>
              <p className="font-semibold text-[#1E1715] flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#C5A059]" /> {order.customerPhone}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E0D2]/60 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#6E121E] uppercase tracking-wider">Customer’s Cancellation Reason:</span>
              <span className="text-[#8C7A6B] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(order.cancellationRequestedAt)}
              </span>
            </div>
            <p className="p-2.5 rounded-xl bg-white border border-rose-200 text-rose-900 font-medium">
              &ldquo;{order.cancellationRequestReason || "No specific reason provided"}&rdquo;
            </p>
          </div>
        </div>

        {mode === "review" ? (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11.5px] text-amber-900">
              <p>
                <strong>Approve Cancellation:</strong> Cancels order, automatically restores stock to catalogue, logs status history, and notifies customer.
              </p>
              <p className="mt-1">
                <strong>Reject Request:</strong> Keeps order active and informs customer why it cannot be cancelled.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode("rejecting")}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer transition"
              >
                Reject Request
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-[#A7F3D0]" />
                <span>{isProcessing ? "Processing..." : "Approve Cancellation"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-[#1E1715] mb-1">
                Admin Rejection Reason (Required — Visible to Customer):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Saree has already been dispatched via courier with tracking #123456."
                className="w-full p-3 rounded-xl border border-stone-300 text-xs text-[#2C2420] focus:ring-1 focus:ring-[#6E121E] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("review");
                  setErrorMessage(null);
                }}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-[#E8E0D2] bg-white text-[#5A4E46] text-xs font-semibold cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>{isProcessing ? "Rejecting..." : "Confirm Rejection"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
