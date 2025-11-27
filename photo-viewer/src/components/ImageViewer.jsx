import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const ImageViewer = ({ image, scale, edits, isComparing }) => {
  const constraintsRef = useRef(null);

  if (!image) return null;

  const activeBrightness = isComparing ? 100 : edits.brightness;
  const activeContrast = isComparing ? 100 : edits.contrast;
  const activeSaturation = isComparing ? 100 : edits.saturation;
  const activeBlur = isComparing ? 0 : edits.blur;

  return (
    <div 
      // Mobile Fix: pb-40 pushes image up
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent pb-40 md:pb-0"
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
          filter: `brightness(${activeBrightness}%) contrast(${activeContrast}%) saturate(${activeSaturation}%) blur(${activeBlur}px)`
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        
        // Mobile Fix: Reduced max-height for phones
        className="max-w-[90vw] max-h-[60vh] md:max-h-[85vh] object-contain shadow-2xl cursor-grab active:cursor-grabbing"
        draggable="false" 
      />
      
      {isComparing && (
        <div className="absolute top-20 md:top-10 px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg tracking-wider z-20">
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