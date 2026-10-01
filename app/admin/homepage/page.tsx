"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Search,
  Star,
  CheckCircle2,
  ExternalLink,
  Save,
  Eye,
  Sliders,
  Store,
  Layers,
  Flame,
  Award,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { createBrowserClient } from "@/lib/supabase/client";
import { Saree } from "@/types/saree";
import { mapDbRowToSaree, DbSareeRow, updateSareeInDb } from "@/lib/supabase/sarees";
import { formatCurrency, SHOP_CONFIG } from "@/config/shop";
import { revalidateSareeCache } from "@/app/actions/sarees";

interface HomepageContentConfig {
  announcementText: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroBadge: string;
  showHero: boolean;
  showFeatured: boolean;
  showNewArrivals: boolean;
  showCategories: boolean;
  showServices: boolean;
}

const DEFAULT_HOMEPAGE_CONFIG: HomepageContentConfig = {
  announcementText: "✨ Handcrafted Pure Zari Silks • Handpicked Boutique Weaves • Armoor, Telangana",
  heroHeadline: "Timeless Drape of Royal Indian Heritage",
  heroSubtitle: "Handwoven bridal Kanchipuram pattu, exquisite organzas, and graceful handlooms curated by Gangadhar Adepu in Armoor.",
  heroBadge: "Authentic Armoor Boutique Collection",
  showHero: true,
  showFeatured: true,
  showNewArrivals: true,
  showCategories: true,
  showServices: true,
};

export default function AdminHomepagePage() {
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Merchandising / Banner Config
  const [config, setConfig] = useState<HomepageContentConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load configuration from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("saisrujana_homepage_config");
      if (saved) {
        try {
          setConfig({ ...DEFAULT_HOMEPAGE_CONFIG, ...JSON.parse(saved) });
        } catch {
          // ignore parsing error
        }
      }
    }
  }, []);

  const loadSarees = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("sarees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      const mapped = (data as DbSareeRow[] || []).map(mapDbRowToSaree);
      setSarees(mapped);
    } catch (err) {
      console.error("Error loading sarees for homepage manager:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSarees();
  }, [loadSarees]);

  // Toggle Featured status
  const handleToggleFeatured = async (saree: Saree) => {
    setUpdatingId(saree.id);
    const newValue = !saree.isFeatured;
    try {
      const res = await updateSareeInDb(saree.id, { isFeatured: newValue });
      if (!res.success) {
        alert(res.error?.message || "Failed to update featured status");
        return;
      }

      setSarees((prev) =>
        prev.map((s) => (s.id === saree.id ? { ...s, isFeatured: newValue } : s))
      );
      setToastMessage(`"${saree.name}" ${newValue ? "added to" : "removed from"} Featured Collection.`);
      setTimeout(() => setToastMessage(null), 3000);
      revalidateSareeCache(saree.id).catch(() => {});
    } catch {
      alert("Error toggling featured status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle New Arrival status
  const handleToggleNewArrival = async (saree: Saree) => {
    setUpdatingId(saree.id);
    const newValue = !saree.isNewArrival;
    try {
      const res = await updateSareeInDb(saree.id, { isNewArrival: newValue });
      if (!res.success) {
        alert(res.error?.message || "Failed to update new arrival status");
        return;
      }

      setSarees((prev) =>
        prev.map((s) => (s.id === saree.id ? { ...s, isNewArrival: newValue } : s))
      );
      setToastMessage(`"${saree.name}" ${newValue ? "marked as" : "removed from"} New Arrivals.`);
      setTimeout(() => setToastMessage(null), 3000);
      revalidateSareeCache(saree.id).catch(() => {});
    } catch {
      alert("Error toggling new arrival status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Save banner & visibility configuration
  const handleSaveConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("saisrujana_homepage_config", JSON.stringify(config));
      setToastMessage("Homepage merchandising settings updated successfully.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const featuredSarees = useMemo(() => sarees.filter((s) => s.isFeatured), [sarees]);
  const newArrivalSarees = useMemo(() => sarees.filter((s) => s.isNewArrival), [sarees]);

  const filteredSarees = useMemo(() => {
    if (!searchTerm.trim()) return sarees;
    const q = searchTerm.toLowerCase();
    return sarees.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.categoryLabel.toLowerCase().includes(q)
    );
  }, [sarees, searchTerm]);

  return (
    <AdminLayout
      title="Homepage Merchandising & Content"
      subtitle={`Curate featured sarees, new arrivals, promotional banners, and section visibility on the storefront`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E0D2] bg-white hover:bg-[#FAF6EE] text-[#1E1715] text-xs font-semibold uppercase tracking-wider transition shadow-2xs"
          >
            <Store className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>View Live Site</span>
            <ExternalLink className="w-3 h-3 text-[#8C7A6B]" />
          </Link>
          <button
            type="button"
            onClick={loadSarees}
            disabled={loading}
            className="p-2 rounded-xl border border-[#E8E0D2] bg-white text-[#1E1715] hover:bg-[#FAF6EE] transition shadow-2xs"
            title="Refresh catalogue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#C5A059]" : ""}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Toast */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* 1. Quick Merchandising Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#C5A059]/40 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6E121E] uppercase tracking-wider">
                Featured Collection
              </span>
              <Star className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" />
            </div>
            <p className="font-serif-luxury text-3xl font-bold text-[#1E1715]">
              {featuredSarees.length}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">Sarees showcased on homepage hero grid</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                New Arrivals
              </span>
              <Sparkles className="w-4 h-4 text-rose-600" />
            </div>
            <p className="font-serif-luxury text-3xl font-bold text-rose-700">
              {newArrivalSarees.length}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">Sarees marked with &ldquo;New Arrival&rdquo; badge</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">
                Total Available
              </span>
              <Layers className="w-4 h-4 text-[#8C7A6B]" />
            </div>
            <p className="font-serif-luxury text-3xl font-bold text-[#1E1715]">
              {sarees.length}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">Ready for homepage curation</p>
          </div>
        </div>

        {/* 2. Banner & Promotional Text Management */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
            <div>
              <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                Storefront Banner & Announcement Text
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Configure the top ticker and hero messaging
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Text</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Top Announcement Bar Ticker
              </label>
              <input
                type="text"
                value={config.announcementText}
                onChange={(e) => setConfig({ ...config, announcementText: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
              />
              <p className="text-[11px] text-[#8C7A6B] mt-1">
                Appears at the very top of every storefront page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#1E1715] mb-1">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={config.heroHeadline}
                  onChange={(e) => setConfig({ ...config, heroHeadline: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E1715] mb-1">
                  Hero Badge Tag
                </label>
                <input
                  type="text"
                  value={config.heroBadge}
                  onChange={(e) => setConfig({ ...config, heroBadge: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1E1715] mb-1">
                Hero Subtitle Description
              </label>
              <textarea
                rows={2}
                value={config.heroSubtitle}
                onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8E0D2] bg-stone-50 focus:bg-white focus:border-[#6E121E] outline-hidden font-medium resize-none"
              />
            </div>

            {/* Section Visibility Toggles */}
            <div className="pt-3 border-t border-[#E8E0D2] space-y-2">
              <label className="block font-bold text-[#1E1715] mb-2 uppercase tracking-wider text-[11px]">
                Homepage Section Visibility
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { key: "showHero", label: "Hero Banner" },
                  { key: "showFeatured", label: "Featured Silks" },
                  { key: "showNewArrivals", label: "New Arrivals" },
                  { key: "showCategories", label: "Craft Categories" },
                  { key: "showServices", label: "Boutique Services" },
                ].map((sec) => (
                  <label
                    key={sec.key}
                    className="p-3 rounded-xl border border-[#E8E0D2] bg-white flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-[#FAF6EE]"
                  >
                    <span>{sec.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(config[sec.key as keyof HomepageContentConfig])}
                      onChange={(e) =>
                        setConfig({ ...config, [sec.key]: e.target.checked })
                      }
                      className="w-4 h-4 text-[#6E121E] rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Interactive Saree Showcase Merchandising Table */}
        <div className="bg-white rounded-3xl border border-[#E8E0D2] shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                Saree Display Curation
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Click toggles to instantly feature or mark sarees as new arrivals on the storefront
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sarees to feature..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-[#E8E0D2] text-xs text-[#2C2420] outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#8C7A6B] uppercase tracking-wider text-[10px] font-bold border-b border-[#E8E0D2]">
                <tr>
                  <th className="py-3 px-4">Saree Design</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Featured on Homepage</th>
                  <th className="py-3 px-4 text-center">New Arrival Badge</th>
                  <th className="py-3 px-4 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D2]">
                {filteredSarees.map((saree) => {
                  const isUpdating = updatingId === saree.id;

                  return (
                    <tr key={saree.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-12 rounded-lg bg-stone-100 overflow-hidden border border-[#E8E0D2] shrink-0">
                            <Image
                              src={saree.image}
                              alt={saree.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-[#1E1715]">{saree.name}</p>
                            <p className="text-[11px] font-mono text-[#8C7A6B]">
                              SKU: {saree.sku}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#5A4E46]">
                        {saree.categoryLabel}
                      </td>

                      <td className="py-3 px-4 font-bold text-[#1E1715]">
                        {formatCurrency(Number(saree.price) || 0)}
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(saree)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            saree.isFeatured
                              ? "bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]"
                              : "bg-white text-[#8C7A6B] border border-[#E8E0D2] hover:bg-stone-50"
                          }`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              saree.isFeatured ? "fill-[#C5A059] text-[#C5A059]" : ""
                            }`}
                          />
                          <span>{saree.isFeatured ? "Featured" : "Showcase"}</span>
                        </button>
                      </td>

                      {/* New Arrival Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleNewArrival(saree)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            saree.isNewArrival
                              ? "bg-rose-50 text-rose-800 border border-rose-300"
                              : "bg-white text-[#8C7A6B] border border-[#E8E0D2] hover:bg-stone-50"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{saree.isNewArrival ? "New Arrival" : "Mark New"}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/sarees/${saree.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-[#E8E0D2] bg-white text-[#5A4E46] hover:text-[#6E121E] inline-flex items-center justify-center transition"
                          title="View on site"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
