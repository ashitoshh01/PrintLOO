export interface OperatingHours {
  open: string;
  close: string;
  days: string[];
}

export interface ShopSettings {
  operatingHours?: OperatingHours;
  queueCapacity?: number;
  autoAcceptOrders?: boolean;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  isOpen?: boolean;
  openingHours?: string;
  closingHours?: string;
  rating?: number;
  contact?: string;
  settings?: ShopSettings;
  isActive?: boolean;
  queueLength?: number;
  distanceKm?: number;
  distanceFormatted?: string;
}

export interface Printer {
  id: string;
  shopId: string;
  name: string;
  supportsColor: boolean;
  supportsDuplex: boolean;
  isOnline: boolean;
}
