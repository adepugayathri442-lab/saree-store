import { Saree, Collection } from "@/types/saree";

export const FEATURED_COLLECTIONS: Collection[] = [
  {
    id: "heritage-silks",
    name: "Heritage Silks",
    categoryKey: "Pattu Sarees",
    subtitle: "Traditional Royal Pattu Weaves",
    description:
      "Traditional Pattu sarees rich in cultural heritage, lustrous borders, and timeless designs tailored for weddings, pujas, and grand festivities.",
    image: "/images/kanchipuram.jpg",
    badge: "Pattu Sarees",
    itemCount: "Curated Collection",
  },
  {
    id: "contemporary-elegance",
    name: "Contemporary Elegance",
    categoryKey: "Fancy Sarees",
    subtitle: "Modern & Designer Fancy Sarees",
    description:
      "Chic and stylish fancy sarees blending fashionable silhouettes, modern motifs, and graceful fabrics for parties and festive occasions.",
    image: "/images/organza.jpg",
    badge: "Fancy Sarees",
    itemCount: "Curated Collection",
  },
  {
    id: "everyday-grace",
    name: "Everyday Grace",
    categoryKey: "Daily Wear Sarees",
    subtitle: "Comfortable Daily Wear Drapes",
    description:
      "Soft, breathable, and gracefully styled sarees designed for comfortable all-day wear, office routines, and casual gatherings.",
    image: "/images/handloom.jpg",
    badge: "Daily Wear",
    itemCount: "Curated Collection",
  },
];

export const FEATURED_SAREES: Saree[] = [
  {
    id: "saree-1",
    name: "Heritage Pattu Saree",
    category: "heritage-silks",
    categoryLabel: "Heritage Silks (Pattu Sarees)",
    sku: "SS-PATTU-01",
    fabric: "Pattu Silk",
    craft: "Traditional Silk Weave",
    zariType: "Zari Border",
    occasion: "Weddings, Bridal & Grand Festivities",
    color: "Crimson & Gold",
    price: "Available on Inquiry",
    image: "/images/kanchipuram.jpg",
    gallery: ["/images/kanchipuram.jpg"],
    description:
      "Classic Pattu saree in royal crimson and gold zari border, suitable for weddings, temple visits, and family celebrations.",
    stockStatus: "In Stock",
    stockQuantity: 5,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isLimitedStock: false,
    features: [
      "Traditional border and pallu",
      "Coordinated blouse fabric included",
      "Direct boutique consultation with Gangadhar",
      "Available for in-store preview in Armoor",
    ],
  },
  {
    id: "saree-2",
    name: "Royal Pattu Silk Saree",
    category: "heritage-silks",
    categoryLabel: "Heritage Silks (Pattu Sarees)",
    sku: "SS-PATTU-02",
    fabric: "Pattu Silk",
    craft: "Traditional Silk Weave",
    zariType: "Zari Border",
    occasion: "Heritage Occasions & Family Functions",
    color: "Royal Navy & Gold",
    price: "Available on Inquiry",
    image: "/images/banarasi.jpg",
    gallery: ["/images/banarasi.jpg"],
    description:
      "Richly designed Pattu silk drape featuring intricate gold motifs and elegant borders for milestone events.",
    stockStatus: "Available on Inquiry",
    stockQuantity: 2,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: false,
    isLimitedStock: true,
    features: [
      "Traditional motifs and pallu styling",
      "Ceremonial drape feel",
      "Direct boutique consultation with Gangadhar",
      "Available for in-store preview in Armoor",
    ],
  },
  {
    id: "saree-3",
    name: "Contemporary Fancy Saree",
    category: "contemporary-elegance",
    categoryLabel: "Contemporary Elegance (Fancy Sarees)",
    sku: "SS-FANCY-01",
    fabric: "Fancy Designer Fabric",
    craft: "Modern Weave & Embroidery",
    zariType: "Metallic Thread Accents",
    occasion: "Parties, Receptions & Social Evenings",
    color: "Pastel Rose Pink",
    price: "Available on Inquiry",
    image: "/images/organza.jpg",
    gallery: ["/images/organza.jpg"],
    description:
      "Ethereal designer fancy saree with delicate floral motifs and contemporary scalloped border styling.",
    stockStatus: "In Stock",
    stockQuantity: 4,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    isLimitedStock: false,
    features: [
      "Lightweight party wear drape",
      "Modern aesthetic detailing",
      "Direct boutique consultation with Gangadhar",
      "Available for in-store preview in Armoor",
    ],
  },
  {
    id: "saree-4",
    name: "Everyday Grace Saree",
    category: "everyday-grace",
    categoryLabel: "Everyday Grace (Daily Wear Sarees)",
    sku: "SS-DAILY-01",
    fabric: "Comfort Daily Weave",
    craft: "Artisanal Weave",
    zariType: "Subtle Thread Border",
    occasion: "Daily Wear, Work & Casual Gatherings",
    color: "Emerald Green",
    price: "Available on Inquiry",
    image: "/images/handloom.jpg",
    gallery: ["/images/handloom.jpg"],
    description:
      "Comfortable and breathable daily wear saree in emerald green, designed for effortless elegance and all-day ease.",
    stockStatus: "In Stock",
    stockQuantity: 6,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: true,
    isLimitedStock: false,
    features: [
      "Easy, breathable all-day comfort",
      "Low maintenance and soft touch",
      "Direct boutique consultation with Gangadhar",
      "Available for in-store preview in Armoor",
    ],
  },
];

/**
 * Helper to fetch a saree by its ID
 */
export function getSareeById(id: string): Saree | undefined {
  return FEATURED_SAREES.find((saree) => saree.id === id);
}

/**
 * Helper to fetch all sarees
 */
export function getAllSarees(): Saree[] {
  return FEATURED_SAREES;
}

/**
 * Helper to get related sarees (e.g. from the same collection or others)
 */
export function getRelatedSarees(id: string, category?: string, limit = 3): Saree[] {
  const others = FEATURED_SAREES.filter((saree) => saree.id !== id);
  if (category) {
    const sameCategory = others.filter((saree) => saree.category === category);
    if (sameCategory.length >= limit) {
      return sameCategory.slice(0, limit);
    }
    const remaining = others.filter((saree) => saree.category !== category);
    return [...sameCategory, ...remaining].slice(0, limit);
  }
  return others.slice(0, limit);
}

