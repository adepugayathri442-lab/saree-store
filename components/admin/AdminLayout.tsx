"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  Users,
  BarChart3,
  Tag,
  Sparkles,
  Settings,
  Star,
  MessageSquare,
  LogOut,
  Store,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import { SHOP_CONFIG } from "@/config/shop";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: Package },
  { label: "Sarees", href: "/admin/sarees", icon: Layers },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Offers", href: "/admin/coupons", icon: Tag },
  { label: "Homepage", href: "/admin/homepage", icon: Sparkles },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const SECONDARY_ITEMS = [
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare },
];

export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <AdminGuard>
      {({ user, onLogout }) => (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-[#2C2420]">
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Desktop & Mobile Drawer Sidebar */}
          <aside
            className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#1E1715] text-[#FAF7F2] border-r border-[#382D28] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Sidebar Brand Header */}
            <div className="p-5 border-b border-[#382D28] flex items-center justify-between">
              <Link
                href="/admin"
                className="flex items-center gap-3 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#821524] to-[#590D18] border border-[#C5A059]/40 flex items-center justify-center text-[#E5D2A4] font-serif-luxury font-bold text-lg shadow-sm">
                  SS
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif-luxury font-bold text-base tracking-wide text-white group-hover:text-[#E5D2A4] transition-colors">
                      {SHOP_CONFIG.brandName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#C5A059]/20 text-[#E5D2A4] border border-[#C5A059]/30">
                      Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A69888] font-light">
                    Armoor, Telangana
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-[#A69888] hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
                aria-label="Close sidebar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Navigation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Primary Links */}
              <div>
                <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                  Management
                </span>
                <nav className="mt-2 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          active
                            ? "bg-gradient-to-r from-[#6E121E] to-[#821524] text-white shadow-sm border border-[#C5A059]/40 font-semibold"
                            : "text-[#D9CEBF] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 ${
                              active ? "text-[#E5D2A4]" : "text-[#A69888]"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {active && (
                          <ChevronRight className="w-3.5 h-3.5 text-[#E5D2A4]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Engagement / Communications */}
              <div>
                <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                  Communications
                </span>
                <nav className="mt-2 space-y-1">
                  {SECONDARY_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          active
                            ? "bg-gradient-to-r from-[#6E121E] to-[#821524] text-white shadow-sm border border-[#C5A059]/40 font-semibold"
                            : "text-[#D9CEBF] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 ${
                              active ? "text-[#E5D2A4]" : "text-[#A69888]"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {active && (
                          <ChevronRight className="w-3.5 h-3.5 text-[#E5D2A4]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Sidebar Footer with Live Storefront link & User Info */}
            <div className="p-4 border-t border-[#382D28] space-y-3 bg-[#171210]">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#E5D2A4] transition border border-[#C5A059]/20"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>View Storefront</span>
                </div>
                <ExternalLink className="w-3 h-3 text-[#A69888]" />
              </Link>

              <div className="flex items-center justify-between pt-1">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{user.email || "Administrator"}</span>
                  </div>
                  <span className="text-[10px] text-[#A69888]">Authenticated Admin</span>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out of Admin Portal"
                  className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-500/30 transition cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* Main Layout Area */}
          <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E8E0D2] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 rounded-xl border border-[#E8E0D2] bg-white text-[#1E1715] hover:bg-[#FAF6EE] lg:hidden cursor-pointer"
                  aria-label="Open sidebar menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="min-w-0">
                  <h1 className="font-serif-luxury font-bold text-lg sm:text-xl text-[#1E1715] truncate">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-[#8C7A6B] truncate hidden sm:block">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons Slot */}
              <div className="flex items-center gap-2.5 shrink-0">
                {actions}
              </div>
            </header>

            {/* Page Content Container */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
