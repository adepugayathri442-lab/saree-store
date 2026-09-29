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
  Phone,
  MessageCircle,
  Calendar,
  Eye,
  Inbox,
  Layers,
  Filter,
  Star,
  BarChart3,
  Tag,
  Package,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import {
  fetchEnquiriesFromDb,
  updateEnquiryStatusInDb,
  deleteEnquiryFromDb,
} from "@/lib/supabase/enquiries";
import { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { SHOP_CONFIG } from "@/config/shop";

const STATUS_FILTERS: { value: EnquiryStatus | "all"; label: string; color: string }[] = [
  { value: "all", label: "All Enquiries", color: "bg-stone-100 text-stone-800" },
  { value: "new", label: "New", color: "bg-amber-100 text-amber-900 border-amber-300" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-900 border-blue-300" },
  { value: "confirmed", label: "Confirmed", color: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { value: "completed", label: "Completed", color: "bg-stone-200 text-stone-700 border-stone-300" },
  { value: "cancelled", label: "Cancelled", color: "bg-rose-100 text-rose-800 border-rose-300" },
];

const STATUS_CONFIG: Record<
  EnquiryStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  new: {
    label: "New",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  contacted: {
    label: "Contacted",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    dotClass: "bg-blue-500",
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-300",
    dotClass: "bg-stone-400",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotClass: "bg-rose-500",
  },
};

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<EnquiryStatus | "all">("all");

  // Selected enquiry for detail modal
  const [activeEnquiry, setActiveEnquiry] = useState<Enquiry | null>(null);

  // Deletion modal state
  const [enquiryToDelete, setEnquiryToDelete] = useState<Enquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadEnquiries = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchEnquiriesFromDb();
      setEnquiries(data);
    } catch (err) {
      console.error("Failed to load enquiries:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const data = await fetchEnquiriesFromDb();
        if (isMounted) {
          setEnquiries(data);
        }
      } catch (err) {
        console.error("Failed to initialize enquiries:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    // Optimistic update
    setEnquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (activeEnquiry && activeEnquiry.id === id) {
      setActiveEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await updateEnquiryStatusInDb(id, newStatus);
      setToastMessage(`Enquiry status updated to "${STATUS_CONFIG[newStatus].label}".`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      console.error("Failed to update status:", err);
      // Revert on error
      await loadEnquiries();
      setToastMessage("Failed to update status. Please try again.");
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleDeleteEnquiry = async () => {
    if (!enquiryToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteEnquiryFromDb(enquiryToDelete.id);
      setEnquiries((prev) => prev.filter((item) => item.id !== enquiryToDelete.id));
      if (activeEnquiry?.id === enquiryToDelete.id) {
        setActiveEnquiry(null);
      }
      setEnquiryToDelete(null);
      setToastMessage(`Deleted enquiry from ${enquiryToDelete.customerName}.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete enquiry.";
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Summary statistics
  const stats = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter((e) => e.status === "new").length;
    const contactedCount = enquiries.filter((e) => e.status === "contacted").length;
    const confirmedCount = enquiries.filter((e) => e.status === "confirmed").length;
    const completedCount = enquiries.filter((e) => e.status === "completed").length;
    const cancelledCount = enquiries.filter((e) => e.status === "cancelled").length;

    return { total, newCount, contactedCount, confirmedCount, completedCount, cancelledCount };
  }, [enquiries]);

  // Filtered and searched enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      // 1. Status Filter
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }

      // 2. Search Box: Customer Name, Phone, Saree Name, SKU, Email, Message
      if (searchTerm.trim() !== "") {
        const term = searchTerm.trim().toLowerCase();
        const nameMatch = item.customerName.toLowerCase().includes(term);
        const phoneMatch = item.customerPhone.toLowerCase().includes(term);
        const emailMatch = item.customerEmail?.toLowerCase().includes(term);
        const sareeMatch = item.sareeName?.toLowerCase().includes(term);
        const skuMatch = item.sareeSku?.toLowerCase().includes(term);
        const msgMatch = item.message?.toLowerCase().includes(term);

        if (!nameMatch && !phoneMatch && !emailMatch && !sareeMatch && !skuMatch && !msgMatch) {
          return false;
        }
      }

      return true;
    });
  }, [enquiries, selectedStatus, searchTerm]);

  const formatEnquiryDate = (dateStr: string) => {
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

  const getCustomerWhatsAppUrl = (enquiry: Enquiry) => {
    const digitsOnly = enquiry.customerPhone.replace(/[^0-9]/g, "");
    const fullNumber = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
    const msg =
      `Hello ${enquiry.customerName} garu, this is Gangadhar from SaiSrujana Saree Store, Armoor.\n` +
      (enquiry.sareeName
        ? `Regarding your enquiry for "${enquiry.sareeName}"${enquiry.sareeSku ? ` (SKU: ${enquiry.sareeSku})` : ""}:\n`
        : `Regarding your enquiry at SaiSrujana:\n`) +
      `How can I assist you further today?`;

    return `https://wa.me/${fullNumber}?text=${encodeURIComponent(msg)}`;
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
          {enquiryToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div
                className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E8E0D2] relative animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                      Delete Customer Enquiry?
                    </h3>
                    <p className="text-xs text-[#8C7A6B] mt-1 font-light leading-relaxed">
                      This will permanently remove the enquiry from{" "}
                      <strong>{enquiryToDelete.customerName}</strong> ({enquiryToDelete.customerPhone}) from your database.
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
                    onClick={() => setEnquiryToDelete(null)}
                    disabled={isDeleting}
                    className="px-4 py-2.5 rounded-xl border border-[#E8E0D2] bg-white hover:bg-stone-50 text-[#5A4E46] text-xs font-semibold tracking-wider transition cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteEnquiry}
                    disabled={isDeleting}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold tracking-wider transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirm Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enquiry Detail Modal */}
          {activeEnquiry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div
                className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E0D2] relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setActiveEnquiry(null)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 text-[#6E121E] text-[11px] font-semibold tracking-wider mb-2">
                    <Sparkles className="w-3 h-3 text-[#C5A059]" />
                    <span>Customer Enquiry Details</span>
                  </div>
                  <h3 className="font-serif-luxury text-2xl font-bold text-[#1E1715]">
                    {activeEnquiry.customerName}
                  </h3>
                  <p className="text-xs text-[#8C7A6B] mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Received on {formatEnquiryDate(activeEnquiry.createdAt)}</span>
                  </p>
                </div>

                {/* Contact Actions Quick Bar */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <a
                    href={getCustomerWhatsAppUrl(activeEnquiry)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                    <span>Chat on WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${activeEnquiry.customerPhone}`}
                    className="py-3 px-4 rounded-xl border border-[#6E121E] text-[#6E121E] hover:bg-[#6E121E] hover:text-white text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Customer</span>
                  </a>
                </div>

                {/* Information Sections */}
                <div className="space-y-4 text-xs">
                  {/* Customer Info Box */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] space-y-2">
                    <h4 className="font-semibold text-[#1E1715] uppercase tracking-wider text-[11px] text-[#8C7A6B]">
                      Customer Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[#8C7A6B] block text-[11px]">Phone Number</span>
                        <a
                          href={`tel:${activeEnquiry.customerPhone}`}
                          className="font-semibold text-[#1E1715] hover:text-[#6E121E]"
                        >
                          {activeEnquiry.customerPhone}
                        </a>
                      </div>
                      {activeEnquiry.customerEmail && (
                        <div>
                          <span className="text-[#8C7A6B] block text-[11px]">Email</span>
                          <a
                            href={`mailto:${activeEnquiry.customerEmail}`}
                            className="font-semibold text-[#1E1715] hover:text-[#6E121E]"
                          >
                            {activeEnquiry.customerEmail}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Saree Info Box */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] space-y-2">
                    <h4 className="font-semibold text-[#1E1715] uppercase tracking-wider text-[11px] text-[#8C7A6B]">
                      Requested Product
                    </h4>
                    <div className="text-sm">
                      <p className="font-bold text-[#1E1715] text-base">
                        {activeEnquiry.sareeName || "General Store / Cart Inquiry"}
                      </p>
                      {activeEnquiry.sareeSku && (
                        <p className="text-xs text-[#8C7A6B] mt-0.5">
                          SKU: <span className="font-mono font-semibold text-[#6E121E]">{activeEnquiry.sareeSku}</span>
                        </p>
                      )}
                      <p className="text-xs text-[#5A4E46] mt-1">
                        Quantity Requested: <span className="font-semibold">{activeEnquiry.quantity}</span>
                      </p>
                    </div>
                  </div>

                  {/* Message Note Box */}
                  {activeEnquiry.message && (
                    <div className="p-4 rounded-2xl bg-white border border-[#E8E0D2] space-y-1.5">
                      <h4 className="font-semibold text-[#1E1715] uppercase tracking-wider text-[11px] text-[#8C7A6B]">
                        Enquiry Message / Breakdown
                      </h4>
                      <p className="text-xs text-[#2C2420] whitespace-pre-wrap leading-relaxed font-sans bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E0D2]/50">
                        {activeEnquiry.message}
                      </p>
                    </div>
                  )}

                  {/* Status Changer */}
                  <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#C5A059]/40 space-y-2">
                    <h4 className="font-semibold text-[#6E121E] uppercase tracking-wider text-[11px]">
                      Update Status
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(["new", "contacted", "confirmed", "completed", "cancelled"] as EnquiryStatus[]).map(
                        (st) => {
                          const isCurrent = activeEnquiry.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(activeEnquiry.id, st)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                                isCurrent
                                  ? "bg-[#6E121E] text-white shadow-xs"
                                  : "bg-white text-[#5A4E46] border border-[#E8E0D2] hover:bg-stone-50"
                              }`}
                            >
                              {st}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="mt-6 pt-4 border-t border-[#E8E0D2] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setEnquiryToDelete(activeEnquiry);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEnquiry(null)}
                    className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Header */}
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
                      Customer Enquiry Management
                    </p>
                  </div>
                </div>

                {/* Right Actions & Navigation Tabs */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E0D2] hover:border-[#6E121E] text-xs font-semibold text-[#5A4E46] hover:text-[#6E121E] transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Catalogue</span>
                  </Link>

                  <Link
                    href="/admin/orders"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <Package className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Orders</span>
                  </Link>

                  <Link
                    href="/admin/reviews"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <Star className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Reviews</span>
                  </Link>

                  <Link
                    href="/admin/analytics"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Analytics</span>
                  </Link>

                  <Link
                    href="/admin/coupons"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                  >
                    <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Coupons</span>
                  </Link>

                  <Link
                    href="/admin/sarees/new"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF6EE] border border-[#C5A059]/40 text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Add Saree</span>
                  </Link>

                  <Link
                    href="/"
                    target="_blank"
                    className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] px-3 py-1.5 rounded-lg border border-[#E8E0D2] hover:border-[#C5A059] transition font-medium"
                    title="Open live website in new tab"
                  >
                    <Store className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>View Store</span>
                    <ExternalLink className="w-3 h-3 text-[#8C7A6B]" />
                  </Link>

                  {/* User Email Pill */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F3EE] text-[#1E3F34] text-xs font-medium border border-[#A7F3D0]/50">
                    <span className="w-2 h-2 rounded-full bg-[#1E3F34] animate-pulse" />
                    <span className="truncate max-w-[180px]">{user.email}</span>
                  </div>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-600 hover:text-white hover:border-red-600 text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer shadow-2xs"
                    title="Sign out of Admin Portal"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#590D18] via-[#6E121E] to-[#590D18] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#C5A059]/40 text-[#E5D2A4] text-xs font-semibold tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Authenticated Session</span>
                </div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold mb-2">
                  Customer Enquiry Hub
                </h1>
                <p className="text-xs sm:text-sm text-[#F4EFE6]/90 font-light leading-relaxed mb-5">
                  Track, respond to, and manage customer inquiries submitted via SaiSrujana storefront and cart. Directly connect on WhatsApp or call customers to close boutique sales.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold tracking-wider transition"
                  >
                    <Layers className="w-4 h-4 text-[#C5A059]" />
                    <span>Saree Catalogue</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => loadEnquiries(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold tracking-wider transition cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#C5A059] ${refreshing ? "animate-spin" : ""}`} />
                    <span>{refreshing ? "Refreshing..." : "Refresh List"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
              {/* Total Enquiries */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs">
                <p className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider">Total</p>
                <p className="font-serif-luxury text-2xl font-bold text-[#1E1715] mt-1">{stats.total}</p>
                <span className="text-[10px] text-[#8C7A6B]">All records</span>
              </div>

              {/* New Enquiries */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
                <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>New</span>
                </p>
                <p className="font-serif-luxury text-2xl font-bold text-amber-900 mt-1">{stats.newCount}</p>
                <span className="text-[10px] text-amber-700">Awaiting contact</span>
              </div>

              {/* Contacted */}
              <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
                <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">Contacted</p>
                <p className="font-serif-luxury text-2xl font-bold text-blue-900 mt-1">{stats.contactedCount}</p>
                <span className="text-[10px] text-blue-700">In discussion</span>
              </div>

              {/* Confirmed */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Confirmed</p>
                <p className="font-serif-luxury text-2xl font-bold text-emerald-900 mt-1">{stats.confirmedCount}</p>
                <span className="text-[10px] text-emerald-700">Order finalized</span>
              </div>

              {/* Completed */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Completed</p>
                <p className="font-serif-luxury text-2xl font-bold text-stone-800 mt-1">{stats.completedCount}</p>
                <span className="text-[10px] text-stone-500">Fulfilled</span>
              </div>

              {/* Cancelled */}
              <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
                <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Cancelled</p>
                <p className="font-serif-luxury text-2xl font-bold text-rose-900 mt-1">{stats.cancelledCount}</p>
                <span className="text-[10px] text-rose-700">Closed</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E0D2] shadow-2xs mb-8 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search customer name, phone, saree, or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E8E0D2] bg-[#FAF7F2] text-xs sm:text-sm text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059] transition"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-3 text-[#8C7A6B] hover:text-[#1E1715]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-xs text-[#8C7A6B] font-medium shrink-0">
                  Showing <strong className="text-[#1E1715]">{filteredEnquiries.length}</strong> of{" "}
                  {enquiries.length} enquiries
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2">
                <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Status:</span>
                </span>
                {STATUS_FILTERS.map((tab) => {
                  const isActive = selectedStatus === tab.value;
                  const count =
                    tab.value === "all"
                      ? stats.total
                      : tab.value === "new"
                      ? stats.newCount
                      : tab.value === "contacted"
                      ? stats.contactedCount
                      : tab.value === "confirmed"
                      ? stats.confirmedCount
                      : tab.value === "completed"
                      ? stats.completedCount
                      : stats.cancelledCount;

                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedStatus(tab.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#6E121E] text-white shadow-xs"
                          : "bg-[#FAF7F2] text-[#5A4E46] hover:bg-[#F2E8D5] border border-[#E8E0D2]"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive ? "bg-white/20 text-white" : "bg-white text-[#8C7A6B] border border-[#E8E0D2]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enquiries Listing */}
            {loading ? (
              <div className="min-h-[40vh] flex items-center justify-center p-12 bg-white rounded-3xl border border-[#E8E0D2]">
                <div className="text-center">
                  <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-serif-luxury text-sm text-[#6E121E]">Loading customer enquiries...</p>
                </div>
              </div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-[#E8E0D2] text-center shadow-2xs">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#E8E0D2] flex items-center justify-center mx-auto mb-4 text-[#C5A059]">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715] mb-1">
                  No Enquiries Found
                </h3>
                <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto mb-5 font-light">
                  {searchTerm || selectedStatus !== "all"
                    ? "No enquiries match your search or status filter. Try clearing the filters."
                    : "No customer enquiries have been recorded yet. New product & cart inquiries will appear here automatically."}
                </p>
                {(searchTerm || selectedStatus !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedStatus("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6E121E] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#590D18] transition cursor-pointer shadow-xs"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop & Tablet Table */}
                <div className="hidden md:block bg-white rounded-3xl border border-[#E8E0D2] shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F2] border-b border-[#E8E0D2] text-[#8C7A6B] uppercase font-semibold text-[11px] tracking-wider">
                      <tr>
                        <th className="py-4 px-6">Customer & Contact</th>
                        <th className="py-4 px-6">Saree / Enquiry</th>
                        <th className="py-4 px-4 text-center">Qty</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Received Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D2]">
                      {filteredEnquiries.map((enquiry) => {
                        const statusInfo = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.new;

                        return (
                          <tr key={enquiry.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                            {/* Customer */}
                            <td className="py-4 px-6">
                              <div className="font-bold text-sm text-[#1E1715]">
                                {enquiry.customerName}
                              </div>
                              <div className="text-xs text-[#5A4E46] flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-[#8C7A6B]" />
                                <a
                                  href={`tel:${enquiry.customerPhone}`}
                                  className="hover:text-[#6E121E] font-medium"
                                >
                                  {enquiry.customerPhone}
                                </a>
                              </div>
                              {enquiry.customerEmail && (
                                <div className="text-[11px] text-[#8C7A6B] truncate max-w-[200px] mt-0.5">
                                  {enquiry.customerEmail}
                                </div>
                              )}
                            </td>

                            {/* Saree Name & SKU */}
                            <td className="py-4 px-6">
                              <div className="font-medium text-[#1E1715] truncate max-w-[260px]">
                                {enquiry.sareeName || "Store Inquiry"}
                              </div>
                              {enquiry.sareeSku && (
                                <div className="mt-1">
                                  <span className="font-mono text-[10px] font-bold text-[#6E121E] bg-[#FAF6EE] px-1.5 py-0.5 rounded border border-[#C5A059]/30">
                                    SKU: {enquiry.sareeSku}
                                  </span>
                                </div>
                              )}
                              {enquiry.message && (
                                <p className="text-[11px] text-[#8C7A6B] truncate max-w-[260px] mt-1 italic">
                                  &ldquo;{enquiry.message.slice(0, 50)}...&rdquo;
                                </p>
                              )}
                            </td>

                            {/* Quantity */}
                            <td className="py-4 px-4 text-center font-bold text-[#1E1715]">
                              {enquiry.quantity}
                            </td>

                            {/* Status Selector Dropdown */}
                            <td className="py-4 px-6">
                              <div className="relative inline-block">
                                <select
                                  value={enquiry.status}
                                  onChange={(e) =>
                                    handleStatusChange(enquiry.id, e.target.value as EnquiryStatus)
                                  }
                                  className={`appearance-none text-xs font-semibold py-1.5 pl-3 pr-7 rounded-xl border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C5A059] ${statusInfo.badgeClass}`}
                                >
                                  <option value="new">● New</option>
                                  <option value="contacted">● Contacted</option>
                                  <option value="confirmed">● Confirmed</option>
                                  <option value="completed">● Completed</option>
                                  <option value="cancelled">● Cancelled</option>
                                </select>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-4 px-6 text-[#8C7A6B] text-[11px]">
                              {formatEnquiryDate(enquiry.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* WhatsApp */}
                                <a
                                  href={getCustomerWhatsAppUrl(enquiry)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-lg bg-[#E8F3EE] text-[#1E3F34] hover:bg-[#1E3F34] hover:text-white flex items-center justify-center transition"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>

                                {/* Call */}
                                <a
                                  href={`tel:${enquiry.customerPhone}`}
                                  className="w-8 h-8 rounded-lg bg-[#FAF6EE] text-[#6E121E] hover:bg-[#6E121E] hover:text-white flex items-center justify-center transition"
                                  title="Call Customer"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>

                                {/* View Details */}
                                <button
                                  type="button"
                                  onClick={() => setActiveEnquiry(enquiry)}
                                  className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition cursor-pointer"
                                  title="View Full Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => setEnquiryToDelete(enquiry)}
                                  className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 flex items-center justify-center transition cursor-pointer"
                                  title="Delete Enquiry"
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

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {filteredEnquiries.map((enquiry) => {
                    const statusInfo = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.new;

                    return (
                      <div
                        key={enquiry.id}
                        className="bg-white rounded-2xl p-4 border border-[#E8E0D2] shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-sm text-[#1E1715] block">
                              {enquiry.customerName}
                            </span>
                            <span className="text-[11px] text-[#8C7A6B] block">
                              {formatEnquiryDate(enquiry.createdAt)}
                            </span>
                          </div>
                          <select
                            value={enquiry.status}
                            onChange={(e) =>
                              handleStatusChange(enquiry.id, e.target.value as EnquiryStatus)
                            }
                            className={`text-xs font-semibold py-1 px-2.5 rounded-lg border cursor-pointer ${statusInfo.badgeClass}`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D2] text-xs space-y-1">
                          <p className="font-medium text-[#1E1715]">
                            {enquiry.sareeName || "Store Inquiry"}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#8C7A6B]">
                            {enquiry.sareeSku && <span>SKU: {enquiry.sareeSku}</span>}
                            <span>• Qty: {enquiry.quantity}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={getCustomerWhatsAppUrl(enquiry)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 rounded-xl bg-[#1E3F34] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
                            <span>WhatsApp</span>
                          </a>

                          <a
                            href={`tel:${enquiry.customerPhone}`}
                            className="py-2 px-3 rounded-xl border border-[#6E121E] text-[#6E121E] text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setActiveEnquiry(enquiry)}
                            className="py-2 px-3 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-center"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEnquiryToDelete(enquiry)}
                            className="py-2 px-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>

          {/* Admin Footer */}
          <footer className="border-t border-[#E8E0D2] py-6 bg-white mt-12 text-center text-xs text-[#8C7A6B]">
            <p>
              © {new Date().getFullYear()} {SHOP_CONFIG.brandName} • Customer Enquiry Management
            </p>
          </footer>
        </div>
      )}
    </AdminGuard>
  );
}
