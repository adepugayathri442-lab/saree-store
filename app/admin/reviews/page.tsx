"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  LogOut,
  Sparkles,
  Store,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  X,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  MessageSquare,
  Check,
  Clock,
  MessageSquareQuote,
  Layers,
  BarChart3,
  Tag,
  Package,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import {
  fetchAllReviewsAdmin,
  updateReviewStatusInDb,
  deleteReviewFromDb,
} from "@/lib/supabase/reviews";
import { Review, ReviewStatus } from "@/types/review";
import { SHOP_CONFIG } from "@/config/shop";

const STATUS_FILTERS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "all", label: "All Reviews" },
  { value: "pending", label: "Pending Moderation" },
  { value: "approved", label: "Approved (Live)" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    dotClass: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-[#E8F3EE] text-[#1E3F34] border-[#A7F3D0]",
    dotClass: "bg-[#1E3F34]",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotClass: "bg-rose-500",
  },
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | "all">("all");
  const [selectedRating, setSelectedRating] = useState<number | "all">("all");

  // Deletion state
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadReviews = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAllReviewsAdmin();
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const data = await fetchAllReviewsAdmin();
        if (isMounted) setReviews(data);
      } catch (err) {
        console.error("Init reviews failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (id: string, newStatus: ReviewStatus) => {
    // Optimistic update
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      const { error } = await updateReviewStatusInDb(id, newStatus);
      if (error) {
        throw error;
      }
      setToastMessage(
        `Review marked as "${STATUS_CONFIG[newStatus].label}". ${
          newStatus === "approved" ? "It is now visible on the product page." : ""
        }`
      );
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Failed to update review status:", err);
      await loadReviews();
      setToastMessage("Could not update review status. Please try again.");
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await deleteReviewFromDb(reviewToDelete.id);
      if (error) throw error;

      setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
      setReviewToDelete(null);
      setToastMessage(`Deleted review from ${reviewToDelete.customerName}.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete review.";
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Summary statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === "pending").length;
    const approved = reviews.filter((r) => r.status === "approved").length;
    const rejected = reviews.filter((r) => r.status === "rejected").length;

    const approvedReviews = reviews.filter((r) => r.status === "approved");
    const avg =
      approvedReviews.length > 0
        ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
        : "0.0";

    return { total, pending, approved, rejected, avg };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }
      if (selectedRating !== "all" && Math.round(item.rating) !== selectedRating) {
        return false;
      }
      if (searchTerm.trim() !== "") {
        const term = searchTerm.trim().toLowerCase();
        const nameMatch = item.customerName.toLowerCase().includes(term);
        const emailMatch = item.customerEmail?.toLowerCase().includes(term);
        const sareeMatch = item.sareeName?.toLowerCase().includes(term);
        const skuMatch = item.sareeSku?.toLowerCase().includes(term);
        const commentMatch = item.comment.toLowerCase().includes(term);

        if (!nameMatch && !emailMatch && !sareeMatch && !skuMatch && !commentMatch) {
          return false;
        }
      }
      return true;
    });
  }, [reviews, selectedStatus, selectedRating, searchTerm]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <AdminGuard>
      {({ user, onLogout }) => (
        <div className="min-h-screen bg-[#FDFBF7] text-[#2C2420] flex flex-col justify-between">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-[#1E3F34] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#A7F3D0]/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CheckCircle2 className="w-4 h-4 text-[#A7F3D0]" />
              <span className="text-xs font-medium">{toastMessage}</span>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {reviewToDelete && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-review-title"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            >
              <div
                className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8E0D2] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      id="delete-review-title"
                      className="font-serif-luxury text-lg font-bold text-[#1E1715]"
                    >
                      Delete Review?
                    </h3>
                    <p className="text-xs text-[#8C7A6B] mt-1 font-light leading-relaxed">
                      Permanently delete this review by <strong>{reviewToDelete.customerName}</strong>. This cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8E0D2] text-xs space-y-1 mb-5">
                  <div className="flex items-center gap-1 text-[#C5A059] font-bold">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= reviewToDelete.rating
                            ? "fill-[#C5A059] text-[#C5A059]"
                            : "text-[#D8CFC4]"
                        }`}
                      />
                    ))}
                    <span className="text-[#6E121E] ml-1">{reviewToDelete.rating} / 5</span>
                  </div>
                  <p className="text-[#5A4E46] italic line-clamp-2">
                    &ldquo;{reviewToDelete.comment}&rdquo;
                  </p>
                  {reviewToDelete.sareeName && (
                    <p className="text-[10.5px] text-[#8C7A6B]">
                      Saree: {reviewToDelete.sareeName} ({reviewToDelete.sareeSku})
                    </p>
                  )}
                </div>

                {deleteError && (
                  <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {deleteError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setReviewToDelete(null)}
                    className="px-4 py-2 rounded-xl border border-[#E8E0D2] text-xs font-semibold text-[#5A4E46] hover:bg-stone-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteReview}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E0D2] shadow-2xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-18">
                {/* Brand */}
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
                      Customer Reviews Moderation
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E8E0D2] bg-white text-[#5A4E46] hover:border-[#C5A059] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Catalogue</span>
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E8E0D2] bg-white text-[#5A4E46] hover:border-[#C5A059] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Enquiries</span>
                  </Link>

                  <Link
                    href="/admin/analytics"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Analytics</span>
                  </Link>

                  <Link
                    href="/admin/coupons"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Coupons</span>
                  </Link>

                  <Link
                    href="/admin/sarees/new"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Add Saree</span>
                  </Link>

                  <Link
                    href="/"
                    target="_blank"
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] px-3 py-1.5 rounded-lg border border-[#E8E0D2] hover:border-[#C5A059] transition font-medium"
                  >
                    <Store className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Store</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {/* User Email Pill */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F3EE] text-[#1E3F34] text-xs font-medium border border-[#A7F3D0]/50">
                    <span className="w-2 h-2 rounded-full bg-[#1E3F34] animate-pulse" />
                    <span className="truncate max-w-[180px]">{user.email}</span>
                  </div>

                  {/* Sign out */}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-600 hover:text-white hover:border-red-600 text-xs font-semibold tracking-wider transition cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#590D18] via-[#6E121E] to-[#590D18] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#C5A059]/40 text-[#E5D2A4] text-xs font-semibold tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Review Moderation System</span>
                </div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold mb-2">
                  Customer Reviews & Ratings
                </h1>
                <p className="text-xs sm:text-sm text-[#F4EFE6]/90 font-light leading-relaxed">
                  Moderate customer feedback submitted for sarees. Only approved reviews will appear on the public storefront.
                </p>
              </div>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
              {/* Total */}
              <button
                type="button"
                onClick={() => setSelectedStatus("all")}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition shadow-xs cursor-pointer ${
                  selectedStatus === "all"
                    ? "bg-white border-[#C5A059] ring-2 ring-[#C5A059]/30"
                    : "bg-[#FAF7F2] border-[#E8E0D2] hover:border-[#C5A059]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#8C7A6B]">
                    Total Reviews
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center">
                    <MessageSquareQuote className="w-4 h-4 text-[#C5A059]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#1E1715]">
                  {loading ? "..." : stats.total}
                </div>
                <p className="text-[11px] text-[#8C7A6B] mt-1 font-light">All submissions</p>
              </button>

              {/* Pending Moderation */}
              <button
                type="button"
                onClick={() => setSelectedStatus("pending")}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition shadow-xs cursor-pointer ${
                  selectedStatus === "pending"
                    ? "bg-amber-50 border-amber-400 ring-2 ring-amber-300"
                    : "bg-amber-50/50 border-amber-200 hover:border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] uppercase tracking-wider font-semibold text-amber-900">
                    Pending
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-amber-950">
                  {loading ? "..." : stats.pending}
                </div>
                <p className="text-[11px] text-amber-800 mt-1 font-light">Awaiting approval</p>
              </button>

              {/* Approved */}
              <button
                type="button"
                onClick={() => setSelectedStatus("approved")}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition shadow-xs cursor-pointer ${
                  selectedStatus === "approved"
                    ? "bg-[#E8F3EE] border-[#1E3F34] ring-2 ring-[#1E3F34]/20"
                    : "bg-[#FAF7F2] border-[#E8E0D2] hover:border-[#1E3F34]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#1E3F34]">
                    Approved
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#E8F3EE] text-[#1E3F34] border border-[#A7F3D0] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[#1E3F34]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#1E3F34]">
                  {loading ? "..." : stats.approved}
                </div>
                <p className="text-[11px] text-[#1E3F34]/80 mt-1 font-light">Live on storefront</p>
              </button>

              {/* Rejected */}
              <button
                type="button"
                onClick={() => setSelectedStatus("rejected")}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition shadow-xs cursor-pointer ${
                  selectedStatus === "rejected"
                    ? "bg-rose-50 border-rose-300 ring-2 ring-rose-200"
                    : "bg-[#FAF7F2] border-[#E8E0D2] hover:border-rose-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] uppercase tracking-wider font-semibold text-rose-800">
                    Rejected
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-rose-900">
                  {loading ? "..." : stats.rejected}
                </div>
                <p className="text-[11px] text-rose-700 mt-1 font-light">Hidden from store</p>
              </button>

              {/* Avg Rating */}
              <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#E8E0D2] text-left col-span-2 sm:col-span-1 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#8C7A6B]">
                    Avg Rating
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center">
                    <Star className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#6E121E]">
                  {loading ? "..." : `${stats.avg} ★`}
                </div>
                <p className="text-[11px] text-[#8C7A6B] mt-1 font-light">From approved</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs mb-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by customer name, saree title, SKU, or comment text..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#FDFBF7] border border-[#E8E0D2] text-xs sm:text-sm text-[#1E1715] placeholder:text-[#8C7A6B]/70 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#1E1715] p-0.5 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Dropdown */}
                <div className="w-full md:w-56">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ReviewStatus | "all")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] border border-[#E8E0D2] text-xs text-[#1E1715] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition cursor-pointer"
                  >
                    {STATUS_FILTERS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Star Filter Dropdown */}
                <div className="w-full md:w-44">
                  <select
                    value={selectedRating}
                    onChange={(e) =>
                      setSelectedRating(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] border border-[#E8E0D2] text-xs text-[#1E1715] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition cursor-pointer"
                  >
                    <option value="all">All Star Ratings</option>
                    <option value="5">5 Stars ★★★★★</option>
                    <option value="4">4 Stars ★★★★☆</option>
                    <option value="3">3 Stars ★★★☆☆</option>
                    <option value="2">2 Stars ★★☆☆☆</option>
                    <option value="1">1 Star ★☆☆☆☆</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={() => loadReviews(true)}
                  disabled={refreshing}
                  className="p-2.5 rounded-xl border border-[#E8E0D2] bg-[#FDFBF7] hover:border-[#C5A059] text-[#5A4E46] transition cursor-pointer shrink-0"
                  title="Refresh reviews"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Reviews List */}
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#8C7A6B]">Loading reviews from Supabase...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-[#E8E0D2] p-8">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] text-[#6E121E] border border-[#C5A059]/40 flex items-center justify-center mx-auto mb-3">
                  <MessageSquareQuote className="w-6 h-6 text-[#C5A059]" />
                </div>
                <h3 className="font-serif-luxury text-lg font-bold text-[#1E1715] mb-1">
                  No Reviews Found
                </h3>
                <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto font-light">
                  {searchTerm || selectedStatus !== "all" || selectedRating !== "all"
                    ? "No reviews match your filter criteria. Try adjusting keywords or status."
                    : "No customer reviews have been submitted yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => {
                  const cfg = STATUS_CONFIG[review.status];

                  return (
                    <div
                      key={review.id}
                      className="bg-white rounded-2xl border border-[#E8E0D2] p-5 sm:p-6 shadow-2xs transition-all hover:border-[#C5A059]/60 flex flex-col md:flex-row md:items-center justify-between gap-5"
                    >
                      {/* Left: Reviewer & Comment Details */}
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${cfg.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                            <span>{cfg.label}</span>
                          </span>

                          <div className="flex items-center gap-0.5 text-[#C5A059]">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= review.rating
                                    ? "fill-[#C5A059] text-[#C5A059]"
                                    : "text-[#D8CFC4]"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-[#6E121E] ml-1">
                              {review.rating}.0
                            </span>
                          </div>

                          <span className="text-[11px] text-[#8C7A6B] font-light">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>

                        {/* Customer Information */}
                        <div>
                          <span className="font-serif-luxury font-bold text-base text-[#1E1715]">
                            {review.customerName}
                          </span>
                          {review.customerEmail && (
                            <span className="text-xs text-[#8C7A6B] ml-2 font-mono">
                              ({review.customerEmail})
                            </span>
                          )}
                        </div>

                        {/* Comment Text */}
                        <p className="text-xs sm:text-sm text-[#3E3530] font-light leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E0D2]">
                          &ldquo;{review.comment}&rdquo;
                        </p>

                        {/* Associated Saree */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] text-[#8C7A6B]">Saree:</span>
                          <Link
                            href={`/sarees/${review.sareeId}`}
                            target="_blank"
                            className="text-xs font-semibold text-[#6E121E] hover:underline inline-flex items-center gap-1"
                          >
                            <span>{review.sareeName || "View Saree"}</span>
                            {review.sareeSku && (
                              <span className="font-mono text-[10px] bg-[#FAF6EE] px-1.5 py-0.2 rounded border border-[#C5A059]/30">
                                {review.sareeSku}
                              </span>
                            )}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Right: Moderation Actions */}
                      <div className="flex flex-wrap md:flex-col items-stretch gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#F0EBE0] pt-3 md:pt-0 md:pl-5">
                        {review.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(review.id, "approved")}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer"
                            title="Approve and publish to product page"
                          >
                            <Check className="w-3.5 h-3.5 text-[#A7F3D0]" />
                            <span>Approve</span>
                          </button>
                        )}

                        {review.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(review.id, "rejected")}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                            title="Reject review"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        )}

                        {review.status !== "pending" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(review.id, "pending")}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E0D2] bg-white hover:bg-stone-50 text-[#5A4E46] text-[11px] font-medium transition cursor-pointer"
                            title="Reset to pending moderation"
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Reset to Pending</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setReviewToDelete(review)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium transition cursor-pointer"
                          title="Delete review permanently"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}
    </AdminGuard>
  );
}
