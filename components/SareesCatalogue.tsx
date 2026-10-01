"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  MessageCircle,
  MapPin,
  ChevronRight,
  RotateCcw,
  Filter,
  Check,
} from "lucide-react";
import SareeCard from "@/components/SareeCard";
import ImageSareeSearch from "@/components/ImageSareeSearch";
import { Saree, SareeCategory } from "@/types/saree";
import { SHOP_CONFIG, getWhatsAppUrl } from "@/config/shop";

export type SortOption = "default" | "price-asc" | "price-desc" | "newest";

export type PriceRangeId =
  | "all"
  | "400-500"
  | "500-1000"
  | "1000-2000"
  | "2000-plus"
  | "under-500";

interface PriceRangeOption {
  id: PriceRangeId;
  label: string;
  min: number | null;
  max: number | null;
  description: string;
}

export const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  { id: "all", label: "All Prices", min: null, max: null, description: "Complete Price Spectrum" },
  { id: "400-500", label: "₹400 – ₹500", min: 400, max: 500, description: "Everyday Budget Weaves" },
  { id: "500-1000", label: "₹500 – ₹1,000", min: 500, max: 1000, description: "Casual & Semi-Formal" },
  { id: "1000-2000", label: "₹1,000 – ₹2,000", min: 1000, max: 2000, description: "Party & Festive Drapes" },
  { id: "2000-plus", label: "₹2,000+", min: 2000, max: null, description: "Grand & Heritage Silks" },
  { id: "under-500", label: "Under ₹500", min: null, max: 500, description: "Affordable Daily Wear" },
];

export const CATEGORY_OPTIONS: { id: SareeCategory | "all"; name: string; sublabel: string }[] = [
  { id: "all", name: "All Sarees", sublabel: "Complete Catalogue" },
  { id: "heritage-silks", name: "Heritage Silks", sublabel: "Pattu Sarees" },
  { id: "contemporary-elegance", name: "Contemporary Elegance", sublabel: "Fancy Sarees" },
  { id: "everyday-grace", name: "Everyday Grace", sublabel: "Daily Wear Sarees" },
];

function getNumericPrice(price: number | string | null | undefined): number | null {
  if (price === undefined || price === null) return null;
  if (typeof price === "number") return isNaN(price) ? null : price;
  const cleaned = price.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function getColorHex(colorName: string): string | null {
  const c = colorName.toLowerCase();
  if (c.includes("pink") || c.includes("rose") || c.includes("magenta")) return "#E05283";
  if (c.includes("navy")) return "#1E3A8A";
  if (c.includes("blue")) return "#2563EB";
  if (c.includes("red") || c.includes("crimson") || c.includes("maroon")) return "#991B1B";
  if (c.includes("green") || c.includes("emerald")) return "#047857";
  if (c.includes("gold") || c.includes("yellow") || c.includes("mustard")) return "#D97706";
  if (c.includes("orange") || c.includes("rust") || c.includes("peach")) return "#EA580C";
  if (c.includes("purple") || c.includes("violet")) return "#7C3AED";
  if (c.includes("black") || c.includes("charcoal")) return "#1F2937";
  if (c.includes("white") || c.includes("cream") || c.includes("ivory") || c.includes("beige")) return "#FEF3C7";
  if (c.includes("grey") || c.includes("gray") || c.includes("silver")) return "#9CA3AF";
  return null;
}

function matchesAttribute(
  sareeValue: string | null | undefined,
  selectedOptions: string[]
): boolean {
  if (selectedOptions.length === 0) return true;
  if (!sareeValue || typeof sareeValue !== "string") return false;

  const val = sareeValue.trim().toLowerCase();
  if (!val) return false;

  return selectedOptions.some((opt) => {
    const target = opt.trim().toLowerCase();
    if (!target) return false;
    return val === target || val.includes(target) || target.includes(val);
  });
}

function extractFilterOptions(
  sarees: Saree[],
  field: "color" | "fabric" | "occasion"
): string[] {
  const set = new Set<string>();

  sarees.forEach((saree) => {
    const raw = saree[field];
    if (!raw || typeof raw !== "string") return;
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (trimmed.includes(",")) {
      const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (p) set.add(p);
      });
    } else {
      set.add(trimmed);
    }
  });

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

interface SareesCatalogueProps {
  initialSarees?: Saree[];
}

export default function SareesCatalogue({ initialSarees = [] }: SareesCatalogueProps) {
  const [sareesList, setSareesList] = useState<Saree[]>(initialSarees);

  // Keep state synchronized when initialSarees prop changes via server revalidation
  useEffect(() => {
    setSareesList(initialSarees);
  }, [initialSarees]);

  // Real-time and cross-tab deletion sync
  useEffect(() => {
    const supabase = createBrowserClient();

    // 1. Supabase Realtime channel
    const channel = supabase
      .channel("public:sarees:catalogue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sarees" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setSareesList((prev) => prev.filter((s) => s.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    // 2. Local window event
    const handleDeleted = (e: Event) => {
      const customEvent = e as CustomEvent<{ id?: string; sku?: string }>;
      const delId = customEvent.detail?.id;
      const delSku = customEvent.detail?.sku;
      if (delId || delSku) {
        setSareesList((prev) =>
          prev.filter((s) => s.id !== delId && (!delSku || s.sku !== delSku))
        );
      }
    };

    // 3. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "saisrujana:saree-deleted") {
        try {
          const parsed = JSON.parse(e.newValue || "{}");
          if (parsed.id || parsed.sku) {
            setSareesList((prev) =>
              prev.filter(
                (s) => s.id !== parsed.id && (!parsed.sku || s.sku !== parsed.sku)
              )
            );
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("saisrujana:saree-deleted", handleDeleted);
    window.addEventListener("storage", handleStorage);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("saisrujana:saree-deleted", handleDeleted);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") as SareeCategory | null;
  const urlPriceRange = searchParams.get("priceRange") as PriceRangeId | null;
  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
  const urlOccasion = searchParams.get("occasion");

  // Filter States (overridden by user interactions, otherwise falls back to URL parameters)
  const [userCategory, setUserCategory] = useState<SareeCategory | "all" | null>(null);
  const [userPriceRange, setUserPriceRange] = useState<PriceRangeId | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [newArrivalsOnly, setNewArrivalsOnly] = useState(false);
  const [bestSellersOnly, setBestSellersOnly] = useState(false);
  const [limitedStockOnly, setLimitedStockOnly] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    urlOccasion ? [urlOccasion] : []
  );
  const [userSearchQuery, setUserSearchQuery] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Dynamically extract available colors, fabrics, and occasions from actual saree data
  const availableColors = useMemo(
    () => extractFilterOptions(sareesList, "color"),
    [sareesList]
  );
  const availableFabrics = useMemo(
    () => extractFilterOptions(sareesList, "fabric"),
    [sareesList]
  );
  const availableOccasions = useMemo(
    () => extractFilterOptions(sareesList, "occasion"),
    [sareesList]
  );

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleFabric = (fabric: string) => {
    setSelectedFabrics((prev) =>
      prev.includes(fabric) ? prev.filter((f) => f !== fabric) : [...prev, fabric]
    );
  };

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
    );
  };

  const removeColor = (color: string) => {
    setSelectedColors((prev) => prev.filter((c) => c !== color));
  };

  const removeFabric = (fabric: string) => {
    setSelectedFabrics((prev) => prev.filter((f) => f !== fabric));
  };

  const removeOccasion = (occasion: string) => {
    setSelectedOccasions((prev) => prev.filter((o) => o !== occasion));
  };

  // Derived active category
  const selectedCategory: SareeCategory | "all" =
    userCategory !== null
      ? userCategory
      : urlCategory && ["heritage-silks", "contemporary-elegance", "everyday-grace"].includes(urlCategory)
      ? urlCategory
      : "all";

  // Derived active price range
  const selectedPriceRange: PriceRangeId =
    userPriceRange !== null
      ? userPriceRange
      : urlPriceRange && PRICE_RANGE_OPTIONS.some((p) => p.id === urlPriceRange)
      ? urlPriceRange
      : "all";

  // Derived active search query
  const searchQuery = userSearchQuery !== null ? userSearchQuery : urlSearch;
  const setSearchQuery = (q: string) => setUserSearchQuery(q);
  const setSelectedPriceRange = (range: PriceRangeId) => setUserPriceRange(range);

  // Filter and sort sarees using combined multi-criteria logic
  const filteredAndSortedSarees = useMemo(() => {
    let result = [...sareesList];

    // 1. Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((saree) => saree.category === selectedCategory);
    }

    // 2. Filter by numeric price range
    if (selectedPriceRange !== "all") {
      const activeRange = PRICE_RANGE_OPTIONS.find((p) => p.id === selectedPriceRange);
      if (activeRange) {
        result = result.filter((saree) => {
          const numPrice = getNumericPrice(saree.price);
          if (numPrice === null) return false;
          if (activeRange.min !== null && numPrice < activeRange.min) return false;
          if (activeRange.max !== null && numPrice > activeRange.max) return false;
          return true;
        });
      }
    }

    // 3. Filter by In Stock
    if (inStockOnly) {
      result = result.filter((saree) =>
        !saree.stockStatus.toLowerCase().includes("sold out") &&
        !saree.stockStatus.toLowerCase().includes("out of stock")
      );
    }

    // 4. Filter by Featured
    if (featuredOnly) {
      result = result.filter((saree) => Boolean(saree.isFeatured));
    }

    // 5. Filter by New Arrivals
    if (newArrivalsOnly) {
      result = result.filter((saree) => Boolean(saree.isNewArrival));
    }

    // 6. Filter by Best Sellers
    if (bestSellersOnly) {
      result = result.filter((saree) => Boolean(saree.isBestSeller));
    }

    // 7. Filter by Limited Stock
    if (limitedStockOnly) {
      result = result.filter((saree) => Boolean(saree.isLimitedStock));
    }

    // 5. Filter by Color (matches ANY selected color)
    if (selectedColors.length > 0) {
      result = result.filter((saree) => matchesAttribute(saree.color, selectedColors));
    }

    // 6. Filter by Fabric (matches ANY selected fabric)
    if (selectedFabrics.length > 0) {
      result = result.filter((saree) => matchesAttribute(saree.fabric, selectedFabrics));
    }

    // 7. Filter by Occasion (matches ANY selected occasion)
    if (selectedOccasions.length > 0) {
      result = result.filter((saree) => matchesAttribute(saree.occasion, selectedOccasions));
    }

    // 8. Filter by search query (name, category, fabric, color, craft, occasion, SKU)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (saree) =>
          saree.name.toLowerCase().includes(query) ||
          saree.categoryLabel.toLowerCase().includes(query) ||
          saree.fabric.toLowerCase().includes(query) ||
          saree.color.toLowerCase().includes(query) ||
          saree.craft.toLowerCase().includes(query) ||
          saree.occasion.toLowerCase().includes(query) ||
          saree.sku.toLowerCase().includes(query) ||
          saree.description.toLowerCase().includes(query)
      );
    }

    // 9. Sorting logic
    if (sortOption === "price-asc") {
      result.sort((a, b) => {
        const pa = getNumericPrice(a.price) ?? Infinity;
        const pb = getNumericPrice(b.price) ?? Infinity;
        return pa - pb;
      });
    } else if (sortOption === "price-desc") {
      result.sort((a, b) => {
        const pa = getNumericPrice(a.price) ?? -Infinity;
        const pb = getNumericPrice(b.price) ?? -Infinity;
        return pb - pa;
      });
    }

    return result;
  }, [
    sareesList,
    selectedCategory,
    selectedPriceRange,
    inStockOnly,
    featuredOnly,
    newArrivalsOnly,
    bestSellersOnly,
    limitedStockOnly,
    selectedColors,
    selectedFabrics,
    selectedOccasions,
    searchQuery,
    sortOption,
  ]);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedPriceRange !== "all" ||
    inStockOnly ||
    featuredOnly ||
    newArrivalsOnly ||
    bestSellersOnly ||
    limitedStockOnly ||
    selectedColors.length > 0 ||
    selectedFabrics.length > 0 ||
    selectedOccasions.length > 0 ||
    searchQuery.trim() !== "";

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedPriceRange !== "all" ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (featuredOnly ? 1 : 0) +
    (newArrivalsOnly ? 1 : 0) +
    (bestSellersOnly ? 1 : 0) +
    (limitedStockOnly ? 1 : 0) +
    selectedColors.length +
    selectedFabrics.length +
    selectedOccasions.length +
    (searchQuery.trim() !== "" ? 1 : 0);

  const handleResetAllFilters = () => {
    setUserCategory("all");
    setSelectedPriceRange("all");
    setInStockOnly(false);
    setFeaturedOnly(false);
    setNewArrivalsOnly(false);
    setBestSellersOnly(false);
    setLimitedStockOnly(false);
    setSelectedColors([]);
    setSelectedFabrics([]);
    setSelectedOccasions([]);
    setSearchQuery("");
    setSortOption("default");
  };

  const generalWhatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am browsing your saree catalogue on SaiSrujana website and would like to inquire about available sarees.`
  );

  // Reusable Sidebar Filter Content (used in Desktop Sidebar & Mobile Drawer)
  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* Category Filter Section */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1715] flex items-center justify-between mb-3">
          <span>Categories</span>
          <span className="text-[10px] text-[#C5A059] font-semibold">Shop By</span>
        </h4>
        <div className="space-y-1.5">
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setUserCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer text-left ${
                  isSelected
                    ? "bg-[#6E121E] text-white shadow-xs font-semibold"
                    : "text-[#5A4E46] hover:bg-[#F2ECE1] hover:text-[#1E1715]"
                }`}
              >
                <div>
                  <span className="block">{cat.name}</span>
                  <span
                    className={`text-[10px] ${
                      isSelected ? "text-white/80" : "text-[#8C7A6B]"
                    }`}
                  >
                    {cat.sublabel}
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Filter Section */}
      {availableColors.length > 0 && (
        <div className="pt-5 border-t border-[#E8E0D2]">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1715] flex items-center gap-1.5">
              <span>Color</span>
              {selectedColors.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#6E121E] text-white text-[10px] font-bold flex items-center justify-center">
                  {selectedColors.length}
                </span>
              )}
            </h4>
            {selectedColors.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedColors([])}
                className="text-[10px] text-[#6E121E] hover:underline font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {availableColors.map((color) => {
              const isSelected = selectedColors.includes(color);
              const count = sareesList.filter((s) => matchesAttribute(s.color, [color])).length;
              const colorDot = getColorHex(color);

              return (
                <label
                  key={color}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 cursor-pointer group ${
                    isSelected
                      ? "bg-[#6E121E]/10 text-[#6E121E] font-semibold"
                      : "text-[#5A4E46] hover:bg-[#F2ECE1] hover:text-[#1E1715]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleColor(color)}
                      aria-label={`Filter by color ${color}`}
                      className="w-3.5 h-3.5 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] cursor-pointer"
                    />
                    {colorDot && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: colorDot }}
                      />
                    )}
                    <span className="truncate">{color}</span>
                  </div>
                  <span
                    className={`text-[10px] ml-1.5 shrink-0 ${
                      isSelected ? "text-[#6E121E] font-bold" : "text-[#8C7A6B]"
                    }`}
                  >
                    ({count})
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Fabric Filter Section */}
      {availableFabrics.length > 0 && (
        <div className="pt-5 border-t border-[#E8E0D2]">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1715] flex items-center gap-1.5">
              <span>Fabric</span>
              {selectedFabrics.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#6E121E] text-white text-[10px] font-bold flex items-center justify-center">
                  {selectedFabrics.length}
                </span>
              )}
            </h4>
            {selectedFabrics.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFabrics([])}
                className="text-[10px] text-[#6E121E] hover:underline font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {availableFabrics.map((fabric) => {
              const isSelected = selectedFabrics.includes(fabric);
              const count = sareesList.filter((s) => matchesAttribute(s.fabric, [fabric])).length;

              return (
                <label
                  key={fabric}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 cursor-pointer group ${
                    isSelected
                      ? "bg-[#6E121E]/10 text-[#6E121E] font-semibold"
                      : "text-[#5A4E46] hover:bg-[#F2ECE1] hover:text-[#1E1715]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFabric(fabric)}
                      aria-label={`Filter by fabric ${fabric}`}
                      className="w-3.5 h-3.5 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] cursor-pointer"
                    />
                    <span className="truncate">{fabric}</span>
                  </div>
                  <span
                    className={`text-[10px] ml-1.5 shrink-0 ${
                      isSelected ? "text-[#6E121E] font-bold" : "text-[#8C7A6B]"
                    }`}
                  >
                    ({count})
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Occasion Filter Section */}
      {availableOccasions.length > 0 && (
        <div className="pt-5 border-t border-[#E8E0D2]">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1715] flex items-center gap-1.5">
              <span>Occasion</span>
              {selectedOccasions.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#6E121E] text-white text-[10px] font-bold flex items-center justify-center">
                  {selectedOccasions.length}
                </span>
              )}
            </h4>
            {selectedOccasions.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedOccasions([])}
                className="text-[10px] text-[#6E121E] hover:underline font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {availableOccasions.map((occasion) => {
              const isSelected = selectedOccasions.includes(occasion);
              const count = sareesList.filter((s) => matchesAttribute(s.occasion, [occasion])).length;

              return (
                <label
                  key={occasion}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 cursor-pointer group ${
                    isSelected
                      ? "bg-[#6E121E]/10 text-[#6E121E] font-semibold"
                      : "text-[#5A4E46] hover:bg-[#F2ECE1] hover:text-[#1E1715]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOccasion(occasion)}
                      aria-label={`Filter by occasion ${occasion}`}
                      className="w-3.5 h-3.5 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] cursor-pointer"
                    />
                    <span className="truncate">{occasion}</span>
                  </div>
                  <span
                    className={`text-[10px] ml-1.5 shrink-0 ${
                      isSelected ? "text-[#6E121E] font-bold" : "text-[#8C7A6B]"
                    }`}
                  >
                    ({count})
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Filter Section */}
      <div className="pt-5 border-t border-[#E8E0D2]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1715] flex items-center justify-between mb-3">
          <span>Price Ranges</span>
          <span className="text-[10px] text-[#8C7A6B]">INR (₹)</span>
        </h4>
        <div className="space-y-1.5">
          {PRICE_RANGE_OPTIONS.filter((p) => p.id !== "under-500").map((range) => {
            const isSelected = selectedPriceRange === range.id;
            return (
              <button
                key={range.id}
                type="button"
                onClick={() => setSelectedPriceRange(range.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer text-left ${
                  isSelected
                    ? "bg-[#6E121E] text-white shadow-xs font-semibold"
                    : "text-[#5A4E46] hover:bg-[#F2ECE1] hover:text-[#1E1715]"
                }`}
              >
                <div>
                  <span className="block">{range.label}</span>
                  <span
                    className={`text-[10px] ${
                      isSelected ? "text-white/80" : "text-[#8C7A6B]"
                    }`}
                  >
                    {range.description}
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Highlights & Badges Filter Section */}
      <div className="pt-5 border-t border-[#E8E0D2]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1715] mb-3">
          Highlights & Badges
        </h4>
        <div className="space-y-2">
          {/* Featured Checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-[#2C2420] cursor-pointer group">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              aria-label="Filter by Featured sarees"
              className="w-4 h-4 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] cursor-pointer"
            />
            <span className="group-hover:text-[#6E121E] transition-colors">
              Featured Sarees
            </span>
          </label>

          {/* New Arrivals Checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-[#2C2420] cursor-pointer group">
            <input
              type="checkbox"
              checked={newArrivalsOnly}
              onChange={(e) => setNewArrivalsOnly(e.target.checked)}
              aria-label="Filter by New Arrival sarees"
              className="w-4 h-4 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] cursor-pointer"
            />
            <span className="group-hover:text-[#6E121E] transition-colors">
              New Arrivals
            </span>
          </label>

          {/* Best Sellers Checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-[#2C2420] cursor-pointer group">
            <input
              type="checkbox"
              checked={bestSellersOnly}
              onChange={(e) => setBestSellersOnly(e.target.checked)}
              aria-label="Filter by Best Seller sarees"
              className="w-4 h-4 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] cursor-pointer"
            />
            <span className="group-hover:text-[#6E121E] transition-colors">
              Best Sellers
            </span>
          </label>

          {/* Limited Stock Checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-[#2C2420] cursor-pointer group">
            <input
              type="checkbox"
              checked={limitedStockOnly}
              onChange={(e) => setLimitedStockOnly(e.target.checked)}
              aria-label="Filter by Limited Stock sarees"
              className="w-4 h-4 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] cursor-pointer"
            />
            <span className="group-hover:text-[#6E121E] transition-colors">
              Limited Stock
            </span>
          </label>
        </div>
      </div>

      {/* Availability Filter Section */}
      <div className="pt-5 border-t border-[#E8E0D2]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1715] mb-3">
          Availability
        </h4>
        <div className="space-y-2">
          {/* In Stock Only Checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-[#2C2420] cursor-pointer group">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              aria-label="Filter by in stock sarees only"
              className="w-4 h-4 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] cursor-pointer"
            />
            <span className="group-hover:text-[#6E121E] transition-colors">
              In Stock Only
            </span>
          </label>
        </div>
      </div>

      {/* Reset All Filters Button inside Sidebar */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-[#E8E0D2]">
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-[#6E121E] hover:bg-[#6E121E] hover:text-white border border-[#6E121E] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-[#FDFBF7] min-h-screen text-[#2C2420]">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="bg-[#FAF7F2] border-b border-[#E8E0D2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center space-x-2 text-xs text-[#8C7A6B]">
            <li>
              <Link href="/" className="hover:text-[#6E121E] transition">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#C5A059]" />
              <span className="font-semibold text-[#6E121E]">Explore Our Sarees</span>
            </li>
            {selectedCategory !== "all" && (
              <li className="hidden sm:flex items-center">
                <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#C5A059]" />
                <span className="capitalize text-[#5A4E46]">
                  {CATEGORY_OPTIONS.find((c) => c.id === selectedCategory)?.name}
                </span>
              </li>
            )}
          </ol>
        </div>
      </nav>

      {/* Catalogue Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/80 to-[#FDFBF7] py-10 lg:py-14 border-b border-[#E8E0D2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4EFE6] border border-[#C5A059]/40 text-[#6E121E] text-xs font-semibold tracking-wider mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>SaiSrujana Boutique Catalogue • Armoor, Telangana</span>
          </div>

          <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E1715] tracking-tight mb-2">
            Explore Our Sarees
          </h1>

          <p className="text-xs sm:text-sm tracking-[0.22em] uppercase font-semibold text-[#C5A059] mb-3">
            “{SHOP_CONFIG.tagline}”
          </p>

          <p className="text-xs sm:text-sm text-[#5A4E46] font-light max-w-2xl mx-auto leading-relaxed">
            Browse our handpicked saree collections across <strong className="font-semibold text-[#1E1715]">Heritage Silks (Pattu Sarees)</strong>, <strong className="font-semibold text-[#1E1715]">Contemporary Elegance (Fancy Sarees)</strong>, and <strong className="font-semibold text-[#1E1715]">Everyday Grace (Daily Wear Sarees)</strong>.
          </p>
        </div>
      </section>

      {/* Main Content Area: Sidebar on Desktop + Catalogue Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* DESKTOP SIDEBAR: Left 3 Columns */}
          <aside className="hidden lg:block lg:col-span-3 bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8E0D2] shadow-xs sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E0D2] mb-5">
              <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#C5A059]" />
                Shop By
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="text-xs text-[#6E121E] hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>

            {renderFilterControls()}
          </aside>

          {/* MAIN CATALOGUE AREA: Right 9 Columns */}
          <div className="lg:col-span-9 space-y-6">
            {/* Search Toolbar & Sort Controls */}
            <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#E8E0D2] shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, SKU, colour or fabric..."
                    aria-label="Search sarees by name, fabric, craft, or category"
                    className="w-full pl-10 pr-9 py-2.5 bg-white rounded-xl border border-[#E8E0D2] hover:border-[#C5A059] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search text"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C7A6B] hover:text-[#6E121E] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Search by Image Button / Component */}
                <ImageSareeSearch
                  catalogueSarees={sareesList}
                />

                {/* Mobile Filters Drawer Trigger & Sort Dropdown */}
                <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
                  {/* Mobile Filters Drawer Button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E0D2] text-[#6E121E] font-semibold text-xs shadow-xs hover:border-[#C5A059] cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#6E121E] text-white text-[10px] font-bold flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="catalogue-sort"
                      className="text-xs font-semibold text-[#8C7A6B] flex items-center gap-1 whitespace-nowrap"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span className="hidden sm:inline">Sort:</span>
                    </label>
                    <select
                      id="catalogue-sort"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      aria-label="Sort sarees"
                      className="py-2 px-2.5 bg-white rounded-xl border border-[#E8E0D2] hover:border-[#C5A059] text-xs font-medium text-[#2C2420] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] shadow-xs cursor-pointer"
                    >
                      <option value="default">Featured</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {hasActiveFilters && (
                <div className="pt-3 border-t border-[#E8E0D2]/70 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#8C7A6B]">
                    Active Filters:
                  </span>

                  {/* Category Chip */}
                  {selectedCategory !== "all" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#6E121E]/10 text-[#6E121E] border border-[#6E121E]/20">
                      <span>
                        {CATEGORY_OPTIONS.find((c) => c.id === selectedCategory)?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUserCategory("all")}
                        aria-label="Remove category filter"
                        className="hover:text-[#821524] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Price Range Chip */}
                  {selectedPriceRange !== "all" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#C5A059]/15 text-[#2C2420] border border-[#C5A059]/40">
                      <span>
                        {
                          PRICE_RANGE_OPTIONS.find((p) => p.id === selectedPriceRange)
                            ?.label
                        }
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPriceRange("all")}
                        aria-label="Remove price filter"
                        className="hover:text-[#6E121E] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* In Stock Chip */}
                  {inStockOnly && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1E3F34]/10 text-[#1E3F34] border border-[#1E3F34]/20">
                      <span>In Stock</span>
                      <button
                        type="button"
                        onClick={() => setInStockOnly(false)}
                        aria-label="Remove in stock filter"
                        className="hover:text-[#6E121E] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Featured Chip */}
                  {featuredOnly && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]">
                      <span>Featured</span>
                      <button
                        type="button"
                        onClick={() => setFeaturedOnly(false)}
                        aria-label="Remove featured filter"
                        className="hover:text-[#821524] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* New Arrivals Chip */}
                  {newArrivalsOnly && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1E3F34]/15 text-[#1E3F34] border border-[#1E3F34]/30">
                      <span>New Arrivals</span>
                      <button
                        type="button"
                        onClick={() => setNewArrivalsOnly(false)}
                        aria-label="Remove new arrivals filter"
                        className="hover:text-[#6E121E] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Best Sellers Chip */}
                  {bestSellersOnly && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#6E121E]/10 text-[#6E121E] border border-[#6E121E]/30">
                      <span>Best Sellers</span>
                      <button
                        type="button"
                        onClick={() => setBestSellersOnly(false)}
                        aria-label="Remove best sellers filter"
                        className="hover:text-[#821524] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Limited Stock Chip */}
                  {limitedStockOnly && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-300">
                      <span>Limited Stock</span>
                      <button
                        type="button"
                        onClick={() => setLimitedStockOnly(false)}
                        aria-label="Remove limited stock filter"
                        className="hover:text-[#6E121E] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Color Chips */}
                  {selectedColors.map((color) => (
                    <span
                      key={`chip-color-${color}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#6E121E]/10 text-[#6E121E] border border-[#6E121E]/20"
                    >
                      <span className="text-[10px] text-[#8C7A6B] uppercase font-semibold">
                        Color:
                      </span>
                      <span>{color}</span>
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        aria-label={`Remove ${color} color filter`}
                        className="hover:text-[#821524] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Fabric Chips */}
                  {selectedFabrics.map((fabric) => (
                    <span
                      key={`chip-fabric-${fabric}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#C5A059]/15 text-[#2C2420] border border-[#C5A059]/40"
                    >
                      <span className="text-[10px] text-[#8C7A6B] uppercase font-semibold">
                        Fabric:
                      </span>
                      <span>{fabric}</span>
                      <button
                        type="button"
                        onClick={() => removeFabric(fabric)}
                        aria-label={`Remove ${fabric} fabric filter`}
                        className="hover:text-[#6E121E] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Occasion Chips */}
                  {selectedOccasions.map((occasion) => (
                    <span
                      key={`chip-occasion-${occasion}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1E3F34]/10 text-[#1E3F34] border border-[#1E3F34]/20"
                    >
                      <span className="text-[10px] text-[#8C7A6B] uppercase font-semibold">
                        Occasion:
                      </span>
                      <span>{occasion}</span>
                      <button
                        type="button"
                        onClick={() => removeOccasion(occasion)}
                        aria-label={`Remove ${occasion} occasion filter`}
                        className="hover:text-[#6E121E] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Search Query Chip */}
                  {searchQuery.trim() && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-200 text-stone-800 border border-stone-300">
                      <span>&ldquo;{searchQuery.trim()}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        aria-label="Remove search query"
                        className="hover:text-[#6E121E] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Clear All Action */}
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="text-[11px] text-[#6E121E] hover:underline font-semibold ml-auto cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Results Count & Location info */}
            <div className="flex items-center justify-between px-1 text-xs text-[#8C7A6B]">
              <div>
                Showing{" "}
                <strong className="font-bold text-[#1E1715]">
                  {filteredAndSortedSarees.length}
                </strong>{" "}
                {filteredAndSortedSarees.length === 1 ? "saree" : "sarees"}
                {sareesList.length > 0 &&
                  filteredAndSortedSarees.length !== sareesList.length && (
                    <span> (out of {sareesList.length})</span>
                  )}
              </div>

              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Armoor Showroom</span>
              </div>
            </div>

            {/* Product Cards Grid or Empty State */}
            {filteredAndSortedSarees.length > 0 ? (
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-6">
                {filteredAndSortedSarees.map((saree) => (
                  <SareeCard key={saree.id} saree={saree} />
                ))}
              </div>
            ) : sareesList.length === 0 ? (
              /* Database empty state */
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D2] p-10 sm:p-14 text-center my-6 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#F4EFE6] border border-[#C5A059]/30 flex items-center justify-center mx-auto mb-3 text-[#C5A059]">
                  <Sparkles className="w-7 h-7 text-[#C5A059]" />
                </div>
                <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715] mb-2">
                  Showroom Inventory Updating
                </h3>
                <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed mb-6 font-light max-w-md mx-auto">
                  Our store in Armoor, Nizamabad is currently updating live saree items. Contact Gangadhar directly on WhatsApp for direct photos, prices, and video drapes.
                </p>
                <a
                  href={generalWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1E3F34] text-white text-xs font-semibold tracking-wider uppercase btn-premium-whatsapp shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                  <span>Inquire with Gangadhar on WhatsApp</span>
                </a>
              </div>
            ) : (
              /* Filter / Search No-Match State */
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D2] p-10 sm:p-14 text-center my-6 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#F4EFE6] border border-[#C5A059]/30 flex items-center justify-center mx-auto mb-3 text-[#8C7A6B]">
                  <Search className="w-7 h-7 text-[#C5A059]" />
                </div>
                <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715] mb-2">
                  No Sarees Match Selected Filters
                </h3>
                <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed mb-6 font-light max-w-md mx-auto">
                  We could not find any sarees matching your specific category, budget, or search criteria. Try broadening your filter or connect with Gangadhar on WhatsApp for custom assistance.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#6E121E] text-white text-xs font-semibold tracking-wider uppercase shadow-xs cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                  <a
                    href={generalWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-[#C5A059] text-[#2C2420] hover:bg-[#FAF6EE] text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#1E3F34]" />
                    <span>Inquire on WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MOBILE FILTERS SLIDE-OVER DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs bg-[#FAF7F2] h-full shadow-2xl overflow-y-auto p-6 z-10 flex flex-col justify-between border-r border-[#C5A059]/40 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D2] mb-6">
                <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#C5A059]" />
                  Shop By Filters
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-full text-[#8C7A6B] hover:text-[#6E121E]"
                  aria-label="Close filters drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderFilterControls()}
            </div>

            {/* Bottom Actions inside Mobile Drawer */}
            <div className="pt-4 border-t border-[#E8E0D2] flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="w-1/2 py-2.5 px-3 rounded-lg border border-[#E8E0D2] text-[#8C7A6B] text-xs font-semibold cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-1/2 py-2.5 px-3 rounded-lg bg-[#6E121E] text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Apply ({filteredAndSortedSarees.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
