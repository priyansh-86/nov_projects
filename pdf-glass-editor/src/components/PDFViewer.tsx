"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { 
  ChevronLeft, ChevronRight, Loader2, 
  ZoomIn, ZoomOut, Maximize, RotateCcw 
} from "lucide-react";

// Worker Setup (Crucial for rendering)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File;
  rotation: number;
}

export default function PDFViewer({ file, rotation }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0); // 👈 Zoom State

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Zoom Handlers
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0)); // Max Zoom 3x
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5)); // Min Zoom 0.5x
  const resetZoom = () => setScale(1.0);

  return (
    <div className="flex flex-col items-center relative w-full h-full">
      
      {/* PDF Document Renderer */}
      <div className="w-full h-full overflow-auto flex justify-center p-4 custom-scrollbar" id="pdf-container">
        <div 
          className="shadow-2xl transition-transform duration-200 origin-top"
          style={{ transform: `scale(${scale})` }} // CSS Scale for smooth zoom
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center gap-2 text-white p-10">
                <Loader2 className="animate-spin" /> Loading PDF...
              </div>
            }
            error={<div className="text-red-400 p-10 bg-black/20 rounded-lg border border-red-500/20">Failed to load PDF. Is it valid?</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              rotate={rotation} 
              scale={1} // React-PDF scale fixed, we use CSS transform for performance
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              height={600} // Base height
              className="border-[8px] border-white/10 rounded-lg overflow-hidden bg-white"
            />
          </Document>
        </div>
      </div>

      {/* 🛠️ FLOATING TOOLBAR (Zoom + Nav) */}
      {numPages > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-glass-highlight/90 backdrop-blur-xl px-4 py-2 rounded-full border border-glass-border shadow-2xl z-50 transition-all hover:bg-glass-highlight">
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-r border-white/10 pr-4">
            <button onClick={zoomOut} className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-white/60 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={resetZoom} className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors ml-1" title="Reset Zoom">
              <Maximize className="w-3 h-3" />
            </button>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-30 text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-sm font-medium text-white whitespace-nowrap">
              {pageNumber} / {numPages}
            </span>

            <button
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-30 text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}