import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getColorByCount = (count) => {
  if (count === 0) return 'bg-green-100 text-green-700';
  if (count <= 2) return 'bg-green-500 text-white';
  if (count <= 4) return 'bg-yellow-500 text-white';
  return 'bg-red-500 text-white';
};

export default function AppointmentCalendar({ currentMonth, onMonthChange, appointments, selectedDate, onDateClick }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = monthStart.getDay(); // 0=Sun, adjust if needed

  // Count appointments per day (excluding cancelled)
  const countMap = {};
  appointments.forEach(apt => {
    if (apt.status !== 'CANCELLED') {
      const dateKey = apt.appointmentDate;
      countMap[dateKey] = (countMap[dateKey] || 0) + 1;
    }
  });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
        {weekdays.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for start offset */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        {daysInMonth.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const count = countMap[dateKey] || 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          return (
            <button
              key={dateKey}
              onClick={() => onDateClick(day)}
              className={cn(
                "p-2 rounded-lg text-center transition-colors",
                isSelected && "ring-2 ring-primary ring-offset-2",
                !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50"
              )}
            >
              <div className="text-sm">{format(day, 'd')}</div>
              {count > 0 && (
                <div className={cn("mt-1 text-xs rounded-full px-1 py-0.5", getColorByCount(count))}>
                  {count}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}