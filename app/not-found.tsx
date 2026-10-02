import Link from "next/link";
import { Layers, ArrowRight, Home, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SHOP_CONFIG, getWhatsAppUrl } from "@/config/shop";

export default function NotFound() {
  const whatsappUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I was looking for a saree on the ${SHOP_CONFIG.brandName} website that is currently unavailable. Could you assist me with similar available sarees?`
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-lg w-full text-center space-y-6 bg-white p-8 sm:p-12 rounded-3xl border border-[#E8E0D2] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40 flex items-center justify-center mx-auto shadow-2xs">
            <Layers className="w-8 h-8 text-[#C5A059]" />
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
              Catalogue Notice
            </p>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
              Saree Not Found or Unavailable
            </h1>
            <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed font-light">
              The saree you are looking for has been removed from our boutique catalogue, archived, or is temporarily unavailable.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sarees"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs"
            >
              <span>Browse All Sarees</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#E8E0D2] bg-white text-[#2C2420] hover:bg-[#FAF6EE] text-xs font-semibold transition"
            >
              <Home className="w-4 h-4 text-[#8C7A6B]" />
              <span>Return Home</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-[#E8E0D2]/60">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-[#25D366] hover:text-[#1eb857] font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Inquire directly on WhatsApp with Gangadhar</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
