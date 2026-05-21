import { create } from 'zustand';
import { PrintOrder } from '@/types/order';

interface OrderState {
  currentOrder: PrintOrder | null;
  orderHistory: PrintOrder[];
  setCurrentOrder: (order: PrintOrder | null) => void;
  addToHistory: (order: PrintOrder) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  currentOrder: null,
  orderHistory: [],
  setCurrentOrder: (order) => set({ currentOrder: order }),
  addToHistory: (order) => set((state) => ({ orderHistory: [order, ...state.orderHistory] })),
  clearOrder: () => set({ currentOrder: null }),
}));
