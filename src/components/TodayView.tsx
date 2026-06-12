import React from "react";
import { Clock, Calendar, Plus, Edit2, Smile, AlertCircle, Key } from "lucide-react";
import { CalendarEvent } from "../types";

interface TodayViewProps {
  events: CalendarEvent[];
  currentTime: Date;
  onAddEventToday: () => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
  
  // Header-integrated properties
  isSocketConnected: boolean;
  viewMode: "month" | "today";
  setViewMode: (mode: "month" | "today") => void;
  onAdminClick: () => void;
}

export default function TodayView({
  events,
  currentTime,
  onAddEventToday,
  onEventClick,
  isSocketConnected,
  viewMode,
  setViewMode,
  onAdminClick
}: TodayViewProps) {
  // Get today's local date string YYYY-MM-DD
  const getTodayStr = () => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "numeric",
        day: "numeric"
      }).formatToParts(currentTime);
      const year = parts.find(p => p.type === "year")?.value || "";
      const month = String(parts.find(p => p.type === "month")?.value || "").padStart(2, "0");
      const day = String(parts.find(p => p.type === "day")?.value || "").padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (e) {
      const year = currentTime.getFullYear();
      const month = String(currentTime.getMonth() + 1).padStart(2, "0");
      const day = String(currentTime.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  };

  const todayStr = getTodayStr();
  
  // Filter events for today and sort chronologically
  const todayEvents = events
    .filter((e) => e.date === todayStr)
    .sort((a, b) => {
      if (!a.time) return -1;
      if (!b.time) return 1;
      return a.time.localeCompare(b.time);
    });

  // Date formatting helpers
  const dayNumber = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", day: "numeric" }).format(currentTime),
    10
  );
  const dayName = currentTime.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long" });
  const monthYearStr = currentTime.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", month: "long", year: "numeric" });
  const timeFormatted = currentTime.toLocaleTimeString("id-ID", { 
    timeZone: "Asia/Jakarta", 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  }) + " WIB";

  // Format 24h into AM/PM
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return "All Day";
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

  return (
    <div id="today-view-root" className="h-full w-full flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 bg-transparent text-[#EFF1F3] overflow-hidden select-none">
      
      {/* Left panel: Large clock & date displays (40% width on md) */}
      <div id="today-left-panel" className="h-[46%] md:h-full md:w-[38%] flex flex-col justify-between bg-[#223843]/55 border border-[#EFF1F3]/15 rounded-2xl p-4 sm:p-5 md:p-8 relative overflow-hidden backdrop-blur-xl shrink-0 shadow-lg">
        
        {/* Ambient top decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D77A61]/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-3 md:space-y-6">
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#EFF1F3] tracking-tight flex items-center gap-2">
                WaktuSync
                {isSocketConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#D77A61]/25 text-[#EFF1F3] border border-[#D77A61]/40 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-[#D77A61] rounded-full animate-ping"></span>
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#223843]/40 text-[#EFF1F3]/60 border border-[#EFF1F3]/20">
                    <span className="w-1.5 h-1.5 bg-[#D77A61]/70 rounded-full animate-pulse"></span>
                    Sync
                  </span>
                )}
              </h1>
              
              <button
                id="today-panel-admin-btn"
                onClick={onAdminClick}
                className="p-1 px-2 bg-[#D77A61] text-[#EFF1F3] hover:bg-[#D77A61]/80 border border-[#EFF1F3]/15 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-md"
                title="Admin Center"
              >
                <Key size={12} />
                <span>Admin</span>
              </button>
            </div>

            {/* View Mode Toggle Switch */}
            <div className="flex items-center bg-[#223843]/70 border border-[#EFF1F3]/15 rounded-xl p-1 shadow-inner w-full backdrop-blur-md">
              <button
                id="today-toggle-month"
                onClick={() => setViewMode("month")}
                className="flex-1 py-1 sm:py-1.5 text-xs font-semibold text-[#EFF1F3]/75 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                Kalender Bulanan
              </button>
              <button
                id="today-toggle-today"
                disabled
                className="flex-1 py-1 sm:py-1.5 text-xs font-bold bg-[#D77A61] text-[#EFF1F3] rounded-lg shadow-sm"
              >
                Tampilan Hari Ini
              </button>
            </div>
          </div>
          
          <div className="space-y-0.5 md:space-y-1 pt-1 md:pt-2">
            <h2 className="text-md md:text-xl font-medium text-[#EFF1F3]/80 leading-tight">{dayName}</h2>
            <div className="flex items-baseline gap-2 md:gap-4">
              <span className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-[#EFF1F3] tracking-tighter tabular-nums leading-none">
                {dayNumber}
              </span>
              <span className="text-lg md:text-2xl font-bold text-[#EFF1F3]/85 leading-none">
                {monthYearStr}
              </span>
            </div>
          </div>
        </div>

        {/* Giant Monospace Live Clock */}
        <div className="my-2 md:my-8 space-y-1 md:space-y-2">
          <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-widest text-[#D77A61] flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#D77A61] rounded-full animate-ping"></span>
            Live Local Sync Time
          </span>
          <div className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-mono tracking-tight text-[#EFF1F3] tabular-nums select-all">
            {timeFormatted}
          </div>
        </div>

        {/* Statistics & Quick Add event for today */}
        <div className="space-y-3 md:space-y-5 pt-3 md:pt-6 border-t border-[#EFF1F3]/20">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-[#EFF1F3]/80 font-medium">Agenda Hari Ini:</span>
            <span className="font-bold font-mono px-2 py-0.5 md:px-2.5 bg-[#D77A61]/25 rounded-full text-[#EFF1F3] border border-[#EFF1F3]/20 shadow-sm text-[11.5px] md:text-xs">
              {todayEvents.length} Kegiatan
            </span>
          </div>

          <button
            id="today-quick-add-btn"
            onClick={onAddEventToday}
            className="w-full py-2.5 sm:py-3.5 md:py-4.5 bg-[#D77A61] hover:bg-[#D77A61]/85 hover:scale-[1.01] active:scale-[0.99] text-[#EFF1F3] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[#D77A61]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Tambah Agenda Hari Ini</span>
          </button>
        </div>
      </div>

      {/* Right panel: Events list display area (62% width on md) */}
      <div id="today-events-panel" className="flex-1 flex flex-col min-h-0 bg-[#223843]/45 border border-[#EFF1F3]/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg">
        
        {/* Right header */}
        <div className="px-4 py-3 md:px-6 md:py-5 border-b border-[#EFF1F3]/10 bg-[#223843]/55 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#D77A61]" />
            <h3 className="font-bold text-sm md:text-lg text-[#EFF1F3] uppercase tracking-wide">
              Timeline Kegiatan Hari Ini
            </h3>
          </div>
          <span className="text-xs text-[#EFF1F3]/80 font-mono">
            {todayStr}
          </span>
        </div>

        {/* Content list: must remain fully non-scrollable or beautifully self-contained to satisfy user requirements of 1 layar tanpa scroll! */}
        <div className="flex-1 p-3 md:p-6 overflow-y-auto space-y-3 md:space-y-4">
          {todayEvents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#223843]/50 rounded-2xl flex items-center justify-center text-[#EFF1F3] border border-[#EFF1F3]/15 mb-3 md:mb-4 shadow-md shadow-[#223843]/10">
                <Smile size={28} />
              </div>
              <h4 className="text-md md:text-lg font-bold text-[#EFF1F3]">Hari ini bersih dari agenda!</h4>
              <p className="text-xs md:text-sm text-[#EFF1F3]/70 max-w-sm mt-1">
                Tidak ada agenda yang dijadwalkan untuk hari ini. Silakan tambahkan kegiatan baru menggunakan tombol tambah di sebelah kiri.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {todayEvents.map((evt) => (
                <div
                  key={evt.id}
                  id={`today-event-item-${evt.id}`}
                  onClick={(e) => onEventClick(evt, e)}
                  className="interactive-card cursor-pointer bg-[#223843]/70 border border-[#EFF1F3]/15 rounded-xl p-3.5 md:p-5 hover:bg-[#223843]/85 hover:ring-2 hover:ring-[#D77A61]/60 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 pointer-events-auto relative group shadow-sm"
                  style={{
                    borderLeft: `5px solid ${normalizeColor(evt.color)}`
                  }}
                >
                  <div className="space-y-1.5 md:space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: `${normalizeColor(evt.color)}20`, color: normalizeColor(evt.color) }}
                      >
                        {evt.category || "General"}
                      </span>
                      {evt.time && (
                        <span className="text-xs font-semibold font-mono text-[#EFF1F3] flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(evt.time)}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-sm md:text-md font-bold text-[#EFF1F3] tracking-tight truncate">
                      {evt.title}
                    </h4>

                    {evt.description && (
                      <p className="text-[11px] md:text-xs text-[#EFF1F3]/80 line-clamp-2 pr-4 font-sans leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-[#EFF1F3] flex items-center gap-1 bg-[#D77A61] px-2 py-1.5 rounded-lg border border-[#EFF1F3]/20 transition-opacity">
                      <Edit2 size={10} /> Edit Kegiatan
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
