"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  MessageCircle,
  ShoppingBag,
  MapPin,
  Truck,
  Package,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Order } from "@/types/order";
import { fetchOrderByIdOrNumber, getOrderWhatsAppUrl } from "@/lib/supabase/orders";
import { formatCurrency } from "@/config/shop";
import { getGoogleMapsPinUrl } from "@/lib/delivery";

export default function OrderConfirmationView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(orderId));

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let mounted = true;
    fetchOrderByIdOrNumber(orderId).then((ord) => {
      if (mounted) {
        setOrder(ord);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-24 bg-[#FDFBF7]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif-luxury text-sm text-[#6E121E]">Loading Order Confirmation...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[#FAF0DC] flex items-center justify-center mx-auto mb-4 text-[#6E121E]">
          <ShoppingBag className="w-7 h-7 text-[#C5A059]" />
        </div>
        <h2 className="font-serif-luxury text-2xl font-bold text-[#1E1715] mb-2">
          Order Details
        </h2>
        <p className="text-xs text-[#8C7A6B] max-w-md mx-auto mb-6">
          Could not locate the requested order. If you recently placed an order, you can view your complete history in your account.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/account"
            className="px-5 py-2.5 rounded-xl bg-[#6E121E] text-white text-xs font-semibold uppercase tracking-wider"
          >
            My Orders
          </Link>
          <Link
            href="/sarees"
            className="px-5 py-2.5 rounded-xl border border-[#E8E0D2] bg-white text-[#2C2420] text-xs font-semibold uppercase tracking-wider"
          >
            Browse Sarees
          </Link>
        </div>
      </div>
    );
  }

  const whatsappOrderUrl = getOrderWhatsAppUrl(order);

  return (
    <div className="py-10 sm:py-16 bg-gradient-to-b from-[#FDFBF7] via-[#FAF7F2] to-[#FDFBF7]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Success Header Card */}
        <div className="bg-white rounded-3xl border border-[#C5A059]/40 p-6 sm:p-10 shadow-lg text-center space-y-4 mb-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#C5A059] via-[#6E121E] to-[#C5A059]" />

          <div className="w-16 h-16 rounded-full bg-[#E8F3EE] border-2 border-[#1E3F34]/20 flex items-center justify-center mx-auto text-[#1E3F34] shadow-xs">
            <CheckCircle2 className="w-9 h-9 text-[#1E3F34]" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-widest font-bold text-[#C5A059]">
              Thank You for Your Order!
            </span>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
              Order Placed Successfully
            </h1>
            <p className="text-xs sm:text-sm text-[#5A4E46] max-w-lg mx-auto">
              Your saree order has been registered in our boutique database. Gangadhar is preparing your weaves at SaiSrujana, Armoor.
            </p>
          </div>

          {/* Key Order Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 text-[#6E121E] font-bold">
              Order ID: {order.orderNumber}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#E8F3EE] text-[#1E3F34] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Status: {order.orderStatus.toUpperCase()}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#FAF0DC] text-[#6E121E] font-semibold">
              Payment: {order.paymentMethod === "upi_phonepe" ? "PhonePe / UPI" : "Cash on Delivery"} ({order.paymentStatus.toUpperCase()})
            </span>
          </div>

          {/* Primary WhatsApp Action */}
          <div className="pt-4 max-w-md mx-auto space-y-2">
            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase btn-premium-whatsapp flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-5 h-5 text-[#A7F3D0]" />
              <span>Send Order to Gangadhar on WhatsApp</span>
            </a>
            <p className="text-[11px] text-[#8C7A6B]">
              Share this order with SaiSrujana on WhatsApp to request live parcel packaging video and courier updates.
            </p>
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="bg-white rounded-2xl border border-[#E8E0D2] p-5 sm:p-7 shadow-xs space-y-6">
          {/* Section 1: Delivery & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-[#E8E0D2]">
            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#8C7A6B] flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#C5A059]" /> Expected Delivery Date
              </span>
              <p className="text-sm font-bold text-[#1E1715]">
                {order.expectedDeliveryDate || "2–4 Business Days"}
              </p>
              <p className="text-[11px] text-[#8C7A6B]">
                Direct courier dispatch from Armoor boutique
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#8C7A6B] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> Delivery Address
              </span>
              <p className="text-xs font-semibold text-[#1E1715]">
                {order.customerName} ({order.customerPhone})
              </p>
              <p className="text-xs text-[#5A4E46]">
                {order.houseNo}, {order.street}
                {order.landmark ? `, Near ${order.landmark}` : ""}
                <br />
                {order.city}, {order.district}, {order.state} - {order.pincode}
              </p>
              {order.latitude && order.longitude && (
                <a
                  href={getGoogleMapsPinUrl(order.latitude, order.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6E121E] hover:underline pt-1"
                >
                  <span>View Delivery Location on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Section 2: Items List */}
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#1E1715] mb-3">
              Ordered Sarees
            </h3>
            <div className="divide-y divide-[#E8E0D2]/60">
              {order.items.map((it, idx) => (
                <div key={idx} className="py-3 flex items-center gap-3">
                  <div className="relative w-14 h-18 rounded-lg overflow-hidden border border-[#E8E0D2] flex-shrink-0 bg-stone-100">
                    <Image
                      src={it.imageUrlSnapshot || "/images/kanchipuram.jpg"}
                      alt={it.sareeNameSnapshot}
                      fill
                      className="object-cover object-top"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#1E1715] truncate">
                      {it.sareeNameSnapshot}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8C7A6B] mt-0.5">
                      <span>SKU: {it.skuSnapshot}</span>
                      {it.selectedColour && (
                        <>
                          <span>•</span>
                          <span>Colour: {it.selectedColour}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-[#8C7A6B]">Qty: {it.quantity}</span>
                      <span className="font-bold text-[#6E121E]">
                        {formatCurrency(it.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Totals Breakdown */}
          <div className="pt-4 border-t border-[#E8E0D2] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#5A4E46]">
              <span>Subtotal</span>
              <span className="font-semibold text-[#1E1715]">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[#5A4E46]">
              <span>Delivery Charge</span>
              <span className="font-semibold text-[#1E1715]">
                {formatCurrency(order.deliveryCharge)}
              </span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-semibold">
                <span>Coupon Discount ({order.couponCode || "COUPON"})</span>
                <span>-{formatCurrency(order.couponDiscount)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-[#E8E0D2] flex items-baseline justify-between text-base font-bold text-[#1E1715]">
              <span>Grand Total</span>
              <span className="text-[#6E121E]">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Section 4: Secondary Navigation Buttons */}
          <div className="pt-4 border-t border-[#E8E0D2] flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/account"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition"
            >
              <Package className="w-4 h-4" />
              <span>Track in My Orders</span>
            </Link>

            <Link
              href="/sarees"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#E8E0D2] hover:bg-[#FAF6EE] text-[#1E1715] text-xs font-semibold uppercase tracking-wider transition"
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
