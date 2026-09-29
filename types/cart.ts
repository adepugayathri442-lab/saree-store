import { Saree } from "./saree";

export interface CartItem {
  saree: Saree;
  quantity: number;
  variantId?: string;
  selectedColor?: string;
  selectedColorCode?: string | null;
  selectedPrice?: number | string;
  selectedImage?: string;
  maxStock?: number;
}

export interface CustomerOrderDetails {
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
}
