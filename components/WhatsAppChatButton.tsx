"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Sparkles } from "lucide-react";
import { SHOP_CONFIG, getWhatsAppUrl, formatCurrency } from "@/config/shop";
import { Saree, SareeVariant } from "@/types/saree";
import { useWhatsAppChat } from "@/context/WhatsAppChatContext";

const subscribeToUrl = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};

const getUrlSnapshot = () => (typeof window !== "undefined" ? window.location.href : "");
const getServerSnapshot = () => "";

interface WhatsAppChatButtonProps {
  saree?: Saree | null;
  selectedVariant?: SareeVariant | null;
  className?: string;
}

export default function WhatsAppChatButton({
  saree: propSaree,
  selectedVariant: propSelectedVariant,
  className = "",
}: WhatsAppChatButtonProps) {
  const pathname = usePathname();
  const currentUrl = useSyncExternalStore(subscribeToUrl, getUrlSnapshot, getServerSnapshot);
  const [isHovered, setIsHovered] = useState(false);
  const context = useWhatsAppChat();

  // Suppress completely inside the admin portal
  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  const isProductPage = pathname ? pathname.startsWith("/sarees/") && pathname !== "/sarees" : false;
  const activeSaree = propSaree !== undefined ? propSaree : context.activeSaree;
  const activeVariant = propSelectedVariant !== undefined ? propSelectedVariant : context.activeVariant;

  // Build appropriate prefilled message
  let message = "Hello SaiSrujana, I would like to know more about your sarees.";

  if (activeSaree) {
    const activePrice = activeVariant ? activeVariant.price : activeSaree.price;
    const activeColor = activeVariant?.colorName || activeSaree.color;
    const priceDisplay = formatCurrency(activePrice);
    const resolvedUrl = currentUrl || (typeof window !== "undefined" ? window.location.href : "");

    message = [
      `Hello SaiSrujana,`,
      ``,
      `I am interested in:`,
      `Saree: ${activeSaree.name}`,
      `SKU: ${activeSaree.sku}`,
      activeColor ? `Colour: ${activeColor}` : "",
      `Category: ${activeSaree.categoryLabel}`,
      `Price: ${priceDisplay}`,
      resolvedUrl ? `Product Link: ${resolvedUrl}` : "",
      ``,
      `Please share more details.`,
    ]
      .filter(Boolean)
      .join("\n");
  } else if (isProductPage && currentUrl) {
    message = `Hello SaiSrujana,\n\nI am interested in the saree on this page:\n${currentUrl}\n\nPlease share availability, price, and video drapes.`;
  }

  const whatsappUrl = getWhatsAppUrl(message);

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center group select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Desktop Floating Tooltip Card */}
      <div
        className={`hidden md:flex items-center gap-2.5 mr-3 px-3.5 py-2 rounded-2xl bg-[#1E1715]/95 backdrop-blur-md text-[#FAF7F2] border border-[#C5A059]/50 shadow-xl transition-all duration-300 pointer-events-none transform ${
          isHovered
            ? "opacity-100 translate-x-0 scale-100"
            : "opacity-0 translate-x-2 scale-95"
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <div className="text-left">
          <p className="text-xs font-serif-luxury font-bold text-[#E5D2A4] leading-tight">
            Chat with {SHOP_CONFIG.contactPerson}
          </p>
          <p className="text-[10px] text-[#A7F3D0] font-light">
            Online • Tap to WhatsApp
          </p>
        </div>
      </div>

      {/* Circular Floating WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with SaiSrujana on WhatsApp"
        title="Chat with us on WhatsApp"
        className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-white ring-2 ring-[#C5A059]/40 cursor-pointer"
      >
        {/* Glow / Pulse Animation Ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white/10" />

        {/* Small gold sparkle badge */}
        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#6E121E] border border-[#E5D2A4] text-[#E5D2A4] flex items-center justify-center text-[9px] shadow-sm">
          <Sparkles className="w-2.5 h-2.5" />
        </span>

        {/* Online Status Green Indicator Dot */}
        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#1E3F34] border-2 border-white flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A7F3D0]" />
        </span>
      </a>
    </div>
  );
}
