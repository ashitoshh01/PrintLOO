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
    isLocationDisabled,
    setIsLocationDisabled,
  } = useShopStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'nearby' | 'recent' | 'favourites'>('nearby');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(2); // Default 2 km

  // Fetch shops with optional search, coords, and radius
  const loadShops = useCallback(
    async (query: string = '', lat?: number, lng?: number, radius: number = selectedRadius) => {
      setLoading(true);
      try {
        let res;
        if (query.trim()) {
          res = await shopService.searchShops(query.trim(), lat, lng, radius);
        } else {
          res = await shopService.getNearbyShops(lat, lng, radius);
        }
        setShops(res.data || []);
      } catch (err) {
        console.error('Failed to load shops:', err);
        setShops([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedRadius]
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
        setIsLocationDisabled(false);
        setCurrentLocation(coords);
        setPermissionStatus('granted');
        setLocating(false);
        loadShops(searchQuery, coords.lat, coords.lng, selectedRadius);
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
        loadShops(searchQuery, undefined, undefined, selectedRadius);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [loadShops, searchQuery, selectedRadius, setCurrentLocation, setPermissionStatus, setIsLocationDisabled]);

  // Enable location filter
  const handleEnableLocation = () => {
    setIsLocationDisabled(false);
    handleRequestLocation();
  };

  // Turn off location filter
  const handleTurnOffLocation = () => {
    setIsLocationDisabled(true);
    setCurrentLocation(null);
    loadShops(searchQuery, undefined, undefined, selectedRadius);
  };

  // Change radius
  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    if (!isLocationDisabled && currentLocation) {
      loadShops(searchQuery, currentLocation.lat, currentLocation.lng, radius);
    } else {
      loadShops(searchQuery, undefined, undefined, radius);
    }
  };

  // Automatic location detection on load (respects user turn off choice)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isLocationDisabled) {
      loadShops('', undefined, undefined, selectedRadius);
      return;
    }

    if ('permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permission) => {
          setPermissionStatus(permission.state as any);
          if (permission.state === 'granted' && !isLocationDisabled) {
            handleRequestLocation();
          } else {
            loadShops('', undefined, undefined, selectedRadius);
          }
        })
        .catch(() => {
          loadShops('', undefined, undefined, selectedRadius);
        });
    } else {
      loadShops('', undefined, undefined, selectedRadius);
    }
  }, [isLocationDisabled]); // Run on mount or when location disabled preference changes

  // Scroll to shops section if hash is present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#shops-section') {
      const el = document.getElementById('shops-section');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, []);

  // Debounced Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      loadShops(
        searchQuery,
        currentLocation?.lat,
        currentLocation?.lng,
        selectedRadius
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentLocation, selectedRadius, loadShops]);

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
      <div id="shops-section" className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center scroll-mt-24">
        {/* Search Bar */}
        <div className="lg:col-span-7 relative">
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

        {/* GPS Location Button & Reset */}
        <div className="lg:col-span-5 flex items-center gap-2">
          <button
            onClick={currentLocation && !isLocationDisabled ? handleTurnOffLocation : handleEnableLocation}
            disabled={locating}
            className={`flex-1 py-3.5 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
              currentLocation && !isLocationDisabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-card border-border hover:border-primary/50 text-foreground hover:bg-primary/5'
            }`}
          >
            <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : currentLocation && !isLocationDisabled ? 'fill-current' : ''}`} />
            <span>
              {locating
                ? 'Locating...'
                : currentLocation && !isLocationDisabled
                ? '📍 Location Enabled'
                : '📍 Turn Location On'}
            </span>
          </button>

          {currentLocation && !isLocationDisabled && (
            <button
              onClick={handleTurnOffLocation}
              title="Turn off location filter"
              className="py-3.5 px-3 rounded-2xl border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/30 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Turn Off</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Location Filter Banner & Radius Switcher */}
      {currentLocation && !isLocationDisabled && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-semibold">
                Showing shops within {selectedRadius === 0 ? 'All distances' : `${selectedRadius} km radius`}
              </p>
              <p className="text-[11px] opacity-80">
                Only print centers within your selected range are displayed.
              </p>
            </div>
          </div>

          {/* Radius Selector Pills */}
          <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto pt-1 sm:pt-0">
            <span className="text-xs font-medium mr-1 opacity-75 hidden md:inline">Radius:</span>
            {[
              { label: '2 km (Default)', value: 2 },
              { label: '5 km', value: 5 },
              { label: '10 km', value: 10 },
              { label: 'All', value: 0 },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => handleRadiusChange(r.value)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  selectedRadius === r.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-card text-foreground hover:bg-emerald-500/20 border border-emerald-500/20'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
            <span>Sorted by nearest distance ({selectedRadius === 0 ? 'All' : `within ${selectedRadius} km`})</span>
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
        <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Shops Found</h3>
          <p className="text-sm text-muted-foreground">
            {currentLocation && selectedRadius > 0
              ? `No print shops found within ${selectedRadius}km of your location.`
              : searchQuery
              ? `No print shops matched "${searchQuery}". Try searching for another locality or area.`
              : activeTab === 'favourites'
              ? 'You have not added any favourite shops yet.'
              : activeTab === 'recent'
              ? 'No recently used print shops.'
              : 'No registered print shops available at the moment.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {currentLocation && selectedRadius > 0 && (
              <>
                <button
                  onClick={() => handleRadiusChange(5)}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all"
                >
                  Expand Radius to 5 km
                </button>
                <button
                  onClick={() => handleRadiusChange(0)}
                  className="px-4 py-2 bg-card border border-border text-foreground text-xs font-semibold rounded-xl hover:bg-muted transition-all"
                >
                  Show All Shops
                </button>
              </>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all"
              >
                Clear Search Query
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedShops.map((shop) => {
            const isFav = favouriteShopIds.includes(shop.id);
            const isSelected = selectedShop?.id === shop.id;
            const displayAddress = shop.address || shop.location || '';
            const hasAddress = displayAddress.trim().length > 0;

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
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${!hasAddress ? 'opacity-50' : ''}`} />
                        <span className={!hasAddress ? 'italic opacity-60' : ''}>
                          {hasAddress ? displayAddress : "Location not provided"}
                        </span>
                      </p>
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
