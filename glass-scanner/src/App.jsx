import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import QRCode from 'react-qr-code'; 
import bwipjs from 'bwip-js'; 
import html2canvas from 'html2canvas'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, Image as ImageIcon, History, Zap, ZapOff, 
  Copy, ExternalLink, Wifi, RefreshCcw, X, Share2, Trash2,
  Github, Twitter, Instagram, Mail, Globe, Send, 
  ChevronDown, Barcode, AlertCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useLocalStorage } from 'react-use';
import Logo1 from './components/Logo1'; // Importing your custom logo

// --- Sound Utility ---
const playBeep = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {}); 
  if (navigator.vibrate) navigator.vibrate(200);
};

// --- Glass Card Component ---
const GlassCard = ({ children, className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl ${className}`}
  >
    {children}
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useLocalStorage('qr-history', []);
  const [showHistory, setShowHistory] = useState(false);
  const [flashlight, setFlashlight] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      if (activeTab === 'scan' && !scanResult && !isScanning) {
        await new Promise(r => setTimeout(r, 300));
        
        const element = document.getElementById('reader');
        if (!element) return;

        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        
        const config = { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.EAN_13 ] 
        };
        
        try {
            await html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            (decodedText) => handleScan(decodedText, html5QrCode)
            );
            setIsScanning(true);
        } catch (err) {
            console.log("Camera start error", err);
        }
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
            setIsScanning(false);
        }).catch(err => console.error(err));
      }
    };
  }, [activeTab, scanResult]);

  const handleScan = (decodedText, scannerInstance) => {
    playBeep();
    const newEntry = {
      id: Date.now(),
      text: decodedText,
      date: new Date().toLocaleTimeString(),
      type: detectType(decodedText)
    };
    
    setScanResult(newEntry);
    setHistory([newEntry, ...history]);
    
    if(scannerInstance) {
        scannerInstance.stop().then(() => {
            scannerInstance.clear();
            setIsScanning(false);
        }).catch(err => console.error("Stop failed", err));
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files.length === 0) return;
    const imageFile = e.target.files[0];
    
    const html5QrCode = new Html5Qrcode("reader-hidden");
    html5QrCode.scanFile(imageFile, true)
      .then(decodedText => {
        handleScan(decodedText, null);
      })
      .catch(err => toast.error("No QR/Barcode found"));
  };

  const detectType = (text) => {
    if (text.startsWith('http')) return 'url';
    if (text.startsWith('WIFI:')) return 'wifi';
    if (text.startsWith('mailto:')) return 'email';
    if (text.startsWith('tel:')) return 'phone';
    return 'text';
  };

  const resetScan = () => {
    setScanResult(null);
    setIsScanning(false); 
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success("History cleared");
  }

  return (
    <div className="min-h-screen text-white pb-6 flex flex-col">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
      
      {/* --- HEADER START --- */}
      <header className="flex justify-between items-center p-6 max-w-md mx-auto w-full">
        <div className="flex items-center gap-3">
            
            {/* New Custom Logo */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-pink-500/20">
               <Logo1 className="text-white w-7 h-7" />
            </div>

            <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    PRIYANSH | Scanner
                </h1>
                <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                    Universal Tool
                </p>
            </div>
        </div>

        <button 
          onClick={() => setShowHistory(true)}
          className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-95 border border-white/5 backdrop-blur-sm"
        >
          <History className="w-5 h-5 text-gray-300" />
        </button>
      </header>
      {/* --- HEADER END --- */}

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 flex flex-col gap-6 w-full flex-grow">
        
        {/* Tabs */}
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => { setActiveTab('scan'); resetScan(); }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'scan' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400'}`}
          >
            Scanner
          </button>
          <button 
             onClick={() => setActiveTab('generate')}
             className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'generate' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400'}`}
          >
            Generator
          </button>
        </div>

        {/* --- SCANNER VIEW --- */}
        {activeTab === 'scan' && (
          <GlassCard className="relative min-h-[420px] flex flex-col items-center justify-center">
            
            {!scanResult ? (
              <>
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
                  <div id="reader" className="w-full h-full"></div>
                  <div id="reader-hidden" className="hidden"></div>
                  
                  {/* Overlay UI */}
                  <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50 rounded-2xl z-10 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white/30 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pink-500 rounded-tl-sm"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-pink-500 rounded-tr-sm"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pink-500 rounded-bl-sm"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-500 rounded-br-sm"></div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setFlashlight(!flashlight)}
                    className="absolute top-4 right-4 z-30 p-2 bg-black/60 rounded-full backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
                  >
                    {flashlight ? <Zap className="text-yellow-400 w-5 h-5" /> : <ZapOff className="text-gray-400 w-5 h-5" />}
                  </button>
                </div>

                <div className="mt-6 w-full">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95 text-sm font-medium"
                  >
                    <ImageIcon className="w-5 h-5 text-blue-400" />
                    <span>Scan from Gallery</span>
                  </button>
                </div>
              </>
            ) : (
              <ResultCard result={scanResult} onScanAgain={resetScan} />
            )}
          </GlassCard>
        )}

        {/* --- GENERATOR VIEW --- */}
        {activeTab === 'generate' && (
          <GeneratorView />
        )}
      </main>

      {/* --- FOOTER START --- */}
      <footer className="mt-10 py-8 text-center flex flex-col gap-4 border-t border-white/5 bg-slate-900/30 backdrop-blur-sm">
        
        {/* Social Icons */}
        <div className="flex justify-center gap-5">
            <SocialLink href="https://github.com/priyansh-86" icon={<Github size={20} />} label="GitHub" />
            <SocialLink href="https://instagram.com/priyansh__.86" icon={<Instagram size={20} />} label="Instagram" />
            <SocialLink href="https://x.com/priyansh_86" icon={<Twitter size={20} />} label="Twitter" />
            <SocialLink href="https://t.me/priyansh_dev" icon={<Send size={20} />} label="Telegram" />
            <SocialLink href="mailto:priyanshrajbahr499@gmail.com" icon={<Mail size={20} />} label="Email" />
            <SocialLink href="https://priyanshrajbhar.vercel.app/" icon={<Globe size={20} />} label="Portfolio" />
        </div>

        {/* Copyright Text */}
        <p className="text-sm text-gray-500 font-medium">
            Made with <span className="text-pink-500 animate-pulse">❤️</span> by{' '}
            <a 
                href="https://priyanshrajbhar.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-pink-400 transition-colors underline decoration-pink-500/50 underline-offset-4"
            >
                PRIYANSH
            </a>
        </p>
      </footer>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-slate-900 p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">History</h2>
              <div className="flex gap-2">
                <button onClick={clearHistory} className="p-2 text-red-400 bg-red-400/10 rounded-full"><Trash2 size={20} /></button>
                <button onClick={() => setShowHistory(false)} className="p-2 bg-white/10 rounded-full"><X size={20} /></button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {history.map((item) => (
                <div key={item.id} className="bg-white/5 p-4 rounded-xl border border-white/5 active:bg-white/10 transition-colors cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(item.text);
                    toast.success("Copied!");
                }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full uppercase text-gray-300">{item.type}</span>
                    <span className="text-[10px] text-gray-500">{item.date}</span>
                  </div>
                  <p className="font-mono text-sm text-gray-300 truncate">{item.text}</p>
                </div>
              ))}
              {history.length === 0 && <p className="text-center text-gray-500 mt-10">No scans yet.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub Components ---

const SocialLink = ({ href, icon, label }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 hover:scale-110 transition-all duration-300 border border-transparent hover:border-pink-500/30"
        aria-label={label}
    >
        {icon}
    </a>
);

const ResultCard = ({ result, onScanAgain }) => {
  const handleAction = () => {
    if (result.type === 'url') window.open(result.text, '_blank');
    else {
      navigator.clipboard.writeText(result.text);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="flex flex-col items-center w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
        <Wifi className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-1">Found Code!</h3>
      <p className="text-gray-400 text-xs mb-4">Type: {result.type.toUpperCase()}</p>
      
      <div className="bg-black/40 p-4 rounded-xl w-full mb-6 break-words font-mono text-sm border border-white/10 max-h-32 overflow-y-auto">
        {result.text}
      </div>
      
      <div className="flex gap-3 w-full">
        <button 
          onClick={handleAction}
          className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
        >
          {result.type === 'url' ? <ExternalLink size={18}/> : <Copy size={18}/>}
          {result.type === 'url' ? 'Open' : 'Copy'}
        </button>
        <button 
          onClick={onScanAgain}
          className="px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-white"
        >
          <RefreshCcw size={20} />
        </button>
      </div>
    </div>
  );
};

const UniversalBarcode = ({ text, format, canvasRef }) => {
    const [error, setError] = useState(null);

    useEffect(() => {
        setError(null);
        if (!text || !canvasRef.current) return;

        if (format === 'upca' && !/^\d{11,12}$/.test(text)) {
            setError("Requires 11 or 12 digits");
            return;
        }
        if (format === 'ean13' && !/^\d{12,13}$/.test(text)) {
            setError("Requires 12 or 13 digits");
            return;
        }
        if (format === 'code128' && !/^[\x00-\x7F]+$/.test(text)) {
            setError("Invalid characters");
            return;
        }

        try {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            bwipjs.toCanvas(canvasRef.current, {
                bcid: format,       
                text: text,         
                scale: 3,           
                height: 10,         
                includetext: true,  
                textxalign: 'center', 
                backgroundcolor: 'ffffff',
            });
        } catch (e) {
            console.error("Barcode rendering error:", e);
            setError("Invalid Data");
        }
    }, [text, format, canvasRef]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
                <AlertCircle />
                <span className="text-xs font-medium">{error}</span>
            </div>
        );
    }

    return <canvas ref={canvasRef} className="w-full h-full object-contain" />;
};

const GeneratorView = () => {
  const [text, setText] = useState('');
  const [format, setFormat] = useState('qrcode'); 
  const MAX_CHARS = 2000;
  
  const downloadRef = useRef(null);
  const canvasRef = useRef(null); 

  const barcodeFormats = [
      { id: 'qrcode', label: 'QR Code (Standard)' },
      { id: 'code128', label: 'Code 128 (Text/Num)' },
      { id: 'ean13', label: 'EAN-13 (Retail)' },
      { id: 'upca', label: 'UPC-A (US Retail)' },
  ];

  const handleChange = (e) => {
    if(e.target.value.length <= MAX_CHARS) {
        setText(e.target.value);
    }
  };

  const handleDownload = async () => {
      if (!downloadRef.current || !text) return;
      
      try {
          toast.loading("Preparing download...", { id: 'downloading' });
          await new Promise(r => setTimeout(r, 100));

          const canvas = await html2canvas(downloadRef.current, {
              backgroundColor: null, 
              scale: 3 
          });
          
          const image = canvas.toDataURL("image/png");
          const link = document.createElement('a');
          link.download = `PRIYANSH-Scanner-${format}-${Date.now()}.png`;
          link.href = image;
          link.click();
          
          toast.success("Downloaded!", { id: 'downloading' });
      } catch (error) {
          toast.error("Failed to download.", { id: 'downloading' });
      }
  };

  const getPlaceholder = () => {
      if(format === 'upca') return 'Enter 11-12 digits (0-9)';
      if(format === 'ean13') return 'Enter 12-13 digits (0-9)';
      return 'Type text or URL...';
  }

  return (
    <GlassCard>
      <div className="flex flex-col items-center gap-4">
        
        <div className="w-full relative">
            <select 
                value={format} 
                onChange={(e) => { setFormat(e.target.value); setText(''); }}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl p-3 pl-4 pr-10 text-white focus:outline-none focus:border-pink-500 transition-colors cursor-pointer"
            >
                {barcodeFormats.map(f => (
                    <option key={f.id} value={f.id} className="bg-slate-800 text-white">{f.label}</option>
                ))}
            </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>

        <div ref={downloadRef} className="bg-white p-6 rounded-xl shadow-lg w-full flex items-center justify-center min-h-[220px]">
          {text ? (
            format === 'qrcode' ? (
                <QRCode 
                    value={text} 
                    size={180}
                    level="H" 
                />
            ) : (
                <UniversalBarcode text={text} format={format} canvasRef={canvasRef} />
            )
          ) : (
            <div className="w-full h-[180px] bg-gray-50 flex items-center justify-center text-gray-400 text-sm flex-col gap-2 rounded-lg border-2 border-dashed border-gray-200">
              {format === 'qrcode' ? <Scan className="opacity-30 w-10 h-10"/> : <Barcode className="opacity-30 w-10 h-10"/>}
              <span>Waiting for input...</span>
            </div>
          )}
        </div>
        
        <div className="w-full relative">
            <textarea
            placeholder={getPlaceholder()}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors resize-none h-24 text-sm font-mono"
            value={text}
            onChange={handleChange}
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-gray-500">
                {text.length}/{MAX_CHARS}
            </div>
        </div>

        <button 
            onClick={handleDownload}
            disabled={!text}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all border text-sm font-medium
                ${text 
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-lg hover:shadow-pink-500/20 border-transparent cursor-pointer active:scale-95 text-white' 
                    : 'bg-white/0 border-white/5 text-gray-600 cursor-not-allowed'
                }`}
        >
            <Share2 size={16} /> Download Image
        </button>
      </div>
    </GlassCard>
  );
};