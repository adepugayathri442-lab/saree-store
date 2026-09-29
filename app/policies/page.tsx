import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, FileText, ArrowLeft, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getWhatsAppUrl } from "@/config/shop";

export const metadata: Metadata = {
  title: "Boutique Policies | SaiSrujana Saree Store, Armoor",
  description:
    "Privacy Policy, Terms of Service, Shipping & Delivery, and Return/Exchange guidelines for SaiSrujana in Armoor, Nizamabad, Telangana.",
};

export default function PoliciesPage() {
  const whatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I have a question regarding SaiSrujana boutique policies and shipping.`
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      <Navbar />

      <main className="flex-1 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Home Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6E121E] hover:underline mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          {/* Page Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF0DC] border border-[#C5A059]/40 text-[#6E121E] text-xs font-semibold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Customer Assurance</span>
            </div>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E1715] tracking-tight mb-3">
              Boutique Policies & Information
            </h1>
            <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mb-4" />
            <p className="text-sm text-[#5A4E46] font-light max-w-xl mx-auto leading-relaxed">
              Transparent, genuine guidelines for purchases, customization, dispatch, and privacy at SaiSrujana, Armoor.
            </p>
          </div>

          <div className="space-y-12">
            {/* 1. Shipping & Delivery */}
            <section id="shipping" className="bg-[#FAF7F2] p-8 sm:p-10 rounded-2xl border border-[#E8E0D2] shadow-xs scroll-mt-28">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                    Shipping & Delivery Information
                  </h2>
                  <span className="text-[11px] text-[#8C7A6B] uppercase tracking-wider">
                    Safe Courier & Local Pickup
                  </span>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed space-y-3 font-light">
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Showroom Collection:</strong> Patrons in or around Armoor and Nizamabad are welcome to inspect and collect orders directly from our showroom on Armoor Main Road.
                </p>
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Domestic Shipping:</strong> We ship across Telangana and all states in India through reputed courier partners (Professional Couriers, DTDC, India Post Speed Post).
                </p>
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Dispatch Timeline:</strong> Sarees are dispatched within 24 to 48 hours after payment confirmation. Every parcel is securely packed from our Armoor showroom with moisture-proof protective packaging.
                </p>
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Tracking:</strong> Tracking IDs and courier receipts are shared directly with customers via WhatsApp and phone SMS upon dispatch.
                </p>
              </div>
            </section>

            {/* 2. Returns & Exchange */}
            <section id="returns" className="bg-[#FAF7F2] p-8 sm:p-10 rounded-2xl border border-[#E8E0D2] shadow-xs scroll-mt-28">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                    Returns & Exchange Policy
                  </h2>
                  <span className="text-[11px] text-[#8C7A6B] uppercase tracking-wider">
                    Quality Inspection & Fair Policy
                  </span>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed space-y-3 font-light">
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Pre-Dispatch Video Verification:</strong> To ensure complete peace of mind, we share live video clips or photos of the saree before dispatch so you see the exact weave, pallu, and color.
                </p>
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Exchanges for Weaving Defects:</strong> If a saree arrives with an uncharacteristic defect or transit damage, please notify us on WhatsApp (+91 99485 34351) within 48 hours of parcel delivery along with opening photos/video. We will promptly arrange an exchange.
                </p>
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Authentic Boutique Pieces:</strong> All our sarees are genuine, handpicked weaves. Please review fabric details and drape videos carefully before dispatch.
                </p>
              </div>
            </section>

            {/* 3. Privacy Policy */}
            <section id="privacy" className="bg-[#FAF7F2] p-8 sm:p-10 rounded-2xl border border-[#E8E0D2] shadow-xs scroll-mt-28">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                    Privacy Policy
                  </h2>
                  <span className="text-[11px] text-[#8C7A6B] uppercase tracking-wider">
                    Patron Data Protection
                  </span>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed space-y-3 font-light">
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Information Collected:</strong> When you inquire, create an account, or order through our website, we collect your name, phone number, delivery address, and email solely to fulfill your saree inquiry and delivery.
                </p>
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Data Confidentiality:</strong> SaiSrujana does not sell, rent, or lease customer contact details to any third-party marketing companies.
                </p>
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Payment Security:</strong> Online transactions are handled through secure gateways or direct boutique UPI. We never store credit card numbers or banking passwords.
                </p>
              </div>
            </section>

            {/* 4. Terms of Service */}
            <section id="terms" className="bg-[#FAF7F2] p-8 sm:p-10 rounded-2xl border border-[#E8E0D2] shadow-xs scroll-mt-28">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                    Terms of Service
                  </h2>
                  <span className="text-[11px] text-[#8C7A6B] uppercase tracking-wider">
                    Boutique Principles
                  </span>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed space-y-3 font-light">
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Fabric Authenticity:</strong> All product descriptions accurately denote fabric composition (Pattu Silk, Fancy Designer Weave, Artisanal Cotton). Minor variations in slub or texture are characteristic of traditional weaving and testify to authenticity.
                </p>
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Color Representation:</strong> We make every effort to photograph sarees in balanced daylight. Subtle color shifts may appear depending on your mobile screen brightness and calibration.
                </p>
                <p>
                  • <strong className="font-semibold text-[#2C2420]">Jurisdiction:</strong> All legal interactions and agreements are subject to the jurisdiction of the courts in Nizamabad District, Telangana.
                </p>
              </div>
            </section>
          </div>

          {/* Need help footer callout */}
          <div className="mt-14 p-6 rounded-2xl bg-[#FAF6EE] border border-[#C5A059]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h3 className="font-serif-luxury text-base font-bold text-[#1E1715]">
                Have a specific question?
              </h3>
              <p className="text-xs text-[#5A4E46] font-light">
                Connect directly with Gangadhar on WhatsApp for immediate clarification.
              </p>
            </div>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E3F34] hover:bg-[#142B23] text-white text-xs font-semibold transition shadow-xs"
            >
              <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
              <span>WhatsApp Inquiry</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
