"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import GlassCard from "@/components/GlassCard";
import { 
  rotatePDF, mergePDFs, splitPDF, protectPDF, 
  compressPDF, imagesToPDF, addWatermark, addPageNumbers 
} from "@/lib/pdf-actions";
import { 
  FileText, Layers, Scissors, RotateCw, Image as ImageIcon, 
  ShieldCheck, Zap, UploadCloud, X, Download, Loader2, Plus, 
  Trash2, ArrowUp, ArrowDown, Info, Lock, Stamp, Hash
} from "lucide-react";
import { useDropzone } from "react-dropzone";

const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => <div className="text-white/50 flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Loading Viewer...</div>,
});

const tools = [
  { id: "merge", name: "Merge PDF", icon: Layers, desc: "Combine multiple PDFs." },
  { id: "split", name: "Split PDF", icon: Scissors, desc: "Extract pages." },
  { id: "compress", name: "Compress", icon: Zap, desc: "Reduce file size." },
  { id: "convert", name: "Img to PDF", icon: ImageIcon, desc: "JPG/PNG to PDF." },
  { id: "watermark", name: "Watermark", icon: Stamp, desc: "Add overlay text." }, // 👈 NEW
  { id: "numbers", name: "Page Numbers", icon: Hash, desc: "Add 1 of X numbering." }, // 👈 NEW
  { id: "rotate", name: "Rotate", icon: RotateCw, desc: "Rotate pages 90°." },
  { id: "protect", name: "Protect", icon: ShieldCheck, desc: "Add password." },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  
  // States
  const [mergeFiles, setMergeFiles] = useState<File[]>([]); 
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [splitRange, setSplitRange] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [watermarkText, setWatermarkText] = useState<string>(""); // 👈 NEW
  
  const [activeTool, setActiveTool] = useState<string>(""); 
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mergeInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const droppedFile = acceptedFiles[0];
      if (droppedFile.type.startsWith("image/")) {
        setImageFiles(acceptedFiles);
        setFile(null);
        setActiveTool("convert");
      } else {
        setFile(droppedFile);
        setImageFiles([]);
        setRotation(0);
        setMergeFiles([droppedFile]);
        setSplitRange("");
        setPassword("");
        setWatermarkText(""); // Reset
        setActiveTool("");
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"]
    },
    multiple: true
  });

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
    if (toolId === "rotate") setRotation((prev) => (prev + 90) % 360);
    if (toolId === "merge" && mergeFiles.length === 0 && file) setMergeFiles([file]);
  };

  const handleMergeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setMergeFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };
  const removeFile = (index: number, type: 'merge' | 'image') => {
    if (type === 'merge') setMergeFiles(mergeFiles.filter((_, i) => i !== index));
    if (type === 'image') setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  // 💾 MAIN DOWNLOAD LOGIC
  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      if (activeTool === "convert" && imageFiles.length > 0) {
        await imagesToPDF(imageFiles);
        alert("Images Converted! 🖼️");
      }
      else if (activeTool === "merge" && mergeFiles.length > 1) {
        await mergePDFs(mergeFiles);
        alert("Files Merged! 🎉");
      } 
      else if (activeTool === "split" && splitRange && file) {
        await splitPDF(file, splitRange);
        alert("Pages Extracted! ✂️");
      }
      else if (activeTool === "watermark" && watermarkText && file) {
        // 👈 WATERMARK
        await addWatermark(file, watermarkText);
        alert("Watermark Added! 💧");
      }
      else if (activeTool === "numbers" && file) {
        // 👈 PAGE NUMBERS
        await addPageNumbers(file);
        alert("Page Numbers Added! 🔢");
      }
      else if (activeTool === "protect" && password && file) {
        await protectPDF(file, password);
        alert("PDF Encrypted! 🔒");
      }
      else if (activeTool === "compress" && file) {
        await compressPDF(file);
        alert("PDF Optimized! ⚡");
      }
      else if (rotation !== 0 && file) {
        await rotatePDF(file, rotation);
        alert("Rotated PDF Saved! 🚀");
      } 
      else {
        alert("Nothing to save!");
      }
    } catch (error) {
      console.error(error);
      alert("Error processing request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (isProcessing) return "Processing...";
    if (activeTool === "convert") return "Convert PDF";
    if (activeTool === "merge") return "Merge Files";
    if (activeTool === "split") return "Split Files";
    if (activeTool === "watermark") return "Apply Watermark";
    if (activeTool === "numbers") return "Add Numbers";
    if (activeTool === "protect") return "Encrypt File";
    if (activeTool === "compress") return "Compress File";
    return "Download";
  }

  const isImageMode = activeTool === "convert" && imageFiles.length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[120px] pointer-events-none" />

      <input type="file" ref={mergeInputRef} onChange={handleMergeUpload} accept=".pdf" multiple className="hidden" />
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" multiple className="hidden" />

      {/* DASHBOARD */}
      {!file && imageFiles.length === 0 ? (
        <div className="w-full max-w-5xl animate-in fade-in zoom-in duration-500">
           <div className="text-center mb-10 z-10 relative">
            <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 mb-4 tracking-tight">Glass PDF</h1>
            <p className="text-glass-text text-lg max-w-xl mx-auto">Minimal. Secure. Serverless.</p>
          </div>
          <GlassCard className="p-10 mb-12 flex flex-col items-center text-center border-dashed border-2 border-white/10 hover:border-white/30 transition-colors group">
            <div {...getRootProps()} className="cursor-pointer w-full flex flex-col items-center py-8">
              <input {...getInputProps()} />
              <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="w-10 h-10 text-white/80" />
              </div>
              <h3 className="text-2xl font-medium text-white mb-2">{isDragActive ? "Drop it here..." : "Upload PDF or Images"}</h3>
              <p className="text-glass-text mb-6">Drag & drop or click to browse</p>
              <button className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all shadow-lg">Select File</button>
            </div>
          </GlassCard>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map((tool) => (
              <GlassCard 
                key={tool.id} 
                hoverEffect={true} 
                className="p-5 flex flex-col items-start gap-3 group"
                onClick={() => { if (tool.id === "convert") imageInputRef.current?.click(); }}
              >
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors"><tool.icon className="w-5 h-5 text-white" /></div>
                <div><h3 className="text-base font-semibold text-white/90">{tool.name}</h3><p className="text-xs text-glass-text mt-1">{tool.desc}</p></div>
              </GlassCard>
            ))}
          </div>
        </div>
      ) : (
        // EDITOR
        <GlassCard className="w-full max-w-7xl h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
          <div className="h-16 border-b border-glass-border flex items-center justify-between px-6 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                {isImageMode ? <ImageIcon className="w-5 h-5 text-purple-200" /> : <FileText className="w-5 h-5 text-red-200" />}
              </div>
              <span className="text-white font-medium tracking-wide">
                {isImageMode ? `${imageFiles.length} Images Selected` : file?.name}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
               {isImageMode && <span className="text-xs text-purple-400 font-medium px-2 py-1 bg-purple-400/10 rounded border border-purple-400/20 animate-pulse">Ready to Convert</span>}

               <button 
                  onClick={handleDownload}
                  disabled={isProcessing || (activeTool === 'watermark' && !watermarkText)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
               >
                 {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                 {getButtonText()}
               </button>
               
               <div className="h-6 w-px bg-white/10 mx-2"></div>
               <button onClick={() => {setFile(null); setImageFiles([]); setActiveTool(""); setMergeFiles([]);}} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                 <X className="w-5 h-5 text-white/60 group-hover:text-red-400" />
               </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-80 border-r border-glass-border p-4 flex flex-col gap-2 bg-black/10 overflow-y-auto">
               <p className="text-xs font-bold text-glass-text uppercase tracking-wider mb-4 mt-2 ml-2">Tools</p>
               
               {isImageMode ? (
                 <div className="flex flex-col gap-2">
                   {/* Image Tools UI (Same as before) */}
                   <button className="flex items-center gap-3 p-3 rounded-lg bg-white/20 text-white text-sm text-left"><ImageIcon className="w-4 h-4" /> Selected Images</button>
                   <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 flex flex-col gap-2">
                      <button onClick={() => imageInputRef.current?.click()} className="text-xs flex items-center justify-center gap-2 text-purple-300 bg-purple-500/10 px-3 py-3 rounded-md border border-purple-500/20 w-full hover:bg-purple-500/20 transition-all"><Plus className="w-3 h-3" /> Add More Images</button>
                      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {imageFiles.map((img, idx) => (
                           <div key={idx} className="bg-white/5 p-2 rounded border border-white/10 flex items-center justify-between group/item">
                             <div className="flex items-center gap-2 overflow-hidden"><span className="text-xs text-white/50 w-4">{idx + 1}.</span><span className="text-xs text-white truncate max-w-[120px]">{img.name}</span></div>
                             <button onClick={() => removeFile(idx, 'image')} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                           </div>
                        ))}
                      </div>
                   </div>
                 </div>
               ) : (
                 tools.map(tool => (
                    <div key={tool.id} className="flex flex-col">
                     <button onClick={() => handleToolClick(tool.id)} className={`flex items-center gap-3 p-3 rounded-lg transition-all text-sm text-left group ${activeTool === tool.id ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"}`}>
                       <tool.icon className="w-4 h-4 opacity-70 group-hover:opacity-100" /> {tool.name}
                     </button>
                     
                     {/* MERGE UI */}
                     {activeTool === "merge" && tool.id === "merge" && (
                       <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                         <button onClick={() => mergeInputRef.current?.click()} className="text-xs flex items-center justify-center gap-2 text-blue-300 hover:text-blue-200 bg-blue-500/10 px-3 py-3 rounded-md border border-blue-500/20 w-full transition-colors mb-2"><Plus className="w-3 h-3" /> Add PDF Files</button>
                         <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                           {mergeFiles.map((f, index) => (
                             <div key={index} className="bg-white/5 p-2 rounded border border-white/10 flex items-center justify-between group/item">
                               <div className="flex items-center gap-2 overflow-hidden"><span className="text-xs text-white/50 w-4">{index + 1}.</span><span className="text-xs text-white truncate max-w-[100px]">{f.name}</span></div>
                               <button onClick={() => removeFile(index, 'merge')} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* WATERMARK UI (NEW) */}
                     {activeTool === "watermark" && tool.id === "watermark" && (
                       <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                         <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                           <label className="text-[10px] text-glass-text uppercase font-bold tracking-wider mb-2 block">Watermark Text</label>
                           <input type="text" placeholder="e.g. CONFIDENTIAL" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="w-full bg-black/20 border border-glass-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-white/20" />
                         </div>
                       </div>
                     )}

                     {/* NUMBERS UI (NEW) */}
                     {activeTool === "numbers" && tool.id === "numbers" && (
                       <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                         <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                           <div className="flex items-start gap-2">
                             <Info className="w-4 h-4 text-white/50 mt-0.5" />
                             <p className="text-[11px] text-white/70 leading-tight">Adds "1 of X" at the bottom center of every page.</p>
                           </div>
                         </div>
                       </div>
                     )}

                     {/* SPLIT UI */}
                     {activeTool === "split" && tool.id === "split" && (
                       <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                         <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                           <label className="text-[10px] text-glass-text uppercase font-bold tracking-wider mb-2 block">Enter Page Numbers</label>
                           <input type="text" placeholder="e.g. 1, 3-5" value={splitRange} onChange={(e) => setSplitRange(e.target.value)} className="w-full bg-black/20 border border-glass-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-white/20" />
                         </div>
                       </div>
                     )}
                     
                     {/* PROTECT UI */}
                     {activeTool === "protect" && tool.id === "protect" && (
                       <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                            <label className="text-[10px] text-glass-text uppercase font-bold tracking-wider mb-2 block">Set Password</label>
                            <input type="password" placeholder="Required" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 border border-glass-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-white/20" />
                          </div>
                       </div>
                     )}
                   </div>
                 ))
               )}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-black/20 flex items-center justify-center p-8 overflow-auto relative">
               <div className="absolute inset-0 opacity-[0.1] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
               <div className="relative z-10 transition-transform duration-300">
                  {isImageMode && imageFiles.length > 0 ? (
                    <div className="w-[500px] h-[600px] bg-white p-4 shadow-2xl flex flex-col items-center justify-center gap-4">
                       <img src={URL.createObjectURL(imageFiles[0])} alt="Preview" className="max-w-full max-h-[500px] object-contain shadow-md" />
                       <p className="text-black/50 text-xs">Preview of first image</p>
                    </div>
                  ) : (
                    <PDFViewer file={file} rotation={rotation} />
                  )}
               </div>
            </div>
          </div>
        </GlassCard>
      )}
    </main>
  );
}