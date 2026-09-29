"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  X,
  Link2,
  Sparkles,
} from "lucide-react";
import { Saree, SareeVariant } from "@/types/saree";

const subscribeToUrl = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};

const getUrlSnapshot = () => (typeof window !== "undefined" ? window.location.href : "");
const getServerSnapshot = () => "";

interface ShareSareeProps {
  saree: Saree;
  selectedVariant?: SareeVariant | null;
  variant?: "header" | "button" | "secondary" | "icon";
  className?: string;
}

export default function ShareSaree({
  saree,
  selectedVariant,
  variant = "header",
  className = "",
}: ShareSareeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const shareUrl = useSyncExternalStore(subscribeToUrl, getUrlSnapshot, getServerSnapshot);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Active price and colour considering selected variant
  const activePrice = selectedVariant ? selectedVariant.price : saree.price;
  const activeColor = selectedVariant?.colorName || saree.color;

  const priceDisplay =
    typeof activePrice === "number" && activePrice > 0
      ? `Price: ₹${activePrice.toLocaleString("en-IN")}`
      : "Price: Available on Inquiry";

  // Pre-filled WhatsApp message with saree name, SKU, price, selected colour and URL
  const whatsAppShareMessage = [
    `*SaiSrujana* - Crafting Grace in Every Thread`,
    `Handcrafted Sarees • Armoor, Telangana`,
    ``,
    `Look at this beautiful saree:`,
    `*${saree.name}*`,
    `SKU: ${saree.sku}`,
    activeColor ? `Colour: ${activeColor}` : "",
    saree.fabric ? `Fabric: ${saree.fabric}` : "",
    `Category: ${saree.categoryLabel}`,
    priceDisplay,
    ``,
    `Explore details & photos:`,
    shareUrl || (typeof window !== "undefined" ? window.location.href : `https://saisrujana.com/sarees/${saree.id}`),
  ]
    .filter(Boolean)
    .join("\n");

  const whatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    whatsAppShareMessage
  )}`;

  // Robust clipboard copy with fallback
  const handleCopyLink = useCallback(async () => {
    const textToCopy =
      shareUrl || (typeof window !== "undefined" ? window.location.href : "");

    let copiedSuccessfully = false;

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        copiedSuccessfully = true;
      } catch {
        // Will fallback below
      }
    }

    if (!copiedSuccessfully && typeof document !== "undefined") {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copiedSuccessfully = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch {
        copiedSuccessfully = false;
      }
    }

    setCopied(true);
    setShowToast(true);

    setTimeout(() => {
      setCopied(false);
    }, 2500);

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  }, [shareUrl]);

  // Click handler: Web Share API on mobile, or toggle popover on desktop / fallback
  const handleTriggerClick = async () => {
    const currentUrl =
      shareUrl || (typeof window !== "undefined" ? window.location.href : "");

    const isMobile =
      typeof navigator !== "undefined" &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
        (typeof window !== "undefined" &&
          window.matchMedia("(pointer: coarse)").matches &&
          window.innerWidth < 768));

    const canNativeShare =
      isMobile &&
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function";

    if (canNativeShare) {
      try {
        await navigator.share({
          title: `${saree.name} | SaiSrujana`,
          text: `Check out ${saree.name} (SKU: ${saree.sku}${
            priceDisplay ? ` • ${priceDisplay}` : ""
          }) from SaiSrujana:`,
          url: currentUrl,
        });
        return;
      } catch (err: unknown) {
        // If aborted by user, do nothing. Otherwise open fallback popover menu.
        if ((err as Error)?.name !== "AbortError") {
          setIsOpen(true);
        }
        return;
      }
    }

    // On desktop or unsupported mobile, toggle the fallback popover menu
    setIsOpen((prev) => !prev);
  };

  // Close on Click Outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Render trigger button depending on variant
  const renderTrigger = () => {
    switch (variant) {
      case "button":
        return (
          <button
            ref={triggerRef}
            type="button"
            onClick={handleTriggerClick}
            aria-label={`Share ${saree.name}`}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className={`w-full py-2.5 px-4 rounded-xl border border-[#C5A059] text-[#6E121E] hover:bg-[#FAF6EE] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${className}`}
          >
            <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Share Saree</span>
          </button>
        );

      case "secondary":
        return (
          <button
            ref={triggerRef}
            type="button"
            onClick={handleTriggerClick}
            aria-label={`Share ${saree.name}`}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className={`w-full py-2.5 px-4 rounded-xl border border-[#E8E0D2] bg-white hover:bg-[#FAF7F2] text-[#5A4E46] hover:text-[#6E121E] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-2xs ${className}`}
          >
            <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Share with Family & Friends</span>
          </button>
        );

      case "icon":
        return (
          <button
            ref={triggerRef}
            type="button"
            onClick={handleTriggerClick}
            aria-label={`Share ${saree.name}`}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            title="Share Saree"
            className={`p-2 rounded-lg text-[#8C7A6B] hover:text-[#6E121E] hover:bg-[#FAF7F2] transition cursor-pointer border border-transparent hover:border-[#E8E0D2] ${className}`}
          >
            <Share2 className="w-4 h-4" />
          </button>
        );

      case "header":
      default:
        return (
          <button
            ref={triggerRef}
            type="button"
            onClick={handleTriggerClick}
            aria-label={`Share ${saree.name}`}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            title="Share Saree"
            className={`inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] px-2.5 py-1.5 rounded-lg border border-[#E8E0D2] bg-white hover:bg-[#FAF7F2] transition duration-200 cursor-pointer shadow-2xs ${className}`}
          >
            <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="font-medium text-[#2C2420]">Share</span>
          </button>
        );
    }
  };

  return (
    <div className="relative inline-block text-left">
      {renderTrigger()}

      {/* Floating Success Toast */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#1E3F34] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-[#A7F3D0]/30 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom duration-300"
        >
          <Check className="w-4 h-4 text-[#A7F3D0]" />
          <span className="text-xs sm:text-sm font-medium">Link copied to clipboard!</span>
        </div>
      )}

      {/* Fallback / Desktop Popover Menu */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Share ${saree.name}`}
          className="absolute right-0 top-full mt-2 w-72 sm:w-84 bg-[#FAF7F2] rounded-2xl border border-[#C5A059]/40 shadow-2xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#FAF0DC] flex items-center justify-center text-[#C5A059]">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-serif-luxury text-sm font-bold text-[#1E1715]">
                  Share this Saree
                </h3>
                <p className="text-[10px] text-[#8C7A6B]">SaiSrujana Boutique • Armoor</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close share menu"
              className="p-1 rounded-md text-[#8C7A6B] hover:text-[#6E121E] hover:bg-[#EFE8DC] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Saree Mini Preview */}
          <div className="my-3 p-2.5 rounded-xl bg-white border border-[#E8E0D2] flex items-center gap-3">
            <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border border-[#E8E0D2]">
              <Image
                src={saree.image}
                alt={saree.name}
                fill
                sizes="48px"
                className="object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1E1715] truncate">{saree.name}</p>
              <p className="text-[10px] text-[#C5A059] font-medium">{saree.categoryLabel}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-[#8C7A6B]">SKU: {saree.sku}</span>
                {typeof saree.price === "number" && saree.price > 0 && (
                  <span className="text-[11px] font-bold text-[#6E121E]">
                    ₹{saree.price.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            {/* WhatsApp Share Option */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              aria-label="Share saree details via WhatsApp"
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white flex items-center justify-between text-xs font-semibold transition group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#A7F3D0] group-hover:scale-110 transition-transform" />
                <span>Share on WhatsApp</span>
              </div>
              <span className="text-[10px] text-[#A7F3D0] font-normal">Opens app</span>
            </a>

            {/* Copy Link Option */}
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="Copy saree link to clipboard"
              className={`w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition cursor-pointer shadow-2xs ${
                copied
                  ? "bg-[#E8F3EE] border-[#1E3F34]/30 text-[#1E3F34]"
                  : "bg-white hover:bg-[#FAF7F2] border-[#E8E0D2] text-[#2C2420] hover:text-[#6E121E]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {copied ? (
                  <Check className="w-4 h-4 text-[#1E3F34]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#C5A059]" />
                )}
                <span>{copied ? "Link copied! ✓" : "Copy Saree Link"}</span>
              </div>
              <span className="text-[10px] text-[#8C7A6B] font-mono">
                {copied ? "Done" : "Copy"}
              </span>
            </button>
          </div>

          {/* Saree Link Input Box for Manual Copying Fallback */}
          <div className="mt-3 pt-2.5 border-t border-[#E8E0D2]">
            <label
              htmlFor="saree-share-url-input"
              className="block text-[10px] uppercase tracking-wider text-[#8C7A6B] font-medium mb-1"
            >
              Page URL
            </label>
            <div className="flex items-center gap-1.5 bg-white border border-[#E8E0D2] rounded-lg p-1">
              <Link2 className="w-3.5 h-3.5 text-[#C5A059] ml-1.5 flex-shrink-0" />
              <input
                id="saree-share-url-input"
                type="text"
                readOnly
                value={shareUrl || ""}
                onFocus={(e) => e.target.select()}
                className="w-full bg-transparent text-[11px] text-[#5A4E46] font-mono px-1 py-0.5 focus:outline-none truncate"
                aria-label="Saree page link input"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label="Copy link input button"
                className="flex-shrink-0 px-2 py-1 rounded bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[10px] font-semibold text-[#6E121E] transition cursor-pointer"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#8C7A6B]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              <span>Authentic Handloom & Fancy</span>
            </span>
            <span>Armoor, Nizamabad</span>
          </div>
        </div>
      )}
    </div>
  );
}
