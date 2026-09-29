"use client";

import Link from "next/link";
import { ArrowRight, Award } from "lucide-react";
import SareeCard from "@/components/SareeCard";
import { Saree } from "@/types/saree";

interface BestSellersProps {
  sarees?: Saree[];
}

export default function BestSellers({ sarees }: BestSellersProps) {
  const sourceSarees = sarees ?? [];
  const bestSellers = sourceSarees.filter((s) => Boolean(s.isBestSeller));

  // Requirement: Add a Best Sellers section only if there are actual sarees where is_best_seller = true.
  // Do not create fake products.
  if (bestSellers.length === 0) {
    return null;
  }

  // Display up to 4 best seller sarees on homepage
  const displayedSarees = bestSellers.slice(0, 4);

  return (
    <section id="best-sellers" className="py-16 sm:py-20 bg-[#FAF7F2] border-t border-[#E8E0D2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#6E121E] bg-[#FAF0DC] px-3.5 py-1 rounded-full mb-3 border border-[#C5A059]/40">
            <Award className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Patron Favorites</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-3">
            Best Selling Weaves
          </h2>
          <div className="w-20 h-0.5 bg-[#C5A059] mx-auto mb-4" />
          <p className="text-xs sm:text-sm text-[#5A4E46] font-light leading-relaxed">
            Our most adored and requested sarees in Armoor. Loved for their timeless drape, pure craftsmanship, and celebratory elegance.
          </p>
        </div>

        {/* Product Cards Grid using existing SareeCard component */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {displayedSarees.map((saree) => (
            <SareeCard key={saree.id} saree={saree} />
          ))}
        </div>

        {/* Link to catalogue */}
        <div className="mt-10 text-center">
          <Link
            href="/sarees"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-[#6E121E] text-[#6E121E] hover:bg-[#6E121E] hover:text-white text-xs font-semibold uppercase tracking-[0.16em] transition shadow-xs"
          >
            <span>View All Best Sellers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
