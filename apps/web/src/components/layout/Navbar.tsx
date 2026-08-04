'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useShopStore } from '@/store/shopStore';
import { Infinity, Store, LogOut, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { selectedShop } = useShopStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="w-full border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-1.5 group">
          <div className="flex items-center text-primary font-bold tracking-tighter">
            <span className="text-2xl leading-none">L</span>
            <Infinity className="w-8 h-8 -ml-0.5 stroke-[3] group-hover:rotate-12 transition-transform" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight ml-1 text-foreground">PrintLOO</span>
        </Link>

        {/* Selected Shop Badge for Customers */}
        {isAuthenticated && user?.role === 'CUSTOMER' && selectedShop && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs">
            <Store className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Shop:</span>
            <strong className="text-foreground font-semibold truncate max-w-[150px]">{selectedShop.name}</strong>
            <Link href="/" className="text-primary hover:underline font-semibold ml-1">
              Change
            </Link>
          </div>
        )}

        {/* Nav Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {user?.role === 'CUSTOMER' && (
                <div className="flex items-center gap-4 mr-2">
                  <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                    Find Shops
                  </Link>
                  <Link href="/upload" className="text-sm font-medium hover:text-primary transition-colors">
                    Upload
                  </Link>
                  <Link href="/orders" className="text-sm font-medium hover:text-primary transition-colors">
                    My Orders
                  </Link>
                </div>
              )}
              {user?.role === 'OPERATOR' && (
                <div className="hidden sm:flex items-center gap-4 mr-2">
                  <Link href="/shop/queue" className="text-sm font-medium hover:text-primary transition-colors">
                    Queue
                  </Link>
                  <Link href="/shop/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                    Analytics
                  </Link>
                  <Link href="/shop/orders" className="text-sm font-medium hover:text-primary transition-colors">
                    Orders
                  </Link>
                  <Link href="/shop/settings" className="text-sm font-medium hover:text-primary transition-colors">
                    Settings
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-3 border-l border-border pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold leading-none text-foreground">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1.5 text-xs font-medium"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium hover:text-primary px-3 transition-colors">
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
