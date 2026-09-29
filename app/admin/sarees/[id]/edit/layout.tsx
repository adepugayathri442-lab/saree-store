import type { Metadata } from "next";
import { SHOP_CONFIG } from "@/config/shop";

export const metadata: Metadata = {
  title: `Edit Saree | ${SHOP_CONFIG.brandName} Admin`,
  description: `Edit handcrafted saree details and update photographs in the ${SHOP_CONFIG.brandName} boutique catalogue.`,
};

export default function EditSareeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
