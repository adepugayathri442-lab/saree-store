"use client";

import { MessageCircle, Phone, Sparkles } from "lucide-react";
import { SHOP_CONFIG, getWhatsAppUrl } from "@/config/shop";

export default function WhatsAppAssistance() {
  const whatsAppUrl = getWhatsAppUrl(
    `Hello ${SHOP_CONFIG.contactPerson} garu, I am visiting the SaiSrujana website and would like assistance choosing a saree.`
  );

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2] border-t border-[#E8E0D2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#1E3F34] via-[#142B23] to-[#590D18] text-white rounded-3xl p-8 sm:p-12 lg:p-14 shadow-2xl border border-[#C5A059]/40 relative overflow-hidden">
          {/* Decorative luxury radial glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#A7F3D0] text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Boutique Assistance</span>
              </div>

              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Need Help Choosing Your Saree?
              </h2>

              <p className="text-base sm:text-lg text-[#D1E7DD] font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                Talk to SaiSrujana for product details, availability and boutique assistance.
              </p>

              <p className="text-xs text-[#E5D2A4] font-light">
                Direct consultation with proprietor <span className="font-semibold text-white">{SHOP_CONFIG.contactPerson}</span> from our Armoor showroom.
              </p>
            </div>

            {/* Right Action Box */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
              <div className="bg-black/30 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/20 text-center w-full max-w-md shadow-xl">
                <div className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-white/20">
                  <MessageCircle className="w-7 h-7" />
                </div>

                <h3 className="font-serif-luxury text-xl font-bold text-white mb-1">
                  Connect on WhatsApp
                </h3>
                <p className="text-xs text-[#A7F3D0] mb-6">
                  Online for Saree Inquiries • Armoor Showroom
                </p>

                <div className="space-y-3 w-full">
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-[1.02] active:scale-98"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${SHOP_CONFIG.phone}`}
                    className="w-full py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider transition flex items-center justify-center gap-2 border border-white/20"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#E5D2A4]" />
                    <span>Call: {SHOP_CONFIG.phoneFormatted}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
