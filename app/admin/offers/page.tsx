import { redirect } from "next/navigation";

export default function AdminOffersRedirect() {
  redirect("/admin/coupons");
}
