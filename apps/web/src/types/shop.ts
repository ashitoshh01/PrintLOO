export interface OperatingHours {
  open: string;
  close: string;
  days: string[];
}

export interface ShopSettings {
  operatingHours: OperatingHours;
  queueCapacity: number;
  autoAcceptOrders: boolean;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  contact: string;
  settings: ShopSettings;
  isActive: boolean;
}

export interface Printer {
  id: string;
  shopId: string;
  name: string;
  supportsColor: boolean;
  supportsDuplex: boolean;
  isOnline: boolean;
}
