"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Eye,
  ShoppingBag,
  Heart,
  Check,
  Phone,
  X,
  MessageCircle,
  Tag,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Saree, SareeCategory } from "@/types/saree";
import { SHOP_CONFIG, getWhatsAppUrl, formatCurrency } from "@/config/shop";

import { useWishlist } from "@/context/WishlistContext";

interface FeaturedSareesProps {
  onAddToCart: (saree: Saree) => void;
  activeSareeModal: Saree | null;
  onOpenSareeModal: (saree: Saree | null) => void;
  selectedCategory: SareeCategory | "all";
  onSelectCategory: (category: SareeCategory | "all") => void;
  sarees?: Saree[];
}

export default function FeaturedSarees({
  onAddToCart,
  activeSareeModal,
  onOpenSareeModal,
  selectedCategory,
  onSelectCategory,
  sarees,
}: FeaturedSareesProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const handleAddToCart = (saree: Saree) => {
    onAddToCart(saree);
    setAddedToast(`Added saree to your inquiry bag`);
    setTimeout(() => {
      setAddedToast(null);
    }, 3000);
  };

  const sourceSarees = sarees ?? [];
  const featuredOnly = sourceSarees.filter((saree) => Boolean(saree.isFeatured));

  // Homepage Featured Sarees must use ONLY sarees where is_featured = true
  if (featuredOnly.length === 0) {
    return null;
  }

  const displayedSarees =
    selectedCategory === "all"
      ? featuredOnly
      : featuredOnly.filter((saree) => saree.category === selectedCategory);

  return (
    <section id="featured-sarees" className="py-20 bg-[#FAF7F2] relative">
      {/* Toast notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E3F34] text-white px-5 py-3 rounded-lg shadow-2xl border border-[#A7F3D0]/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-[#A7F3D0]/20 flex items-center justify-center text-[#A7F3D0]">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-medium">{addedToast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#8C7A6B] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>SaiSrujana Showroom</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-4">
            Curated Saree Showcase
          </h2>
          <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mb-4" />
          <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed">
            Browse our handpicked drapes across Pattu, Fancy, and Daily Wear collections.
            Contact Gangadhar on WhatsApp for live video drapes, real prices, and immediate store availability.
          </p>
        </div>

        {/* Collection Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {[
            { id: "all", label: "All Collections" },
            { id: "heritage-silks", label: "Heritage Silks (Pattu)" },
            { id: "contemporary-elegance", label: "Contemporary Elegance (Fancy)" },
            { id: "everyday-grace", label: "Everyday Grace (Daily Wear)" },
          ].map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectCategory(tab.id as SareeCategory | "all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-[#6E121E] text-white shadow-sm border border-[#6E121E]"
                    : "bg-[#FAF6EE] text-[#5A4E46] hover:bg-[#F0EAE1] hover:text-[#2C2420] hover:border-[#C5A059] border border-[#E8E0D2]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 min-[360px]:gap-2.5 sm:gap-6 lg:gap-8">
          {displayedSarees.map((saree) => {
            const isWishlisted = isInWishlist(saree.id);
            const sareeWhatsAppUrl = getWhatsAppUrl(
              `Hello Gangadhar garu, I am inquiring about "${saree.name}" (${saree.categoryLabel}) from SaiSrujana website. Please share price and photos.`
            );

            return (
              <div
                key={saree.id}
                className="group bg-[#FAF7F2] rounded-lg sm:rounded-xl overflow-hidden border border-[#E8E0D2] saree-card shadow-xs flex flex-col justify-between"
              >
                {/* Product Image Area */}
                <div>
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
                    <Link href={`/sarees/${saree.id}`} className="block w-full h-full">
                      <Image
                        src={saree.image}
                        alt={saree.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover object-top saree-card-img"
                      />
                    </Link>

                    {/* Badges: Displayed ONLY when database value is true */}
                    {(() => {
                      const isSoldOut =
                        saree.stockStatus.toLowerCase().includes("sold out") ||
                        saree.stockStatus.toLowerCase().includes("out of stock");
                      const activeBadges: { label: string; className: string }[] = [];
                      if (isSoldOut) {
                        activeBadges.push({
                          label: "SOLD OUT",
                          className: "bg-[#590D18] text-white border-red-950/40",
                        });
                      } else {
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
                        if (saree.isLimitedStock) {
                          activeBadges.push({
                            label: "LIMITED STOCK",
                            className: "bg-[#FEF3C7] text-[#92400E] border-amber-300",
                          });
                        }
                      }
                      if (activeBadges.length === 0) return null;
                      return (
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
                      );
                    })()}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(saree)}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full bg-[#FAF7F2]/80 backdrop-blur-sm hover:bg-[#FAF7F2] text-[#2C2420] hover:text-[#6E121E] hover:scale-105 active:scale-95 transition-all duration-200 shadow-xs cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-200 ${
                          isWishlisted ? "fill-[#6E121E] text-[#6E121E]" : ""
                        }`}
                      />
                    </button>

                    {/* Quick Action Overlay on hover (Desktop only) */}
                    <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-250 hidden sm:flex gap-2">
                      <Link
                        href={`/sarees/${saree.id}`}
                        className="flex-1 py-2.5 px-3 bg-[#FAF7F2]/95 backdrop-blur-md hover:bg-white text-[#2C2420] hover:text-[#6E121E] text-xs font-semibold rounded shadow-md border border-[#E8E0D2] hover:border-[#C5A059] flex items-center justify-center gap-1.5 transition-all duration-200"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>View Saree</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(saree)}
                        aria-label="Add to inquiry bag"
                        className="p-2.5 bg-[#6E121E] hover:bg-[#821524] text-white rounded shadow-md hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
                        title="Add to Inquiry Bag"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Saree Card Details */}
                  <div className="p-2 min-[360px]:p-2.5 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category & Colour Label */}
                      <div className="flex items-center justify-between text-[10px] min-[360px]:text-[11px] sm:text-xs text-[#8C7A6B] mb-0.5 sm:mb-1.5">
                        <span className="font-medium text-[#C5A059] flex items-center gap-1 truncate max-w-[70%]">
                          <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                          <span className="truncate">
                            {saree.color ? `${saree.color} • ` : ""}
                            {saree.categoryLabel}
                          </span>
                        </span>
                      </div>

                      {/* Saree Name */}
                      <Link href={`/sarees/${saree.id}`} className="block">
                        <h3 className="font-serif-luxury text-xs min-[360px]:text-sm sm:text-base font-bold text-[#1E1715] leading-tight sm:leading-snug mb-0.5 sm:mb-2 group-hover:text-[#6E121E] transition-colors duration-250 line-clamp-1">
                          {saree.name}
                        </h3>
                      </Link>

                      {/* Price Status */}
                      <div className="flex items-baseline gap-2 mb-0 sm:mb-4">
                        <span className="text-xs min-[360px]:text-sm sm:text-base font-bold text-[#6E121E] whitespace-nowrap">
                          {formatCurrency(saree.price)}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Unified single-row on mobile, stacked on desktop */}
                    <div className="pt-1.5 sm:pt-3 border-t border-[#E8E0D2]/40 sm:border-[#E8E0D2]/70 mt-0.5 sm:mt-0 flex flex-row sm:flex-col gap-1.5 sm:gap-0 sm:space-y-2">
                      <Link
                        href={`/sarees/${saree.id}`}
                        className="flex-1 w-full py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-md sm:rounded border border-[#6E121E] text-[#6E121E] hover:bg-[#6E121E] hover:text-white text-[10px] min-[360px]:text-[11px] sm:text-xs tracking-wider uppercase font-semibold btn-premium-outline flex items-center justify-center gap-1 sm:gap-2 group/btn transition-colors"
                      >
                        <span className="min-[360px]:hidden">View</span>
                        <span className="hidden min-[360px]:inline">View Saree</span>
                        <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5 group-hover/btn:scale-110 transition-transform duration-200 shrink-0" />
                      </Link>

                      <a
                        href={sareeWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded bg-[#1E3F34] hover:bg-[#152e26] text-white text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold tracking-wider uppercase btn-premium-whatsapp flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs shrink-0 transition-colors"
                        title={`WhatsApp inquiry for ${saree.name}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0] shrink-0" />
                        <span className="hidden min-[410px]:inline sm:hidden">WhatsApp</span>
                        <span className="hidden sm:inline">WhatsApp Enquiry</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explore Full Saree Catalogue CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/sarees"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-sm bg-[#6E121E] text-white text-xs font-semibold uppercase tracking-[0.2em] btn-premium-primary shadow-sm"
          >
            <span>Explore Complete Saree Catalogue</span>
            <ArrowRight className="w-4 h-4 text-[#E5D2A4]" />
          </Link>
        </div>
      </div>

      {/* Saree Detailed Modal */}
      {activeSareeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div
            className="bg-[#FAF7F2] rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#C5A059]/40 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => onOpenSareeModal(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#FAF7F2]/90 hover:bg-stone-200 text-[#2C2420] transition shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-8">
              {/* Left Column: Saree Image */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-[#E8E0D2] shadow-inner bg-stone-100">
                  <Image
                    src={activeSareeModal.image}
                    alt={activeSareeModal.name}
                    fill
                    className="object-cover object-top"
                  />
                  <div className="absolute top-3 left-3 bg-[#6E121E] text-white text-[10px] tracking-widest uppercase font-semibold px-2.5 py-1 rounded">
                    {activeSareeModal.categoryLabel}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded bg-[#FAF6EE] border border-[#E8E0D2]">
                    <span className="text-[10px] uppercase tracking-wider text-[#8C7A6B] block">
                      SKU
                    </span>
                    <span className="font-semibold text-[#2C2420]">
                      {activeSareeModal.sku}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF6EE] border border-[#E8E0D2]">
                    <span className="text-[10px] uppercase tracking-wider text-[#8C7A6B] block">
                      Store Location
                    </span>
                    <span className="font-semibold text-[#2C2420] flex items-center justify-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> {SHOP_CONFIG.cityState}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Saree Details & Real Contact Actions */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded bg-[#C5A059]/15 text-[#8C6B28] text-[11px] font-semibold tracking-wider uppercase mb-2">
                    {activeSareeModal.occasion}
                  </div>

                  <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715] leading-snug mb-2">
                    {activeSareeModal.name}
                  </h3>

                  {/* Price info */}
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-lg font-bold text-[#6E121E]">
                      {formatCurrency(activeSareeModal.price)}
                    </span>
                    <span className="text-xs text-[#1E3F34] font-semibold bg-[#E8F3EE] px-2 py-0.5 rounded">
                      Inquire with Gangadhar for direct pricing
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed mb-6">
                    {activeSareeModal.description}
                  </p>

                  {/* Features list */}
                  <div className="mb-6 space-y-2 border-t border-[#E8E0D2] pt-4">
                    <span className="text-xs font-semibold text-[#2C2420] block mb-2">
                      Saree Highlights:
                    </span>
                    {activeSareeModal.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#5A4E46]">
                        <Check className="w-3.5 h-3.5 text-[#1E3F34] flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions: Add to Inquiry Bag & Real Contact with Gangadhar */}
                <div className="space-y-3 pt-4 border-t border-[#E8E0D2]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddToCart(activeSareeModal);
                        onOpenSareeModal(null);
                      }}
                      className="py-3 px-4 rounded bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Inquiry Bag</span>
                    </button>

                    <a
                      href={getWhatsAppUrl(
                        `Hello Gangadhar garu, I am interested in "${activeSareeModal.name}" (${activeSareeModal.categoryLabel}) from SaiSrujana. Please share price, live video and available colors.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow"
                    >
                      <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                      <span>WhatsApp Gangadhar</span>
                    </a>
                  </div>

                  <a
                    href={`tel:${SHOP_CONFIG.phone}`}
                    className="w-full py-2.5 px-4 rounded border border-[#C5A059] text-[#2C2420] hover:bg-[#FAF6EE] text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Call Store: {SHOP_CONFIG.phoneFormatted}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
