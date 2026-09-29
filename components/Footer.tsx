"use client";

import Link from "next/link";
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Heart,
  ShoppingBag,
  User,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons/Instagram";
import { SHOP_CONFIG, getWhatsAppUrl } from "@/config/shop";

export default function Footer() {
  const footerWhatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am contacting you from the SaiSrujana website.`
  );

  return (
    <footer className="bg-[#1C1614] text-[#E8E0D2] pt-16 pb-12 border-t border-[#C5A059]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid: 5 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-14 border-b border-[#3D332D]">
          {/* Column 1: Brand, Tagline & Proprietor (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <Link href="/" className="inline-block">
                <span className="font-serif-luxury text-3xl sm:text-4xl tracking-[0.16em] font-bold text-[#E5D2A4]">
                  {SHOP_CONFIG.brandName}
                </span>
                <span className="text-[11px] tracking-[0.24em] text-[#C5A059] uppercase block mt-0.5 font-medium">
                  {SHOP_CONFIG.tagline}
                </span>
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-[#A8988B] font-light leading-relaxed max-w-sm">
              Your destination for authentic Pattu silk sarees, designer fancy sarees, and comfortable daily wear sarees in Armoor, Nizamabad. Handpicked with care and offered with direct boutique consultation.
            </p>
            <div className="pt-2 text-xs text-[#E5D2A4]">
              <span className="text-[#C5A059] font-medium">Proprietor:</span> {SHOP_CONFIG.contactPerson}
            </div>

            {/* Instagram Link */}
            {SHOP_CONFIG.instagramUrl && (
              <div className="pt-2">
                <a
                  href={SHOP_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-[#E5D2A4] hover:text-white transition"
                  title="SaiSrujana Instagram"
                >
                  <InstagramIcon className="w-4 h-4 text-[#C5A059]" />
                  <span>{SHOP_CONFIG.instagramUsername}</span>
                </a>
              </div>
            )}
          </div>

          {/* Column 2: Shop (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif-luxury text-sm font-bold text-[#FAF7F2] tracking-wider uppercase">
              Shop Sarees
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A8988B]">
              <li>
                <Link href="/sarees" className="hover:text-[#E5D2A4] transition font-medium text-[#E5D2A4]">
                  All Sarees
                </Link>
              </li>
              <li>
                <Link href="/sarees?category=heritage-silks" className="hover:text-[#E5D2A4] transition">
                  Pattu Sarees
                </Link>
              </li>
              <li>
                <Link href="/sarees?category=contemporary-elegance" className="hover:text-[#E5D2A4] transition">
                  Fancy Sarees
                </Link>
              </li>
              <li>
                <Link href="/sarees?category=everyday-grace" className="hover:text-[#E5D2A4] transition">
                  Daily Wear Sarees
                </Link>
              </li>
              <li>
                <Link href="/sarees" className="hover:text-[#E5D2A4] transition">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif-luxury text-sm font-bold text-[#FAF7F2] tracking-wider uppercase">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A8988B]">
              <li>
                <Link href="/wishlist" className="hover:text-[#E5D2A4] transition flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Wishlist</span>
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-[#E5D2A4] transition flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Shopping Cart</span>
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-[#E5D2A4] transition flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>My Account</span>
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-[#E5D2A4] transition">
                  Contact Store
                </Link>
              </li>
              <li>
                <Link href="/account?tab=orders" className="hover:text-[#E5D2A4] transition">
                  Track Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Boutique & Policies (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif-luxury text-sm font-bold text-[#FAF7F2] tracking-wider uppercase">
              Boutique
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A8988B]">
              <li>
                <Link href="/about" className="hover:text-[#E5D2A4] transition">
                  About SaiSrujana
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-[#E5D2A4] transition">
                  Store Location
                </Link>
              </li>
              <li>
                <Link href="/policies#shipping" className="hover:text-[#E5D2A4] transition">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/policies#returns" className="hover:text-[#E5D2A4] transition">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/policies#privacy" className="hover:text-[#E5D2A4] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies#terms" className="hover:text-[#E5D2A4] transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Store & Direct Connect (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="font-serif-luxury text-sm font-bold text-[#FAF7F2] tracking-wider uppercase">
              Armoor Showroom
            </h4>
            <div className="space-y-2 text-xs text-[#A8988B]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                <span>Armoor, Nizamabad, Telangana</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <a
                  href={`tel:${SHOP_CONFIG.phone}`}
                  className="hover:text-[#E5D2A4] transition"
                >
                  {SHOP_CONFIG.phoneFormatted}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <a
                  href={`mailto:${SHOP_CONFIG.email}`}
                  className="hover:text-[#E5D2A4] transition truncate max-w-[150px]"
                  title={SHOP_CONFIG.email}
                >
                  {SHOP_CONFIG.email}
                </a>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={footerWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold rounded transition shadow-sm w-fit"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
                <span>WhatsApp</span>
              </a>

              <a
                href={SHOP_CONFIG.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#C5A059] hover:text-[#E5D2A4] transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Location */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78695E]">
          <p>© {new Date().getFullYear()} {SHOP_CONFIG.brandName}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>{SHOP_CONFIG.cityState}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#E5D2A4]">
              <Sparkles className="w-3 h-3 text-[#C5A059]" /> {SHOP_CONFIG.tagline}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
