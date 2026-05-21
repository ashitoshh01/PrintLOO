import api from './api';

export const paymentService = {
  createRazorpayOrder: (orderId: string) =>
    api.post<{ razorpayOrderId: string; amount: number; currency: string }>('/payments/create', { orderId }),

  verifyPayment: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }) => api.post<{ success: boolean; orderId: string }>('/payments/verify', data),
};
