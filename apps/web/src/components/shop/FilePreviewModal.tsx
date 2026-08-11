'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  X, Download, ExternalLink, FileText, Image as ImageIcon,
  File, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';

interface FilePreviewModalProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

type FileType = 'pdf' | 'image' | 'doc';

function getFileType(url: string, name: string): FileType {
  const lower = (name + ' ' + url).toLowerCase();
  // Check name first for accuracy
  if (name.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf')) return 'pdf';
  if (
    /\.(jpg|jpeg|png|webp|bmp|gif|svg)(\?|$|#)/i.test(url) ||
    /\.(jpg|jpeg|png|webp|bmp|gif|svg)$/i.test(name)
  ) return 'image';
  return 'doc';
}

function getFileIcon(type: FileType) {
  switch (type) {
    case 'pdf': return FileText;
    case 'image': return ImageIcon;
    default: return File;
  }
}

// Force download via fetch + blob
async function forceDownload(url: string, fileName: string) {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
}

// Google Docs Viewer URL — works for any publicly accessible PDF/doc URL
function getGoogleViewerUrl(fileUrl: string) {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

export default function FilePreviewModal({ fileUrl, fileName, onClose }: FilePreviewModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const fileType = getFileType(fileUrl, fileName);
  const FileIcon = getFileIcon(fileType);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use Google Docs Viewer for PDFs (Cloudinary raw URLs can't be iframe'd directly)
  const iframeSrc = useGoogleViewer
    ? getGoogleViewerUrl(fileUrl)
    : getGoogleViewerUrl(fileUrl); // Always use Google Docs Viewer for reliability

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
    setIframeError(false);
  };

  const handleRefresh = () => {
    setIframeLoading(true);
    setIframeError(false);
    setRefreshKey(k => k + 1);
  };

  const typeLabel =
    fileType === 'pdf' ? 'PDF Document' :
    fileType === 'image' ? 'Image File' :
    'Document';

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border shrink-0 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate max-w-[180px] sm:max-w-sm md:max-w-lg">
                {fileName}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{typeLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-3">
            {/* Refresh (for iframe) */}
            {(fileType === 'pdf' || fileType === 'doc') && (
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Reload preview"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Open original in new tab */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Open original file"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Download */}
            <button
              onClick={() => forceDownload(fileUrl, fileName)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-xs sm:text-sm font-semibold shadow-sm hover:scale-[1.02]"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Download</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Preview Body ── */}
        <div className="flex-1 overflow-hidden bg-muted/20 relative">

          {/* ── PDF / DOC via Google Docs Viewer ── */}
          {(fileType === 'pdf' || fileType === 'doc') && (
            <div className="relative w-full h-full">
              {/* Loading spinner overlay */}
              {iframeLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card/90 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground font-medium">Loading preview…</p>
                  <p className="text-xs text-muted-foreground/70">Using Google Docs Viewer</p>
                </div>
              )}

              <iframe
                key={refreshKey}
                src={iframeSrc}
                className="w-full h-full border-0"
                title={fileName}
                onLoad={handleIframeLoad}
                onError={() => { setIframeLoading(false); setIframeError(true); }}
                allow="autoplay"
              />

              {/* Error state shown below iframe if Google Viewer also fails */}
              {iframeError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-8 text-center bg-card">
                  <AlertCircle className="w-12 h-12 text-amber-500" />
                  <div>
                    <h3 className="font-heading font-bold text-lg mb-1">Preview unavailable</h3>
                    <p className="text-muted-foreground text-sm">
                      The document could not be rendered in the browser. Download it to view locally.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRefresh}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm"
                    >
                      <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                    <button
                      onClick={() => forceDownload(fileUrl, fileName)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold text-sm shadow-md"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Image Preview ── */}
          {fileType === 'image' && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-[repeating-conic-gradient(#80808015_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">Esc</kbd> or click outside to close
          </p>
          <button
            onClick={() => forceDownload(fileUrl, fileName)}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
          >
            <Download className="w-3.5 h-3.5" /> Download to Print
          </button>
        </div>
      </div>
    </div>
  );
}
