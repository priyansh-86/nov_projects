"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export default function EditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Setup TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your killer note...' }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px]',
      },
    },
  });

  // Load Note Data
  useEffect(() => {
    const fetchNote = async () => {
      const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
      if (data) {
        setTitle(data.title);
        if (editor) editor.commands.setContent(data.content || '');
      }
    };
    if (id && editor) fetchNote();
  }, [id, editor]);

  // Save Function
  const handleSave = async () => {
    setSaving(true);
    const content = editor?.getHTML();
    await supabase.from('notes').update({ 
      title, 
      content,
      // updated_at: new Date() // Trigger
    }).eq('id', id);
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 py-2">
        <Link href="/" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-xs text-white/30">
           {saving ? "Saving..." : "Changes Saved"}
        </div>
      </div>

      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note Title"
        className="text-4xl font-bold bg-transparent text-white border-none focus:outline-none placeholder-white/20 mb-6"
      />

      {/* Editor Area (Glass Card) */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md overflow-y-auto shadow-2xl">
        <EditorContent editor={editor} />
      </div>

      {/* Floating Save Button (Mobile mostly) */}
      <button 
        onClick={handleSave}
        className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-xl transition-all hover:scale-110"
      >
        <Save className="w-6 h-6" />
      </button>
    </div>
  );
}