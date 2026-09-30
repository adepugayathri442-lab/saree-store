"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Info,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons/Instagram";
import { Saree } from "@/types/saree";
import { formatCurrency, SHOP_CONFIG } from "@/config/shop";

export interface InstagramShareSareeItem {
  id: string;
  name: string;
  sku: string;
  categoryLabel?: string;
  price: number | string;
  fabric?: string;
  craft?: string;
  description?: string;
  image: string;
  stockStatus?: string;
  stockQuantity?: number;
}

interface InstagramShareModalProps {
  saree: InstagramShareSareeItem | Saree | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InstagramShareModal({
  saree,
  isOpen,
  onClose,
}: InstagramShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Compute the public product URL using the current origin (with fallback to production)
  const productUrl = useMemo(() => {
    if (!saree) return "";
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://saisrujana.vercel.app";
    return `${origin}/sarees/${saree.id}`;
  }, [saree]);

  // Generate Instagram caption
  const caption = useMemo(() => {
    if (!saree) return "";

    const priceFormatted =
      typeof saree.price === "number" && !isNaN(saree.price) && saree.price > 0
        ? formatCurrency(saree.price)
        : "Price on Inquiry";

    const desc = saree.description
      ? saree.description.trim()
      : `${saree.fabric ? `${saree.fabric} saree` : "Pure handloom saree"} with ${
          saree.craft || "authentic weaving"
        }.`;

    return `🌸 ${saree.name}
✨ Fabric: ${saree.fabric || "Handloom"} | Craft: ${saree.craft || "Authentic Weave"}
📝 ${desc}
🏷️ Price: ${priceFormatted}
📦 Availability: ${saree.stockStatus || (typeof saree.stockQuantity === "number" && saree.stockQuantity > 0 ? "In Stock" : "Available on Inquiry")}

🛍️ How to Order:
1️⃣ Direct Website Order: ${productUrl}
2️⃣ Tap Link Sticker in our Stories or Bio Link (@${SHOP_CONFIG.instagramHandle})
3️⃣ WhatsApp Gangadhar at +91 99485 34351 for live video drape & queries

📍 ${SHOP_CONFIG.brandName}, Armoor, Nizamabad, Telangana
#${SHOP_CONFIG.brandName} #SareeCollection #HandloomSarees #PattuSarees #ArmoorSarees #IndianEthnicWear`;
  }, [saree, productUrl]);

  if (!isOpen || !saree) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy product link:", err);
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (err) {
      console.error("Failed to copy caption:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#E8E0D2] shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Ornamental Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045]" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E8E0D2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shadow-xs shrink-0">
              <InstagramIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                  Marketing &amp; Social
                </span>
                <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                  Instagram
                </span>
              </div>
              <h3 className="font-serif-luxury font-bold text-lg text-[#1E1715]">
                Instagram Share &amp; Marketing
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Instagram share modal"
            className="p-1.5 rounded-xl text-[#8C7A6B] hover:text-[#1E1715] hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Snapshot Card */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-[#E8E0D2]">
          <div className="relative w-14 h-16 rounded-xl bg-stone-100 overflow-hidden border border-[#E8E0D2] shrink-0">
            <Image
              src={saree.image}
              alt={saree.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-[#C5A059] block">
              {saree.categoryLabel}
            </span>
            <p className="font-serif-luxury font-bold text-sm text-[#1E1715] truncate">
              {saree.name}
            </p>
            <p className="text-xs text-[#6E121E] font-semibold mt-0.5">
              {formatCurrency(Number(saree.price) || 0)}
              <span className="text-[11px] font-mono text-[#8C7A6B] font-normal ml-2">
                SKU: {saree.sku}
              </span>
            </p>
          </div>
        </div>

        {/* Section 1: Exact Public Product URL */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#1E1715] uppercase tracking-wider">
            Public Product Link
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-white border border-[#E8E0D2] rounded-xl px-3 py-2 text-xs font-mono text-[#5A4E46] truncate select-all">
              {productUrl}
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`py-2 px-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                copiedLink
                  ? "bg-emerald-700 text-white"
                  : "bg-[#6E121E] hover:bg-[#821524] text-white"
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Product Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick External Actions: Open Product Page & Open Instagram */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Open Product Page */}
          <Link
            href={`/sarees/${saree.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl border border-[#E8E0D2] bg-white hover:bg-[#FAF6EE] text-[#1E1715] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#6E121E]" />
            <span>Open Product Page</span>
          </Link>

          {/* Open Instagram */}
          <a
            href={SHOP_CONFIG.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <InstagramIcon className="w-3.5 h-3.5 text-white" />
            <span>Open Instagram App / Web</span>
          </a>
        </div>

        {/* Section 2: Copy Instagram Caption */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#1E1715] uppercase tracking-wider">
              Ready-to-Post Instagram Caption
            </label>
            <button
              type="button"
              onClick={handleCopyCaption}
              className={`text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer ${
                copiedCaption
                  ? "text-emerald-700"
                  : "text-[#6E121E] hover:underline"
              }`}
            >
              {copiedCaption ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Caption Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Caption</span>
                </>
              )}
            </button>
          </div>

          <textarea
            readOnly
            value={caption}
            rows={7}
            className="w-full p-3 rounded-2xl bg-white border border-[#E8E0D2] text-xs text-[#2C2420] font-sans leading-relaxed focus:outline-none resize-none select-all"
          />

          <button
            type="button"
            onClick={handleCopyCaption}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              copiedCaption
                ? "bg-emerald-700 text-white"
                : "bg-gradient-to-r from-[#6E121E] to-[#8C1D2D] hover:from-[#821524] hover:to-[#9E2335] text-white"
            }`}
          >
            {copiedCaption ? (
              <>
                <Check className="w-4 h-4" />
                <span>Caption Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#E5D2A4]" />
                <span>Copy Caption</span>
              </>
            )}
          </button>
        </div>

        {/* Requirement 8 Notice: Instagram Clickable Links Guidance */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-1">
            <p className="font-semibold text-amber-900">
              Instagram Link Placement Notice:
            </p>
            <p className="text-amber-800/90 font-light">
              Links in regular Instagram feed post captions are not clickable by default.
              Use <strong>Copy Product Link</strong> to add an interactive <strong>Link Sticker</strong> in your
              Instagram Stories, paste in your profile bio link, or send directly in DMs to inquiring patrons!
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl border border-[#E8E0D2] text-xs font-semibold text-[#5A4E46] hover:bg-[#FAF6EE] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
