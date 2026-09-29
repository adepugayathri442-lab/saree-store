import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderConfirmationView from "@/components/OrderConfirmationView";
import { SHOP_CONFIG } from "@/config/shop";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `Order Confirmation | ${SHOP_CONFIG.brandName}, Armoor`,
  description: `Your saree order has been placed successfully with ${SHOP_CONFIG.brandName}. Direct updates and tracking with Gangadhar on WhatsApp.`,
};

function ConfirmationFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-serif-luxury text-sm text-[#6E121E]">Loading Order Details...</p>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<ConfirmationFallback />}>
          <OrderConfirmationView />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
