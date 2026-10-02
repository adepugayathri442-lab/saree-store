"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Phone,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Check,
  Sparkles,
  Tag,
  ShieldCheck,
  Eye,
  ShoppingBag,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Maximize2,
  Move,
  Heart,
  Zap,
  AlertCircle,
  Play,
  Video,
  FileText,
} from "lucide-react";
import { Saree } from "@/types/saree";
import { SHOP_CONFIG, getWhatsAppUrl, formatCurrency } from "@/config/shop";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useWhatsAppChat } from "@/context/WhatsAppChatContext";
import SareeCard from "@/components/SareeCard";
import ShareSaree from "@/components/ShareSaree";
import RecentlyViewed from "@/components/RecentlyViewed";
import SareeEnquiryModal from "@/components/SareeEnquiryModal";
import CustomerReviewsSection from "@/components/CustomerReviewsSection";
import { trackRecentlyViewed } from "@/lib/recentlyViewed";
import { getStockDisplay } from "@/lib/stock";

const VIEW_TYPES = [
  { label: "Full View", sub: "Complete drape view" },
  { label: "Pallu Close-up", sub: "Intricate zari & motifs" },
  { label: "Border Close-up", sub: "Weave & temple border" },
  { label: "Pleats View", sub: "Graceful fall & flare" },
  { label: "Fabric Texture", sub: "Pure warp & weft" },
];

interface SareeDetailViewProps {
  saree: Saree;
  relatedSarees: Saree[];
}

export default function SareeDetailView({ saree, relatedSarees }: SareeDetailViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { setProductChatContext } = useWhatsAppChat();
  const isWishlisted = isInWishlist(saree.id);

  // Colour Variants Management
  const hasVariants = Boolean(saree.variants && saree.variants.length > 0);
  const defaultVariantId = useMemo(() => {
    if (!hasVariants || !saree.variants) return null;
    const firstInStock = saree.variants.find((v) => v.isAvailable && v.stockQuantity > 0);
    if (firstInStock) return firstInStock.id;
    const firstAvailable = saree.variants.find((v) => v.isAvailable);
    if (firstAvailable) return firstAvailable.id;
    return saree.variants[0]?.id || null;
  }, [hasVariants, saree.variants]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariantId);

  const selectedVariant = useMemo(() => {
    if (!hasVariants || !saree.variants) return null;
    return saree.variants.find((v) => v.id === selectedVariantId) || saree.variants[0] || null;
  }, [hasVariants, saree.variants, selectedVariantId]);

  useEffect(() => {
    setProductChatContext(saree, selectedVariant);
    return () => {
      setProductChatContext(null);
    };
  }, [saree, selectedVariant, setProductChatContext]);

  const images = useMemo(() => {
    if (selectedVariant && selectedVariant.imageUrls && selectedVariant.imageUrls.length > 0) {
      return selectedVariant.imageUrls;
    }
    return saree.gallery && saree.gallery.length > 0 ? saree.gallery : [saree.image];
  }, [selectedVariant, saree.gallery, saree.image]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const activeImage = selectedImage && images.includes(selectedImage) ? selectedImage : images[0] || saree.image;
  const setActiveImage = useCallback((img: string) => {
    setSelectedImage(img);
  }, []);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [isAddedTemporarily, setIsAddedTemporarily] = useState(false);
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);

  // Live video drape modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Customer Enquiry modal state
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  // Active Price
  const activePrice =
    selectedVariant && selectedVariant.price !== undefined && selectedVariant.price !== null && selectedVariant.price !== ""
      ? selectedVariant.price
      : saree.price;

  // Active Stock & Availability
  const isVariantUnavailable = selectedVariant ? !selectedVariant.isAvailable : false;
  const activeStockQuantity = selectedVariant
    ? selectedVariant.stockQuantity
    : (saree.stockQuantity ?? 0);

  const stockInfo = useMemo(() => {
    if (isVariantUnavailable) {
      return {
        label: "Currently Unavailable",
        badgeClass: "bg-stone-200 text-stone-700 border-stone-300",
        isOutOfStock: true,
        isLowStock: false,
      };
    }
    if (selectedVariant) {
      return getStockDisplay(selectedVariant.stockQuantity, "In Stock");
    }
    return getStockDisplay(saree.stockQuantity, saree.stockStatus);
  }, [isVariantUnavailable, selectedVariant, saree.stockQuantity, saree.stockStatus]);

  const isSoldOut = stockInfo.isOutOfStock || isVariantUnavailable || activeStockQuantity <= 0;
  const maxAvailableQuantity = Math.max(0, activeStockQuantity);

  // Track saree view for Recently Viewed feature
  useEffect(() => {
    if (saree?.id) {
      trackRecentlyViewed(saree);
    }
  }, [saree]);

  // Fullscreen Lightbox & Interactive Zoom/Pan States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistanceRef = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenLightbox = (imgUrl?: string) => {
    if (imgUrl) setActiveImage(imgUrl);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleToggleZoom = useCallback(() => {
    if (scale > 1.2) {
      handleResetZoom();
    } else {
      setScale(2.2);
    }
  }, [scale, handleResetZoom]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.25 : -0.25;
    setScale((prev) => {
      const next = Math.min(4, Math.max(1, Number((prev + zoomFactor).toFixed(2))));
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        };
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      lastTouchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const diff = currentDist - lastTouchDistanceRef.current;

      if (Math.abs(diff) > 2) {
        const factor = diff * 0.008;
        setScale((prev) => {
          const next = Math.min(4, Math.max(1, Number((prev + factor).toFixed(2))));
          if (next === 1) {
            setPosition({ x: 0, y: 0 });
          }
          return next;
        });
        lastTouchDistanceRef.current = currentDist;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistanceRef.current = null;
  };

  const handlePrevImage = useCallback(() => {
    const currentIndex = images.indexOf(activeImage);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setActiveImage(images[prevIndex]);
    handleResetZoom();
  }, [images, activeImage, handleResetZoom, setActiveImage]);

  const handleNextImage = useCallback(() => {
    const currentIndex = images.indexOf(activeImage);
    const nextIndex = (currentIndex + 1) % images.length;
    setActiveImage(images[nextIndex]);
    handleResetZoom();
  }, [images, activeImage, handleResetZoom, setActiveImage]);

  // Keyboard navigation & body scroll management
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseLightbox();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isLightboxOpen, handleCloseLightbox, handleZoomIn, handleZoomOut, handleResetZoom, handlePrevImage, handleNextImage]);

  const handleAddToCart = () => {
    if (isSoldOut) return;
    addToCart(saree, quantity, { variant: selectedVariant });
    setIsAddedTemporarily(true);
    setAddedToast(true);
    setTimeout(() => setIsAddedTemporarily(false), 2200);
    setTimeout(() => setAddedToast(false), 4000);
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    const variantParam = selectedVariant?.id ? `&variantId=${encodeURIComponent(selectedVariant.id)}` : "";
    router.push(`/checkout?buyNow=true&sareeId=${encodeURIComponent(saree.id)}${variantParam}&quantity=${quantity}`);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(saree);
    setWishlistToast(isWishlisted ? "Removed from Wishlist" : "Saved to your Wishlist");
    setTimeout(() => setWishlistToast(null), 3000);
  };

  const drapeVideoWhatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I would like to request a video drape of "${saree.name}" (${saree.categoryLabel}, SKU: ${saree.sku}) from SaiSrujana catalogue. Please share a video on WhatsApp.`
  );

  const formattedPriceStr =
    typeof activePrice === "number" ? `₹${activePrice.toLocaleString("en-IN")}` : "Price on Inquiry";
  const activeColorStr = selectedVariant?.colorName || saree.color;

  const sareeWhatsAppUrl = getWhatsAppUrl(
    `Hello SaiSrujana,\n\n` +
    `I am interested in:\n\n` +
    `Saree: ${saree.name}\n` +
    (activeColorStr ? `Colour: ${activeColorStr}\n` : "") +
    `SKU: ${saree.sku}\n` +
    `Price: ${formattedPriceStr}\n` +
    `Quantity: ${quantity}\n\n` +
    `Please share availability and ordering details.`
  );

  return (
    <div className="bg-[#FDFBF7] min-h-screen text-[#2C2420]">
      {/* Toast Notifications */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E3F34] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-[#A7F3D0]/30 flex items-center gap-3.5 animate-in slide-in-from-bottom duration-300 max-w-sm">
          <div className="w-7 h-7 rounded-full bg-[#285345] flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-[#A7F3D0]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold truncate">{saree.name}</p>
            <p className="text-[11px] text-[#A7F3D0]">Added to your inquiry cart ({quantity} item{quantity > 1 ? "s" : ""})</p>
          </div>
          <Link
            href="/cart"
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#FAF7F2] text-[#6E121E] text-xs font-bold uppercase tracking-wider hover:bg-white transition"
          >
            View Cart
          </Link>
        </div>
      )}

      {/* Wishlist Toast Notification */}
      {wishlistToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#6E121E] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#C5A059]/40 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300">
          <Heart className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" />
          <span className="text-xs font-medium">{wishlistToast}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="bg-[#FAF7F2] border-b border-[#E8E0D2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <ol className="flex items-center space-x-2 text-xs text-[#8C7A6B] overflow-x-auto whitespace-nowrap">
            <li>
              <Link href="/" className="hover:text-[#6E121E] transition">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#C5A059]" />
              <Link href="/sarees" className="hover:text-[#6E121E] transition">
                Sarees
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#C5A059]" />
              <Link
                href={`/sarees?category=${saree.category}`}
                className="hover:text-[#6E121E] transition"
              >
                {saree.categoryLabel.split("(")[0].trim()}
              </Link>
            </li>
            <li className="flex items-center font-semibold text-[#6E121E]">
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#C5A059]" />
              <span className="truncate max-w-[200px]">{saree.name}</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Saree Product Detail Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/sarees"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#6E121E] hover:text-[#821524] transition-colors duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to Saree Catalogue</span>
          </Link>

          <ShareSaree saree={saree} selectedVariant={selectedVariant} variant="header" />
        </div>

        {/* Product Layout: 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Saree Visuals & Thumbnails */}
          <div className="lg:col-span-6 space-y-4">
            {/* Primary Large Image Frame with Fullscreen Trigger */}
            <div
              role="button"
              tabIndex={0}
              aria-label={`Open fullscreen view of ${saree.name}`}
              onClick={() => handleOpenLightbox(activeImage)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenLightbox(activeImage);
                }
              }}
              className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-stone-100 border border-[#E8E0D2] shadow-xs group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:ring-offset-2"
            >
              <Image
                src={activeImage}
                alt={saree.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-[1.02]"
              />

              {/* Fullscreen Expand & Stock Badge & Wishlist Action */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <div
                  className={`text-white px-3 py-1.5 rounded text-xs font-semibold tracking-wider shadow-sm flex items-center gap-1 ${
                    isSoldOut
                      ? "bg-[#590D18] border border-red-950/40"
                      : saree.isLimitedStock
                      ? "bg-amber-600 border border-amber-400"
                      : "bg-[#1E3F34]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#A7F3D0]" />
                  <span>{saree.stockStatus}</span>
                </div>

                {/* Wishlist Button Overlay */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWishlist();
                  }}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className="bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2 rounded-lg text-xs font-medium flex items-center justify-center transition-colors border border-white/20 shadow-sm cursor-pointer"
                  title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isWishlisted ? "fill-[#C5A059] text-[#C5A059]" : "text-white"
                    }`}
                  />
                </button>

                <div
                  className="bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/20 shadow-sm"
                  title="View fullscreen & zoom"
                >
                  <Maximize2 className="w-4 h-4 text-[#C5A059]" />
                </div>
              </div>

              {/* Category Pill & Angle Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                <div className="bg-[#FAF7F2]/90 backdrop-blur-md px-3 py-1.5 rounded text-xs uppercase tracking-wider font-semibold text-[#6E121E] border border-[#C5A059]/40 shadow-xs">
                  {saree.categoryLabel}
                </div>
                {images.length > 1 && (
                  <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-medium text-white flex items-center gap-1.5 border border-white/10 w-fit">
                    <Sparkles className="w-3 h-3 text-[#C5A059]" />
                    <span>{VIEW_TYPES[images.indexOf(activeImage) % VIEW_TYPES.length]?.label || "Angle View"}</span>
                  </div>
                )}
              </div>

              {/* Hover Badge to invite clicking to zoom */}
              <div className="absolute inset-x-4 bottom-14 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex justify-center">
                <span className="bg-[#1E1715]/85 backdrop-blur-sm text-white text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-[#C5A059]/40 shadow-lg">
                  <ZoomIn className="w-3.5 h-3.5 text-[#C5A059]" />
                  Click to View Fullscreen & Zoom Weave
                </span>
              </div>

              {/* Store Location tag */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded text-[11px] font-light flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>SaiSrujana • Armoor</span>
              </div>
            </div>

            {/* Multiple View Thumbnails (Full View, Pallu, Border, Pleats) */}
            {images.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#8C7A6B]">
                  <span className="font-semibold uppercase tracking-wider">Angles &amp; Weave Details</span>
                  <span>{images.indexOf(activeImage) + 1} of {images.length} views</span>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {images.map((img, idx) => {
                    const viewInfo = VIEW_TYPES[idx % VIEW_TYPES.length];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(img)}
                        className={`group/thumb relative w-20 h-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer flex flex-col ${
                          activeImage === img
                            ? "border-[#6E121E] shadow-md scale-102 ring-1 ring-[#6E121E]"
                            : "border-[#E8E0D2] opacity-75 hover:opacity-100"
                        }`}
                      >
                        <div className="relative flex-1 w-full">
                          <Image
                            src={img}
                            alt={`${saree.name} - ${viewInfo.label}`}
                            fill
                            className="object-cover object-top"
                          />
                        </div>
                        <div className="bg-[#1E1715]/90 py-0.5 px-1 text-[9px] font-semibold text-white text-center truncate border-t border-white/10">
                          {viewInfo.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Drape Video Preview Button */}
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FAF0DC] hover:bg-[#F3E5CE] text-[#6E121E] border border-[#C5A059] text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition group cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-[#6E121E] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
              </div>
              <span>{saree.videoUrl ? "Watch Drape Video" : "Request Video Drape on WhatsApp"}</span>
            </button>

            {/* In-store consultation notice */}
            <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E8E0D2] text-[11px] text-[#8C7A6B] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
              <span>
                Want to see this saree in more detail? Connect with us on WhatsApp to request a video drape or visit our showroom in Armoor.
              </span>
            </div>
          </div>

          {/* Right Column: Saree Details, Specifications & WhatsApp Enquiry */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            <div>
              {/* Category & SKU */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> {saree.categoryLabel}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#8C7A6B] bg-[#FAF7F2] px-2.5 py-1 rounded border border-[#E8E0D2]">
                    SKU: {saree.sku}
                  </span>
                  <ShareSaree saree={saree} selectedVariant={selectedVariant} variant="icon" />
                </div>
              </div>

              {/* Saree Name */}
              <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#1E1715] leading-tight mb-2">
                {saree.name}
              </h1>

              {/* Product Badges (Controllable via Admin) */}
              {(() => {
                const isSoldOut =
                  saree.stockStatus.toLowerCase().includes("sold out") ||
                  saree.stockStatus.toLowerCase().includes("out of stock");

                return (
                  (isSoldOut ||
                    saree.isNewArrival ||
                    saree.isBestSeller ||
                    saree.isFeatured ||
                    saree.isLimitedStock) && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {isSoldOut ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#590D18] text-white border border-red-900 shadow-2xs">
                          Sold Out
                        </span>
                      ) : (
                        <>
                          {saree.isNewArrival && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1E3F34] text-[#E5D2A4] border border-[#1E3F34] shadow-2xs flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#C5A059]" />
                              New Arrival
                            </span>
                          )}
                          {saree.isBestSeller && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#6E121E] text-white border border-[#C5A059]/40 shadow-2xs">
                              Best Seller
                            </span>
                          )}
                          {saree.isFeatured && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059] shadow-2xs">
                              Featured
                            </span>
                          )}
                          {saree.isLimitedStock && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#92400E] border border-amber-300 shadow-2xs">
                              Limited Stock
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )
                );
              })()}

              {/* Price / Inquiry Status Display */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E0D2] mb-4">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold text-[#6E121E]">
                    {formatCurrency(activePrice)}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stockInfo.badgeClass}`}
                  >
                    {stockInfo.label}
                  </span>
                </div>
                <p className="text-xs text-[#8C7A6B] mt-1 font-light">
                  Exact pricing, fabric details, and real video drapes are provided instantly by Gangadhar via WhatsApp.
                </p>
              </div>

              {/* REQUIREMENT 4: Colour Variants Section */}
              {hasVariants && saree.variants && saree.variants.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] shadow-2xs space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
                        Available Colours
                      </span>
                      <span className="text-[11px] font-bold text-[#6E121E] bg-[#FAF6EE] px-2 py-0.5 rounded border border-[#C5A059]/30">
                        {saree.variants.length} {saree.variants.length === 1 ? "Colour" : "Colours"}
                      </span>
                    </div>
                    {selectedVariant && (
                      <span className="text-xs font-semibold text-[#1E1715]">
                        Selected: <strong className="text-[#6E121E]">{selectedVariant.colorName}</strong>
                      </span>
                    )}
                  </div>

                  {/* Swatches Grid */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {saree.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const isOut = !variant.isAvailable || variant.stockQuantity === 0;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(variant.id);
                            setQuantity(1);
                          }}
                          className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white border-2 border-[#6E121E] shadow-sm scale-105"
                              : "bg-white/60 hover:bg-white border border-[#E8E0D2] hover:border-[#C5A059]"
                          }`}
                          title={`${variant.colorName} - ${
                            isOut
                              ? "Out of Stock"
                              : typeof variant.price === "number"
                              ? formatCurrency(variant.price)
                              : variant.price
                          }`}
                        >
                          {/* Color Swatch Circle */}
                          <div
                            className={`relative w-8 h-8 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs ${
                              isSelected ? "ring-2 ring-[#6E121E] ring-offset-2" : "border-stone-300"
                            }`}
                            style={{
                              backgroundColor: variant.colorCode || "#A87948",
                            }}
                          >
                            {isSelected && (
                              <div className="w-3.5 h-3.5 rounded-full bg-white/90 shadow-2xs flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-[#6E121E] stroke-[3]" />
                              </div>
                            )}
                            {isOut && (
                              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                <div className="w-full h-0.5 bg-red-600 rotate-45" />
                              </div>
                            )}
                          </div>

                          {/* Colour Name Label */}
                          <span
                            className={`text-[11px] font-medium leading-tight text-center max-w-[75px] truncate ${
                              isSelected ? "font-bold text-[#6E121E]" : "text-[#5A4E46]"
                            }`}
                          >
                            {variant.colorName}
                          </span>

                          {/* Micro Stock Tag */}
                          {isOut ? (
                            <span className="text-[9px] font-bold text-red-700 uppercase tracking-tighter">
                              Sold out
                            </span>
                          ) : variant.stockQuantity <= 3 ? (
                            <span className="text-[9px] font-bold text-amber-800">
                              {variant.stockQuantity === 1 ? "1 left" : `${variant.stockQuantity} left`}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saree Description */}
              <p className="text-sm sm:text-base text-[#5A4E46] leading-relaxed font-light mb-6">
                {saree.description}
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="border-t border-b border-[#E8E0D2] py-5">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B] mb-4">
                Saree Specifications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E8E0D2]/70">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C7A6B] block mb-0.5">
                    Fabric
                  </span>
                  <span className="font-semibold text-[#2C2420]">{saree.fabric}</span>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E8E0D2]/70">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C7A6B] block mb-0.5">
                    Craft / Weave
                  </span>
                  <span className="font-semibold text-[#2C2420]">{saree.craft}</span>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E8E0D2]/70">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C7A6B] block mb-0.5">
                    Zari / Border
                  </span>
                  <span className="font-semibold text-[#2C2420]">{saree.zariType}</span>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E8E0D2]/70">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C7A6B] block mb-0.5">
                    Color
                  </span>
                  <span className="font-semibold text-[#2C2420]">{saree.color}</span>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E8E0D2]/70 col-span-2 sm:col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C7A6B] block mb-0.5">
                    Recommended Occasion
                  </span>
                  <span className="font-semibold text-[#2C2420]">{saree.occasion}</span>
                </div>
              </div>
            </div>

            {/* Saree Highlights Checklist */}
            <div>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B] mb-3">
                Saree Highlights
              </h2>
              <div className="space-y-2.5">
                {saree.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#5A4E46]">
                    <div className="w-4 h-4 rounded-full bg-[#E8F3EE] flex items-center justify-center flex-shrink-0 mt-0.5 text-[#1E3F34]">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>



            {/* Direct WhatsApp Enquiry & Store Contact Actions */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#C5A059]/40 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6E121E]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  <span>Direct Boutique Consultation • Gangadhar</span>
                </div>
                {/* Secondary Wishlist Button */}
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] transition cursor-pointer"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isWishlisted ? "fill-[#6E121E] text-[#6E121E]" : ""
                    }`}
                  />
                  <span>{isWishlisted ? "Wishlisted" : "Save to Wishlist"}</span>
                </button>
              </div>

              {/* Out of Stock Notice */}
              {isSoldOut && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Currently Out of Stock</span>
                    <span className="text-[11px] text-red-700/90 font-light">
                      This exclusive handloom drape is sold out. Connect directly with Gangadhar on WhatsApp below to inquire about loom re-orders or view similar fresh drapes in our Armoor showroom.
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity Selector, Add to Cart, Buy Now */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Quantity Stepper */}
                <div
                  className={`flex items-center justify-between border border-[#E8E0D2] rounded-xl bg-white px-3 py-2 sm:w-36 ${
                    isSoldOut ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  <span className="text-xs text-[#8C7A6B] mr-2 font-medium">Qty</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isSoldOut}
                      aria-label="Decrease quantity"
                      className="w-7 h-7 rounded-md bg-[#FAF7F2] hover:bg-[#F0EAE1] disabled:opacity-40 flex items-center justify-center text-[#2C2420] transition cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm text-[#2C2420]">{quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(maxAvailableQuantity > 0 ? maxAvailableQuantity : 1, q + 1)
                        )
                      }
                      disabled={
                        isSoldOut || (maxAvailableQuantity > 0 && quantity >= maxAvailableQuantity)
                      }
                      aria-label="Increase quantity"
                      className="w-7 h-7 rounded-md bg-[#FAF7F2] hover:bg-[#F0EAE1] disabled:opacity-40 flex items-center justify-center text-[#2C2420] transition cursor-pointer"
                      title={
                        maxAvailableQuantity > 0 && quantity >= maxAvailableQuantity
                          ? `Maximum available stock (${maxAvailableQuantity}) reached`
                          : "Increase quantity"
                      }
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isSoldOut}
                  className={`flex-1 py-3 px-6 rounded-xl text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition group cursor-pointer ${
                    isSoldOut
                      ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                      : "bg-[#6E121E] hover:bg-[#821524] text-white btn-premium-primary"
                  }`}
                >
                  {isSoldOut ? (
                    <span>Sold Out • Out of Stock</span>
                  ) : isAddedTemporarily ? (
                    <>
                      <Check className="w-4 h-4 text-[#A7F3D0]" />
                      <span>Added to Bag ✓</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 group-hover:scale-105 transition-transform duration-200" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                {/* Buy Now Button (Requirement) */}
                {!isSoldOut && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="py-3 px-6 rounded-xl bg-[#C5A059] hover:bg-[#B88E44] text-[#1E1715] text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer hover:shadow-md"
                  >
                    <Zap className="w-4 h-4 text-[#1E1715]" />
                    <span>Buy Now</span>
                  </button>
                )}
              </div>

              {/* Enquire About This Saree (Customer Enquiry Form Action) */}
              <button
                type="button"
                onClick={() => setIsEnquiryModalOpen(true)}
                className="w-full py-3.5 px-6 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-sm transition cursor-pointer hover:shadow-md group"
              >
                <FileText className="w-4.5 h-4.5 text-[#C5A059] group-hover:scale-105 transition-transform duration-200" />
                <span>Enquire About This Saree</span>
              </button>

              {/* Primary WhatsApp Enquiry Button */}
              <a
                href={sareeWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-xl bg-[#1E3F34] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase btn-premium-whatsapp flex items-center justify-center gap-2.5 shadow-sm group"
              >
                <MessageCircle className="w-5 h-5 text-[#A7F3D0] group-hover:scale-105 transition-transform duration-200" />
                <span>WhatsApp Enquiry: {SHOP_CONFIG.phoneFormatted}</span>
              </a>

              {/* Secondary Call & Directions Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href={`tel:${SHOP_CONFIG.phone}`}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#6E121E] text-[#6E121E] hover:bg-[#6E121E] hover:text-white text-xs font-semibold uppercase tracking-wider btn-premium-outline flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call: {SHOP_CONFIG.phoneFormatted}</span>
                </a>

                <a
                  href={SHOP_CONFIG.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl border border-[#C5A059] text-[#2C2420] hover:bg-[#FAF6EE] text-xs font-semibold uppercase tracking-wider btn-premium-outline flex items-center justify-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Visit Store in Armoor</span>
                </a>
              </div>

              {/* Share Saree with Family & Friends */}
              <div className="pt-1">
                <ShareSaree saree={saree} selectedVariant={selectedVariant} variant="secondary" />
              </div>


              <p className="text-[11px] text-[#8C7A6B] text-center pt-1 font-light">
                Shop Address: {SHOP_CONFIG.address}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Ratings Section */}
        <CustomerReviewsSection saree={saree} />

        {/* Related Sarees Section */}
        {relatedSarees.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#E8E0D2]">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#8C7A6B] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Curated Drapes</span>
              </div>
              <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] mb-2">
                More from Our Collection
              </h2>
              <p className="text-xs sm:text-sm text-[#5A4E46] font-light">
                Explore complementary sarees from SaiSrujana boutique in Armoor.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 min-[360px]:gap-2.5 sm:gap-6 lg:gap-8">
              {relatedSarees.map((relSaree) => (
                <SareeCard key={relSaree.id} saree={relSaree} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/sarees"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-[#6E121E] text-[#6E121E] hover:bg-[#6E121E] hover:text-white text-xs font-semibold uppercase tracking-wider btn-premium-outline shadow-xs"
              >
                <span>View Complete Saree Catalogue</span>
                <Eye className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Recently Viewed Sarees Section */}
        <div className="mt-16 pt-12 border-t border-[#E8E0D2]">
          <RecentlyViewed currentSareeId={saree.id} />
        </div>
      </section>

      {/* Fullscreen Saree Image Viewer / Lightbox Overlay */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fullscreen viewer for ${saree.name}`}
          className="fixed inset-0 z-50 flex flex-col bg-[#0C0A09]/95 backdrop-blur-md select-none animate-in fade-in duration-200 motion-reduce:transition-none"
        >
          {/* Top Header / Control Bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-black/50 border-b border-white/10 z-20">
            {/* Left: Product Info */}
            <div className="min-w-0 pr-2 sm:pr-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9.5px] sm:text-xs font-semibold uppercase tracking-wider text-[#C5A059] truncate">
                  {saree.categoryLabel}
                </span>
                <span className="text-[9.5px] sm:text-xs font-mono text-stone-400 bg-white/5 px-1.5 sm:px-2 py-0.5 rounded border border-white/10">
                  {saree.sku}
                </span>
              </div>
              <h2 className="text-xs sm:text-base font-serif-luxury font-bold text-white truncate max-w-[120px] min-[380px]:max-w-[180px] sm:max-w-md">
                {saree.name}
              </h2>
            </div>

            {/* Right: Zoom Controls & Close Button */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Zoom Out Button */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                aria-label="Zoom out"
                className="p-1.5 sm:px-3 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                title="Zoom out (-)"
              >
                <ZoomOut className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span className="hidden md:inline">Zoom Out</span>
              </button>

              {/* Scale Indicator */}
              <span className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-black/60 border border-white/10 text-[11px] sm:text-xs font-mono font-medium text-[#C5A059] min-w-[44px] sm:min-w-[52px] text-center">
                {Math.round(scale * 100)}%
              </span>

              {/* Zoom In Button */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 4}
                aria-label="Zoom in"
                className="p-1.5 sm:px-3 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                title="Zoom in (+)"
              >
                <ZoomIn className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span className="hidden md:inline">Zoom In</span>
              </button>

              {/* Reset Zoom Button */}
              <button
                type="button"
                onClick={handleResetZoom}
                disabled={scale === 1 && position.x === 0 && position.y === 0}
                aria-label="Reset zoom to 100%"
                className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300 hover:text-white transition-colors border border-white/10 cursor-pointer"
                title="Reset zoom (0)"
              >
                <RotateCcw className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </button>

              <div className="h-5 sm:h-6 w-px bg-white/15 mx-0.5 sm:mx-1" />

              {/* Close Button */}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleCloseLightbox}
                aria-label="Close fullscreen viewer"
                className="p-1.5 sm:px-3 sm:py-2 rounded-lg bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors shadow-md border border-[#C5A059]/40 cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Interactive Image Viewport Area */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseLightbox();
              }
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex-1 relative w-full h-full overflow-hidden flex items-center justify-center p-2 sm:p-6 select-none ${
              scale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
            }`}
          >
            {/* The Fullscreen Actual Saree Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={`${saree.name} weave detail`}
              aria-label={`${saree.name} detailed view`}
              draggable={false}
              onDoubleClick={handleToggleZoom}
              onClick={(e) => {
                e.stopPropagation();
                if (scale === 1) {
                  handleZoomIn();
                }
              }}
              className={`max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain select-none shadow-2xl rounded-sm ${
                isDragging ? "transition-none" : "transition-transform duration-200 motion-reduce:transition-none"
              }`}
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            />

            {/* Lightbox Previous / Next Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  aria-label="Previous view"
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition backdrop-blur-md cursor-pointer hover:scale-110 shadow-xl"
                  title="Previous image (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  aria-label="Next view"
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition backdrop-blur-md cursor-pointer hover:scale-110 shadow-xl"
                  title="Next image (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Panning / Zooming Hint Indicator */}
            <div className="absolute bottom-4 inset-x-0 pointer-events-none flex justify-center px-4">
              <div className="bg-black/70 backdrop-blur-md text-stone-300 text-[11px] sm:text-xs px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3 shadow-lg">
                <span className="flex items-center gap-1.5">
                  <Move className="w-3 h-3 text-[#C5A059]" />
                  {scale > 1 ? "Drag to pan weave details" : "Click or double-click to zoom"}
                </span>
                <span className="hidden md:inline text-white/30">•</span>
                <span className="hidden md:inline text-stone-400">Mouse wheel or pinch to zoom</span>
                <span className="hidden md:inline text-white/30">•</span>
                <span className="hidden sm:inline text-stone-400">Esc to exit</span>
              </div>
            </div>
          </div>

          {/* Bottom Thumbnails Strip (When multiple views are available) */}
          {images.length > 1 && (
            <div className="flex-shrink-0 bg-black/60 border-t border-white/10 px-4 py-2.5 flex items-center justify-center gap-3 overflow-x-auto z-20">
              {images.map((img, idx) => {
                const angleInfo = VIEW_TYPES[idx % VIEW_TYPES.length];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImage(img);
                      setScale(1);
                      setPosition({ x: 0, y: 0 });
                    }}
                    aria-label={`View ${angleInfo.label}`}
                    className={`relative w-16 h-20 sm:w-18 sm:h-22 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer flex flex-col ${
                      activeImage === img
                        ? "border-[#C5A059] scale-105 shadow-md shadow-[#C5A059]/20"
                        : "border-white/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${saree.name} thumbnail ${idx + 1}`}
                      className="w-full flex-1 object-cover object-top"
                    />
                    <span className="bg-black/90 py-0.5 px-1 text-[8px] font-semibold text-white text-center truncate border-t border-white/10">
                      {angleInfo.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Personalized Live Drape Video Modal */}
      {isVideoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Live drape video for ${saree.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-[#FAF7F2] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#C5A059]/40 relative">
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 transition cursor-pointer"
              aria-label="Close video modal"
            >
              <X className="w-5 h-5" />
            </button>

            {saree.videoUrl ? (
              <div className="space-y-4">
                <h3 className="font-serif-luxury text-lg font-bold text-[#1E1715]">
                  {saree.name} • Live Drape Video
                </h3>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  <video
                    src={saree.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF0DC] border border-[#C5A059] flex items-center justify-center mx-auto text-[#6E121E]">
                  <Video className="w-7 h-7 text-[#6E121E]" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-[#C5A059] block">
                    Armoor Showroom
                  </span>
                  <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                    Request Video Drape on WhatsApp
                  </h3>
                  <p className="text-xs text-[#5A4E46] leading-relaxed max-w-md mx-auto">
                    Interested in seeing this saree in more detail? Reach out to us on WhatsApp to request a video drape of <strong>{saree.name}</strong> ({saree.sku}) from our store.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <a
                    href={drapeVideoWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsVideoModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                    <span>Request Drape on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(false)}
                    className="py-3 px-4 rounded-xl border border-[#E8E0D2] text-[#8C7A6B] hover:bg-white text-xs font-medium transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Saree Enquiry Modal */}
      <SareeEnquiryModal
        saree={saree}
        selectedVariant={selectedVariant}
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        initialQuantity={quantity}
      />
    </div>
  );
}
