'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthContainer from '@/components/auth/AuthContainer';
import ShopDiscoveryDashboard from '@/components/shop/ShopDiscoveryDashboard';

export default function Home() {
  const { isAuthenticated, user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start bg-background pt-12 p-4 sm:p-6 space-y-4">
        {/* Neutral header skeleton */}
        <div className="w-full max-w-5xl h-10 bg-muted/30 rounded-xl animate-pulse mx-auto" />
        <div className="w-full max-w-5xl h-64 bg-card rounded-2xl border border-border animate-pulse mx-auto shadow-sm" />
      </div>
    );
  }

  // If user is not logged in, show authentication directly (no hero section)
  if (!isAuthenticated || !token || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background p-4 sm:p-6">
        <AuthContainer initialMode="login" />
      </div>
    );
  }

  // If user is an Operator, redirect/show notice or dashboard link
  if (user?.role === 'OPERATOR') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-card border border-border p-8 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-2">Shop Owner Dashboard</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Welcome back, {user.name}. Manage your shop print queue and analytics.
          </p>
          <a
            href="/shop/queue"
            className="inline-block bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Go to Live Queue
          </a>
        </div>
      </div>
    );
  }

  // Otherwise, logged in customer sees the Shop Discovery Dashboard directly on '/'
  return <ShopDiscoveryDashboard />;
}
