"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { Saree, SareeVariant } from "@/types/saree";
import { CartItem } from "@/types/cart";

export interface AddToCartOptions {
  variant?: SareeVariant | null;
  selectedColor?: string;
  selectedColorCode?: string | null;
  selectedPrice?: number | string;
  selectedImage?: string;
  maxStock?: number;
}

export function getCartItemKey(item: { saree: { id: string }; variantId?: string | null }): string {
  return item.variantId ? `${item.saree.id}_${item.variantId}` : item.saree.id;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (saree: Saree, quantity?: number, options?: AddToCartOptions) => void;
  removeFromCart: (cartKeyOrSareeId: string) => void;
  updateQuantity: (cartKeyOrSareeId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "saisrujana_cart_v1";

// In-memory reference caching for snapshot stability in useSyncExternalStore
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = [];

function getCartSnapshot(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) || "[]";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = JSON.parse(raw);
    }
    return cachedItems;
  } catch {
    return cachedItems;
  }
}

const emptyServerCart: CartItem[] = [];
function getServerCartSnapshot(): CartItem[] {
  return emptyServerCart;
}

function subscribeCart(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener("saisrujana_cart_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("saisrujana_cart_change", callback);
  };
}

function saveCartItems(newItems: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(newItems);
    cachedRaw = raw;
    cachedItems = newItems;
    localStorage.setItem(CART_STORAGE_KEY, raw);
  } catch (err) {
    console.error("Failed to save cart to localStorage:", err);
  }
  window.dispatchEvent(new Event("saisrujana_cart_change"));
}

// Automatically remove deleted sarees from local cart across tabs
if (typeof window !== "undefined") {
  window.addEventListener("saisrujana:saree-deleted", (e: Event) => {
    const custom = e as CustomEvent<{ id?: string; sku?: string }>;
    const delId = custom.detail?.id;
    const delSku = custom.detail?.sku;
    if (delId || delSku) {
      const items = getCartSnapshot();
      const filtered = items.filter(
        (it) => it.saree.id !== delId && (!delSku || it.saree.sku !== delSku)
      );
      if (filtered.length !== items.length) {
        saveCartItems(filtered);
      }
    }
  });

  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key === "saisrujana:saree-deleted" && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.id || parsed.sku) {
          const items = getCartSnapshot();
          const filtered = items.filter(
            (it) => it.saree.id !== parsed.id && (!parsed.sku || it.saree.sku !== parsed.sku)
          );
          if (filtered.length !== items.length) {
            saveCartItems(filtered);
          }
        }
      } catch {
        // ignore
      }
    }
  });
}

function subscribeMounted() {
  return () => {};
}
function getMountedSnapshot() {
  return true;
}
function getServerMountedSnapshot() {
  return false;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const isLoaded = useSyncExternalStore(subscribeMounted, getMountedSnapshot, getServerMountedSnapshot);

  const addToCart = (saree: Saree, quantity = 1, options?: AddToCartOptions) => {
    const variant = options?.variant;
    const variantId = variant?.id;
    const selectedColor = variant?.colorName || options?.selectedColor;
    const selectedColorCode = variant?.colorCode !== undefined ? variant.colorCode : options?.selectedColorCode;
    const selectedPrice = variant ? variant.price : (options?.selectedPrice ?? saree.price);
    const selectedImage = variant && variant.imageUrls && variant.imageUrls.length > 0
      ? variant.imageUrls[0]
      : (options?.selectedImage ?? saree.image);

    const maxStock =
      variant && typeof variant.stockQuantity === "number" && !isNaN(variant.stockQuantity)
        ? variant.stockQuantity
        : options?.maxStock !== undefined
        ? options.maxStock
        : typeof saree.stockQuantity === "number" && !isNaN(saree.stockQuantity)
        ? saree.stockQuantity
        : undefined;

    if (maxStock !== undefined && maxStock <= 0) {
      return;
    }

    const itemKey = variantId ? `${saree.id}_${variantId}` : saree.id;
    const validQty = Math.max(1, quantity);
    const existingIndex = items.findIndex((item) => getCartItemKey(item) === itemKey);

    let updated: CartItem[];
    if (existingIndex > -1) {
      const currentQty = items[existingIndex].quantity;
      const targetQty = currentQty + validQty;
      const finalQty = maxStock !== undefined && maxStock > 0 ? Math.min(targetQty, maxStock) : targetQty;
      updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: finalQty,
        selectedColor: selectedColor || updated[existingIndex].selectedColor,
        selectedColorCode: selectedColorCode !== undefined ? selectedColorCode : updated[existingIndex].selectedColorCode,
        selectedPrice: selectedPrice || updated[existingIndex].selectedPrice,
        selectedImage: selectedImage || updated[existingIndex].selectedImage,
        maxStock: maxStock !== undefined ? maxStock : updated[existingIndex].maxStock,
      };
    } else {
      const finalQty = maxStock !== undefined && maxStock > 0 ? Math.min(validQty, maxStock) : validQty;
      const newItem: CartItem = {
        saree,
        quantity: finalQty,
        variantId: variantId || undefined,
        selectedColor: selectedColor || undefined,
        selectedColorCode: selectedColorCode || undefined,
        selectedPrice: selectedPrice !== undefined ? selectedPrice : saree.price,
        selectedImage: selectedImage || saree.image,
        maxStock,
      };
      updated = [...items, newItem];
    }
    saveCartItems(updated);
  };

  const removeFromCart = (cartKeyOrSareeId: string) => {
    const updated = items.filter(
      (item) => getCartItemKey(item) !== cartKeyOrSareeId && item.saree.id !== cartKeyOrSareeId
    );
    saveCartItems(updated);
  };

  const updateQuantity = (cartKeyOrSareeId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartKeyOrSareeId);
      return;
    }
    const updated = items.map((item) => {
      const itemKey = getCartItemKey(item);
      if (itemKey !== cartKeyOrSareeId && item.saree.id !== cartKeyOrSareeId) {
        return item;
      }
      const maxStock =
        typeof item.maxStock === "number" && !isNaN(item.maxStock)
          ? item.maxStock
          : typeof item.saree.stockQuantity === "number" && !isNaN(item.saree.stockQuantity)
          ? item.saree.stockQuantity
          : undefined;
      const finalQty =
        maxStock !== undefined && maxStock > 0 ? Math.min(quantity, maxStock) : quantity;
      return { ...item, quantity: finalQty };
    });
    saveCartItems(updated);
  };

  const clearCart = () => {
    saveCartItems([]);
  };

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

