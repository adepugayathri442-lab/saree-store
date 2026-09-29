"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { FEATURED_COLLECTIONS } from "@/data/sarees";
import { Saree, SareeCategory } from "@/types/saree";

interface FeaturedCollectionsProps {
  onSelectCollection?: (categoryId: SareeCategory) => void;
  sarees?: Saree[];
}

export default function FeaturedCollections({
  onSelectCollection,
  sarees = [],
}: FeaturedCollectionsProps) {
  return (
    <section id="collections" className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2] border-t border-[#E8E0D2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#6E121E] bg-[#FAF0DC] px-4 py-1.5 rounded-full mb-3 border border-[#C5A059]/40 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Curated For Every Occasion</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-4">
            Shop by Collection
          </h2>
          <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mb-4" />
          <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed">
            Discover SaiSrujana&apos;s signature weaves — from opulent heritage silks for weddings to stylish contemporary drapes and soft everyday elegance.
          </p>
        </div>

        {/* 3 Large Editorial Collection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURED_COLLECTIONS.map((collection) => {
            // Find real saree count and optional real boutique image
            const matchingSarees = sarees.filter((s) => s.category === collection.id);
            const realSareeWithUpload = matchingSarees.find(
              (s) => s.image && s.image.trim() !== "" && !s.image.startsWith("/images/")
            );
            const cardImage = realSareeWithUpload?.image || collection.image;
            const sareeCount = matchingSarees.length;

            return (
              <Link
                key={collection.id}
                href={`/sarees?category=${collection.id}`}
                onClick={() => onSelectCollection?.(collection.id)}
                className="group relative rounded-2xl overflow-hidden border border-[#E8E0D2] hover:border-[#C5A059] shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col justify-end min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] bg-stone-900 cursor-pointer transform hover:-translate-y-1"
              >
                {/* Large Editorial Background Image */}
                <Image
                  src={cardImage}
                  alt={`${collection.badge} - ${collection.name} at SaiSrujana Saree Store, Armoor`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Dark & Gold Editorial Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 group-hover:from-black/95 group-hover:via-black/50 transition-colors duration-500 pointer-events-none" />
                <div className="absolute inset-0 bg-[#C5A059]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Top Floating Badge & Count */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <span className="bg-[#FAF7F2]/95 backdrop-blur-md px-3 py-1 rounded text-xs uppercase tracking-wider font-bold text-[#6E121E] border border-[#C5A059]/50 shadow-sm">
                    {collection.badge}
                  </span>
                  <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-semibold text-[#A7F3D0] border border-[#A7F3D0]/30 shadow-xs">
                    {sareeCount > 0 ? `${sareeCount} ${sareeCount === 1 ? "Saree" : "Sarees"}` : "Curated Weaves"}
                  </span>
                </div>

                {/* Bottom Content Area */}
                <div className="relative z-10 p-6 sm:p-7 text-white flex flex-col justify-end">
                  {/* Category Subtitle */}
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#E5D2A4] mb-1.5 block">
                    {collection.categoryKey}
                  </span>

                  {/* Main Collection Title */}
                  <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight group-hover:text-[#FAF7F2] transition-colors">
                    {collection.name}
                  </h3>

                  {/* Editorial Description */}
                  <p className="text-xs sm:text-sm text-[#E8E0D2] font-light leading-relaxed line-clamp-2 mb-5">
                    {collection.description}
                  </p>

                  {/* Premium Action CTA */}
                  <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FAF7F2] group-hover:text-[#E5D2A4] transition-colors flex items-center gap-2">
                      <span>Explore Collection</span>
                      <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1.5 transition-transform duration-300" />
                    </span>
                    <span className="text-[11px] text-[#A8988B] group-hover:text-[#E5D2A4] transition-colors font-light">
                      Armoor Boutique
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
