"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  MessageCircle,
  Trash2,
  ArrowRight,
  ChevronRight,
  Eye,
  Check,
  Tag,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SareeEnquiryModal from "@/components/SareeEnquiryModal";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getWhatsAppUrl, formatCurrency } from "@/config/shop";
import { Saree } from "@/types/saree";

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist, totalCount, isLoaded } = useWishlist();
  const { addToCart } = useCart();
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [enquiringSaree, setEnquiringSaree] = useState<Saree | null>(null);

  const handleAddToCart = (saree: Saree) => {
    addToCart(saree, 1);
    setAddedToast(`Added "${saree.name}" to your cart`);
    setTimeout(() => {
      setAddedToast(null);
    }, 3000);
  };

  // Generate WhatsApp message for all wishlisted sarees
  const wishlistedSareesText = items
    .map((s, idx) => `${idx + 1}. ${s.name} (SKU: ${s.sku})`)
    .join("\n");

  const batchWhatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I have saved the following sarees to my SaiSrujana wishlist:\n\n${wishlistedSareesText}\n\nPlease share price, availability, and video drapes.`
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      {/* Toast Notification for Add to Cart */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E3F34] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-[#A7F3D0]/30 flex items-center gap-3 animate-in slide-in-from-bottom duration-300 max-w-sm">
          <div className="w-7 h-7 rounded-full bg-[#285345] flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-[#A7F3D0]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{addedToast}</p>
            <p className="text-[11px] text-[#A7F3D0]">Saved in your inquiry cart</p>
          </div>
          <Link
            href="/cart"
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#FAF7F2] text-[#6E121E] text-xs font-bold uppercase tracking-wider hover:bg-white transition"
          >
            View Cart
          </Link>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="bg-[#FAF7F2] border-b border-[#E8E0D2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <ol className="flex items-center space-x-2 text-xs text-[#8C7A6B]">
              <li>
                <Link href="/" className="hover:text-[#6E121E] transition">
                  Home
                </Link>
              </li>
              <li className="flex items-center">
                <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#C5A059]" />
                <span className="font-semibold text-[#6E121E]">Saved Sarees (Wishlist)</span>
              </li>
            </ol>
          </div>
        </nav>

        {/* Wishlist Header Section */}
        <section className="bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/80 to-[#FDFBF7] py-10 lg:py-14 border-b border-[#E8E0D2] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4EFE6] border border-[#C5A059]/40 text-[#6E121E] text-xs font-semibold tracking-wider mb-3 shadow-xs">
                  <Heart className="w-3.5 h-3.5 fill-[#6E121E] text-[#6E121E]" />
                  <span>My Saved Treasures</span>
                </div>

                <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E1715] tracking-tight mb-2">
                  My Wishlist
                </h1>

                <p className="text-xs sm:text-sm text-[#5A4E46] font-light max-w-xl">
                  {totalCount > 0 ? (
                    <>
                      You have saved{" "}
                      <strong className="font-semibold text-[#6E121E]">
                        {totalCount} {totalCount === 1 ? "saree" : "sarees"}
                      </strong>{" "}
                      to your personal wishlist. You can add them to your cart, inquire with Gangadhar on WhatsApp, or view details.
                    </>
                  ) : (
                    "Keep track of the sarees you love as you explore our heritage drapes."
                  )}
                </p>
              </div>

              {/* Header Action Buttons when items exist */}
              {totalCount > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={batchWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold tracking-wider uppercase btn-premium-whatsapp shadow-sm transition"
                  >
                    <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                    <span>Inquire All on WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear your entire wishlist?")) {
                        clearWishlist();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#E8E0D2] bg-white text-[#8C7A6B] hover:text-[#6E121E] hover:border-[#6E121E] text-xs font-semibold tracking-wider uppercase transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Wishlist Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          {!isLoaded ? (
            /* Skeleton Loading State */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF7F2] rounded-xl border border-[#E8E0D2] p-4 space-y-4 animate-pulse"
                >
                  <div className="aspect-[3/4] bg-stone-200 rounded-lg" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            /* Beautiful Empty State */
            <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8E0D2] p-10 sm:p-16 text-center max-w-xl mx-auto my-8 shadow-xs">
              <div className="w-20 h-20 rounded-full bg-[#FAF6EE] border-2 border-[#C5A059]/40 flex items-center justify-center mx-auto mb-6 text-[#6E121E] shadow-sm animate-in zoom-in-75 duration-300">
                <Heart className="w-10 h-10 text-[#C5A059]" />
              </div>

              <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] mb-3">
                Your Wishlist is Empty
              </h2>

              <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed mb-8 font-light max-w-md mx-auto">
                You haven&apos;t saved any sarees to your wishlist yet. Explore our handcrafted{" "}
                <strong className="text-[#1E1715]">Heritage Silks</strong>,{" "}
                <strong className="text-[#1E1715]">Contemporary Elegance</strong>, and{" "}
                <strong className="text-[#1E1715]">Everyday Grace</strong> collections to find your perfect drapes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link
                  href="/sarees"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold tracking-widest uppercase shadow-md transition-all group"
                >
                  <span>Explore Sarees</span>
                  <ArrowRight className="w-4 h-4 text-[#E5D2A4] group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href={getWhatsAppUrl("Hello Gangadhar garu, I am visiting SaiSrujana website and would like assistance finding sarees.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-[#C5A059] bg-[#FAF6EE] hover:bg-white text-[#2C2420] text-xs font-semibold tracking-wider uppercase transition"
                >
                  <MessageCircle className="w-4 h-4 text-[#1E3F34]" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            /* Wishlist Items Grid */
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 min-[360px]:gap-2.5 sm:gap-6 lg:gap-8">
                {items.map((saree) => {
                  return (
                    <div
                      key={saree.id}
                      className="group bg-[#FAF7F2] rounded-xl overflow-hidden border border-[#E8E0D2] saree-card shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-lg"
                    >
                      {/* Product Image Area */}
                      <div>
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
                          <Link href={`/sarees/${saree.id}`} className="block w-full h-full">
                            <Image
                              src={saree.image}
                              alt={saree.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover object-top saree-card-img"
                            />
                          </Link>

                          {/* Category Badge */}
                          <div className="absolute top-3 left-3 bg-[#FAF7F2]/90 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-semibold text-[#6E121E] border border-[#C5A059]/40 shadow-xs pointer-events-none">
                            {saree.categoryLabel.split(" ")[0]}
                          </div>

                          {/* Remove from Wishlist Heart Button */}
                          <button
                            type="button"
                            onClick={() => removeFromWishlist(saree.id)}
                            aria-label={`Remove ${saree.name} from Wishlist`}
                            title="Remove from Wishlist"
                            className="absolute top-3 right-3 p-2 rounded-full bg-white text-[#6E121E] hover:bg-[#FAF7F2] hover:scale-110 active:scale-95 transition-all duration-200 shadow-md z-10 cursor-pointer"
                          >
                            <Heart className="w-4 h-4 fill-[#6E121E] text-[#6E121E]" />
                          </button>

                          {/* Quick "View Saree" hover pill */}
                          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex">
                            <Link
                              href={`/sarees/${saree.id}`}
                              className="w-full py-2.5 px-3 bg-[#FAF7F2]/95 backdrop-blur-md hover:bg-white text-[#2C2420] hover:text-[#6E121E] text-xs font-semibold rounded shadow-md border border-[#E8E0D2] hover:border-[#C5A059] flex items-center justify-center gap-1.5 transition-all duration-200"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>View Saree Details</span>
                            </Link>
                          </div>
                        </div>

                        {/* Saree Card Details */}
                        <div className="p-2 min-[360px]:p-2.5 sm:p-5">
                          <div className="flex items-center justify-between text-[10px] min-[360px]:text-[11px] sm:text-xs text-[#8C7A6B] mb-0.5 sm:mb-1.5">
                            <span className="font-medium text-[#C5A059] flex items-center gap-1 truncate max-w-[65%]">
                              <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> {saree.categoryLabel}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-mono text-[#8C7A6B] shrink-0">{saree.sku}</span>
                          </div>

                          <Link href={`/sarees/${saree.id}`} className="block">
                            <h3 className="font-serif-luxury text-xs min-[360px]:text-sm sm:text-lg font-bold text-[#1E1715] leading-tight sm:leading-snug mb-0.5 sm:mb-2 group-hover:text-[#6E121E] transition-colors duration-250 line-clamp-1">
                              {saree.name}
                            </h3>
                          </Link>

                          <p className="hidden sm:block text-[11px] sm:text-xs text-[#5A4E46] line-clamp-2 mb-2 sm:mb-3 font-light">
                            {saree.description}
                          </p>

                          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <span className="text-xs min-[360px]:text-sm sm:text-base font-bold text-[#6E121E]">
                              {formatCurrency(saree.price)}
                            </span>
                            <span className="text-[8.5px] min-[360px]:text-[9.5px] sm:text-[11px] text-[#1E3F34] font-medium bg-[#E8F3EE] px-1 sm:px-2 py-0.2 sm:py-0.5 rounded truncate">
                              {saree.stockStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: View Saree, Enquire Now, Add to Cart & Remove */}
                      <div className="p-2 min-[360px]:p-2.5 sm:p-5 pt-1.5 sm:pt-0 border-t border-[#E8E0D2]/50 mt-0.5 sm:mt-2 space-y-1 sm:space-y-2">
                        {/* Enquire Now (Opens existing enquiry modal + WhatsApp flow) */}
                        <button
                          type="button"
                          onClick={() => setEnquiringSaree(saree)}
                          aria-label={`Enquire now about ${saree.name}`}
                          className="w-full py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold tracking-wider uppercase btn-premium-whatsapp flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0] shrink-0" />
                          <span className="truncate">Enquire Now</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1 sm:gap-2">
                          {/* View Saree Details Action */}
                          <Link
                            href={`/sarees/${saree.id}`}
                            aria-label={`View details for ${saree.name}`}
                            className="py-1.5 sm:py-2.5 px-1 sm:px-2.5 rounded-lg sm:rounded-xl border border-[#C5A059]/50 bg-white hover:bg-[#FAF6EE] text-[#6E121E] text-[10px] min-[360px]:text-[11px] sm:text-xs tracking-wider uppercase font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-2xs text-center"
                          >
                            <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#C5A059] shrink-0" />
                            <span className="truncate">View</span>
                          </Link>

                          {/* Add to Cart Action */}
                          <button
                            type="button"
                            onClick={() => handleAddToCart(saree)}
                            aria-label={`Add ${saree.name} to cart`}
                            className="py-1.5 sm:py-2.5 px-1 sm:px-2.5 rounded-lg sm:rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-[10px] min-[360px]:text-[11px] sm:text-xs tracking-wider uppercase font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-xs cursor-pointer group/btn"
                          >
                            <ShoppingBag className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#E5D2A4] group-hover/btn:scale-110 transition-transform shrink-0" />
                            <span className="truncate">Cart</span>
                          </button>
                        </div>

                        {/* Remove from Wishlist action text */}
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(saree.id)}
                          aria-label={`Remove ${saree.name} from saved wishlist`}
                          className="w-full py-1 text-center text-[10px] sm:text-[11px] text-[#8C7A6B] hover:text-red-700 hover:underline flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-[#8C7A6B] hover:text-red-700" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Saree Enquiry Modal (Reuses existing unified enquiry flow) */}
      {enquiringSaree && (
        <SareeEnquiryModal
          saree={enquiringSaree}
          isOpen={Boolean(enquiringSaree)}
          onClose={() => setEnquiringSaree(null)}
        />
      )}

      {/* Professional Footer */}
      <Footer />
    </div>
  );
}
