// src/components/Dashboard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Loader2, Play, FileVideo, X, LogOut, RefreshCw, Copy, CheckCircle, 
  LayoutGrid, List as ListIcon, Info, Globe, Github, Mail, Instagram, Twitter, Send
} from "lucide-react";
import { signOut } from "next-auth/react";

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: string;
}

// Dashboard ab ek optional 'initialFileId' prop accept karega
export default function Dashboard({ accessToken, initialFileId }: { accessToken: string; initialFileId?: string | null }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState<FileItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const formatSize = (bytes?: string) => {
    if (!bytes) return "Unknown Size";
    const size = parseInt(bytes);
    if (size === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const q = "mimeType contains 'video/' and trashed = false";
      const fields = "files(id, name, mimeType, thumbnailLink, size)";
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=100`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 401) {
        signOut(); 
        return;
      }

      const data = await res.json();
      
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Effect to handle initial file loading from Drive "Open with"
  useEffect(() => {
    const loadInitialFile = async () => {
      if (initialFileId && !isAutoPlaying) {
        setIsAutoPlaying(true);
        try {
          // Fetch metadata for the single file opened from Drive
          const fields = "id, name, mimeType, thumbnailLink, size";
          const url = `https://www.googleapis.com/drive/v3/files/${initialFileId}?fields=${encodeURIComponent(fields)}`;
          
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (res.ok) {
            const fileData: FileItem = await res.json();
            setCurrentVideo(fileData);
          } else {
            console.error("Failed to fetch initial file metadata");
          }
        } catch (error) {
          console.error("Error loading initial file:", error);
        }
      }
    };

    // Load the list first, then check for initial file
    fetchFiles().then(() => {
        loadInitialFile();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, initialFileId, fetchFiles]); // Added fetchFiles to dependency

  const isBrowserPlayable = (mimeType: string) => {
    return mimeType.includes("mp4") || mimeType.includes("webm");
  };

  const copyStreamLink = () => {
    if (!currentVideo) return;
    const streamUrl = `${window.location.origin}/api/stream?fileId=${currentVideo.id}&token=${accessToken}`;
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-full flex flex-col select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 backdrop-blur-xl bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg shadow-black/20 gap-4">
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            My Drive Library
            </h2>
            <p className="text-xs text-gray-400 mt-1">{files.length} Videos Found</p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* View Toggle Buttons */}
            <div className="bg-black/20 p-1 rounded-lg border border-white/5 flex gap-1">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    title="Grid View"
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    title="List View"
                >
                    <ListIcon size={18} />
                </button>
            </div>

            <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

            <button onClick={fetchFiles} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white" title="Refresh">
                <RefreshCw size={20} />
            </button>
            <button onClick={() => signOut()} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all text-sm font-medium">
                <LogOut size={16} /> <span className="hidden sm:inline">Disconnect</span>
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow">
        {loading && !currentVideo ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4"><Loader2 className="w-12 h-12 animate-spin text-purple-500" /><p className="text-gray-400 animate-pulse">Scanning your Drive...</p></div>
        ) : files.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">No videos found.</div>
        ) : (
            viewMode === 'grid' ? (
                // === GRID VIEW ===
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {files.map((file) => (
                    <div key={file.id} onClick={() => setCurrentVideo(file)} className="group cursor-pointer bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]/80 border border-white/5 hover:border-purple-500/50 rounded-xl p-3 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm shadow-md">
                        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                            {file.thumbnailLink ? <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" referrerPolicy="no-referrer"/> : <FileVideo className="w-12 h-12 text-gray-600" />}
                            
                            {!isBrowserPlayable(file.mimeType) && <span className="absolute top-2 right-2 text-[10px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded font-mono font-bold z-10">MKV</span>}
                            
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isBrowserPlayable(file.mimeType) ? 'bg-purple-600 shadow-purple-600/40' : 'bg-orange-600 shadow-orange-600/40'}`}>
                                    <Play className="w-5 h-5 fill-white text-white ml-1" />
                                </div>
                                <span className="text-xs font-mono text-gray-300 bg-black/50 px-2 py-1 rounded-full border border-white/10">
                                    {formatSize(file.size)}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-200 truncate px-1" title={file.name}>{file.name}</h3>
                        <div className="flex justify-between items-center px-1 mt-1">
                             <span className="text-[10px] text-gray-500 uppercase">{file.mimeType.split('/').pop()}</span>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                // === LIST VIEW ===
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/10">
                        <div className="col-span-6">Name</div>
                        <div className="col-span-2">Size</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2 text-right">Action</div>
                    </div>
                    {files.map((file) => (
                         <div key={file.id} onClick={() => setCurrentVideo(file)} className="group grid grid-cols-12 gap-4 items-center p-3 rounded-xl bg-[#1a1a1a]/20 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                            <div className="col-span-6 flex items-center gap-4 overflow-hidden">
                                <div className="w-12 h-8 bg-gray-800 rounded overflow-hidden flex-shrink-0 relative">
                                    {file.thumbnailLink ? <img src={file.thumbnailLink} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <FileVideo className="w-full h-full p-2 text-gray-500"/>}
                                </div>
                                <span className="text-sm text-gray-200 truncate font-medium group-hover:text-purple-300 transition-colors">{file.name}</span>
                            </div>
                            <div className="col-span-2 text-xs text-gray-400 font-mono">{formatSize(file.size)}</div>
                            <div className="col-span-2">
                                <span className={`text-[10px] px-2 py-1 rounded border ${!isBrowserPlayable(file.mimeType) ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                    {file.mimeType.split('/').pop()?.toUpperCase()}
                                </span>
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <button className="p-2 bg-white/5 rounded-full group-hover:bg-purple-600 transition-colors">
                                    <Play size={14} className="text-gray-400 group-hover:text-white fill-current" />
                                </button>
                            </div>
                         </div>
                    ))}
                </div>
            )
        )}
      </div>

      {/* Footer Section */}
      <div className="mt-20 pt-8 border-t border-white/5 flex flex-col items-center gap-6 pb-8">
        
        {/* Social Links */}
        <div className="flex gap-4">
            <SocialLink href="https://instagram.com/priyansh__.86" icon={<Instagram size={18} />} color="hover:text-pink-500 hover:border-pink-500/50" />
            <SocialLink href="https://x.com/priyansh_86" icon={<Twitter size={18} />} color="hover:text-blue-400 hover:border-blue-400/50" />
            <SocialLink href="https://t.me/priyansh_dev" icon={<Send size={18} />} color="hover:text-blue-500 hover:border-blue-500/50" />
            <SocialLink href="https://github.com/priyansh-86" icon={<Github size={18} />} color="hover:text-white hover:border-white/50" />
            <SocialLink href="https://priyanshrajbhar.vercel.app/" icon={<Globe size={18} />} color="hover:text-purple-400 hover:border-purple-400/50" />
            <SocialLink href="mailto:priyanshrajbhar499@gmail.com" icon={<Mail size={18} />} color="hover:text-red-400 hover:border-red-400/50" />
        </div>

        {/* Made By Text */}
        <div className="flex flex-col items-center gap-2">
            <h3 className="text-gray-400 text-sm font-medium tracking-wide">
                Made with <span className="text-red-500 animate-pulse">❤</span> by <span className="text-white font-bold">PRIYANSH</span>
            </h3>
        </div>
      </div>

      {/* Player Modal */}
      {currentVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200 cursor-default">
          <div className="relative w-full max-w-6xl bg-[#121212] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <div className="flex flex-col overflow-hidden">
                    <h3 className="font-medium text-gray-200 truncate pr-4 text-lg select-text">{currentVideo.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-1">
                        <span className="flex items-center gap-1"><Info size={12}/> {formatSize(currentVideo.size)}</span>
                        <span>•</span>
                        <span>{currentVideo.mimeType}</span>
                    </div>
                </div>
                <button onClick={() => setCurrentVideo(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
            </div>
            
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[400px]">
              {isBrowserPlayable(currentVideo.mimeType) ? (
                <video controls autoPlay className="w-full h-full max-h-[80vh] outline-none" src={`/api/stream?fileId=${currentVideo.id}`} controlsList="nodownload">Your browser does not support the video tag.</video>
              ) : (
                <div className="flex flex-col items-center text-center p-8 max-w-lg">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border border-orange-500/20"><FileVideo className="w-10 h-10 text-orange-500" /></div>
                    <h2 className="text-2xl font-bold text-white mb-2">Use VLC for this file</h2>
                    <p className="text-gray-400 mb-8">Browsers cannot play MKV/HEVC directly.</p>
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Copy Stream Link</p>
                        <div className="flex gap-2">
                            <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/stream?fileId=${currentVideo.id}&token=${accessToken.substring(0, 10)}...`} className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-500 w-full outline-none select-text" />
                            <button onClick={copyStreamLink} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium">{copied ? <CheckCircle size={18} /> : <Copy size={18} />}{copied ? "Copied" : "Copy"}</button>
                        </div>
                    </div>
                    <div className="text-left w-full space-y-2 text-sm text-gray-400">
                        <p><strong>Step 2:</strong> Open VLC &rarr; <kbd className="bg-white/10 px-1.5 py-0.5 rounded">Ctrl + N</kbd></p>
                        <p><strong>Step 3:</strong> Paste & Play.</p>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialLink({ href, icon, color }: { href: string, icon: React.ReactNode, color: string }) {
    return (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`p-3 bg-white/5 border border-white/5 rounded-full text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-white/10 ${color}`}
        >
            {icon}
        </a>
    )
}