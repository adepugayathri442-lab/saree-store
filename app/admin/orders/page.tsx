"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LogOut,
  Store,
  ExternalLink,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Star,
  BarChart3,
  Tag,
  Package,
  MapPin,
  Pencil,
  Phone,
  Settings,
  MessageCircle,
  Ban,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminCancelOrderModal from "@/components/admin/AdminCancelOrderModal";
import AdminReviewCancellationModal from "@/components/admin/AdminReviewCancellationModal";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  fetchAdminOrdersFromDb,
  updateAdminOrderInDb,
  getAdminOrderWhatsAppUrl,
  ALLOWED_STATUS_TRANSITIONS,
} from "@/lib/supabase/orders";
import {
  fetchDeliveryRulesFromDb,
  updateDeliveryRuleInDb,
} from "@/lib/supabase/deliveryRules";
import { Order, OrderStatus, PaymentStatus, DeliveryRule } from "@/types/order";
import { formatCurrency } from "@/config/shop";
import { getGoogleMapsPinUrl } from "@/lib/delivery";

const ORDER_STATUSES: { value: OrderStatus; label: string; badgeClass: string }[] = [
  { value: "placed", label: "Order Placed", badgeClass: "bg-amber-50 text-amber-800 border-amber-300" },
  { value: "confirmed", label: "Order Confirmed", badgeClass: "bg-blue-50 text-blue-800 border-blue-300" },
  { value: "preparing", label: "Order Preparing", badgeClass: "bg-purple-50 text-purple-800 border-purple-300" },
  { value: "out_for_delivery", label: "Out for Delivery", badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-300" },
  { value: "delivered", label: "Order Delivered", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  { value: "cancelled", label: "Cancelled", badgeClass: "bg-rose-50 text-rose-800 border-rose-300" },
];

const PAYMENT_STATUSES: { value: PaymentStatus; label: string; badgeClass: string }[] = [
  { value: "pending", label: "Pending Verification", badgeClass: "bg-amber-50 text-amber-800 border-amber-300" },
  { value: "paid", label: "Paid / Verified", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  { value: "failed", label: "Payment Failed", badgeClass: "bg-rose-50 text-rose-800 border-rose-300" },
  { value: "refunded", label: "Refunded", badgeClass: "bg-stone-100 text-stone-700 border-stone-300" },
];

export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Edit Order Modal State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>("placed");
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>("pending");
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editDeliveryNote, setEditDeliveryNote] = useState("");
  const [editCancellationReason, setEditCancellationReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);

  // Admin Cancel Order Modal State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Review Customer Cancellation Request Modal State
  const [orderToReview, setOrderToReview] = useState<Order | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Delivery Rules Manager Modal State
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [deliveryRules, setDeliveryRules] = useState<DeliveryRule[]>([]);
  const [editingRule, setEditingRule] = useState<DeliveryRule | null>(null);
  const [isSavingRule, setIsSavingRule] = useState(false);

  // Load orders from Supabase (Strictly real database records)
  const loadOrders = useCallback(async () => {
    try {
      const supabase = createBrowserClient();
      const data = await fetchAdminOrdersFromDb(undefined, supabase);
      setAllOrders(data);
      setFetchError(null);
    } catch (err) {
      console.error("Error loading admin orders:", err);
      setFetchError("Unable to load orders from the database. Please check your network connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const supabase = createBrowserClient();
        const data = await fetchAdminOrdersFromDb(undefined, supabase);
        if (isMounted) {
          setAllOrders(data);
          setFetchError(null);
        }
      } catch (err) {
        console.error("Failed to load admin orders:", err);
        if (isMounted) {
          setFetchError("Unable to load orders from the database. Please check your network connection.");
        }
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

  // Supabase Realtime Subscription for automatic order updates across admin sessions + 20s polling fallback
  useEffect(() => {
    let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
    let ordersChannel: ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null = null;

    try {
      supabaseClient = createBrowserClient();
      if (supabaseClient) {
        ordersChannel = supabaseClient
          .channel("admin_orders_realtime_dashboard")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "orders",
            },
            () => {
              loadOrders();
            }
          )
          .subscribe();
      }
    } catch (rtErr) {
      console.warn("Realtime subscription notice:", rtErr);
    }

    const intervalId = setInterval(() => {
      loadOrders();
    }, 20000);

    return () => {
      if (supabaseClient && ordersChannel) {
        supabaseClient.removeChannel(ordersChannel);
      }
      clearInterval(intervalId);
    };
  }, [loadOrders]);

  // Load delivery rules
  useEffect(() => {
    fetchDeliveryRulesFromDb().then(setDeliveryRules);
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      if (selectedStatusFilter !== "all" && order.orderStatus !== selectedStatusFilter) {
        return false;
      }
      if (selectedPaymentFilter !== "all" && order.paymentStatus !== selectedPaymentFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNumber = order.orderNumber.toLowerCase().includes(q);
        const matchName = order.customerName.toLowerCase().includes(q);
        const matchPhone = order.customerPhone.toLowerCase().includes(q);
        const matchEmail = Boolean(order.customerEmail && order.customerEmail.toLowerCase().includes(q));
        const matchSku = order.items.some((i) => i.skuSnapshot.toLowerCase().includes(q));
        if (!matchNumber && !matchName && !matchPhone && !matchEmail && !matchSku) {
          return false;
        }
      }
      return true;
    });
  }, [allOrders, selectedStatusFilter, selectedPaymentFilter, searchTerm]);

  // Summary statistics calculated exclusively from genuine Supabase orders
  const stats = useMemo(() => {
    const total = allOrders.length;
    const placed = allOrders.filter((o) => o.orderStatus === "placed").length;
    const active = allOrders.filter(
      (o) => o.orderStatus === "confirmed" || o.orderStatus === "preparing" || o.orderStatus === "out_for_delivery"
    ).length;
    const delivered = allOrders.filter((o) => o.orderStatus === "delivered").length;
    const cancelled = allOrders.filter((o) => o.orderStatus === "cancelled").length;
    const totalRevenue = allOrders
      .filter((o) => o.orderStatus !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { total, placed, active, delivered, cancelled, totalRevenue };
  }, [allOrders]);

  // Open Edit Modal
  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setEditStatus(order.orderStatus);
    setEditPaymentStatus(order.paymentStatus);
    setEditDeliveryDate(order.expectedDeliveryDate || "");
    setEditDeliveryNote(order.adminDeliveryNote || "");
    setEditCancellationReason(order.cancellationReason || "");
    setSaveError(null);
    setIsStatusConfirmOpen(false);
  };

  // Perform actual order updates in DB
  const executeSaveOrder = async () => {
    if (!editingOrder) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const supabase = createBrowserClient();
      const res = await updateAdminOrderInDb(
        editingOrder.id,
        {
          orderStatus: editStatus,
          paymentStatus: editPaymentStatus,
          expectedDeliveryDate: editDeliveryDate.trim() || null,
          adminDeliveryNote: editDeliveryNote.trim() || null,
          cancellationReason: editCancellationReason.trim() || editDeliveryNote.trim() || null,
        },
        supabase
      );

      if (!res.success) {
        setSaveError(res.error || "Failed to update order.");
        setIsSaving(false);
        setIsStatusConfirmOpen(false);
        return;
      }

      setToastMessage(`Order ${editingOrder.orderNumber} updated successfully.`);
      setTimeout(() => setToastMessage(null), 3500);
      setIsStatusConfirmOpen(false);
      setEditingOrder(null);
      loadOrders();
    } catch {
      setSaveError("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Save / Validate Status Transitions
  const handleSaveOrder = async () => {
    if (!editingOrder) return;

    if (editingOrder.orderStatus === "delivered" && editStatus !== "delivered") {
      setSaveError("Delivered orders cannot be modified or cancelled.");
      return;
    }

    if (editingOrder.orderStatus === "cancelled" && editStatus !== "cancelled") {
      setSaveError("Cancelled orders cannot be changed back to active status.");
      return;
    }

    // Validate valid status progression
    if (editStatus !== editingOrder.orderStatus) {
      const allowedNext = ALLOWED_STATUS_TRANSITIONS[editingOrder.orderStatus] || [];
      if (!allowedNext.includes(editStatus)) {
        setSaveError(
          `Invalid status transition from "${editingOrder.orderStatus}" to "${editStatus}". Follow progression: Placed → Confirmed → Preparing → Out for Delivery → Delivered.`
        );
        return;
      }
    }

    if (editStatus === "cancelled" && !editCancellationReason.trim() && !editDeliveryNote.trim()) {
      setSaveError("Please provide a cancellation reason for this order.");
      return;
    }

    // If status changed, show confirmation modal before applying
    if (editStatus !== editingOrder.orderStatus) {
      setSaveError(null);
      setIsStatusConfirmOpen(true);
      return;
    }

    // Direct save if status did not change (e.g. only delivery date or payment status updated)
    await executeSaveOrder();
  };

  // Save Delivery Rule Update
  const handleSaveRule = async (rule: DeliveryRule) => {
    setIsSavingRule(true);
    try {
      const supabase = createBrowserClient();
      const res = await updateDeliveryRuleInDb(rule, supabase);
      if (res.success) {
        setToastMessage(`Delivery rule "${rule.name}" updated.`);
        setTimeout(() => setToastMessage(null), 3000);
        const updated = await fetchDeliveryRulesFromDb();
        setDeliveryRules(updated);
        setEditingRule(null);
      }
    } catch {
      alert("Failed to update delivery rule.");
    } finally {
      setIsSavingRule(false);
    }
  };

  return (
    <AdminGuard>
      {({ user, onLogout }) => (
        <div className="min-h-screen bg-[#FDFBF7] text-[#2C2420]">
        {/* Admin Navigation Bar */}
        <header className="sticky top-0 z-40 bg-[#1C1614] border-b border-[#C5A059]/40 text-[#FAF7F2] shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Brand Title */}
              <div className="flex items-center gap-3">
                <Link href="/admin" className="flex items-center gap-2 group">
                  <div className="w-9 h-9 rounded-xl bg-[#6E121E] border border-[#C5A059] flex items-center justify-center text-[#E5D2A4] font-serif-luxury font-bold text-lg shadow-inner group-hover:scale-105 transition-transform">
                    SS
                  </div>
                  <div>
                    <span className="font-serif-luxury text-lg sm:text-xl font-bold tracking-wider text-[#E5D2A4] block leading-tight">
                      SaiSrujana
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#C5A059] font-medium block">
                      Admin Portal
                    </span>
                  </div>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6E121E] text-white text-xs font-semibold tracking-wider transition shadow-2xs"
                >
                  <Package className="w-3.5 h-3.5 text-[#E5D2A4]" />
                  <span>Orders</span>
                </Link>

                <Link
                  href="/admin/enquiries"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="hidden sm:inline">Enquiries</span>
                </Link>

                <Link
                  href="/admin/reviews"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                >
                  <Star className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="hidden sm:inline">Reviews</span>
                </Link>

                <Link
                  href="/admin/analytics"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="hidden sm:inline">Analytics</span>
                </Link>

                <Link
                  href="/admin/coupons"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 bg-[#FAF6EE] text-[#6E121E] hover:bg-[#F2E8D5] text-xs font-semibold tracking-wider transition shadow-2xs"
                >
                  <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="hidden sm:inline">Coupons</span>
                </Link>

                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E0D2] bg-white/10 text-white hover:bg-white/20 text-xs font-semibold tracking-wider transition"
                >
                  <span>Sarees</span>
                </Link>

                <Link
                  href="/"
                  target="_blank"
                  className="hidden lg:inline-flex items-center gap-1.5 text-xs text-[#A8988B] hover:text-white px-2.5 py-1.5 rounded-lg border border-[#3D332D] transition font-medium"
                >
                  <Store className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Store</span>
                  <ExternalLink className="w-3 h-3 text-[#8C7A6B]" />
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-950/40 text-red-300 hover:bg-red-900/50 hover:text-white text-xs font-medium transition cursor-pointer"
                  title="Sign out of Admin Portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
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

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E0D2]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                <Package className="w-3 h-3 text-[#C5A059]" />
                <span>Order Fulfillment Hub</span>
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
                Order Management
              </h1>
              <p className="text-xs sm:text-sm text-[#8C7A6B] mt-0.5">
                Process customer orders, verify PhonePe/UPI payments, update delivery dates, dispatch couriers, and chat on WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#C5A059]/60 bg-white hover:bg-[#FAF6EE] text-[#6E121E] text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Delivery Rules</span>
              </button>

              <button
                type="button"
                onClick={loadOrders}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#E5D2A4] ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider">
                Total Orders
              </span>
              <p className="font-serif-luxury text-2xl font-bold text-[#1E1715]">{stats.total}</p>
              <p className="text-[10.5px] text-[#8C7A6B]">All-time boutique orders</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                Newly Placed
              </span>
              <p className="font-serif-luxury text-2xl font-bold text-amber-700">{stats.placed}</p>
              <p className="text-[10.5px] text-[#8C7A6B]">Awaiting verification</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
                In Progress
              </span>
              <p className="font-serif-luxury text-2xl font-bold text-blue-700">{stats.active}</p>
              <p className="text-[10.5px] text-[#8C7A6B]">Preparing / Dispatched</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Delivered
              </span>
              <p className="font-serif-luxury text-2xl font-bold text-emerald-700">{stats.delivered}</p>
              <p className="text-[10.5px] text-[#8C7A6B]">Fulfillment complete</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                Cancelled
              </span>
              <p className="font-serif-luxury text-2xl font-bold text-rose-700">{stats.cancelled}</p>
              <p className="text-[10.5px] text-[#8C7A6B]">Cancelled orders</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#C5A059]/50 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-[#6E121E] uppercase tracking-wider">
                Total Order Value
              </span>
              <p className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#6E121E]">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-[10.5px] text-[#8C7A6B]">Excluding cancelled</p>
            </div>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E0D2] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order ID, customer name, phone, email, or saree SKU..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E8E0D2] text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#6E121E]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#6E121E] p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-[#8C7A6B] whitespace-nowrap">
                  Order Status:
                </label>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as OrderStatus | "all")}
                  className="px-3 py-2 rounded-xl border border-[#E8E0D2] bg-white text-xs font-medium text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-[#6E121E]"
                >
                  <option value="all">All Statuses</option>
                  <option value="placed">Placed</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-[#8C7A6B] whitespace-nowrap">
                  Payment:
                </label>
                <select
                  value={selectedPaymentFilter}
                  onChange={(e) => setSelectedPaymentFilter(e.target.value as PaymentStatus | "all")}
                  className="px-3 py-2 rounded-xl border border-[#E8E0D2] bg-white text-xs font-medium text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-[#6E121E]"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Database Fetch Error Banner */}
          {fetchError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold block">Database Connection Issue</span>
                  <span>{fetchError}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={loadOrders}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold transition cursor-pointer self-start sm:self-auto"
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* Orders List / Empty States */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#8C7A6B]">Loading orders...</p>
            </div>
          ) : allOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8E0D2] p-12 text-center max-w-md mx-auto space-y-3 shadow-2xs">
              <Package className="w-12 h-12 text-[#C5A059] mx-auto" />
              <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                No orders yet
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                New customer orders placed on the boutique website will appear here automatically.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8E0D2] p-12 text-center max-w-md mx-auto space-y-3 shadow-2xs">
              <Package className="w-12 h-12 text-[#C5A059] mx-auto" />
              <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                {allOrders.length === 0
                  ? "No orders yet"
                  : searchTerm.trim()
                  ? "No orders match your search."
                  : selectedStatusFilter !== "all"
                  ? "No orders with this status."
                  : selectedPaymentFilter !== "all"
                  ? "No orders with this payment status."
                  : "No Orders Found"}
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                {allOrders.length === 0
                  ? "There are currently no orders in your boutique database. As patrons purchase sarees through SaiSrujana, genuine orders will appear here."
                  : searchTerm.trim()
                  ? `No orders found matching "${searchTerm}". Try searching by customer name, phone, order ID, or SKU.`
                  : selectedStatusFilter !== "all"
                  ? `There are currently no orders with status "${selectedStatusFilter.replace(/_/g, " ")}".`
                  : selectedPaymentFilter !== "all"
                  ? `There are currently no orders with payment status "${selectedPaymentFilter}".`
                  : "No orders matched your current filter criteria."}
              </p>
              {(searchTerm || selectedStatusFilter !== "all" || selectedPaymentFilter !== "all") && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedStatusFilter("all");
                      setSelectedPaymentFilter("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusInfo =
                  ORDER_STATUSES.find((s) => s.value === order.orderStatus) || ORDER_STATUSES[0];
                const paymentInfo =
                  PAYMENT_STATUSES.find((p) => p.value === order.paymentStatus) || PAYMENT_STATUSES[0];
                const mapsUrl =
                  order.latitude && order.longitude
                    ? getGoogleMapsPinUrl(order.latitude, order.longitude)
                    : undefined;
                const whatsappUrl = getAdminOrderWhatsAppUrl(order);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-[#E8E0D2] p-5 sm:p-6 shadow-xs hover:border-[#C5A059] transition space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E0D2]/70">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-[#6E121E]">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-[#8C7A6B]">
                          • {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${paymentInfo.badgeClass}`}>
                          {paymentInfo.label}
                        </span>
                        {order.cancellationRequestStatus === "pending" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-400 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            <span>Cancellation Requested</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Review Cancellation Request Action */}
                        {order.cancellationRequestStatus === "pending" && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToReview(order);
                              setIsReviewModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-100" />
                            <span>Review Cancellation</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF0DC] hover:bg-[#F3E5CE] text-[#6E121E] text-xs font-semibold transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Manage Order</span>
                        </button>

                        {/* Direct Cancel Order Action - Only when cancellable */}
                        {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToCancel(order);
                              setIsCancelModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300/80 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                            title="Cancel Order"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                            <span>Cancel Order</span>
                          </button>
                        )}

                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold transition shadow-2xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* Prominent Pending Cancellation Request Alert Box */}
                    {order.cancellationRequestStatus === "pending" && (
                      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-900 block text-xs sm:text-sm">
                              Pending Cancellation Request from Customer
                            </span>
                            <span className="text-[11.5px] text-amber-800">
                              Reason: &ldquo;{order.cancellationRequestReason || "Customer requested cancellation"}&rdquo;
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderToReview(order);
                            setIsReviewModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-100" />
                          <span>Review Cancellation</span>
                        </button>
                      </div>
                    )}

                    {/* Prominent Cancelled Order Notice */}
                    {order.orderStatus === "cancelled" && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-900">
                          <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Order Cancelled</span>
                          {order.cancelledBy && (
                            <span className="text-[11px] font-semibold text-rose-700">by {order.cancelledBy}</span>
                          )}
                          {order.cancelledAt && (
                            <span className="text-[11px] text-rose-600 font-normal">
                              • {new Date(order.cancelledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        {order.cancellationReason && (
                          <p className="text-[11.5px] text-rose-800 pl-5.5">
                            <strong>Reason:</strong> {order.cancellationReason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Customer & Address Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Customer Info */}
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase font-bold text-[#8C7A6B]">Customer</span>
                        <p className="font-bold text-[#1E1715]">{order.customerName}</p>
                        <p className="text-[#5A4E46] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#C5A059]" /> {order.customerPhone}
                        </p>
                        {order.customerEmail && (
                          <p className="text-[#8C7A6B] truncate">{order.customerEmail}</p>
                        )}
                      </div>

                      {/* Delivery Destination */}
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase font-bold text-[#8C7A6B]">Delivery Address</span>
                        <p className="text-[#2C2420]">
                          {order.houseNo}, {order.street}
                          {order.landmark ? `, Near ${order.landmark}` : ""}
                        </p>
                        <p className="text-[#8C7A6B]">
                          {order.city}, {order.district}, {order.state} - {order.pincode}
                        </p>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6E121E] hover:underline pt-0.5"
                          >
                            <MapPin className="w-3 h-3 text-[#C5A059]" />
                            <span>Open in Google Maps ({order.deliveryDistanceKm ? `${order.deliveryDistanceKm} km` : "GPS"})</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      {/* Delivery Date & Notes */}
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase font-bold text-[#8C7A6B]">Delivery Schedule</span>
                        <p className="font-bold text-[#6E121E]">
                          Expected: {order.expectedDeliveryDate || "Not Set"}
                        </p>
                        {order.adminDeliveryNote && (
                          <p className="text-[11px] text-[#1E3F34] bg-[#E8F3EE] p-1.5 rounded">
                            <strong>Note:</strong> {order.adminDeliveryNote}
                          </p>
                        )}
                        <p className="text-[11px] text-[#8C7A6B]">
                          Payment Method: {order.paymentMethod === "upi_phonepe" ? "PhonePe / UPI" : "Cash on Delivery"}
                        </p>
                      </div>
                    </div>

                    {/* Items Breakdown */}
                    <div className="pt-2 border-t border-[#E8E0D2]/60">
                      <div className="flex flex-wrap items-center gap-3">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E0D2] text-xs"
                          >
                            <div className="relative w-8 h-10 rounded overflow-hidden bg-stone-100 shrink-0">
                              <Image
                                src={it.imageUrlSnapshot || "/images/kanchipuram.jpg"}
                                alt={it.sareeNameSnapshot}
                                fill
                                className="object-cover object-top"
                              />
                            </div>
                            <div>
                              <span className="font-bold text-[#1E1715] block truncate max-w-[180px]">
                                {it.sareeNameSnapshot}
                              </span>
                              <span className="text-[10.5px] text-[#8C7A6B]">
                                SKU: {it.skuSnapshot} {it.selectedColour ? `(${it.selectedColour})` : ""} • Qty: {it.quantity} • {formatCurrency(it.totalPrice)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-[#E8E0D2]/40">
                        <span className="text-[#8C7A6B]">
                          Subtotal: {formatCurrency(order.subtotal)} • Delivery: {formatCurrency(order.deliveryCharge)}
                          {order.couponDiscount > 0 ? ` • Coupon: -${formatCurrency(order.couponDiscount)}` : ""}
                        </span>
                        <span className="font-bold text-sm text-[#6E121E]">
                          Total: {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Modal: Edit Order Details */}
        {editingOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#C5A059]/50 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#C5A059]">Manage Order</span>
                  <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                    Order {editingOrder.orderNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="p-1 rounded-lg text-[#8C7A6B] hover:text-[#6E121E]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Order Summary Snapshot */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D2] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#8C7A6B] block text-[10.5px] uppercase font-bold">Order Number</span>
                  <span className="font-mono font-bold text-[#6E121E]">{editingOrder.orderNumber}</span>
                </div>
                <div>
                  <span className="text-[#8C7A6B] block text-[10.5px] uppercase font-bold">Customer Name</span>
                  <span className="font-bold text-[#1E1715]">{editingOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-[#8C7A6B] block text-[10.5px] uppercase font-bold">Current Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${ORDER_STATUSES.find((s) => s.value === editingOrder.orderStatus)?.badgeClass || ""}`}>
                    {ORDER_STATUSES.find((s) => s.value === editingOrder.orderStatus)?.label || editingOrder.orderStatus}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C7A6B] block text-[10.5px] uppercase font-bold">Payment Status</span>
                  <span className="font-semibold capitalize text-[#1E3F34]">{editingOrder.paymentStatus}</span>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <span className="text-[#8C7A6B] block text-[10.5px] uppercase font-bold">Expected Delivery</span>
                  <span className="font-semibold text-[#1E1715]">{editingOrder.expectedDeliveryDate || "Not Set"}</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Order Status */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-[#1E1715]">Next Order Status</label>
                    {editStatus !== editingOrder.orderStatus && (
                      <span className="text-[11px] text-[#6E121E] font-bold">
                        New: {ORDER_STATUSES.find((s) => s.value === editStatus)?.label || editStatus}
                      </span>
                    )}
                  </div>
                  {editingOrder.orderStatus === "delivered" ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                      This order is <strong>Delivered</strong>. Delivered orders are permanently locked.
                    </div>
                  ) : editingOrder.orderStatus === "cancelled" ? (
                    <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-stone-600 text-xs">
                      This order is <strong>Cancelled</strong>. Cancelled orders cannot be moved back to active status.
                    </div>
                  ) : (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D2] bg-white text-xs font-medium text-[#2C2420] focus:ring-1 focus:ring-[#6E121E]"
                    >
                      {ALLOWED_STATUS_TRANSITIONS[editingOrder.orderStatus]?.map((statusVal) => {
                        const st = ORDER_STATUSES.find((s) => s.value === statusVal);
                        return (
                          <option key={statusVal} value={statusVal}>
                            {st?.label || statusVal}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block font-bold text-[#1E1715] mb-1">
                    Payment Status (Independently controlled)
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D2] bg-white text-xs font-medium text-[#2C2420] focus:ring-1 focus:ring-[#6E121E]"
                  >
                    {PAYMENT_STATUSES.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expected Delivery Date */}
                <div>
                  <label className="block font-bold text-[#1E1715] mb-1">
                    Expected Delivery Date (Visible to Patron)
                  </label>
                  <input
                    type="text"
                    value={editDeliveryDate}
                    onChange={(e) => setEditDeliveryDate(e.target.value)}
                    placeholder="e.g. 02 Oct 2026 or Tomorrow Evening"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D2] text-xs font-medium text-[#2C2420] focus:ring-1 focus:ring-[#6E121E]"
                  />
                </div>

                {/* Cancellation Reason (Visible & Required when Cancelled) */}
                {editStatus === "cancelled" && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <label className="block font-bold text-rose-900 mb-1">
                      Cancellation Reason (Required for record & patron notification)
                    </label>
                    <input
                      type="text"
                      value={editCancellationReason}
                      onChange={(e) => setEditCancellationReason(e.target.value)}
                      placeholder="e.g. Requested by customer / Item unavailable / Duplicate order"
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs font-medium text-[#2C2420] focus:ring-1 focus:ring-rose-700"
                    />
                  </div>
                )}

                {/* Admin Delivery Note */}
                <div>
                  <label className="block font-bold text-[#1E1715] mb-1">
                    Admin Delivery Note / Tracking Number
                  </label>
                  <textarea
                    rows={3}
                    value={editDeliveryNote}
                    onChange={(e) => setEditDeliveryNote(e.target.value)}
                    placeholder="e.g. Dispatched via DTDC tracking #123456. Out for delivery."
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D2] text-xs font-medium text-[#2C2420] focus:ring-1 focus:ring-[#6E121E] resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E8E0D2] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D2] text-[#5A4E46] text-xs font-semibold cursor-pointer hover:bg-stone-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveOrder}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#6E121E] hover:bg-[#590D18] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Status Change */}
        {isStatusConfirmOpen && editingOrder && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-[#C5A059]/60 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif-luxury text-lg font-bold text-[#1E1715]">
                    Confirm Status Change
                  </h3>
                  <p className="font-mono text-xs font-bold text-[#6E121E]">
                    {editingOrder.orderNumber}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D2] space-y-3 text-xs">
                <div className="flex items-center justify-between text-[#8C7A6B]">
                  <span>Customer:</span>
                  <span className="font-bold text-[#1E1715]">{editingOrder.customerName}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E0D2]">
                  <span className="text-[#8C7A6B]">Status Transition:</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] border ${ORDER_STATUSES.find((s) => s.value === editingOrder.orderStatus)?.badgeClass || ""}`}>
                      {ORDER_STATUSES.find((s) => s.value === editingOrder.orderStatus)?.label || editingOrder.orderStatus}
                    </span>
                    <span className="text-[#6E121E]">→</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] border ${ORDER_STATUSES.find((s) => s.value === editStatus)?.badgeClass || ""}`}>
                      {ORDER_STATUSES.find((s) => s.value === editStatus)?.label || editStatus}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#5A4E46]">
                Are you sure you want to change the status of order <strong>{editingOrder.orderNumber}</strong> to <strong>{ORDER_STATUSES.find((s) => s.value === editStatus)?.label || editStatus}</strong>? The customer will receive an immediate notification in their account.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E8E0D2]">
                <button
                  type="button"
                  onClick={() => setIsStatusConfirmOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D2] text-[#5A4E46] text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSaveOrder}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSaving ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Delivery Rules Manager */}
        {isRulesModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#C5A059]/50 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#C5A059]">Distance & Delivery Settings</span>
                  <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                    Configurable Delivery Rules
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRulesModalOpen(false)}
                  className="p-1 rounded-lg text-[#8C7A6B] hover:text-[#6E121E]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#5A4E46]">
                Configure delivery charge slabs and estimated fulfillment days based on distance from SaiSrujana showroom in Armoor.
              </p>

              <div className="space-y-3">
                {deliveryRules.map((rule) => {
                  const isEditingThis = editingRule?.id === rule.id;

                  return (
                    <div
                      key={rule.id}
                      className="p-4 rounded-xl border border-[#E8E0D2] bg-[#FAF7F2] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-[#1E1715]">{rule.name}</h4>
                          <p className="text-[11px] text-[#8C7A6B]">
                            {rule.minDistanceKm} km – {rule.maxDistanceKm ? `${rule.maxDistanceKm} km` : "Any Distance"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-xs text-[#6E121E]">
                            ₹{rule.charge} ({rule.estimatedDays} days)
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingRule(rule)}
                            className="text-xs text-[#6E121E] font-semibold hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      </div>

                      {/* Inline Edit Form */}
                      {isEditingThis && (
                        <div className="pt-3 border-t border-[#E8E0D2] grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-[#8C7A6B] mb-1">
                              Charge (₹)
                            </label>
                            <input
                              type="number"
                              value={editingRule.charge}
                              onChange={(e) =>
                                setEditingRule({ ...editingRule, charge: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#8C7A6B] mb-1">
                              Est. Days
                            </label>
                            <input
                              type="number"
                              value={editingRule.estimatedDays}
                              onChange={(e) =>
                                setEditingRule({
                                  ...editingRule,
                                  estimatedDays: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                            />
                          </div>

                          <div className="flex items-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveRule(editingRule)}
                              disabled={isSavingRule}
                              className="px-3 py-1.5 bg-[#6E121E] text-white rounded-lg text-xs font-semibold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRule(null)}
                              className="px-3 py-1.5 border rounded-lg text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#E8E0D2] flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsRulesModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#6E121E] text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Cancel Order Modal */}
        <AdminCancelOrderModal
          order={orderToCancel}
          isOpen={isCancelModalOpen}
          adminEmail={user?.email || "admin"}
          onClose={() => {
            setIsCancelModalOpen(false);
            setOrderToCancel(null);
          }}
          onOrderCancelled={(cancelledOrder) => {
            setAllOrders((prev) =>
              prev.map((o) => (o.id === cancelledOrder.id ? cancelledOrder : o))
            );
            setToastMessage(`Order ${cancelledOrder.orderNumber} has been cancelled.`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />

        {/* Admin Review Customer Cancellation Modal */}
        <AdminReviewCancellationModal
          order={orderToReview}
          isOpen={isReviewModalOpen}
          adminEmail={user?.email || "admin"}
          onClose={() => {
            setIsReviewModalOpen(false);
            setOrderToReview(null);
          }}
          onOrderUpdated={(updatedOrder) => {
            setAllOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
            const msg =
              updatedOrder.cancellationRequestStatus === "approved"
                ? `Cancellation for order ${updatedOrder.orderNumber} approved.`
                : `Cancellation request for order ${updatedOrder.orderNumber} rejected.`;
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      </div>
    )}
  </AdminGuard>
  );
}
