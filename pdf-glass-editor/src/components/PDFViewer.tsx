"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { 
  ChevronLeft, ChevronRight, Loader2, 
  ZoomIn, ZoomOut, Maximize2, RotateCcw 
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
    setScale(1.0); // Reset zoom on new file
  }

  // Zoom Handlers
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3.0)); // Max 300%
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5)); // Min 50%
  const fitWidth = () => setScale(1.5); // Readable standard size
  const resetZoom = () => setScale(1.0); // Default

  return (
    <div className="flex flex-col items-center relative w-full h-full bg-black/5 rounded-xl overflow-hidden">
      
      {/* PDF Document Renderer Area */}
      <div className="w-full h-full overflow-auto flex justify-center p-8 custom-scrollbar relative" id="pdf-container">
        
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center gap-2 text-white/70 mt-20">
              <Loader2 className="animate-spin" /> Loading PDF...
            </div>
          }
          error={
            <div className="text-red-400 mt-20 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              Failed to load PDF.
            </div>
          }
          className="flex flex-col gap-4"
        >
          {/* Page Render */}
          <div className="relative shadow-2xl border-[1px] border-white/10">
             <Page 
               pageNumber={pageNumber} 
               rotate={rotation} 
               scale={scale} // 👈 Ye real Quality Zoom karega (Canvas redraw)
               renderTextLayer={false} 
               renderAnnotationLayer={false}
               className="bg-white"
             />
          </div>
        </Document>

      </div>

      {/* 🛠️ FLOATING TOOLBAR (Zoom + Nav) */}
      {numPages > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1a1a1a]/90 backdrop-blur-xl px-2 py-2 rounded-full border border-white/10 shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1">
            <button onClick={zoomOut} className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-white/60 w-8 text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <button onClick={zoomIn} className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Fit / Reset */}
          <button onClick={fitWidth} className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-blue-400 transition-colors" title="Fit to Readable Width">
             <Maximize2 className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1"></div>

          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-20 text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-xs font-medium text-white whitespace-nowrap select-none min-w-[50px] text-center">
              {pageNumber} / {numPages}
            </span>

            <button
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-20 text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}