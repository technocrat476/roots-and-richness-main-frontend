// src/contexts/CartContext.tsx
import React, { createContext, useEffect, useContext, useReducer, ReactNode } from 'react';
import { CouponValidationResult } from '@/services/coupons';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

interface CartItem extends Product {
  quantity: number;
  size?: string; 
  cartItemId: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  total: number;          // equal to subtotal pre-discount
  itemCount: number;
  appliedCoupon: CouponValidationResult | null;
  discountAmount: number;
  shippingFee: number;
  finalTotal: number;
  couponMessage: string;    // <- NEW: message to display (success or failure)
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product & { quantity?: number; size?: string  } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'APPLY_COUPON'; payload: CouponValidationResult }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const initialState: CartState = {
  items: [],
  subtotal: 0,
  total: 0,
  itemCount: 0,
  appliedCoupon: null,
  discountAmount: 0,
  shippingFee: 0,
  finalTotal: 0,
  couponMessage: '',
};

// helpers
function computeDiscount(subtotal: number, result: CouponValidationResult | null): number {
  if (!result || !result.success || !result.coupon) return 0;
  const c = result.coupon;
  if (c.type === 'flat') {
    return Math.min(c.value, subtotal);
  }
  // percent
  return Math.floor((subtotal * c.value) / 100);
}

function formatCouponMessage(result: CouponValidationResult | null, discount: number) {
  if (!result) return '';
  if (!result.success) {
    // show the failure message from validation (invalid/expired/min amount)
    return result.message || '';
  }
  if (result.success && result.coupon) {
    return `${result.coupon.code} applied: ₹${discount} OFF`;
  }
  return '';
}

function calculateTotals(items: CartItem[], appliedCoupon: CouponValidationResult | null) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const shippingFee = subtotal > 499 ? 0 : 99;
  const discountAmount = computeDiscount(subtotal, appliedCoupon);
  const codCharges = 0;
  const finalTotal = Math.max(0, subtotal + shippingFee - discountAmount);
  return {
    subtotal,
    total: subtotal,
    itemCount,
    discountAmount,
    shippingFee,
    codCharges,
    finalTotal,
    couponMessage: formatCouponMessage(appliedCoupon, discountAmount),
  };
}

// persist/load (persist minimal truth)
const getInitialCart = (): CartState => {
  try {
    const raw = localStorage.getItem('cart');
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    const items: CartItem[] = Array.isArray(parsed?.items) ? parsed.items : [];
    //const appliedCoupon: CouponValidationResult | null = parsed?.appliedCoupon ?? null;
    return {
      ...initialState,
      items,
      ...calculateTotals(items, null),
    };
  } catch (e) {
    console.error('Error parsing cart from localStorage', e);
    return initialState;
  }
};

// reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
case 'ADD_ITEM': {
  const payloadAny: any = action.payload;

  // Always keep the real MongoDB _id
  const normalized = {
    ...payloadAny,
    product: payloadAny.product,
    _id: payloadAny._id || payloadAny.product, // never override with a synthetic id
    size: payloadAny.size, 
    cartItemId: payloadAny.variantId
      ? `${payloadAny._id}-${payloadAny.variantId}`
      : payloadAny._id, // used only in cart reducer/lookup
  };

  const existing = state.items.find(i => i.cartItemId === normalized.cartItemId);

  const items = existing
    ? state.items.map(i =>
        i.cartItemId === normalized.cartItemId
          ? { ...i, quantity: i.quantity + (normalized.quantity || 1) }
          : i
      )
    : [...state.items, { ...normalized, quantity: normalized.quantity || 1 }];

  const effectiveCoupon = items.length === 0 ? null : state.appliedCoupon;

  return {
    ...state,
    items,
    appliedCoupon: effectiveCoupon,
    ...calculateTotals(items, effectiveCoupon),
  };
}
case 'UPDATE_QUANTITY': {
  const { cartItemId, quantity } = action.payload;
  const items = state.items
    .map(i =>
      i.cartItemId === cartItemId
        ? { ...i, quantity: Math.max(0, quantity) }
        : i
    )
    .filter(i => i.quantity > 0);

  const effectiveCoupon = items.length === 0 ? null : state.appliedCoupon;
  return { ...state, items, appliedCoupon: effectiveCoupon, ...calculateTotals(items, effectiveCoupon) };
}

case 'REMOVE_ITEM': {
  const cartItemId = action.payload;
  const items = state.items.filter(i => i.cartItemId !== cartItemId);

  const effectiveCoupon = items.length === 0 ? null : state.appliedCoupon;
  return { ...state, items, appliedCoupon: effectiveCoupon, ...calculateTotals(items, effectiveCoupon) };
}
case 'APPLY_COUPON': {
  const validation = action.payload;

  if (!validation || !validation.success) {
    // failure: no coupon applied, show failure message
    const totals = calculateTotals(state.items, null);
    return {
      ...state,
      appliedCoupon: null,
      ...totals,
      couponMessage: validation?.message || ''
    };
  }

  // success: attach coupon (only if cart not empty)
  const effective = state.items.length === 0 ? null : validation;
  const totals = calculateTotals(state.items, effective);
  return {
    ...state,
    items: [...state.items],
    appliedCoupon: effective,
    ...totals,
    couponMessage: validation.message  // ✅ always keep success message
  };
}
    case 'CLEAR_CART':
      return { ...initialState };

    default:
      return state;
  }
};

// provider
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, getInitialCart);

  useEffect(() => {
    // persist minimal pieces (items + coupon), derived values will be recalculated on load
    const toPersist = { items: state.items };
    localStorage.setItem('cart', JSON.stringify(toPersist));
  }, [state.items]);

  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};