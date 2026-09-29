"use client";

import {
  Sparkles,
  Video,
  ShieldCheck,
  MapPin,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";

const TRUST_FEATURES = [
  {
    icon: Sparkles,
    title: "Handpicked Authentic Weaves",
    description:
      "Every Pattu, Fancy, and Daily Wear saree in our showroom is personally curated by Gangadhar for pure fabric, fine weave, and radiant finish.",
  },
  {
    icon: Video,
    title: "WhatsApp Video Drape Previews",
    description:
      "Cannot visit the Armoor store? Request a live WhatsApp video call to inspect the pallu, zari sheen, and drape in natural boutique light.",
  },
  {
    icon: ShieldCheck,
    title: "Genuine Weaves & Honest Pricing",
    description:
      "Direct boutique curation ensures authentic silk weaves, rich borders, and transparent pricing without hidden markups or middlemen.",
  },
  {
    icon: MapPin,
    title: "Physical Armoor Showroom",
    description:
      "Visit our store in Armoor, Nizamabad to feel fabrics in person, compare borders side-by-side, and enjoy traditional boutique hospitality.",
  },
  {
    icon: MessageCircle,
    title: "Direct Boutique Consultation",
    description:
      "No impersonal chatbots. You connect directly with Gangadhar on phone or WhatsApp for honest pricing, color matching, and guidance.",
  },
  {
    icon: ShoppingBag,
    title: "Curated Cart & Order Tracking",
    description:
      "Easily save your favorite sarees to your wishlist, manage your cart, and track boutique order confirmations with total peace of mind.",
  },
];

export default function WhyShopWithUs() {
  return (
    <section className="py-20 bg-[#FAF7F2] border-t border-[#E8E0D2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#8C7A6B] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>The SaiSrujana Experience</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-4">
            Why Shop With Us
          </h2>
          <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mb-4" />
          <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed">
            From our family boutique in Armoor to your wardrobe, we combine traditional weaver relationships with personalized modern care.
          </p>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TRUST_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-[#FDFBF7] p-8 rounded-2xl border border-[#E8E0D2] hover:border-[#C5A059]/60 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FAF0DC] group-hover:bg-[#6E121E] text-[#6E121E] group-hover:text-[#E5D2A4] flex items-center justify-center mb-5 transition-all duration-300 shadow-2xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif-luxury text-lg font-bold text-[#1E1715] mb-2 group-hover:text-[#6E121E] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed font-light">
                    {feature.description}
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
