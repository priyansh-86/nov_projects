import React, { useState } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCw, 
  Maximize, Minimize, RefreshCcw, 
  Sun, Download, Sliders, Crop, 
  Aperture, MoveHorizontal, MoveVertical, 
  Droplet, Contrast, Palette, Eye 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Toolbar = ({ 
  edits, setEdits, onReset, 
  scale, setScale, 
  isFullscreen, toggleFullscreen, 
  onDownload,
  setIsComparing // New Prop for Compare feature
}) => {
  
  const [activeTab, setActiveTab] = useState('adjust'); 

  const updateEdit = (key, value) => {
    setEdits(prev => ({ ...prev, [key]: value }));
  };

  const toggleFlip = (axis) => {
    setEdits(prev => ({ ...prev, [axis]: !prev[axis] }));
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3"
    >
      {/* TAB SWITCHER */}
      <div className="flex bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 gap-1">
        <TabButton active={activeTab === 'adjust'} onClick={() => setActiveTab('adjust')} icon={<Sliders size={16} />} label="Adjust" />
        <TabButton active={activeTab === 'transform'} onClick={() => setActiveTab('transform')} icon={<Crop size={16} />} label="Transform" />
        <TabButton active={activeTab === 'filters'} onClick={() => setActiveTab('filters')} icon={<Aperture size={16} />} label="Filters" />
      </div>

      {/* MAIN PANEL */}
      <div className="
        flex flex-col items-center gap-4 px-6 py-4 
        bg-black/80 backdrop-blur-xl border border-white/10 
        rounded-3xl shadow-2xl text-white min-w-[320px]
      ">
        
        <AnimatePresence mode='wait'>
          {/* ADJUST TAB */}
          {activeTab === 'adjust' && (
            <motion.div key="adjust" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-x-6 gap-y-4 w-full">
              <SliderControl label="Brightness" icon={<Sun size={14}/>} value={edits.brightness} min={50} max={150} onChange={(v) => updateEdit('brightness', v)} />
              <SliderControl label="Contrast" icon={<Contrast size={14}/>} value={edits.contrast} min={50} max={150} onChange={(v) => updateEdit('contrast', v)} />
              <SliderControl label="Saturation" icon={<Palette size={14}/>} value={edits.saturation} min={0} max={200} onChange={(v) => updateEdit('saturation', v)} />
              <SliderControl label="Blur" icon={<Droplet size={14}/>} value={edits.blur} min={0} max={10} step={0.5} onChange={(v) => updateEdit('blur', v)} />
            </motion.div>
          )}

          {/* TRANSFORM TAB */}
          {activeTab === 'transform' && (
            <motion.div key="transform" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-center gap-4 w-full">
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <ControlButton onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} icon={<ZoomOut size={18}/>} />
                <span className="text-xs font-mono w-8 text-center">{Math.round(scale * 100)}%</span>
                <ControlButton onClick={() => setScale(s => Math.min(s + 0.2, 4))} icon={<ZoomIn size={18}/>} />
              </div>
              <ControlButton onClick={() => updateEdit('rotation', edits.rotation + 90)} icon={<RotateCw size={18}/>} tooltip="Rotate +90°" />
              <ControlButton onClick={() => toggleFlip('flipH')} icon={<MoveHorizontal size={18}/>} tooltip="Flip Horizontal" active={edits.flipH} />
              <ControlButton onClick={() => toggleFlip('flipV')} icon={<MoveVertical size={18}/>} tooltip="Flip Vertical" active={edits.flipV} />
            </motion.div>
          )}

          {/* FILTERS TAB */}
          {activeTab === 'filters' && (
            <motion.div key="filters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-center gap-3 w-full overflow-x-auto pb-1">
              <FilterBtn name="Normal" onClick={onReset} />
              <FilterBtn name="B&W" onClick={() => setEdits({...edits, saturation: 0, contrast: 110})} />
              <FilterBtn name="Warm" onClick={() => setEdits({...edits, brightness: 105, saturation: 120})} />
              <FilterBtn name="Cool" onClick={() => setEdits({...edits, brightness: 95, contrast: 120})} />
              <FilterBtn name="Vintage" onClick={() => setEdits({...edits, saturation: 60, contrast: 130, brightness: 90})} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-px bg-white/10 my-1"></div>
        
        {/* BOTTOM ACTIONS */}
        <div className="flex items-center justify-between w-full">
           <div className="flex gap-2">
             <ControlButton onClick={onReset} icon={<RefreshCcw size={16} />} tooltip="Reset All" />
             
             {/* COMPARE BUTTON (Hold to see original) */}
             <button 
               onMouseDown={() => setIsComparing(true)}
               onMouseUp={() => setIsComparing(false)}
               onMouseLeave={() => setIsComparing(false)}
               className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all active:bg-blue-500 active:text-white"
               title="Hold to Compare"
             >
               <Eye size={16} />
             </button>
           </div>
           
           <div className="flex gap-2">
             <ControlButton 
                onClick={toggleFullscreen} 
                icon={isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />} 
                variant="secondary"
             />
             <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
             >
               <Download size={16} /> Save
             </motion.button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${active ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
    {icon} {label}
  </button>
);

const SliderControl = ({ label, icon, value, min, max, step = 1, onChange }) => (
  <div className="flex flex-col gap-2 min-w-[120px]">
    <div className="flex items-center justify-between text-xs text-white/60">
      <span className="flex items-center gap-1">{icon} {label}</span>
      <span>{value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
  </div>
);

const ControlButton = ({ onClick, icon, tooltip, active, variant = 'default' }) => (
  <button onClick={onClick} title={tooltip} className={`p-2.5 rounded-full transition-all ${active ? 'bg-blue-500 text-white' : variant === 'secondary' ? 'bg-white/10 hover:bg-white/20' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}>
    {icon}
  </button>
);

const FilterBtn = ({ name, onClick }) => (
  <button onClick={onClick} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/20 border border-white/5 text-xs text-white/80 transition-colors whitespace-nowrap">
    {name}
  </button>
);

export default Toolbar;