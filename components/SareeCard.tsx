"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Eye, Tag, Heart } from "lucide-react";
import { Saree } from "@/types/saree";
import { getWhatsAppUrl, formatCurrency } from "@/config/shop";
import { useWishlist } from "@/context/WishlistContext";
import { getStockDisplay } from "@/lib/stock";

interface SareeCardProps {
  saree: Saree;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
}

export default function SareeCard({
  saree,
  isWishlisted: propIsWishlisted,
  onToggleWishlist: propOnToggleWishlist,
}: SareeCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isItemWishlisted =
    propIsWishlisted !== undefined ? propIsWishlisted : isInWishlist(saree.id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (propOnToggleWishlist) {
      propOnToggleWishlist(saree.id);
    } else {
      toggleWishlist(saree);
    }
  };

  const sareeWhatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am inquiring about "${saree.name}" (${saree.categoryLabel}, SKU: ${saree.sku}) from SaiSrujana catalogue. Please share price, live video and available colors.`
  );

  const stockInfo = getStockDisplay(saree.stockQuantity, saree.stockStatus);
  const isSoldOut = stockInfo.isOutOfStock;

  // Determine active badges without overcrowding
  const activeBadges: { label: string; className: string }[] = [];
  if (isSoldOut) {
    activeBadges.push({
      label: "SOLD OUT",
      className: "bg-[#590D18] text-white border-red-950/40",
    });
  } else {
    if (stockInfo.isLowStock) {
      activeBadges.push({
        label: stockInfo.label.toUpperCase(),
        className: "bg-[#FEF3C7] text-[#92400E] border-amber-300",
      });
    } else if (saree.isLimitedStock) {
      activeBadges.push({
        label: "LIMITED STOCK",
        className: "bg-[#FEF3C7] text-[#92400E] border-amber-300",
      });
    }
    if (saree.isNewArrival) {
      activeBadges.push({
        label: "NEW ARRIVAL",
        className: "bg-[#1E3F34] text-[#E5D2A4] border-[#1E3F34]",
      });
    }
    if (saree.isBestSeller) {
      activeBadges.push({
        label: "BEST SELLER",
        className: "bg-[#6E121E] text-white border-[#C5A059]/40",
      });
    }
    if (saree.isFeatured) {
      activeBadges.push({
        label: "FEATURED",
        className: "bg-[#FAF0DC] text-[#6E121E] border-[#C5A059]",
      });
    }
  }

  return (
    <div className="group bg-[#FAF7F2] rounded-lg sm:rounded-xl overflow-hidden border border-[#E8E0D2] saree-card shadow-xs flex flex-col justify-between">
      {/* Product Image Area */}
      <div>
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
          <Link href={`/sarees/${saree.id}`} className="block w-full h-full">
            <Image
              src={saree.image}
              alt={saree.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-top saree-card-img ${
                isSoldOut ? "grayscale-[30%] opacity-90" : ""
              }`}
            />
          </Link>

          {/* Elegant Product Badges (Top-Left): Compact on mobile screens */}
          {activeBadges.length > 0 && (
            <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-col gap-0.5 sm:gap-1 z-10 pointer-events-none max-w-[70%]">
              {activeBadges.slice(0, 2).map((badge, idx) => (
                <span
                  key={idx}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[8px] min-[360px]:text-[8.5px] sm:text-[9.5px] uppercase tracking-wide sm:tracking-wider font-bold shadow-xs border backdrop-blur-xs w-fit ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          {/* Heart / Wishlist Button - Present on EVERY SareeCard */}
          <button
            type="button"
            onClick={handleHeartClick}
            aria-label={
              isItemWishlisted
                ? `Remove ${saree.name} from Wishlist`
                : `Save ${saree.name} to Wishlist`
            }
            title={isItemWishlisted ? "In Wishlist (click to remove)" : "Save to Wishlist"}
            className={`absolute top-1.5 right-1.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-xs z-10 cursor-pointer ${
              isItemWishlisted
                ? "bg-white text-[#6E121E] shadow-md scale-105"
                : "bg-[#FAF7F2]/85 hover:bg-white text-[#2C2420] hover:text-[#6E121E] hover:scale-110 active:scale-90"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${
                isItemWishlisted
                  ? "fill-[#6E121E] text-[#6E121E] scale-110 animate-in zoom-in-75 duration-200"
                  : "text-stone-700 hover:text-[#6E121E]"
              }`}
            />
          </button>

          {/* Quick "View Saree" hover pill (Desktop only) */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-250 hidden sm:flex">
            <Link
              href={`/sarees/${saree.id}`}
              className="w-full py-2.5 px-3 bg-[#FAF7F2]/95 backdrop-blur-md hover:bg-white text-[#2C2420] hover:text-[#6E121E] text-xs font-semibold rounded shadow-md border border-[#E8E0D2] hover:border-[#C5A059] flex items-center justify-center gap-1.5 transition-all duration-200"
            >
              <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>View Saree Details</span>
            </Link>
          </div>
        </div>

        {/* Saree Card Details: Compact shopping-app layout on mobile, spacious editorial on desktop */}
        <div className="p-2 min-[360px]:p-2.5 sm:p-5">
          {/* Category, Colour & SKU row */}
          <div className="flex items-center justify-between text-[10px] min-[360px]:text-[11px] sm:text-xs text-[#8C7A6B] mb-0.5 sm:mb-1.5">
            <span className="font-medium text-[#C5A059] flex items-center gap-1 truncate max-w-[70%]">
              <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              <span className="truncate">
                {saree.color ? `${saree.color} • ` : ""}
                {saree.categoryLabel}
              </span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#8C7A6B] font-mono shrink-0 ml-1">
              {saree.sku}
            </span>
          </div>

          {/* Product Name */}
          <Link href={`/sarees/${saree.id}`} className="block">
            <h3 className="font-serif-luxury text-xs min-[360px]:text-sm sm:text-lg font-bold text-[#1E1715] leading-tight sm:leading-snug mb-0.5 sm:mb-2 group-hover:text-[#6E121E] transition-colors duration-250 line-clamp-1">
              {saree.name}
            </h3>
          </Link>

          {/* Description: Shown on desktop only to keep mobile cards app-compact */}
          <p className="hidden sm:block text-xs text-[#5A4E46] line-clamp-2 mb-3 font-light">
            {saree.description}
          </p>

          {/* Price & Stock Status */}
          <div className="flex items-baseline justify-between gap-1 sm:gap-2 mb-0 sm:mb-1">
            <span className="text-xs min-[360px]:text-sm sm:text-base font-bold text-[#6E121E] whitespace-nowrap">
              {formatCurrency(saree.price)}
            </span>
            <span
              className={`text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10.5px] font-medium px-1 min-[360px]:px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded truncate max-w-[55%] ${
                isSoldOut
                  ? "bg-red-50 text-red-800 border border-red-200 font-semibold"
                  : saree.isLimitedStock
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-[#E8F3EE] text-[#1E3F34]"
              }`}
            >
              {saree.stockStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Unified single-row on mobile, stacked on desktop */}
      <div className="p-2 min-[360px]:p-2.5 sm:p-5 pt-1.5 sm:pt-0 border-t border-[#E8E0D2]/40 sm:border-[#E8E0D2]/50 mt-0.5 sm:mt-2 flex flex-row sm:flex-col gap-1.5 sm:gap-0 sm:space-y-2">
        <Link
          href={`/sarees/${saree.id}`}
          className="flex-1 w-full py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-md sm:rounded border border-[#6E121E] text-[#6E121E] hover:bg-[#6E121E] hover:text-white text-[10px] min-[360px]:text-[11px] sm:text-xs tracking-wider uppercase font-semibold btn-premium-outline flex items-center justify-center gap-1 sm:gap-2 group/btn transition-colors"
          title={`View ${saree.name}`}
        >
          <span className="min-[360px]:hidden">View</span>
          <span className="hidden min-[360px]:inline">View Saree</span>
          <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5 group-hover/btn:scale-110 transition-transform duration-200 shrink-0" />
        </Link>

        <a
          href={sareeWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-md sm:rounded bg-[#1E3F34] hover:bg-[#152e26] text-white text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold tracking-wider uppercase btn-premium-whatsapp flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs shrink-0 transition-colors"
          title={`WhatsApp inquiry for ${saree.name}`}
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0] shrink-0" />
          <span className="hidden min-[410px]:inline sm:hidden">WhatsApp</span>
          <span className="hidden sm:inline">WhatsApp Enquiry</span>
        </a>
      </div>
    </div>
  );
}
