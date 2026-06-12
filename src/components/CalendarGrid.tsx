import React from "react";
import { Plus, Edit3, Clock, ChevronLeft, ChevronRight, Key } from "lucide-react";
import { CalendarEvent } from "../types";

interface CalendarGridProps {
  events: CalendarEvent[];
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  onDateClick: (dateStr: string) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;

  // Integrated Top Controls Props
  currentTime: Date;
  isSocketConnected: boolean;
  viewMode: "month" | "today";
  setViewMode: (mode: "month" | "today") => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayReset: () => void;
  onAdminClick: () => void;
}

const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function CalendarGrid({
  events,
  year,
  month,
  onDateClick,
  onEventClick,
  currentTime,
  isSocketConnected,
  viewMode,
  setViewMode,
  onPrevMonth,
  onNextMonth,
  onTodayReset,
  onAdminClick
}: CalendarGridProps) {
  // Calendar structure generation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Highlight today helper
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: {
    dateString: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  // 1. Previous month overlapping days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = year - 1;
    }
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`;
    cells.push({
      dateString: dateStr,
      dayNumber: prevDay,
      isCurrentMonth: false,
      isToday: dateStr === todayStr
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      dateString: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr
    });
  }

  // 3. Next month overlapping days (pad out to complete the grid of 42 cells)
  const remainingCells = 42 - cells.length;
  for (let n = 1; n <= remainingCells; n++) {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear = year + 1;
    }
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
    cells.push({
      dateString: dateStr,
      dayNumber: n,
      isCurrentMonth: false,
      isToday: dateStr === todayStr
    });
  }

  // Helper to filter and sort events for a specific date
  const getEventsForDate = (dateString: string): CalendarEvent[] => {
    return events
      .filter((e) => e.date === dateString)
      .sort((a, b) => {
        if (!a.time) return -1;
        if (!b.time) return 1;
        return a.time.localeCompare(b.time);
      });
  };

  // Helper to format 24h string into AM/PM
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return "";
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutesStr} ${ampm}`;
  };

  // Color normalization helper to rule out any previous/future blue accents and map them to brand coral
  const normalizeColor = (colorStr?: string): string => {
    if (!colorStr) return "#D77A61";
    const cleaned = colorStr.trim().toLowerCase();
    const blueHues = [
      "blue", "indigo", "sky", "cyan", 
      "#3b82f6", "#2563eb", "#1d4ed8", "#1e3a8a", "#60a5fa", "#93c5fd",
      "#6366f1", "#4f46e5", "#4338ca", "#3730a3"
    ];
    if (blueHues.includes(cleaned)) {
      return "#D77A61";
    }
    return colorStr;
  };

  // Clock format calculations
  const timeFormatted = currentTime.toLocaleTimeString("id-ID", { 
    timeZone: "Asia/Jakarta", 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  }) + " WIB";

  const dateFormatted = currentTime.toLocaleDateString("id-ID", { 
    timeZone: "Asia/Jakarta", 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <div id="calendar-view-root" className="flex flex-col flex-1 h-full bg-transparent text-[#EFF1F3] p-3 md:p-6 select-none overflow-hidden">
      
      {/* Integrated top operational controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-2 border-b border-[#EFF1F3]/10">
        
        {/* Left Section: Branding & Real-time Live Connection */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="p-2 bg-[#223843]/60 text-[#EFF1F3] rounded-xl border border-[#EFF1F3]/20 shadow-md backdrop-blur-md">
            <Clock size={16} className="animate-pulse text-[#D77A61]" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-[#EFF1F3] tracking-tight flex items-center gap-2">
              WaktuSync
              {isSocketConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#D77A61]/20 text-[#EFF1F3] border border-[#D77A61]/30 shadow-xs">
                  <span className="w-1.5 h-1.5 bg-[#D77A61] rounded-full animate-ping"></span>
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#223843]/40 text-[#EFF1F3]/60 border border-[#EFF1F3]/20">
                  <span className="w-1.5 h-1.5 bg-[#D77A61]/70 rounded-full animate-pulse"></span>
                  Sync
                </span>
              )}
            </h1>
            <p className="text-[8px] md:text-[10px] text-[#EFF1F3]/65 uppercase tracking-wider font-semibold font-mono">Continuous Monitor Display Active</p>
          </div>
        </div>

        {/* Center Section: View Mode Switcher and Current Month Navigation */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          
          {/* Switch Mode Button */}
          <div className="flex items-center bg-[#223843]/60 backdrop-blur-md border border-[#EFF1F3]/15 rounded-xl p-0.5 md:p-1 shadow-md">
            <button
              id="calendar-toggle-month"
              disabled
              className="px-2.5 py-1 md:px-3.5 md:py-1.5 text-[11px] md:text-xs font-bold bg-[#D77A61] text-[#EFF1F3] rounded-lg shadow-sm"
            >
              Kalender Bulanan
            </button>
            <button
              id="calendar-toggle-today"
              onClick={() => setViewMode("today")}
              className="px-2.5 py-1 md:px-3.5 md:py-1.5 text-[11px] md:text-xs font-semibold text-[#EFF1F3]/75 hover:text-white rounded-lg transition-all cursor-pointer"
            >
              Tampilan Hari Ini
            </button>
          </div>

          <span className="w-px h-5 bg-[#EFF1F3]/15 hidden lg:block" />

          {/* Pagination Controls block */}
          <div className="flex items-center bg-[#223843]/40 backdrop-blur-md border border-[#EFF1F3]/15 rounded-xl p-0.5 md:p-1 shadow-inner">
            <button
              id="calendar-prev-month"
              onClick={onPrevMonth}
              className="p-1 text-[#EFF1F3] hover:text-white hover:bg-[#D77A61]/30 rounded-lg transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 md:px-4 text-[10px] md:text-xs font-bold text-[#EFF1F3] min-w-[100px] md:min-w-[130px] text-center uppercase tracking-wider select-none font-mono">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              id="calendar-next-month"
              onClick={onNextMonth}
              className="p-1 text-[#EFF1F3] hover:text-white hover:bg-[#D77A61]/30 rounded-lg transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            id="calendar-today-reset"
            onClick={onTodayReset}
            className="px-2.5 py-1.5 md:px-3.5 md:py-2 text-[10px] md:text-xs font-semibold text-[#EFF1F3] bg-[#223843]/50 border border-[#EFF1F3]/15 hover:bg-[#D77A61]/30 hover:text-white rounded-xl cursor-pointer shadow-md transition-all font-sans"
            title="Reset to current month"
          >
            Today
          </button>
        </div>

        {/* Right Section: Digital Clock & Admin Action portal */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* Integrated clock reading */}
          <div className="hidden xl:flex flex-col text-right">
            <span className="text-sm font-extrabold font-mono text-[#EFF1F3] tabular-nums leading-none">
              {timeFormatted}
            </span>
            <span className="text-[10px] uppercase font-bold text-[#EFF1F3]/60 font-sans tracking-wide mt-1.5">
              {dateFormatted}
            </span>
          </div>

          <span className="hidden xl:block w-px h-6 bg-[#EFF1F3]/15" />

          <button
            id="calendar-panel-admin-btn"
            onClick={onAdminClick}
            className="flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 text-[11px] md:text-xs font-bold text-[#EFF1F3] bg-[#D77A61] hover:bg-[#D77A61]/90 border border-[#EFF1F3]/15 rounded-xl cursor-pointer shadow-lg transition-all"
          >
            <Key size={12} />
            <span>Admin Control</span>
          </button>
        </div>

      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border border-[#EFF1F3]/10 bg-[#223843]/40 backdrop-blur-md rounded-t-xl overflow-hidden mt-1 md:mt-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1.5 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-[#EFF1F3]/80 uppercase tracking-wider font-sans"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid - fills remaining height perfectly */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 gap-px bg-[#EFF1F3]/15 border-x border-b border-[#EFF1F3]/15 rounded-b-xl overflow-hidden backdrop-blur-lg">
        {cells.map((cell, idx) => {
          const dateEvents = getEventsForDate(cell.dateString);
          
          return (
            <div
              key={`${cell.dateString}-${idx}`}
              className={`relative group min-h-0 p-1 sm:p-2 md:p-2.5 bg-[#223843]/60 hover:bg-[#223843]/85 transition-all duration-200 flex flex-col justify-between ${
                !cell.isCurrentMonth ? "opacity-25" : ""
              } ${cell.isToday ? "ring-2 ring-[#D77A61] ring-inset z-10 bg-[#D77A61]/10" : ""}`}
            >
              {/* Day Cell Header */}
              <div className="flex justify-between items-start">
                <span
                  className={`inline-flex items-center justify-center text-xs md:text-sm font-extrabold rounded-full w-5 h-5 sm:w-7 sm:h-7 ${
                    cell.isToday
                      ? "bg-[#D77A61] text-[#EFF1F3] shadow-md border border-[#EFF1F3]/25 animate-pulse"
                      : "text-[#EFF1F3]"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* Direct quick-add hover trigger */}
                <button
                  id={`quick-add-${cell.dateString}`}
                  onClick={() => onDateClick(cell.dateString)}
                  className="opacity-0 group-hover:opacity-100 hidden sm:flex items-center gap-0.5 px-1 py-0.5 md:px-1.5 md:py-1 text-[9px] md:text-[10px] font-bold text-[#EFF1F3] hover:text-[#EFF1F3] hover:bg-[#D77A61]/30 border border-[#EFF1F3]/15 rounded-md transition-all self-center cursor-pointer"
                  title="Add event to this date"
                >
                  <Plus size={10} />
                  <span>Add</span>
                </button>
              </div>

              {/* Events Container */}
              <div className="flex-1 mt-1 mb-0.5 overflow-y-auto space-y-1 scrollbar-thin">
                {dateEvents.map((evt) => (
                  <div
                    key={evt.id}
                    id={`event-item-${evt.id}`}
                    onClick={(e) => onEventClick(evt, e)}
                    className="relative cursor-pointer select-none py-0.5 px-1 sm:py-1 sm:px-1.5 md:py-1.5 md:px-2.5 rounded-md sm:rounded-lg border border-transparent shadow-md transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] flex flex-col gap-0.1 text-left group/event"
                    style={{
                      backgroundColor: `${normalizeColor(evt.color)}20`, // Transparent accents
                      borderLeft: `3px sm:border-left-4 solid ${normalizeColor(evt.color)}`,
                    }}
                    title={evt.description || evt.title}
                  >
                    <span 
                      className="text-[9px] sm:text-xs font-black truncate text-[#EFF1F3]"
                    >
                      {evt.title}
                    </span>
                    
                    {evt.time && (
                      <span className="text-[8px] sm:text-[10px] font-bold font-mono text-[#EFF1F3]/90 flex items-center gap-0.5">
                        <Clock size={8} className="stroke-[2.5]" />
                        {formatTime(evt.time)}
                      </span>
                    )}

                    {/* Show subtle edit icon */}
                    <div className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/event:opacity-100 p-0.5 bg-[#D77A61] border border-[#EFF1F3]/15 text-[#EFF1F3] rounded shadow transition-opacity">
                      <Plus size={8} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty state overlay invite */}
              {dateEvents.length === 0 && (
                <div 
                  onClick={() => onDateClick(cell.dateString)}
                  className="flex-1 w-full cursor-pointer"
                  title="Click to add event"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
