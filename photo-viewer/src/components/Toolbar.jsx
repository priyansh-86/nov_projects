import React, { useState } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCw, RefreshCcw, 
  Sun, Download, Sliders, Crop, Aperture, MoveHorizontal, 
  MoveVertical, Droplet, Contrast, Palette, Eye, Eraser, Undo2, Zap, Layers, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Toolbar = ({ 
  edits, setEdits, onReset, scale, setScale, 
  isFullscreen, toggleFullscreen, onDownload, setIsComparing,
  onRemoveBackground, onRestoreOriginal, isRemovingBg, hasOriginal
}) => {
  const [activeTab, setActiveTab] = useState('adjust'); 
  const [bgModel, setBgModel] = useState('medium'); // Default model choice

  const updateEdit = (key, value) => setEdits(prev => ({ ...prev, [key]: value }));
  const toggleFlip = (axis) => setEdits(prev => ({ ...prev, [axis]: !prev[axis] }));

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="
        fixed 
        bottom-4 md:bottom-6
        left-0 right-0
        z-50
        flex flex-col items-center gap-3
        px-4
        pointer-events-none
      "
    >
      {/* Tabs Container */}
      <div className="
        flex 
        bg-black/60 backdrop-blur-md 
        border border-white/10 
        rounded-full 
        p-1 gap-1 
        shadow-lg 
        pointer-events-auto
        max-w-[380px] w-full
      ">
        <TabButton active={activeTab === 'adjust'} onClick={() => setActiveTab('adjust')} icon={<Sliders size={14} />} label="Adjust" />
        <TabButton active={activeTab === 'transform'} onClick={() => setActiveTab('transform')} icon={<Crop size={14} />} label="Transform" />
        <TabButton active={activeTab === 'filters'} onClick={() => setActiveTab('filters')} icon={<Aperture size={14} />} label="Filters" />
        <TabButton active={activeTab === 'effects'} onClick={() => setActiveTab('effects')} icon={<Eraser size={14} />} label="Effects" />
      </div>

      {/* Main Controls Container */}
      <div className="
        flex flex-col items-center gap-3 
        px-4 md:px-5 py-4 
        bg-black/80 backdrop-blur-xl 
        border border-white/10 
        rounded-3xl 
        shadow-2xl 
        text-white 
        pointer-events-auto
        max-w-[420px] w-full
      ">
        <AnimatePresence mode='wait'>
          {activeTab === 'adjust' && (
            <motion.div 
              key="adjust" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="grid grid-cols-2 gap-x-4 gap-y-3 w-full"
            >
              <SliderControl label="Bright" icon={<Sun size={12}/>} value={edits.brightness} min={50} max={150} onChange={(v) => updateEdit('brightness', v)} />
              <SliderControl label="Contr" icon={<Contrast size={12}/>} value={edits.contrast} min={50} max={150} onChange={(v) => updateEdit('contrast', v)} />
              <SliderControl label="Sat" icon={<Palette size={12}/>} value={edits.saturation} min={0} max={200} onChange={(v) => updateEdit('saturation', v)} />
              <SliderControl label="Blur" icon={<Droplet size={12}/>} value={edits.blur} min={0} max={10} step={0.5} onChange={(v) => updateEdit('blur', v)} />
            </motion.div>
          )}

          {activeTab === 'transform' && (
            <motion.div 
              key="transform" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex flex-wrap items-center justify-center gap-3 w-full"
            >
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
            <motion.div 
              key="filters" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex items-center gap-2 w-full overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <FilterBtn name="Normal" onClick={onReset} />
              <FilterBtn name="B&W" onClick={() => setEdits({...edits, saturation: 0, contrast: 110})} />
              <FilterBtn name="Warm" onClick={() => setEdits({...edits, brightness: 105, saturation: 120})} />
              <FilterBtn name="Cool" onClick={() => setEdits({...edits, brightness: 95, contrast: 120})} />
              <FilterBtn name="Vintage" onClick={() => setEdits({...edits, saturation: 60, contrast: 130, brightness: 90})} />
            </motion.div>
          )}

          {activeTab === 'effects' && (
            <motion.div 
              key="effects" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex flex-col items-center gap-3 w-full"
            >
              {/* Model Selector Buttons */}
              <div className="w-full flex justify-between gap-2 p-1 bg-white/5 rounded-xl">
                 <ModelBtn 
                   label="Small" 
                   sub="Fast" 
                   icon={<Zap size={12}/>} 
                   active={bgModel === 'small'} 
                   onClick={() => setBgModel('small')} 
                 />
                 <ModelBtn 
                   label="Medium" 
                   sub="Balance" 
                   icon={<Layers size={12}/>} 
                   active={bgModel === 'medium'} 
                   onClick={() => setBgModel('medium')} 
                 />
                 <ModelBtn 
                   label="Large" 
                   sub="Quality" 
                   icon={<Star size={12}/>} 
                   active={bgModel === 'large'} 
                   onClick={() => setBgModel('large')} 
                 />
              </div>

              <button
                onClick={() => onRemoveBackground(bgModel)}
                disabled={isRemovingBg}
                className="
                  w-full flex items-center justify-center gap-2 
                  px-4 py-3 
                  bg-gradient-to-r from-purple-500/20 to-pink-500/20
                  hover:from-purple-500/30 hover:to-pink-500/30
                  border border-purple-500/30
                  rounded-xl 
                  text-sm font-medium 
                  transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Eraser size={18} />
                <span>{isRemovingBg ? 'Processing...' : 'Remove Background'}</span>
              </button>

              {hasOriginal && (
                <button
                  onClick={onRestoreOriginal}
                  className="
                    w-full flex items-center justify-center gap-2 
                    px-4 py-3 
                    bg-white/5
                    hover:bg-white/10
                    border border-white/10
                    rounded-xl 
                    text-sm font-medium 
                    transition-all
                  "
                >
                  <Undo2 size={18} />
                  <span>Restore Original</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-px bg-white/10 my-1"></div>
        
        {/* Bottom Actions */}
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex gap-2">
            <ControlButton onClick={onReset} icon={<RefreshCcw size={16} />} />
            <button 
              onTouchStart={() => setIsComparing(true)} 
              onTouchEnd={() => setIsComparing(false)}
              onMouseDown={() => setIsComparing(true)} 
              onMouseUp={() => setIsComparing(false)}
              className="p-2.5 rounded-full hover:bg-white/10 text-white/80 transition-all active:bg-blue-500 active:text-white"
            >
              <Eye size={16} />
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }} 
            onClick={onDownload}
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
  <button 
    onClick={onClick} 
    className={`
      flex items-center gap-1.5 
      px-2.5 py-1.5 
      rounded-full 
      text-[10px] font-medium 
      transition-all 
      flex-1 justify-center
      ${active ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10'}
    `}
  >
    {icon} <span className="hidden xs:inline">{label}</span>
  </button>
);

const ModelBtn = ({ label, sub, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center
      flex-1 py-2 rounded-lg gap-0.5
      transition-all duration-200
      ${active ? 'bg-white text-black shadow-md scale-[1.02]' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}
    `}
  >
    <div className="flex items-center gap-1 mb-0.5">
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </div>
    <span className="text-[9px] opacity-70 uppercase tracking-wider">{sub}</span>
  </button>
);

const SliderControl = ({ label, icon, value, min, max, step = 1, onChange }) => (
  <div className="flex flex-col gap-1.5 min-w-0">
    <div className="flex items-center justify-between text-[10px] text-white/60">
      <span className="flex items-center gap-1">{icon} {label}</span>
      <span>{value}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))} 
      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" 
    />
  </div>
);

const ControlButton = ({ onClick, icon, active }) => (
  <button 
    onClick={onClick} 
    className={`
      p-2 rounded-full 
      transition-all 
      ${active ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}
    `}
  >
    {icon}
  </button>
);

const FilterBtn = ({ name, onClick }) => (
  <button 
    onClick={onClick} 
    className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-white/80 whitespace-nowrap hover:bg-white/10 transition-colors"
  >
    {name}
  </button>
);

export default Toolbar;