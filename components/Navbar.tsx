"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Phone,
  Sparkles,
  ArrowRight,
  MessageCircle,
  MapPin,
  Heart,
  User as UserIcon,
  Camera,
  Package,
  Bell,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons/Instagram";
import { Saree } from "@/types/saree";
import { FEATURED_SAREES } from "@/data/sarees";
import { SHOP_CONFIG, getWhatsAppUrl, formatCurrency } from "@/config/shop";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { fetchCustomerNotifications } from "@/lib/supabase/orders";
import { createBrowserClient } from "@/lib/supabase/client";

interface NavbarProps {
  cart?: { saree: Saree; quantity: number }[];
  onRemoveFromCart?: (id: string) => void;
  onOpenSaree?: (saree: Saree) => void;
  sarees?: Saree[];
}

export default function Navbar({
  cart: propCart,
  onOpenSaree = () => {},
  sarees,
}: NavbarProps) {
  const { totalCount } = useCart();
  const { totalCount: totalWishlistCount } = useWishlist();
  const { user, isLoggedIn, customerName, customerEmail, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch unread notification count
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    const loadUnreadCount = async () => {
      try {
        const notifs = await fetchCustomerNotifications(user.id);
        if (isMounted) {
          const count = notifs.filter((n) => !n.isRead).length;
          setUnreadNotifCount(count);
        }
      } catch (e) {
        console.warn("Navbar notification fetch notice:", e);
      }
    };

    loadUnreadCount();

    // Setup realtime subscription
    let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
    let notifsChannel: ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null = null;
    try {
      supabaseClient = createBrowserClient();
      if (supabaseClient) {
        notifsChannel = supabaseClient
          .channel(`navbar_notifs_${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "customer_notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              loadUnreadCount();
            }
          )
          .subscribe();
      }
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
      if (supabaseClient && notifsChannel) {
        supabaseClient.removeChannel(notifsChannel);
      }
    };
  }, [user?.id]);

  // Close dropdown or mobile menu on click outside, Escape key, or screen resize
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      // Close user dropdown if clicked outside
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsUserDropdownOpen(false);
      }
      // Close mobile menu if clicked outside both panel and hamburger button
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileButtonRef.current &&
        !mobileButtonRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserDropdownOpen(false);
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    }

    function handleResize() {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobileMenuOpen, isUserDropdownOpen]);

  const totalCartCount =
    propCart !== undefined
      ? propCart.reduce((acc, item) => acc + item.quantity, 0)
      : totalCount;



  const availableSarees =
    sarees && sarees.length > 0
      ? sarees
      : !process.env.NEXT_PUBLIC_SUPABASE_URL
      ? FEATURED_SAREES
      : [];

  const filteredSarees = searchQuery.trim()
    ? availableSarees.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.fabric.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.occasion && s.occasion.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (s.sku && s.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const generalWhatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am contacting you from SaiSrujana website regarding sarees.`
  );

  return (
    <>
      {/* Top Announcement & Quick Contact Bar (WhatsApp, Phone, Instagram, Contact) */}
      <div className="bg-[#590D18] text-[#E5D2A4] text-xs py-2 px-3 sm:px-4 border-b border-[#C5A059]/20 tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-center gap-1.5 sm:gap-2">
          {/* Location link */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-[11px] sm:text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
            <a
              href={SHOP_CONFIG.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition flex items-center gap-1 text-[#E5D2A4]"
              title="View SaiSrujana location in Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <span>Armoor, Nizamabad, Telangana</span>
            </a>
          </div>

          {/* Quick Contact Links: WhatsApp, Phone, Instagram, Contact */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-[#F4EFE6]/90">
            {/* WhatsApp */}
            <a
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition flex items-center gap-1 text-[#E5D2A4]"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
              <span className="font-semibold">WhatsApp</span>
            </a>

            <span className="text-white/30">•</span>

            {/* Phone / Gangadhar */}
            <a
              href={`tel:${SHOP_CONFIG.phone}`}
              className="hover:text-white transition flex items-center gap-1 text-[#E5D2A4]"
              title={`Call ${SHOP_CONFIG.contactPerson}`}
            >
              <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{SHOP_CONFIG.contactPerson}: {SHOP_CONFIG.phoneFormatted}</span>
            </a>

            <span className="text-white/30 hidden md:inline">•</span>

            {/* Instagram: DO NOT INVENT A URL. Centrally configured */}
            {SHOP_CONFIG.instagramUrl ? (
              <a
                href={SHOP_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition hidden md:flex items-center gap-1 text-[#E5D2A4]"
                title="SaiSrujana Instagram"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-[#E5D2A4]" />
                <span>Instagram</span>
              </a>
            ) : (
              <span
                className="hover:text-white transition hidden md:flex items-center gap-1 text-[#E5D2A4]/80 cursor-help"
                title="SaiSrujana official Instagram page coming soon. Connect with Gangadhar on WhatsApp for updates!"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-[#E5D2A4]/80" />
                <span>Instagram</span>
              </span>
            )}

            <span className="text-white/30 hidden sm:inline">•</span>

            {/* Contact */}
            <Link
              href="/#contact"
              className="hover:text-white transition hidden sm:flex items-center gap-1 text-[#E5D2A4]"
              title="Visit store or contact Gangadhar"
            >
              <span>Contact Store</span>
            </Link>

            <span className="text-white/30 hidden sm:inline">•</span>

            {/* Customer Account / Login */}
            <Link
              href={isLoggedIn ? "/account" : "/login"}
              className="hover:text-white transition flex items-center gap-1.5 text-[#E5D2A4] font-medium"
              title={isLoggedIn ? "My Account" : "Customer Login / Sign Up"}
            >
              <UserIcon className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <span className="max-w-[120px] sm:max-w-[150px] truncate">
                {isLoggedIn ? (customerName || "My Account") : "Login / Sign Up"}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E0D2] transition-all">
        <div className="max-w-7xl mx-auto px-2 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button - Fixed in top-left */}
            <div className="flex items-center lg:hidden shrink-0">
              <button
                ref={mobileButtonRef}
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation-panel"
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                className="p-1.5 min-[360px]:p-2 -ml-1 rounded-xl text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] focus:outline-none transition cursor-pointer"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 min-[360px]:w-6 min-[360px]:h-6 text-[#6E121E]" />
                ) : (
                  <Menu className="w-5 h-5 min-[360px]:w-6 min-[360px]:h-6 text-[#2C2420]" />
                )}
              </button>
            </div>

            {/* Brand Logo & Tagline as one cohesive centered block */}
            <div className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start min-w-0 px-1 sm:px-2">
              <Link
                href="/"
                className="group flex flex-col items-center lg:items-start text-center lg:text-left max-w-full"
              >
                {/* Top Row: SaiSrujana Logo */}
                <span className="font-serif-luxury text-lg min-[360px]:text-xl min-[390px]:text-2xl sm:text-3xl tracking-[0.08em] min-[360px]:tracking-[0.12em] sm:tracking-[0.16em] font-bold text-[#6E121E] group-hover:text-[#821524] transition-colors truncate block leading-tight">
                  {SHOP_CONFIG.brandName}
                </span>

                {/* Second Line Directly Under Brand: Tagline */}
                <span className="text-[6.5px] min-[340px]:text-[7px] min-[360px]:text-[8px] min-[390px]:text-[9px] sm:text-[10px] tracking-[0.04em] min-[340px]:tracking-[0.06em] min-[360px]:tracking-[0.12em] sm:tracking-[0.28em] text-[#8C7A6B] uppercase font-medium truncate block leading-normal mt-0.5">
                  {SHOP_CONFIG.tagline}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links with Subtle Animated Underline */}
            <nav className="hidden lg:flex items-center space-x-9 text-sm font-medium tracking-wider">
              <Link href="/" className="nav-link">
                Home
              </Link>
              <Link href="/#collections" className="nav-link">
                Collections
              </Link>
              <Link href="/sarees" className="nav-link">
                Sarees
              </Link>
              <Link href="/#about" className="nav-link">
                About
              </Link>
              <Link href="/#contact" className="nav-link">
                Contact
              </Link>
            </nav>

            {/* Right Action Icons (Search, Cart & WhatsApp CTA) */}
            <div className="flex items-center space-x-1 min-[360px]:space-x-1.5 sm:space-x-5 shrink-0">
              {/* Search Icon */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search Sarees"
                className="p-1.5 min-[360px]:p-2 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] hover:scale-105 active:scale-95 rounded-full transition-all duration-200 relative group"
                title="Search Sarees"
              >
                <Search className="w-4.5 h-4.5 min-[360px]:w-5 min-[360px]:h-5 transition-transform duration-200 group-hover:scale-105" />
                <span className="sr-only">Search</span>
              </button>

              {/* Customer Account / Login & Orders Menu */}
              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                    aria-label={`My Account (${customerName || "Customer"})`}
                    aria-expanded={isUserDropdownOpen}
                    className="p-1 min-[360px]:p-1.5 sm:px-3 sm:py-1.5 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-[#C5A059]/40 relative"
                    title={`My Account (${customerName || "Customer"})`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#6E121E] text-[#E5D2A4] font-serif-luxury font-bold text-xs flex items-center justify-center border border-[#C5A059]/50 shadow-2xs relative">
                      {customerName ? customerName.charAt(0).toUpperCase() : "P"}
                      {unreadNotifCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" />
                      )}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold text-[#6E121E] max-w-[90px] truncate">
                      {customerName ? customerName.split(" ")[0] : "Account"}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#8C7A6B] hidden sm:inline transition-transform duration-200 ${isUserDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Luxury Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#FDFBF7] border border-[#C5A059]/50 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#1E1715]">
                      {/* Dropdown Header */}
                      <div className="px-4 py-3 border-b border-[#E8E0D2] bg-white/50">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#8C7A6B]">
                          SaiSrujana Patron
                        </p>
                        <p className="font-serif-luxury font-bold text-sm text-[#6E121E] truncate">
                          {customerName || "Patron Profile"}
                        </p>
                        {customerEmail && (
                          <p className="text-[11px] text-[#8C7A6B] truncate mt-0.5">
                            {customerEmail}
                          </p>
                        )}
                      </div>

                      {/* Menu Options */}
                      <div className="py-1">
                        {/* YOUR ORDERS - Prominent */}
                        <Link
                          href="/account?tab=orders"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[#1E1715] hover:bg-[#FAF0DC] hover:text-[#6E121E] transition group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#FAF0DC] group-hover:bg-[#6E121E] group-hover:text-white text-[#6E121E] flex items-center justify-center shrink-0 transition">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold">Your Orders</span>
                            <span className="block text-[10px] text-[#8C7A6B] font-normal">
                              Track deliveries & status
                            </span>
                          </div>
                        </Link>

                        {/* SAVED ADDRESSES */}
                        <Link
                          href="/account?tab=addresses"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#5C4D44] hover:bg-[#FAF0DC] hover:text-[#6E121E] transition group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] text-[#8C7A6B] group-hover:text-[#6E121E] flex items-center justify-center shrink-0 transition">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span>Saved Addresses</span>
                        </Link>

                        {/* NOTIFICATIONS */}
                        <Link
                          href="/account?tab=notifications"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-xs font-medium text-[#5C4D44] hover:bg-[#FAF0DC] hover:text-[#6E121E] transition group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] text-[#8C7A6B] group-hover:text-[#6E121E] flex items-center justify-center shrink-0 transition relative">
                              <Bell className="w-3.5 h-3.5" />
                              {unreadNotifCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                              )}
                            </div>
                            <span>Notifications</span>
                          </div>
                          {unreadNotifCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                              {unreadNotifCount}
                            </span>
                          )}
                        </Link>

                        {/* INQUIRIES */}
                        <Link
                          href="/account?tab=enquiries"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#5C4D44] hover:bg-[#FAF0DC] hover:text-[#6E121E] transition group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] text-[#8C7A6B] group-hover:text-[#6E121E] flex items-center justify-center shrink-0 transition">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </div>
                          <span>Boutique Inquiries</span>
                        </Link>

                        {/* PROFILE OVERVIEW */}
                        <Link
                          href="/account?tab=profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#5C4D44] hover:bg-[#FAF0DC] hover:text-[#6E121E] transition group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] text-[#8C7A6B] group-hover:text-[#6E121E] flex items-center justify-center shrink-0 transition">
                            <UserIcon className="w-3.5 h-3.5" />
                          </div>
                          <span>Account Overview</span>
                        </Link>
                      </div>

                      {/* Dropdown Footer: Sign Out */}
                      <div className="pt-1 mt-1 border-t border-[#E8E0D2] px-2">
                        <button
                          type="button"
                          onClick={async () => {
                            setIsUserDropdownOpen(false);
                            await signOut();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  aria-label="Customer Login / Sign Up"
                  className="p-1 min-[360px]:p-1.5 sm:px-3 sm:py-1.5 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] hover:scale-105 active:scale-95 rounded-full transition-all duration-200 relative group flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-[#C5A059]/40"
                  title="Login / Sign Up"
                >
                  <UserIcon className="w-5 h-5 text-[#6E121E] transition-transform duration-200 group-hover:scale-105" />
                  <span className="hidden sm:inline text-xs font-semibold text-[#6E121E]">
                    Login / Sign Up
                  </span>
                  <span className="sr-only">Login / Sign Up</span>
                </Link>
              )}

              {/* Wishlist Link */}
              <Link
                href="/wishlist"
                aria-label={`View Wishlist (${totalWishlistCount} saved sarees)`}
                className="p-1.5 min-[360px]:p-2 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] hover:scale-105 active:scale-95 rounded-full transition-all duration-200 relative group cursor-pointer"
                title="View Wishlist"
              >
                <Heart className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                {totalWishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#6E121E] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FAF7F2] animate-in zoom-in-75 duration-200">
                    {totalWishlistCount}
                  </span>
                )}
                <span className="sr-only">Wishlist</span>
              </Link>

              {/* Cart Link */}
              <Link
                href="/cart"
                aria-label="View Shopping Cart"
                className="p-1.5 min-[360px]:p-2 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] hover:scale-105 active:scale-95 rounded-full transition-all duration-200 relative group"
                title="View Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#6E121E] text-[#FFF] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FAF7F2]">
                    {totalCartCount}
                  </span>
                )}
                <span className="sr-only">Shopping Cart</span>
              </Link>

              {/* Quick WhatsApp button on desktop */}
              <a
                href={generalWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1E3F34] text-white text-xs font-semibold tracking-wider btn-premium-whatsapp shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel - Positioned directly below top mobile navbar */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            id="mobile-navigation-panel"
            className="lg:hidden absolute top-full left-0 right-0 w-full bg-[#FAF7F2] border-b border-[#C5A059]/40 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200 overflow-hidden"
          >
            <nav
              aria-label="Mobile Navigation Menu"
              className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 divide-y divide-[#E8E0D2]/70"
            >
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-3.5 px-3 rounded-xl text-base font-serif-luxury font-bold text-[#1E1715] hover:text-[#6E121E] hover:bg-[#FAF0DC]/60 active:bg-[#FAF0DC] transition group"
              >
                <span>Home</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:text-[#6E121E] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/#collections"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-3.5 px-3 rounded-xl text-base font-serif-luxury font-bold text-[#1E1715] hover:text-[#6E121E] hover:bg-[#FAF0DC]/60 active:bg-[#FAF0DC] transition group"
              >
                <span>Collections</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:text-[#6E121E] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/sarees"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-3.5 px-3 rounded-xl text-base font-serif-luxury font-bold text-[#6E121E] hover:bg-[#FAF0DC]/60 active:bg-[#FAF0DC] transition group"
              >
                <span>Sarees</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:text-[#6E121E] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-3.5 px-3 rounded-xl text-base font-serif-luxury font-bold text-[#1E1715] hover:text-[#6E121E] hover:bg-[#FAF0DC]/60 active:bg-[#FAF0DC] transition group"
              >
                <span>About</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:text-[#6E121E] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-3.5 px-3 rounded-xl text-base font-serif-luxury font-bold text-[#1E1715] hover:text-[#6E121E] hover:bg-[#FAF0DC]/60 active:bg-[#FAF0DC] transition group"
              >
                <span>Contact</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:text-[#6E121E] group-hover:translate-x-1 transition-all" />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Backdrop Overlay to close mobile menu when tapping outside */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Interactive Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-[#FAF7F2] w-full max-w-2xl rounded-xl shadow-2xl border border-[#C5A059]/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-[#E8E0D2] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Search className="w-5 h-5 text-[#8C7A6B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by saree type (Pattu, Fancy, Daily Wear)..."
                  className="w-full bg-transparent text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none text-base sm:text-lg font-serif-luxury"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href="/sarees"
                  onClick={() => setIsSearchOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wider bg-white hover:bg-[#FAF6EE] text-[#6E121E] border border-[#E8E0D2] hover:border-[#C5A059] transition shadow-2xs"
                  title="Search by Saree Image in Catalogue"
                  aria-label="Search by saree photo in catalogue"
                >
                  <Camera className="w-4 h-4 text-[#C5A059]" />
                  <span className="hidden sm:inline">Search by Photo</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="p-1.5 rounded-full hover:bg-[#F0EAE1] text-[#8C7A6B] hover:text-[#2C2420] transition cursor-pointer"
                  aria-label="Close search modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Suggestions or Results */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {searchQuery.trim() === "" ? (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold mb-3">
                    Shop Collections
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Heritage Silks",
                      "Pattu Sarees",
                      "Contemporary Elegance",
                      "Fancy Sarees",
                      "Everyday Grace",
                      "Daily Wear Sarees",
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(tag)}
                        className="text-xs px-3 py-1.5 rounded-full bg-[#F4EFE6] text-[#6E121E] hover:bg-[#E8E0D2] border border-[#E8E0D2] transition font-medium"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : filteredSarees.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">
                    Matching Sarees ({filteredSarees.length})
                  </h4>
                  <div className="divide-y divide-[#E8E0D2]">
                    {filteredSarees.map((saree) => (
                      <Link
                        key={saree.id}
                        href={`/sarees/${saree.id}`}
                        className="py-3 flex items-center justify-between gap-4 hover:bg-[#F5EFE6] px-2 rounded-lg transition cursor-pointer"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                          onOpenSaree(saree);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-16 rounded overflow-hidden bg-stone-200 flex-shrink-0">
                            <Image
                              src={saree.image}
                              alt={saree.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h5 className="font-serif-luxury text-base font-semibold text-[#2C2420]">
                              {saree.name}
                            </h5>
                            <p className="text-xs text-[#8C7A6B]">{saree.categoryLabel}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-[#6E121E]">
                            {formatCurrency(saree.price)}
                          </p>
                          <span className="text-[11px] text-[#C5A059] flex items-center gap-1 justify-end">
                            View Details <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#8C7A6B]">
                  <p className="text-sm">No sarees found matching &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-xs mt-1 text-[#6E121E]">
                    Try searching for &quot;Pattu&quot;, &quot;Fancy&quot;, or &quot;Daily Wear&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
