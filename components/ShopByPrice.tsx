"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Tag } from "lucide-react";

interface PriceRangeCard {
  id: string;
  title: string;
  sublabel: string;
  description: string;
  filterParam: string;
  badge: string;
}

const PRICE_TIERS: PriceRangeCard[] = [
  {
    id: "under-500",
    title: "Under ₹500",
    sublabel: "Everyday Comfort",
    description: "Breathable, lightweight daily wear drapes designed for effortless all-day ease.",
    filterParam: "under-500",
    badge: "Budget Friendly",
  },
  {
    id: "500-1000",
    title: "₹500 – ₹1,000",
    sublabel: "Casual Elegance",
    description: "Charming casual and semi-formal sarees with graceful prints and delicate borders.",
    filterParam: "500-1000",
    badge: "Popular Everyday",
  },
  {
    id: "1000-2000",
    title: "₹1,000 – ₹2,000",
    sublabel: "Party & Festive",
    description: "Designer fancy sarees featuring scalloped edges, modern motifs, and celebratory drape.",
    filterParam: "1000-2000",
    badge: "Festive Favorite",
  },
  {
    id: "2000-plus",
    title: "₹2,000+",
    sublabel: "Heritage Silks",
    description: "Regal traditional Pattu silk sarees with lustrous zari borders for weddings and grand ceremonies.",
    filterParam: "2000-plus",
    badge: "Grand Celebrations",
  },
];

export default function ShopByPrice() {
  return (
    <section className="py-16 bg-[#FAF7F2] border-b border-[#E8E0D2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#8C7A6B] mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Budget & Value Discovery</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#1E1715] tracking-tight mb-3">
            Shop by Price Range
          </h2>

          <div className="w-20 h-0.5 bg-[#C5A059] mx-auto mb-3" />

          <p className="text-xs sm:text-sm text-[#5A4E46] font-light leading-relaxed">
            Select a price range to explore matching sarees in our live catalogue. Exact pricing and live video drapes are also available with Gangadhar on WhatsApp.
          </p>
        </div>

        {/* 4 Price Tier Cards Grid */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {PRICE_TIERS.map((tier) => (
            <Link
              key={tier.id}
              href={`/sarees?priceRange=${tier.filterParam}`}
              className="group relative bg-[#FAF6EE] hover:bg-white rounded-2xl p-3.5 sm:p-6 border border-[#E8E0D2] hover:border-[#C5A059] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <span className="text-[9.5px] sm:text-[10px] uppercase font-bold tracking-wider text-[#6E121E] bg-[#6E121E]/10 px-2 sm:px-2.5 py-0.5 rounded-full truncate max-w-[80%]">
                    {tier.badge}
                  </span>
                  <Tag className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#C5A059] shrink-0" />
                </div>

                {/* Price Heading */}
                <h3 className="font-serif-luxury text-xl min-[360px]:text-2xl sm:text-3xl font-bold text-[#1E1715] group-hover:text-[#6E121E] transition-colors mb-0.5 sm:mb-1">
                  {tier.title}
                </h3>

                <p className="text-[11px] sm:text-xs font-semibold text-[#C5A059] uppercase tracking-wider mb-2 sm:mb-2.5">
                  {tier.sublabel}
                </p>

                <p className="text-[11px] sm:text-xs text-[#5A4E46] font-light leading-relaxed mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-none">
                  {tier.description}
                </p>
              </div>

              {/* Bottom CTA Arrow */}
              <div className="pt-3 sm:pt-4 border-t border-[#E8E0D2]/70 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[#6E121E] group-hover:text-[#821524]">
                <span className="uppercase tracking-wider">Explore Sarees</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FAF7F2] group-hover:bg-[#6E121E] group-hover:text-white flex items-center justify-center transition-all duration-300">
                  <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
