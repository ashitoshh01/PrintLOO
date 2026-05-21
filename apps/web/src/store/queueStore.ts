import { create } from 'zustand';
import { QueueState } from '@/types/queue';

interface QueueStoreState {
  queue: QueueState;
  updateQueue: (data: Partial<QueueState>) => void;
  clearQueue: () => void;
}

const initialQueue: QueueState = {
  yourToken: null,
  nowPrinting: null,
  position: null,
  eta: null,
  totalInQueue: 0,
};

export const useQueueStore = create<QueueStoreState>((set) => ({
  queue: initialQueue,
  updateQueue: (data) => set((state) => ({ queue: { ...state.queue, ...data } })),
  clearQueue: () => set({ queue: initialQueue }),
}));
