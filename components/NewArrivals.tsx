"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import SareeCard from "@/components/SareeCard";
import { Saree } from "@/types/saree";

interface NewArrivalsProps {
  sarees?: Saree[];
}

export default function NewArrivals({ sarees = [] }: NewArrivalsProps) {
  // Filter only real sarees where isNewArrival is true
  const newArrivals = sarees.filter((s) => Boolean(s.isNewArrival));

  // If no sarees are tagged as new arrival in the real database, gracefully return null
  if (newArrivals.length === 0) {
    return null;
  }

  // Display up to 4 real new arrival sarees (show fewer rather than inventing products)
  const displayedArrivals = newArrivals.slice(0, 4);

  return (
    <section id="new-arrivals" className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2] border-t border-[#E8E0D2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#1E3F34] bg-[#E8F3EE] px-4 py-1.5 rounded-full mb-3 border border-[#A7F3D0]/40 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Fresh from our boutique</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-3">
            New Arrivals
          </h2>
          <div className="w-20 h-0.5 bg-[#C5A059] mx-auto mb-4" />
          <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed">
            Directly from master looms to our Armoor showroom. Explore our newest handpicked silks and party drapes.
          </p>
        </div>

        {/* Product Cards Grid using real SareeCard */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {displayedArrivals.map((saree) => (
            <SareeCard key={saree.id} saree={saree} />
          ))}
        </div>

        {/* View All Pattern */}
        <div className="mt-12 text-center">
          <Link
            href="/sarees"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[#6E121E] text-[#6E121E] hover:bg-[#6E121E] hover:text-white text-xs font-semibold uppercase tracking-[0.18em] transition-all shadow-xs group"
          >
            <span>View All New Arrivals</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
