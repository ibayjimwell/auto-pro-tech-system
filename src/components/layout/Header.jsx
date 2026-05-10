import React from "react";
import { useAutoAuth } from "@/contexts/AuthContext";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * High-Density Minimalist Header
 * Focuses on page context and user identity.
 * Optimized for mobile, tablet, and desktop viewports.
 */
export default function Header({ title, subtitle }) {
  const { user } = useAutoAuth();

  return (
    /* --- Main Header Shell --- */
    /* Sticky glass effect with a subtle bottom border for separation */
    <header className="h-14 md:h-16 bg-white/70 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300">
      
      {/* --- Section: Context & Branding --- */}
      <div className="flex flex-col justify-center min-w-0">
        <h2 className="font-black text-base md:text-xl text-slate-900 tracking-tight leading-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 truncate opacity-80">
            {subtitle}
          </p>
        )}
      </div>

      {/* --- Section: User Profile --- */}
      {/* Grouped as a single tactile interaction area */}
      <div className="flex items-center gap-3 group cursor-pointer select-none active:scale-95 transition-transform">
        
        {/* User Details (Desktop & Tablet) */}
        <div className="hidden sm:flex flex-col items-end text-right">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-700 leading-none group-hover:text-primary transition-colors">
              {user?.name || "Guest Account"}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:translate-y-0.5 transition-transform duration-200" />
          </div>
          
          {/* Status/Role Badge */}
          <div className="mt-1">
            <Badge
              variant="secondary"
              className={cn(
                "text-[8px] px-1.5 py-0 h-3.5 font-black uppercase tracking-widest border-none",
                user?.role === "admin" 
                  ? "bg-red-50 text-red-600/80 bg-opacity-10" 
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {user?.role || "GUEST"}
            </Badge>
          </div>
        </div>

        {/* Profile Avatar Container */}
        <div className="relative">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/10 transform group-hover:rotate-6 transition-transform duration-300">
            <span className="text-xs md:text-sm font-black text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          
          {/* Active Presence Dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
        </div>
        
      </div>
    </header>
  );
}