'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FileUploader from '@/components/upload/FileUploader';
import PrintConfigForm from '@/components/upload/PrintConfigForm';
import PriceSummary from '@/components/upload/PriceSummary';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { pricingService } from '@/services/pricingService';
import { useAuthStore } from '@/store/authStore';

const steps = ['Upload File', 'Configure Print', 'Review & Pay'];

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const shopId = searchParams.get('shopId') || 'test-shop-id'; // Fallback for MVP if not passed

  const [step, setStep] = useState(0);
  const [fileData, setFileData] = useState<{ id: string; url: string; pages: number; name: string } | null>(null);
  const [config, setConfig] = useState({ colorMode: 'bw', sides: 'single', copies: 1, paperSize: 'A4' });
  const [pricing, setPricing] = useState<{ total: number; breakdown: any } | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  // Debounce timer ref — prevents firing a pricing API call on every single keystroke / config change
  const pricingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Step 1: Handle upload complete
  const handleUploadComplete = (fileId: string, fileUrl: string, pageCount: number, fileName?: string) => {
    setFileData({ id: fileId, url: fileUrl, pages: pageCount, name: fileName || 'Document.pdf' });
    setStep(1);
  };

  // Step 2: Handle config changes and fetch price — debounced 400ms so rapid changes
  // don't produce a waterfall of requests where stale responses overwrite fresh ones.
  useEffect(() => {
    if (step >= 1 && fileData) {
      if (pricingTimerRef.current) clearTimeout(pricingTimerRef.current);
      pricingTimerRef.current = setTimeout(() => {
        pricingService.calculatePrice(
          shopId,
          config as any,
          fileData.pages
        ).then(res => setPricing(res.data)).catch(console.error);
      }, 400);
    }
    // Cleanup: cancel any pending pricing call on unmount or before next effect run
    return () => {
      if (pricingTimerRef.current) clearTimeout(pricingTimerRef.current);
    };
  }, [config, fileData, step, shopId]);

  // Step 3: Payment
  const handlePayment = async () => {
    if (!fileData) return;
    setPayLoading(true);
    setPayError('');
    try {
      const orderRes = await orderService.createOrder(
        shopId, fileData.url, fileData.name, config as any, fileData.pages
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
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-col items-center flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold z-10 ${step >= i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {step > i ? '✓' : i + 1}
              </div>
              <p className={`text-xs mt-2 ${step >= i ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</p>
              {i < steps.length - 1 && (
                <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${step > i ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
          {step === 0 && (
            <div className="flex flex-col items-center justify-center h-full pt-10">
              <FileUploader shopId={shopId} onUploadComplete={handleUploadComplete} />
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">Print Configuration</h2>
                <PrintConfigForm initialConfig={config as any} onChange={setConfig as any} printer={{ supportsColor: true, supportsDuplex: true } as any} />
                <button onClick={() => setStep(2)} className="mt-6 w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">
                  Continue to Review
                </button>
              </div>
              <div className="w-full md:w-80">
                <PriceSummary breakdown={pricing?.breakdown || { total: pricing?.total || 0, pages: fileData?.pages }} isLoading={!pricing} onProceed={() => setStep(2)} config={config as any} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto py-8">
              <h2 className="text-xl font-semibold mb-6 text-center">Review & Pay</h2>
              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">File</span><span className="font-medium truncate max-w-[200px]">{fileData?.name}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Pages</span><span className="font-medium">{fileData?.pages}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Color Mode</span><span className="font-medium uppercase">{config.colorMode}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Sides</span><span className="font-medium capitalize">{config.sides}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Copies</span><span className="font-medium">{config.copies}</span></div>
                <div className="flex justify-between pt-2 text-lg font-bold"><span>Total Amount</span><span className="text-primary">₹{pricing?.total || 0}</span></div>
              </div>
              
              {payError && <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">{payError}</div>}
              
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border rounded-lg hover:bg-muted">Back</button>
                <button onClick={handlePayment} disabled={payLoading} className="flex-[2] py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
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
