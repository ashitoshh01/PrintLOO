'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadService } from '@/services/uploadService';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { formatFileSize } from '@/utils/formatters';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/utils/constants';

interface FileUploaderProps {
  shopId: string;
  onUploadComplete: (fileId: string, fileUrl: string, pageCount: number) => void;
}

export default function FileUploader({ shopId, onUploadComplete }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError('Invalid file type or size. Max 25MB, PDF/JPG/PNG only.');
      return;
    }
    
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileInfo({ name: file.name, size: file.size });
    setIsUploading(true);

    try {
      // Mock progress
      const interval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 200);

      const response = await uploadService.uploadFile(file, shopId);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      // Delay slightly for UX
      setTimeout(() => {
        onUploadComplete(response.data.fileId, response.data.fileUrl, response.data.pageCount);
        setIsUploading(false);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      setIsUploading(false);
      setFileInfo(null);
      setUploadProgress(0);
    }
  }, [shopId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    disabled: isUploading || uploadProgress === 100,
  });

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[240px]
          ${isDragActive ? 'border-brand-accent bg-brand-accent/5' : 'border-border bg-card/50 hover:bg-card hover:border-brand-accent/50'}
          ${(isUploading || uploadProgress === 100) ? 'opacity-75 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {error ? (
          <div className="flex flex-col items-center text-destructive">
            <AlertCircle className="w-10 h-10 mb-3" />
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1 opacity-80">Click to try again</p>
          </div>
        ) : uploadProgress === 100 ? (
          <div className="flex flex-col items-center text-green-500">
            <CheckCircle className="w-12 h-12 mb-3" />
            <p className="font-medium text-lg">Upload Complete</p>
            <p className="text-sm text-muted-foreground mt-1">{fileInfo?.name}</p>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center w-full max-w-xs mx-auto">
            <UploadCloud className="w-10 h-10 mb-4 text-brand-accent animate-pulse" />
            <p className="font-medium mb-1 truncate w-full">{fileInfo?.name}</p>
            <p className="text-sm text-muted-foreground mb-4">{fileInfo ? formatFileSize(fileInfo.size) : ''}</p>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-accent transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm mt-2 font-medium">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-2">Upload your document</h3>
            <p className="text-muted-foreground mb-1">Drag and drop your file here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-4 border border-border rounded px-3 py-1 bg-background/50">
              PDF, JPG, PNG (Max 25MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
