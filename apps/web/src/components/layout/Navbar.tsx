'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useShopStore } from '@/store/shopStore';
import { 
  Infinity, 
  Store, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  ListOrdered, 
  BarChart3, 
  ShoppingBag, 
  Settings, 
  Upload, 
  Search,
  LogIn,
  UserPlus,
  ChevronRight
} from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { selectedShop, clearSelectedShop } = useShopStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    router.push('/');
  };

  const handleChangeShop = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    clearSelectedShop();
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      const el = document.getElementById('shops-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    router.push('/#shops-section');
  };

  const isOperator = isAuthenticated && user?.role === 'OPERATOR';
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

  const operatorLinks = [
    { href: '/shop/queue', label: 'Queue', icon: ListOrdered },
    { href: '/shop/dashboard', label: 'Analytics', icon: BarChart3 },
    { href: '/shop/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/shop/settings', label: 'Settings', icon: Settings },
  ];

  const customerLinks = [
    { href: '/', label: 'Find Shops', icon: Search },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/orders', label: 'My Orders', icon: ShoppingBag },
  ];

  return (
    <nav className="relative w-full border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group">
          <span className="font-heading font-bold text-2xl tracking-tight text-foreground">Print</span>
          <div className="flex items-center text-primary font-bold tracking-tighter">
            <span className="text-2xl leading-none">L</span>
            <Infinity className="w-8 h-8 -ml-0.5 stroke-[3] group-hover:rotate-12 transition-transform" />
          </div>
        </Link>

        {/* Desktop Selected Shop Badge for Customers */}
        {isCustomer && selectedShop && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs">
            <Store className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Shop:</span>
            <strong className="text-foreground font-semibold truncate max-w-[150px]">{selectedShop.name}</strong>
            <button
              onClick={handleChangeShop}
              className="text-primary hover:underline font-semibold ml-1 cursor-pointer focus:outline-none"
            >
              Change
            </button>
          </div>
        )}

        {/* Desktop Nav Links & Actions */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              {isCustomer && (
                <div className="flex items-center gap-1">
                  {customerLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'text-primary bg-primary/10 font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {isOperator && (
                <div className="flex items-center gap-1">
                  {operatorLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'text-primary bg-primary/10 font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-3 border-l border-border pl-4">
                <div className="text-right">
                  <p className="text-sm font-semibold leading-none text-foreground">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1.5 text-xs font-medium"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
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

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-foreground hover:bg-muted transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Dropdown Menu (Overlaid over content) */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 w-full md:hidden border-b border-border bg-card/98 backdrop-blur-xl px-4 pt-2 pb-6 space-y-4 shadow-2xl z-50 transition-all animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {isAuthenticated ? (
            <>
              {/* Mobile User Profile Header */}
              <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-base">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
                  </div>
                </div>
              </div>

              {/* Selected Shop info for mobile customer */}
              {isCustomer && selectedShop && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Store className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground shrink-0">Shop:</span>
                    <strong className="text-foreground font-semibold truncate">{selectedShop.name}</strong>
                  </div>
                  <button
                    onClick={handleChangeShop}
                    className="text-primary hover:underline font-semibold ml-2 shrink-0"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Navigation Links for Mobile */}
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  Navigation
                </p>
                {(isOperator ? operatorLinks : customerLinks).map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 opacity-60 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </Link>
                  );
                })}
              </div>

              {/* Logout Button */}
              <div className="pt-2 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 pt-2">
              <Link
                href="/login"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <LogIn className="w-4 h-4 text-muted-foreground" />
                <span>Login</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
