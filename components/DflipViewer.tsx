import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    DFLIP: any;
    jQuery: any;
    $: any;
  }
}

interface DflipViewerProps {
  pdfUrl: string;
  onFlip?: (pageIndex: number) => void;
  onReady?: () => void;
  mode?: 'manual' | 'preview';
}

const DflipViewer: React.FC<DflipViewerProps> = ({ 
  pdfUrl, 
  onFlip, 
  onReady,
  mode = 'manual' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookIdRef = useRef<string>('dflip_' + Math.random().toString(36).substr(2, 9));
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dflip scripts dynamically
  useEffect(() => {
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    const loadCSS = (href: string): void => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    const loadDflip = async () => {
      try {
        // Load CSS first
        loadCSS('/dflip/css/dflip.min.css');
        loadCSS('/dflip/css/themify-icons.min.css');

        // Load jQuery first (required by dflip)
        await loadScript('/dflip/js/libs/jquery.min.js');
        
        // Wait for jQuery to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        // Load main dflip (it includes/loads its own dependencies)
        await loadScript('/dflip/js/dflip.min.js');
        
        // Wait for dflip to initialize
        await new Promise(resolve => setTimeout(resolve, 300));

        if (window.DFLIP && window.jQuery) {
          setScriptsLoaded(true);
          console.log('DFLIP loaded successfully');
        } else {
          throw new Error('DFLIP not available after loading scripts');
        }
      } catch (err) {
        console.error('Failed to load dflip:', err);
        setError('Failed to load flipbook library');
      }
    };

    loadDflip();
  }, []);

  // Initialize flipbook using HTML attribute method (like the example)
  useEffect(() => {
    if (!scriptsLoaded || !containerRef.current || !pdfUrl) return;

    const bookId = bookIdRef.current;
    
    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the _df_book element with attributes (matching the example)
    const bookDiv = document.createElement('div');
    bookDiv.className = '_df_book';
    bookDiv.id = bookId;
    bookDiv.setAttribute('source', pdfUrl);
    bookDiv.setAttribute('webgl', 'true');
    bookDiv.setAttribute('backgroundcolor', 'transparent');
    bookDiv.setAttribute('height', '100%');
    
    containerRef.current.appendChild(bookDiv);

    // Let dflip parse and initialize
    const initTimeout = setTimeout(() => {
      if (window.DFLIP && window.DFLIP.parseBooks) {
        window.DFLIP.parseBooks();
        console.log('DFLIP.parseBooks() called');
        onReady?.();
      }
    }, 200);

    return () => {
      clearTimeout(initTimeout);
      // Try to clean up
      const existing = document.getElementById(bookId);
      if (existing) {
        existing.remove();
      }
    };
  }, [scriptsLoaded, pdfUrl, onReady]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded-xl">
        <div className="text-center p-8">
          <p className="text-red-500 font-medium">{error}</p>
          <p className="text-gray-500 text-sm mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Flipbook Container - matching the example structure */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />

      {/* dflip custom styles */}
      <style>{`
        /* Ensure embedded mode fills container */
        ._df_book {
          width: 100% !important;
          height: 100% !important;
          min-height: 500px !important;
        }
        
        .df-container {
          width: 100% !important;
          height: 100% !important;
          background: transparent !important;
        }
        
        .df-3dcanvas-container {
          background: transparent !important;
        }
        
        /* Control bar styling - white like the screenshot */
        .df-ui-controls {
          background: rgba(255,255,255,0.95) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 30px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
          border: 1px solid rgba(0,0,0,0.05) !important;
        }
        .df-ui-btn {
          color: #333 !important;
        }
        .df-ui-btn:hover {
          background: rgba(0,0,0,0.05) !important;
        }
        .df-ui-page {
          color: #333 !important;
        }
      `}</style>
    </div>
  );
};

export default DflipViewer;
