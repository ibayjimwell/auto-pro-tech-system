import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, trend, color = 'primary' }) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-heading font-bold mt-2 text-foreground">{value}</p>
            {trend && (
              <p className="text-xs font-medium mt-2 text-green-600">{trend}</p>
            )}
          </div>
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            color === 'primary' && 'bg-primary/10',
            color === 'secondary' && 'bg-secondary/20',
            color === 'accent' && 'bg-accent/20',
            color === 'destructive' && 'bg-destructive/10',
          )}>
            <Icon className={cn(
              'w-6 h-6',
              color === 'primary' && 'text-primary',
              color === 'secondary' && 'text-secondary',
              color === 'accent' && 'text-accent-foreground',
              color === 'destructive' && 'text-destructive',
            )} />
          </div>
        </div>
      </CardContent>
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-1',
        color === 'primary' && 'bg-primary',
        color === 'secondary' && 'bg-secondary',
        color === 'accent' && 'bg-accent',
        color === 'destructive' && 'bg-destructive',
      )} />
    </Card>
  );
}