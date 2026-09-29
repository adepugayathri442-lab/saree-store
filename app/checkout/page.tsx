import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutView from "@/components/CheckoutView";
import { SHOP_CONFIG } from "@/config/shop";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `Checkout & Place Order | ${SHOP_CONFIG.brandName}, Armoor`,
  description: `Complete your saree purchase with ${SHOP_CONFIG.brandName}. Fast delivery across Armoor, Nizamabad, Telangana and all India.`,
};

function CheckoutFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-serif-luxury text-sm text-[#6E121E]">Loading Checkout...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<CheckoutFallback />}>
          <CheckoutView />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
