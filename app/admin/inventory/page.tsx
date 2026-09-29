"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Save,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { createBrowserClient } from "@/lib/supabase/client";
import { Saree } from "@/types/saree";
import { mapDbRowToSaree, DbSareeRow } from "@/lib/supabase/sarees";
import { formatCurrency, SHOP_CONFIG } from "@/config/shop";

export default function AdminInventoryPage() {
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local draft stock quantities keyed by saree ID for inline editing
  const [draftStock, setDraftStock] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data, error: fetchErr } = await supabase
        .from("sarees")
        .select("*")
        .order("stock_quantity", { ascending: true });

      if (fetchErr) {
        throw new Error(fetchErr.message);
      }

      const mapped = (data as DbSareeRow[] || []).map(mapDbRowToSaree);
      setSarees(mapped);

      // Initialize draft stock values
      const drafts: Record<string, number> = {};
      mapped.forEach((s) => {
        drafts[s.id] = s.stockQuantity;
      });
      setDraftStock(drafts);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setError("Unable to load inventory data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Statistics
  const stats = useMemo(() => {
    const totalUnits = sarees.reduce((sum, s) => sum + (Number(s.stockQuantity) || 0), 0);
    const inStockCount = sarees.filter((s) => s.stockQuantity > 5).length;
    const lowStockCount = sarees.filter((s) => s.stockQuantity > 0 && s.stockQuantity <= 5).length;
    const outOfStockCount = sarees.filter(
      (s) => s.stockQuantity <= 0 || s.stockStatus.toLowerCase() === "out of stock"
    ).length;

    return {
      totalUnits,
      inStockCount,
      lowStockCount,
      outOfStockCount,
    };
  }, [sarees]);

  // Filtering
  const filteredSarees = useMemo(() => {
    return sarees.filter((saree) => {
      const currentStock = draftStock[saree.id] !== undefined ? draftStock[saree.id] : saree.stockQuantity;

      if (statusFilter === "in_stock" && currentStock <= 5) return false;
      if (statusFilter === "low_stock" && (currentStock <= 0 || currentStock > 5)) return false;
      if (statusFilter === "out_of_stock" && currentStock > 0) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = saree.name.toLowerCase().includes(q);
        const matchesSku = saree.sku.toLowerCase().includes(q);
        const matchesCategory = saree.categoryLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCategory) return false;
      }

      return true;
    });
  }, [sarees, draftStock, statusFilter, searchTerm]);

  // Stock increment / decrement
  const handleAdjustDraft = (id: string, delta: number) => {
    setDraftStock((prev) => {
      const current = prev[id] !== undefined ? prev[id] : 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleStockInputChange = (id: string, val: string) => {
    const parsed = parseInt(val, 10);
    setDraftStock((prev) => ({
      ...prev,
      [id]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  // Save stock to Supabase
  const handleSaveStock = async (saree: Saree) => {
    const newQuantity = draftStock[saree.id];
    if (newQuantity === undefined) return;

    setSavingId(saree.id);
    try {
      const supabase = createBrowserClient();
      const newStatus = newQuantity <= 0 ? "Out of Stock" : "In Stock";

      const { error: updateErr } = await supabase
        .from("sarees")
        .update({
          stock_quantity: newQuantity,
          stock_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", saree.id);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      // Update local state
      setSarees((prev) =>
        prev.map((s) =>
          s.id === saree.id
            ? { ...s, stockQuantity: newQuantity, stockStatus: newStatus }
            : s
        )
      );

      setToastMessage(`Stock for "${saree.name}" updated to ${newQuantity} units.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error saving stock:", err);
      alert("Failed to update stock quantity. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout
      title="Warehouse & Inventory Management"
      subtitle={`Track stock levels, replenish units, and prevent stockouts across ${sarees.length} boutique sarees`}
      actions={
        <button
          type="button"
          onClick={loadInventory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E0D2] bg-white text-[#1E1715] hover:bg-[#FAF6EE] text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#C5A059]" : ""}`} />
          <span>Refresh Stock</span>
        </button>
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
              className="text-emerald-800 hover:text-emerald-950 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadInventory}
              className="font-bold underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-1">
            <span className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">
              Total Units
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
              {stats.totalUnits}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">In warehouse & ready</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Healthy Stock
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-emerald-700">
              {stats.inStockCount}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">&gt; 5 units available</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-amber-700">
              {stats.lowStockCount}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">1 to 5 units left</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Out of Stock
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-rose-700">
              {stats.outOfStockCount}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">0 units (Action needed)</p>
          </div>
        </div>

        {/* Search & Stock Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search inventory by saree name, SKU, or category..."
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

          <div className="flex items-center gap-2">
            {(["all", "in_stock", "low_stock", "out_of_stock"] as const).map((filter) => {
              const label =
                filter === "all"
                  ? "All Stock"
                  : filter === "in_stock"
                  ? "In Stock"
                  : filter === "low_stock"
                  ? "Low Stock"
                  : "Out of Stock";
              const active = statusFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-[#6E121E] text-white shadow-2xs"
                      : "bg-[#FAF7F2] border border-[#E8E0D2] text-[#5A4E46] hover:bg-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-3xl border border-[#E8E0D2] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#8C7A6B]">Loading inventory data...</p>
            </div>
          ) : filteredSarees.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Boxes className="w-10 h-10 text-[#C5A059] mx-auto opacity-70" />
              <h4 className="font-serif-luxury text-base font-bold text-[#1E1715]">
                No inventory records match
              </h4>
              <p className="text-xs text-[#8C7A6B]">
                Try adjusting your search query or stock filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#8C7A6B] uppercase tracking-wider text-[10px] font-bold border-b border-[#E8E0D2]">
                  <tr>
                    <th className="py-3.5 px-4">Saree & SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Unit Price</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4">Stock Quantity Adjustment</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D2]">
                  {filteredSarees.map((saree) => {
                    const currentQty = draftStock[saree.id] !== undefined ? draftStock[saree.id] : saree.stockQuantity;
                    const hasChanged = currentQty !== saree.stockQuantity;
                    const isSaving = savingId === saree.id;
                    const isOutOfStock = currentQty <= 0;
                    const isLowStock = currentQty > 0 && currentQty <= 5;

                    return (
                      <tr key={saree.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                        {/* Saree & Thumbnail */}
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
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-[#5A4E46]">
                          {saree.categoryLabel}
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-bold text-[#1E1715]">
                          {formatCurrency(Number(saree.price) || 0)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
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
                              ? "Low Stock Warning"
                              : "In Stock"}
                          </span>
                        </td>

                        {/* Stock Adjustment Controls */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustDraft(saree.id, -1)}
                              disabled={currentQty <= 0}
                              className="w-7 h-7 rounded-lg border border-[#E8E0D2] bg-white text-[#1E1715] hover:bg-[#FAF6EE] disabled:opacity-30 flex items-center justify-center cursor-pointer"
                              title="Decrease by 1"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={currentQty}
                              onChange={(e) => handleStockInputChange(saree.id, e.target.value)}
                              className={`w-16 py-1 px-2 text-center rounded-lg border text-xs font-bold outline-hidden ${
                                hasChanged
                                  ? "border-[#6E121E] bg-amber-50 text-[#6E121E]"
                                  : "border-[#E8E0D2] bg-white text-[#1E1715]"
                              }`}
                            />

                            <button
                              type="button"
                              onClick={() => handleAdjustDraft(saree.id, 1)}
                              className="w-7 h-7 rounded-lg border border-[#E8E0D2] bg-white text-[#1E1715] hover:bg-[#FAF6EE] flex items-center justify-center cursor-pointer"
                              title="Increase by 1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAdjustDraft(saree.id, 5)}
                              className="px-2 py-1 rounded-lg border border-[#E8E0D2] bg-[#FAF7F2] hover:bg-white text-[10px] font-bold text-[#8C7A6B] cursor-pointer"
                              title="Quick add +5 units"
                            >
                              +5
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasChanged && (
                              <button
                                type="button"
                                onClick={() => handleSaveStock(saree)}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                              >
                                {isSaving ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                <span>Save</span>
                              </button>
                            )}

                            <Link
                              href={`/admin/sarees/${saree.id}/edit`}
                              className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#1E1715] hover:bg-white transition"
                              title="Full Saree Details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
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
    </AdminLayout>
  );
}
