import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Helper to get badge color based on appointment count (optional – keeps original logic but style matches theme)
const getCountBadgeClass = (count) => {
  if (count === 0) return '';
  if (count <= 2) return 'bg-red-500 text-white';
  if (count <= 4) return 'bg-amber-500 text-white';
  return 'bg-red-700 text-white';
};

export default function AppointmentCalendar({ currentMonth, onMonthChange, appointments, selectedDate, onDateClick }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = monthStart.getDay(); // 0 = Sunday

  // Count appointments per day (exclude cancelled)
  const countMap = {};
  appointments.forEach(apt => {
    if (apt.status !== 'CANCELLED') {
      const dateKey = apt.appointmentDate;
      countMap[dateKey] = (countMap[dateKey] || 0) + 1;
    }
  });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 w-full">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(-1)}
          className="hover:bg-primary/10 hover:text-primary"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold text-primary">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(1)}
          className="hover:bg-primary/10 hover:text-primary"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-3">
        {weekdays.map(day => (
          <div
            key={day}
            className="text-center text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {day.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {/* Empty cells for offset */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {daysInMonth.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const count = countMap[dateKey] || 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={dateKey}
              onClick={() => onDateClick(day)}
              className={cn(
                "relative group aspect-square rounded-lg transition-all duration-200",
                "flex flex-col items-center justify-center gap-0.5",
                "hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/50",
                !isCurrentMonth && "opacity-40",
                isSelected && "bg-primary text-white shadow-md hover:bg-primary/90"
              )}
            >
              <span className={cn(
                "text-sm md:text-base font-medium",
                isSelected ? "text-white" : "text-foreground"
              )}>
                {format(day, 'd')}
              </span>
              {count > 0 && (
                <div className={cn(
                  "text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold",
                  getCountBadgeClass(count),
                  isSelected && "bg-white text-primary"
                )}>
                  {count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend – small footer to explain badge colors (optional) */}
      <div className="flex justify-center gap-4 mt-6 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>1‑2 bookings</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span>3‑4 bookings</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-700" />
          <span>5+ bookings</span>
        </div>
      </div>
    </div>
  );
}