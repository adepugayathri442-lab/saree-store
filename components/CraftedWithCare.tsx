"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, HeartHandshake, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import { SHOP_CONFIG } from "@/config/shop";
import { Saree } from "@/types/saree";

interface CraftedWithCareProps {
  sarees?: Saree[];
}

export default function CraftedWithCare({ sarees = [] }: CraftedWithCareProps) {
  // Use a real uploaded saree image if available, or fall back to high-res boutique saree photo
  const sareeWithUpload = sarees.find(
    (s) => s.image && s.image.trim() !== "" && !s.image.startsWith("/images/")
  );
  const storyImage = sareeWithUpload?.image || "/images/kanchipuram.jpg";

  return (
    <section className="py-20 lg:py-28 bg-[#FAF7F2] border-t border-[#E8E0D2] relative overflow-hidden">
      {/* Background Subtle Accent Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#6E121E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT: Real Saree / Boutique Image with Luxury Frame */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative Gold Frame Offset */}
              <div className="absolute -inset-3 rounded-2xl border-2 border-[#C5A059]/40 translate-x-3 translate-y-3 pointer-events-none hidden sm:block" />

              {/* Main Image Container */}
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-2xl bg-stone-900 border border-[#C5A059]/50">
                <Image
                  src={storyImage}
                  alt={`Handpicked Saree Craftsmanship at SaiSrujana, Armoor`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top transition-transform duration-700 hover:scale-105"
                />

                {/* Subtle dark gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                {/* Location Badge on Image */}
                <div className="absolute bottom-5 left-5 right-5 z-10 bg-[#FAF7F2]/95 backdrop-blur-md p-4 rounded-xl border border-[#C5A059]/40 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#C5A059]" />
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider text-[#6E121E]">
                        Armoor Showroom
                      </p>
                      <p className="text-xs text-[#5A4E46]">
                        {SHOP_CONFIG.cityState}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#8C7A6B] bg-[#EFE9DE] px-2 py-1 rounded">
                    Est. Boutique
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Short Authentic Boutique Story */}
          <div className="lg:col-span-6 flex flex-col justify-center text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0DC] border border-[#C5A059]/40 text-[#6E121E] text-xs font-semibold tracking-wider uppercase self-center lg:self-start mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Authentic Saree Heritage</span>
            </div>

            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-4 leading-tight">
              Crafted With Care
            </h2>

            <p className="font-serif-luxury text-lg sm:text-xl text-[#C5A059] italic mb-6">
              &ldquo;{SHOP_CONFIG.tagline}&rdquo;
            </p>

            <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed mb-6">
              At <strong className="font-semibold text-[#1E1715]">SaiSrujana</strong>, every drape begins with a deep appreciation for the weaver&apos;s art. Located in Armoor, Nizamabad, our boutique handpicks authentic sarees directly to bring you timeless elegance for your sacred moments and celebrations.
            </p>

            {/* Core Values Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F5EFE6]/60 border border-[#E8E0D2]">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#1E1715]">Handpicked Sarees</h4>
                  <p className="text-[11px] text-[#5A4E46] mt-0.5 font-light">
                    Every piece inspected for fabric purity, weave density and zari lustre.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F5EFE6]/60 border border-[#E8E0D2]">
                <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#1E1715]">Traditional Craftsmanship</h4>
                  <p className="text-[11px] text-[#5A4E46] mt-0.5 font-light">
                    Honoring heritage handlooms, pure zari borders, and classic motifs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F5EFE6]/60 border border-[#E8E0D2]">
                <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#1E1715]">Contemporary Styling</h4>
                  <p className="text-[11px] text-[#5A4E46] mt-0.5 font-light">
                    Chic designer party drapes and lightweight festive creations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F5EFE6]/60 border border-[#E8E0D2]">
                <HeartHandshake className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#1E1715]">Boutique Assistance</h4>
                  <p className="text-[11px] text-[#5A4E46] mt-0.5 font-light">
                    Personalized consultation with proprietor {SHOP_CONFIG.contactPerson}.
                  </p>
                </div>
              </div>
            </div>

            {/* Discover SaiSrujana CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-[0.18em] transition-all shadow-md hover:shadow-lg group border border-[#821524]"
              >
                <span>Discover SaiSrujana</span>
                <ArrowRight className="w-4 h-4 text-[#E5D2A4] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
