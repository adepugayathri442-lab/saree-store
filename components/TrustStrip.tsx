"use client";

import { Sparkles, HeartHandshake, MessageCircle, MapPin } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Sparkles,
    title: "Handpicked Collections",
    subtitle: "Authentic Pattu & designer weaves",
  },
  {
    icon: HeartHandshake,
    title: "Boutique Assistance",
    subtitle: "Personal attention from Gangadhar",
  },
  {
    icon: MessageCircle,
    title: "Direct WhatsApp Enquiry",
    subtitle: "Direct video drape & availability checks",
  },
  {
    icon: MapPin,
    title: "In-Store Experience",
    subtitle: "Showroom visit in Armoor, Telangana",
  },
];

export default function TrustStrip() {
  return (
    <section aria-label="Boutique Services & Trust" className="bg-[#FAF6EE] border-y border-[#E8E0D2] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {TRUST_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 sm:gap-4 p-1 sm:p-0"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#FAF7F2] border border-[#C5A059]/40 text-[#6E121E] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Icon className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-serif-luxury font-bold text-[#1E1715] leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#8C7A6B] font-light mt-0.5 leading-tight">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
