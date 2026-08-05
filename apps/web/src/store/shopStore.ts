import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Shop } from '@/types/shop';

interface ShopState {
  selectedShop: Shop | null;
  recentShops: Shop[];
  favouriteShopIds: string[];
  currentLocation: { lat: number; lng: number } | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
  isLocationDisabled: boolean;
  
  setSelectedShop: (shop: Shop | null) => void;
  addRecentShop: (shop: Shop) => void;
  toggleFavouriteShop: (shopId: string) => void;
  setCurrentLocation: (loc: { lat: number; lng: number } | null) => void;
  setPermissionStatus: (status: 'prompt' | 'granted' | 'denied' | 'unknown') => void;
  setIsLocationDisabled: (disabled: boolean) => void;
  clearSelectedShop: () => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      selectedShop: null,
      recentShops: [],
      favouriteShopIds: [],
      currentLocation: null,
      permissionStatus: 'unknown',
      isLocationDisabled: false,

      setSelectedShop: (shop) =>
        set((state) => {
          let updatedRecent = state.recentShops;
          if (shop) {
            const filtered = state.recentShops.filter((s) => s.id !== shop.id);
            updatedRecent = [shop, ...filtered].slice(0, 5);
          }
          return { selectedShop: shop, recentShops: updatedRecent };
        }),

      addRecentShop: (shop) =>
        set((state) => {
          const filtered = state.recentShops.filter((s) => s.id !== shop.id);
          return { recentShops: [shop, ...filtered].slice(0, 5) };
        }),

      toggleFavouriteShop: (shopId) =>
        set((state) => {
          const exists = state.favouriteShopIds.includes(shopId);
          const updated = exists
            ? state.favouriteShopIds.filter((id) => id !== shopId)
            : [...state.favouriteShopIds, shopId];
          return { favouriteShopIds: updated };
        }),

      setCurrentLocation: (currentLocation) => set({ currentLocation }),
      setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
      setIsLocationDisabled: (isLocationDisabled) => set({ isLocationDisabled }),
      clearSelectedShop: () => set({ selectedShop: null }),
    }),
    { name: 'shop-storage' }
  )
);
