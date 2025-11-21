import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, FileWarning } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DropZone = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    validateAndPassFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    validateAndPassFile(file);
  };

  const validateAndPassFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <motion.div
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)',
          // FIX: Using explicit rgba instead of 'transparent' to avoid console warnings
          backgroundColor: isDragging ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0)',
        }}
        transition={{ duration: 0.2 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className="
          relative w-full max-w-2xl aspect-video 
          rounded-3xl border-2 border-dashed 
          flex flex-col items-center justify-center gap-4 
          cursor-pointer group hover:border-white/30 transition-colors
        "
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
          accept="image/*"
        />

        <AnimatePresence mode='wait'>
          {error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-red-400"
            >
              <div className="bg-red-500/10 p-4 rounded-full mb-2 mx-auto w-fit">
                <FileWarning size={32} />
              </div>
              <p className="font-medium">Please upload an image file</p>
            </motion.div>
          ) : (
            <motion.div 
              key="normal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className={`
                p-5 rounded-full mb-4 mx-auto w-fit transition-all duration-300
                ${isDragging ? 'bg-white/20 scale-110' : 'bg-white/5 group-hover:bg-white/10'}
              `}>
                {isDragging ? <Upload size={40} className="text-white" /> : <ImageIcon size={40} className="text-white/70" />}
              </div>
              
              <h3 className="text-2xl font-semibold text-white mb-2 tracking-tight">
                {isDragging ? 'Drop it like it\'s hot!' : 'Drag & Drop your photo'}
              </h3>
              <p className="text-white/40 text-sm">
                Supports JPG, PNG, WEBP, SVG
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DropZone;