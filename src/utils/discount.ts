// utils/discount.ts (better to keep it reusable)
import { CouponValidationResult } from "@/services/coupons";

export const calculateDiscount = (coupon: CouponValidationResult | null, total: number): number => {
  if (!coupon) return 0;

  if (coupon.discountType === "percentage") {
    return Math.floor((total * coupon.discountValue) / 100);
  }

  if (coupon.discountType === "fixed") {
    return Math.min(coupon.discountValue, total);
  }

  return 0;
};
