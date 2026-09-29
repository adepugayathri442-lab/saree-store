"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import FeaturedCollections from "@/components/FeaturedCollections";
import DiscoverYourSaree from "@/components/DiscoverYourSaree";
import NewArrivals from "@/components/NewArrivals";
import FeaturedSarees from "@/components/FeaturedSarees";
import BestSellers from "@/components/BestSellers";
import CraftedWithCare from "@/components/CraftedWithCare";
import ShopByOccasion from "@/components/ShopByOccasion";
import BoutiqueServices from "@/components/BoutiqueServices";
import WhySaiSrujanaMoment from "@/components/WhySaiSrujanaMoment";
import ShopByPrice from "@/components/ShopByPrice";
import WhatsAppAssistance from "@/components/WhatsAppAssistance";
import InstagramGallery from "@/components/InstagramGallery";
import RecentlyViewed from "@/components/RecentlyViewed";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { Saree, SareeCategory } from "@/types/saree";
import { FEATURED_SAREES } from "@/data/sarees";
import { useCart } from "@/context/CartContext";
import { createBrowserClient } from "@/lib/supabase/client";
import { DbSareeRow, mapDbRowToSaree } from "@/lib/supabase/sarees";

export default function Home() {
  const { addToCart } = useCart();
  const [activeSareeModal, setActiveSareeModal] = useState<Saree | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SareeCategory | "all">("all");
  const [sarees, setSarees] = useState<Saree[]>(FEATURED_SAREES);

  useEffect(() => {
    let isMounted = true;

    async function loadSarees() {
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from("sarees")
          .select("*")
          .order("created_at", { ascending: false });

        if (!isMounted) return;

        if (!error && data && data.length > 0) {
          setSarees((data as DbSareeRow[]).map(mapDbRowToSaree));
        } else if (error) {
          console.warn("Supabase sarees notice (using curated boutique fallback):", error.message);
          setSarees(FEATURED_SAREES);
        } else {
          setSarees(FEATURED_SAREES);
        }
      } catch (err) {
        console.warn("Homepage sarees notice (using curated boutique fallback):", err);
        if (isMounted) {
          setSarees(FEATURED_SAREES);
        }
      }
    }

    loadSarees();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (saree: Saree) => {
    addToCart(saree, 1);
  };

  const handleOpenSareeModal = (saree: Saree | null) => {
    setActiveSareeModal(saree);
  };

  const handleSelectCollection = (categoryId: SareeCategory) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420] overflow-x-hidden">
      {/* 1. Responsive Navbar with Brand "SaiSrujana", Search, Wishlist, Cart & Account */}
      <Navbar
        onOpenSaree={handleOpenSareeModal}
        sarees={sarees}
      />

      <main className="flex-1">
        {/* 2. Hero Section: Fixed Non-Ghosting Rotating Saree Showcase & Brand Identity */}
        <Hero initialSarees={sarees} />

        {/* 3. Clean Trust & Service Strip: 4 Authentic Real Services with Line Icons */}
        <TrustStrip />

        {/* 4. Shop by Collection: Large Editorial Cards (Heritage Silks, Contemporary Elegance, Everyday Grace) */}
        <FeaturedCollections
          onSelectCollection={handleSelectCollection}
          sarees={sarees}
        />

        {/* 5. "Find Your Perfect Saree": Interactive Discovery by Occasion, Style, Fabric & Color */}
        <DiscoverYourSaree sarees={sarees} />

        {/* 6. New Arrivals: Fresh from our boutique (renders only if real new arrival sarees exist) */}
        <NewArrivals sarees={sarees} />

        {/* 7. Curated Saree Showcase with real category tabs & WhatsApp Inquiry */}
        <FeaturedSarees
          sarees={sarees}
          onAddToCart={handleAddToCart}
          activeSareeModal={activeSareeModal}
          onOpenSareeModal={handleOpenSareeModal}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* 8. Best Sellers: Patron favorites (renders only if real is_best_seller exist) */}
        <BestSellers sarees={sarees} />

        {/* 9. Editorial Boutique Story: "Crafted With Care" with real image & Armoor details */}
        <CraftedWithCare sarees={sarees} />

        {/* 10. Shop by Occasion: Weddings, Festive, Party, Daily Wear */}
        <ShopByOccasion sarees={sarees} />

        {/* 11. Boutique Assistance: "Personal Boutique Assistance" (Selection guidance, Availability, WhatsApp video verification) */}
        <BoutiqueServices />

        {/* 12. "Why SaiSrujana" Moment: "More Than A Saree" */}
        <WhySaiSrujanaMoment />

        {/* 13. Shop by Price Range: Budget Discovery */}
        <ShopByPrice />

        {/* 14. Premium WhatsApp CTA: "Need Help Choosing Your Saree?" */}
        <WhatsAppAssistance />

        {/* 15. Curated For You / Recently Viewed Sarees */}
        <RecentlyViewed fallbackSarees={sarees} />

        {/* 16. From Our Collection: Real Saree Photo Gallery */}
        <InstagramGallery sarees={sarees} />

        {/* 17. Contact & Visit Our Store: Gangadhar details, Clickable Phone/Email, Google Maps */}
        <ContactSection />
      </main>

      {/* 18. Professional Luxury 5-Column Boutique Footer */}
      <Footer />
    </div>
  );
}
