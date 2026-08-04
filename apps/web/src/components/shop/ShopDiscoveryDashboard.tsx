'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { shopService } from '@/services/shopService';
import { useShopStore } from '@/store/shopStore';
import { Shop } from '@/types/shop';
import {
  Search,
  MapPin,
  Navigation,
  Star,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Heart,
  RotateCcw,
  Sparkles,
  Store,
  ChevronRight
} from 'lucide-react';

export default function ShopDiscoveryDashboard() {
  const router = useRouter();
  const {
    selectedShop,
    setSelectedShop,
    recentShops,
    favouriteShopIds,
    toggleFavouriteShop,
    currentLocation,
    setCurrentLocation,
    permissionStatus,
    setPermissionStatus,
  } = useShopStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'nearby' | 'recent' | 'favourites'>('nearby');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Fetch shops with optional search and coords
  const loadShops = useCallback(
    async (query: string = '', lat?: number, lng?: number) => {
      setLoading(true);
      try {
        let res;
        if (query.trim()) {
          res = await shopService.searchShops(query.trim(), lat, lng);
        } else {
          res = await shopService.getNearbyShops(lat, lng);
        }
        setShops(res.data || []);
      } catch (err) {
        console.error('Failed to load shops:', err);
        setShops([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Request browser geolocation
  const handleRequestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      setPermissionStatus('denied');
      return;
    }

    setLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(coords);
        setPermissionStatus('granted');
        setLocating(false);
        loadShops(searchQuery, coords.lat, coords.lng);
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied');
          setLocError('Location permission denied. You can still search manually.');
        } else {
          setLocError('Could not fetch location. Please try manual search.');
        }
        // Fallback load without coords
        loadShops(searchQuery);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [loadShops, searchQuery, setCurrentLocation, setPermissionStatus]);

  // Automatic location detection on load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permission) => {
          setPermissionStatus(permission.state as any);
          if (permission.state === 'granted') {
            handleRequestLocation();
          } else {
            loadShops('');
          }
        })
        .catch(() => {
          loadShops('');
        });
    } else {
      loadShops('');
    }
  }, []); // Run once on mount

  // Debounced Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      loadShops(
        searchQuery,
        currentLocation?.lat,
        currentLocation?.lng
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentLocation, loadShops]);

  // Select shop and proceed to upload
  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
    router.push(`/upload?shopId=${shop.id}`);
  };

  // Filtered Shops based on Active Tab
  const displayedShops = shops.filter((shop) => {
    if (activeTab === 'recent') {
      return recentShops.some((r) => r.id === shop.id);
    }
    if (activeTab === 'favourites') {
      return favouriteShopIds.includes(shop.id);
    }
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* SaaS Dashboard Top Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Select a Print Shop
            </h1>
            <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full border border-primary/20">
              Step 1 of 2
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your preferred xerox center to send print jobs directly to their queue.
          </p>
        </div>

        {/* Selected Shop Quick Status if any */}
        {selectedShop && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-3.5 sm:px-5">
            <Store className="w-5 h-5 text-primary shrink-0" />
            <div className="text-sm">
              <span className="text-xs text-muted-foreground block">Currently Selected:</span>
              <strong className="font-semibold text-foreground">{selectedShop.name}</strong>
            </div>
            <button
              onClick={() => router.push(`/upload?shopId=${selectedShop.id}`)}
              className="ml-2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1 shrink-0"
            >
              <span>Continue Upload</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Control Panel: Search & Location */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Search Bar */}
        <div className="lg:col-span-8 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shop name, locality, area (e.g. Kothrud, Shivajinagar, College)..."
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* GPS Location Button */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <button
            onClick={handleRequestLocation}
            disabled={locating}
            className={`w-full py-3.5 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
              currentLocation
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-card border-border hover:border-primary/50 text-foreground hover:bg-primary/5'
            }`}
          >
            <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : currentLocation ? 'fill-current' : ''}`} />
            <span>
              {locating
                ? 'Locating...'
                : currentLocation
                ? '📍 Location Updated'
                : '📍 Enable Current Location'}
            </span>
          </button>
        </div>
      </div>

      {/* Location Error Notice if any */}
      {locError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
          <span>{locError}</span>
          <button onClick={() => setLocError(null)} className="font-bold underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Filter Tabs & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('nearby')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'nearby'
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Nearby Shops ({shops.length})
          </button>
          {recentShops.length > 0 && (
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'recent'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Recently Used ({recentShops.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('favourites')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'favourites'
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favouriteShopIds.length > 0 ? 'fill-current text-rose-500' : ''}`} />
            <span>Favourites ({favouriteShopIds.length})</span>
          </button>
        </div>

        {currentLocation && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Sorted by nearest distance</span>
          </div>
        )}
      </div>

      {/* Shops Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-56 bg-card rounded-2xl border border-border animate-pulse p-6 space-y-4">
              <div className="h-6 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-10 bg-muted rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : displayedShops.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No Shops Found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {searchQuery
              ? `No print shops matched "${searchQuery}". Try searching for another locality or area.`
              : activeTab === 'favourites'
              ? 'You have not added any favourite shops yet.'
              : activeTab === 'recent'
              ? 'No recently used print shops.'
              : 'No registered print shops available at the moment.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedShops.map((shop) => {
            const isFav = favouriteShopIds.includes(shop.id);
            const isSelected = selectedShop?.id === shop.id;

            return (
              <div
                key={shop.id}
                className={`bg-card rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden relative group ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {/* Card Header & Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                        {shop.name}
                      </h3>
                      {shop.address && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span>{shop.address}</span>
                        </p>
                      )}
                    </div>
                    {/* Favourite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavouriteShop(shop.id);
                      }}
                      className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors shrink-0"
                      title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                    >
                      <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Distance & Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Distance Pill */}
                    {shop.distanceFormatted && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Navigation className="w-3 h-3 fill-current" />
                        {shop.distanceFormatted}
                      </span>
                    )}

                    {/* Open/Closed Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${
                        shop.isOpen !== false
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {shop.isOpen !== false ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Open</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Closed</span>
                        </>
                      )}
                    </span>

                    {/* Rating Badge */}
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{shop.rating || 4.5}</span>
                    </span>
                  </div>

                  {/* Additional Shop Stats */}
                  <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span>
                        Queue: <strong className="text-foreground">{shop.queueLength ?? 0}</strong> orders
                      </span>
                    </div>
                    {shop.openingHours && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{shop.openingHours} - {shop.closingHours}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary CTA Button */}
                <div className="p-4 bg-muted/30 border-t border-border/60">
                  <button
                    onClick={() => handleSelectShop(shop)}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
                      isSelected
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    <span>{isSelected ? 'Shop Selected (Proceed)' : 'Select Shop'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
