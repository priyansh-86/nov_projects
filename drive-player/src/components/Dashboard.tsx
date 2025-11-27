// src/components/Dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Play, FileVideo, X, LogOut, RefreshCw, Copy, CheckCircle } from "lucide-react";
import { signOut } from "next-auth/react";

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
}

export default function Dashboard({ accessToken }: { accessToken: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState<FileItem | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const q = "mimeType contains 'video/' and trashed = false";
      const fields = "files(id, name, mimeType, thumbnailLink)";
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=100`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [accessToken]);

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
    <div className="w-full h-full pb-20">
      <div className="flex justify-between items-center mb-8 backdrop-blur-xl bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg shadow-black/20">
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            My Drive Library
            </h2>
            <p className="text-xs text-gray-400 mt-1">{files.length} Videos Found</p>
        </div>
        <div className="flex gap-3">
            <button onClick={fetchFiles} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><RefreshCw size={20} /></button>
            <button onClick={() => signOut()} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all text-sm font-medium"><LogOut size={16} /> Disconnect</button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4"><Loader2 className="w-12 h-12 animate-spin text-purple-500" /><p className="text-gray-400 animate-pulse">Scanning your Drive...</p></div>
      ) : files.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">No videos found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.map((file) => (
            <div key={file.id} onClick={() => setCurrentVideo(file)} className="group cursor-pointer bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]/80 border border-white/5 hover:border-purple-500/50 rounded-xl p-3 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                {file.thumbnailLink ? <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" referrerPolicy="no-referrer"/> : <FileVideo className="w-12 h-12 text-gray-600" />}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-[2px]">
                   {!isBrowserPlayable(file.mimeType) && <span className="absolute top-2 right-2 text-[10px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded font-mono">MKV/EXT</span>}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isBrowserPlayable(file.mimeType) ? 'bg-purple-600 shadow-purple-600/40' : 'bg-orange-600 shadow-orange-600/40'}`}><Play className="w-5 h-5 fill-white text-white ml-1" /></div>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-200 truncate px-1">{file.name}</h3>
            </div>
          ))}
        </div>
      )}

      {currentVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-6xl bg-[#121212] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-medium text-gray-200 truncate pr-4">{currentVideo.name}</h3>
                <button onClick={() => setCurrentVideo(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[400px]">
              {isBrowserPlayable(currentVideo.mimeType) ? (
                <video controls autoPlay className="w-full h-full max-h-[80vh] outline-none" src={`/api/stream?fileId=${currentVideo.id}`} controlsList="nodownload">Your browser does not support the video tag.</video>
              ) : (
                <div className="flex flex-col items-center text-center p-8 max-w-lg">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border border-orange-500/20"><FileVideo className="w-10 h-10 text-orange-500" /></div>
                    <h2 className="text-2xl font-bold text-white mb-2">Use VLC for this file</h2>
                    <p className="text-gray-400 mb-8">Browsers cannot play MKV. Stream it via VLC.</p>
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Step 1: Copy Link</p>
                        <div className="flex gap-2">
                            <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/stream?fileId=${currentVideo.id}&token=${accessToken.substring(0, 10)}...`} className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-500 w-full outline-none" />
                            <button onClick={copyStreamLink} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium">{copied ? <CheckCircle size={18} /> : <Copy size={18} />}{copied ? "Copied" : "Copy"}</button>
                        </div>
                    </div>
                    <div className="text-left w-full space-y-2 text-sm text-gray-400">
                        {/* Change '->' to '&rarr;' to fix build error */}
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