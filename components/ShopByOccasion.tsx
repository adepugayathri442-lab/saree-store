"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Saree } from "@/types/saree";

interface OccasionDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  filterParam: string;
  keywords: string[];
  fallbackImage: string;
}

const OCCASIONS: OccasionDef[] = [
  {
    id: "weddings",
    name: "Weddings & Bridal",
    tagline: "Royal Silk & Zari Weaves",
    description: "Opulent Pattu silks with grand borders, woven to grace auspicious wedding ceremonies and bridal drapes.",
    filterParam: "Weddings",
    keywords: ["wedding", "bridal", "marriage"],
    fallbackImage: "/images/kanchipuram.jpg",
  },
  {
    id: "festive",
    name: "Festive & Ceremonial",
    tagline: "Timeless Traditional Grace",
    description: "Rich traditional drapes tailored for family festivities, pujas, temple visits, and celebratory milestones.",
    filterParam: "Heritage",
    keywords: ["festive", "festivities", "heritage", "family", "traditional"],
    fallbackImage: "/images/banarasi.jpg",
  },
  {
    id: "parties",
    name: "Parties & Receptions",
    tagline: "Modern Contemporary Allure",
    description: "Lightweight designer fancy sarees with chic motifs, crafted for cocktail evenings and reception glamour.",
    filterParam: "Parties",
    keywords: ["party", "parties", "reception", "social", "contemporary", "fancy"],
    fallbackImage: "/images/organza.jpg",
  },
  {
    id: "daily-wear",
    name: "Daily Wear & Casual",
    tagline: "Effortless Comfort & Soft Weave",
    description: "Breathable and soft sarees engineered for graceful everyday elegance, office work, and easy drapes.",
    filterParam: "Daily",
    keywords: ["daily", "work", "casual", "gatherings", "comfort"],
    fallbackImage: "/images/handloom.jpg",
  },
];

interface ShopByOccasionProps {
  sarees?: Saree[];
}

export default function ShopByOccasion({ sarees = [] }: ShopByOccasionProps) {
  // Only display occasions that actually match sarees in our collection
  const activeOccasions = OCCASIONS.map((occ) => {
    const matchingSarees = sarees.filter((saree) => {
      const occasionText = (saree.occasion || "").toLowerCase();
      const nameText = saree.name.toLowerCase();
      const catText = saree.category.toLowerCase();

      return occ.keywords.some(
        (kw) =>
          occasionText.includes(kw) ||
          nameText.includes(kw) ||
          catText.includes(kw)
      );
    });

    // Pick first matching saree image or fallback
    const firstMatch = matchingSarees.find((s) => s.image && s.image.trim() !== "");
    const image = firstMatch ? firstMatch.image : occ.fallbackImage;

    return {
      ...occ,
      matchingCount: matchingSarees.length,
      image,
    };
  }).filter((occ) => occ.matchingCount > 0);

  // If no sarees match any occasion, do not show the section
  if (activeOccasions.length === 0) {
    return null;
  }

  return (
    <section id="shop-by-occasion" className="py-20 bg-[#FDFBF7] border-t border-[#E8E0D2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#8C7A6B] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Celebrate Every Moment</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-4">
            Shop by Occasion
          </h2>
          <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mb-4" />
          <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed">
            From regal wedding muhurthams to effortless daytime elegance, discover handpicked sarees curated for life&apos;s special moments.
          </p>
        </div>

        {/* Occasions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {activeOccasions.map((occ) => (
            <Link
              key={occ.id}
              href={`/sarees?occasion=${encodeURIComponent(occ.filterParam)}`}
              className="group relative bg-[#FAF7F2] rounded-2xl overflow-hidden border border-[#E8E0D2] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col transform hover:-translate-y-1"
            >
              {/* Image Frame */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-200">
                <Image
                  src={occ.image}
                  alt={`${occ.name} Sarees at SaiSrujana, Armoor`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Gradient Shadows */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                {/* Saree Count Pill */}
                <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-[#A7F3D0] border border-[#A7F3D0]/30 shadow-xs">
                  {occ.matchingCount} {occ.matchingCount === 1 ? "Saree" : "Sarees"}
                </div>

                {/* Bottom Overlay Title on Image */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-bold text-[#E5D2A4] uppercase tracking-widest block mb-1">
                    {occ.tagline}
                  </span>
                  <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold leading-tight group-hover:text-[#FAF7F2]">
                    {occ.name}
                  </h3>
                </div>
              </div>

              {/* Text Description and CTA */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-[#FAF7F2]">
                <p className="text-xs text-[#5A4E46] leading-relaxed line-clamp-2 mb-4 font-light">
                  {occ.description}
                </p>

                <div className="pt-3 border-t border-[#E8E0D2] flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6E121E] group-hover:text-[#C5A059] transition-colors">
                    Explore Sarees
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#FAF0DC] group-hover:bg-[#6E121E] text-[#6E121E] group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
