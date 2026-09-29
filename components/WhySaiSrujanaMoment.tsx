"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function WhySaiSrujanaMoment() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#FDFBF7] border-t border-[#E8E0D2] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#6E121E] bg-[#FAF0DC] px-4 py-1.5 rounded-full mb-4 border border-[#C5A059]/40 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>The Boutique Promise</span>
        </div>

        <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-[#1E1715] font-bold tracking-tight mb-5 leading-tight">
          More Than A Saree
        </h2>

        <div className="w-20 h-0.5 bg-[#C5A059] mx-auto mb-6" />

        <p className="font-serif-luxury text-lg sm:text-xl md:text-2xl text-[#6E121E] italic font-medium leading-relaxed mb-6 max-w-3xl mx-auto">
          &ldquo;From choosing the weave to preparing your saree for the occasion, SaiSrujana brings the boutique experience closer to you.&rdquo;
        </p>

        <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed max-w-2xl mx-auto mb-8">
          Whether you visit us in Armoor or consult remotely through WhatsApp video calls, we ensure your saree arrives with pure fabric, authentic borders, and dedicated boutique care.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sarees"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-[0.18em] transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 group border border-[#821524]"
          >
            <span>Explore All Sarees</span>
            <ArrowRight className="w-4 h-4 text-[#E5D2A4] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/about"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-transparent hover:bg-[#FAF7F2] text-[#2C2420] text-xs font-semibold uppercase tracking-[0.16em] transition border border-[#C5A059] inline-flex items-center justify-center gap-2"
          >
            <span>Our Armoor Boutique</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
