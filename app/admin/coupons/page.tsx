"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  LogOut,
  Sparkles,
  Store,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Star,
  BarChart3,
  Tag,
  Percent,
  Calendar,
  Layers,
  Clock,
  Ban,
  Check,
  Package,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  fetchCouponsFromDb,
  createCouponInDb,
  updateCouponInDb,
  deleteCouponFromDb,
  toggleCouponStatusInDb,
  getCouponStatus,
} from "@/lib/supabase/coupons";
import {
  Coupon,
  CouponStatus,
  CreateCouponInput,
  UpdateCouponInput,
  CouponDiscountType,
} from "@/types/coupon";
import { SHOP_CONFIG } from "@/config/shop";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<CouponStatus | "All">("All");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    description: string;
    discountType: CouponDiscountType;
    discountValue: string;
    minCartValue: string;
    maxDiscountAmount: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minCartValue: "",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerMessage, setFormServerMessage] = useState<string | null>(null);

  // Delete Confirmation State
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const list = await fetchCouponsFromDb(supabase);
      setCoupons(list);
    } catch (err) {
      console.error("Error loading coupons:", err);
      showToast("Error loading coupons from database.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const supabase = createBrowserClient();
        const list = await fetchCouponsFromDb(supabase);
        if (isMounted) {
          setCoupons(list);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading coupons on init:", err);
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = coupons.length;
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let disabled = 0;

    coupons.forEach((c) => {
      const st = getCouponStatus(c);
      if (st === "Active") active++;
      else if (st === "Scheduled") scheduled++;
      else if (st === "Expired") expired++;
      else if (st === "Disabled") disabled++;
    });

    return { total, active, scheduled, expired, disabled };
  }, [coupons]);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const status = getCouponStatus(coupon);

      if (selectedStatusFilter !== "All" && status !== selectedStatusFilter) {
        return false;
      }

      if (searchTerm.trim() !== "") {
        const q = searchTerm.trim().toLowerCase();
        const codeMatches = coupon.code.toLowerCase().includes(q);
        const descMatches = (coupon.description || "").toLowerCase().includes(q);
        if (!codeMatches && !descMatches) return false;
      }

      return true;
    });
  }, [coupons, selectedStatusFilter, searchTerm]);

  // Modal Open Handlers
  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minCartValue: "",
      maxDiscountAmount: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
    setFormErrors({});
    setFormServerMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);

    // Format ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
    const formatForInput = (iso?: string | null) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minCartValue: coupon.minCartValue > 0 ? coupon.minCartValue.toString() : "",
      maxDiscountAmount:
        coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined
          ? coupon.maxDiscountAmount.toString()
          : "",
      startDate: formatForInput(coupon.startDate),
      endDate: formatForInput(coupon.endDate),
      isActive: coupon.isActive,
    });
    setFormErrors({});
    setFormServerMessage(null);
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.code.trim()) {
      errors.code = "Coupon code is required.";
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code.trim())) {
      errors.code = "Only alphanumeric characters, dashes, and underscores are allowed.";
    }

    const val = parseFloat(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      errors.discountValue = "Enter a valid positive discount amount.";
    } else if (formData.discountType === "percentage" && val > 100) {
      errors.discountValue = "Percentage discount cannot exceed 100%.";
    }

    if (formData.minCartValue.trim()) {
      const minVal = parseFloat(formData.minCartValue);
      if (isNaN(minVal) || minVal < 0) {
        errors.minCartValue = "Minimum cart value must be 0 or higher.";
      }
    }

    if (formData.maxDiscountAmount.trim()) {
      const maxVal = parseFloat(formData.maxDiscountAmount);
      if (isNaN(maxVal) || maxVal <= 0) {
        errors.maxDiscountAmount = "Maximum discount amount must be greater than 0.";
      }
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        errors.endDate = "End date must be after the start date.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormServerMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    const supabase = createBrowserClient();

    try {
      if (editingCoupon) {
        const updatePayload: UpdateCouponInput = {
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minCartValue: formData.minCartValue ? parseFloat(formData.minCartValue) : 0,
          maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          isActive: formData.isActive,
        };

        const res = await updateCouponInDb(editingCoupon.id, updatePayload, supabase);
        if (!res.success) {
          setFormServerMessage(res.error || "Failed to update coupon.");
          return;
        }

        showToast(`Coupon "${res.data?.code}" updated successfully!`);
      } else {
        const createPayload: CreateCouponInput = {
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minCartValue: formData.minCartValue ? parseFloat(formData.minCartValue) : 0,
          maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          isActive: formData.isActive,
        };

        const res = await createCouponInDb(createPayload, supabase);
        if (!res.success) {
          setFormServerMessage(res.error || "Failed to create coupon.");
          return;
        }

        showToast(`Coupon "${res.data?.code}" created successfully!`);
      }

      setIsModalOpen(false);
      await loadCoupons();
    } catch (err: unknown) {
      setFormServerMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    const supabase = createBrowserClient();
    const newActiveState = !coupon.isActive;

    // Optimistic UI update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: newActiveState } : c))
    );

    const res = await toggleCouponStatusInDb(coupon.id, newActiveState, supabase);
    if (!res.success) {
      showToast(`Error: ${res.error || "Could not update coupon status."}`);
      // Revert on error
      await loadCoupons();
    } else {
      showToast(`Coupon "${coupon.code}" is now ${newActiveState ? "Active" : "Disabled"}.`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createBrowserClient();

    try {
      const res = await deleteCouponFromDb(couponToDelete.id, supabase);
      if (!res.success) {
        setDeleteError(res.error || "Failed to delete coupon.");
        return;
      }

      showToast(`Coupon "${couponToDelete.code}" deleted successfully.`);
      setCouponToDelete(null);
      await loadCoupons();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete coupon.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: CouponStatus) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F3EE] text-[#1E3F34] border border-[#A7F3D0]/60 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E3F34] animate-pulse" />
            Active
          </span>
        );
      case "Scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
            <Clock className="w-3 h-3 text-blue-600" />
            Scheduled
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
            <Calendar className="w-3 h-3 text-amber-600" />
            Expired
          </span>
        );
      case "Disabled":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[11px] font-semibold">
            <Ban className="w-3 h-3 text-stone-500" />
            Disabled
          </span>
        );
    }
  };

  return (
    <AdminGuard>
      {({ user, onLogout }) => (
        <div className="min-h-screen bg-[#FDFBF7] text-[#2C2420] flex flex-col justify-between">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-[#1E3F34] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#A7F3D0]/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-6 h-6 rounded-full bg-[#A7F3D0]/20 flex items-center justify-center text-[#A7F3D0]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {couponToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div
                className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E8E0D2] relative animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-coupon-title"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 id="delete-coupon-title" className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                      Delete Coupon?
                    </h3>
                    <p className="text-xs text-[#8C7A6B] mt-1 font-light leading-relaxed">
                      Are you sure you want to permanently delete coupon{" "}
                      <strong className="font-mono text-[#6E121E]">{couponToDelete.code}</strong>? Customers will no longer be able to apply this discount.
                    </p>
                  </div>
                </div>

                {deleteError && (
                  <div className="p-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCouponToDelete(null)}
                    disabled={isDeleting}
                    className="px-4 py-2.5 rounded-xl border border-[#E8E0D2] text-[#5A4E46] hover:bg-[#FAF7F2] text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create / Edit Coupon Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
              <div
                className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E0D2] my-8 relative animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="coupon-modal-title"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D2] mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF0DC] text-[#C5A059] flex items-center justify-center">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 id="coupon-modal-title" className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                        {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                      </h3>
                      <p className="text-xs text-[#8C7A6B]">
                        {editingCoupon ? "Update coupon rules and availability" : "Set discount code, rules, and validity dates"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-xl text-[#8C7A6B] hover:text-[#6E121E] hover:bg-[#FAF7F2] transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formServerMessage && (
                  <div className="p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formServerMessage}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Coupon Code & Active Toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1">
                        Coupon Code <span className="text-[#6E121E]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. FESTIVE20, PATTU500"
                        value={formData.code}
                        onChange={(e) => {
                          setFormData({ ...formData, code: e.target.value.toUpperCase() });
                          if (formErrors.code) setFormErrors({ ...formErrors, code: "" });
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold text-sm tracking-wider uppercase ${
                          formErrors.code ? "border-red-400 bg-red-50/30" : "border-[#E8E0D2] bg-white"
                        } focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                      />
                      {formErrors.code && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.code}</p>
                      )}
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-2">
                        Status
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                          formData.isActive
                            ? "bg-[#E8F3EE] border-[#A7F3D0] text-[#1E3F34]"
                            : "bg-stone-100 border-stone-200 text-stone-600"
                        }`}
                      >
                        {formData.isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#1E3F34]" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5 text-stone-500" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1">
                      Offer Description <span className="text-[10px] text-[#8C7A6B] lowercase font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15% discount on heritage silks wedding collection"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0D2] bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    />
                  </div>

                  {/* Discount Type & Value */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1">
                        Discount Type <span className="text-[#6E121E]">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountType: "percentage" })}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            formData.discountType === "percentage"
                              ? "bg-[#FAF0DC] border-[#C5A059] text-[#6E121E]"
                              : "bg-white border-[#E8E0D2] text-[#5A4E46] hover:bg-[#FAF7F2]"
                          }`}
                        >
                          <Percent className="w-3.5 h-3.5" />
                          <span>Percentage (%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, discountType: "fixed" })}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            formData.discountType === "fixed"
                              ? "bg-[#FAF0DC] border-[#C5A059] text-[#6E121E]"
                              : "bg-white border-[#E8E0D2] text-[#5A4E46] hover:bg-[#FAF7F2]"
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>Fixed (₹)</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1">
                        Discount Value <span className="text-[#6E121E]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder={formData.discountType === "percentage" ? "e.g. 15 (for 15%)" : "e.g. 500 (for ₹500)"}
                          value={formData.discountValue}
                          onChange={(e) => {
                            setFormData({ ...formData, discountValue: e.target.value });
                            if (formErrors.discountValue) setFormErrors({ ...formErrors, discountValue: "" });
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold ${
                            formErrors.discountValue ? "border-red-400 bg-red-50/30" : "border-[#E8E0D2] bg-white"
                          } focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs text-[#8C7A6B] font-bold">
                          {formData.discountType === "percentage" ? "%" : "₹"}
                        </span>
                      </div>
                      {formErrors.discountValue && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.discountValue}</p>
                      )}
                    </div>
                  </div>

                  {/* Min Cart Value & Max Discount (for percentage) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1">
                        Min Cart Value (₹) <span className="text-[10px] text-[#8C7A6B] lowercase font-normal">(0 = no minimum)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 3000"
                        value={formData.minCartValue}
                        onChange={(e) => {
                          setFormData({ ...formData, minCartValue: e.target.value });
                          if (formErrors.minCartValue) setFormErrors({ ...formErrors, minCartValue: "" });
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                          formErrors.minCartValue ? "border-red-400 bg-red-50/30" : "border-[#E8E0D2] bg-white"
                        } focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                      />
                      {formErrors.minCartValue && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.minCartValue}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1">
                        Max Discount Amount (₹) <span className="text-[10px] text-[#8C7A6B] lowercase font-normal">(for % cap)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        disabled={formData.discountType === "fixed"}
                        placeholder={formData.discountType === "fixed" ? "N/A for fixed coupons" : "e.g. 1500 (optional cap)"}
                        value={formData.maxDiscountAmount}
                        onChange={(e) => {
                          setFormData({ ...formData, maxDiscountAmount: e.target.value });
                          if (formErrors.maxDiscountAmount) setFormErrors({ ...formErrors, maxDiscountAmount: "" });
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm disabled:bg-stone-100 disabled:text-stone-400 ${
                          formErrors.maxDiscountAmount ? "border-red-400 bg-red-50/30" : "border-[#E8E0D2] bg-white"
                        } focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                      />
                      {formErrors.maxDiscountAmount && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.maxDiscountAmount}</p>
                      )}
                    </div>
                  </div>

                  {/* Start Date & End Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1">
                        Start Date / Time <span className="text-[10px] text-[#8C7A6B] lowercase font-normal">(optional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0D2] bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A4E46] uppercase tracking-wider mb-1">
                        End Date / Time <span className="text-[10px] text-[#8C7A6B] lowercase font-normal">(optional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => {
                          setFormData({ ...formData, endDate: e.target.value });
                          if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: "" });
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                          formErrors.endDate ? "border-red-400 bg-red-50/30" : "border-[#E8E0D2] bg-white"
                        } focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                      />
                      {formErrors.endDate && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.endDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer CTA */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E0D2] mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl border border-[#E8E0D2] text-[#5A4E46] hover:bg-[#FAF7F2] text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (editingCoupon ? "Saving..." : "Creating...") : editingCoupon ? "Update Coupon" : "Create Coupon"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E0D2] shadow-2xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-18">
                {/* Brand Logo & Portal Tag */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#6E121E] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5 text-[#C5A059]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif-luxury text-xl font-bold text-[#6E121E]">
                        {SHOP_CONFIG.brandName}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold bg-[#FAF6EE] text-[#6E121E] border border-[#C5A059]/40 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8C7A6B] tracking-wider uppercase font-medium">
                      Boutique Management Portal
                    </p>
                  </div>
                </div>

                {/* Right Actions: Nav Tabs & Logout */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="hidden sm:inline">Catalogue</span>
                  </Link>

                  <Link
                    href="/admin/orders"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <Package className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Orders</span>
                  </Link>

                  <Link
                    href="/admin/enquiries"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Enquiries</span>
                  </Link>

                  <Link
                    href="/admin/reviews"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <Star className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Reviews</span>
                  </Link>

                  <Link
                    href="/admin/analytics"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Analytics</span>
                  </Link>

                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6E121E] text-white text-xs font-semibold tracking-wider shadow-2xs">
                    <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Coupons</span>
                  </span>

                  <Link
                    href="/"
                    target="_blank"
                    className="hidden lg:inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] px-3 py-1.5 rounded-lg border border-[#E8E0D2] hover:border-[#C5A059] transition font-medium"
                    title="Open live website in new tab"
                  >
                    <Store className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>View Store</span>
                    <ExternalLink className="w-3 h-3 text-[#8C7A6B]" />
                  </Link>

                  {/* User Email Pill */}
                  <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F3EE] text-[#1E3F34] text-xs font-medium border border-[#A7F3D0]/50">
                    <span className="w-2 h-2 rounded-full bg-[#1E3F34] animate-pulse" />
                    <span className="truncate max-w-[160px]">{user.email}</span>
                  </div>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-600 hover:text-white hover:border-red-600 text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer shadow-2xs"
                    title="Sign out of Admin Portal"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#8C7A6B] mb-1.5">
                  <Link href="/admin" className="hover:text-[#6E121E] transition">
                    Dashboard
                  </Link>
                  <span>/</span>
                  <span className="font-semibold text-[#6E121E]">Offers & Coupons</span>
                </div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
                  Offers & Coupon Codes
                </h1>
                <p className="text-xs sm:text-sm text-[#8C7A6B] mt-1 font-light">
                  Manage promotional discounts, festival offers, minimum cart thresholds, and validity schedules.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadCoupons}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E8E0D2] bg-white hover:bg-[#FAF7F2] text-[#5A4E46] text-xs font-semibold uppercase tracking-wider transition cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#C5A059]" : ""}`} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#C5A059]" />
                  <span>Create Coupon</span>
                </button>
              </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 border border-[#E8E0D2] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider">Total Coupons</span>
                  <Tag className="w-4 h-4 text-[#C5A059]" />
                </div>
                <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] mt-2">
                  {stats.total}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#E8E0D2] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1E3F34] uppercase tracking-wider">Active</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E3F34] animate-pulse" />
                </div>
                <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E3F34] mt-2">
                  {stats.active}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#E8E0D2] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Scheduled</span>
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-blue-700 mt-2">
                  {stats.scheduled}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#E8E0D2] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Expired / Disabled</span>
                  <Ban className="w-4 h-4 text-stone-400" />
                </div>
                <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-600 mt-2">
                  {stats.expired + stats.disabled}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-[#E8E0D2] p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search code or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E8E0D2] text-xs sm:text-sm text-[#1E1715] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-[#8C7A6B] hover:text-[#6E121E]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(["All", "Active", "Scheduled", "Expired", "Disabled"] as (CouponStatus | "All")[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedStatusFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                      selectedStatusFilter === tab
                        ? "bg-[#6E121E] text-white shadow-2xs"
                        : "bg-[#FAF7F2] text-[#5A4E46] hover:bg-[#FAF0DC] hover:text-[#6E121E]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupons List / Table */}
            {loading ? (
              <div className="bg-white rounded-2xl border border-[#E8E0D2] p-12 text-center">
                <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="font-serif-luxury text-sm text-[#6E121E]">Loading offers & coupons from database...</p>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8E0D2] p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#FAF0DC] text-[#C5A059] flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8" />
                </div>
                <h3 className="font-serif-luxury text-lg font-bold text-[#1E1715] mb-1">
                  {searchTerm || selectedStatusFilter !== "All" ? "No Matching Coupons Found" : "No Coupons Created Yet"}
                </h3>
                <p className="text-xs text-[#8C7A6B] mb-6">
                  {searchTerm || selectedStatusFilter !== "All"
                    ? "Try adjusting your search terms or filter criteria."
                    : "Create promotional codes like PATTU10 or FESTIVE500 to delight boutique customers."}
                </p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6E121E] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#590D18] transition"
                >
                  <Plus className="w-4 h-4 text-[#C5A059]" />
                  <span>Create First Coupon</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8E0D2] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF7F2] border-b border-[#E8E0D2] text-[11px] font-semibold text-[#5A4E46] uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-6">Coupon Code</th>
                        <th className="py-3.5 px-4">Discount</th>
                        <th className="py-3.5 px-4">Min. Cart Value</th>
                        <th className="py-3.5 px-4">Validity</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D2] text-xs">
                      {filteredCoupons.map((coupon) => {
                        const status = getCouponStatus(coupon);
                        const discountDisplay =
                          coupon.discountType === "percentage"
                            ? `${coupon.discountValue}% OFF${
                                coupon.maxDiscountAmount ? ` (Max ₹${coupon.maxDiscountAmount.toLocaleString("en-IN")})` : ""
                              }`
                            : `₹${coupon.discountValue.toLocaleString("en-IN")} FLAT OFF`;

                        return (
                          <tr key={coupon.id} className="hover:bg-[#FAF7F2]/60 transition">
                            {/* Code & Description */}
                            <td className="py-4 px-4 sm:px-6">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-[#6E121E] bg-[#FAF0DC] px-2.5 py-1 rounded-lg border border-[#C5A059]/40 tracking-wider">
                                  {coupon.code}
                                </span>
                              </div>
                              {coupon.description && (
                                <p className="text-[11px] text-[#8C7A6B] mt-1 line-clamp-1 max-w-xs font-light">
                                  {coupon.description}
                                </p>
                              )}
                            </td>

                            {/* Discount */}
                            <td className="py-4 px-4 font-semibold text-[#1E1715]">
                              {discountDisplay}
                            </td>

                            {/* Min Cart Value */}
                            <td className="py-4 px-4 text-[#5A4E46]">
                              {coupon.minCartValue > 0 ? `₹${coupon.minCartValue.toLocaleString("en-IN")}` : "No minimum"}
                            </td>

                            {/* Validity Dates */}
                            <td className="py-4 px-4 text-[11px] text-[#8C7A6B] font-light">
                              {coupon.startDate || coupon.endDate ? (
                                <div className="space-y-0.5">
                                  {coupon.startDate && (
                                    <div>
                                      <span className="font-medium text-[#5A4E46]">From: </span>
                                      {new Date(coupon.startDate).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </div>
                                  )}
                                  {coupon.endDate && (
                                    <div>
                                      <span className="font-medium text-[#5A4E46]">Until: </span>
                                      {new Date(coupon.endDate).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span>Always Valid</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              {renderStatusBadge(status)}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 sm:px-6 text-right">
                              <div className="inline-flex items-center gap-2">
                                {/* Toggle Active Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(coupon)}
                                  title={coupon.isActive ? "Disable coupon" : "Enable coupon"}
                                  className={`p-2 rounded-lg border transition cursor-pointer ${
                                    coupon.isActive
                                      ? "bg-[#E8F3EE] border-[#A7F3D0] text-[#1E3F34] hover:bg-emerald-100"
                                      : "bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-200"
                                  }`}
                                >
                                  {coupon.isActive ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() => openEditModal(coupon)}
                                  title="Edit coupon"
                                  className="p-2 rounded-lg border border-[#E8E0D2] bg-white hover:bg-[#FAF7F2] text-[#5A4E46] hover:text-[#6E121E] transition cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => setCouponToDelete(coupon)}
                                  title="Delete coupon"
                                  className="p-2 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-600 hover:text-white text-red-600 transition cursor-pointer"
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
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-[#FAF7F2] border-t border-[#E8E0D2] py-4 text-center text-xs text-[#8C7A6B]">
            <p>
              {SHOP_CONFIG.brandName} • Boutique Administration Portal • Offers & Coupon Management
            </p>
          </footer>
        </div>
      )}
    </AdminGuard>
  );
}
