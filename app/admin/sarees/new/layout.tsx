import type { Metadata } from "next";
import { SHOP_CONFIG } from "@/config/shop";

export const metadata: Metadata = {
  title: `Add New Saree | ${SHOP_CONFIG.brandName} Admin`,
  description: `Add and publish a new handcrafted saree into the ${SHOP_CONFIG.brandName} boutique catalogue.`,
};

export default function AddNewSareeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
