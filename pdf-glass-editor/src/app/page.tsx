"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import GlassCard from "@/components/GlassCard";
import { 
  rotatePDF, mergePDFs, splitPDF, protectPDF, 
  compressPDF, imagesToPDF, addWatermark, addPageNumbers, addSignature 
} from "@/lib/pdf-actions";
import { 
  FileText, Layers, Scissors, RotateCw, Image as ImageIcon, 
  ShieldCheck, Zap, UploadCloud, X, Download, Loader2, Plus, 
  Trash2, Info, Lock, Stamp, Hash, PenTool, GripVertical, Eraser,
  Globe, Github, Instagram, Twitter, Mail, Send, ExternalLink, User
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import SignatureCanvas from "react-signature-canvas";

const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => <div className="text-white/50 flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Loading Viewer...</div>,
});

// Social Links Configuration
const SOCIAL_LINKS = [
  { name: "Portfolio", icon: Globe, url: "https://priyanshrajbhar.vercel.app/" },
  { name: "GitHub", icon: Github, url: "https://github.com/priyansh-86" },
  { name: "Instagram", icon: Instagram, url: "https://instagram.com/priyansh__.86" },
  { name: "X (Twitter)", icon: Twitter, url: "https://x.com/priyansh_86" },
  { name: "Telegram", icon: Send, url: "https://t.me/priyansh_dev" },
  { name: "Email", icon: Mail, url: "mailto:priyanshrajbhar499@gmail.com" },
];

const tools = [
  { id: "merge", name: "Merge PDF", icon: Layers, desc: "Combine multiple PDFs." },
  { id: "split", name: "Split PDF", icon: Scissors, desc: "Extract pages." },
  { id: "sign", name: "Sign PDF", icon: PenTool, desc: "Draw signature." },
  { id: "compress", name: "Compress", icon: Zap, desc: "Reduce file size." },
  { id: "convert", name: "Img to PDF", icon: ImageIcon, desc: "JPG/PNG to PDF." },
  { id: "watermark", name: "Watermark", icon: Stamp, desc: "Add overlay text." },
  { id: "numbers", name: "Page Numbers", icon: Hash, desc: "Add 1 of X numbering." },
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
  const [watermarkText, setWatermarkText] = useState<string>(""); 
  
  // UI States
  const [showSignPad, setShowSignPad] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false); // 👈 Contact Modal State
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  
  const [activeTool, setActiveTool] = useState<string>(""); 
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mergeInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(mergeFiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setMergeFiles(items);
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const droppedFile = acceptedFiles[0];
      if (droppedFile.type.startsWith("image/")) {
        setImageFiles(acceptedFiles);
        setFile(null);
        setActiveTool("convert");
        toast.success("Images Loaded!");
      } else {
        setFile(droppedFile);
        setImageFiles([]);
        setRotation(0);
        setMergeFiles([droppedFile]);
        setSplitRange("");
        setPassword("");
        setWatermarkText("");
        setShowSignPad(false);
        setActiveTool("");
        toast.success("PDF Loaded!");
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
    if (toolId === "sign") setShowSignPad(true);
  };

  const handleMergeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMergeFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      toast.success("Files added!");
    }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };
  const removeFile = (index: number, type: 'merge' | 'image') => {
    if (type === 'merge') setMergeFiles(mergeFiles.filter((_, i) => i !== index));
    if (type === 'image') setImageFiles(imageFiles.filter((_, i) => i !== index));
    toast("File removed", { icon: '🗑️' });
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    const loadingToast = toast.loading("Processing...");

    try {
      let success = false;

      if (activeTool === "convert" && imageFiles.length > 0) {
        success = await imagesToPDF(imageFiles);
        if(success) toast.success("Images Converted! 🖼️");
      }
      else if (activeTool === "merge" && mergeFiles.length > 1) {
        success = await mergePDFs(mergeFiles);
        if(success) toast.success("Files Merged! 🎉");
      } 
      else if (activeTool === "split" && splitRange && file) {
        success = await splitPDF(file, splitRange);
        if(success) toast.success("Pages Extracted! ✂️");
      }
      else if (activeTool === "watermark" && watermarkText && file) {
        success = await addWatermark(file, watermarkText);
        if(success) toast.success("Watermark Added! 💧");
      }
      else if (activeTool === "numbers" && file) {
        success = await addPageNumbers(file);
        if(success) toast.success("Page Numbers Added! 🔢");
      }
      else if (activeTool === "sign" && file) {
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
          const signatureData = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
          success = await addSignature(file, signatureData);
          if(success) toast.success("PDF Signed! ✍️");
        } else {
          toast.error("Please draw a signature first!");
        }
      }
      else if (activeTool === "protect" && password && file) {
        success = await protectPDF(file, password);
        if(success) toast.success("PDF Encrypted! 🔒");
      }
      else if (activeTool === "compress" && file) {
        success = await compressPDF(file);
        if(success) toast.success("PDF Optimized! ⚡");
      }
      else if (rotation !== 0 && file) {
        success = await rotatePDF(file, rotation);
        if(success) toast.success("Rotated PDF Saved! 🚀");
      } 
      else {
        toast.error("Nothing to save!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error processing file.");
    } finally {
      toast.dismiss(loadingToast);
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (isProcessing) return "Processing...";
    if (activeTool === "convert") return "Convert PDF";
    if (activeTool === "merge") return "Merge Files";
    if (activeTool === "sign") return "Apply Signature";
    if (activeTool === "protect") return "Encrypt File";
    return "Download";
  }

  const isImageMode = activeTool === "convert" && imageFiles.length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* 🔹 CONNECT BUTTON (Fixed Top Right) */}
      <button 
        onClick={() => setIsContactOpen(true)}
        className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full transition-all text-white text-sm font-medium shadow-lg hover:shadow-white/5"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Connect</span>
      </button>

      <input type="file" ref={mergeInputRef} onChange={handleMergeUpload} accept=".pdf" multiple className="hidden" />
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" multiple className="hidden" />

      {/* ==================== CONTACT MODAL ==================== */}
      {isContactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-0 relative overflow-hidden shadow-2xl border-white/20">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-bold text-white">Let's Connect</h2>
              <button onClick={() => setIsContactOpen(false)} className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Links Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/20">
              {SOCIAL_LINKS.map((link) => (
                <a 
                  key={link.name} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                >
                  <div className="p-2 rounded-full bg-white/10 group-hover:scale-110 transition-transform">
                    <link.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">{link.name}</span>
                    <span className="text-[10px] text-white/40">View Profile</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/20 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 text-center">
              <p className="text-xs text-white/30">Developed by <span className="text-white/60 font-medium">Priyansh</span> 🚀</p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ==================== DASHBOARD VIEW ==================== */}
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
        // ==================== EDITOR VIEW ====================
        <GlassCard className="w-full max-w-7xl h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-500 relative">
          
          {/* Top Bar */}
          <div className="h-16 border-b border-glass-border flex items-center justify-between px-6 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                {isImageMode ? <ImageIcon className="w-5 h-5 text-purple-200" /> : <FileText className="w-5 h-5 text-red-200" />}
              </div>
              <span className="text-white font-medium tracking-wide">
                {isImageMode ? `${imageFiles.length} Images` : file?.name}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                  onClick={handleDownload}
                  disabled={isProcessing}
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
            {/* Sidebar Tools */}
            <div className="w-80 border-r border-glass-border p-4 flex flex-col gap-2 bg-black/10 overflow-y-auto">
               <p className="text-xs font-bold text-glass-text uppercase tracking-wider mb-4 mt-2 ml-2">Tools</p>
               
               {isImageMode ? (
                 <div className="flex flex-col gap-2">
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
                     
                     {/* MERGE UI WITH DRAG & DROP */}
                     {activeTool === "merge" && tool.id === "merge" && (
                       <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                         <button onClick={() => mergeInputRef.current?.click()} className="text-xs flex items-center justify-center gap-2 text-blue-300 hover:text-blue-200 bg-blue-500/10 px-3 py-3 rounded-md border border-blue-500/20 w-full transition-colors mb-2"><Plus className="w-3 h-3" /> Add PDF Files</button>
                         
                         <DragDropContext onDragEnd={onDragEnd}>
                           <Droppable droppableId="merge-list">
                             {(provided) => (
                               <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                 {mergeFiles.map((f, index) => (
                                   <Draggable key={f.name + index} draggableId={f.name + index} index={index}>
                                     {(provided) => (
                                       <div 
                                         ref={provided.innerRef}
                                         {...provided.draggableProps}
                                         className="bg-white/5 p-2 rounded border border-white/10 flex items-center justify-between group/item"
                                       >
                                         <div className="flex items-center gap-2 overflow-hidden">
                                           <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white">
                                              <GripVertical className="w-4 h-4" />
                                           </div>
                                           <span className="text-xs text-white/50 w-4">{index + 1}.</span>
                                           <span className="text-xs text-white truncate max-w-[100px]">{f.name}</span>
                                         </div>
                                         <button onClick={() => removeFile(index, 'merge')} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                                       </div>
                                     )}
                                   </Draggable>
                                 ))}
                                 {provided.placeholder}
                               </div>
                             )}
                           </Droppable>
                         </DragDropContext>
                       </div>
                     )}

                     {/* SIGN UI */}
                     {activeTool === "sign" && tool.id === "sign" && (
                        <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                            <p className="text-[11px] text-white/70 mb-2">Draw your signature below.</p>
                            <div className="border border-white/20 rounded bg-white">
                              <SignatureCanvas 
                                ref={sigCanvasRef}
                                penColor="black"
                                canvasProps={{width: 230, height: 100, className: 'sigCanvas'}} 
                              />
                            </div>
                            <button onClick={() => sigCanvasRef.current?.clear()} className="text-[10px] text-red-400 mt-2 flex items-center gap-1 hover:underline"><Eraser className="w-3 h-3" /> Clear Signature</button>
                          </div>
                        </div>
                     )}
                     
                     {/* SPLIT UI */}
                     {activeTool === "split" && tool.id === "split" && (
                       <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                         <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                           <label className="text-[10px] text-glass-text uppercase font-bold tracking-wider mb-2 block">Pages (e.g. 1-3)</label>
                           <input type="text" placeholder="e.g. 1, 3-5" value={splitRange} onChange={(e) => setSplitRange(e.target.value)} className="w-full bg-black/20 border border-glass-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-white/20" />
                         </div>
                       </div>
                     )}
                     {activeTool === "watermark" && tool.id === "watermark" && (
                       <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                         <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                           <label className="text-[10px] text-glass-text uppercase font-bold tracking-wider mb-2 block">Text</label>
                           <input type="text" placeholder="e.g. DRAFT" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="w-full bg-black/20 border border-glass-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-white/20" />
                         </div>
                       </div>
                     )}
                     {activeTool === "protect" && tool.id === "protect" && (
                       <div className="ml-2 pl-2 border-l-2 border-white/10 mt-2 mb-2 animate-in slide-in-from-left-2 flex flex-col gap-2">
                          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                            <label className="text-[10px] text-glass-text uppercase font-bold tracking-wider mb-2 block">Password</label>
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
                    file && <PDFViewer file={file} rotation={rotation} />
                  )}
               </div>
            </div>
          </div>
        </GlassCard>
      )}
    </main>
  );
}