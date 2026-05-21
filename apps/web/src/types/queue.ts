export interface QueueJob {
  id: string;
  orderId: string;
  shopId: string;
  position: number;
  status: string;
  createdAt: string;
}

export interface QueueState {
  yourToken: number | null;
  nowPrinting: number | null;
  position: number | null;
  eta: number | null;
  totalInQueue: number;
}
