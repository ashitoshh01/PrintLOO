'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FileUploader from '@/components/upload/FileUploader';
import PrintConfigForm from '@/components/upload/PrintConfigForm';
import PriceSummary from '@/components/upload/PriceSummary';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { pricingService } from '@/services/pricingService';
import { useAuthStore } from '@/store/authStore';
import { useShopStore } from '@/store/shopStore';
import { Store, MapPin, ArrowLeft } from 'lucide-react';

const steps = ['Upload File', 'Configure Print', 'Review & Pay'];

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { selectedShop } = useShopStore();

  const paramShopId = searchParams.get('shopId');
  const shopId = paramShopId || selectedShop?.id;

  const [step, setStep] = useState(0);
  const [fileData, setFileData] = useState<{ id: string; url: string; pages: number; name: string } | null>(null);
  const [config, setConfig] = useState({ colorMode: 'bw', sides: 'single', copies: 1, paperSize: 'A4' });
  const [pricing, setPricing] = useState<{ total: number; breakdown: any } | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  // Debounce timer ref — prevents firing a pricing API call on every single keystroke / config change
  const pricingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // If no shop selected at all, prompt user to choose a shop first
  if (!shopId) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md shadow-lg">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No Shop Selected</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Please select a print shop before uploading your documents.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Select a Print Shop</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Handle upload complete
  const handleUploadComplete = (fileId: string, fileUrl: string, pageCount: number, fileName?: string) => {
    setFileData({ id: fileId, url: fileUrl, pages: pageCount, name: fileName || 'Document.pdf' });
    setStep(1);
  };

  // Step 2: Handle config changes and fetch price
  useEffect(() => {
    if (step >= 1 && fileData && shopId) {
      if (pricingTimerRef.current) clearTimeout(pricingTimerRef.current);
      pricingTimerRef.current = setTimeout(() => {
        pricingService
          .calculatePrice(shopId, config as any, fileData.pages)
          .then((res) => setPricing(res.data))
          .catch(console.error);
      }, 400);
    }
    return () => {
      if (pricingTimerRef.current) clearTimeout(pricingTimerRef.current);
    };
  }, [config, fileData, step, shopId]);

  // Step 3: Payment
  const handlePayment = async () => {
    if (!fileData || !shopId) return;
    setPayLoading(true);
    setPayError('');
    try {
      const orderRes = await orderService.createOrder(
        shopId,
        fileData.url,
        fileData.name,
        config as any,
        fileData.pages
      );
      const order = orderRes.data;

      const payRes = await paymentService.createRazorpayOrder(order.id);
      const { razorpayOrderId, amount, currency } = payRes.data;

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: 'PrintLOO',
        description: `Print Job - Token #${order.tokenNumber}`,
        handler: async (response: any) => {
          await paymentService.verifyPayment({
            razorpayOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId: order.id,
          });
          router.push(`/queue?orderId=${order.id}&token=${order.tokenNumber}`);
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#3b82f6' },
      });
      rzp.open();
    } catch (err: any) {
      setPayError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Selected Shop Info Header Banner */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Printing at</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                  Selected
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {selectedShop?.name || 'Selected Shop'}
              </h2>
              {selectedShop?.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span>{selectedShop.address}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="text-xs font-semibold text-primary hover:underline bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-xl transition-all"
          >
            Change Shop
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-col items-center flex-1 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold z-10 ${
                  step >= i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > i ? '✓' : i + 1}
              </div>
              <p className={`text-xs mt-2 ${step >= i ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {s}
              </p>
              {i < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${
                    step > i ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm min-h-[400px]">
          {step === 0 && (
            <div className="flex flex-col items-center justify-center h-full pt-6">
              <FileUploader shopId={shopId} onUploadComplete={handleUploadComplete} />
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">Print Configuration</h2>
                <PrintConfigForm
                  initialConfig={config as any}
                  onChange={setConfig as any}
                  printer={{ supportsColor: true, supportsDuplex: true } as any}
                />
                <button
                  onClick={() => setStep(2)}
                  className="mt-6 w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  Continue to Review
                </button>
              </div>
              <div className="w-full md:w-80">
                <PriceSummary
                  breakdown={pricing?.breakdown || { total: pricing?.total || 0, pages: fileData?.pages }}
                  isLoading={!pricing}
                  onProceed={() => setStep(2)}
                  config={config as any}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto py-6">
              <h2 className="text-xl font-semibold mb-6 text-center">Review & Pay</h2>
              <div className="space-y-4 mb-8 text-sm bg-muted/30 p-5 rounded-2xl border border-border">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Shop</span>
                  <span className="font-semibold text-foreground">{selectedShop?.name || 'Selected Shop'}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">File</span>
                  <span className="font-medium truncate max-w-[200px]">{fileData?.name}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Pages</span>
                  <span className="font-medium">{fileData?.pages}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Color Mode</span>
                  <span className="font-medium uppercase">{config.colorMode}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Sides</span>
                  <span className="font-medium capitalize">{config.sides}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Copies</span>
                  <span className="font-medium">{config.copies}</span>
                </div>
                <div className="flex justify-between pt-2 text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{pricing?.total || 0}</span>
                </div>
              </div>

              {payError && (
                <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                  {payError}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={payLoading}
                  className="flex-[2] py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                >
                  {payLoading ? 'Processing...' : `Pay ₹${pricing?.total || 0}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading upload interface...</div>}>
      <UploadContent />
    </Suspense>
  );
}
