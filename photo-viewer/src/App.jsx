import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, UserCircle2 } from 'lucide-react';

import DropZone from './components/DropZone';
import ImageViewer from './components/ImageViewer';
import Toolbar from './components/Toolbar';
import ContactModal from './components/ContactModal';

function App() {
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const defaultEdits = { brightness: 100, contrast: 100, saturation: 100, blur: 0, rotation: 0, flipH: false, flipV: false };
  const [edits, setEdits] = useState(defaultEdits);
  const [meta, setMeta] = useState({ name: '', size: '', dimensions: '' });

  useEffect(() => { document.title = image ? `Editing: ${meta.name}` : "PRIYANSH | Image View"; }, [image, meta.name]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showContact) { setShowContact(false); return; }
      if (!image) return;
      switch(e.key) {
        case 'Escape': handleClose(); break;
        case '+': case '=': setScale(s => Math.min(s + 0.2, 4)); break;
        case '-': setScale(s => Math.max(s - 0.2, 0.5)); break;
        case 'r': case 'R': setEdits(prev => ({...prev, rotation: prev.rotation + 90})); break;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleDownload(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, edits, showContact]);

  const handleFileSelect = (file) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setMeta({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB', dimensions: `${img.naturalWidth} x ${img.naturalHeight} px` });
    };
    img.src = objectUrl;
    setImage(objectUrl);
    resetTools();
  };

  const resetTools = () => { setScale(1); setEdits(defaultEdits); setIsComparing(false); };
  const handleClose = () => { setImage(null); resetTools(); };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); } 
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const handleDownload = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => {
      const isRotatedSide = edits.rotation % 180 !== 0;
      canvas.width = isRotatedSide ? img.height : img.width;
      canvas.height = isRotatedSide ? img.width : img.height;
      ctx.filter = `brightness(${edits.brightness}%) contrast(${edits.contrast}%) saturate(${edits.saturation}%) blur(${edits.blur}px)`;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((edits.rotation * Math.PI) / 180);
      ctx.scale(edits.flipH ? -1 : 1, edits.flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const link = document.createElement('a');
      link.download = `PRIYANSH-EDIT-${meta.name}`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-blue-500/30">
      <AnimatePresence>
        {image && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 z-0 pointer-events-none">
            <img src={image} alt="ambient" className="w-full h-full object-cover blur-[120px] scale-150 opacity-25 saturate-150" />
            <div className="absolute inset-0 bg-black/40"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
          <span className="font-bold tracking-tight text-sm md:text-lg uppercase text-white/90 drop-shadow-lg">PRIYANSH <span className="hidden sm:inline">| Image View</span></span>
          {image && (
            <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1 bg-black/20 backdrop-blur-md border border-white/5 rounded-full text-xs text-white/70 shadow-lg">
               <span>{meta.dimensions}</span><span className="w-1 h-1 bg-white/20 rounded-full"></span><span>{meta.size}</span>
            </div>
          )}
        </div>
        <div className="pointer-events-auto flex items-center gap-2 md:gap-3">
           <button onClick={() => setShowContact(true)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-black/20 hover:bg-white/10 border border-white/5 rounded-full text-xs md:text-sm font-medium transition-all backdrop-blur-md shadow-lg group">
             <UserCircle2 size={16} className="text-white/80 group-hover:text-white" /><span className="hidden sm:inline text-white/90 group-hover:text-white">Connect</span>
           </button>
           <AnimatePresence>
            {image && (
                <motion.button initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} onClick={handleClose} className="bg-black/20 hover:bg-red-500/20 hover:text-red-400 border border-white/5 p-1.5 md:p-2 rounded-full backdrop-blur-md transition-all shadow-lg">
                <X size={18} />
                </motion.button>
            )}
           </AnimatePresence>
        </div>
      </nav>

      <AnimatePresence>{showContact && <ContactModal onClose={() => setShowContact(false)} />}</AnimatePresence>

      <div className="w-full h-full flex items-center justify-center z-10 relative">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full">
              <DropZone onFileSelect={handleFileSelect} />
            </motion.div>
          ) : (
            <motion.div key="viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative">
              <ImageViewer image={image} scale={scale} edits={edits} isComparing={isComparing} />
              <Toolbar edits={edits} setEdits={setEdits} scale={scale} setScale={setScale} onReset={resetTools} isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} onDownload={handleDownload} setIsComparing={setIsComparing} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;