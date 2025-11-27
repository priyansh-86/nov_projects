// src/components/LoginButton.tsx
"use client";

import { signIn } from "next-auth/react";
import { PlayCircle } from "lucide-react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="group relative px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-purple-500/30 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)] active:scale-95"
    >
      <div className="flex items-center gap-3 relative z-10">
        <PlayCircle className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors" />
        <span className="font-semibold text-lg tracking-wide text-gray-200 group-hover:text-white">
          Connect Google Drive
        </span>
      </div>
      
      {/* Shine Animation Effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
    </button>
  );
}