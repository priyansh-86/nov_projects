// src/components/Dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Play, FileVideo, X, LogOut, RefreshCw } from "lucide-react";
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

  const fetchFiles = async () => {
    setLoading(true);
    try {
      // Query: Search for video files, exclude trashed files
      const q = "mimeType contains 'video/' and trashed = false";
      const fields = "files(id, name, mimeType, thumbnailLink)";
      // Note: pageSize=100 limits to 100 videos. You can increase/paginate if needed.
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

  // Initial fetch
  useEffect(() => {
    fetchFiles();
  }, [accessToken]);

  return (
    <div className="w-full h-full pb-20">
      {/* Navbar Area */}
      <div className="flex justify-between items-center mb-8 backdrop-blur-xl bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg shadow-black/20">
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            My Drive Library
            </h2>
            <p className="text-xs text-gray-400 mt-1">{files.length} Videos Found</p>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={fetchFiles}
                title="Refresh Library"
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            >
                <RefreshCw size={20} />
            </button>
            <button 
                onClick={() => signOut()} 
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all text-sm font-medium"
            >
                <LogOut size={16} /> Disconnect
            </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          <p className="text-gray-400 animate-pulse">Scanning your Drive...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center text-gray-500 mt-20 p-10 border border-dashed border-white/10 rounded-2xl">
            <FileVideo className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium">No videos found</h3>
            <p className="text-sm mt-2">Upload some videos to your Google Drive to see them here.</p>
        </div>
      ) : (
        /* Video Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => setCurrentVideo(file)}
              className="group cursor-pointer bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]/80 border border-white/5 hover:border-purple-500/50 rounded-xl p-3 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm shadow-lg hover:shadow-purple-500/10"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                {file.thumbnailLink ? (
                  <img 
                    src={file.thumbnailLink} 
                    alt={file.name} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <FileVideo className="w-12 h-12 text-gray-600" />
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                  <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-600/40 transform scale-75 group-hover:scale-100 transition-transform">
                     <Play className="w-6 h-6 fill-white text-white ml-1" />
                  </div>
                </div>
              </div>
              
              {/* Video Info */}
              <div className="px-1">
                <h3 className="text-sm font-medium text-gray-200 truncate group-hover:text-purple-300 transition-colors">
                    {file.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Video Player Modal */}
      {currentVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-6xl bg-[#121212] rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/20 border border-white/10 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3 overflow-hidden">
                    <FileVideo className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <h3 className="font-medium text-gray-200 truncate pr-4">{currentVideo.name}</h3>
                </div>
                <button 
                    onClick={() => setCurrentVideo(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Player Container */}
            <div className="flex-1 bg-black flex items-center justify-center relative group">
              {/* VIDEO TAG pointing to our API Proxy */}
              <video
                controls
                autoPlay
                className="w-full h-full max-h-[80vh] outline-none"
                src={`/api/stream?fileId=${currentVideo.id}`}
                controlsList="nodownload" 
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}