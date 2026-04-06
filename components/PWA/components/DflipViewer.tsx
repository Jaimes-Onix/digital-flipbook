import React, { useEffect, useRef, useState } from 'react';

interface DflipViewerProps {
  pdfUrl: string;
  bookId: string;
}

declare global {
  interface Window {
    DFLIP: any;
    jQuery: any;
  }
}

const DflipViewer: React.FC<DflipViewerProps> = ({ pdfUrl, bookId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !pdfUrl) return;

    const initDflip = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);
        setError(null);

        // FETCH PDF OURSELVES from Supabase
        console.log('Fetching PDF from:', pdfUrl);
        
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        
        // Get total size for progress
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        // Read the response as stream for progress tracking
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to get reader');
        
        const chunks: Uint8Array[] = [];
        let received = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          received += value.length;
          
          if (total > 0) {
            setLoadingProgress(Math.round((received / total) * 100));
          }
        }
        
        // Combine chunks into blob
        const blob = new Blob(chunks, { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        
        console.log('PDF fetched, blob URL:', blobUrl);
        setLoadingProgress(100);

        // Wait for DFLIP and jQuery to load
        await new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const check = () => {
            if (window.DFLIP && window.jQuery) {
              resolve();
            } else if (attempts > 100) {
              reject(new Error('DFLIP library not loaded'));
            } else {
              attempts++;
              setTimeout(check, 50);
            }
          };
          check();
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          
          // Create dflip element with BLOB URL (same-origin, no CORS issues)
          const bookDiv = document.createElement('div');
          bookDiv.className = '_df_book';
          bookDiv.id = `df_${bookId}`;
          bookDiv.setAttribute('source', blobUrl);
          bookDiv.setAttribute('webgl', 'true');
          bookDiv.setAttribute('backgroundcolor', 'rgb(243, 240, 252)');
          bookDiv.setAttribute('height', String(window.innerHeight - 100));
          bookDiv.style.width = '100%';
          bookDiv.style.height = '100%';
          
          containerRef.current.appendChild(bookDiv);
          
          // Parse and initialize dflip
          window.DFLIP.parseBooks();
          
          // Give dflip time to initialize
          setTimeout(() => setLoading(false), 1000);
        }
      } catch (err: any) {
        console.error('DFlip init error:', err);
        setError(err.message || 'Failed to load book');
        setLoading(false);
      }
    };

    initDflip();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [pdfUrl, bookId]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-500">
          <p className="font-medium">Error loading book</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ minHeight: '500px' }}>
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgb(243, 240, 252)' }}>
          <div className="text-center">
            <img src="/dflip/images/loading.gif" alt="Loading" className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {loadingProgress < 100 
                ? `Downloading PDF ${loadingProgress}%...` 
                : 'Initializing FlipBook...'}
            </p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
};

export default DflipViewer;
