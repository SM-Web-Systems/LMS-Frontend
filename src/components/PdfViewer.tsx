import React, { useState, useEffect } from 'react';
import { documentsService } from '../services/documentsService';
import { Loader2 } from 'lucide-react';

interface PdfViewerProps {
  title: string;
  /** URL to the PDF (e.g. direct link). For LMS documents use PdfViewerWithAuth. */
  src: string;
  className?: string;
}

/** Scrollable in-page PDF viewer. Use for "PDF docs scroll to view". */
export const PdfViewer: React.FC<PdfViewerProps> = ({ title, src, className = '' }) => {
  return (
    <div className={`rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden ${className}`}>
      <div className="px-3 py-2 border-b border-neutral-200 bg-white">
        <h4 className="text-sm font-medium text-neutral-800">{title}</h4>
      </div>
      <div className="h-[min(70vh,600px)] w-full overflow-auto">
        <iframe
          title={title}
          src={src}
          className="w-full h-full min-h-[600px] border-0"
        />
      </div>
    </div>
  );
};

interface PdfViewerWithAuthProps {
  documentId: string;
  title: string;
  className?: string;
}

/** Fetches PDF from LMS API with Bearer token and displays in scrollable viewer. */
export const PdfViewerWithAuth: React.FC<PdfViewerWithAuthProps> = ({ documentId, title, className = '' }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const token = localStorage.getItem('token');
    const url = documentsService.getDownloadUrl(documentId);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load PDF');
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setError('Could not load document'))
      .finally(() => {});

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }
  if (!src) {
    return (
      <div className={`flex items-center justify-center h-48 bg-neutral-50 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }
  return <PdfViewer title={title} src={src} className={className} />;
};
