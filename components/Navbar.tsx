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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    if (isUserDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  const totalCartCount =
    propCart !== undefined
      ? propCart.reduce((acc, item) => acc + item.quantity, 0)
      : totalCount;



  const availableSarees = sarees && sarees.length > 0 ? sarees : FEATURED_SAREES;

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
              className="hover:text-white transition hidden sm:flex items-center gap-1.5 text-[#E5D2A4] font-medium"
              title={isLoggedIn ? "My Account" : "Customer Login / Signup"}
            >
              <UserIcon className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="max-w-[120px] truncate">
                {isLoggedIn ? (customerName || "My Account") : "Login"}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E0D2] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                className="p-2 rounded-md text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] focus:outline-none transition"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Brand Logo & Name */}
            <div className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start">
              <Link href="/" className="group flex flex-col items-center lg:items-start">
                <span className="font-serif-luxury text-2xl sm:text-3xl tracking-[0.16em] font-bold text-[#6E121E] group-hover:text-[#821524] transition">
                  {SHOP_CONFIG.brandName}
                </span>
                <span className="text-[10px] tracking-[0.28em] text-[#8C7A6B] uppercase -mt-0.5 font-medium">
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
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Search Icon */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search Sarees"
                className="p-2 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] hover:scale-105 active:scale-95 rounded-full transition-all duration-200 relative group"
                title="Search Sarees"
              >
                <Search className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
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
                    className="p-1.5 sm:px-3 sm:py-1.5 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-[#C5A059]/40 relative"
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
                  aria-label="Customer Login"
                  className="p-2 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] hover:scale-105 active:scale-95 rounded-full transition-all duration-200 relative group flex items-center gap-1.5 cursor-pointer"
                  title="Login / Register"
                >
                  <UserIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                  <span className="hidden sm:inline text-xs font-semibold text-[#6E121E]">
                    Login
                  </span>
                  <span className="sr-only">Login</span>
                </Link>
              )}

              {/* Wishlist Link */}
              <Link
                href="/wishlist"
                aria-label={`View Wishlist (${totalWishlistCount} saved sarees)`}
                className="p-2 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] hover:scale-105 active:scale-95 rounded-full transition-all duration-200 relative group cursor-pointer"
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
                className="p-2 text-[#2C2420] hover:text-[#6E121E] hover:bg-[#F0EAE1] hover:scale-105 active:scale-95 rounded-full transition-all duration-200 relative group"
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

        {/* Mobile Navigation Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#FAF7F2] border-b border-[#E8E0D2] px-6 py-6 animate-in slide-in-from-top duration-200 shadow-xl">
            <div className="flex flex-col space-y-4 text-base font-medium text-[#2C2420]">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#6E121E] py-2 border-b border-[#E8E0D2]/50 flex items-center justify-between transition-colors duration-200 group"
              >
                <span>Home</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/#collections"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#6E121E] py-2 border-b border-[#E8E0D2]/50 flex items-center justify-between transition-colors duration-200 group"
              >
                <span>Collections</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/sarees"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#6E121E] py-2 border-b border-[#E8E0D2]/50 flex items-center justify-between font-semibold text-[#6E121E] transition-colors duration-200 group"
              >
                <span>Explore Sarees</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#6E121E] py-2 border-b border-[#E8E0D2]/50 flex items-center justify-between transition-colors duration-200 group"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#6E121E]" />
                  <span>Wishlist / Saved Sarees</span>
                  {totalWishlistCount > 0 && (
                    <span className="bg-[#6E121E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {totalWishlistCount}
                    </span>
                  )}
                </span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#6E121E] py-2 border-b border-[#E8E0D2]/50 flex items-center justify-between transition-colors duration-200 group"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#6E121E]" />
                  <span>Cart / Inquiry Bag</span>
                  {totalCartCount > 0 && (
                    <span className="bg-[#6E121E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {totalCartCount}
                    </span>
                  )}
                </span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              {/* Logged-In Patron Account Navigation Links */}
              {isLoggedIn ? (
                <div className="pt-2 pb-2 border-y border-[#E8E0D2]/70 space-y-2 bg-[#FAF0DC]/30 p-3 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#6E121E] uppercase tracking-wider">
                      Patron Account: {customerName ? customerName.split(" ")[0] : "Profile"}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await signOut();
                      }}
                      className="text-xs text-rose-700 font-semibold hover:underline cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>

                  {/* Prominent Your Orders in Mobile Drawer */}
                  <Link
                    href="/account?tab=orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#6E121E] text-white text-sm font-bold shadow-xs cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#E5D2A4]" />
                      <span>Your Orders</span>
                    </span>
                    <span className="text-xs text-[#E5D2A4] font-normal">Track ↗</span>
                  </Link>

                  <Link
                    href="/account?tab=addresses"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between py-1.5 px-3 rounded-xl text-xs font-semibold text-[#5C4D44] hover:text-[#6E121E] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#6E121E]" />
                      <span>Saved Addresses</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                  </Link>

                  <Link
                    href="/account?tab=notifications"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between py-1.5 px-3 rounded-xl text-xs font-semibold text-[#5C4D44] hover:text-[#6E121E] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="relative">
                        <Bell className="w-3.5 h-3.5 text-[#6E121E]" />
                        {unreadNotifCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        )}
                      </span>
                      <span>Notifications</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {unreadNotifCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                          {unreadNotifCount}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                    </div>
                  </Link>

                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between py-1.5 px-3 rounded-xl text-xs font-semibold text-[#5C4D44] hover:text-[#6E121E] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-[#6E121E]" />
                      <span>Full Account Overview</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-[#6E121E] py-2 border-b border-[#E8E0D2]/50 flex items-center justify-between transition-colors duration-200 group"
                >
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#6E121E]" />
                    <span>Customer Login / Signup</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              )}
              <Link
                href="/#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#6E121E] py-2 border-b border-[#E8E0D2]/50 flex items-center justify-between transition-colors duration-200 group"
              >
                <span>About SaiSrujana</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#6E121E] py-2 border-b border-[#E8E0D2]/50 flex items-center justify-between transition-colors duration-200 group"
              >
                <span>Contact & Store Location</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8E0D2] flex flex-col gap-3">
              <a
                href={generalWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#1E3F34] text-white rounded-md text-sm font-medium tracking-wide shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                <span>Chat on WhatsApp: {SHOP_CONFIG.phoneFormatted}</span>
              </a>
              <a
                href={`tel:${SHOP_CONFIG.phone}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#FAF6EE] text-[#6E121E] border border-[#C5A059]/40 rounded-md text-sm font-medium"
              >
                <Phone className="w-4 h-4 text-[#C5A059]" />
                <span>Call {SHOP_CONFIG.contactPerson}: {SHOP_CONFIG.phoneFormatted}</span>
              </a>
            </div>
          </div>
        )}
      </header>

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
