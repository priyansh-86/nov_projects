import React, { useState } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCw, Maximize, Minimize, RefreshCcw, 
  Sun, Download, Sliders, Crop, Aperture, MoveHorizontal, 
  MoveVertical, Droplet, Contrast, Palette, Eye 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Toolbar = ({ 
  edits, setEdits, onReset, scale, setScale, 
  isFullscreen, toggleFullscreen, onDownload, setIsComparing 
}) => {
  const [activeTab, setActiveTab] = useState('adjust'); 
  const updateEdit = (key, value) => setEdits(prev => ({ ...prev, [key]: value }));
  const toggleFlip = (axis) => setEdits(prev => ({ ...prev, [axis]: !prev[axis] }));

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      // Yahan className ko responsive aur fully centered banaya gaya hai!
      className="
        fixed bottom-3 left-1/2 -translate-x-1/2 z-50
        flex flex-col items-center gap-3
        w-full max-w-md px-2
        md:bottom-6
      "
    >
      <div className="flex bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 gap-1 shadow-lg overflow-x-auto max-w-full no-scrollbar">
        <TabButton active={activeTab === 'adjust'} onClick={() => setActiveTab('adjust')} icon={<Sliders size={14} />} label="Adjust" />
        <TabButton active={activeTab === 'transform'} onClick={() => setActiveTab('transform')} icon={<Crop size={14} />} label="Transform" />
        <TabButton active={activeTab === 'filters'} onClick={() => setActiveTab('filters')} icon={<Aperture size={14} />} label="Filters" />
      </div>

      <div className="flex flex-col items-center gap-3 px-4 md:px-5 py-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl text-white w-full">
        <AnimatePresence mode='wait'>
          {activeTab === 'adjust' && (
            <motion.div key="adjust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-x-4 gap-y-3 w-full">
              <SliderControl label="Bright" icon={<Sun size={12}/>} value={edits.brightness} min={50} max={150} onChange={(v) => updateEdit('brightness', v)} />
              <SliderControl label="Contr" icon={<Contrast size={12}/>} value={edits.contrast} min={50} max={150} onChange={(v) => updateEdit('contrast', v)} />
              <SliderControl label="Sat" icon={<Palette size={12}/>} value={edits.saturation} min={0} max={200} onChange={(v) => updateEdit('saturation', v)} />
              <SliderControl label="Blur" icon={<Droplet size={12}/>} value={edits.blur} min={0} max={10} step={0.5} onChange={(v) => updateEdit('blur', v)} />
            </motion.div>
          )}

          {activeTab === 'transform' && (
            <motion.div key="transform" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center justify-center gap-3 w-full">
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg">
                <ControlButton onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} icon={<ZoomOut size={16}/>} />
                <span className="text-[10px] font-mono w-6 text-center">{Math.round(scale * 100)}%</span>
                <ControlButton onClick={() => setScale(s => Math.min(s + 0.2, 4))} icon={<ZoomIn size={16}/>} />
              </div>
              <ControlButton onClick={() => updateEdit('rotation', edits.rotation + 90)} icon={<RotateCw size={18}/>} />
              <ControlButton onClick={() => toggleFlip('flipH')} icon={<MoveHorizontal size={18}/>} active={edits.flipH} />
              <ControlButton onClick={() => toggleFlip('flipV')} icon={<MoveVertical size={18}/>} active={edits.flipV} />
            </motion.div>
          )}

          {activeTab === 'filters' && (
            <motion.div key="filters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 w-full overflow-x-auto pb-2 no-scrollbar">
              <FilterBtn name="Normal" onClick={onReset} />
              <FilterBtn name="B&W" onClick={() => setEdits({...edits, saturation: 0, contrast: 110})} />
              <FilterBtn name="Warm" onClick={() => setEdits({...edits, brightness: 105, saturation: 120})} />
              <FilterBtn name="Cool" onClick={() => setEdits({...edits, brightness: 95, contrast: 120})} />
              <FilterBtn name="Vintage" onClick={() => setEdits({...edits, saturation: 60, contrast: 130, brightness: 90})} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-px bg-white/10 my-1"></div>
        
        <div className="flex items-center justify-between w-full">
           <div className="flex gap-2">
             <ControlButton onClick={onReset} icon={<RefreshCcw size={16} />} />
             <button 
               onTouchStart={() => setIsComparing(true)} onTouchEnd={() => setIsComparing(false)}
               onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)}
               className="p-2.5 rounded-full hover:bg-white/10 text-white/80 transition-all active:bg-blue-500 active:text-white"
             >
               <Eye size={16} />
             </button>
           </div>
           <motion.button
              whileTap={{ scale: 0.95 }} onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-gray-200 transition-colors shadow-lg"
           >
             <Download size={14} /> <span>Save</span>
           </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${active ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10'}`}>{icon} {label}</button>
);
const SliderControl = ({ label, icon, value, min, max, step = 1, onChange }) => (
  <div className="flex flex-col gap-1.5 min-w-[100px]">
    <div className="flex items-center justify-between text-[10px] text-white/60"><span className="flex items-center gap-1">{icon} {label}</span><span>{value}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
  </div>
);
const ControlButton = ({ onClick, icon, active }) => (
  <button onClick={onClick} className={`p-2 rounded-full transition-all ${active ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/80'}`}>{icon}</button>
);
const FilterBtn = ({ name, onClick }) => (
  <button onClick={onClick} className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-white/80 whitespace-nowrap">{name}</button>
);

export default Toolbar;
