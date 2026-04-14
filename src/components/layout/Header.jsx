import React from 'react';
import { useAutoAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Header({ title, subtitle }) {
  const { user } = useAutoAuth();

  return (
    <header className="h-16 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="min-w-0">
        <h2 className="font-heading text-lg md:text-xl font-bold text-foreground truncate">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground hidden sm:block truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>
        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary-foreground">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold leading-tight">{user?.fullName}</p>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize border-secondary text-secondary">
              {user?.role}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}