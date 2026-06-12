import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, ChevronRight, Key, 
  Clock, Calendar as CalendarIcon 
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { CalendarEvent } from "./types";
import CalendarGrid from "./components/CalendarGrid";
import QuickEditModal from "./components/QuickEditModal";
import AdminPanel from "./components/AdminPanel";
import TodayView from "./components/TodayView";

// Connect to the serving backend using Socket.IO
// This will automatically connect to the same port and host serving the HTML
const socket: Socket = io({
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  reconnectionDelay: 2000
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CATEGORIES = [
  { name: "Work", color: "#D77A61" },
  { name: "Health", color: "#223843" },
  { name: "Personal", color: "#D77A61" },
  { name: "Urgent", color: "#D77A61" },
  { name: "Leisure", color: "#223843" },
  { name: "General", color: "#EFF1F3" }
];

const WALLPAPERS = [
  "radial-gradient(circle at 10% 20%, #223843 0%, rgba(34, 56, 67, 0) 65%), radial-gradient(circle at 90% 80%, #D77A61 0%, rgba(215, 122, 97, 0) 65%), #EFF1F3",
  "radial-gradient(circle at 85% 15%, #223843 0%, rgba(34, 56, 67, 0) 60%), radial-gradient(circle at 15% 85%, #D77A61 0%, rgba(215, 122, 97, 0) 60%), linear-gradient(135deg, #223843 0%, #EFF1F3 100%)",
  "linear-gradient(217deg, #223843, rgba(215,122,97,0) 70.71%), linear-gradient(127deg, #D77A61, rgba(239,241,243,0) 70.71%), linear-gradient(336deg, #EFF1F3, rgba(34,56,67,0) 70.71%)",
  "radial-gradient(circle at 50% 50%, #D77A61 0%, rgba(215,122,97,0) 80%), radial-gradient(circle at 5% 5%, #223843 0%, rgba(34, 56, 67, 0) 60%), #EFF1F3",
  "linear-gradient(135deg, #223843 0%, #D77A61 50%, #EFF1F3 100%)"
];

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  // Custom router state ('calendar' or 'admin')
  const [route, setRoute] = useState<"calendar" | "admin">("calendar");

  // View mode toggle ('month' or 'today')
  const [viewMode, setViewMode] = useState<"month" | "today">("today");

  // Pagination states of Month/Year
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed

  // Digital clock state (essential for public continuous TV boards!)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Quick edit modal state
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [selectedQuickDate, setSelectedQuickDate] = useState("");
  const [selectedQuickEvent, setSelectedQuickEvent] = useState<CalendarEvent | null>(null);

  // Initialize and check credentials
  useEffect(() => {
    // 1. Initialise path based routing
    const checkPath = () => {
      const path = window.location.pathname;
      if (path === "/admin") {
        setRoute("admin");
      } else {
        setRoute("calendar");
      }
    };
    
    // Check path initially
    checkPath();

    // Listen to windows navigation events
    window.addEventListener("popstate", checkPath);

    // 2. Auth check
    localStorage.setItem("calendar_admin_token", "admin-session-token-active");
    setIsAdminAuthenticated(true);

    // 3. Digital clock timer
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 4. REST fallback initial fetching to speed up loading
    fetchEvents();

    // Cleanup navigation and clock
    return () => {
      window.removeEventListener("popstate", checkPath);
      clearInterval(clockTimer);
    };
  }, []);

  // WebSockets synchronization
  useEffect(() => {
    // Track connection status
    if (socket.connected) {
      setIsSocketConnected(true);
    }

    const onConnect = () => {
      setIsSocketConnected(true);
      console.log("WebSocket connected to synchronized database.");
    };

    const onDisconnect = () => {
      setIsSocketConnected(false);
      console.log("WebSocket connection suspended.");
    };

    const onInitialSync = (syncedEvents: CalendarEvent[]) => {
      setEvents(syncedEvents);
    };

    const onEventsUpdated = (updatedEvents: CalendarEvent[]) => {
      setEvents(updatedEvents);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("initial_sync", onInitialSync);
    socket.on("events_updated", onEventsUpdated);

    // If socket already connected, force initial status
    if (socket.connected) {
      setIsSocketConnected(true);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("initial_sync", onInitialSync);
      socket.off("events_updated", onEventsUpdated);
    };
  }, []);

  // REST Event fetcher fallback
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed standard events fetch REST fallback:", err);
    }
  };

  // Navigate routing helper
  const navigateTo = (newRoute: "calendar" | "admin") => {
    setRoute(newRoute);
    const path = newRoute === "admin" ? "/admin" : "/";
    window.history.pushState({}, "", path);
  };

  // Month navigation pagination helpers
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleTodayReset = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Authenticate admin API route
  const handleAuthenticate = async (password: string): Promise<boolean> => {
    localStorage.setItem("calendar_admin_token", "admin-session-token-active");
    setIsAdminAuthenticated(true);
    return true;
  };

  const handleLogout = () => {
    // Keep admin session active to bypass password gates
    localStorage.setItem("calendar_admin_token", "admin-session-token-active");
    setIsAdminAuthenticated(true);
  };

  // CRUD operation proxying with token authorization
  const handleSaveEvent = async (eventData: Omit<CalendarEvent, "id"> & { id?: string }): Promise<boolean> => {
    const token = localStorage.getItem("calendar_admin_token");
    const isEdit = !!eventData.id;
    const url = isEdit ? `/api/events/${eventData.id}` : "/api/events";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(isEdit ? eventData : { ...eventData, id: undefined })
      });

      if (res.ok) {
        await fetchEvents(); // fallback fetch
        return true;
      } else if (res.status === 401) {
        // Token session expired
        handleLogout();
        alert("Your admin session has expired. Please authenticate again.");
      }
      return false;
    } catch (err) {
      console.error("Save event error:", err);
      return false;
    }
  };

  const handleDeleteEvent = async (id: string): Promise<boolean> => {
    const token = localStorage.getItem("calendar_admin_token");
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        await fetchEvents(); // fallback fetch
        return true;
      } else if (res.status === 401) {
        handleLogout();
        alert("Your admin session has expired. Please authenticate again.");
      }
      return false;
    } catch (err) {
      console.error("Delete event error:", err);
      return false;
    }
  };

  // Quick edit modal launch triggers
  const handleDateClick = (dateStr: string) => {
    setSelectedQuickDate(dateStr);
    setSelectedQuickEvent(null);
    setIsQuickEditOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedQuickDate(event.date);
    setSelectedQuickEvent(event);
    setIsQuickEditOpen(true);
  };

  // Formatting helper for clock in GMT+7 (Asia/Jakarta / WIB)
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

  // Main Display Screen (Default Public View, fully immersive and unified)
  const currentWallpaperIndex = currentTime.getMinutes() % WALLPAPERS.length;
  const currentWallpaperStr = WALLPAPERS[currentWallpaperIndex];

  return (
    <div 
      id="application-container" 
      className="h-screen w-screen flex flex-col font-sans overflow-hidden transition-all duration-[1000ms] ease-in-out"
      style={{ background: currentWallpaperStr }}
    >
      
      {/* Main Content Area - Grid */}
      <main className="flex-1 overflow-hidden">
        {route === "admin" ? (
          <AdminPanel
            events={events}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
            isAdminAuthenticated={isAdminAuthenticated}
            onAuthenticate={handleAuthenticate}
            onLogout={handleLogout}
            onBackToCalendar={() => navigateTo("calendar")}
          />
        ) : viewMode === "month" ? (
          <CalendarGrid
            events={events}
            year={currentYear}
            month={currentMonth}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            currentTime={currentTime}
            isSocketConnected={isSocketConnected}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onTodayReset={handleTodayReset}
            onAdminClick={() => navigateTo("admin")}
          />
        ) : (
          <TodayView
            events={events}
            currentTime={currentTime}
            onAddEventToday={() => {
              const year = currentTime.getFullYear();
              const month = String(currentTime.getMonth() + 1).padStart(2, "0");
              const day = String(currentTime.getDate()).padStart(2, "0");
              handleDateClick(`${year}-${month}-${day}`);
            }}
            onEventClick={handleEventClick}
            isSocketConnected={isSocketConnected}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onAdminClick={() => navigateTo("admin")}
          />
        )}
      </main>

      {/* Quick Edit Overlay Portal Modal */}
      <QuickEditModal
        isOpen={isQuickEditOpen}
        onClose={() => setIsQuickEditOpen(false)}
        selectedDate={selectedQuickDate}
        selectedEvent={selectedQuickEvent}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        isAdminAuthenticated={isAdminAuthenticated}
        onAuthenticate={handleAuthenticate}
      />
    </div>
  );
}
