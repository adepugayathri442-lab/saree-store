"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { Saree } from "@/types/saree";

interface WishlistContextType {
  items: Saree[];
  isInWishlist: (sareeId: string) => boolean;
  addToWishlist: (saree: Saree) => void;
  removeFromWishlist: (sareeId: string) => void;
  toggleWishlist: (saree: Saree) => void;
  clearWishlist: () => void;
  totalCount: number;
  isLoaded: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WISHLIST_STORAGE_KEY = "saisrujana_wishlist_v1";

// In-memory reference caching for snapshot stability in useSyncExternalStore
let cachedRaw: string | null = null;
let cachedItems: Saree[] = [];

function getWishlistSnapshot(): Saree[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = JSON.parse(raw);
    }
    return cachedItems;
  } catch {
    return cachedItems;
  }
}

const emptyServerWishlist: Saree[] = [];
function getServerWishlistSnapshot(): Saree[] {
  return emptyServerWishlist;
}

function subscribeWishlist(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener("saisrujana_wishlist_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("saisrujana_wishlist_change", callback);
  };
}

function saveWishlistItems(newItems: Saree[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(newItems);
    cachedRaw = raw;
    cachedItems = newItems;
    localStorage.setItem(WISHLIST_STORAGE_KEY, raw);
  } catch (err) {
    console.error("Failed to save wishlist to localStorage:", err);
  }
  window.dispatchEvent(new Event("saisrujana_wishlist_change"));
}

// Automatically remove deleted sarees from local wishlist across tabs
if (typeof window !== "undefined") {
  window.addEventListener("saisrujana:saree-deleted", (e: Event) => {
    const custom = e as CustomEvent<{ id?: string; sku?: string }>;
    const delId = custom.detail?.id;
    const delSku = custom.detail?.sku;
    if (delId || delSku) {
      const items = getWishlistSnapshot();
      const filtered = items.filter(
        (it) => it.id !== delId && (!delSku || it.sku !== delSku)
      );
      if (filtered.length !== items.length) {
        saveWishlistItems(filtered);
      }
    }
  });

  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key === "saisrujana:saree-deleted" && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.id || parsed.sku) {
          const items = getWishlistSnapshot();
          const filtered = items.filter(
            (it) => it.id !== parsed.id && (!parsed.sku || it.sku !== parsed.sku)
          );
          if (filtered.length !== items.length) {
            saveWishlistItems(filtered);
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

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    getServerWishlistSnapshot
  );
  const isLoaded = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getServerMountedSnapshot
  );

  const isInWishlist = (sareeId: string): boolean => {
    return items.some((s) => s.id === sareeId);
  };

  const addToWishlist = (saree: Saree) => {
    if (isInWishlist(saree.id)) return;
    const updated = [saree, ...items];
    saveWishlistItems(updated);
  };

  const removeFromWishlist = (sareeId: string) => {
    const updated = items.filter((s) => s.id !== sareeId);
    saveWishlistItems(updated);
  };

  const toggleWishlist = (saree: Saree) => {
    if (isInWishlist(saree.id)) {
      removeFromWishlist(saree.id);
    } else {
      addToWishlist(saree);
    }
  };

  const clearWishlist = () => {
    saveWishlistItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        totalCount: items.length,
        isLoaded,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
