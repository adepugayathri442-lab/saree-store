"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Info,
  Share2,
  MessageCircle,
  Tag,
  Palette,
  Layers,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons/Instagram";
import { Saree } from "@/types/saree";
import { formatCurrency, SHOP_CONFIG, getWhatsAppUrl } from "@/config/shop";

export interface InstagramShareSareeItem {
  id: string;
  name: string;
  sku: string;
  categoryLabel?: string;
  price: number | string;
  fabric?: string;
  craft?: string;
  color?: string;
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
  const [copiedProductLink, setCopiedProductLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedWhatsAppLink, setCopiedWhatsAppLink] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const captionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Reliable clipboard copy helper: uses modern Clipboard API with execCommand fallback
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    // 1. Try modern asynchronous Clipboard API if available in secure/supported context
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (clipErr) {
        console.warn(
          "navigator.clipboard.writeText failed or was blocked, trying execCommand fallback:",
          clipErr
        );
      }
    }

    // 2. Fallback: temporary textarea + document.execCommand("copy")
    if (typeof document !== "undefined") {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.width = "2em";
        textarea.style.height = "2em";
        textarea.style.padding = "0";
        textarea.style.border = "none";
        textarea.style.outline = "none";
        textarea.style.boxShadow = "none";
        textarea.style.background = "transparent";
        textarea.style.opacity = "0";
        textarea.style.zIndex = "-1";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (successful) {
          return true;
        }
      } catch (execErr) {
        console.warn("document.execCommand fallback failed:", execErr);
      }

      // 3. Fallback: If captionTextareaRef is available, select it directly
      if (captionTextareaRef.current) {
        try {
          captionTextareaRef.current.focus();
          captionTextareaRef.current.select();
          captionTextareaRef.current.setSelectionRange(
            0,
            captionTextareaRef.current.value.length
          );
          const successful = document.execCommand("copy");
          if (successful) return true;
        } catch (refErr) {
          console.warn("captionTextareaRef fallback failed:", refErr);
        }
      }
    }

    return false;
  };

  // Exact public product URL specifically for this saree
  const productUrl = useMemo(() => {
    if (!saree?.id) return "";
    return `https://saisrujana.vercel.app/sarees/${saree.id}`;
  }, [saree?.id]);

  // Pre-filled WhatsApp enquiry message mentioning this exact saree
  const whatsappEnquiryMessage = useMemo(() => {
    if (!saree) return "";
    const priceFormatted =
      typeof saree.price === "number" && !isNaN(saree.price) && saree.price > 0
        ? formatCurrency(saree.price)
        : typeof saree.price === "string" && saree.price.trim() !== ""
        ? formatCurrency(saree.price)
        : "Price on Inquiry";

    return `Namaste ${SHOP_CONFIG.brandName}, I would like to inquire about this saree:

🌸 *${saree.name}*
🏷️ Price: ${priceFormatted}
${saree.sku ? `🔖 SKU: ${saree.sku}\n` : ""}${saree.color ? `🎨 Colour: ${saree.color}\n` : ""}${saree.fabric ? `🌿 Fabric: ${saree.fabric}\n` : ""}
🔗 Product Page: ${productUrl}

Could you please share more details or arrange a live video drape preview?`;
  }, [saree, productUrl]);

  // WhatsApp enquiry link for this exact saree
  const whatsappUrl = useMemo(() => {
    if (!whatsappEnquiryMessage) return "";
    return getWhatsAppUrl(whatsappEnquiryMessage);
  }, [whatsappEnquiryMessage]);

  // Generate Instagram caption
  const caption = useMemo(() => {
    if (!saree) return "";

    const priceFormatted =
      typeof saree.price === "number" && !isNaN(saree.price) && saree.price > 0
        ? formatCurrency(saree.price)
        : typeof saree.price === "string" && saree.price.trim() !== ""
        ? formatCurrency(saree.price)
        : "Price on Inquiry";

    const detailsList: string[] = [];
    if (saree.color) detailsList.push(`🎨 Colour: ${saree.color}`);
    if (saree.fabric) detailsList.push(`🌿 Fabric: ${saree.fabric}`);
    if (saree.craft) detailsList.push(`✨ Craft: ${saree.craft}`);

    const desc = saree.description
      ? saree.description.trim()
      : `${saree.fabric ? `${saree.fabric} saree` : "Pure handloom saree"} featuring ${
          saree.craft || "authentic weaving"
        }.`;

    return `🌸 ${saree.name}
${detailsList.length > 0 ? `${detailsList.join(" | ")}\n` : ""}🏷️ Price: ${priceFormatted}
📦 Availability: ${
      saree.stockStatus ||
      (typeof saree.stockQuantity === "number" && saree.stockQuantity > 0
        ? "In Stock"
        : "Available on Inquiry")
    }

📝 ${desc}

🛍️ How to Order:
1️⃣ Direct Website Order: ${productUrl}
2️⃣ Tap Link Sticker in our Stories or Bio Link (@${SHOP_CONFIG.instagramHandle})
3️⃣ WhatsApp Gangadhar at ${SHOP_CONFIG.whatsappNumberFormatted} for live video drape & queries

📍 ${SHOP_CONFIG.brandName}, Armoor, Nizamabad, Telangana
#${SHOP_CONFIG.brandName} #SareeCollection #HandloomSarees #PattuSarees #ArmoorSarees #IndianEthnicWear #SareeLove`;
  }, [saree, productUrl]);

  if (!isOpen || !saree) return null;

  const handleCopyProductLink = async () => {
    try {
      const ok = await copyTextToClipboard(productUrl);
      if (ok) {
        setCopiedProductLink(true);
        setTimeout(() => setCopiedProductLink(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy product link:", err);
    }
  };

  const handleCopyCaption = async () => {
    try {
      const ok = await copyTextToClipboard(caption);
      if (ok) {
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 2000);
      } else {
        if (captionTextareaRef.current) {
          captionTextareaRef.current.focus();
          captionTextareaRef.current.select();
        }
      }
    } catch (err) {
      console.error("Failed to copy caption:", err);
    }
  };

  const handleCopyWhatsAppLink = async () => {
    try {
      const ok = await copyTextToClipboard(whatsappUrl);
      if (ok) {
        setCopiedWhatsAppLink(true);
        setTimeout(() => setCopiedWhatsAppLink(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy WhatsApp link:", err);
    }
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: saree.name,
      text: `${caption}\n\nShop here: ${productUrl}`,
      url: productUrl,
    };

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share(shareData);
        setShareFeedback("Shared successfully!");
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          try {
            await copyTextToClipboard(`${caption}\n\n${productUrl}`);
            setShareFeedback("Caption & link copied to clipboard!");
            setTimeout(() => setShareFeedback(null), 3000);
          } catch {
            setShareFeedback("Please use the copy buttons below.");
            setTimeout(() => setShareFeedback(null), 3000);
          }
        }
      }
    } else {
      // Fallback if Web Share is not supported
      try {
        await copyTextToClipboard(
          `${caption}\n\nProduct Link: ${productUrl}`
        );
        setShareFeedback(
          "Web Share not supported on this browser — Caption & product link copied to clipboard!"
        );
        setTimeout(() => setShareFeedback(null), 4000);
      } catch {
        setShareFeedback("Please use the copy buttons below.");
        setTimeout(() => setShareFeedback(null), 3000);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#FAF7F2] rounded-3xl border border-[#E8E0D2] shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Ornamental Gradient Bar */}
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
                  Marketing &amp; Promotions
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                  Instagram &amp; WhatsApp
                </span>
              </div>
              <h3 className="font-serif-luxury font-bold text-lg text-[#1E1715]">
                Share Product Hub
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close share modal"
            className="p-1.5 rounded-xl text-[#8C7A6B] hover:text-[#1E1715] hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Snapshot Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-[#E8E0D2] shadow-2xs">
          <div className="relative w-16 h-20 rounded-xl bg-stone-100 overflow-hidden border border-[#E8E0D2] shrink-0">
            {saree.image ? (
              <Image
                src={saree.image}
                alt={saree.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#8C7A6B]">
                <Layers className="w-5 h-5 text-[#C5A059]" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {saree.categoryLabel && (
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  {saree.categoryLabel}
                </span>
              )}
              {saree.sku && (
                <span className="text-[10px] font-mono text-[#8C7A6B]">
                  SKU: {saree.sku}
                </span>
              )}
            </div>
            <p className="font-serif-luxury font-bold text-sm text-[#1E1715] truncate">
              {saree.name}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#5A4E46]">
              <span className="font-bold text-[#6E121E]">
                {formatCurrency(
                  typeof saree.price === "number" ||
                    typeof saree.price === "string"
                    ? saree.price
                    : 0
                )}
              </span>
              {saree.color && (
                <span className="text-[11px] text-[#5A4E46] flex items-center gap-1">
                  <Palette className="w-3 h-3 text-[#C5A059]" />
                  <span>{saree.color}</span>
                </span>
              )}
              {saree.fabric && (
                <span className="text-[11px] text-[#5A4E46] flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#C5A059]" />
                  <span>{saree.fabric}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: This saree's website link */}
        <div className="space-y-1.5 p-3.5 bg-white rounded-2xl border border-[#E8E0D2] shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#1E1715] uppercase tracking-wider">
              This saree&apos;s website link
            </label>
            <span className="text-[10px] text-[#8C7A6B] font-mono">
              Exact Saree Page
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="flex-1 bg-[#FAF7F2] border border-[#E8E0D2] rounded-xl px-3 py-2 text-xs font-mono text-[#5A4E46] truncate select-all">
              {productUrl}
            </div>

            <button
              type="button"
              onClick={handleCopyProductLink}
              className={`py-2 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                copiedProductLink
                  ? "bg-emerald-700 text-white"
                  : "bg-[#6E121E] hover:bg-[#821524] text-white"
              }`}
            >
              {copiedProductLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
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

        {/* Section 2: WhatsApp Enquiry Link */}
        <div className="space-y-1.5 p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <label className="block text-xs font-bold text-[#1E3F34] uppercase tracking-wider">
                WhatsApp Enquiry Link
              </label>
            </div>
            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Gangadhar ({SHOP_CONFIG.whatsappNumberFormatted})
            </span>
          </div>

          <p className="text-[11px] text-[#5A4E46] leading-relaxed">
            Direct WhatsApp chat pre-loaded with this saree&apos;s name and link for instant patron enquiries:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="flex-1 bg-[#F4FBF7] border border-emerald-200 rounded-xl px-3 py-2 text-xs font-mono text-[#1E3F34] truncate select-all">
              {whatsappUrl}
            </div>

            <button
              type="button"
              onClick={handleCopyWhatsAppLink}
              className={`py-2 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                copiedWhatsAppLink
                  ? "bg-emerald-700 text-white"
                  : "bg-[#1E3F34] hover:bg-[#285345] text-white"
              }`}
            >
              {copiedWhatsAppLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>WhatsApp Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy WhatsApp Link</span>
                </>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              title="Test WhatsApp message in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
              <span>Test Chat</span>
            </a>
          </div>
        </div>

        {/* Section 3: Quick Action Buttons (Share, Open Product Page, Open Instagram) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Share Button (Web Share API with fallback) */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="py-2.5 px-3 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Share</span>
          </button>

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
            <span>Open Instagram</span>
          </a>
        </div>

        {/* Share Feedback Toast Notification */}
        {shareFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-medium text-emerald-900 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
        )}

        {/* Section 4: Instagram Caption & Hashtags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#1E1715] uppercase tracking-wider">
              Ready-to-Post Instagram Caption
            </label>
            <button
              type="button"
              onClick={handleCopyCaption}
              className={`text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer ${
                copiedCaption ? "text-emerald-700" : "text-[#6E121E] hover:underline"
              }`}
            >
              {copiedCaption ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Caption Copied ✓</span>
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
            ref={captionTextareaRef}
            readOnly
            value={caption}
            rows={7}
            className="w-full p-3 rounded-2xl bg-white border border-[#E8E0D2] text-xs text-[#2C2420] font-sans leading-relaxed focus:outline-none resize-none select-all shadow-inner"
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
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Caption Copied ✓</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#E5D2A4]" />
                <span>Copy Caption</span>
              </>
            )}
          </button>
        </div>

        {/* Section 5: Instagram Workflow Guide Notice */}
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Instagram Promotion Workflow Guide:</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-amber-900/90 pl-5 list-disc leading-relaxed">
            <li>
              <strong>Instagram Feed Posts:</strong> Captions on regular feed posts do not make external web links clickable. Direct patrons to your profile bio link (@{SHOP_CONFIG.instagramHandle}) or invite them to send a direct message.
            </li>
            <li>
              <strong>Instagram Stories (Recommended):</strong> Use <strong>&quot;Copy Product Link&quot;</strong> and paste it directly into Instagram&apos;s <strong>Link Sticker</strong> so viewers can tap directly to open this exact saree on your website.
            </li>
            <li>
              <strong>Instagram Direct Messages (DMs):</strong> External links are fully clickable in DMs. Send this exact product link directly to patrons inquiring about this saree!
            </li>
          </ul>
        </div>

        {/* Modal Bottom Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-[#E8E0D2]">
          <p className="text-[11px] text-[#8C7A6B]">
            Promoting from {SHOP_CONFIG.brandName} Boutique • Armoor
          </p>
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
