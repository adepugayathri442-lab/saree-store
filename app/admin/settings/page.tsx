"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { SHOP_CONFIG } from "@/config/shop";

interface StoreSettings {
  storeName: string;
  tagline: string;
  ownerName: string;
  contactPhone: string;
  whatsappNumber: string;
  supportEmail: string;
  addressLine: string;
  cityState: string;
  pincode: string;
  operatingHours: string;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  deliveryEstimateDays: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: SHOP_CONFIG.brandName,
  tagline: SHOP_CONFIG.tagline,
  ownerName: "Gangadhar Adepu",
  contactPhone: SHOP_CONFIG.phone,
  whatsappNumber: SHOP_CONFIG.whatsappNumber,
  supportEmail: "saisrujanaarmoor@gmail.com",
  addressLine: "Opposite Bus Stand, Main Road",
  cityState: "Armoor, Nizamabad District, Telangana",
  pincode: "503224",
  operatingHours: "10:00 AM – 9:00 PM IST (Mon – Sun)",
  freeDeliveryThreshold: 2000,
  standardDeliveryFee: 80,
  deliveryEstimateDays: "2 - 5 business days across India",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("saisrujana_store_settings");
      if (saved) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("saisrujana_store_settings", JSON.stringify(settings));
    }

    setTimeout(() => {
      setIsSaving(false);
      setToastMessage("Boutique settings updated successfully.");
      setTimeout(() => setToastMessage(null), 3500);
    }, 400);
  };

  return (
    <AdminLayout
      title="Store Settings & Configuration"
      subtitle="Manage boutique contact information, physical location, and delivery policies"
    >
      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        {/* Toast */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Security Notice */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Operational Settings Security Notice</p>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              This settings panel exclusively manages public-facing store identity and delivery policies. Database credentials, Supabase API keys, and authentication secrets are strictly managed via server environment variables and are never stored or exposed here.
            </p>
          </div>
        </div>

        {/* 1. Brand Identity */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E0D2]">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                Boutique Brand Identity
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Public brand name and luxury heritage tagline
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Proprietor / Master Weaver Name
              </label>
              <input
                type="text"
                value={settings.ownerName}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#1E1715] mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
              />
            </div>
          </div>
        </div>

        {/* 2. Customer Contact & WhatsApp Channels */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E0D2]">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                Contact & WhatsApp Channels
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Numbers used for order inquiries, WhatsApp notifications, and customer support
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Direct Contact Phone
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Boutique WhatsApp Number
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Support Email Address
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
              />
            </div>
          </div>
        </div>

        {/* 3. Physical Boutique Address */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E0D2]">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                Physical Boutique Location
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Storefront address printed on order receipts and shown on invoice
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#1E1715] mb-1">
                Street & Landmark Address
              </label>
              <input
                type="text"
                value={settings.addressLine}
                onChange={(e) => setSettings({ ...settings, addressLine: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Postal Code (PIN)
              </label>
              <input
                type="text"
                value={settings.pincode}
                onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#1E1715] mb-1">
                City, District & State
              </label>
              <input
                type="text"
                value={settings.cityState}
                onChange={(e) => setSettings({ ...settings, cityState: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                value={settings.operatingHours}
                onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
              />
            </div>
          </div>
        </div>

        {/* 4. Delivery Policies */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E0D2]">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                Fulfillment & Delivery Policy Overview
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                General courier guidelines and free shipping thresholds
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Free Delivery Above (₹)
              </label>
              <input
                type="number"
                value={settings.freeDeliveryThreshold}
                onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) || 0 })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Standard Shipping Fee (₹)
              </label>
              <input
                type="number"
                value={settings.standardDeliveryFee}
                onChange={(e) => setSettings({ ...settings, standardDeliveryFee: Number(e.target.value) || 0 })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Estimated Transit Window
              </label>
              <input
                type="text"
                value={settings.deliveryEstimateDays}
                onChange={(e) => setSettings({ ...settings, deliveryEstimateDays: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
              />
            </div>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Settings..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
