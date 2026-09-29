import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, MessageCircle, ArrowRight, Layers, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SHOP_CONFIG, getWhatsAppUrl } from "@/config/shop";

export const metadata: Metadata = {
  title: "About Us | SaiSrujana Saree Store, Armoor",
  description:
    "Learn about SaiSrujana, an authentic saree boutique in Armoor, Nizamabad, Telangana managed by Gangadhar. Handpicked Pattu, Fancy & Daily Wear sarees.",
};

export default function AboutPage() {
  const whatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am visiting the SaiSrujana About page and would like to learn more about your boutique.`
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Header */}
        <section className="relative py-16 sm:py-24 bg-[#FAF7F2] border-b border-[#E8E0D2] overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#6E121E]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 text-[#6E121E] text-xs font-semibold tracking-widest uppercase mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Boutique Heritage • Armoor, Telangana</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1E1715] tracking-tight mb-4">
              Our Story & Heritage
            </h1>
            <p className="font-serif-luxury text-xl sm:text-2xl italic text-[#C5A059] mb-6">
              &ldquo;{SHOP_CONFIG.tagline}&rdquo;
            </p>
            <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mb-6" />

            <p className="text-base sm:text-lg text-[#5A4E46] font-light leading-relaxed max-w-2xl mx-auto">
              Welcome to <span className="font-semibold text-[#1E1715]">SaiSrujana</span>, where each saree is selected with reverence for traditional craftsmanship and personal dedication to our patrons.
            </p>
          </div>
        </section>

        {/* Narrative & Boutique Pillars */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
              <div className="lg:col-span-6 space-y-6 text-[#5A4E46] leading-relaxed font-light">
                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] tracking-tight">
                  Handpicked Weaves from Armoor
                </h2>
                <p>
                  Located in the vibrant town of <span className="font-semibold text-[#2C2420]">Armoor, Nizamabad District, Telangana</span>, SaiSrujana is managed by <span className="font-semibold text-[#6E121E]">Gangadhar</span>. We take pride in building direct, respectful relationships with handloom artisans and master weavers.
                </p>
                <p>
                  Whether you are seeking a magnificent <span className="font-medium text-[#2C2420]">Heritage Silk (Pattu)</span> saree for an auspicious wedding, an airy designer <span className="font-medium text-[#2C2420]">Contemporary Fancy</span> saree for a social soirée, or a soft <span className="font-medium text-[#2C2420]">Everyday Grace</span> drape, our goal is to offer pieces that embody beauty and longevity.
                </p>
                <p>
                  We believe shopping for a saree should be deeply personalized. Customers can visit our physical Armoor showroom to inspect fabrics in person or request direct WhatsApp live drape sessions from anywhere across India.
                </p>
              </div>

              <div className="lg:col-span-6">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#C5A059]/40 bg-stone-100">
                  <Image
                    src="/images/kanchipuram.jpg"
                    alt="SaiSrujana Handcrafted Silk Saree Weaves"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#E5D2A4] block">
                      Authentic Weaves
                    </span>
                    <p className="font-serif-luxury text-lg font-bold">
                      SaiSrujana Saree Store, Armoor
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Three Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="p-8 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] shadow-xs hover:border-[#C5A059] transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center mb-5">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715] mb-2">
                  Heritage Silks (Pattu)
                </h3>
                <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed font-light">
                  Lustrous pure zari borders and timeless traditional motifs handpicked for weddings, pujas, and milestone ceremonies.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] shadow-xs hover:border-[#C5A059] transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center mb-5">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715] mb-2">
                  Contemporary Elegance
                </h3>
                <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed font-light">
                  Chic silhouettes, modern organza, georgette, and designer weaves styled for receptions, parties, and festive celebrations.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] shadow-xs hover:border-[#C5A059] transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715] mb-2">
                  Everyday Grace
                </h3>
                <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed font-light">
                  Soft, breathable, lightweight weaves created for effortless all-day comfort, workplace poise, and daily elegance.
                </p>
              </div>
            </div>

            {/* Visit Store Callout */}
            <div className="bg-[#FAF6EE] p-8 sm:p-12 rounded-3xl border border-[#C5A059]/40 shadow-sm text-center max-w-3xl mx-auto">
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] mb-3">
                Visit Our Showroom in Armoor
              </h3>
              <p className="text-sm text-[#5A4E46] mb-6 font-light max-w-xl mx-auto">
                We warmly welcome you to explore our sarees in person. Feel the texture, compare drapes, and experience genuine boutique service with Gangadhar.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/sarees"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider transition shadow-md"
                >
                  <span>Explore Our Sarees</span>
                  <ArrowRight className="w-4 h-4 text-[#E5D2A4]" />
                </Link>

                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1E3F34] hover:bg-[#142B23] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                  <span>WhatsApp Gangadhar</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
