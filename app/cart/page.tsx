import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartView from "@/components/CartView";
import { SHOP_CONFIG } from "@/config/shop";

export const metadata: Metadata = {
  title: `Your Shopping Cart & Saree Inquiry | ${SHOP_CONFIG.brandName}, Armoor`,
  description: `Review your handpicked saree selection from ${SHOP_CONFIG.brandName}, Armoor, Nizamabad. Send your delivery details and enquiry directly to Gangadhar on WhatsApp.`,
  openGraph: {
    title: `Your Saree Inquiry Bag | ${SHOP_CONFIG.brandName}`,
    description: `Review your selected Pattu, Fancy, and Daily Wear sarees from ${SHOP_CONFIG.brandName} in Armoor.`,
  },
};

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      {/* Sticky Responsive Navbar */}
      <Navbar />

      {/* Main Cart & Order Flow */}
      <main className="flex-1">
        <CartView />
      </main>

      {/* Professional Boutique Footer */}
      <Footer />
    </div>
  );
}
