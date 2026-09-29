"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  LogOut,
  Heart,
  ShoppingBag,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Clock,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Package,
  Truck,
  MapPin,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Bell,
  CheckCheck,
  User as UserIcon,
  Ban,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RecentlyViewed from "@/components/RecentlyViewed";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import CancelOrderModal from "@/components/CancelOrderModal";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { createBrowserClient } from "@/lib/supabase/client";
import { fetchCustomerEnquiriesFromDb } from "@/lib/supabase/enquiries";
import {
  fetchCustomerOrdersFromDb,
  getCustomerOrderWhatsAppUrl,
  fetchCustomerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/supabase/orders";
import { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { Order, OrderStatus, CustomerNotification } from "@/types/order";
import { CustomerAddress } from "@/types/address";
import {
  fetchCustomerAddresses,
  setDefaultCustomerAddress,
  deleteCustomerAddress,
} from "@/lib/supabase/addresses";
import AddressSetupModal from "@/components/AddressSetupModal";
import { formatCurrency, getWhatsAppUrl } from "@/config/shop";
import { getGoogleMapsPinUrl } from "@/lib/delivery";

type AccountActiveTab = "orders" | "addresses" | "notifications" | "enquiries" | "profile";

const ENQUIRY_STATUS_FILTERS: { value: EnquiryStatus | "all"; label: string }[] = [
  { value: "all", label: "All Enquiries" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ENQUIRY_STATUS_CONFIG: Record<
  EnquiryStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  new: {
    label: "New Inquiry",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    dotClass: "bg-amber-500",
  },
  contacted: {
    label: "Contacted",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-300",
    dotClass: "bg-blue-500",
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dotClass: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-300",
    dotClass: "bg-stone-400",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-300",
    dotClass: "bg-rose-500",
  },
};

const ORDER_TIMELINE_STEPS = [
  { key: "placed", label: "Placed", desc: "Received at Armoor boutique" },
  { key: "confirmed", label: "Confirmed", desc: "Order verified with boutique" },
  { key: "preparing", label: "Preparing", desc: "Handloom inspection & packing" },
  { key: "out_for_delivery", label: "Out for Delivery", desc: "Dispatched with courier" },
  { key: "delivered", label: "Delivered", desc: "Handed over to patron" },
];

function getOrderStepIndex(status: OrderStatus): number {
  switch (status) {
    case "placed":
      return 0;
    case "confirmed":
      return 1;
    case "preparing":
      return 2;
    case "out_for_delivery":
      return 3;
    case "delivered":
      return 4;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

export default function CustomerAccountPage() {
  const router = useRouter();
  const { user, customerName, customerEmail, isLoading, isLoggedIn, signOut } = useAuth();
  const { totalCount: cartCount } = useCart();
  const { totalCount: wishlistCount } = useWishlist();

  const [activeTab, setActiveTab] = useState<AccountActiveTab>("orders");

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForCancelRequest, setOrderForCancelRequest] = useState<Order | null>(null);
  const [isCancelRequestModalOpen, setIsCancelRequestModalOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  // Enquiries State
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(true);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);
  const [selectedEnquiryStatus, setSelectedEnquiryStatus] = useState<EnquiryStatus | "all">("all");

  // Addresses State
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Function to refresh orders
  const loadOrders = useCallback(async () => {
    if (!user?.id && !customerEmail) return;
    try {
      const orderData = await fetchCustomerOrdersFromDb({
        userId: user?.id,
        email: customerEmail || undefined,
      });
      setOrders(orderData);
      setOrderError(null);
    } catch (err) {
      console.error("Error loading customer orders:", err);
      setOrderError("Unable to load your order history. Please try again.");
    } finally {
      setIsLoadingOrders(false);
    }
  }, [user, customerEmail]);

  // Function to refresh notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const notifs = await fetchCustomerNotifications(user.id);
      setNotifications(notifs);
    } catch (err) {
      console.error("Error loading customer notifications:", err);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user]);

  // Function to refresh enquiries
  const loadEnquiries = useCallback(async () => {
    if (!user?.id && !customerEmail) return;
    setIsLoadingEnquiries(true);
    setEnquiryError(null);
    try {
      const enquiryData = await fetchCustomerEnquiriesFromDb({
        email: customerEmail,
      });
      setEnquiries(enquiryData);
    } catch (err) {
      console.error("Error loading customer enquiries:", err);
      setEnquiryError("Unable to load your enquiry history. Please try again.");
    } finally {
      setIsLoadingEnquiries(false);
    }
  }, [user, customerEmail]);

  const handleMarkAsRead = async (notifId: string) => {
    const success = await markNotificationAsRead(notifId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    const success = await markAllNotificationsAsRead(user.id);
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // If not logged in and done loading, redirect to login
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login?redirect=/account");
    }
  }, [isLoading, isLoggedIn, router]);

  // Synchronize activeTab from URL search parameters (e.g., /account?tab=orders)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as AccountActiveTab | null;
      if (
        tabParam &&
        ["orders", "addresses", "notifications", "enquiries", "profile"].includes(tabParam)
      ) {
        Promise.resolve().then(() => setActiveTab(tabParam));
      }
    }
  }, []);

  // Load customer's orders, notifications, enquiries and addresses
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user?.id) return;

      // 1. Fetch Orders (Strictly user_id = auth.uid() or customer_email)
      setIsLoadingOrders(true);
      setOrderError(null);
      try {
        const orderData = await fetchCustomerOrdersFromDb({
          userId: user.id,
          email: customerEmail || undefined,
        });
        if (isMounted) {
          setOrders(orderData);
        }
      } catch (err) {
        console.error("Error loading customer orders:", err);
        if (isMounted) setOrderError("Unable to load your orders history. Please try again.");
      } finally {
        if (isMounted) setIsLoadingOrders(false);
      }

      // 2. Fetch Notifications
      setIsLoadingNotifications(true);
      try {
        const notifs = await fetchCustomerNotifications(user.id);
        if (isMounted) {
          setNotifications(notifs);
        }
      } catch (notifErr) {
        console.error("Error loading notifications:", notifErr);
      } finally {
        if (isMounted) setIsLoadingNotifications(false);
      }

      // 3. Fetch Enquiries
      setIsLoadingEnquiries(true);
      setEnquiryError(null);
      try {
        const enquiryData = await fetchCustomerEnquiriesFromDb({
          email: customerEmail,
        });
        if (isMounted) {
          setEnquiries(enquiryData);
        }
      } catch (err) {
        console.error("Error loading customer enquiries:", err);
        if (isMounted) setEnquiryError("Unable to load your enquiry history.");
      } finally {
        if (isMounted) setIsLoadingEnquiries(false);
      }

      // 4. Fetch Saved Addresses
      setIsLoadingAddresses(true);
      try {
        const addrData = await fetchCustomerAddresses(user.id);
        if (isMounted) {
          setAddresses(addrData);
        }
      } catch (err) {
        console.error("Error loading customer addresses:", err);
      } finally {
        if (isMounted) setIsLoadingAddresses(false);
      }
    }

    if (user?.id) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, customerEmail]);

  // Supabase Realtime Subscription for automatic order & notification updates + window focus & 20s polling fallback
  useEffect(() => {
    if (!user?.id) return;

    let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
    let ordersChannel: ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null = null;
    let notifsChannel: ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null = null;

    try {
      supabaseClient = createBrowserClient();
      if (supabaseClient) {
        ordersChannel = supabaseClient
          .channel(`realtime_orders_${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "orders",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              loadOrders();
            }
          )
          .subscribe();

        notifsChannel = supabaseClient
          .channel(`realtime_notifs_${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "customer_notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              loadNotifications();
              loadOrders();
            }
          )
          .subscribe();
      }
    } catch (rtErr) {
      console.warn("Realtime subscription notice:", rtErr);
    }

    // Refresh when patron switches back to tab
    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadOrders();
        loadNotifications();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleVisibility);
      window.addEventListener("visibilitychange", handleVisibility);
    }

    // Safe Polling Fallback every 20 seconds
    const intervalId = setInterval(() => {
      loadOrders();
      loadNotifications();
    }, 20000);

    return () => {
      if (supabaseClient && ordersChannel) {
        supabaseClient.removeChannel(ordersChannel);
      }
      if (supabaseClient && notifsChannel) {
        supabaseClient.removeChannel(notifsChannel);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleVisibility);
        window.removeEventListener("visibilitychange", handleVisibility);
      }
      clearInterval(intervalId);
    };
  }, [user?.id, loadOrders, loadNotifications]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  const filteredEnquiries = useMemo(() => {
    if (selectedEnquiryStatus === "all") return enquiries;
    return enquiries.filter((e) => e.status === selectedEnquiryStatus);
  }, [enquiries, selectedEnquiryStatus]);

  const enquiryStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: enquiries.length };
    enquiries.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return counts;
  }, [enquiries]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const generalWhatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am reaching out from my SaiSrujana account (${customerName || "Patron"}). I would like to inquire about my saree orders & custom weaves.`
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif-luxury text-sm text-[#6E121E]">Loading Patron Account...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      <Navbar />

      <main className="flex-1">
        {/* 1. Account Header Banner */}
        <section className="bg-gradient-to-r from-[#1C1614] via-[#2A1E1A] to-[#1C1614] text-[#FAF7F2] py-10 sm:py-14 border-b border-[#C5A059]/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Patron Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#6E121E] border-2 border-[#C5A059] flex items-center justify-center text-[#E5D2A4] font-serif-luxury font-bold text-2xl sm:text-3xl shadow-lg shrink-0">
                  {customerName ? customerName.charAt(0).toUpperCase() : "P"}
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0DC]/20 border border-[#C5A059]/40 text-[#E5D2A4] text-[10px] font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#C5A059]" />
                    <span>SaiSrujana Patron</span>
                  </div>
                  <h1 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    {customerName || "Patron Profile"}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#A8988B] flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{customerEmail}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Link
                  href="/sarees"
                  className="py-2.5 px-4 rounded-xl border border-[#C5A059] bg-white hover:bg-[#FAF6EE] text-[#6E121E] text-xs font-semibold uppercase tracking-wider transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Catalogue</span>
                </Link>

                <a
                  href={generalWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
                  <span>WhatsApp Concierge</span>
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2.5 px-4 rounded-xl border border-white/20 bg-white/10 hover:bg-red-900/40 text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Quick Access Summary Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* My Orders Card */}
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition shadow-2xs flex items-center justify-between cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#6E121E] text-white border-[#6E121E]"
                  : "bg-white text-[#1E1715] border-[#E8E0D2] hover:border-[#C5A059]"
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                    activeTab === "orders" ? "bg-white/20 text-white" : "bg-[#FAF0DC] text-[#6E121E]"
                  }`}
                >
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-xs sm:text-sm">My Orders</h3>
                  <p className={`text-[11px] ${activeTab === "orders" ? "text-white/80" : "text-[#8C7A6B]"}`}>
                    {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${activeTab === "orders" ? "bg-white text-[#6E121E]" : "bg-[#FAF6EE] text-[#6E121E]"}`}>
                {orders.length}
              </span>
            </button>

            {/* Notifications Card with Unread Badge */}
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition shadow-2xs flex items-center justify-between cursor-pointer relative ${
                activeTab === "notifications"
                  ? "bg-[#6E121E] text-white border-[#6E121E]"
                  : "bg-white text-[#1E1715] border-[#E8E0D2] hover:border-[#C5A059]"
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center relative ${
                    activeTab === "notifications" ? "bg-white/20 text-white" : "bg-[#FAF0DC] text-[#C5A059]"
                  }`}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#6E121E]" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-xs sm:text-sm">Alerts</h3>
                  <p className={`text-[11px] ${activeTab === "notifications" ? "text-white/80" : "text-[#8C7A6B]"}`}>
                    {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} New` : "Updated"}
                  </p>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  unreadNotificationsCount > 0
                    ? "bg-rose-600 text-white"
                    : activeTab === "notifications"
                    ? "bg-white text-[#6E121E]"
                    : "bg-[#FAF6EE] text-[#6E121E]"
                }`}
              >
                {notifications.length}
              </span>
            </button>

            {/* Saved Addresses Card */}
            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition shadow-2xs flex items-center justify-between cursor-pointer ${
                activeTab === "addresses"
                  ? "bg-[#6E121E] text-white border-[#6E121E]"
                  : "bg-white text-[#1E1715] border-[#E8E0D2] hover:border-[#C5A059]"
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                    activeTab === "addresses" ? "bg-white/20 text-white" : "bg-[#FAF0DC] text-[#6E121E]"
                  }`}
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-xs sm:text-sm">Addresses</h3>
                  <p className={`text-[11px] ${activeTab === "addresses" ? "text-white/80" : "text-[#8C7A6B]"}`}>
                    {addresses.length} Saved
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${activeTab === "addresses" ? "bg-white text-[#6E121E]" : "bg-[#FAF6EE] text-[#6E121E]"}`}>
                {addresses.length}
              </span>
            </button>

            {/* My Enquiries Card */}
            <button
              type="button"
              onClick={() => setActiveTab("enquiries")}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition shadow-2xs flex items-center justify-between cursor-pointer ${
                activeTab === "enquiries"
                  ? "bg-[#6E121E] text-white border-[#6E121E]"
                  : "bg-white text-[#1E1715] border-[#E8E0D2] hover:border-[#C5A059]"
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                    activeTab === "enquiries" ? "bg-white/20 text-white" : "bg-[#FAF0DC] text-[#C5A059]"
                  }`}
                >
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#6E121E]" />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-xs sm:text-sm">Inquiries</h3>
                  <p className={`text-[11px] ${activeTab === "enquiries" ? "text-white/80" : "text-[#8C7A6B]"}`}>
                    {enquiries.length} {enquiries.length === 1 ? "Inquiry" : "Inquiries"}
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${activeTab === "enquiries" ? "bg-white text-[#6E121E]" : "bg-[#FAF6EE] text-[#6E121E]"}`}>
                {enquiries.length}
              </span>
            </button>

            {/* Wishlist Card */}
            <Link
              href="/wishlist"
              className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E8E0D2] hover:border-[#C5A059] shadow-2xs flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF0DC] flex items-center justify-center text-[#6E121E]">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-[#6E121E]" />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-xs sm:text-sm text-[#1E1715]">Wishlist</h3>
                  <p className="text-[11px] text-[#8C7A6B]">{wishlistCount} Saved</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8C7A6B]" />
            </Link>

            {/* Cart Card */}
            <Link
              href="/cart"
              className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E8E0D2] hover:border-[#C5A059] shadow-2xs flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#E8F3EE] flex items-center justify-center text-[#1E3F34]">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-xs sm:text-sm text-[#1E1715]">Cart / Bag</h3>
                  <p className="text-[11px] text-[#8C7A6B]">{cartCount} Items</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8C7A6B]" />
            </Link>
          </div>
        </section>

        {/* 3. Main Dynamic Content: Orders, Enquiries, Addresses, Notifications & Profile */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Prominent Primary Tab Bar */}
          <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-[#E8E0D2] shadow-2xs flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            {/* YOUR ORDERS TAB BUTTON */}
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-serif-luxury font-bold text-xs sm:text-sm transition shrink-0 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#6E121E] text-white shadow-xs"
                  : "text-[#5C4D44] hover:bg-[#FAF0DC] hover:text-[#6E121E]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Your Orders</span>
              <span
                className={`text-[11px] px-2 py-0.2 rounded-full font-sans font-bold ${
                  activeTab === "orders"
                    ? "bg-white/20 text-white"
                    : "bg-[#FAF0DC] text-[#6E121E]"
                }`}
              >
                {orders.length}
              </span>
            </button>

            {/* SAVED ADDRESSES TAB BUTTON */}
            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-serif-luxury font-bold text-xs sm:text-sm transition shrink-0 cursor-pointer ${
                activeTab === "addresses"
                  ? "bg-[#6E121E] text-white shadow-xs"
                  : "text-[#5C4D44] hover:bg-[#FAF0DC] hover:text-[#6E121E]"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Saved Addresses</span>
              <span
                className={`text-[11px] px-2 py-0.2 rounded-full font-sans font-bold ${
                  activeTab === "addresses"
                    ? "bg-white/20 text-white"
                    : "bg-[#FAF0DC] text-[#6E121E]"
                }`}
              >
                {addresses.length}
              </span>
            </button>

            {/* NOTIFICATIONS TAB BUTTON */}
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-serif-luxury font-bold text-xs sm:text-sm transition shrink-0 cursor-pointer relative ${
                activeTab === "notifications"
                  ? "bg-[#6E121E] text-white shadow-xs"
                  : "text-[#5C4D44] hover:bg-[#FAF0DC] hover:text-[#6E121E]"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" />
              )}
              <span
                className={`text-[11px] px-2 py-0.2 rounded-full font-sans font-bold ${
                  unreadNotificationsCount > 0
                    ? "bg-rose-600 text-white"
                    : activeTab === "notifications"
                    ? "bg-white/20 text-white"
                    : "bg-[#FAF0DC] text-[#6E121E]"
                }`}
              >
                {notifications.length}
              </span>
            </button>

            {/* INQUIRIES TAB BUTTON */}
            <button
              type="button"
              onClick={() => setActiveTab("enquiries")}
              className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-serif-luxury font-bold text-xs sm:text-sm transition shrink-0 cursor-pointer ${
                activeTab === "enquiries"
                  ? "bg-[#6E121E] text-white shadow-xs"
                  : "text-[#5C4D44] hover:bg-[#FAF0DC] hover:text-[#6E121E]"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Inquiries</span>
              <span
                className={`text-[11px] px-2 py-0.2 rounded-full font-sans font-bold ${
                  activeTab === "enquiries"
                    ? "bg-white/20 text-white"
                    : "bg-[#FAF0DC] text-[#6E121E]"
                }`}
              >
                {enquiries.length}
              </span>
            </button>

            {/* PROFILE TAB BUTTON */}
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-serif-luxury font-bold text-xs sm:text-sm transition shrink-0 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#6E121E] text-white shadow-xs"
                  : "text-[#5C4D44] hover:bg-[#FAF0DC] hover:text-[#6E121E]"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Patron Profile</span>
            </button>
          </div>

          {/* TAB 1: YOUR ORDERS */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-3xl border border-[#E8E0D2] p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E0D2]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                    <Package className="w-3 h-3 text-[#C5A059]" />
                    <span>Direct Order History &amp; Tracking</span>
                  </div>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
                    Your Orders
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8C7A6B] mt-0.5">
                    Track live status, parcel packaging, expected delivery dates, and dispatch updates from SaiSrujana, Armoor.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={loadOrders}
                    disabled={isLoadingOrders}
                    title="Refresh Orders"
                    className="p-2.5 rounded-xl border border-[#E8E0D2] bg-[#FAF7F2] hover:bg-[#FAF0DC] text-[#6E121E] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? "animate-spin" : ""}`} />
                  </button>
                  <Link
                    href="/sarees"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#E5D2A4]" />
                    <span>Shop More Sarees</span>
                  </Link>
                </div>
              </div>

              {/* Error Message */}
              {orderError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={loadOrders}
                    className="px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 transition self-start sm:self-auto cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isLoadingOrders ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-9 h-9 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-serif-luxury text-sm text-[#6E121E]">Loading your orders...</p>
                  <p className="text-xs text-[#8C7A6B]">Fetching your saree purchases from SaiSrujana database</p>
                </div>
              ) : orders.length === 0 ? (
                /* Empty Orders State */
                <div className="py-16 text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#FAF0DC] border border-[#C5A059]/40 flex items-center justify-center mx-auto text-[#6E121E] shadow-2xs">
                    <Package className="w-8 h-8 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                      You haven’t placed any orders yet.
                    </h3>
                    <p className="text-xs text-[#8C7A6B] leading-relaxed mt-1">
                      Browse our handcrafted Kanchipuram, Banarasi, Gadwal, and Paithani silk collection and place your first order.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/sarees"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#EAD096]" />
                      <span>Continue Shopping</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Orders List */
                <div className="space-y-6">
                  {orders.map((order) => {
                    const isCancelled = order.orderStatus === "cancelled";
                    const isDelivered = order.orderStatus === "delivered";
                    const currentStepIdx = getOrderStepIndex(order.orderStatus);
                    const whatsappUrl = getCustomerOrderWhatsAppUrl(order);
                    const hasGps = order.latitude !== null && order.latitude !== undefined && order.longitude !== null && order.longitude !== undefined;

                    return (
                      <div
                        key={order.id}
                        className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D2] p-5 sm:p-7 shadow-xs space-y-5 transition-all hover:border-[#C5A059]/60"
                      >
                        {/* Card Top: Order Number, Date, Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E0D2]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm sm:text-base text-[#6E121E]">
                                {order.orderNumber}
                              </span>
                              <span className="text-xs text-[#8C7A6B]">
                                • Placed on {formatDate(order.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-[#5A4E46] mt-0.5">
                              Payment:{" "}
                              <span className="font-semibold">
                                {order.paymentMethod === "upi_phonepe" ? "PhonePe / UPI" : "Cash on Delivery (COD)"}
                              </span>{" "}
                              • Status:{" "}
                              <span className="font-semibold uppercase text-[#1E3F34]">
                                {order.paymentStatus}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                isDelivered
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : isCancelled
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/50"
                              }`}
                            >
                              {order.orderStatus.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Status Stages Tracker: Placed → Confirmed → Packed → Shipped → Out for Delivery → Delivered */}
                        {!isCancelled ? (
                          <div className="py-3.5 px-3 sm:px-5 bg-white rounded-xl border border-[#E8E0D2]/80 shadow-2xs space-y-2">
                            <span className="text-[11px] uppercase font-bold tracking-wider text-[#8C7A6B] block">
                              Order Status Stages
                            </span>

                            <div className="relative pt-1 pb-1">
                              {/* Connector Line */}
                              <div className="hidden sm:block absolute top-4 left-5 right-5 h-0.5 bg-stone-200 -z-0" />
                              <div
                                className="hidden sm:block absolute top-4 left-5 h-0.5 bg-[#1E3F34] transition-all duration-500 -z-0"
                                style={{
                                  width: `${Math.max(0, Math.min(100, (currentStepIdx / (ORDER_TIMELINE_STEPS.length - 1)) * 100))}%`,
                                }}
                              />

                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-1">
                                {ORDER_TIMELINE_STEPS.map((step, sIdx) => {
                                  const isPassed = sIdx <= currentStepIdx;
                                  const isCurrent = sIdx === currentStepIdx;

                                  return (
                                    <div
                                      key={step.key}
                                      className="flex flex-col items-center text-center relative z-10"
                                    >
                                      <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                          isCurrent
                                            ? "bg-[#6E121E] text-white ring-3 ring-[#C5A059]/40 scale-105"
                                            : isPassed
                                            ? "bg-[#1E3F34] text-white"
                                            : "bg-stone-200 text-stone-500"
                                        }`}
                                      >
                                        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : sIdx + 1}
                                      </div>
                                      <span
                                        className={`text-[11px] font-bold mt-1 ${
                                          isCurrent
                                            ? "text-[#6E121E]"
                                            : isPassed
                                            ? "text-[#1E3F34]"
                                            : "text-[#8C7A6B]"
                                        }`}
                                      >
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                            <div className="flex items-center gap-2 font-bold text-rose-900">
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Cancelled</span>
                            </div>
                            <p className="text-rose-800 pl-6">
                              <strong>Cancellation Reason:</strong>{" "}
                              {order.cancellationReason ||
                                order.adminDeliveryNote ||
                                "This order was cancelled. Please connect with Gangadhar on WhatsApp for re-ordering or refund assistance."}
                            </p>
                          </div>
                        )}

                        {/* Cancellation Request Status Banner */}
                        {order.cancellationRequestStatus === "pending" && (
                          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">
                                Cancellation requested — waiting for SaiSrujana confirmation.
                              </span>
                              <span className="text-[11px] text-amber-800">
                                Reason submitted: &ldquo;{order.cancellationRequestReason || "Customer cancellation request"}&rdquo;
                              </span>
                            </div>
                          </div>
                        )}

                        {order.cancellationRequestStatus === "rejected" && !isCancelled && (
                          <div className="p-3 bg-stone-100 border border-stone-300 rounded-xl text-xs text-stone-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">Cancellation request was not approved</span>
                              <span className="text-[11px] text-stone-600">
                                Reason: {order.cancellationRejectReason || "Order is in active fulfillment."}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Items Snapshot List */}
                        <div>
                          <span className="text-xs uppercase font-bold tracking-wider text-[#8C7A6B] block mb-2">
                            Items Ordered ({order.items.length})
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {order.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="bg-white p-3 rounded-xl border border-[#E8E0D2] flex items-center gap-3"
                              >
                                <div className="relative w-14 h-18 rounded-lg overflow-hidden border border-[#E8E0D2] bg-stone-100 shrink-0">
                                  <Image
                                    src={it.imageUrlSnapshot || "/images/kanchipuram.jpg"}
                                    alt={it.sareeNameSnapshot}
                                    fill
                                    className="object-cover object-top"
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-[#1E1715] truncate">
                                    {it.sareeNameSnapshot}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C7A6B] mt-0.5">
                                    <span>SKU: {it.skuSnapshot}</span>
                                    {it.selectedColour && (
                                      <>
                                        <span>•</span>
                                        <span>Colour: <strong>{it.selectedColour}</strong></span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-xs mt-1.5">
                                    <span className="text-[#5A4E46]">
                                      {formatCurrency(it.unitPrice)} × {it.quantity}
                                    </span>
                                    <span className="font-bold text-[#6E121E]">
                                      {formatCurrency(it.totalPrice)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery & Address Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E8E0D2]">
                          <div className="space-y-1 text-xs">
                            <span className="font-bold text-[#1E1715] flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-[#C5A059]" /> Expected Delivery Date
                            </span>
                            <p className="font-semibold text-[#6E121E]">
                              {order.expectedDeliveryDate || "Not Set"}
                            </p>
                            {order.adminDeliveryNote && (
                              <p className="text-[11px] text-[#1E3F34] bg-[#E8F3EE] p-2 rounded-md mt-1">
                                <strong>Boutique Note:</strong> {order.adminDeliveryNote}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1 text-xs">
                            <span className="font-bold text-[#1E1715] flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> Delivery Address
                            </span>
                            <p className="text-[#5A4E46] leading-relaxed">
                              {order.customerName} ({order.customerPhone})
                              <br />
                              {order.houseNo}, {order.street}
                              {order.landmark ? `, Near ${order.landmark}` : ""}
                              <br />
                              {order.city}, {order.district}, {order.state} - {order.pincode}
                            </p>
                            {hasGps && (
                              <a
                                href={getGoogleMapsPinUrl(order.latitude!, order.longitude!)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6E121E] hover:underline pt-0.5"
                              >
                                <span>View Google Maps Pin</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Price Breakdown Summary */}
                        <div className="pt-3 border-t border-[#E8E0D2] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white/70 p-3 rounded-xl border border-[#E8E0D2]/60">
                          <div>
                            <span className="text-[#8C7A6B] block">Subtotal:</span>
                            <span className="font-semibold text-[#1E1715]">{formatCurrency(order.subtotal)}</span>
                          </div>
                          <div>
                            <span className="text-[#8C7A6B] block">Delivery Charge:</span>
                            <span className="font-semibold text-[#1E1715]">
                              {order.deliveryCharge === 0 ? "FREE" : formatCurrency(order.deliveryCharge)}
                            </span>
                          </div>
                          {order.couponDiscount > 0 && (
                            <div>
                              <span className="text-emerald-700 block">Coupon Discount:</span>
                              <span className="font-semibold text-emerald-700">-{formatCurrency(order.couponDiscount)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-[#8C7A6B] block">Grand Total:</span>
                            <span className="font-bold text-sm text-[#6E121E]">{formatCurrency(order.totalAmount)}</span>
                          </div>
                        </div>

                        {/* Actions: View Details Modal + WhatsApp Concierge + Request Cancellation */}
                        <div className="pt-3 border-t border-[#E8E0D2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForModal(order);
                                setIsOrderModalOpen(true);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#E5D2A4]" />
                              <span>View Details</span>
                            </button>

                            {/* Cancel Order Button: Available for active non-delivered orders */}
                            {!isCancelled && !isDelivered && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderForCancelRequest(order);
                                  setIsCancelRequestModalOpen(true);
                                }}
                                className="px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5 text-rose-600" />
                                <span>Request Cancellation</span>
                              </button>
                            )}

                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold tracking-wider uppercase transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
                              <span>Contact on WhatsApp</span>
                            </a>
                          </div>

                          <div className="text-right text-xs text-[#8C7A6B]">
                            <span>Order #{order.orderNumber}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS & ALERTS */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-3xl border border-[#E8E0D2] p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E0D2]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                    <Bell className="w-3 h-3 text-[#C5A059]" />
                    <span>Live Order Updates &amp; Alerts</span>
                  </div>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
                    Notifications
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8C7A6B] mt-0.5">
                    Live notifications for order confirmations, packaging progress, dispatch updates, and delivery alerts.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E0D2] bg-[#FAF7F2] hover:bg-[#FAF0DC] text-[#6E121E] text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Mark All Read</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={loadNotifications}
                    disabled={isLoadingNotifications}
                    title="Refresh Alerts"
                    className="p-2.5 rounded-xl border border-[#E8E0D2] bg-[#FAF7F2] hover:bg-[#FAF0DC] text-[#6E121E] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotifications ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              {isLoadingNotifications ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#8C7A6B]">Loading your alerts...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#FAF0DC] flex items-center justify-center mx-auto text-[#6E121E]">
                    <Bell className="w-7 h-7 text-[#C5A059]" />
                  </div>
                  <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                    No Notifications Yet
                  </h3>
                  <p className="text-xs text-[#8C7A6B] leading-relaxed">
                    You do not have any new notifications. As your saree orders progress from Armoor boutique, you will receive real-time updates here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => {
                    const matchedOrder = notif.orderId
                      ? orders.find((o) => o.id === notif.orderId || o.orderNumber === notif.orderId)
                      : null;

                    return (
                      <div
                        key={notif.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          notif.isRead
                            ? "bg-[#FAF7F2] border-[#E8E0D2]"
                            : "bg-white border-[#C5A059] shadow-2xs ring-1 ring-[#C5A059]/30"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              notif.isRead ? "bg-stone-100 text-stone-600" : "bg-[#FAF0DC] text-[#6E121E]"
                            }`}
                          >
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-sm text-[#1E1715]">
                                {notif.title}
                              </h4>
                              {matchedOrder && (
                                <span className="px-2 py-0.5 rounded-full bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40 text-[10px] font-mono font-bold">
                                  {matchedOrder.orderNumber}
                                </span>
                              )}
                              {!notif.isRead && (
                                <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#5A4E46] leading-relaxed">
                              {notif.message}
                            </p>
                            <p className="text-[11px] text-[#8C7A6B] pt-0.5">
                              {formatDate(notif.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {matchedOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForModal(matchedOrder);
                                setIsOrderModalOpen(true);
                                if (!notif.isRead) handleMarkAsRead(notif.id);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#E5D2A4]" />
                              <span>View Order</span>
                            </button>
                          )}
                          {!notif.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="px-3 py-1.5 rounded-lg border border-[#E8E0D2] bg-white hover:bg-stone-50 text-[#5A4E46] text-xs font-semibold transition cursor-pointer"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY ENQUIRIES */}
          {activeTab === "enquiries" && (
            <div className="bg-white rounded-3xl border border-[#E8E0D2] p-6 sm:p-8 shadow-xs">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E0D2]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                    <Clock className="w-3 h-3 text-[#C5A059]" />
                    <span>Inquiry Tracking</span>
                  </div>
                  <h2 className="font-serif-luxury text-2xl font-bold text-[#1E1715]">
                    My Saree Enquiries
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8C7A6B] mt-0.5">
                    Track the status, price, and details of all sarees and customized bridal inquiries you submitted.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold text-[#6E121E] bg-[#FAF0DC] border border-[#C5A059]/40 px-3 py-1 rounded-full">
                    {enquiries.length} Total {enquiries.length === 1 ? "Enquiry" : "Enquiries"}
                  </span>
                  <button
                    type="button"
                    onClick={loadEnquiries}
                    title="Refresh Enquiries"
                    disabled={isLoadingEnquiries}
                    className="p-1.5 rounded-full hover:bg-[#FAF0DC] text-[#8C7A6B] hover:text-[#6E121E] transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEnquiries ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-6 pb-6 overflow-x-auto">
                {ENQUIRY_STATUS_FILTERS.map((tab) => {
                  const count = enquiryStatusCounts[tab.value] || 0;
                  const isActive = selectedEnquiryStatus === tab.value;

                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedEnquiryStatus(tab.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#6E121E] text-white shadow-xs"
                          : "bg-[#FAF7F2] text-[#5A4E46] hover:bg-[#FAF0DC] border border-[#E8E0D2]"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#E8E0D2] text-[#2C2420]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Error Banner */}
              {enquiryError && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{enquiryError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={loadEnquiries}
                    className="font-semibold underline hover:text-amber-950 cursor-pointer shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Enquiries List */}
              {isLoadingEnquiries ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#8C7A6B]">Loading your enquiries...</p>
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#FAF0DC] flex items-center justify-center mx-auto text-[#6E121E]">
                    <MessageSquare className="w-7 h-7 text-[#C5A059]" />
                  </div>
                  <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                    No Enquiries Found
                  </h3>
                  <p className="text-xs text-[#8C7A6B]">
                    You have not submitted any enquiries under this status filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEnquiries.map((enquiry) => {
                    const statusInfo = ENQUIRY_STATUS_CONFIG[enquiry.status] || ENQUIRY_STATUS_CONFIG.new;

                    const followUpUrl = getWhatsAppUrl(
                      `Hello Gangadhar garu, I am following up on my enquiry for "${enquiry.sareeName || "Saree"}" (SKU: ${enquiry.sareeSku || "N/A"}) submitted on ${formatDate(enquiry.createdAt)}.`
                    );

                    return (
                      <div
                        key={enquiry.id}
                        className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                              {enquiry.sareeName || "General Saree Inquiry"}
                            </h4>
                            <p className="text-xs text-[#8C7A6B]">
                              SKU: {enquiry.sareeSku || "N/A"}{" "}
                              {enquiry.selectedColor ? `• Colour: ${enquiry.selectedColor}` : ""} •{" "}
                              Qty: {enquiry.quantity} • Submitted: {formatDate(enquiry.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
                            >
                              {statusInfo.label}
                            </span>
                            <a
                              href={followUpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-[#1E3F34] text-white text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        {enquiry.message && (
                          <p className="text-xs text-[#5A4E46] bg-white p-3 rounded-xl border border-[#E8E0D2]/70">
                            &ldquo;{enquiry.message}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="bg-white rounded-3xl border border-[#E8E0D2] p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E0D2]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3 h-3 text-[#C5A059]" />
                    <span>Doorstep Delivery Management</span>
                  </div>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
                    Saved Delivery Addresses
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8C7A6B] mt-0.5">
                    Save your home or boutique locations for fast checkout and exact distance calculations from Armoor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6E121E] via-[#8B1A2B] to-[#6E121E] text-white text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <MapPin className="w-4 h-4 text-[#EAD096]" />
                  <span>+ Add New Address</span>
                </button>
              </div>

              {/* Address List Content */}
              {isLoadingAddresses ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#8C7A6B]">Loading your saved addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#FAF0DC] flex items-center justify-center mx-auto text-[#6E121E]">
                    <MapPin className="w-8 h-8 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                      No Saved Addresses Yet
                    </h3>
                    <p className="text-xs text-[#8C7A6B] mt-1">
                      Save your home address with GPS or manual entry for instant 1-click checkout calculations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-[#6E121E] hover:bg-[#8B1A2B] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#EAD096]" />
                    <span>Set Delivery Address</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => {
                    return (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                          addr.isDefault
                            ? "bg-[#FAF7F2] border-[#C5A059] shadow-xs"
                            : "bg-white border-[#E8E0D2] hover:border-[#C5A059]/60"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6E121E] text-white text-[11px] font-bold">
                              <span>{addr.addressLabel || "Home"}</span>
                            </span>
                            {addr.isDefault ? (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EAD096] text-[#6E121E]">
                                Default Address
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!user?.id) return;
                                  const success = await setDefaultCustomerAddress(user.id, addr.id);
                                  if (success) {
                                    setAddresses((prev) =>
                                      prev.map((a) => ({
                                        ...a,
                                        isDefault: a.id === addr.id,
                                      }))
                                    );
                                  }
                                }}
                                className="text-xs font-semibold text-[#8C7A6B] hover:text-[#6E121E] transition underline cursor-pointer"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            {addr.customerName && (
                              <p className="text-sm font-bold text-[#1E1715]">
                                {addr.customerName}{" "}
                                {addr.phone && (
                                  <span className="text-xs font-normal text-[#5C4D44]">
                                    • {addr.phone}
                                  </span>
                                )}
                              </p>
                            )}
                            <p className="text-xs text-[#5C4D44] leading-relaxed">
                              {addr.houseNo}, {addr.street}
                              {addr.area ? `, ${addr.area}` : ""}
                              {addr.landmark ? `, Near ${addr.landmark}` : ""}
                              <br />
                              {addr.city}, {addr.district}, {addr.state} -{" "}
                              <span className="font-semibold">{addr.pincode}</span>
                            </p>
                          </div>

                          {addr.latitude !== null && addr.latitude !== undefined && addr.longitude !== null && addr.longitude !== undefined && (
                            <div className="pt-2 flex items-center justify-between text-xs text-[#1E3F34]">
                              <span className="flex items-center gap-1 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-[#6E121E]" />
                                <span>
                                  GPS: ({Number(addr.latitude).toFixed(4)}, {Number(addr.longitude).toFixed(4)})
                                </span>
                              </span>
                              <a
                                href={
                                  addr.googleMapsUrl ||
                                  `https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-[#6E121E] hover:underline"
                              >
                                View Pin ↗
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-[#E8E0D2] flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[#8C7A6B]">
                            Added on {formatDate(addr.createdAt)}
                          </span>

                          <button
                            type="button"
                            onClick={async () => {
                              if (!user?.id) return;
                              if (confirm("Are you sure you want to remove this address?")) {
                                const ok = await deleteCustomerAddress(user.id, addr.id);
                                if (ok) {
                                  setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
                                }
                              }
                            }}
                            className="text-rose-700 hover:text-rose-900 font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PATRON PROFILE */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-3xl border border-[#E8E0D2] p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E0D2]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                    <UserIcon className="w-3 h-3 text-[#C5A059]" />
                    <span>Patron Membership &amp; Overview</span>
                  </div>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
                    Account Profile
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8C7A6B] mt-0.5">
                    Manage your personal boutique details, order summaries, and concierge communication.
                  </p>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] space-y-4">
                  <h3 className="font-serif-luxury font-bold text-base text-[#1E1715] flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#6E121E]" />
                    <span>Personal Information</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] text-[#8C7A6B] uppercase font-bold tracking-wider block">
                        Full Name
                      </span>
                      <span className="font-bold text-sm text-[#1E1715]">
                        {customerName || "Patron Member"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#8C7A6B] uppercase font-bold tracking-wider block">
                        Email Address
                      </span>
                      <span className="font-medium text-sm text-[#1E1715]">
                        {customerEmail || "Not provided"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#8C7A6B] uppercase font-bold tracking-wider block">
                        Account Role &amp; Access
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        ✓ Verified Patron
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Activity Summary */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] space-y-4">
                  <h3 className="font-serif-luxury font-bold text-base text-[#1E1715] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span>Activity Summary</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="p-3 bg-white rounded-xl border border-[#E8E0D2] hover:border-[#C5A059] text-left transition cursor-pointer"
                    >
                      <span className="text-xl font-bold font-serif-luxury text-[#6E121E] block">
                        {orders.length}
                      </span>
                      <span className="text-[11px] text-[#8C7A6B] font-semibold">
                        Total Orders ↗
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("addresses")}
                      className="p-3 bg-white rounded-xl border border-[#E8E0D2] hover:border-[#C5A059] text-left transition cursor-pointer"
                    >
                      <span className="text-xl font-bold font-serif-luxury text-[#6E121E] block">
                        {addresses.length}
                      </span>
                      <span className="text-[11px] text-[#8C7A6B] font-semibold">
                        Saved Addresses ↗
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("notifications")}
                      className="p-3 bg-white rounded-xl border border-[#E8E0D2] hover:border-[#C5A059] text-left transition cursor-pointer"
                    >
                      <span className="text-xl font-bold font-serif-luxury text-[#6E121E] block">
                        {notifications.length}
                      </span>
                      <span className="text-[11px] text-[#8C7A6B] font-semibold">
                        Notifications ↗
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("enquiries")}
                      className="p-3 bg-white rounded-xl border border-[#E8E0D2] hover:border-[#C5A059] text-left transition cursor-pointer"
                    >
                      <span className="text-xl font-bold font-serif-luxury text-[#6E121E] block">
                        {enquiries.length}
                      </span>
                      <span className="text-[11px] text-[#8C7A6B] font-semibold">
                        Inquiries ↗
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Boutique Concierge Banner */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#1C1614] to-[#2A1E1A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-serif-luxury font-bold text-base text-[#E5D2A4]">
                    Need personalized saree styling or custom weave advice?
                  </h4>
                  <p className="text-xs text-white/80">
                    Connect directly with Gangadhar garu at SaiSrujana, Armoor on WhatsApp.
                  </p>
                </div>
                <a
                  href={generalWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold uppercase tracking-wider transition shrink-0 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                  <span>WhatsApp Concierge</span>
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Modal for adding/setting address */}
        {user?.id && (
          <AddressSetupModal
            isOpen={isAddressModalOpen}
            userId={user.id}
            customerName={customerName}
            customerPhone=""
            onAddressSaved={(saved) => {
              setAddresses((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
            }}
            onClose={() => setIsAddressModalOpen(false)}
          />
        )}

        {/* Modal for viewing order details */}
        <OrderDetailsModal
          order={selectedOrderForModal}
          isOpen={isOrderModalOpen}
          userId={user?.id}
          onOrderUpdated={(updated) => {
            setSelectedOrderForModal(updated);
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          }}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedOrderForModal(null);
          }}
        />

        {/* Modal for customer requesting cancellation */}
        {orderForCancelRequest && (
          <CancelOrderModal
            order={orderForCancelRequest}
            isOpen={isCancelRequestModalOpen}
            userId={user?.id || ""}
            onOrderCancelled={(updated) => {
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
              if (selectedOrderForModal?.id === updated.id) {
                setSelectedOrderForModal(updated);
              }
            }}
            onClose={() => {
              setIsCancelRequestModalOpen(false);
              setOrderForCancelRequest(null);
            }}
          />
        )}

        {/* Recently Viewed Sarees Carousel / Grid */}
        <RecentlyViewed className="border-t border-[#E8E0D2] bg-white" />
      </main>

      <Footer />
    </div>
  );
}
