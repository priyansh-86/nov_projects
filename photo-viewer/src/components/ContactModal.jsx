import React from 'react';
import { motion } from 'framer-motion';
import { Github, Instagram, Mail, Globe, Send, X as CloseIcon, ExternalLink } from 'lucide-react';

const XLogo = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>);

const ContactModal = ({ onClose }) => {
  const links = [
    { name: 'Portfolio', icon: <Globe size={20} />, url: 'https://priyanshrajbhar.vercel.app/', color: 'hover:bg-emerald-500/20 hover:text-emerald-400 border-emerald-500/20' },
    { name: 'GitHub', icon: <Github size={20} />, url: 'https://github.com/priyansh-86', color: 'hover:bg-white/20 hover:text-white border-white/20' },
    { name: 'Instagram', icon: <Instagram size={20} />, url: 'https://www.instagram.com/priyansh__.86', color: 'hover:bg-pink-500/20 hover:text-pink-400 border-pink-500/20' },
    { name: 'X (Twitter)', icon: <XLogo />, url: 'https://x.com/priyansh_86', color: 'hover:bg-blue-400/20 hover:text-blue-300 border-blue-400/20' },
    { name: 'Telegram', icon: <Send size={20} />, url: 'https://t.me/priyansh_dev', color: 'hover:bg-sky-500/20 hover:text-sky-400 border-sky-500/20' },
    { name: 'Email', icon: <Mail size={20} />, url: 'mailto:priyanshrajbhar499@gmail.com', color: 'hover:bg-red-500/20 hover:text-red-400 border-red-500/20' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"><CloseIcon size={20} /></button>
        <div className="text-center mb-8 mt-2"><h2 className="text-2xl font-bold text-white tracking-tight">Let's Connect</h2><p className="text-white/40 text-sm mt-2">Reach out for collaborations or just say hi!</p></div>
        <div className="grid grid-cols-2 gap-3">
          {links.map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-4 rounded-xl border bg-white/5 transition-all duration-300 group text-white/80 ${link.color}`}>
              <span className="transition-transform group-hover:scale-110 duration-300">{link.icon}</span>
              <div className="flex-1 min-w-0"><span className="text-sm font-medium truncate block">{link.name}</span></div>
              <ExternalLink size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
            </a>
          ))}
        </div>
        <div className="mt-8 text-center"><p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Developed by Priyansh</p></div>
      </motion.div>
    </div>
  );
};

export default ContactModal;