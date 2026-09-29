"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  MessageCircle,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Loader2,
  Tag,
  Check,
  ArrowRight,
} from "lucide-react";
import { useCart, getCartItemKey } from "@/context/CartContext";
import { SHOP_CONFIG, getWhatsAppUrl, formatCurrency } from "@/config/shop";
import { CustomerOrderDetails, CartItem } from "@/types/cart";
import { createEnquiryInDb } from "@/lib/supabase/enquiries";
import { useAuth } from "@/context/AuthContext";
import { validateCouponCode } from "@/lib/supabase/coupons";
import { Coupon } from "@/types/coupon";

export default function CartView() {
  const { items, updateQuantity, removeFromCart, clearCart, totalCount, isLoaded } = useCart();
  const { user, customerName, customerEmail } = useAuth();

  const [customer, setCustomer] = useState<CustomerOrderDetails>(() => ({
    name: customerName || "",
    phone: "",
    email: customerEmail || "",
    address: "",
  }));

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});

  const [orderSent, setOrderSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockWarning, setStockWarning] = useState<string | null>(null);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccessMessage, setCouponSuccessMessage] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Check if all items in cart have real numeric prices
  const allPricesNumeric =
    items.length > 0 &&
    items.every((item) => {
      const price = item.selectedPrice !== undefined ? item.selectedPrice : item.saree.price;
      return typeof price === "number" && !isNaN(Number(price));
    });

  const numericSubtotal = allPricesNumeric
    ? items.reduce((sum, item) => {
        const price = item.selectedPrice !== undefined ? Number(item.selectedPrice) : Number(item.saree.price);
        return sum + price * item.quantity;
      }, 0)
    : 0;

  // Re-calculate coupon discount if subtotal changes
  const activeDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (numericSubtotal < appliedCoupon.minCartValue) return 0;

    if (appliedCoupon.discountType === "percentage") {
      let calc = Math.round((numericSubtotal * appliedCoupon.discountValue) / 100);
      if (
        appliedCoupon.maxDiscountAmount !== null &&
        appliedCoupon.maxDiscountAmount !== undefined &&
        appliedCoupon.maxDiscountAmount > 0
      ) {
        calc = Math.min(calc, appliedCoupon.maxDiscountAmount);
      }
      return calc;
    } else {
      return Math.min(appliedCoupon.discountValue, numericSubtotal);
    }
  }, [appliedCoupon, numericSubtotal]);

  const finalTotal = Math.max(0, numericSubtotal - activeDiscountAmount);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCouponError(null);
    setCouponSuccessMessage(null);

    const cleanCode = couponCodeInput.trim();
    if (!cleanCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const res = await validateCouponCode(cleanCode, numericSubtotal);
      if (!res.isValid || !res.coupon) {
        setCouponError(res.errorMessage || "Invalid or expired coupon code.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(res.coupon);
        setCouponSuccessMessage(
          `Coupon "${res.coupon.code}" applied! You saved ₹${(res.discountAmount || 0).toLocaleString("en-IN")}.`
        );
        setCouponCodeInput("");
      }
    } catch {
      setCouponError("Failed to validate coupon code. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; phone?: string; address?: string } = {};

    if (!customer.name.trim()) {
      errors.name = "Please enter your full name";
    }

    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Please enter a valid 10-digit mobile number";
    }

    if (!customer.address.trim() || customer.address.trim().length < 5) {
      errors.address = "Please enter your full delivery address and landmark";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendWhatsAppOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const sareeLines = items
      .map((item, index) => {
        const activePrice = item.selectedPrice !== undefined ? item.selectedPrice : item.saree.price;
        const itemPrice =
          typeof activePrice === "number"
            ? `₹${(Number(activePrice) * item.quantity).toLocaleString("en-IN")}`
            : "Price on Inquiry";
        const colorLine = item.selectedColor ? `\n   • Colour: *${item.selectedColor}*` : "";
        return `${index + 1}. *${item.saree.name}*${colorLine}\n   • Category: ${item.saree.categoryLabel}\n   • SKU: ${item.saree.sku}\n   • Fabric: ${item.saree.fabric}\n   • Quantity: ${item.quantity}\n   • Price: ${itemPrice}`;
      })
      .join("\n\n");

    let totalDisplay = allPricesNumeric
      ? `₹${numericSubtotal.toLocaleString("en-IN")}`
      : "Price on Inquiry";

    let discountDetails = "";
    if (appliedCoupon && activeDiscountAmount > 0 && allPricesNumeric) {
      discountDetails =
        `\n• Subtotal: ₹${numericSubtotal.toLocaleString("en-IN")}\n` +
        `• Coupon Applied: *${appliedCoupon.code}* (-₹${activeDiscountAmount.toLocaleString("en-IN")})\n` +
        `• *Final Amount Payable:* ₹${finalTotal.toLocaleString("en-IN")}`;
      totalDisplay = `₹${finalTotal.toLocaleString("en-IN")} (after ${appliedCoupon.code} discount)`;
    }

    const message =
      `*New Saree Order & Inquiry - SaiSrujana*\n` +
      `---------------------------------------\n` +
      `*Customer Details:*\n` +
      `• Name: ${customer.name.trim()}\n` +
      `• Phone: ${customer.phone.trim()}\n` +
      (customer.email?.trim() ? `• Email: ${customer.email.trim()}\n` : "") +
      `• Delivery Address:\n${customer.address.trim()}\n\n` +
      `*Selected Sarees (${totalCount} item${totalCount > 1 ? "s" : ""}):*\n` +
      `${sareeLines}\n\n` +
      `---------------------------------------\n` +
      `*Order Pricing Summary:*\n` +
      (discountDetails ? `${discountDetails}\n` : `• Total: ${totalDisplay}\n`) +
      `---------------------------------------\n` +
      `Hello Gangadhar garu, I have placed this order inquiry from SaiSrujana website. Please confirm availability, exact pricing, and video drapes.`;

    // 1. Record enquiry in Supabase database
    try {
      const firstItem = items[0];
      const firstSaree = firstItem?.saree;
      const sareeNameSummary =
        items.length === 1
          ? firstItem.selectedColor
            ? `${firstSaree.name} (${firstItem.selectedColor})`
            : firstSaree.name
          : `Cart Order (${totalCount} sarees: ${items.map((i) => (i.selectedColor ? `${i.saree.name} - ${i.selectedColor}` : i.saree.name)).slice(0, 2).join(", ")}${items.length > 2 ? "..." : ""})`;
      const sareeSkuSummary = items.map((i) => i.saree.sku).join(", ");
      const formattedEnquiryMessage =
        `Delivery Address:\n${customer.address.trim()}\n\n` +
        `Cart Items (${totalCount} items):\n` +
        items
          .map((i, idx) => {
            const activePrice = i.selectedPrice !== undefined ? i.selectedPrice : i.saree.price;
            const colorStr = i.selectedColor ? ` [Colour: ${i.selectedColor}]` : "";
            return `${idx + 1}. ${i.saree.name}${colorStr} [SKU: ${i.saree.sku}] (Qty: ${i.quantity}) - ${
              typeof activePrice === "number"
                ? `₹${(Number(activePrice) * i.quantity).toLocaleString("en-IN")}`
                : "Price on Inquiry"
            }`;
          })
          .join("\n") +
        (appliedCoupon && activeDiscountAmount > 0
          ? `\n\nSubtotal: ₹${numericSubtotal.toLocaleString("en-IN")}\nCoupon: ${appliedCoupon.code} (-₹${activeDiscountAmount.toLocaleString("en-IN")})\nFinal Total: ₹${finalTotal.toLocaleString("en-IN")}`
          : `\n\nTotal: ${totalDisplay}`);

      await createEnquiryInDb({
        userId: user?.id || null,
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        customerEmail: customer.email?.trim() || null,
        sareeId: items.length === 1 ? firstSaree.id : null,
        sareeName: sareeNameSummary,
        sareeSku: sareeSkuSummary,
        variantId: items.length === 1 ? (firstItem.variantId || null) : null,
        selectedColor: items.length === 1 ? (firstItem.selectedColor || null) : null,
        variantPrice: items.length === 1 && firstItem.selectedPrice !== undefined && typeof firstItem.selectedPrice === "number" ? firstItem.selectedPrice : null,
        quantity: totalCount,
        message: formattedEnquiryMessage,
        status: "new",
      });
    } catch (dbErr) {
      console.warn("Could not record cart enquiry to database, continuing with WhatsApp:", dbErr);
    } finally {
      setIsSubmitting(false);
    }

    const whatsappUrl = getWhatsAppUrl(message);
    setOrderSent(true);

    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleIncreaseItemQuantity = (item: CartItem) => {
    const maxStock =
      typeof item.maxStock === "number" && !isNaN(item.maxStock)
        ? item.maxStock
        : typeof item.saree.stockQuantity === "number" && !isNaN(item.saree.stockQuantity)
        ? item.saree.stockQuantity
        : undefined;

    if (maxStock !== undefined && item.quantity >= maxStock) {
      const colorLabel = item.selectedColor ? ` (${item.selectedColor})` : "";
      setStockWarning(
        `Only ${maxStock} piece${maxStock > 1 ? "s" : ""} of "${item.saree.name}${colorLabel}" available in boutique stock.`
      );
      setTimeout(() => setStockWarning(null), 4000);
      return;
    }

    updateQuantity(getCartItemKey(item), item.quantity + 1);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-serif-luxury text-sm text-[#6E121E]">Loading your inquiry bag...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-2 text-xs text-[#8C7A6B]">
          <li>
            <Link href="/" className="hover:text-[#6E121E] transition">
              Home
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#C5A059]" />
            <Link href="/sarees" className="hover:text-[#6E121E] transition">
              Sarees
            </Link>
          </li>
          <li className="flex items-center font-semibold text-[#6E121E]">
            <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#C5A059]" />
            <span>Shopping Cart</span>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="mb-8 border-b border-[#E8E0D2] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#8C7A6B] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Boutique Inquiry & Orders</span>
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#1E1715]">
            Your Saree Inquiry Bag
          </h1>
          <p className="text-xs sm:text-sm text-[#5A4E46] mt-1 font-light">
            Review your selected sarees and send your delivery details directly to Gangadhar on WhatsApp.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#FAF6EE] text-[#6E121E] border border-[#C5A059]/40 font-semibold">
              {totalCount} {totalCount === 1 ? "Item" : "Items"} in Bag
            </span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D2] p-8 sm:p-16 text-center max-w-2xl mx-auto shadow-xs">
          <div className="w-20 h-20 rounded-full bg-[#F4EFE6] border border-[#C5A059]/30 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-[#C5A059] stroke-1" />
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#2C2420] mb-3">
            Your cart is empty
          </h2>
          <p className="text-xs sm:text-sm text-[#8C7A6B] max-w-md mx-auto mb-8 font-light leading-relaxed">
            You have not added any sarees to your inquiry bag yet. Browse our curated collection of Heritage Silks (Pattu Sarees), Contemporary Elegance (Fancy Sarees), and Everyday Grace (Daily Wear Sarees).
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sarees"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider btn-premium-primary shadow-xs"
            >
              Explore Sarees
            </Link>
            <Link
              href="/#collections"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-[#6E121E] text-[#6E121E] hover:bg-[#6E121E] hover:text-white text-xs font-semibold uppercase tracking-wider btn-premium-outline transition"
            >
              View Collections
            </Link>
          </div>
        </div>
      ) : (
        /* Cart With Items Layout: 2 Columns on Desktop */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Saree Items List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D2] p-4 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D2] mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8C7A6B]">
                  Selected Drapes ({items.length})
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-[#8C7A6B] hover:text-red-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Bag</span>
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#E8E0D2]">
                {items.map((item) => {
                  const cartKey = getCartItemKey(item);
                  const activeImage = item.selectedImage || item.saree.image;
                  const activePrice = item.selectedPrice !== undefined ? item.selectedPrice : item.saree.price;
                  const activeStock =
                    typeof item.maxStock === "number" && !isNaN(item.maxStock)
                      ? item.maxStock
                      : typeof item.saree.stockQuantity === "number" && !isNaN(item.saree.stockQuantity)
                      ? item.saree.stockQuantity
                      : undefined;

                  return (
                    <div
                      key={cartKey}
                      className="py-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                    >
                      {/* Item Thumbnail & Details */}
                      <div className="flex items-start gap-4">
                        <Link
                          href={`/sarees/${item.saree.id}`}
                          className="relative w-20 sm:w-24 aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 border border-[#E8E0D2] shrink-0 group"
                        >
                          <Image
                            src={activeImage}
                            alt={item.saree.name}
                            fill
                            sizes="96px"
                            className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                          />
                        </Link>

                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A059] block">
                            {item.saree.categoryLabel}
                          </span>
                          <Link
                            href={`/sarees/${item.saree.id}`}
                            className="font-serif-luxury text-base sm:text-lg font-bold text-[#1E1715] hover:text-[#6E121E] transition leading-snug line-clamp-1 block"
                          >
                            {item.saree.name}
                          </Link>

                          {/* Colour Variant Tag */}
                          {item.selectedColor && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FAF0DC]/80 border border-[#C5A059]/40 text-xs text-[#6E121E] font-medium">
                              {item.selectedColorCode && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 shadow-2xs shrink-0"
                                  style={{ backgroundColor: item.selectedColorCode }}
                                />
                              )}
                              <span>Colour: <strong>{item.selectedColor}</strong></span>
                            </div>
                          )}

                          <p className="text-xs text-[#8C7A6B]">
                            SKU: <span className="font-mono text-[11px]">{item.saree.sku}</span> • {item.saree.fabric}
                          </p>

                          <div className="pt-1 flex flex-wrap items-center gap-2">
                            <span className="inline-block text-xs font-semibold text-[#6E121E] bg-[#FAF6EE] px-2.5 py-0.5 rounded border border-[#E8E0D2]">
                              {typeof activePrice === "number"
                                ? formatCurrency(activePrice)
                                : "Price on Inquiry"}
                            </span>
                            {typeof activeStock === "number" &&
                              activeStock <= 3 &&
                              activeStock > 0 && (
                                <span className="inline-block text-[10px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {activeStock === 1
                                    ? "Last piece in stock"
                                    : `Only ${activeStock} left`}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls & Remove */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E0D2]/50">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-[#E8E0D2] rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(cartKey, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="w-8 h-8 flex items-center justify-center text-[#2C2420] hover:bg-[#FAF7F2] transition cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-[#2C2420]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncreaseItemQuantity(item)}
                            aria-label="Increase quantity"
                            className="w-8 h-8 flex items-center justify-center text-[#2C2420] hover:bg-[#FAF7F2] transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(cartKey)}
                          className="text-xs text-[#8C7A6B] hover:text-red-700 transition flex items-center gap-1 p-1 cursor-pointer"
                          title="Remove from bag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-[#E8E0D2] flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  href="/sarees"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#6E121E] hover:text-[#821524] transition group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                  <span>Continue Shopping Sarees</span>
                </Link>

                <p className="text-[11px] text-[#8C7A6B]">
                  Subtotal: <span className="font-semibold text-[#2C2420]">{totalCount} Sarees</span>
                </p>
              </div>
            </div>

            {/* Direct Consultation Notice */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6EE] border border-[#E8E0D2] text-xs text-[#5A4E46] space-y-2">
              <div className="flex items-center gap-2 text-[#6E121E] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                <span>SaiSrujana Direct Consultation</span>
              </div>
              <p className="text-[11px] text-[#8C7A6B] leading-relaxed">
                No advance payment is collected online. Gangadhar personally confirms availability with you on WhatsApp before finalizing your order.
              </p>
            </div>
          </div>

          {/* Right Column: Customer Details Form & WhatsApp Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            {/* Customer Details & WhatsApp Form */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#C5A059]/40 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#6E121E]" />
                <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                  Customer & Delivery Details
                </h3>
              </div>
              <p className="text-xs text-[#8C7A6B] mb-5 font-light">
                Please provide your contact information and delivery address for order confirmation from our Armoor store.
              </p>

              <form onSubmit={handleSendWhatsAppOrder} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="customer-name" className="block text-xs font-semibold text-[#2C2420] mb-1">
                    Customer Name <span className="text-[#6E121E]">*</span>
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    value={customer.name}
                    onChange={(e) => {
                      setCustomer({ ...customer, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                    }}
                    placeholder="Enter your full name"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-white border text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none transition ${
                      formErrors.name
                        ? "border-red-500 focus:border-red-600 ring-1 ring-red-500/20"
                        : "border-[#E8E0D2] focus:border-[#6E121E]"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Phone / WhatsApp */}
                <div>
                  <label htmlFor="customer-phone" className="block text-xs font-semibold text-[#2C2420] mb-1">
                    Phone / WhatsApp Number <span className="text-[#6E121E]">*</span>
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => {
                      setCustomer({ ...customer, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                    }}
                    placeholder="e.g. 9948534351"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-white border text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none transition ${
                      formErrors.phone
                        ? "border-red-500 focus:border-red-600 ring-1 ring-red-500/20"
                        : "border-[#E8E0D2] focus:border-[#6E121E]"
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Email (Optional) */}
                <div>
                  <label htmlFor="customer-email" className="block text-xs font-semibold text-[#2C2420] mb-1">
                    Email Address <span className="text-[10px] text-[#8C7A6B] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="customer-email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E8E0D2] focus:border-[#6E121E] text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none transition"
                  />
                </div>

                {/* Delivery Address */}
                <div>
                  <label htmlFor="customer-address" className="block text-xs font-semibold text-[#2C2420] mb-1">
                    Delivery Address & Landmark <span className="text-[#6E121E]">*</span>
                  </label>
                  <textarea
                    id="customer-address"
                    rows={3}
                    value={customer.address}
                    onChange={(e) => {
                      setCustomer({ ...customer, address: e.target.value });
                      if (formErrors.address) setFormErrors({ ...formErrors, address: undefined });
                    }}
                    placeholder="House / Flat No., Street, Area, City, Pin Code & Landmark"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-white border text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none transition resize-none ${
                      formErrors.address
                        ? "border-red-500 focus:border-red-600 ring-1 ring-red-500/20"
                        : "border-[#E8E0D2] focus:border-[#6E121E]"
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.address}
                    </p>
                  )}
                </div>

                {/* Apply Coupon Section */}
                <div className="pt-4 border-t border-[#E8E0D2]">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="cart-coupon-input"
                      className="text-xs font-semibold text-[#5A4E46] uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Apply Coupon / Offer Code</span>
                    </label>
                  </div>

                  {appliedCoupon ? (
                    /* Applied Coupon Card */
                    <div className="p-3.5 rounded-xl bg-[#FAF0DC] border border-[#C5A059]/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#6E121E] text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-4 h-4 text-[#C5A059]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#6E121E] tracking-wider">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                              Applied
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8C7A6B]">
                            {appliedCoupon.discountType === "percentage"
                              ? `${appliedCoupon.discountValue}% discount applied`
                              : `₹${appliedCoupon.discountValue.toLocaleString("en-IN")} flat discount applied`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline px-2 py-1 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    /* Coupon Input & Apply Button */
                    <div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            id="cart-coupon-input"
                            type="text"
                            placeholder="Enter coupon code (e.g. FESTIVE10)"
                            value={couponCodeInput}
                            onChange={(e) => {
                              setCouponCodeInput(e.target.value.toUpperCase());
                              if (couponError) setCouponError(null);
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0D2] bg-white font-mono text-xs uppercase tracking-wider text-[#1E1715] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={isApplyingCoupon || !couponCodeInput.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          {isApplyingCoupon ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                          ) : (
                            "Apply"
                          )}
                        </button>
                      </div>

                      {couponError && (
                        <p className="text-[11px] text-red-600 mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{couponError}</span>
                        </p>
                      )}

                      {couponSuccessMessage && (
                        <p className="text-[11px] text-emerald-700 mt-1.5 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3 flex-shrink-0" />
                          <span>{couponSuccessMessage}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Summary Pricing Breakdown */}
                <div className="pt-4 border-t border-[#E8E0D2] space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8C7A6B]">Total Sarees Selected</span>
                    <span className="font-semibold text-[#2C2420]">{totalCount}</span>
                  </div>

                  {allPricesNumeric && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#8C7A6B]">Subtotal</span>
                      <span className="font-semibold text-[#2C2420]">
                        ₹{numericSubtotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {appliedCoupon && activeDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-700">
                      <span className="flex items-center gap-1 font-medium">
                        <Tag className="w-3 h-3" />
                        <span>Coupon Discount ({appliedCoupon.code})</span>
                      </span>
                      <span className="font-bold">
                        - ₹{activeDiscountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8C7A6B]">Boutique Assistance</span>
                    <span className="font-semibold text-[#1E3F34]">Direct WhatsApp Consultation</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8C7A6B]">Store Location</span>
                    <span className="font-semibold text-[#2C2420] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C5A059]" /> {SHOP_CONFIG.cityState}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E8E0D2] flex justify-between items-baseline">
                    <span className="font-serif-luxury text-base font-bold text-[#1E1715]">
                      {appliedCoupon && activeDiscountAmount > 0 ? "Final Total" : "Order Total"}
                    </span>
                    <span className="font-serif-luxury text-xl font-bold text-[#6E121E]">
                      {allPricesNumeric
                        ? `₹${finalTotal.toLocaleString("en-IN")}`
                        : "Price on Inquiry"}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#8C7A6B] font-light italic">
                    Real prices are confirmed directly by Gangadhar with photo & drape video proof.
                  </p>
                </div>

                {/* Proceed to Full Checkout Button (Primary Action) */}
                <div className="pt-2 space-y-2.5">
                  <Link
                    href="/checkout"
                    className="w-full py-4 px-6 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                  </Link>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-[#E8E0D2]"></div>
                    <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-[#8C7A6B]">or enquire directly</span>
                    <div className="flex-grow border-t border-[#E8E0D2]"></div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold tracking-wider uppercase btn-premium-whatsapp flex items-center justify-center gap-2.5 shadow-sm group cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 text-[#A7F3D0] animate-spin" />
                        <span>Saving Enquiry &amp; Opening WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5 text-[#A7F3D0] group-hover:scale-105 transition-transform duration-200" />
                        <span>Send Quick Enquiry on WhatsApp</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[#8C7A6B] text-center mt-1 font-light">
                    Direct message to {SHOP_CONFIG.contactPerson}: {SHOP_CONFIG.phoneFormatted}
                  </p>
                </div>

                {orderSent && (
                  <div className="p-3.5 rounded-xl bg-[#E8F3EE] border border-[#A7F3D0]/50 text-xs text-[#1E3F34] flex items-start gap-2 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4 text-[#1E3F34] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">WhatsApp order initialized!</p>
                      <p className="text-[11px] text-[#2C2420]/80 mt-0.5">
                        If WhatsApp did not open automatically, you can also connect directly:
                      </p>
                      <a
                        href={getWhatsAppUrl("Hello Gangadhar garu, I am contacting you regarding my cart order from SaiSrujana.")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#1E3F34] underline mt-1"
                      >
                        Open WhatsApp Manually <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </form>

              {/* Direct Call / Store Directions Option */}
              <div className="mt-5 pt-4 border-t border-[#E8E0D2] flex flex-col sm:flex-row gap-2.5">
                <a
                  href={`tel:${SHOP_CONFIG.phone}`}
                  className="flex-1 py-2 px-3 rounded-lg border border-[#E8E0D2] hover:border-[#6E121E] text-[#2C2420] hover:text-[#6E121E] text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Call {SHOP_CONFIG.contactPerson}</span>
                </a>
                <a
                  href={SHOP_CONFIG.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg border border-[#E8E0D2] hover:border-[#C5A059] text-[#2C2420] text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Store Directions</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Warning Toast */}
      {stockWarning && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#6E121E] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-[#C5A059]/40 flex items-center gap-3 animate-in slide-in-from-bottom duration-300 max-w-sm">
          <AlertCircle className="w-5 h-5 text-[#C5A059] shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{stockWarning}</p>
        </div>
      )}
    </div>
  );
}
