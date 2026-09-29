"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  Check,
  AlertCircle,
  X,
  Home,
  Briefcase,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { CustomerAddress } from "@/types/address";
import { saveCustomerAddress } from "@/lib/supabase/addresses";
import { getCurrentBrowserCoordinates, reverseGeocodeCoordinates } from "@/lib/geocoding";

interface AddressSetupModalProps {
  isOpen: boolean;
  userId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  onAddressSaved: (address: CustomerAddress) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function AddressSetupModal({
  isOpen,
  userId,
  customerName = "",
  customerPhone = "",
  onAddressSaved,
  onClose,
  title = "Set Your Delivery Address",
  subtitle = "Save your preferred delivery location for swift saree dispatch and exact distance calculation.",
}: AddressSetupModalProps) {
  const [addressLabel, setAddressLabel] = useState<string>("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [recipientName, setRecipientName] = useState(customerName || "");
  const [phone, setPhone] = useState(customerPhone || "");
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Armoor");
  const [district, setDistrict] = useState("Nizamabad");
  const [state, setState] = useState("Telangana");
  const [pincode, setPincode] = useState("503224");

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState<string | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseCurrentLocation = async () => {
    setGeoError(null);
    setGeoSuccess(null);
    setIsLocating(true);

    try {
      const detectedCoords = await getCurrentBrowserCoordinates({ timeoutMs: 15000 });
      setCoords(detectedCoords);

      // Reverse geocode
      const geoResult = await reverseGeocodeCoordinates(
        detectedCoords.latitude,
        detectedCoords.longitude
      );

      if (geoResult.houseNo) setHouseNo(geoResult.houseNo);
      if (geoResult.street) setStreet(geoResult.street);
      if (geoResult.area) setArea(geoResult.area);
      if (geoResult.landmark) setLandmark(geoResult.landmark);
      if (geoResult.city) setCity(geoResult.city);
      if (geoResult.district) setDistrict(geoResult.district);
      if (geoResult.state) setState(geoResult.state);
      if (geoResult.pincode) setPincode(geoResult.pincode);

      setFormattedAddress(geoResult.formattedAddress || null);
      setGoogleMapsUrl(geoResult.googleMapsUrl);

      setGeoSuccess(
        `Location detected (${detectedCoords.latitude.toFixed(4)}, ${detectedCoords.longitude.toFixed(4)}). Please review and complete your address below.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not detect location. Please enter manually.";
      setGeoError(msg);
    } finally {
      setIsLocating(false);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!houseNo.trim()) errors.houseNo = "Please enter House / Door / Flat No.";
    if (!street.trim()) errors.street = "Please enter Street or Road.";
    if (!city.trim()) errors.city = "Please enter City or Town.";
    if (!district.trim()) errors.district = "Please enter District.";
    if (!state.trim()) errors.state = "Please enter State.";

    const cleanPin = pincode.replace(/[^0-9]/g, "");
    if (!cleanPin || cleanPin.length !== 6) {
      errors.pincode = "Please enter a valid 6-digit PIN code.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!validate()) return;
    if (!userId) {
      setSaveError("User session expired. Please sign in again.");
      return;
    }

    setIsSaving(true);

    const finalLabel =
      addressLabel === "Other" && customLabel.trim() ? customLabel.trim() : addressLabel;

    const mapsLink =
      googleMapsUrl ||
      (coords
        ? `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
        : null);

    const { address, error } = await saveCustomerAddress({
      userId,
      addressLabel: finalLabel,
      customerName: recipientName.trim() || customerName || null,
      phone: phone.trim() || customerPhone || null,
      houseNo: houseNo.trim(),
      street: street.trim(),
      area: area.trim() || null,
      landmark: landmark.trim() || null,
      city: city.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      latitude: coords?.latitude || null,
      longitude: coords?.longitude || null,
      formattedAddress: formattedAddress || null,
      googleMapsUrl: mapsLink,
      isDefault: true,
    });

    setIsSaving(false);

    if (error || !address) {
      setSaveError(error || "Failed to save address. Please try again.");
    } else {
      onAddressSaved(address);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8E0D2] shadow-2xl max-w-xl w-full my-8 relative overflow-hidden text-[#2C2420] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Ornamental Header */}
        <div className="h-1.5 bg-gradient-to-r from-[#6E121E] via-[#C5A059] to-[#6E121E]" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-[#E8E0D2]/70 relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-6 right-6 text-[#8C7A6B] hover:text-[#6E121E] transition p-1.5 rounded-full hover:bg-[#EFE9DF]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-[#C5A059] mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              SaiSrujana Doorstep Delivery
            </span>
          </div>

          <h2 className="font-serif-luxury text-2xl font-bold text-[#1E1715]">{title}</h2>
          <p className="text-xs sm:text-sm text-[#8C7A6B] mt-1">{subtitle}</p>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick GPS Location Button */}
          <div className="bg-gradient-to-br from-[#FAF0DC]/70 to-[#F5E6CC]/40 rounded-2xl p-4 border border-[#C5A059]/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#6E121E] uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> Fast Setup with GPS
                </p>
                <p className="text-xs text-[#5C4D44] mt-0.5">
                  Autofill your address and exact distance from Armoor showroom
                </p>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6E121E] to-[#8B1A2B] text-white text-xs font-semibold shadow hover:opacity-95 transition disabled:opacity-50 whitespace-nowrap"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-[#EAD096]" />
                    <span>Use Current Location</span>
                  </>
                )}
              </button>
            </div>

            {geoSuccess && (
              <div className="mt-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{geoSuccess}</span>
              </div>
            )}

            {geoError && (
              <div className="mt-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{geoError}</span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="ml-2 font-bold underline hover:text-[#6E121E]"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Address Label Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E121E] mb-2">
              Address Type / Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Home", icon: Home },
                { label: "Work", icon: Briefcase },
                { label: "Other", icon: MapPin },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = addressLabel === item.label;
                return (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => setAddressLabel(item.label)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                      isSelected
                        ? "bg-[#6E121E] text-white border-[#6E121E] shadow-sm"
                        : "bg-white text-[#5C4D44] border-[#E8E0D2] hover:bg-[#FAF0DC]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            {addressLabel === "Other" && (
              <input
                type="text"
                placeholder="e.g. Parents' House, Boutique, Studio"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="mt-2 w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#E8E0D2] focus:border-[#C5A059] focus:outline-none"
              />
            )}
          </div>

          {/* Recipient Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#5C4D44] mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#E8E0D2] focus:border-[#C5A059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C4D44] mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#E8E0D2] focus:border-[#C5A059] focus:outline-none"
              />
            </div>
          </div>

          {/* House No & Street */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#5C4D44] mb-1">
                House / Flat / Door No <span className="text-[#6E121E]">*</span>
              </label>
              <input
                type="text"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                placeholder="e.g. 11-52 / Flat 301"
                className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white border ${
                  formErrors.houseNo ? "border-rose-500 bg-rose-50/20" : "border-[#E8E0D2]"
                } focus:border-[#C5A059] focus:outline-none`}
              />
              {formErrors.houseNo && (
                <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.houseNo}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C4D44] mb-1">
                Street / Road <span className="text-[#6E121E]">*</span>
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. Vidhya Nagar / Main Road"
                className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white border ${
                  formErrors.street ? "border-rose-500 bg-rose-50/20" : "border-[#E8E0D2]"
                } focus:border-[#C5A059] focus:outline-none`}
              />
              {formErrors.street && (
                <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.street}</p>
              )}
            </div>
          </div>

          {/* Area & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#5C4D44] mb-1">
                Area / Colony / Village
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Mamidipally"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#E8E0D2] focus:border-[#C5A059] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C4D44] mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Venkateshwara Temple"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#E8E0D2] focus:border-[#C5A059] focus:outline-none"
              />
            </div>
          </div>

          {/* City & District */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#5C4D44] mb-1">
                City / Town <span className="text-[#6E121E]">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Armoor"
                className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white border ${
                  formErrors.city ? "border-rose-500 bg-rose-50/20" : "border-[#E8E0D2]"
                } focus:border-[#C5A059] focus:outline-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C4D44] mb-1">
                District <span className="text-[#6E121E]">*</span>
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Nizamabad"
                className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white border ${
                  formErrors.district ? "border-rose-500 bg-rose-50/20" : "border-[#E8E0D2]"
                } focus:border-[#C5A059] focus:outline-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5C4D44] mb-1">
                PIN Code <span className="text-[#6E121E]">*</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="503224"
                className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white border ${
                  formErrors.pincode ? "border-rose-500 bg-rose-50/20" : "border-[#E8E0D2]"
                } focus:border-[#C5A059] focus:outline-none`}
              />
              {formErrors.pincode && (
                <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.pincode}</p>
              )}
            </div>
          </div>

          {/* State */}
          <div>
            <label className="block text-xs font-medium text-[#5C4D44] mb-1">
              State <span className="text-[#6E121E]">*</span>
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Telangana"
              className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white border ${
                formErrors.state ? "border-rose-500 bg-rose-50/20" : "border-[#E8E0D2]"
              } focus:border-[#C5A059] focus:outline-none`}
            />
          </div>

          {/* GPS Pin Badge if captured */}
          {coords && (
            <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Exact Pin Attached: ({coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)})
                </span>
              </div>
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 underline"
                >
                  <span>Verify on Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E0D2]/70">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D5C9B8] text-xs font-semibold text-[#8C7A6B] hover:text-[#1E1715] hover:bg-[#EFE9DF] transition"
            >
              Skip / Enter Later
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6E121E] via-[#8B1A2B] to-[#6E121E] text-white text-xs font-bold shadow-md hover:opacity-95 transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Address...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#EAD096]" />
                  <span>Save as Default Address</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
