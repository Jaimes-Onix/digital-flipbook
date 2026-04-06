import * as pdfjsLib from 'pdfjs-dist';

// We explicitly define the version to match the import map in index.html.
// This prevents runtime issues if pdfjsLib.version is undefined in the ESM build
// and ensures we fetch the matching worker version.
const PDFJS_VERSION = '4.4.168';

// Ensure the worker is set up correctly for the browser environment.
if (typeof window !== 'undefined' && 'Worker' in window) {
  // CRITICAL FIX: In PDF.js v4.x+, when using ES modules (which esm.sh provides),
  // we must point to the 'pdf.worker.mjs' file. 
  // Pointing to 'pdf.worker.min.js' causes a "Failed to fetch dynamically imported module" error
  // because the browser tries to load the classic script as a module.
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;
}

export const getDocument = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Loading the document with cMapUrl ensures that PDFs with complex fonts 
  // or non-latin characters render correctly.
  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
    cMapPacked: true,
  });
  
  return loadingTask.promise;
};