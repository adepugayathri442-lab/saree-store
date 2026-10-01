"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  Star,
  Sparkles,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { InstagramIcon } from "@/components/icons/Instagram";
import InstagramShareModal from "@/components/admin/InstagramShareModal";
import { createBrowserClient } from "@/lib/supabase/client";
import { Saree, SareeCategory } from "@/types/saree";
import {
  mapDbRowToSaree,
  DbSareeRow,
  deleteSareeFromDb,
  updateSareeInDb,
} from "@/lib/supabase/sarees";
import { formatCurrency, SHOP_CONFIG } from "@/config/shop";
import { revalidateSareeCache } from "@/app/actions/sarees";
import { removeRecentlyViewedSaree } from "@/lib/recentlyViewed";

const CATEGORY_TABS: { value: SareeCategory | "all"; label: string }[] = [
  { value: "all", label: "All Sarees" },
  { value: "heritage-silks", label: "Pattu Sarees" },
  { value: "contemporary-elegance", label: "Fancy Sarees" },
  { value: "everyday-grace", label: "Daily Wear Sarees" },
];

export default function AdminSareesPage() {
  const router = useRouter();
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SareeCategory | "all">("all");
  const [selectedStockState, setSelectedStockState] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [newArrivalOnly, setNewArrivalOnly] = useState(false);

  // Quick Edit Modal
  const [quickEditSaree, setQuickEditSaree] = useState<Saree | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
  const [editNewArrival, setEditNewArrival] = useState(false);
  const [isSavingQuick, setIsSavingQuick] = useState(false);

  // Instagram Marketing / Share Modal
  const [instagramShareSaree, setInstagramShareSaree] = useState<Saree | null>(null);

  // Delete / Archive Modal
  const [sareeToDelete, setSareeToDelete] = useState<Saree | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadSarees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data, error: fetchErr } = await supabase
        .from("sarees")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchErr) {
        throw new Error(fetchErr.message);
      }

      const mapped = (data as DbSareeRow[] || []).map(mapDbRowToSaree);
      setSarees(mapped);
    } catch (err) {
      console.error("Error loading sarees:", err);
      setError("Unable to load sarees from database. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSarees();
  }, [loadSarees]);

  // Filtering
  const filteredSarees = useMemo(() => {
    return sarees.filter((saree) => {
      // Category filter
      if (selectedCategory !== "all" && saree.category !== selectedCategory) {
        return false;
      }

      // Stock state filter
      if (selectedStockState === "in_stock" && saree.stockQuantity <= 5) {
        return false;
      }
      if (selectedStockState === "low_stock" && (saree.stockQuantity <= 0 || saree.stockQuantity > 5)) {
        return false;
      }
      if (selectedStockState === "out_of_stock" && saree.stockQuantity > 0 && saree.stockStatus.toLowerCase() !== "out of stock") {
        return false;
      }

      // Featured / New arrival
      if (featuredOnly && !saree.isFeatured) return false;
      if (newArrivalOnly && !saree.isNewArrival) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = saree.name.toLowerCase().includes(q);
        const matchesSku = saree.sku.toLowerCase().includes(q);
        const matchesFabric = saree.fabric?.toLowerCase().includes(q);
        const matchesCraft = saree.craft?.toLowerCase().includes(q);
        const matchesColor = saree.color?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesFabric && !matchesCraft && !matchesColor) {
          return false;
        }
      }

      return true;
    });
  }, [sarees, selectedCategory, selectedStockState, featuredOnly, newArrivalOnly, searchTerm]);

  // Handle Quick Edit Open
  const openQuickEdit = (saree: Saree) => {
    setQuickEditSaree(saree);
    setEditPrice(String(saree.price));
    setEditStock(String(saree.stockQuantity));
    setEditFeatured(Boolean(saree.isFeatured));
    setEditNewArrival(Boolean(saree.isNewArrival));
  };

  const handleSaveQuickEdit = async () => {
    if (!quickEditSaree) return;
    const numPrice = Number(editPrice);
    const numStock = Number(editStock);

    if (isNaN(numPrice) || numPrice < 0) {
      alert("Please enter a valid price");
      return;
    }
    if (isNaN(numStock) || numStock < 0) {
      alert("Please enter a valid stock quantity");
      return;
    }

    setIsSavingQuick(true);
    try {
      const stockStatus = numStock <= 0 ? "Out of Stock" : "In Stock";
      const res = await updateSareeInDb(quickEditSaree.id, {
        price: numPrice,
        stockQuantity: numStock,
        stockStatus,
        isFeatured: editFeatured,
        isNewArrival: editNewArrival,
      });

      if (!res.success) {
        alert(res.error?.message || "Failed to update saree");
        setIsSavingQuick(false);
        return;
      }

      setSarees((prev) =>
        prev.map((s) =>
          s.id === quickEditSaree.id
            ? {
                ...s,
                price: numPrice,
                stockQuantity: numStock,
                stockStatus,
                isFeatured: editFeatured,
                isNewArrival: editNewArrival,
              }
            : s
        )
      );

      setToastMessage(`Updated "${quickEditSaree.name}" successfully.`);
      setTimeout(() => setToastMessage(null), 3000);
      setQuickEditSaree(null);

      // Revalidate Next.js cache and refresh router
      try {
        await revalidateSareeCache(quickEditSaree.id);
        router.refresh();
      } catch {
        // non-blocking
      }
    } catch (err) {
      console.error("Quick edit save error:", err);
      alert("Unexpected error updating saree");
    } finally {
      setIsSavingQuick(false);
    }
  };

  // Safe Deletion with immediate cache invalidation and client-side sync
  const handleConfirmDelete = async () => {
    if (!sareeToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const deletedId = sareeToDelete.id;
    const deletedSku = sareeToDelete.sku;
    const deletedName = sareeToDelete.name;

    try {
      const res = await deleteSareeFromDb(deletedId);
      if (!res.success) {
        setDeleteError(res.error?.message || "Failed to delete saree from database");
        setIsDeleting(false);
        return;
      }

      // 1. Immediately invalidate Next.js server cache for customer routes
      try {
        await revalidateSareeCache(deletedId);
      } catch (revErr) {
        console.warn("Revalidation warning:", revErr);
      }

      // 2. Broadcast real-time deletion event to open customer tabs & windows
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("saisrujana:saree-deleted", {
            detail: { id: deletedId, sku: deletedSku },
          })
        );
        localStorage.setItem(
          "saisrujana:saree-deleted",
          JSON.stringify({ id: deletedId, sku: deletedSku, ts: Date.now() })
        );
      }

      // 3. Purge from local recently viewed storage
      removeRecentlyViewedSaree(deletedId);
      if (deletedSku) {
        removeRecentlyViewedSaree(deletedSku);
      }

      // 4. Update local admin table state
      setSarees((prev) => prev.filter((s) => s.id !== deletedId));
      setToastMessage(`Saree "${deletedName}" removed from catalogue.`);
      setTimeout(() => setToastMessage(null), 3000);
      setSareeToDelete(null);

      // 5. Invalidate Next.js client-side router cache
      router.refresh();
    } catch {
      setDeleteError("Unexpected error deleting saree");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Saree Catalogue Management"
      subtitle={`Manage all ${sarees.length} sarees in the ${SHOP_CONFIG.brandName} boutique collection`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sarees/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Saree</span>
          </Link>
          <button
            type="button"
            onClick={loadSarees}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#E8E0D2] bg-white text-[#1E1715] hover:bg-[#FAF6EE] transition shadow-2xs cursor-pointer"
            title="Refresh catalogue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#C5A059]" : ""}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-800 hover:text-emerald-950"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E0D2] pb-3">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.value === "all"
                ? sarees.length
                : sarees.filter((s) => s.category === tab.value).length;
            const active = selectedCategory === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedCategory(tab.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                  active
                    ? "bg-[#6E121E] text-white shadow-2xs"
                    : "bg-white border border-[#E8E0D2] text-[#5A4E46] hover:bg-[#FAF6EE]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-stone-100 text-[#8C7A6B]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by saree name, SKU, fabric, craft, or color..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E8E0D2] text-xs text-[#2C2420] placeholder-[#8C7A6B] focus:border-[#6E121E] outline-hidden"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#1E1715]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stock State Filter */}
            <select
              value={selectedStockState}
              onChange={(e) => setSelectedStockState(e.target.value as any)}
              aria-label="Filter by Stock Health"
              className="py-2.5 px-3 rounded-xl border border-[#E8E0D2] bg-white text-xs text-[#2C2420] focus:border-[#6E121E] outline-hidden"
            >
              <option value="all">All Stock Health</option>
              <option value="in_stock">In Stock (&gt; 5)</option>
              <option value="low_stock">Low Stock (1 - 5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {/* Featured & New Arrival Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeaturedOnly(!featuredOnly)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  featuredOnly
                    ? "bg-[#FAF0DC] text-[#6E121E] border-[#C5A059]"
                    : "bg-white text-[#8C7A6B] border-[#E8E0D2] hover:bg-[#FAF6EE]"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${featuredOnly ? "fill-[#C5A059] text-[#C5A059]" : ""}`} />
                <span>Featured</span>
              </button>

              <button
                type="button"
                onClick={() => setNewArrivalOnly(!newArrivalOnly)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  newArrivalOnly
                    ? "bg-rose-50 text-[#821524] border-rose-300"
                    : "bg-white text-[#8C7A6B] border-[#E8E0D2] hover:bg-[#FAF6EE]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Arrival</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => loadSarees()} className="underline font-semibold cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Sarees Table */}
        <div className="bg-white rounded-3xl border border-[#E8E0D2] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#8C7A6B]">Loading boutique catalogue from Supabase...</p>
            </div>
          ) : filteredSarees.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Layers className="w-10 h-10 text-[#C5A059] mx-auto opacity-70" />
              <h4 className="font-serif-luxury text-base font-bold text-[#1E1715]">
                No sarees found
              </h4>
              <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
                {searchTerm || selectedCategory !== "all" || selectedStockState !== "all"
                  ? "No sarees match your current filters. Try resetting search or selecting All."
                  : "No sarees exist in your database yet. Click 'Add Saree' to create your first catalogue item."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#8C7A6B] uppercase tracking-wider text-[10px] font-bold border-b border-[#E8E0D2]">
                  <tr>
                    <th className="py-3.5 px-4">Saree</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Badges</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D2]">
                  {filteredSarees.map((saree) => {
                    const isOutOfStock =
                      saree.stockQuantity <= 0 ||
                      saree.stockStatus.toLowerCase() === "out of stock";
                    const isLowStock =
                      saree.stockQuantity > 0 && saree.stockQuantity <= 5;

                    return (
                      <tr key={saree.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        {/* Image & Title */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-14 rounded-lg bg-stone-100 overflow-hidden border border-[#E8E0D2] shrink-0">
                              <Image
                                src={saree.image}
                                alt={saree.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <p className="font-bold text-[#1E1715] truncate">{saree.name}</p>
                              <p className="text-[11px] font-mono text-[#8C7A6B]">
                                SKU: {saree.sku}
                              </p>
                              {saree.fabric && (
                                <p className="text-[10px] text-[#A69888] truncate">
                                  {saree.fabric} • {saree.craft}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40 whitespace-nowrap">
                            {saree.categoryLabel}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-bold text-[#1E1715]">
                          {formatCurrency(Number(saree.price) || 0)}
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                                isOutOfStock
                                  ? "bg-rose-100 text-rose-900 border-rose-300"
                                  : isLowStock
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-emerald-100 text-emerald-900 border-emerald-300"
                              }`}
                            >
                              {isOutOfStock
                                ? "Out of Stock"
                                : isLowStock
                                ? `Low Stock (${saree.stockQuantity})`
                                : `In Stock (${saree.stockQuantity})`}
                            </span>
                          </div>
                        </td>

                        {/* Badges */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {saree.isFeatured && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                Featured
                              </span>
                            )}
                            {saree.isNewArrival && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200">
                                New
                              </span>
                            )}
                            {!saree.isFeatured && !saree.isNewArrival && (
                              <span className="text-[11px] text-[#A69888]">—</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openQuickEdit(saree)}
                              title="Quick price & stock edit"
                              className="p-1.5 rounded-lg border border-[#E8E0D2] bg-white text-[#5A4E46] hover:text-[#6E121E] hover:bg-[#FAF6EE] transition cursor-pointer"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/admin/sarees/${saree.id}/edit`}
                              title="Full edit"
                              className="p-1.5 rounded-lg border border-[#E8E0D2] bg-white text-[#5A4E46] hover:text-[#6E121E] hover:bg-[#FAF6EE] transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>

                            <Link
                              href={`/sarees/${saree.id}`}
                              target="_blank"
                              title="View on storefront"
                              className="p-1.5 rounded-lg border border-[#E8E0D2] bg-white text-[#5A4E46] hover:text-[#1E3F34] hover:bg-[#FAF6EE] transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setInstagramShareSaree(saree)}
                              title="Instagram Marketing & Share"
                              aria-label={`Share ${saree.name} on Instagram`}
                              className="p-1.5 rounded-lg border border-[#E8E0D2] bg-white text-[#5A4E46] hover:text-[#DD2A7B] hover:bg-gradient-to-tr hover:from-amber-50 hover:to-rose-50 hover:border-rose-300 transition cursor-pointer"
                            >
                              <InstagramIcon className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSareeToDelete(saree)}
                              title="Delete saree"
                              className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Edit Modal */}
      {quickEditSaree && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-[#E8E0D2] shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
              <div>
                <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                  Quick Edit Saree
                </h3>
                <p className="text-xs text-[#8C7A6B] truncate max-w-xs">
                  {quickEditSaree.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditSaree(null)}
                className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#1E1715]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1E1715] mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E0D2] focus:border-[#6E121E] outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E1715] mb-1">
                  Stock Quantity (units)
                </label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E0D2] focus:border-[#6E121E] outline-hidden font-bold"
                />
              </div>

              <div className="pt-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFeatured}
                    onChange={(e) => setEditFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#6E121E] rounded"
                  />
                  <span className="font-medium text-[#1E1715]">Featured</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editNewArrival}
                    onChange={(e) => setEditNewArrival(e.target.checked)}
                    className="w-4 h-4 text-[#6E121E] rounded"
                  />
                  <span className="font-medium text-[#1E1715]">New Arrival</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8E0D2] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setQuickEditSaree(null)}
                disabled={isSavingQuick}
                className="px-4 py-2 rounded-xl border border-[#E8E0D2] text-xs font-semibold text-[#5A4E46] hover:bg-[#FAF6EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickEdit}
                disabled={isSavingQuick}
                className="px-5 py-2 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-bold uppercase tracking-wider transition"
              >
                {isSavingQuick ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sareeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                  Delete Saree
                </h3>
                <p className="text-xs text-[#8C7A6B]">
                  Are you sure you want to remove this saree from the database?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-[#1E1715]">{sareeToDelete.name}</p>
              <p className="text-[#8C7A6B]">SKU: {sareeToDelete.sku}</p>
              <p className="text-[#8C7A6B]">Category: {sareeToDelete.categoryLabel}</p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {deleteError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSareeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-[#E8E0D2] text-xs font-semibold text-[#5A4E46] hover:bg-[#FAF6EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold uppercase tracking-wider transition"
              >
                {isDeleting ? "Deleting..." : "Delete Saree"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instagram Share & Marketing Modal */}
      <InstagramShareModal
        saree={instagramShareSaree}
        isOpen={Boolean(instagramShareSaree)}
        onClose={() => setInstagramShareSaree(null)}
      />
    </AdminLayout>
  );
}
