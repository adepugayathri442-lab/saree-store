import Link from "next/link";
import { Sparkles, MapPin, Phone, MessageCircle, Layers, ArrowRight } from "lucide-react";
import { SHOP_CONFIG, getWhatsAppUrl } from "@/config/shop";

export default function AboutSection() {
  const whatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am contacting you from SaiSrujana website to learn more about your saree store.`
  );

  return (
    <section id="about" className="py-20 bg-[#FAF7F2] border-t border-[#E8E0D2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#8C7A6B] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Saree Store • Armoor</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-3">
              {SHOP_CONFIG.about.title}
            </h2>
            <p className="text-sm font-semibold tracking-widest text-[#C5A059] uppercase mb-4">
              &ldquo;{SHOP_CONFIG.tagline}&rdquo;
            </p>
            <div className="w-24 h-0.5 bg-[#C5A059] mx-auto" />
          </div>

          {/* About Story Box */}
          <div className="bg-[#FAF6EE] rounded-2xl p-8 sm:p-12 border border-[#E8E0D2] shadow-sm">
            <div className="text-[#5A4E46] leading-relaxed text-base sm:text-lg font-light mb-8 space-y-4">
              <p className="border-l-4 border-[#C5A059] pl-4 text-[#2C2420] font-normal">
                {SHOP_CONFIG.about.story}
              </p>
              <p className="text-sm sm:text-base text-[#5A4E46]">
                Our store is conveniently located in <span className="font-semibold text-[#2C2420]">{SHOP_CONFIG.cityState}</span>. We are happy to showcase our latest sarees in person or assist you remotely through phone calls and WhatsApp inquiries.
              </p>
            </div>

            {/* Three Core Saree Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#E8E0D2]">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E0D2] hover:border-[#C5A059] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300">
                <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 flex items-center justify-center mb-3 text-[#C5A059]">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-[#2C2420] mb-1">Pattu Sarees</h4>
                <p className="text-xs text-[#8C7A6B] leading-relaxed">
                  Traditional silk sarees for weddings, ceremonies, and family occasions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E0D2] hover:border-[#C5A059] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300">
                <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 flex items-center justify-center mb-3 text-[#C5A059]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-[#2C2420] mb-1">Fancy Sarees</h4>
                <p className="text-xs text-[#8C7A6B] leading-relaxed">
                  Stylish and modern designer sarees for parties, receptions, and functions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E0D2] hover:border-[#C5A059] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300">
                <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 flex items-center justify-center mb-3 text-[#C5A059]">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-[#2C2420] mb-1">Daily Wear Sarees</h4>
                <p className="text-xs text-[#8C7A6B] leading-relaxed">
                  Comfortable, lightweight, and easy-drape sarees for everyday wear.
                </p>
              </div>
            </div>

            {/* Quick Contact & Action Row */}
            <div className="mt-8 pt-6 border-t border-[#E8E0D2] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <span className="text-[#5A4E46]">
                Proprietor:{" "}
                <a
                  href={`tel:${SHOP_CONFIG.phone}`}
                  className="font-semibold text-[#6E121E] hover:underline"
                  title={`Call ${SHOP_CONFIG.contactPerson}`}
                >
                  {SHOP_CONFIG.contactPerson}
                </a>{" "}
                •{" "}
                <a
                  href={SHOP_CONFIG.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2C2420] hover:text-[#6E121E] underline decoration-[#C5A059]"
                  title="View store in Google Maps"
                >
                  {SHOP_CONFIG.cityState}
                </a>
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#6E121E] text-white hover:bg-[#821524] text-xs font-semibold tracking-wider transition-colors shadow-2xs"
                >
                  <span>Discover Our Story</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E5D2A4]" />
                </Link>

                <a
                  href={`tel:${SHOP_CONFIG.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#C5A059] text-[#2C2420] hover:bg-[#FAF7F2] btn-premium-outline font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Call {SHOP_CONFIG.phoneFormatted}</span>
                </a>

                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1E3F34] text-white btn-premium-whatsapp font-medium shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
