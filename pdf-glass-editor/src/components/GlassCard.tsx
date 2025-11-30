"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className,
  hoverEffect = false,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hoverEffect ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" } : {}}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-glass-border bg-glass-gradient backdrop-blur-xl shadow-2xl transition-all duration-300",
        hoverEffect && "cursor-pointer hover:border-white/20 hover:shadow-white/5",
        className
      )}
    >
      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}