export type OrderStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
export type ColorMode = 'bw' | 'color';
export type PrintSides = 'single' | 'duplex';
export type PaperSize = 'A4' | 'A3' | 'Legal';

export interface PrintConfig {
  colorMode: ColorMode;
  sides: PrintSides;
  copies: number;
  paperSize: PaperSize;
}

export interface PrintOrder {
  id: string;
  shopId: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  pageCount: number;
  config: PrintConfig;
  status: OrderStatus;
  tokenNumber: number;
  estimatedMinutes: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}
