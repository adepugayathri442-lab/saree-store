/**
 * Stock and Inventory Helper Utilities
 * SaiSrujana Boutique
 *
 * Automatic Stock Status Rules:
 * - 0 = Out of Stock
 * - 1 = Last piece
 * - 2–3 = Only X left
 * - 4+ = In Stock (or custom manual status)
 */

export interface StockDisplayInfo {
  label: string;
  isOutOfStock: boolean;
  isLowStock: boolean;
  badgeClass: string;
  quantity: number;
}

export function getStockDisplay(
  stockQuantity?: number | null,
  manualStockStatus?: string | null
): StockDisplayInfo {
  const qty =
    typeof stockQuantity === "number" && !isNaN(stockQuantity)
      ? Math.max(0, Math.floor(stockQuantity))
      : 0;

  const manualLower = (manualStockStatus || "").toLowerCase();
  const isManualOut =
    manualLower.includes("out of stock") || manualLower.includes("sold out");

  if (qty === 0 || isManualOut) {
    return {
      label: "Out of Stock",
      isOutOfStock: true,
      isLowStock: false,
      badgeClass: "bg-red-50 text-red-800 border-red-200",
      quantity: 0,
    };
  }

  if (qty === 1) {
    return {
      label: "Last piece",
      isOutOfStock: false,
      isLowStock: true,
      badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
      quantity: 1,
    };
  }

  if (qty >= 2 && qty <= 3) {
    return {
      label: `Only ${qty} left`,
      isOutOfStock: false,
      isLowStock: true,
      badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
      quantity: qty,
    };
  }

  // 4+ in stock
  const normalLabel =
    manualStockStatus &&
    manualStockStatus !== "Available on Inquiry" &&
    manualStockStatus !== "Out of Stock" &&
    manualStockStatus !== "Sold Out"
      ? manualStockStatus
      : "In Stock";

  return {
    label: normalLabel,
    isOutOfStock: false,
    isLowStock: false,
    badgeClass: "bg-[#E8F3EE] text-[#1E3F34] border-[#A7F3D0]/50",
    quantity: qty,
  };
}
