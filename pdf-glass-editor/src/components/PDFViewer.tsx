"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { 
  ChevronLeft, ChevronRight, Loader2, 
  ZoomIn, ZoomOut, Maximize2 
} from "lucide-react";

// Worker Setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File;
  rotation: number;
}

export default function PDFViewer({ file, rotation }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  useEffect(() => {
    setPageNumber(1);
    setScale(1.0);
  }, [file]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const fitWidth = () => setScale(1.2); 

  return (
    // 🟢 MAIN CONTAINER: Flex Column Layout
    <div className="flex flex-col w-full h-full bg-black/5 rounded-xl overflow-hidden border border-white/5">
      
      {/* 🛠️ TOP FIXED TOOLBAR */}
      <div className="h-14 w-full border-b border-white/10 bg-[#1a1a1a] flex items-center justify-between px-4 z-20">
        
        {/* Left Side: Zoom Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
            <button onClick={zoomOut} className="p-1.5 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-white/90 w-12 text-center select-none border-x border-white/10 mx-1 font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button onClick={zoomIn} className="p-1.5 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          <button onClick={fitWidth} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-blue-400 transition-colors border border-white/10" title="Fit Width">
             <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Page Navigation */}
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
           <button
             onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
             disabled={pageNumber <= 1}
             className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-30 text-white transition-colors"
           >
             <ChevronLeft className="w-4 h-4" />
           </button>
           
           <span className="text-xs font-medium text-white whitespace-nowrap select-none min-w-[70px] text-center">
             Page {pageNumber} / {numPages || "--"}
           </span>

           <button
             onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages || 1))}
             disabled={pageNumber >= (numPages || 1)}
             className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-30 text-white transition-colors"
           >
             <ChevronRight className="w-4 h-4" />
           </button>
        </div>

      </div>

      {/* 📄 PDF SCROLL AREA (Bachi hui jagah lega) */}
      <div className="flex-1 w-full overflow-auto flex justify-center p-8 custom-scrollbar bg-black/20 shadow-inner relative" id="pdf-container">
        
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center gap-2 text-white/70 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Loader2 className="animate-spin" /> Loading PDF...
            </div>
          }
          error={
            <div className="text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              Failed to load PDF.
            </div>
          }
          className="flex flex-col gap-4 py-4"
        >
          <div className="relative shadow-2xl border-[1px] border-white/10 transition-all duration-200">
             <Page 
               pageNumber={pageNumber} 
               rotate={rotation} 
               scale={scale} 
               renderTextLayer={false} 
               renderAnnotationLayer={false}
               className="bg-white"
             />
          </div>
        </Document>
      </div>

    </div>
  );
}