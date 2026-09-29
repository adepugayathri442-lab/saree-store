"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  MapPin,
  AlertCircle,
  Sparkles,
  Tag,
  Check,
  Lock,
  Truck,
  CreditCard,
  Banknote,
  QrCode,
  ChevronRight,
  Phone,
  User,
  Mail,
  Home,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { SHOP_CONFIG, formatCurrency } from "@/config/shop";
import { CartItem } from "@/types/cart";
import { Saree, SareeVariant } from "@/types/saree";
import { Coupon } from "@/types/coupon";
import { DeliveryRule, PaymentMethod } from "@/types/order";
import { validateCouponCode } from "@/lib/supabase/coupons";
import { fetchSareeByIdFromDb } from "@/lib/supabase/sarees";
import { getSareeById } from "@/data/sarees";
import {
  DEFAULT_DELIVERY_RULES,
  calculateHaversineDistanceKm,
  estimateDistanceKmFromPincode,
  evaluateDeliveryForDistance,
  calculateInitialDeliveryDate,
} from "@/lib/delivery";
import { fetchDeliveryRulesFromDb } from "@/lib/supabase/deliveryRules";
import { createOrderInDb, getOrderWhatsAppUrl } from "@/lib/supabase/orders";
import { CustomerAddress } from "@/types/address";
import {
  fetchCustomerAddresses,
  saveCustomerAddress,
} from "@/lib/supabase/addresses";
import {
  getCurrentBrowserCoordinates,
  reverseGeocodeCoordinates,
} from "@/lib/geocoding";
import AddressSetupModal from "@/components/AddressSetupModal";

export default function CheckoutView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: cartItems, clearCart, isLoaded } = useCart();
  const { user, customerName, customerEmail } = useAuth();

  // URL query params for "Buy Now" flow
  const isBuyNow = searchParams.get("buyNow") === "true";
  const buyNowSareeId = searchParams.get("sareeId");
  const buyNowVariantId = searchParams.get("variantId");
  const buyNowQuantity = Math.max(1, parseInt(searchParams.get("quantity") || "1", 10));

  // Single saree state for "Buy Now"
  const [buyNowSaree, setBuyNowSaree] = useState<Saree | null>(null);
  const [buyNowVariant, setBuyNowVariant] = useState<SareeVariant | null>(null);
  const [loadingBuyNow, setLoadingBuyNow] = useState<boolean>(() => Boolean(isBuyNow && buyNowSareeId));

  // Delivery rules state
  const [deliveryRules, setDeliveryRules] = useState<DeliveryRule[]>(DEFAULT_DELIVERY_RULES);

  // Customer Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState<string>("Home");
  const [addressChoiceMode, setAddressChoiceMode] = useState<"saved" | "current_location" | "manual">("manual");
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [saveAsDefaultOnOrder, setSaveAsDefaultOnOrder] = useState(false);
  const [isNewAddressModalOpen, setIsNewAddressModalOpen] = useState(false);

  // Customer Details Form State
  const [fullName, setFullName] = useState(customerName || "");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState(customerEmail || "");
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Armoor");
  const [district, setDistrict] = useState("Nizamabad");
  const [state, setState] = useState("Telangana");
  const [pincode, setPincode] = useState("503224");

  // Geolocation state
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [detectedLocationName, setDetectedLocationName] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState<string | null>(null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi_phonepe");

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Form submission state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Helper to apply a selected address to checkout fields
  const applySelectedAddress = useCallback((addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    setSelectedAddressLabel(addr.addressLabel || "Home");
    if (addr.customerName) setFullName(addr.customerName);
    if (addr.phone) setMobile(addr.phone);
    setHouseNo(addr.houseNo);
    setStreet(addr.street);
    setLandmark(addr.landmark || "");
    setCity(addr.city);
    setDistrict(addr.district);
    setState(addr.state);
    setPincode(addr.pincode);

    if (
      addr.latitude !== null &&
      addr.latitude !== undefined &&
      addr.longitude !== null &&
      addr.longitude !== undefined
    ) {
      setCoords({ latitude: addr.latitude, longitude: addr.longitude });
      setDetectedLocationName(addr.formattedAddress || `${addr.city}, ${addr.district}`);
    } else {
      setCoords(null);
      setDetectedLocationName(null);
    }
  }, []);

  // Load customer's saved addresses if logged in
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    fetchCustomerAddresses(user.id)
      .then((addresses) => {
        if (!isMounted) return;
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
          applySelectedAddress(defaultAddr);
          setAddressChoiceMode("saved");
          setIsChangingAddress(false);
        } else {
          setAddressChoiceMode("manual");
        }
      })
      .catch((err) => {
        console.error("Error loading saved addresses:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, applySelectedAddress]);

  // Load delivery rules from Supabase
  useEffect(() => {
    let mounted = true;
    fetchDeliveryRulesFromDb().then((rules) => {
      if (mounted && rules && rules.length > 0) {
        setDeliveryRules(rules);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Load single saree for "Buy Now" flow
  useEffect(() => {
    if (!isBuyNow || !buyNowSareeId) {
      return;
    }

    let mounted = true;
    async function loadSaree() {
      try {
        let s = await fetchSareeByIdFromDb(buyNowSareeId!);
        if (!s) {
          s = getSareeById(buyNowSareeId!) || null;
        }
        if (mounted && s) {
          setBuyNowSaree(s);
          if (buyNowVariantId && s.variants) {
            const v = s.variants.find((item) => item.id === buyNowVariantId);
            if (v) setBuyNowVariant(v);
          }
        }
      } catch (err) {
        console.error("Error loading buy-now saree:", err);
      } finally {
        if (mounted) setLoadingBuyNow(false);
      }
    }

    loadSaree();
    return () => {
      mounted = false;
    };
  }, [isBuyNow, buyNowSareeId, buyNowVariantId]);

  // Determine active checkout items
  const checkoutItems = useMemo<CartItem[]>(() => {
    if (isBuyNow && buyNowSaree) {
      const price = buyNowVariant ? buyNowVariant.price : buyNowSaree.price;
      const image =
        buyNowVariant && buyNowVariant.imageUrls && buyNowVariant.imageUrls.length > 0
          ? buyNowVariant.imageUrls[0]
          : buyNowSaree.image;
      return [
        {
          saree: buyNowSaree,
          quantity: buyNowQuantity,
          variantId: buyNowVariant?.id,
          selectedColor: buyNowVariant?.colorName || buyNowSaree.color,
          selectedColorCode: buyNowVariant?.colorCode,
          selectedPrice: price,
          selectedImage: image,
          maxStock: buyNowVariant?.stockQuantity ?? buyNowSaree.stockQuantity,
        },
      ];
    }
    return cartItems;
  }, [isBuyNow, buyNowSaree, buyNowVariant, buyNowQuantity, cartItems]);

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      const p =
        item.selectedPrice !== undefined && typeof item.selectedPrice === "number"
          ? item.selectedPrice
          : typeof item.saree.price === "number"
          ? item.saree.price
          : 0;
      return sum + p * item.quantity;
    }, 0);
  }, [checkoutItems]);

  // Coupon discount calculation
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (subtotal < appliedCoupon.minCartValue) return 0;

    if (appliedCoupon.discountType === "percentage") {
      let calc = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      if (
        appliedCoupon.maxDiscountAmount !== null &&
        appliedCoupon.maxDiscountAmount !== undefined &&
        appliedCoupon.maxDiscountAmount > 0
      ) {
        calc = Math.min(calc, appliedCoupon.maxDiscountAmount);
      }
      return calc;
    } else {
      return Math.min(appliedCoupon.discountValue, subtotal);
    }
  }, [appliedCoupon, subtotal]);

  // Real-time Distance & Delivery Calculation
  const deliveryEvaluation = useMemo(() => {
    let distanceKm: number;
    if (coords) {
      distanceKm = calculateHaversineDistanceKm(
        SHOP_CONFIG.showroomLocation.latitude,
        SHOP_CONFIG.showroomLocation.longitude,
        coords.latitude,
        coords.longitude
      );
    } else {
      distanceKm = estimateDistanceKmFromPincode(pincode);
    }

    const evaluation = evaluateDeliveryForDistance(distanceKm, deliveryRules);
    const dateEstimate = calculateInitialDeliveryDate(evaluation.estimatedDays);

    return {
      distanceKm,
      charge: evaluation.charge,
      estimatedDays: evaluation.estimatedDays,
      ruleName: evaluation.ruleName,
      expectedDeliveryDate: dateEstimate.formattedDate,
      relativeDate: dateEstimate.relativeLabel,
      isGpsBased: Boolean(coords),
    };
  }, [coords, pincode, deliveryRules]);

  // Final grand total
  const grandTotal = Math.max(0, subtotal + deliveryEvaluation.charge - discountAmount);

  // Geolocation Handler using high accuracy GPS and reverse geocoding
  const handleUseLocation = async () => {
    setGeoError(null);
    setIsLocating(true);

    try {
      const detectedCoords = await getCurrentBrowserCoordinates({ timeoutMs: 15000 });
      setCoords(detectedCoords);

      const geoResult = await reverseGeocodeCoordinates(
        detectedCoords.latitude,
        detectedCoords.longitude
      );

      if (geoResult.houseNo) setHouseNo(geoResult.houseNo);
      if (geoResult.street) setStreet(geoResult.street);
      if (geoResult.area) setStreet((prev) => prev || geoResult.area || "");
      if (geoResult.landmark) setLandmark(geoResult.landmark);
      if (geoResult.city) setCity(geoResult.city);
      if (geoResult.district) setDistrict(geoResult.district);
      if (geoResult.state) setState(geoResult.state);
      if (geoResult.pincode) setPincode(geoResult.pincode);

      setDetectedLocationName(geoResult.formattedAddress || `${geoResult.city || "Armoor"}, ${geoResult.district || "Nizamabad"}`);
      setGeoSuccess(`Current location detected (${detectedCoords.latitude.toFixed(4)}, ${detectedCoords.longitude.toFixed(4)})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not detect location. Please enter manually.";
      setGeoError(msg);
    } finally {
      setIsLocating(false);
    }
  };

  // Coupon Application
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    const cleanCode = couponCodeInput.trim();
    if (!cleanCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const res = await validateCouponCode(cleanCode, subtotal);
      if (!res.isValid || !res.coupon) {
        setCouponError(res.errorMessage || "Invalid or expired coupon code.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(res.coupon);
        setCouponSuccess(
          `Coupon "${res.coupon.code}" applied! You save ₹${(res.discountAmount || 0).toLocaleString("en-IN")}.`
        );
        setCouponCodeInput("");
      }
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) errors.fullName = "Please enter your full name.";
    const cleanPhone = mobile.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.mobile = "Please enter a valid 10-digit mobile number.";
    }
    if (!houseNo.trim()) errors.houseNo = "Please enter house / flat / door number.";
    if (!street.trim()) errors.street = "Please enter street or area name.";
    if (!city.trim()) errors.city = "Please enter city / town.";
    if (!district.trim()) errors.district = "Please enter district.";
    if (!state.trim()) errors.state = "Please enter state.";
    const cleanPin = pincode.replace(/[^0-9]/g, "");
    if (!cleanPin || cleanPin.length !== 6) {
      errors.pincode = "Please enter a valid 6-digit Indian PIN code.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Place Order Handler
  const handlePlaceOrder = async () => {
    setOrderError(null);

    if (checkoutItems.length === 0) {
      setOrderError("Your checkout bag is empty. Please add sarees to proceed.");
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 150, behavior: "smooth" });
      return;
    }

    setIsPlacingOrder(true);

    try {
      // If user is authenticated and checked "Save as default address", save in customer_addresses
      if (user?.id && saveAsDefaultOnOrder) {
        saveCustomerAddress({
          userId: user.id,
          addressLabel: "Home",
          customerName: fullName.trim(),
          phone: mobile.trim(),
          houseNo: houseNo.trim(),
          street: street.trim(),
          landmark: landmark.trim() || null,
          city: city.trim(),
          district: district.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null,
          formattedAddress: detectedLocationName || null,
          isDefault: true,
        }).catch((e) => console.warn("Background default address save warning:", e));
      }

      const orderPayloadItems = checkoutItems.map((item) => {
        const unitP =
          item.selectedPrice !== undefined && typeof item.selectedPrice === "number"
            ? item.selectedPrice
            : typeof item.saree.price === "number"
            ? item.saree.price
            : 0;

        return {
          sareeId: item.saree.id || null,
          variantId: item.variantId || null,
          sareeNameSnapshot: item.saree.name,
          skuSnapshot: item.saree.sku,
          selectedColour: item.selectedColor || item.saree.color || null,
          quantity: item.quantity,
          unitPrice: unitP,
          totalPrice: unitP * item.quantity,
          imageUrlSnapshot: item.selectedImage || item.saree.image,
          categoryLabelSnapshot: item.saree.categoryLabel,
        };
      });

      const { order, error } = await createOrderInDb({
        userId: user?.id || null,
        customerName: fullName,
        customerPhone: mobile,
        customerEmail: email || null,
        houseNo,
        street,
        landmark: landmark || null,
        city,
        district,
        state,
        pincode,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        deliveryDistanceKm: deliveryEvaluation.distanceKm,
        subtotal,
        deliveryCharge: deliveryEvaluation.charge,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: discountAmount,
        totalAmount: grandTotal,
        paymentMethod,
        paymentStatus: "pending",
        expectedDeliveryDate: deliveryEvaluation.expectedDeliveryDate,
        items: orderPayloadItems,
      });

      if (error || !order) {
        setOrderError(error || "Could not place order. Please check your stock or connection.");
        setIsPlacingOrder(false);
        return;
      }

      // If order was from Cart, clear cart
      if (!isBuyNow) {
        clearCart();
      }

      // Open WhatsApp order notification in safe new tab
      const whatsappUrl = getOrderWhatsAppUrl(order);
      try {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      } catch (e) {
        console.warn("Could not automatically open WhatsApp window:", e);
      }

      // Redirect to Confirmation Page
      router.push(`/checkout/confirmation?orderId=${order.id}`);
    } catch (err) {
      console.error("Exception during order placement:", err);
      setOrderError("An unexpected error occurred. Please try again or reach out on WhatsApp.");
      setIsPlacingOrder(false);
    }
  };

  if (!isLoaded || loadingBuyNow) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-24 bg-[#FDFBF7]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif-luxury text-sm text-[#6E121E]">Preparing Secure Checkout...</p>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FAF0DC] flex items-center justify-center mx-auto mb-4 text-[#6E121E]">
          <ShoppingBag className="w-8 h-8 text-[#C5A059]" />
        </div>
        <h2 className="font-serif-luxury text-2xl font-bold text-[#1E1715] mb-2">
          Your Checkout Bag is Empty
        </h2>
        <p className="text-xs text-[#8C7A6B] max-w-md mx-auto mb-6">
          You haven&apos;t selected any sarees yet. Explore our handcrafted weaves from Armoor.
        </p>
        <Link
          href="/sarees"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm"
        >
          <span>Explore Sarees</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 bg-gradient-to-b from-[#FDFBF7] to-[#FAF7F2]">
      {/* New Address Modal */}
      {user?.id && (
        <AddressSetupModal
          isOpen={isNewAddressModalOpen}
          userId={user.id}
          customerName={fullName || customerName}
          customerPhone={mobile}
          onAddressSaved={(newAddr) => {
            setSavedAddresses((prev) => [newAddr, ...prev.filter((a) => a.id !== newAddr.id)]);
            applySelectedAddress(newAddr);
            setAddressChoiceMode("saved");
            setIsChangingAddress(false);
          }}
          onClose={() => setIsNewAddressModalOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={isBuyNow && buyNowSaree ? `/sarees/${buyNowSaree.id}` : "/cart"}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#6E121E] hover:text-[#590D18] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isBuyNow ? "Back to Saree" : "Back to Cart"}</span>
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-[#1E3F34] bg-[#E8F3EE] px-3 py-1 rounded-full font-medium">
            <Lock className="w-3.5 h-3.5 text-[#1E3F34]" />
            <span>Secure SSL Checkout</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-[#C5A059] block mb-1">
            SaiSrujana Boutique • Direct Delivery
          </span>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E1715]">
            Checkout &amp; Order Details
          </h1>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Delivery Address, Google Maps & Payment (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Customer & Delivery Address Card */}
            <div className="bg-white rounded-2xl border border-[#E8E0D2] p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#6E121E] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <h2 className="font-serif-luxury text-lg font-bold text-[#1E1715]">
                    Delivery Address
                  </h2>
                </div>

                {user?.id && savedAddresses.length > 0 && !isChangingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsChangingAddress(true)}
                    className="text-xs font-bold text-[#6E121E] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Change Address</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {!user?.id && <span className="text-[11px] text-[#8C7A6B]">* Required fields</span>}
              </div>

              {/* LOGGED IN & HAS SAVED ADDRESS (Summary Card View) */}
              {user?.id && savedAddresses.length > 0 && !isChangingAddress ? (
                <div className="space-y-4">
                  <div className="bg-[#FAF7F2] rounded-2xl border border-[#C5A059]/40 p-4 sm:p-5 relative">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6E121E] text-white text-[11px] font-bold">
                          <Home className="w-3 h-3" />
                          <span>{selectedAddressLabel}</span>
                        </span>
                        {savedAddresses.find((a) => a.id === selectedAddressId)?.isDefault && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EAD096] text-[#6E121E]">
                            Default
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsChangingAddress(true)}
                        className="text-xs font-semibold text-[#8C7A6B] hover:text-[#6E121E] transition underline"
                      >
                        Change
                      </button>
                    </div>

                    {/* Recipient Details */}
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#1E1715]">
                        {fullName || "Patron"}{" "}
                        <span className="text-xs font-normal text-[#5C4D44]">• {mobile}</span>
                      </p>
                      <p className="text-xs text-[#5C4D44] leading-relaxed">
                        {houseNo}, {street}
                        {landmark ? `, Near ${landmark}` : ""}
                        <br />
                        {city}, {district}, {state} - <span className="font-semibold">{pincode}</span>
                      </p>
                    </div>

                    {/* Coordinates & Google Maps Pin */}
                    {coords && (
                      <div className="mt-3 pt-3 border-t border-[#E8E0D2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#1E3F34]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#6E121E]" />
                          <span>
                            GPS Attached ({coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}) • {deliveryEvaluation.distanceKm} km from Armoor
                          </span>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#6E121E] hover:underline"
                        >
                          View Pin on Map ↗
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Option to change or enter different for this order */}
                  <div className="flex items-center justify-between pt-1 text-xs text-[#8C7A6B]">
                    <span>Delivering to this address for your order.</span>
                    <button
                      type="button"
                      onClick={() => setIsChangingAddress(true)}
                      className="font-bold text-[#6E121E] hover:underline"
                    >
                      Pick Another / Use GPS
                    </button>
                  </div>
                </div>
              ) : (
                /* ADDRESS SELECTION / EDIT / MANUAL FORM */
                <div className="space-y-5">
                  {/* If user has saved addresses, show Address Mode Switcher Tabs */}
                  {user?.id && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#6E121E]">
                          Choose Address Method
                        </label>
                        {savedAddresses.length > 0 && isChangingAddress && (
                          <button
                            type="button"
                            onClick={() => setIsChangingAddress(false)}
                            className="text-xs font-semibold text-[#8C7A6B] hover:text-[#6E121E]"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAddressChoiceMode("saved");
                            if (savedAddresses.length > 0) {
                              applySelectedAddress(savedAddresses[0]);
                            }
                          }}
                          className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition ${
                            addressChoiceMode === "saved"
                              ? "bg-[#6E121E] text-white border-[#6E121E] shadow-xs"
                              : "bg-[#FAF7F2] text-[#5C4D44] border-[#E8E0D2] hover:bg-white"
                          }`}
                        >
                          🏠 Saved
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddressChoiceMode("current_location");
                            handleUseLocation();
                          }}
                          className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition ${
                            addressChoiceMode === "current_location"
                              ? "bg-[#6E121E] text-white border-[#6E121E] shadow-xs"
                              : "bg-[#FAF7F2] text-[#5C4D44] border-[#E8E0D2] hover:bg-white"
                          }`}
                        >
                          📍 GPS Location
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddressChoiceMode("manual")}
                          className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition ${
                            addressChoiceMode === "manual"
                              ? "bg-[#6E121E] text-white border-[#6E121E] shadow-xs"
                              : "bg-[#FAF7F2] text-[#5C4D44] border-[#E8E0D2] hover:bg-white"
                          }`}
                        >
                          ✏️ Manual
                        </button>
                      </div>

                      {/* Saved Address Cards List */}
                      {addressChoiceMode === "saved" && savedAddresses.length > 0 && (
                        <div className="space-y-2.5 pt-2">
                          {savedAddresses.map((addr) => {
                            const isSelected = selectedAddressId === addr.id;
                            return (
                              <div
                                key={addr.id}
                                onClick={() => {
                                  applySelectedAddress(addr);
                                  setIsChangingAddress(false);
                                }}
                                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                                  isSelected
                                    ? "bg-[#FAF0DC]/60 border-[#C5A059] shadow-xs"
                                    : "bg-white border-[#E8E0D2] hover:bg-[#FAF7F2]"
                                }`}
                              >
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#6E121E] flex items-center gap-1">
                                      <Home className="w-3 h-3" />
                                      {addr.addressLabel || "Home"}
                                    </span>
                                    {addr.isDefault && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EAD096] text-[#6E121E]">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[#5C4D44]">
                                    {addr.houseNo}, {addr.street}, {addr.city}, {addr.district} - {addr.pincode}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                                    isSelected
                                      ? "bg-[#6E121E] text-white"
                                      : "bg-[#FAF7F2] border border-[#D5C9B8] text-[#6E121E] hover:bg-[#6E121E] hover:text-white"
                                  }`}
                                >
                                  {isSelected ? "Selected" : "Use This"}
                                </button>
                              </div>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => setIsNewAddressModalOpen(true)}
                            className="w-full py-2.5 border border-dashed border-[#C5A059] rounded-xl text-xs font-bold text-[#6E121E] hover:bg-[#FAF0DC]/50 transition flex items-center justify-center gap-1.5"
                          >
                            <span>+ Add Another Address</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Fields: Shown for Manual, Current Location, or Guest */}
                  {(addressChoiceMode !== "saved" || !user?.id || savedAddresses.length === 0) && (
                    <div className="space-y-4">
                      {/* GPS Banner for Current Location Mode */}
                      {addressChoiceMode === "current_location" && (
                        <div className="bg-[#FAF0DC]/70 rounded-xl p-3.5 border border-[#C5A059]/40 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-[#6E121E] shrink-0" />
                            <div>
                              <p className="font-bold text-[#6E121E]">Current GPS Location</p>
                              <p className="text-[11px] text-[#5C4D44]">
                                {coords
                                  ? `Detected: (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}) • ${deliveryEvaluation.distanceKm} km from Armoor`
                                  : "Click detect to capture GPS for this order"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleUseLocation}
                            disabled={isLocating}
                            className="px-3 py-1.5 bg-[#6E121E] text-white font-semibold rounded-lg hover:bg-[#8B1A2B] transition disabled:opacity-50 text-xs shrink-0"
                          >
                            {isLocating ? "Detecting..." : coords ? "Re-detect" : "Detect GPS"}
                          </button>
                        </div>
                      )}

                      {/* Input Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            Full Name *
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Enter customer full name"
                              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#6E121E] ${
                                formErrors.fullName ? "border-red-500 bg-red-50/20" : "border-[#E8E0D2]"
                              }`}
                            />
                          </div>
                          {formErrors.fullName && (
                            <p className="text-[11px] text-red-600 mt-1">{formErrors.fullName}</p>
                          )}
                        </div>

                        {/* Mobile Number */}
                        <div>
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            Mobile Number (10 digits) *
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              value={mobile}
                              onChange={(e) => setMobile(e.target.value)}
                              placeholder="e.g. 9948534351"
                              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#6E121E] ${
                                formErrors.mobile ? "border-red-500 bg-red-50/20" : "border-[#E8E0D2]"
                              }`}
                            />
                          </div>
                          {formErrors.mobile && (
                            <p className="text-[11px] text-red-600 mt-1">{formErrors.mobile}</p>
                          )}
                        </div>

                        {/* Email (optional) */}
                        <div>
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            Email Address (Optional)
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="For digital order receipt"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E8E0D2] text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#6E121E]"
                            />
                          </div>
                        </div>

                        {/* House / Flat / Door Number */}
                        <div>
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            House / Flat / Door No. *
                          </label>
                          <div className="relative">
                            <Home className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={houseNo}
                              onChange={(e) => setHouseNo(e.target.value)}
                              placeholder="e.g. H.No 4-12/A, Flat 201"
                              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#6E121E] ${
                                formErrors.houseNo ? "border-red-500 bg-red-50/20" : "border-[#E8E0D2]"
                              }`}
                            />
                          </div>
                          {formErrors.houseNo && (
                            <p className="text-[11px] text-red-600 mt-1">{formErrors.houseNo}</p>
                          )}
                        </div>

                        {/* Street / Area */}
                        <div>
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            Street / Colony / Area *
                          </label>
                          <input
                            type="text"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            placeholder="e.g. Gandhi Nagar, Main Road"
                            className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#6E121E] ${
                              formErrors.street ? "border-red-500 bg-red-50/20" : "border-[#E8E0D2]"
                            }`}
                          />
                          {formErrors.street && (
                            <p className="text-[11px] text-red-600 mt-1">{formErrors.street}</p>
                          )}
                        </div>

                        {/* Landmark */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            Landmark (Optional)
                          </label>
                          <input
                            type="text"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            placeholder="e.g. Near Shiva Temple / Opp. Bus Stand"
                            className="w-full px-3 py-2.5 rounded-xl border border-[#E8E0D2] text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#6E121E]"
                          />
                        </div>

                        {/* City & District */}
                        <div>
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            City / Town *
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#E8E0D2] text-xs sm:text-sm text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-[#6E121E]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            District *
                          </label>
                          <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#E8E0D2] text-xs sm:text-sm text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-[#6E121E]"
                          />
                        </div>

                        {/* State & Pincode */}
                        <div>
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#E8E0D2] text-xs sm:text-sm text-[#2C2420] focus:outline-none focus:ring-1 focus:ring-[#6E121E]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#2C2420] mb-1">
                            Pincode (6 digits) *
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            placeholder="e.g. 503224"
                            className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#6E121E] ${
                              formErrors.pincode ? "border-red-500 bg-red-50/20" : "border-[#E8E0D2]"
                            }`}
                          />
                          {formErrors.pincode && (
                            <p className="text-[11px] text-red-600 mt-1">{formErrors.pincode}</p>
                          )}
                        </div>
                      </div>

                      {/* Guest GPS Button */}
                      {!user?.id && (
                        <div className="pt-3 border-t border-[#E8E0D2]/60">
                          <div className="bg-[#FAF7F2] rounded-xl p-3.5 border border-[#C5A059]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E1715]">
                                <Navigation className="w-3.5 h-3.5 text-[#6E121E]" />
                                <span>Use Google Maps Location</span>
                              </div>
                              {coords ? (
                                <div className="space-y-0.5">
                                  {detectedLocationName && (
                                    <p className="text-xs text-[#1E3F34] font-medium flex items-center gap-1">
                                      <span>📍 Detected Area:</span>
                                      <span className="font-semibold">{detectedLocationName}</span>
                                    </p>
                                  )}
                                  <p className="text-[11px] text-[#8C7A6B]">
                                    GPS: ({coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}) • {deliveryEvaluation.distanceKm} km from Armoor showroom
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[11px] text-[#8C7A6B]">
                                  Pinpoint your delivery location for accurate courier & distance calculation
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={handleUseLocation}
                              disabled={isLocating}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#C5A059] hover:bg-[#FAF0DC] text-[#6E121E] text-xs font-semibold transition cursor-pointer flex-shrink-0 shadow-2xs"
                            >
                              {isLocating ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-[#6E121E] border-t-transparent rounded-full animate-spin" />
                                  <span>Detecting GPS...</span>
                                </>
                              ) : coords ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 text-[#6E121E]" />
                                  <span>Re-detect Location</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-3.5 h-3.5 text-[#6E121E]" />
                                  <span>Detect Location</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Optional Save as Default for logged-in users when changing/manual */}
                      {user?.id && (
                        <div className="pt-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="saveAsDefaultCheckout"
                            checked={saveAsDefaultOnOrder}
                            onChange={(e) => setSaveAsDefaultOnOrder(e.target.checked)}
                            className="rounded border-[#C5A059] text-[#6E121E] focus:ring-[#6E121E]"
                          />
                          <label
                            htmlFor="saveAsDefaultCheckout"
                            className="text-xs text-[#5C4D44] cursor-pointer"
                          >
                            Save this address as my default delivery address
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  {geoSuccess && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <p>{geoSuccess}</p>
                    </div>
                  )}
                  {geoError && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between gap-2">
                      <p>{geoError}</p>
                      <button
                        type="button"
                        onClick={handleUseLocation}
                        className="underline font-semibold shrink-0 cursor-pointer hover:text-amber-950"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Payment Method Card */}
            <div className="bg-white rounded-2xl border border-[#E8E0D2] p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8E0D2]">
                <div className="w-7 h-7 rounded-full bg-[#6E121E] text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <h2 className="font-serif-luxury text-lg font-bold text-[#1E1715]">
                  Select Payment Method
                </h2>
              </div>

              <div className="space-y-3">
                {/* Option A: PhonePe / UPI */}
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === "upi_phonepe"
                      ? "border-[#6E121E] bg-[#FAF6EE] shadow-xs"
                      : "border-[#E8E0D2] hover:border-[#C5A059] bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="upi_phonepe"
                    checked={paymentMethod === "upi_phonepe"}
                    onChange={() => setPaymentMethod("upi_phonepe")}
                    className="mt-1 text-[#6E121E] focus:ring-[#6E121E]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#6E121E]" />
                      <span className="text-sm font-bold text-[#1E1715]">PhonePe / UPI Payment</span>
                      <span className="text-[10px] uppercase font-bold bg-[#E8F3EE] text-[#1E3F34] px-2 py-0.5 rounded">
                        Fast &amp; Verified
                      </span>
                    </div>
                    <p className="text-xs text-[#5A4E46]">
                      Pay directly using PhonePe, Google Pay, Paytm, or BHIM UPI to SaiSrujana boutique. Verification happens instantly with Gangadhar.
                    </p>
                    {paymentMethod === "upi_phonepe" && (
                      <div className="mt-2.5 p-3 bg-white rounded-lg border border-[#C5A059]/40 text-xs text-[#6E121E] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <QrCode className="w-4 h-4 text-[#C5A059]" />
                          <span>PhonePe / UPI Number: {SHOP_CONFIG.phoneFormatted}</span>
                        </div>
                        <p className="text-[11px] text-[#8C7A6B]">
                          Upon placing the order, you will receive payment confirmation and saree video updates directly on WhatsApp.
                        </p>
                      </div>
                    )}
                  </div>
                </label>

                {/* Option B: Cash on Delivery (COD) */}
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === "cod"
                      ? "border-[#6E121E] bg-[#FAF6EE] shadow-xs"
                      : "border-[#E8E0D2] hover:border-[#C5A059] bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1 text-[#6E121E] focus:ring-[#6E121E]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#1E3F34]" />
                      <span className="text-sm font-bold text-[#1E1715]">Cash on Delivery (COD)</span>
                    </div>
                    <p className="text-xs text-[#5A4E46]">
                      Pay in cash to the delivery partner when your saree parcel arrives at your doorstep.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary, Coupons & Grand Total (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Order Items Summary Card */}
            <div className="bg-white rounded-2xl border border-[#E8E0D2] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
                <h3 className="font-serif-luxury text-base font-bold text-[#1E1715]">
                  Order Items ({checkoutItems.reduce((acc, it) => acc + it.quantity, 0)})
                </h3>
                {isBuyNow ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-[#C5A059]/20 text-[#6E121E] px-2 py-0.5 rounded">
                    Buy Now Direct
                  </span>
                ) : (
                  <Link
                    href="/cart"
                    className="text-xs font-semibold text-[#6E121E] hover:underline"
                  >
                    Edit Cart
                  </Link>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#E8E0D2]/60 max-h-72 overflow-y-auto pr-1">
                {checkoutItems.map((item, idx) => {
                  const unitPrice =
                    item.selectedPrice !== undefined && typeof item.selectedPrice === "number"
                      ? item.selectedPrice
                      : typeof item.saree.price === "number"
                      ? item.saree.price
                      : 0;

                  return (
                    <div key={idx} className="py-3 flex items-center gap-3">
                      <div className="relative w-14 h-18 rounded-lg overflow-hidden border border-[#E8E0D2] flex-shrink-0 bg-stone-100">
                        <Image
                          src={item.selectedImage || item.saree.image}
                          alt={item.saree.name}
                          fill
                          className="object-cover object-top"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#1E1715] truncate">
                          {item.saree.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8C7A6B] mt-0.5">
                          <span>SKU: {item.saree.sku}</span>
                          {item.selectedColor && (
                            <>
                              <span>•</span>
                              <span>{item.selectedColor}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs">
                          <span className="text-[#8C7A6B]">Qty: {item.quantity}</span>
                          <span className="font-bold text-[#6E121E]">
                            {formatCurrency(unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-3 border-t border-[#E8E0D2]">
                <span className="block text-xs font-semibold text-[#2C2420] mb-2 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Have a Coupon Code?</span>
                </span>

                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g. FESTIVE10)"
                      className="flex-1 px-3 py-2 border border-[#E8E0D2] rounded-xl text-xs uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-[#6E121E]"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon}
                      className="px-4 py-2 bg-[#6E121E] hover:bg-[#590D18] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      {isApplyingCoupon ? "Applying..." : "Apply"}
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#C5A059]/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <div>
                        <span className="text-xs font-bold text-[#6E121E] block">
                          Coupon &ldquo;{appliedCoupon.code}&rdquo; Applied
                        </span>
                        <span className="text-[10px] text-[#1E3F34] font-semibold">
                          You save -{formatCurrency(discountAmount)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponError && <p className="text-[11px] text-red-600 mt-1.5">{couponError}</p>}
                {couponSuccess && !couponError && (
                  <p className="text-[11px] text-emerald-700 mt-1.5">{couponSuccess}</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-[#E8E0D2] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#5A4E46]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1E1715]">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-[#5A4E46]">
                  <div className="space-y-0.5">
                    <span className="block font-medium">Delivery Charge</span>
                    <span className="text-[10px] text-[#8C7A6B]">
                      {deliveryEvaluation.ruleName} ({deliveryEvaluation.relativeDate})
                    </span>
                  </div>
                  <span className="font-semibold text-[#1E1715]">
                    {formatCurrency(deliveryEvaluation.charge)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#E8E0D2] flex items-baseline justify-between text-sm sm:text-base font-bold text-[#1E1715]">
                  <span>Grand Total</span>
                  <span className="text-[#6E121E]">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Delivery Estimation Box */}
              <div className="p-3 rounded-xl bg-[#FAF0DC]/60 border border-[#C5A059]/40 text-xs text-[#6E121E] flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Expected Delivery: {deliveryEvaluation.expectedDeliveryDate}
                  </span>
                  <span className="text-[11px] text-[#8C7A6B]">
                    Dispatches from our Armoor boutique with live tracking on WhatsApp.
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {orderError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <span>{orderError}</span>
                </div>
              )}

              {/* Place Order CTA Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full py-4 px-6 rounded-xl bg-[#6E121E] hover:bg-[#590D18] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Placing Your Saree Order...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#A7F3D0]" />
                    <span>Place Order • {formatCurrency(grandTotal)}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-[#8C7A6B]">
                By placing this order, you will receive direct WhatsApp updates and assistance from Gangadhar at SaiSrujana, Armoor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
