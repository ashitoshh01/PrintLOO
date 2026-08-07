'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { orderService, OrderQueueStatus } from '@/services/orderService';
import { OrderStatus } from '@/types/order';
import {
  CheckCircle2,
  Clock,
  Printer,
  Users,
  ArrowRight,
  Sparkles,
  FileText,
  MapPin,
  Timer,
  Zap,
  Home,
  ListOrdered,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

// ─── Success Confetti Animation ────────────────────────────────────────────
function SuccessAnimation({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        {/* Success pulse ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 w-28 h-28 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="absolute inset-2 w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-2">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground text-sm">
          Your print job has been queued
        </p>

        {/* Decorative dots */}
        <div className="flex gap-1.5 mt-6">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Circular Progress Ring ────────────────────────────────────────────────
function ProgressRing({ progress, size = 200, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#gradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Main Queue Content ────────────────────────────────────────────────────
function QueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const showSuccess = searchParams.get('success') === 'true';

  const [queueStatus, setQueueStatus] = useState<OrderQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessAnim, setShowSuccessAnim] = useState(showSuccess);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQueueStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await orderService.getOrderQueueStatus(orderId);
      setQueueStatus(res.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch queue status', err);
      // Don't set error on first load if we already have data
      if (!queueStatus) {
        setError(err.response?.data?.message || 'Failed to load queue status');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initial fetch & polling
  useEffect(() => {
    if (!orderId) return;

    fetchQueueStatus();
    pollRef.current = setInterval(fetchQueueStatus, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, fetchQueueStatus]);

  // WebSocket connection
  useEffect(() => {
    if (!orderId || !queueStatus?.shopId) return;

    const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/queue`, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // Join both order room & shop room
    socket.emit('join:order', orderId);
    socket.emit('join:shop', queueStatus.shopId);

    // Listen for order-level updates
    socket.on('order:updated', (data: any) => {
      setQueueStatus((prev) =>
        prev ? { ...prev, orderStatus: data.status } : prev
      );
      // Refetch for complete data
      fetchQueueStatus();
    });

    // Listen for shop-level "now serving" updates
    socket.on('queue:now-serving', (data: any) => {
      setQueueStatus((prev) =>
        prev
          ? {
              ...prev,
              nowServingToken: data.nowServingToken,
              nowServingOrderId: data.nowServingOrderId,
              totalInQueue: data.totalInQueue,
            }
          : prev
      );
      // Refetch for accurate position
      fetchQueueStatus();
    });

    // Listen for general queue updates
    socket.on('queue:updated', (data: any) => {
      setQueueStatus((prev) =>
        prev
          ? {
              ...prev,
              nowServingToken: data.nowServingToken ?? prev.nowServingToken,
              totalInQueue: data.pendingJobs ?? prev.totalInQueue,
            }
          : prev
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, queueStatus?.shopId]);

  // Stop polling when order is completed/failed
  useEffect(() => {
    if (
      queueStatus?.orderStatus === 'COMPLETED' ||
      queueStatus?.orderStatus === 'FAILED'
    ) {
      if (pollRef.current) clearInterval(pollRef.current);
      socketRef.current?.disconnect();
    }
  }, [queueStatus?.orderStatus]);

  // Handle no orderId
  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold mb-2">No Order Found</h2>
          <p className="text-muted-foreground text-sm mb-6">
            It looks like you accessed this page without an order.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your queue status...</p>
        </div>
      </div>
    );
  }

  if (error && !queueStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchQueueStatus(); }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!queueStatus) return null;

  const isCompleted = queueStatus.orderStatus === 'COMPLETED';
  const isFailed = queueStatus.orderStatus === 'FAILED';
  const isProcessing = queueStatus.orderStatus === 'PROCESSING' || queueStatus.orderStatus === 'PRINTING';
  const isQueued = queueStatus.orderStatus === 'QUEUED';

  // Progress percentage: completed = 100, processing = 75, position 0 = 60, otherwise based on position
  let progressPercent = 10;
  if (isCompleted) progressPercent = 100;
  else if (isProcessing) progressPercent = 80;
  else if (isQueued && queueStatus.queuePosition === 0) progressPercent = 60;
  else if (isQueued) progressPercent = Math.max(15, 50 - queueStatus.queuePosition * 8);

  return (
    <>
      {/* Success Animation Overlay */}
      {showSuccessAnim && (
        <SuccessAnimation onComplete={() => setShowSuccessAnim(false)} />
      )}

      <div className="min-h-screen bg-background py-6 px-4 sm:px-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* ─── Header ─────────────────────────────────── */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest mb-2 bg-emerald-500/10 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Payment Confirmed
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
              Queue Tracker
            </h1>
            <p className="text-muted-foreground text-sm mt-1 flex items-center justify-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {queueStatus.shopName}
            </p>
          </div>

          {/* ─── Token Number Card (Hero) ────────────────── */}
          <div className="relative bg-card border border-border rounded-3xl p-8 shadow-lg overflow-hidden">
            {/* Background gradient decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-500/5 to-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex flex-col items-center">
              {/* Circular progress with token */}
              <div className="relative mb-6">
                <ProgressRing
                  progress={progressPercent}
                  size={180}
                  strokeWidth={6}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Your Token
                  </span>
                  <span className="text-5xl font-heading font-black text-foreground leading-none mt-1">
                    #{queueStatus.tokenNumber}
                  </span>
                  {isCompleted && (
                    <span className="text-xs text-emerald-500 font-bold mt-2">READY!</span>
                  )}
                  {isFailed && (
                    <span className="text-xs text-destructive font-bold mt-2">FAILED</span>
                  )}
                  {isProcessing && (
                    <span className="text-xs text-purple-500 font-bold mt-2 flex items-center gap-1">
                      <Printer className="w-3 h-3" /> PRINTING
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 ${
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : isFailed
                    ? 'bg-destructive/10 text-destructive border border-destructive/20'
                    : isProcessing
                    ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20 animate-pulse'
                    : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                }`}
              >
                {isCompleted && <><CheckCircle2 className="w-3.5 h-3.5" /> Print Ready — Collect at Counter</>}
                {isFailed && <><AlertCircle className="w-3.5 h-3.5" /> Printing Failed — Contact Shop</>}
                {isProcessing && <><Printer className="w-3.5 h-3.5" /> Your Document is Printing Now</>}
                {isQueued && <><Clock className="w-3.5 h-3.5" /> Waiting in Queue</>}
              </div>
            </div>
          </div>

          {/* ─── Live Queue Info Cards ───────────────────── */}
          {!isCompleted && !isFailed && (
            <div className="grid grid-cols-2 gap-3">
              {/* Now Serving */}
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Now Serving</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    {queueStatus.nowServingToken ? (
                      <>
                        <span className="text-3xl font-heading font-black text-foreground">
                          #{queueStatus.nowServingToken}
                        </span>
                        {/* Live dot */}
                        <span className="relative flex h-2 w-2 ml-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-heading font-bold text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Your Position */}
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Your Position</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    {isProcessing ? (
                      <span className="text-lg font-heading font-bold text-purple-500">
                        It&apos;s your turn!
                      </span>
                    ) : (
                      <>
                        <span className="text-3xl font-heading font-black text-foreground">
                          {queueStatus.queuePosition}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {queueStatus.queuePosition === 1
                            ? 'person ahead'
                            : 'ahead'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Estimated Time */}
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                    <Timer className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Est. Wait</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    {isProcessing ? (
                      <span className="text-lg font-heading font-bold text-emerald-500">Almost done</span>
                    ) : (
                      <>
                        <span className="text-3xl font-heading font-black text-foreground">
                          {queueStatus.estimatedMinutes || '< 1'}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">min</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Total in Queue */}
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                    <ListOrdered className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">In Queue</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-heading font-black text-foreground">
                      {queueStatus.totalInQueue}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">orders</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Completed State ─────────────────────────── */}
          {isCompleted && (
            <div className="bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                Your Print is Ready! 🎉
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Show <span className="font-bold text-foreground">Token #{queueStatus.tokenNumber}</span> at the counter to collect your documents.
              </p>
              <div className="bg-emerald-500/10 rounded-xl py-3 px-4 inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                Amount Paid: ₹{queueStatus.totalAmount}
              </div>
            </div>
          )}

          {/* ─── Failed State ────────────────────────────── */}
          {isFailed && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h3 className="text-xl font-heading font-bold text-destructive mb-2">
                Printing Failed
              </h3>
              <p className="text-muted-foreground text-sm">
                There was an issue printing your document. Please contact the shop operator for assistance.
              </p>
            </div>
          )}

          {/* ─── Order Details ───────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Order Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">File</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {queueStatus.fileName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pages</span>
                <span className="font-medium">{queueStatus.pageCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Shop</span>
                <span className="font-medium">{queueStatus.shopName}</span>
              </div>
              {queueStatus.shopAddress && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-xs truncate max-w-[200px]">{queueStatus.shopAddress}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold">Total Paid</span>
                <span className="font-bold text-primary text-lg">₹{queueStatus.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* ─── Real-time Indicator ─────────────────────── */}
          {!isCompleted && !isFailed && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live updates — auto-refreshing every 5 seconds
            </div>
          )}

          {/* ─── Action Buttons ──────────────────────────── */}
          <div className="flex gap-3 pb-6">
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-3 px-4 border border-border rounded-xl font-medium text-sm text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Home
            </button>
            <button
              onClick={() => router.push('/orders')}
              className="flex-[2] py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              <ListOrdered className="w-4 h-4" /> View All Orders
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Loading queue tracker...</p>
          </div>
        </div>
      }
    >
      <QueueContent />
    </Suspense>
  );
}
