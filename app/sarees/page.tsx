import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SareesCatalogue from "@/components/SareesCatalogue";
import RecentlyViewed from "@/components/RecentlyViewed";
import { SHOP_CONFIG } from "@/config/shop";
import { fetchSareesFromDb } from "@/lib/supabase/sarees";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `Explore Our Sarees | ${SHOP_CONFIG.brandName} Saree Store, Armoor`,
  description: `Browse ${SHOP_CONFIG.brandName}'s saree catalogue featuring Heritage Silks (Pattu Sarees), Contemporary Elegance (Fancy Sarees), and Everyday Grace (Daily Wear Sarees) in Armoor, Nizamabad, Telangana.`,
  alternates: {
    canonical: "/sarees",
  },
  openGraph: {
    title: `Explore Our Sarees | ${SHOP_CONFIG.brandName}`,
    description: `Browse ${SHOP_CONFIG.brandName}'s saree catalogue featuring Heritage Silks, Contemporary Elegance, and Everyday Grace in Armoor, Telangana.`,
  },
};

function SareesLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-serif-luxury text-base text-[#6E121E]">Loading Saree Catalogue...</p>
        <p className="text-xs text-[#8C7A6B] mt-1">{SHOP_CONFIG.brandName} • Armoor</p>
      </div>
    </div>
  );
}

export default async function SareesPage() {
  const sarees = await fetchSareesFromDb();

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      {/* Sticky Responsive Navbar */}
      <Navbar />

      {/* Main Catalogue with Suspense boundary for search params */}
      <main className="flex-1">
        <Suspense fallback={<SareesLoadingFallback />}>
          <SareesCatalogue initialSarees={sarees} />
        </Suspense>

        {/* Recently Viewed Sarees Section */}
        <RecentlyViewed className="border-t border-[#E8E0D2] bg-white/50" />
      </main>

      {/* Professional Footer */}
      <Footer />
    </div>
  );
}
