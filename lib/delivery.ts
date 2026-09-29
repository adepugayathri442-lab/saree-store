/**
 * Delivery Calculation & Distance Engine for SaiSrujana
 *
 * Computes geodesic / real distance from SaiSrujana Showroom (Armoor, Nizamabad)
 * and matches against configurable delivery slabs for charges and delivery estimates.
 */

import { DeliveryRule } from "@/types/order";

export const DEFAULT_DELIVERY_RULES: DeliveryRule[] = [
  {
    id: "rule-local-armoor",
    name: "Local Armoor Delivery",
    minDistanceKm: 0,
    maxDistanceKm: 5,
    charge: 30,
    estimatedDays: 1,
    isActive: true,
    description: "Door delivery within Armoor town & immediate surroundings",
  },
  {
    id: "rule-nizamabad-dist",
    name: "Nizamabad District Zone",
    minDistanceKm: 5,
    maxDistanceKm: 25,
    charge: 60,
    estimatedDays: 2,
    isActive: true,
    description: "Delivery across Nizamabad, Balkonda, Perkit & neighboring mandals",
  },
  {
    id: "rule-north-telangana",
    name: "North Telangana Region",
    minDistanceKm: 25,
    maxDistanceKm: 100,
    charge: 90,
    estimatedDays: 3,
    isActive: true,
    description: "Delivery across Jagtial, Nirmal, Kamareddy & Adilabad",
  },
  {
    id: "rule-telangana-metro",
    name: "Telangana & Hyderabad Metro",
    minDistanceKm: 100,
    maxDistanceKm: 250,
    charge: 120,
    estimatedDays: 3,
    isActive: true,
    description: "Speed courier delivery to Hyderabad, Warangal & Karimnagar",
  },
  {
    id: "rule-all-india",
    name: "All India Express Shipping",
    minDistanceKm: 250,
    maxDistanceKm: null,
    charge: 150,
    estimatedDays: 5,
    isActive: true,
    description: "Insured express saree shipping across all Indian states",
  },
];

/**
 * Calculates Haversine distance in kilometers between two geographic coordinates.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Approximate distance estimation from Indian Pincode when GPS is not provided.
 */
export function estimateDistanceKmFromPincode(pincode: string): number {
  const cleanPin = pincode.replace(/[^0-9]/g, "");
  if (cleanPin.length !== 6) return 300;

  // Armoor & immediate Nizamabad area (503224, 503xxx)
  if (cleanPin === "503224") return 2; // Armoor local
  if (cleanPin.startsWith("5032")) return 8; // Perkit / surrounding
  if (cleanPin.startsWith("503")) return 28; // Nizamabad district

  // Nearby North Telangana (504xxx - Nirmal/Adilabad, 505xxx - Karimnagar/Jagtial)
  if (cleanPin.startsWith("504") || cleanPin.startsWith("505")) return 75;

  // Hyderabad & Ranga Reddy (500xxx)
  if (cleanPin.startsWith("500") || cleanPin.startsWith("501") || cleanPin.startsWith("502")) {
    return 175;
  }

  // Rest of Telangana & AP (50xxxx, 51xxxx, 52xxxx, 53xxxx)
  if (cleanPin.startsWith("50") || cleanPin.startsWith("51") || cleanPin.startsWith("52") || cleanPin.startsWith("53")) {
    return 320;
  }

  // Southern states (Karnataka, Tamil Nadu, Maharashtra)
  if (cleanPin.startsWith("56") || cleanPin.startsWith("57") || cleanPin.startsWith("60") || cleanPin.startsWith("40") || cleanPin.startsWith("41")) {
    return 650;
  }

  // Rest of India
  return 1200;
}

/**
 * Evaluates the delivery charge and estimated delivery days based on distance and active rules.
 */
export function evaluateDeliveryForDistance(
  distanceKm: number,
  rules: DeliveryRule[] = DEFAULT_DELIVERY_RULES
): {
  charge: number;
  estimatedDays: number;
  ruleName: string;
} {
  const activeRules = rules.filter((r) => r.isActive);
  const sortedRules = [...(activeRules.length > 0 ? activeRules : DEFAULT_DELIVERY_RULES)].sort(
    (a, b) => a.minDistanceKm - b.minDistanceKm
  );

  for (const rule of sortedRules) {
    if (
      distanceKm >= rule.minDistanceKm &&
      (rule.maxDistanceKm === null || distanceKm <= rule.maxDistanceKm)
    ) {
      return {
        charge: rule.charge,
        estimatedDays: Math.max(1, rule.estimatedDays),
        ruleName: rule.name,
      };
    }
  }

  // Fallback to highest distance rule
  const lastRule = sortedRules[sortedRules.length - 1];
  return {
    charge: lastRule ? lastRule.charge : 150,
    estimatedDays: lastRule ? lastRule.estimatedDays : 5,
    ruleName: lastRule ? lastRule.name : "Standard Shipping",
  };
}

/**
 * Calculates initial expected delivery date based on estimated days from order creation.
 */
export function calculateInitialDeliveryDate(
  estimatedDays: number,
  baseDate: Date = new Date()
): {
  isoDate: string;
  formattedDate: string;
  relativeLabel: string;
} {
  const target = new Date(baseDate);
  target.setDate(target.getDate() + Math.max(1, estimatedDays));

  // Format date in Indian English (e.g., "30 Sep 2026")
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  const formattedDate = target.toLocaleDateString("en-IN", options);

  const relativeLabel =
    estimatedDays === 1
      ? "Tomorrow"
      : estimatedDays === 2
      ? "In 2 days"
      : `In ${estimatedDays} days (${formattedDate})`;

  return {
    isoDate: target.toISOString().split("T")[0],
    formattedDate,
    relativeLabel,
  };
}

/**
 * Generates an official Google Maps link for the showroom or customer delivery location.
 */
export function getGoogleMapsPinUrl(latitude: number, longitude: number, label?: string): string {
  if (label) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
