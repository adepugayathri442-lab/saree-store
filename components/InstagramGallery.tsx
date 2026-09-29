"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Instagram } from "@/components/icons/Instagram";
import { Saree } from "@/types/saree";
import { FEATURED_SAREES } from "@/data/sarees";
import { SHOP_CONFIG, formatCurrency } from "@/config/shop";

interface InstagramGalleryProps {
  sarees?: Saree[];
  className?: string;
}

export default function InstagramGallery({
  sarees = [],
  className = "",
}: InstagramGalleryProps) {
  // Use real sarees from database; fallback to featured curated items if DB list is empty
  const displaySarees = (sarees && sarees.length > 0 ? sarees : FEATURED_SAREES).slice(0, 6);

  if (displaySarees.length === 0) return null;

  return (
    <section
      aria-labelledby="gallery-section-heading"
      className={`py-14 sm:py-20 lg:py-24 bg-gradient-to-b from-[#FDFBF7] via-[#FAF7F2] to-[#FDFBF7] border-t border-[#E8E0D2] relative overflow-hidden ${className}`}
    >
      {/* Decorative luxury backdrop aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <a
            href={SHOP_CONFIG.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit SaiSrujana Instagram profile (${SHOP_CONFIG.instagramUsername})`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 text-[#6E121E] hover:text-[#590D18] hover:border-[#C5A059] text-xs font-semibold tracking-wider uppercase mb-3 shadow-2xs transition-colors group"
          >
            <Instagram className="w-3.5 h-3.5 text-[#C5A059] group-hover:scale-110 transition-transform" />
            <span>{SHOP_CONFIG.instagramUsername}</span>
            <ExternalLink className="w-3 h-3 text-[#8C7A6B] group-hover:text-[#6E121E]" />
          </a>

          <h2
            id="gallery-section-heading"
            className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E1715] tracking-tight mb-3"
          >
            From Our Collection
          </h2>

          <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed">
            Follow <span className="font-semibold text-[#6E121E]">{SHOP_CONFIG.instagramUsername}</span> for new saree arrivals, styling and updates. Discover the beauty of SaiSrujana — handpicked weaves, royal zari borders, and timeless drapes captured straight from our Armoor boutique.
          </p>
        </div>

        {/* Instagram-Style Photo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {displaySarees.map((saree, index) => {
            return (
              <Link
                key={`${saree.id}-${index}`}
                href={`/sarees/${saree.id}`}
                aria-label={`View ${saree.name} details`}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone-200 border border-[#E8E0D2] shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Product Photograph */}
                <Image
                  src={saree.image}
                  alt={saree.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-108"
                />

                {/* Subtle top category indicator pill */}
                <div className="absolute top-2.5 left-2.5 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-semibold text-white/95 uppercase tracking-wider opacity-90 group-hover:opacity-0 transition-opacity duration-200 pointer-events-none">
                  {saree.categoryLabel.split(" ")[0]}
                </div>

                {/* Instagram Icon Badge in top right */}
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-75 group-hover:opacity-0 transition-opacity duration-200 pointer-events-none">
                  <Instagram className="w-3 h-3 text-[#E5D2A4]" />
                </div>

                {/* Instagram Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3.5 flex flex-col justify-between text-white">
                  {/* Overlay Top: Heart and view icon */}
                  <div className="flex items-center justify-between text-white/90">
                    <div className="flex items-center gap-1 text-[11px] font-medium">
                      <Heart className="w-3.5 h-3.5 fill-[#C5A059] text-[#C5A059]" />
                      <span>SaiSrujana</span>
                    </div>
                    <Eye className="w-4 h-4 text-[#A7F3D0]" />
                  </div>

                  {/* Overlay Bottom: Saree Name & Price */}
                  <div>
                    <span className="text-[10px] text-[#C5A059] uppercase tracking-wider font-semibold block mb-0.5">
                      {saree.categoryLabel}
                    </span>
                    <h3 className="font-serif-luxury text-xs sm:text-sm font-bold text-white leading-tight line-clamp-2">
                      {saree.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/20">
                      <span className="text-xs font-bold text-[#A7F3D0]">
                        {formatCurrency(saree.price)}
                      </span>
                      <span className="text-[10px] font-mono text-white/80">
                        {saree.sku}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom CTA Row */}
        <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-3.5 text-center">
          <Link
            href="/sarees"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-widest transition shadow-md group"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4 text-[#E5D2A4] group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href={SHOP_CONFIG.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow SaiSrujana on Instagram (${SHOP_CONFIG.instagramUsername})`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#C5A059]/60 bg-white hover:bg-[#FAF6EE] text-[#1E1715] hover:text-[#6E121E] text-xs font-semibold uppercase tracking-wider transition shadow-2xs group"
          >
            <Instagram className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
            <span>Follow on Instagram</span>
            <ExternalLink className="w-3 h-3 text-[#8C7A6B] group-hover:text-[#6E121E]" />
          </a>
        </div>
      </div>
    </section>
  );
}
