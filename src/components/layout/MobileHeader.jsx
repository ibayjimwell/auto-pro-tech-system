import React from 'react';
import { Menu, Wrench } from 'lucide-react';

export default function MobileHeader({ onMenuClick }) {
  return (
    <div className="h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3 lg:hidden sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <Wrench className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-heading font-bold text-secondary text-base tracking-tight">AUTO PRO TECH</span>
      </div>
    </div>
  );
}