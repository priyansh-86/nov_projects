"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// Worker Setup (Important for Next.js)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File;
  rotation: number;
}

export default function PDFViewer({ file, rotation }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center">
      {/* PDF Document Renderer */}
      <div className="border-[8px] border-white/10 rounded-lg overflow-hidden shadow-2xl">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center gap-2 text-white p-10">
              <Loader2 className="animate-spin" /> Loading PDF...
            </div>
          }
          error={<div className="text-red-400 p-10">Failed to load PDF.</div>}
        >
          {/* Main Page View */}
          <Page 
            pageNumber={pageNumber} 
            rotate={rotation} // Yahan visual rotation handle ho rahi hai
            renderTextLayer={false} 
            renderAnnotationLayer={false}
            height={600} // Height fix kar di taaki layout na hile
            className="bg-white"
          />
        </Document>
      </div>

      {/* Page Navigation Controls */}
      {numPages > 1 && (
        <div className="flex items-center gap-4 mt-6 bg-glass-highlight px-4 py-2 rounded-full border border-glass-border backdrop-blur-md">
          <button
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30 text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-medium text-white">
            Page {pageNumber} of {numPages}
          </span>

          <button
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30 text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}