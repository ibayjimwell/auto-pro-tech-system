import React from 'react';
import { Menu, Wrench, Search, Bell } from 'lucide-react'; // Added Search/Bell for a more "full" modern UI feel
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * MobileHeader Component: High-Quality Redesign
 * Features: Responsive branding, backdrop-blur (glassmorphism), 
 * and touch-optimized interactive elements.
 */
export default function MobileHeader({ onMenuClick }) {
  return (
    /* --- Main Header Container --- */
    /* Uses glassmorphism effect with backdrop-blur and sticky positioning */
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 lg:hidden sticky top-0 z-40 animate-in fade-in slide-in-from-top-2 duration-500">
      
      {/* --- Left Section: Navigation Toggle & Branding --- */}
      <div className="flex items-center gap-2">
        {/* Menu Button: Touch-friendly hit area and Material hover state */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="rounded-xl hover:bg-primary/5 active:scale-95 transition-all duration-200 h-10 w-10"
        >
          <Menu className="w-6 h-6 text-slate-700" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        {/* Branding Container */}
        <div className="flex items-center gap-2.5 ml-1">
          {/* Logo Icon: Matching Sidebar Styling */}
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20 rotate-0 hover:rotate-6 transition-transform">
            <Wrench className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          
          {/* Brand Text: Responsive font sizes with specific color formatting */}
          <div className="flex flex-col">
            <h1 className="font-black text-sm md:text-base tracking-tighter leading-none">
              <span className="text-red-600 uppercase">Auto</span>{' '}
              <span className="text-black uppercase">Pro Tech</span>
            </h1>
            <span className="text-[9px] font-bold text-slate-400 tracking-[0.15em] uppercase">
              AutoCare System
            </span>
          </div>
        </div>
      </div>

      {/* --- Right Section: Action Buttons (Modern Additions) --- */}
      <div className="flex items-center gap-1">
        {/* Search Toggle - Common in high-quality mobile UIs */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-slate-500 w-9 h-9"
        >
          <Search className="w-5 h-5" />
        </Button>

        {/* Notifications - Using a relative container for the "dot" indicator */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-slate-500 w-9 h-9 relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </Button>
      </div>

    </header>
  );
}