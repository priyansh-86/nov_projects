"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  FileText, Search, Star, Trash2, Plus, Settings, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase"; // DB Connection

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 🔥 Create Note Function
  const handleCreateNote = async () => {
    setLoading(true);
    try {
      // 1. Insert new empty note
      const { data, error } = await supabase
        .from('notes')
        .insert([{ title: 'Untitled Note', content: '' }])
        .select()
        .single();

      if (error) throw error;

      // 2. Redirect to that note
      if (data) {
        router.push(`/note/${data.id}`);
      }
    } catch (error) {
      console.error("Error creating note:", error);
      alert("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { icon: Search, label: "Search", href: "/search" },
    { icon: FileText, label: "All Notes", href: "/" },
    { icon: Star, label: "Favorites", href: "/favorites" },
    { icon: Trash2, label: "Trash", href: "/trash" },
  ];

  return (
    <aside className="hidden md:flex h-full w-72 flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl">
      
      {/* App Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          KillerNotes
        </h1>
      </div>

      {/* New Note Button (Working) */}
      <div className="px-4 mb-6">
        <button 
          onClick={handleCreateNote}
          disabled={loading}
          className="w-full group flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 transition-all duration-200 shadow-lg shadow-purple-900/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">New Note</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-white/10 text-white border border-white/5" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-purple-400" : "text-white/40")} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
         <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
              U
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white/90">User</p>
            </div>
            <Settings className="w-4 h-4 text-white/40" />
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;