import api from './api';

export const uploadService = {
  uploadFile: (file: File, shopId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('shopId', shopId);
    return api.post<{ fileId: string; fileUrl: string; pageCount: number; fileSize: number }>(
      '/uploads',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  getPreviewUrl: (fileId: string) =>
    api.get<{ previewUrl: string }>(`/uploads/${fileId}/preview`),
};
