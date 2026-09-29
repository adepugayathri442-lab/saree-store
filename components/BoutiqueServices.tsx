"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Eye, MessageCircle, HeartHandshake } from "lucide-react";
import { SHOP_CONFIG } from "@/config/shop";

const ASSISTANCE_FEATURES = [
  {
    icon: Sparkles,
    title: "Saree Selection Assistance",
    tagline: "Personalized Weave & Style Guidance",
    description:
      `Unsure about the weave, border, or drape for an upcoming event? Get dedicated recommendations from ${SHOP_CONFIG.contactPerson} tailored to your wedding, festival, or family occasion.`,
  },
  {
    icon: Eye,
    title: "Product & Availability Enquiry",
    tagline: "Real-Time Showroom Inventory",
    description:
      "Verify active stock at our Armoor showroom, confirm prices, and check available color variations directly with authentic clarity.",
  },
  {
    icon: MessageCircle,
    title: "Direct WhatsApp & Video Previews",
    tagline: "Live Video Drape Verification",
    description:
      `Connect directly with ${SHOP_CONFIG.contactPerson} on WhatsApp to request high-definition video previews, close-up pallu shots, and natural-light color checks before you decide.`,
  },
];

export default function BoutiqueServices() {
  return (
    <section id="boutique-services" className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2] border-t border-[#E8E0D2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF6EE] rounded-3xl p-8 sm:p-12 lg:p-16 border border-[#C5A059]/40 shadow-xl relative overflow-hidden">
          {/* Subtle background ornament */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 relative z-10">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#6E121E] bg-[#FAF0DC] px-4 py-1.5 rounded-full mb-3 border border-[#C5A059]/40 shadow-2xs">
              <HeartHandshake className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Personal Care &amp; Guidance</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-4">
              Personal Boutique Assistance
            </h2>
            <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mb-4" />
            <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed">
              Every saree in our Armoor boutique is backed by direct personal assistance. Connect with Gangadhar for expert guidance, product availability, and video drape verification.
            </p>
          </div>

          {/* 3 Genuine Assistance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative z-10 mb-12">
            {ASSISTANCE_FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#FAF7F2] p-7 rounded-2xl border border-[#E8E0D2] hover:border-[#C5A059] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#FAF0DC] text-[#6E121E] group-hover:bg-[#6E121E] group-hover:text-[#E5D2A4] flex items-center justify-center mb-5 transition-colors shadow-2xs">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715] mb-2 group-hover:text-[#6E121E] transition-colors">
                      {feature.title}
                    </h3>

                    <div className="inline-block bg-[#FAF0DC]/70 border border-[#C5A059]/30 text-[#6E121E] text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md mb-3">
                      {feature.tagline}
                    </div>

                    <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed font-light">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Call to Action Row */}
          <div className="text-center relative z-10 pt-4 border-t border-[#E8E0D2]">
            <Link
              href="/sarees"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-xl group border border-[#821524]"
            >
              <span>Explore All Sarees</span>
              <ArrowRight className="w-4 h-4 text-[#E5D2A4] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
