import React from "react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  addDays,
  isSameDay,
  isSameMonth,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppointmentCalendar({
  currentMonth,
  onMonthChange,
  appointments = [],
  selectedDate,
  onDateClick,
}) {
  const monthStart = startOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(monthStart);
  const startingDayOfWeek = getDay(monthStart);
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(addDays(monthStart, i - 1));
  }

  const hasAppointments = (date) => {
    return appointments.some(
      (a) => a.appointmentDate && isSameDay(new Date(a.appointmentDate), date),
    );
  };

  const appointmentCount = (date) => {
    return appointments.filter(
      (a) => a.appointmentDate && isSameDay(new Date(a.appointmentDate), date),
    ).length;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base">
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onMonthChange(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onMonthChange(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) =>
            day ? (
              <button
                key={idx}
                onClick={() => onDateClick(day)}
                className={cn(
                  "p-2 text-xs rounded-lg border transition-colors relative group",
                  isSameMonth(day, currentMonth)
                    ? "hover:bg-muted cursor-pointer"
                    : "text-muted-foreground/50",
                  selectedDate && isSameDay(day, selectedDate)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border",
                )}
              >
                <div className="font-semibold">{format(day, "d")}</div>
                {hasAppointments(day) && (
                  <div className="text-[10px] mt-0.5">
                    <div className="text-primary font-bold">
                      {appointmentCount(day)} appt
                    </div>
                  </div>
                )}
              </button>
            ) : (
              <div key={idx} className="p-2" />
            ),
          )}
        </div>
      </CardContent>
    </Card>
  );
}
