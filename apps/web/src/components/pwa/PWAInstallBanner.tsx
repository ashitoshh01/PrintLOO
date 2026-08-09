'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Share, PlusSquare, Smartphone, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if already installed / standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check dismissal storage (7 days cooldown)
    const dismissedAt = localStorage.getItem('printloo_pwa_dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');

    if (isIosDevice && isSafari) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // 4. Chrome / Android / Desktop beforeinstallprompt event handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      } else {
        console.log('User dismissed the PWA install prompt');
      }
    } catch (err) {
      console.error('Error prompting PWA install:', err);
    } finally {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('printloo_pwa_dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Main Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-6 duration-300">
        <div className="relative bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex flex-col gap-3">
          <button
            onClick={handleDismiss}
            aria-label="Close install prompt"
            className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 pr-6">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10 p-1 flex-shrink-0 border border-white/10 shadow-inner">
              <Image
                src="/favicon.png"
                alt="PrintLOO Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-sm tracking-tight text-white">Install PrintLOO App</h4>
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> App
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                Add to your home screen for instant print status notifications & one-tap order tracking!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install Application</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 text-xs text-slate-400 hover:text-white font-medium hover:bg-slate-800 rounded-xl transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Image
                  src="/favicon.png"
                  alt="PrintLOO Logo"
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
                <div>
                  <h3 className="font-semibold text-base">Install on iOS</h3>
                  <p className="text-xs text-slate-400">Follow 2 simple steps</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-800/60 p-4 rounded-2xl text-xs text-slate-200 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  1
                </div>
                <p>
                  Tap the <Share className="w-4 h-4 inline text-blue-400 mx-1" /> <strong>Share</strong> button in Safari toolbar.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </div>
                <p>
                  Scroll down and tap <PlusSquare className="w-4 h-4 inline text-emerald-400 mx-1" /> <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2.5 rounded-xl transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
