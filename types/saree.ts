export type SareeCategory = "heritage-silks" | "contemporary-elegance" | "everyday-grace";

export interface SareeVariant {
  id: string;
  sareeId: string;
  colorName: string;
  colorCode?: string | null;
  price: number | string;
  stockQuantity: number;
  imageUrls: string[];
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Saree {
  id: string;
  name: string;
  category: SareeCategory;
  categoryLabel: string;
  sku: string;
  fabric: string;
  craft: string;
  zariType: string;
  occasion: string;
  color: string;
  price: number | string;
  originalPrice?: number | string;
  image: string;
  gallery?: string[];
  videoUrl?: string;
  description: string;
  stockStatus: string;
  stockQuantity: number;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isLimitedStock?: boolean;
  features: string[];
  variants?: SareeVariant[];
}

export interface Collection {
  id: SareeCategory;
  name: string;
  categoryKey: string;
  subtitle: string;
  description: string;
  image: string;
  badge: string;
  itemCount: string;
}

export interface BoutiqueService {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  perks: string[];
  ctaText: string;
}

export interface TrustFeature {
  id: string;
  title: string;
  description: string;
  iconName: string;
}
