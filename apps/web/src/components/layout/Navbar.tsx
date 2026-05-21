'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Infinity } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="w-full border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <div className="flex items-center text-primary font-bold tracking-tighter">
            <span className="text-2xl leading-none">L</span>
            <Infinity className="w-8 h-8 -ml-0.5 stroke-[3]" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight ml-1">PrintLOO</span>
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {user?.role === 'CUSTOMER' && (
                <div className="hidden sm:flex items-center gap-4 mr-4">
                  <Link href="/upload" className="text-sm font-medium hover:text-primary">Upload</Link>
                  <Link href="/orders" className="text-sm font-medium hover:text-primary">My Orders</Link>
                </div>
              )}
              {user?.role === 'OPERATOR' && (
                <div className="hidden sm:flex items-center gap-4 mr-4">
                  <Link href="/shop/queue" className="text-sm font-medium hover:text-primary">Queue</Link>
                  <Link href="/shop/dashboard" className="text-sm font-medium hover:text-primary">Analytics</Link>
                  <Link href="/shop/orders" className="text-sm font-medium hover:text-primary">Orders</Link>
                  <Link href="/shop/settings" className="text-sm font-medium hover:text-primary">Settings</Link>
                </div>
              )}
              <div className="flex items-center gap-3 border-l pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-sm text-destructive hover:underline">
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary px-3">
                Login
              </Link>
              <Link href="/signup" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
