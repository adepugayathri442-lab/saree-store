/**
 * Types for SaiSrujana Address & Location Management System
 */

export interface CustomerAddress {
  id: string;
  userId: string;
  addressLabel: string; // 'Home' | 'Work' | 'Other'
  customerName?: string | null;
  phone?: string | null;
  houseNo: string;
  street: string;
  area?: string | null;
  landmark?: string | null;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  formattedAddress?: string | null;
  googleMapsUrl?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAddressInput {
  id?: string;
  userId: string;
  addressLabel?: string;
  customerName?: string | null;
  phone?: string | null;
  houseNo: string;
  street: string;
  area?: string | null;
  landmark?: string | null;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  formattedAddress?: string | null;
  googleMapsUrl?: string | null;
  isDefault?: boolean;
}

export interface ReverseGeocodeResult {
  houseNo?: string;
  street?: string;
  area?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
}
