import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { processPayment, PaymentProvider } from '@/services/payments';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import UPIPayment from '@/components/payment/UPIPayment';
import CouponInput from '@/components/ui/CouponInput';
import { useToast } from '@/hooks/use-toast';
import { CouponValidationResult } from '@/services/coupons';
import { Loader2 } from "lucide-react";
import apiClient from '@/services/api';
const Checkout = () => {
  const { state, dispatch } = useCart();
  useEffect(() => {
    console.log("✅ Checkout totals (updated):", {
      subtotal: state.subtotal,
      shipping: state.shippingFee,
      discount: state.discountAmount,
      Cod: state.codCharges,
      total: state.finalTotal,
    });
  }, [state]); // runs every time state changes
  const buildOrderItems = () =>
  state.items.map(item => ({
    product: item._id,
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    variantId: item.variantId || null,
    size: item.size || null,
  }));
  const orderItems = buildOrderItems();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | 'upi' | 'cod'>('upi');
  const [showUPIPayment, setShowUPIPayment] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    // Fetch related products excluding cart items
    const fetchRelatedProducts = async () => {
      try {
        const res = await apiClient.getProducts();
        const allProducts = Array.isArray(res?.products) ? res.products : [];
        const related = allProducts
          .filter((p: any) => !state.items.some(item => item._id === p._id))
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (err) {
        console.error("Error fetching related products:", err);
      }
    };
    fetchRelatedProducts();
  }, [state.items]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCouponApplied = (result: CouponValidationResult) => {
    dispatch({ type: 'APPLY_COUPON', payload: result });
  };

  const validateForm = () => {
    const requiredFields = ['email', 'firstName', 'lastName', 'phone', 'address', 'city', 'state', 'pincode'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData].trim()) {
        toast({
          title: "Missing Information",
          description: `Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const calculateTotals = () => {
    //const subtotal = state.finalTotal; // Use finalTotal which includes coupon discount
    const subtotal = state.items.reduce(
   (acc, item) => acc + item.price * item.quantity,
   0
   );
    const discountAmount = state.discountAmount || 0;
    const tax = Math.round(subtotal * 0);
    const codCharges = paymentProvider === 'cod' ? 50 : 0;
    const shippingFee = subtotal > 499 ? 0 : 99;
    const total = subtotal - discountAmount + shippingFee + codCharges + tax;
    return { subtotal, discountAmount, tax, codCharges, shippingFee, total };
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (paymentProvider === 'upi') {
      setShowUPIPayment(true);
      return;
    }
    
    setIsProcessing(true);

    try {
      const { subtotal, tax, total } = calculateTotals();
      const orderData = {
  orderItems: buildOrderItems(),
  subtotal,
  shippingFee,
  discountAmount,
  codCharges,
  total,
  customerInfo: formData,   // checkout form data
  appliedCoupon: state.appliedCoupon,
  paymentMethod: paymentProvider
};

      const customerData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        contact: formData.phone
      };

      if (paymentProvider === 'cod') {
        await processPayment(
          'cod',
          { total, items: state.items, customerInfo: formData },
          customerData,
         async (response) => {
      const orderItems = buildOrderItems();
            const orderData = {
              orderId: response.orderId,
              paymentId: 'COD',
              paymentProvider: 'cod',
              orderItems,
              subtotal: subtotal,
              tax: tax,
              codCharges: codCharges,
              shippingFee,
              total: total,
              customerInfo: formData,
              appliedCoupon: state.appliedCoupon,
              discountAmount: state.discountAmount,
              paymentMethod: paymentProvider
            };
            //console.log(orderData);
           console.log("🛒 Final orderItems being sent:", orderItems);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        // Handle validation or other backend errors
        if (!res.ok) {
          const errData = await res.json();
          console.error("❌ Order failed:", errData);

          if (errData.errors && Array.isArray(errData.errors)) {
            errData.errors.forEach((err: any) => {
              toast({
                title: "Validation Error",
                description: err.msg,
                variant: "destructive",
              });
            });
          } else {
            toast({
              title: "Order Failed",
              description: errData.message || "Something went wrong while placing your order.",
              variant: "destructive",
            });
          }

          return; // ⛔ stop execution if failed
        }

        const data = await res.json();
        console.log("✅ Order saved:", data);

        // ✅ Only now clear cart and navigate
        dispatch({ type: 'CLEAR_CART' });
        navigate('/order-confirmation', { state: { orderData } });
        toast({
          title: "Order Placed Successfully!",
          description: "Your order will be delivered within 3-5 business days.",
        });

      } catch (err) {
        console.error("❌ Failed to save order:", err);
        toast({
          title: "Order Failed",
          description: "Network/server error. Please try again.",
          variant: "destructive",
        });
      }
    },
    (error) => {
      console.error('COD order error:', error);
      toast({
        title: "Order Failed",
        description: "There was an issue placing your order. Please try again.",
        variant: "destructive",
      });
    }
  );
}
 else if (paymentProvider === 'razorpay') {
        const paymentData = {
          amount: total * 100, // Razorpay expects amount in paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            customerName: customerData.name,
            customerEmail: formData.email,
            itemCount: state.itemCount
          }
        };

        await processPayment(
          'razorpay',
          paymentData,
          customerData,
          (response) => {
            const orderData = {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              paymentProvider: 'razorpay',
              items: state.items,
              subtotal: subtotal,
              tax: tax,
              total: total,
              customerInfo: formData,
              appliedCoupon: state.appliedCoupon,
              discountAmount: state.discountAmount,
              paymentMethod: paymentProvider
            };

            dispatch({ type: 'CLEAR_CART' });
            navigate('/order-confirmation', { state: { orderData } });

            toast({
              title: "Payment Successful!",
              description: "Your order has been placed successfully.",
            });
          },
          (error) => {
            console.error('Razorpay payment error:', error);
            toast({
              title: "Payment Failed",
              description: "There was an issue processing your payment. Please try again.",
              variant: "destructive",
            });
          }
        );
      } else if (paymentProvider === 'phonepe') {
        const merchantTransactionId = `TXN_${Date.now()}`;
        const phonePeData = {
          amount: total * 100, // PhonePe expects amount in paise
          merchantTransactionId,
          merchantUserId: state.user?._id || `GUEST_${Date.now()}`,
          redirectUrl: `${window.location.origin}/order-confirmation`,
          redirectMode: 'POST',
          callbackUrl: `${window.location.origin}/api/payments/phonepe/callback`,
          mobileNumber: formData.phone,
          paymentInstrument: {
            type: 'PAY_PAGE'
          }
        };

        await processPayment(
          'phonepe',
          phonePeData,
          customerData,
          (response) => {
            // PhonePe will redirect, so we store order data in localStorage
            const orderData = {
              orderId: merchantTransactionId,
              paymentProvider: 'phonepe',
              items: state.items,
              subtotal: subtotal,
              tax: tax,
              total: total,
              customerInfo: formData,
              appliedCoupon: state.appliedCoupon,
              discountAmount: state.discountAmount,
              paymentMethod: paymentProvider
            };
            localStorage.setItem('pendingOrder', JSON.stringify(orderData));
          },
          (error) => {
            console.error('PhonePe payment error:', error);
            toast({
              title: "Payment Failed",
              description: "There was an issue processing your payment. Please try again.",
              variant: "destructive",
            });
          }
        );
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: "Unable to process payment. Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUPISuccess = (paymentData: any) => {
    const { subtotal, tax, total } = calculateTotals();
    
    const orderData = {
      orderId: paymentData.transactionId,
      paymentId: paymentData.upiRefId,
      paymentProvider: 'upi',
      items: state.items,
      subtotal: subtotal,
      tax: tax,
      total: total,
      customerInfo: formData,
      appliedCoupon: state.appliedCoupon,
      discountAmount: state.discountAmount,
      paymentMethod: paymentProvider
    };

    dispatch({ type: 'CLEAR_CART' });
    navigate('/order-confirmation', { state: { orderData } });

    toast({
      title: "Payment Successful!",
      description: `Payment completed via UPI. Ref ID: ${paymentData.upiRefId}`,
    });
  };

  const handleUPIError = (error: string) => {
    setShowUPIPayment(false);
    toast({
      title: "UPI Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleUPICancel = () => {
    setShowUPIPayment(false);
  };

  const { subtotal, discountAmount, tax, codCharges, shippingFee, total } = calculateTotals();
  useEffect(() => {
  console.log("✅ Checkout totals (updated):", { subtotal, shipping: state.shippingFee, discount: state.discountAmount, codCharges, total });
}, [subtotal, state.shippingFee, state.discountAmount, codCharges, total]);

  if (showUPIPayment) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
        <UPIPayment
          amount={total}
          onSuccess={handleUPISuccess}
          onError={handleUPIError}
          onCancel={handleUPICancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/cart">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back to Cart
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-playfair font-bold text-secondary">Checkout</h1>
            <p className="text-neutral-medium">Complete your order</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" />
                  <Input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" />
                </div>
                <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone" />
                <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" />
                <div className="grid grid-cols-3 gap-4">
                  <Input name="city" value={formData.city} onChange={handleInputChange} placeholder="City" />
                  <Input name="state" value={formData.state} onChange={handleInputChange} placeholder="State" />
                  <Input name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="Pincode" />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodSelector
                  selectedMethod={paymentProvider}
                  onMethodChange={(method) => setPaymentProvider(method as PaymentProvider | 'upi' | 'cod')}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order Summary + Coupon + Related Products */}
          <div className="space-y-6">
            <CouponInput cartTotal={state.total} onCouponApplied={handleCouponApplied} appliedCoupon={state.appliedCoupon} couponMessage={state.couponMessage} />

            {/* Order Summary */}
            <Card className="sticky top-8 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader><CardTitle className="font-playfair">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-neutral-light rounded-lg overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-neutral-medium">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <Separator />
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discountAmount.toLocaleString()}</span></div>}
                <div className="flex justify-between"><span>Shipping</span><span>{shippingFee > 0 ? `₹${shippingFee}` : 'Free'}</span></div>
                {codCharges > 0 && <div className="flex justify-between"><span>COD Charges</span><span>₹{codCharges}</span></div>}
                <Separator />
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{total.toLocaleString()}</span></div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || state.items.length === 0}
                  className="btn-primary w-full"
                  size="lg"
                >
                  {isProcessing ? 'Processing...' : 
                   paymentProvider === 'upi' ? `Pay ₹${total.toLocaleString()} with UPI` :
                   paymentProvider === 'cod' ? `Place Order - ₹${total.toLocaleString()}` :
                   `Pay ₹${total.toLocaleString()}`}
                </Button>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-neutral-light space-y-2">
                  <div className="flex items-center space-x-2 text-sm"><Shield className="text-primary" size={16} /><span className="text-neutral-medium">Secure SSL encryption</span></div>
                  <div className="flex items-center space-x-2 text-sm"><Truck className="text-primary" size={16} /><span className="text-neutral-medium">Free delivery in 3-5 days</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div>
                <h2 className="text-xl font-playfair font-bold text-gray-800 mb-4">You May Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedProducts.map(product => (
                    <Card key={product._id} onClick={() => navigate(`/products/${product.slug}`)} className="group cursor-pointer hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
                      <div className="aspect-square overflow-hidden bg-gray-50">
                        <img src={product.images[0]?.url} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-playfair font-semibold text-gray-800 mb-1">{product.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-800">₹{product.price}</span>
                          <Button size="sm" variant={product.isActive ? 'outline' : 'destructive'} disabled={!product.isActive} onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: 'ADD_ITEM', payload: { product: product._id, name: product.name, price: product.price, image: product.images[0]?.url || '', slug: product.slug, size: 'default', quantity: 1, variantId: null } });
                            toast({ title: 'Added to Cart', description: `${product.name} has been added to your cart.` });
                          }}>{product.isActive ? 'Add' : 'Sold Out'}</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
{isProcessing && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-center">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
      <p className="text-lg font-medium">Placing your order...</p>
      <p className="text-sm text-neutral-medium">This may take a few seconds</p>
    </div>
  </div>
)}
    </div>
  );
};

export default Checkout;
