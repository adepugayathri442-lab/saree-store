"use client";

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SHOP_CONFIG, getWhatsAppUrl } from "@/config/shop";
import { Saree, SareeCategory } from "@/types/saree";
import { supabase } from "@/lib/supabase/client";
import { DbSareeRow, mapDbRowToSaree } from "@/lib/supabase/sarees";

interface CategorySlideConfig {
  category: SareeCategory;
  collectionName: string;
  categoryBadge: string;
  targetUrl: string;
  fallbackImage: string;
  fallbackText: string;
  accentBadge: string;
}

const CATEGORY_SLIDES: CategorySlideConfig[] = [
  {
    category: "heritage-silks",
    collectionName: "Heritage Silks",
    categoryBadge: "Pattu Sarees",
    targetUrl: "/sarees?category=heritage-silks",
    fallbackImage: "/images/kanchipuram.jpg",
    fallbackText: "Grand traditional pattu silk weaves with pure zari borders crafted for weddings and auspicious occasions.",
    accentBadge: "Wedding & Ceremonial",
  },
  {
    category: "contemporary-elegance",
    collectionName: "Contemporary Elegance",
    categoryBadge: "Fancy Sarees",
    targetUrl: "/sarees?category=contemporary-elegance",
    fallbackImage: "/images/organza.jpg",
    fallbackText: "Lightweight designer fancy drapes blending fashionable silhouettes, delicate motifs, and celebratory allure.",
    accentBadge: "Festive & Party Wear",
  },
  {
    category: "everyday-grace",
    collectionName: "Everyday Grace",
    categoryBadge: "Daily Wear Sarees",
    targetUrl: "/sarees?category=everyday-grace",
    fallbackImage: "/images/handloom.jpg",
    fallbackText: "Comfortable, breathable all-day weaves designed for effortless daily elegance and graceful ease.",
    accentBadge: "Comfort & Daily Wear",
  },
];

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

interface HeroProps {
  initialSarees?: Saree[];
}

export default function Hero({ initialSarees }: HeroProps) {
  const [dbSarees, setDbSarees] = useState<Saree[]>(initialSarees || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Client-side fetch to pull live uploaded saree images from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadSareesFromSupabase() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("sarees")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0 && isMounted) {
          const mapped: Saree[] = (data as DbSareeRow[]).map(mapDbRowToSaree);
          setDbSarees(mapped);
        }
      } catch {
        // Fallback images will be used gracefully
      }
    }

    loadSareesFromSupabase();

    return () => {
      isMounted = false;
    };
  }, []);



  // Map each slide config to real Supabase product when available
  const slides = useMemo(() => {
    return CATEGORY_SLIDES.map((config) => {
      // Find a real saree in this category with an uploaded photo from Supabase
      const realSareeWithUploadedPhoto = dbSarees.find(
        (s) =>
          s.category === config.category &&
          s.image &&
          s.image.trim() !== "" &&
          !s.image.startsWith("/images/")
      );

      // Or any saree with a valid image in this category
      const anySareeWithPhoto = dbSarees.find(
        (s) => s.category === config.category && s.image && s.image.trim() !== ""
      );

      const realSaree =
        realSareeWithUploadedPhoto ||
        (anySareeWithPhoto?.image && !anySareeWithPhoto.image.startsWith("/images/")
          ? anySareeWithPhoto
          : null);

      if (realSaree && realSaree.image) {
        return {
          ...config,
          image: realSaree.image,
          isRealProduct: true,
          displayName: realSaree.name,
          displaySku: realSaree.sku,
          displayText:
            [realSaree.fabric, realSaree.craft].filter(Boolean).join(" • ") || config.fallbackText,
          sourceBadge: "Actual Boutique Piece",
        };
      }

      // No real uploaded photo in Supabase yet -> graceful curated fallback
      return {
        ...config,
        image: config.fallbackImage,
        isRealProduct: false,
        displayName: config.collectionName,
        displaySku: null,
        displayText: config.fallbackText,
        sourceBadge: "Curated Boutique Collection",
      };
    });
  }, [dbSarees]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay rotating every 4.5 seconds (paused on hover or reduced-motion)
  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;

    const timer = setInterval(() => {
      handleNext();
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, handleNext]);

  const currentSlide = slides[currentIndex];

  const heroWhatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am visiting the SaiSrujana website and would like to see your ${currentSlide.collectionName} (${currentSlide.categoryBadge}) collection.`
  );

  return (
    <section id="home" className="relative overflow-hidden bg-[#FAF7F2] py-10 lg:py-16">
      {/* Background Indian ornamental luxury blur accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#6E121E]/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Brand-First SaiSrujana Identity & Story */}
          <div className="lg:col-span-6 flex flex-col justify-center text-center lg:text-left z-10">
            {/* Top Boutique Location Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 text-[#6E121E] text-xs font-semibold tracking-wider self-center lg:self-start mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Saree Store • Armoor, Telangana</span>
            </div>

            {/* Brand Title: Significantly larger, prominent & royal */}
            <h1 className="font-serif-luxury text-4xl min-[360px]:text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl text-[#1E1715] font-bold tracking-tight leading-[1.02] mb-2">
              <span className="text-[#6E121E]">Sai</span>
              <span className="gold-gradient-text">Srujana</span>
            </h1>

            {/* Tagline: Clearly below the brand name */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="h-px w-8 bg-[#C5A059]/60 hidden sm:block" />
              <p className="font-serif-luxury text-xl sm:text-2xl md:text-3xl italic text-[#C5A059] font-medium tracking-wide">
                “{SHOP_CONFIG.tagline}”
              </p>
              <div className="h-px w-8 bg-[#C5A059]/60 hidden sm:block" />
            </div>

            {/* Clear Description that SaiSrujana is a real saree boutique in Armoor */}
            <p className="text-sm sm:text-base lg:text-lg text-[#5A4E46] leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-light">
              Welcome to <span className="font-semibold text-[#1E1715]">SaiSrujana</span>, your trusted saree boutique in Armoor, Nizamabad.
              Explore our handpicked collection of <span className="font-medium text-[#6E121E]">Pattu Sarees</span> (Heritage Silks), stylish <span className="font-medium text-[#6E121E]">Fancy Sarees</span> (Contemporary Elegance), and soft <span className="font-medium text-[#6E121E]">Daily Wear Sarees</span> (Everyday Grace) selected for every sacred occasion and celebration.
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
              <Link
                href="/sarees"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#6E121E] hover:bg-[#821524] text-white text-xs tracking-[0.2em] uppercase font-semibold rounded-sm shadow-md btn-premium-primary flex items-center justify-center gap-3 group border border-[#821524]"
              >
                <span>Explore All Sarees</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 text-[#E5D2A4]" />
              </Link>
              <Link
                href={currentSlide.targetUrl}
                className="w-full sm:w-auto px-6 py-3.5 bg-transparent hover:bg-[#FAF6EE] text-[#2C2420] text-xs tracking-[0.16em] uppercase font-semibold rounded-sm border border-[#C5A059] btn-premium-outline flex items-center justify-center gap-2 group"
              >
                <span>View {currentSlide.categoryBadge}</span>
                <ChevronRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Genuine Contact Badges */}
            <div className="pt-6 border-t border-[#E8E0D2] grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5">
                <MapPin className="w-5 h-5 text-[#C5A059] flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#2C2420]">Store in Armoor</h4>
                  <p className="text-[11px] text-[#8C7A6B]">Nizamabad, Telangana</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5">
                <Phone className="w-5 h-5 text-[#C5A059] flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#2C2420]">{SHOP_CONFIG.contactPerson}</h4>
                  <a
                    href={`tel:${SHOP_CONFIG.phone}`}
                    className="text-[11px] text-[#8C7A6B] hover:text-[#6E121E] transition-colors"
                  >
                    {SHOP_CONFIG.phoneFormatted}
                  </a>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5">
                <MessageCircle className="w-5 h-5 text-[#1E3F34] flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#2C2420]">WhatsApp Enquiry</h4>
                  <a
                    href={heroWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#1E3F34] font-medium hover:underline"
                  >
                    Direct photo & price
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Rotating Saree Carousel Showcase */}
          <div
            className="lg:col-span-6 relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Decorative Luxury Gold Border Frame */}
              <div className="absolute -inset-2.5 sm:-inset-3.5 rounded-2xl border-2 border-[#C5A059]/40 translate-x-2 translate-y-2 pointer-events-none" />

              {/* Main Carousel Frame Container */}
              <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] w-full rounded-xl overflow-hidden shadow-2xl bg-stone-900 border border-[#C5A059]/40">
                {/* Horizontal sliding track: Prevents ghosting/overlap, ensures single active slide */}
                <div
                  className="flex w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
                    transitionDuration: prefersReducedMotion ? "0ms" : "700ms",
                  }}
                >
                  {slides.map((slide, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                      <div
                        key={slide.category}
                        aria-hidden={!isActive}
                        className="w-full h-full min-w-full relative flex-shrink-0"
                      >
                        {/* Slide Image Link to the Category Filter */}
                        <Link
                          href={slide.targetUrl}
                          aria-label={`Explore ${slide.collectionName} (${slide.categoryBadge}) collection`}
                          tabIndex={isActive ? 0 : -1}
                          className="block relative w-full h-full group/slide focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:ring-inset cursor-pointer"
                        >
                          <Image
                            src={slide.image}
                            alt={`${slide.displayName} - ${slide.categoryBadge} at SaiSrujana, Armoor`}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover object-top transition-transform duration-700 ease-out group-hover/slide:scale-[1.03]"
                          />

                          {/* Top Gradient Shadow for badge contrast */}
                          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                          {/* Bottom Gradient Shadow for text card contrast */}
                          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                          {/* Top Left: Category Badge */}
                          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                            <span className="bg-[#FAF7F2]/95 backdrop-blur-md px-3 py-1.5 rounded text-xs uppercase tracking-wider font-bold text-[#6E121E] border border-[#C5A059]/40 shadow-sm">
                              {slide.categoryBadge}
                            </span>
                            <span className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] text-[#E5D2A4] font-medium border border-white/10 hidden sm:inline">
                              {slide.accentBadge}
                            </span>
                          </div>

                          {/* Top Right: Real Saree vs Curated Collection Indicator */}
                          <div className="absolute top-4 right-4 z-20">
                            <span className="inline-flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded text-[11px] text-[#A7F3D0] border border-[#A7F3D0]/30 shadow-xs font-medium">
                              <Sparkles className="w-3 h-3 text-[#A7F3D0]" />
                              <span>{slide.sourceBadge}</span>
                            </span>
                          </div>

                          {/* Floating Bottom Card: Synchronized directly with each slide to eliminate text desync */}
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 z-20 bg-[#FAF7F2]/95 backdrop-blur-md p-2.5 sm:p-4 rounded-xl border border-[#C5A059]/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] tracking-wider uppercase font-bold text-[#6E121E]">
                                  {slide.collectionName}
                                </span>
                                {slide.displaySku && (
                                  <span className="text-[10px] font-mono text-[#8C7A6B] bg-[#EFE9DE] px-1.5 py-0.5 rounded">
                                    SKU: {slide.displaySku}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-serif-luxury text-sm sm:text-lg font-bold text-[#1E1715] truncate">
                                {slide.displayName}
                              </h3>
                              <p className="text-[11px] sm:text-xs text-[#5A4E46] line-clamp-1 font-light">
                                {slide.displayText}
                              </p>
                            </div>

                            <div className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#6E121E] hover:bg-[#821524] text-white text-[11px] sm:text-xs font-semibold tracking-wider uppercase rounded-md shadow-md transition-all group/btn border border-[#821524]">
                              <span>Explore Collection</span>
                              <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#E5D2A4] group-hover/btn:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* Manual Navigation Controls: Previous / Next Arrows */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePrev();
                  }}
                  aria-label="Previous saree collection"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/55 hover:bg-black/85 backdrop-blur-sm text-white flex items-center justify-center border border-white/20 transition-all opacity-85 hover:opacity-100 shadow-md cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNext();
                  }}
                  aria-label="Next saree collection"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/55 hover:bg-black/85 backdrop-blur-sm text-white flex items-center justify-center border border-white/20 transition-all opacity-85 hover:opacity-100 shadow-md cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Collection Indicator Pills below the Carousel */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4">
                {slides.map((s, idx) => {
                  const isSelected = idx === currentIndex;
                  return (
                    <button
                      key={s.category}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-label={`Show ${s.collectionName} (${s.categoryBadge})`}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? "bg-[#6E121E] text-white shadow-sm ring-1 ring-[#C5A059]"
                          : "bg-[#FAF7F2] text-[#8C7A6B] hover:text-[#1E1715] hover:bg-[#F2ECE1] border border-[#E8E0D2]"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          isSelected
                            ? "bg-[#C5A059] scale-125"
                            : "bg-[#8C7A6B]/50 group-hover:bg-[#8C7A6B]"
                        }`}
                      />
                      <span className="text-[11px] font-semibold">{s.categoryBadge}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
