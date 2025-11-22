import React, { useState, useEffect } from 'react';
import { QrCode, Smartphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

interface UPIPaymentProps {
  amount: number;
  intentId: string;
  token: string; // JWT token for auth
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const UPIPayment: React.FC<UPIPaymentProps> = ({ amount, intentId, token, onSuccess, onError, onCancel }) => {
  const [upiLink, setUpiLink] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [isMobile, setIsMobile] = useState(false);
  // Detect mobile
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  // Create UPI link using PhonePe / merchant backend
  const createUPILink = async (app?: string) => {
    setPaymentStatus('processing');

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/payments/phonepe/create-order`,
        { intentId, amount: amount * 100 }, // amount in paise
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data.data;

      // Merchant transaction ID and UPI link
      const merchantTxnId = data.merchantTransactionId || data.txnId || intentId;
      const vpa = data.vpa || 'merchant@upi';
      const upi = `upi://pay?pa=${vpa}&pn=Merchant&am=${amount}&cu=INR&tid=${merchantTxnId}`;

      setTransactionId(merchantTxnId);
      setUpiLink(upi);

      // On mobile, open the app directly
      if (isMobile && app) {
        window.location.href = upi;
      }

      // Start polling backend for status
      pollPaymentStatus();
    } catch (err: any) {
      console.error('UPI Payment creation error:', err.response?.data || err.message);
      setPaymentStatus('failed');
      onError(err.response?.data?.message || 'Failed to create payment');
    }
  };
  const pollPaymentStatus = async () => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/payments/phonepe/check-status?intentId=${intentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.status === 'success') {
          clearInterval(interval);
          setPaymentStatus('success');
          onSuccess(res.data);
        } else if (res.data.status === 'failed') {
          clearInterval(interval);
          setPaymentStatus('failed');
          onError('Payment failed');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // every 5 seconds
  };

  const retryPayment = () => {
    setPaymentStatus('pending');
    setUpiLink('');
    setTransactionId('');
  };

  // UI Rendering
  if (paymentStatus === 'processing') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <RefreshCw className="animate-spin" size={20} />
            <span>Processing Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Please complete the payment in your UPI app</p>
          <p className="text-sm text-neutral-medium">Transaction ID: {transactionId}</p>
          <Button variant="outline" onClick={onCancel}>Cancel Payment</Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Your payment could not be processed. Please try again or choose a different payment method.
            </AlertDescription>
          </Alert>
          <div className="flex space-x-2">
            <Button onClick={retryPayment} className="flex-1">Retry Payment</Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">Choose Different Method</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Pay with UPI</CardTitle>
        <p className="text-center text-neutral-medium">Amount: ₹{amount.toLocaleString()}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* UPI Apps */}
<div className="grid grid-cols-2 gap-3">
  <Button 
    variant="outline" 
    onClick={() => createUPILink('phonepe')}
    className="h-16 flex flex-col items-center space-y-1 hover:bg-purple-50"
  >
    <Smartphone className="text-purple-600" size={24} />
    <span className="text-sm text-purple-700 font-medium">PhonePe</span>
  </Button>

  <Button 
    variant="outline" 
    onClick={() => createUPILink('gpay')}
    className="h-16 flex flex-col items-center space-y-1 hover:bg-blue-50"
  >
    <Smartphone className="text-blue-600" size={24} />
    <span className="text-sm text-blue-700 font-medium">Google Pay</span>
  </Button>

  <Button 
    variant="outline" 
    onClick={() => createUPILink('paytm')}
    className="h-16 flex flex-col items-center space-y-1 hover:bg-blue-50"
  >
    <Smartphone className="text-blue-500" size={24} />
    <span className="text-sm text-blue-600 font-medium">Paytm</span>
  </Button>

  <Button 
    variant="outline" 
    onClick={() => createUPILink('bhim')}
    className="h-16 flex flex-col items-center space-y-1 hover:bg-orange-50"
  >
    <Smartphone className="text-orange-600" size={24} />
    <span className="text-sm text-orange-700 font-medium">BHIM</span>
  </Button>
</div>

        {/* QR Code Section */}
        <div className="text-center">
          <h3 className="font-medium mb-3">Or Scan QR Code</h3>
          {upiLink ? (
            <QRCodeCanvas value={upiLink} size={180} />
          ) : (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="animate-spin" size={32} />
            </div>
          )}
        </div>

        {/* UPI ID */}
        {upiLink && (
          <div className="text-center">
            <p className="text-sm text-neutral-medium mb-1">UPI Link:</p>
            <code className="bg-neutral-light px-2 py-1 rounded text-sm">{upiLink}</code>
          </div>
        )}

        {/* Cancel Button */}
        <Button variant="outline" onClick={onCancel} className="w-full">
          Choose Different Payment Method
        </Button>
      </CardContent>
    </Card>
  );
};

export default UPIPayment;
