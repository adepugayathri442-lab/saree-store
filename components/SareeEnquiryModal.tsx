"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  MessageCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  Phone,
  User,
  Mail,
  Palette,
  Check,
} from "lucide-react";
import { Saree, SareeVariant } from "@/types/saree";
import { createEnquiryInDb } from "@/lib/supabase/enquiries";
import { fetchVariantsBySareeId } from "@/lib/supabase/sareeVariants";
import { useAuth } from "@/context/AuthContext";
import { getWhatsAppUrl, formatCurrency } from "@/config/shop";

interface SareeEnquiryModalProps {
  saree: Saree;
  selectedVariant?: SareeVariant | null;
  isOpen: boolean;
  onClose: () => void;
  initialQuantity?: number;
}

export default function SareeEnquiryModal({
  saree,
  selectedVariant: propSelectedVariant,
  isOpen,
  onClose,
  initialQuantity = 1,
}: SareeEnquiryModalProps) {
  const { user, customerName, customerEmail } = useAuth();
  const [name, setName] = useState(() => customerName || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(() => customerEmail || "");
  const [quantity, setQuantity] = useState(initialQuantity);
  const [message, setMessage] = useState("");

  // Variant support
  const [variants, setVariants] = useState<SareeVariant[]>(() => saree.variants || []);
  const [userSelectedVariant, setUserSelectedVariant] = useState<SareeVariant | null>(null);

  const selectedVariant =
    userSelectedVariant ||
    propSelectedVariant ||
    (variants.length > 0 ? variants[0] : null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && saree?.id && (!saree.variants || saree.variants.length === 0)) {
      fetchVariantsBySareeId(saree.id)
        .then((data) => {
          if (isMounted && data && data.length > 0) {
            setVariants(data);
          }
        })
        .catch((err) => console.warn("Could not load saree variants for enquiry modal:", err));
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, saree?.id, saree?.variants]);

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activePrice = selectedVariant ? selectedVariant.price : saree.price;
  const activeColor = selectedVariant?.colorName || saree.color;

  const validateForm = () => {
    const errors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      errors.name = "Please enter your full name";
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Please enter a valid 10-digit mobile number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save Enquiry into Supabase
      await createEnquiryInDb({
        userId: user?.id || null,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || null,
        sareeId: saree.id,
        sareeName: saree.name,
        sareeSku: saree.sku,
        variantId: selectedVariant?.id || null,
        selectedColor: activeColor || null,
        variantPrice: typeof activePrice === "number" ? activePrice : null,
        quantity: Math.max(1, quantity),
        message: message.trim() || null,
        status: "new",
      });

      setIsSuccess(true);

      // 2. Compute current product URL
      const currentUrl =
        typeof window !== "undefined"
          ? window.location.href
          : `https://saisrujana.com/sarees/${saree.id}`;

      // 3. Build WhatsApp Prefilled Message (Requirement 8)
      const formattedPrice = typeof activePrice === "number" ? `₹${activePrice.toLocaleString("en-IN")}` : "Price on Inquiry";
      const whatsappText =
        `Hello SaiSrujana,\n\n` +
        `I am interested in:\n\n` +
        `Saree: ${saree.name}\n` +
        (activeColor ? `Colour: ${activeColor}\n` : "") +
        `SKU: ${saree.sku}\n` +
        `Price: ${formattedPrice}\n` +
        `Quantity: ${quantity}\n\n` +
        `Customer Name: ${name.trim()}\n` +
        `Phone: ${phone.trim()}\n` +
        (email.trim() ? `Email: ${email.trim()}\n` : "") +
        (message.trim() ? `Enquiry Note: ${message.trim()}\n` : "") +
        `Product Link: ${currentUrl}\n\n` +
        `Please share availability and ordering details.`;

      const whatsappUrl = getWhatsAppUrl(whatsappText);

      // 4. Open WhatsApp
      if (typeof window !== "undefined") {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      // Auto close after brief display
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    } catch (err: unknown) {
      console.error("Failed to save enquiry:", err);
      // Even if Supabase network fails, construct and launch WhatsApp fallback
      const currentUrl =
        typeof window !== "undefined"
          ? window.location.href
          : `https://saisrujana.com/sarees/${saree.id}`;

      const fallbackText =
        `Hello SaiSrujana,\n\n` +
        `I am interested in:\n\n` +
        `Saree: ${saree.name}\n` +
        (activeColor ? `Colour: ${activeColor}\n` : "") +
        `SKU: ${saree.sku}\n` +
        `Quantity: ${quantity}\n` +
        `Customer: ${name.trim()} (${phone.trim()})\n` +
        (message.trim() ? `Note: ${message.trim()}\n` : "") +
        `Product Link: ${currentUrl}\n\n` +
        `Please share availability and ordering details.`;

      const whatsappUrl = getWhatsAppUrl(fallbackText);
      if (typeof window !== "undefined") {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E8E0D2] overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#590D18] via-[#6E121E] to-[#590D18] p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close enquiry modal"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-[#C5A059]/40 text-[#E5D2A4] text-[11px] font-semibold tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            <span>Direct Boutique Enquiry</span>
          </div>
          <h2
            id="enquiry-modal-title"
            className="font-serif-luxury text-xl sm:text-2xl font-bold"
          >
            Enquire About This Saree
          </h2>
          <p className="text-xs text-[#F4EFE6]/90 font-light mt-1">
            Submit your enquiry to our boutique team in Armoor and connect instantly on WhatsApp.
          </p>
        </div>

        {/* Saree Brief Summary Bar */}
        <div className="bg-[#FAF7F2] p-4 border-b border-[#E8E0D2] flex items-center gap-3.5">
          <div className="relative w-14 h-18 rounded-xl overflow-hidden bg-stone-200 border border-[#E8E0D2] shrink-0">
            <Image
              src={
                selectedVariant && selectedVariant.imageUrls && selectedVariant.imageUrls.length > 0
                  ? selectedVariant.imageUrls[0]
                  : saree.image
              }
              alt={saree.name}
              fill
              className="object-cover object-top"
              sizes="56px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-[#6E121E] bg-[#FAF6EE] px-1.5 py-0.5 rounded border border-[#C5A059]/30">
                {saree.sku}
              </span>
              <span className="text-[11px] text-[#8C7A6B] truncate">
                {saree.categoryLabel}
              </span>
            </div>
            <h3 className="font-serif-luxury text-sm font-bold text-[#1E1715] truncate mt-0.5">
              {saree.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-[#6E121E]">
                {typeof activePrice === "number" ? formatCurrency(activePrice) : saree.price}
              </span>
              {activeColor && (
                <span className="text-[11px] font-medium text-[#5A4E46] bg-white px-2 py-0.5 rounded border border-[#E8E0D2]">
                  {activeColor}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Colour Variant Selector (when saree has multiple variants) */}
        {variants.length > 0 && (
          <div className="px-5 sm:px-6 pt-3.5 pb-2 bg-[#FAF6EE]/50 border-b border-[#E8E0D2]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#5A4E46] uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Available Colour Variants ({variants.length})</span>
              </span>
              {selectedVariant && (
                <span className="text-[11px] font-medium text-[#6E121E]">
                  Selected: <strong>{selectedVariant.colorName}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
              {variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setUserSelectedVariant(v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-[#6E121E] text-white border-[#6E121E] shadow-2xs"
                        : "bg-white text-[#2C2420] border-[#E8E0D2] hover:border-[#C5A059] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    {v.colorCode && (
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: v.colorCode }}
                      />
                    )}
                    <span>{v.colorName}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#E5D2A4]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 text-center animate-in fade-in duration-300">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715] mb-1">
              Enquiry Submitted!
            </h3>
            <p className="text-xs text-[#5A4E46] max-w-sm mx-auto leading-relaxed mb-4">
              Your enquiry has been saved and WhatsApp is opening to connect directly with Gangadhar at SaiSrujana.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F3EE] text-[#1E3F34] text-xs font-medium border border-[#A7F3D0]/40">
              <MessageCircle className="w-4 h-4 text-[#1E3F34]" />
              <span>Opening WhatsApp...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {submitError}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1.5">
                Your Full Name <span className="text-[#6E121E]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., Priya Sharma"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
                  }}
                  className={`w-full px-3.5 py-2.5 pl-9 rounded-xl border ${
                    formErrors.name ? "border-red-400 bg-red-50/20" : "border-[#E8E0D2] bg-white"
                  } text-xs sm:text-sm text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059] transition`}
                />
                <User className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-3 pointer-events-none" />
              </div>
              {formErrors.name && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.name}</p>
              )}
            </div>

            {/* Phone Number & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-[#6E121E]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 pl-9 rounded-xl border ${
                      formErrors.phone ? "border-red-400 bg-red-50/20" : "border-[#E8E0D2] bg-white"
                    } text-xs sm:text-sm text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059] transition`}
                  />
                  <Phone className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-3 pointer-events-none" />
                </div>
                {formErrors.phone && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1.5">
                  Quantity
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-l-xl border border-r-0 border-[#E8E0D2] bg-[#FAF7F2] hover:bg-stone-200 text-[#1E1715] text-sm font-bold flex items-center justify-center transition cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-10 text-center border-y border-[#E8E0D2] bg-white text-xs sm:text-sm font-semibold text-[#1E1715] focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="w-10 h-10 rounded-r-xl border border-l-0 border-[#E8E0D2] bg-[#FAF7F2] hover:bg-stone-200 text-[#1E1715] text-sm font-bold flex items-center justify-center transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1.5">
                Email Address <span className="text-[11px] font-normal text-[#8C7A6B] lowercase">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g., priya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#E8E0D2] bg-white text-xs sm:text-sm text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059] transition"
                />
                <Mail className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Message (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1.5">
                Enquiry Message / Special Requests <span className="text-[11px] font-normal text-[#8C7A6B] lowercase">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ask about matching colors, availability, video drapes, or showroom visits..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0D2] bg-white text-xs sm:text-sm text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059] transition resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1E3F34] hover:bg-[#152D25] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#A7F3D0]" />
                    <span>Saving & Connecting to WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4.5 h-4.5 text-[#A7F3D0]" />
                    <span>Send Enquiry & Open WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full py-2 text-xs text-[#8C7A6B] hover:text-[#1E1715] text-center font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
