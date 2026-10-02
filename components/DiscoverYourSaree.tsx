"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Sparkles, Filter, X, ArrowRight, MessageCircle } from "lucide-react";
import { Saree } from "@/types/saree";
import SareeCard from "@/components/SareeCard";
import { getWhatsAppUrl } from "@/config/shop";

interface DiscoverYourSareeProps {
  sarees?: Saree[];
}

interface FilterOption {
  id: string;
  label: string;
  matches: (saree: Saree) => boolean;
}

export default function DiscoverYourSaree({ sarees = [] }: DiscoverYourSareeProps) {
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedFabric, setSelectedFabric] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Define Occasion filter options backed by real database data
  const occasionOptions: FilterOption[] = useMemo(() => {
    const defs: { id: string; label: string; keywords: string[] }[] = [
      { id: "wedding", label: "Weddings & Bridal", keywords: ["wedding", "bridal", "marriage", "muhurtham"] },
      { id: "festive", label: "Festive & Pujas", keywords: ["festive", "festivities", "heritage", "traditional", "puja", "ceremonial"] },
      { id: "party", label: "Parties & Receptions", keywords: ["party", "reception", "evening", "designer", "contemporary"] },
      { id: "daily", label: "Daily Wear", keywords: ["daily", "work", "casual", "comfort", "everyday"] },
    ];

    return defs
      .map((def) => ({
        id: def.id,
        label: def.label,
        matches: (s: Saree) => {
          const occ = (s.occasion || "").toLowerCase();
          const name = s.name.toLowerCase();
          const cat = s.category.toLowerCase();
          return def.keywords.some((kw) => occ.includes(kw) || name.includes(kw) || cat.includes(kw));
        },
      }))
      .filter((opt) => sarees.some(opt.matches));
  }, [sarees]);

  // Define Style / Collection filter options backed by real database data
  const styleOptions: FilterOption[] = useMemo(() => {
    const defs: { id: string; label: string; check: (s: Saree) => boolean }[] = [
      {
        id: "traditional",
        label: "Traditional Silks",
        check: (s: Saree) => s.category === "heritage-silks" || (s.craft || "").toLowerCase().includes("traditional"),
      },
      {
        id: "contemporary",
        label: "Contemporary & Fancy",
        check: (s: Saree) => s.category === "contemporary-elegance" || (s.craft || "").toLowerCase().includes("modern"),
      },
      {
        id: "everyday",
        label: "Everyday Handloom",
        check: (s: Saree) => s.category === "everyday-grace" || (s.fabric || "").toLowerCase().includes("handloom"),
      },
    ];

    return defs
      .map((def) => ({
        id: def.id,
        label: def.label,
        matches: def.check,
      }))
      .filter((opt) => sarees.some(opt.matches));
  }, [sarees]);

  // Dynamically extract real Fabrics from database sarees
  const fabricOptions: FilterOption[] = useMemo(() => {
    const uniqueFabrics = Array.from(
      new Set(
        sarees
          .map((s) => s.fabric?.trim())
          .filter((f): f is string => Boolean(f && f.length > 0))
      )
    );

    return uniqueFabrics.map((fabric) => ({
      id: fabric.toLowerCase().replace(/\s+/g, "-"),
      label: fabric,
      matches: (s: Saree) => (s.fabric || "").toLowerCase() === fabric.toLowerCase(),
    }));
  }, [sarees]);

  // Dynamically extract real Colors from database sarees
  const colorOptions: FilterOption[] = useMemo(() => {
    const uniqueColors = Array.from(
      new Set(
        sarees
          .map((s) => s.color?.trim())
          .filter((c): c is string => Boolean(c && c.length > 0))
      )
    );

    return uniqueColors.map((color) => ({
      id: color.toLowerCase().replace(/\s+/g, "-"),
      label: color,
      matches: (s: Saree) => (s.color || "").toLowerCase().includes(color.toLowerCase()),
    }));
  }, [sarees]);

  const hasActiveFilters = Boolean(
    selectedOccasion || selectedStyle || selectedFabric || selectedColor
  );

  const resetFilters = () => {
    setSelectedOccasion(null);
    setSelectedStyle(null);
    setSelectedFabric(null);
    setSelectedColor(null);
  };

  // Compute matched sarees
  const filteredSarees = useMemo(() => {
    return sarees.filter((saree) => {
      if (selectedOccasion) {
        const occOpt = occasionOptions.find((o) => o.id === selectedOccasion);
        if (occOpt && !occOpt.matches(saree)) return false;
      }
      if (selectedStyle) {
        const styleOpt = styleOptions.find((o) => o.id === selectedStyle);
        if (styleOpt && !styleOpt.matches(saree)) return false;
      }
      if (selectedFabric) {
        const fabOpt = fabricOptions.find((f) => f.id === selectedFabric);
        if (fabOpt && !fabOpt.matches(saree)) return false;
      }
      if (selectedColor) {
        const colOpt = colorOptions.find((c) => c.id === selectedColor);
        if (colOpt && !colOpt.matches(saree)) return false;
      }
      return true;
    });
  }, [
    sarees,
    selectedOccasion,
    selectedStyle,
    selectedFabric,
    selectedColor,
    occasionOptions,
    styleOptions,
    fabricOptions,
    colorOptions,
  ]);

  // Fallback WhatsApp message for direct consultation if customer has a specific drape in mind
  const directInquiryUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am looking for a saree for ${selectedOccasion || "an upcoming occasion"}. Could you share available options from SaiSrujana?`
  );

  return (
    <section
      id="discover-sarees"
      className="py-16 sm:py-20 lg:py-24 bg-[#F5EFE6]/50 border-t border-[#E8E0D2] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#1E3F34] bg-[#E8F3EE] px-4 py-1.5 rounded-full mb-3 border border-[#A7F3D0]/40 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Interactive Boutique Discovery</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-4">
            Find Your Perfect Saree
          </h2>
          <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mb-4" />
          <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed">
            Select your preferred occasion, style, fabric, or shade to explore matching handpicked boutique pieces currently available at our Armoor showroom.
          </p>
        </div>

        {/* Elegant Pill Filter Controls Panel */}
        <div className="bg-[#FAF7F2] rounded-2xl p-6 sm:p-8 border border-[#E8E0D2] shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E0D2]/70 mb-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#6E121E]">
              <Filter className="w-4 h-4 text-[#C5A059]" />
              <span>Browse by Category &amp; Fabric</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] font-medium transition cursor-pointer self-start sm:self-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* 1. Occasion Filter Pills */}
            {occasionOptions.length > 0 && (
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C7A6B] block mb-2.5">
                  Occasion
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOccasion(null)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      selectedOccasion === null
                        ? "bg-[#6E121E] text-white shadow-xs"
                        : "bg-[#FAF6EE] text-[#5A4E46] hover:bg-[#EFE9DE] border border-[#E8E0D2]"
                    }`}
                  >
                    All Occasions
                  </button>
                  {occasionOptions.map((opt) => {
                    const isSelected = selectedOccasion === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setSelectedOccasion(isSelected ? null : opt.id)
                        }
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[#6E121E] text-white shadow-xs"
                            : "bg-[#FAF6EE] text-[#5A4E46] hover:bg-[#EFE9DE] border border-[#E8E0D2]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Style Filter Pills */}
            {styleOptions.length > 0 && (
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C7A6B] block mb-2.5">
                  Style
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStyle(null)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      selectedStyle === null
                        ? "bg-[#1E3F34] text-white shadow-xs"
                        : "bg-[#FAF6EE] text-[#5A4E46] hover:bg-[#EFE9DE] border border-[#E8E0D2]"
                    }`}
                  >
                    All Styles
                  </button>
                  {styleOptions.map((opt) => {
                    const isSelected = selectedStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedStyle(isSelected ? null : opt.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[#1E3F34] text-white shadow-xs"
                            : "bg-[#FAF6EE] text-[#5A4E46] hover:bg-[#EFE9DE] border border-[#E8E0D2]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Real Fabric Filter Pills */}
            {fabricOptions.length > 0 && (
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C7A6B] block mb-2.5">
                  Fabric
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFabric(null)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      selectedFabric === null
                        ? "bg-[#C5A059] text-[#1E1715] font-semibold shadow-xs"
                        : "bg-[#FAF6EE] text-[#5A4E46] hover:bg-[#EFE9DE] border border-[#E8E0D2]"
                    }`}
                  >
                    All Fabrics
                  </button>
                  {fabricOptions.map((opt) => {
                    const isSelected = selectedFabric === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setSelectedFabric(isSelected ? null : opt.id)
                        }
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[#C5A059] text-[#1E1715] font-semibold shadow-xs"
                            : "bg-[#FAF6EE] text-[#5A4E46] hover:bg-[#EFE9DE] border border-[#E8E0D2]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Real Color Filter Pills */}
            {colorOptions.length > 0 && (
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C7A6B] block mb-2.5">
                  Color / Shade
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedColor(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      selectedColor === null
                        ? "bg-[#2C2420] text-white shadow-xs"
                        : "bg-[#FAF6EE] text-[#5A4E46] hover:bg-[#EFE9DE] border border-[#E8E0D2]"
                    }`}
                  >
                    All Colors
                  </button>
                  {colorOptions.map((opt) => {
                    const isSelected = selectedColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedColor(isSelected ? null : opt.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[#2C2420] text-white shadow-xs"
                            : "bg-[#FAF6EE] text-[#5A4E46] hover:bg-[#EFE9DE] border border-[#E8E0D2]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Results Status */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E8E0D2]">
          <p className="text-xs uppercase tracking-wider font-semibold text-[#8C7A6B]">
            Showing {filteredSarees.length} {filteredSarees.length === 1 ? "Matching Saree" : "Matching Sarees"}
            {hasActiveFilters && " for your selected preferences"}
          </p>
          <Link
            href="/sarees"
            className="text-xs font-semibold text-[#6E121E] hover:text-[#821524] uppercase tracking-wider inline-flex items-center gap-1 group"
          >
            <span>View Full Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Real Products Grid */}
        {filteredSarees.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 min-[360px]:gap-2.5 sm:gap-6 lg:gap-8">
            {filteredSarees.slice(0, 8).map((saree) => (
              <SareeCard key={saree.id} saree={saree} />
            ))}
          </div>
        ) : (
          <div className="bg-[#FAF7F2] rounded-2xl p-10 sm:p-14 text-center border border-[#E8E0D2] max-w-xl mx-auto shadow-xs">
            <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715] mb-2">
              No matching sarees found
            </h3>
            <p className="text-xs sm:text-sm text-[#5A4E46] font-light leading-relaxed mb-6">
              We update our boutique stock regularly. You can clear your filters to view all pieces or ask Gangadhar on WhatsApp for newly arrived unlisted weaves.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#6E121E] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#821524] transition shadow-xs cursor-pointer"
              >
                Reset Filters
              </button>
              <a
                href={directInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1E3F34] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#152e25] transition inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
                <span>Ask on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
