import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const ImageViewer = ({ image, scale, edits, isComparing }) => {
  const constraintsRef = useRef(null);

  if (!image) return null;

  // Logic: If comparing, remove color filters but keep rotation/flip so user can check pixels
  const activeBrightness = isComparing ? 100 : edits.brightness;
  const activeContrast = isComparing ? 100 : edits.contrast;
  const activeSaturation = isComparing ? 100 : edits.saturation;
  const activeBlur = isComparing ? 0 : edits.blur;

  const filterString = `
    brightness(${activeBrightness}%) 
    contrast(${activeContrast}%) 
    saturate(${activeSaturation}%) 
    blur(${activeBlur}px)
  `;

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/90 backdrop-blur-sm"
      ref={constraintsRef}
    >
      <motion.img
        src={image}
        alt="Preview"
        drag={scale > 1} 
        dragConstraints={constraintsRef} 
        dragElastic={0.1}
        
        animate={{ 
          scale: scale, 
          rotate: edits.rotation,
          scaleX: edits.flipH ? -1 : 1, 
          scaleY: edits.flipV ? -1 : 1, 
          filter: filterString
        }}
        
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        
        className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl cursor-grab active:cursor-grabbing"
        draggable="false" 
      />
      
      {/* Compare Indicator Label */}
      {isComparing && (
        <div className="absolute top-10 px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg tracking-wider z-20">
          ORIGINAL
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
    </div>
  );
};

export default ImageViewer;