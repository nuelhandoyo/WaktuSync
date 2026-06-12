import React, { useState, useEffect } from "react";
import { 
  Key, LogOut, Plus, Search, Calendar, Tag, Trash2, 
  Edit3, AlertCircle, Sparkles, CheckCircle2, RefreshCw, ChevronLeft, CalendarDays, BarChart3
} from "lucide-react";
import { CalendarEvent } from "../types";

interface AdminPanelProps {
  events: CalendarEvent[];
  onSaveEvent: (eventData: Omit<CalendarEvent, "id"> & { id?: string }) => Promise<boolean>;
  onDeleteEvent: (id: string) => Promise<boolean>;
  isAdminAuthenticated: boolean;
  onAuthenticate: (password: string) => Promise<boolean>;
  onLogout: () => void;
  onBackToCalendar: () => void;
}

const CATEGORIES = [
  { name: "Work", color: "#D77A61", textClass: "text-[#D77A61]", bgClass: "bg-[#D77A61]/10" },
  { name: "Health", color: "#223843", textClass: "text-[#EFF1F3]", bgClass: "bg-[#223843]/60" },
  { name: "Personal", color: "#D77A61", textClass: "text-[#D77A61]", bgClass: "bg-[#D77A61]/10" },
  { name: "Urgent", color: "#D77A61", textClass: "text-[#D77A61]", bgClass: "bg-[#D77A61]/25" },
  { name: "Leisure", color: "#223843", textClass: "text-[#EFF1F3]", bgClass: "bg-[#223843]/40" },
  { name: "General", color: "#EFF1F3", textClass: "text-[#EFF1F3]", bgClass: "bg-[#EFF1F3]/10" }
];

export default function AdminPanel({
  events,
  onSaveEvent,
  onDeleteEvent,
  isAdminAuthenticated,
  onAuthenticate,
  onLogout,
  onBackToCalendar
}: AdminPanelProps) {
  // Login State
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Form Editor State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [color, setColor] = useState("#6B7280");

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // General States
  const [formLoading, setFormLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Reset form helper
  const resetForm = (targetDate?: string) => {
    setEditingEventId(null);
    setTitle("");
    setDate(targetDate || new Date().toISOString().split("T")[0]);
    setTime("");
    setDescription("");
    setCategory("General");
    setColor("#6B7280");
    setStatusMessage(null);
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      resetForm();
    }
  }, [isAdminAuthenticated]);

  // Adjust custom color based on category selection
  const handleCategoryChange = (catName: string) => {
    setCategory(catName);
    const cat = CATEGORIES.find(c => c.name === catName);
    if (cat) {
      setColor(cat.color);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const success = await onAuthenticate(password);
      if (!success) {
        setAuthError("Incorrect password. Please try again.");
      }
    } catch (err) {
      setAuthError("An error occurred during authentication.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEditSelect = (evt: CalendarEvent) => {
    setEditingEventId(evt.id);
    setTitle(evt.title);
    setDate(evt.date);
    setTime(evt.time || "");
    setDescription(evt.description || "");
    setCategory(evt.category || "General");
    setColor(evt.color || "#6B7280");
    setStatusMessage(null);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      setStatusMessage({ text: "Please enter a valid title and date.", type: "error" });
      return;
    }

    setFormLoading(true);
    setStatusMessage(null);

    try {
      const eventData = {
        id: editingEventId || undefined,
        title: title.trim(),
        date,
        time,
        description: description.trim(),
        category,
        color
      };

      const success = await onSaveEvent(eventData);
      if (success) {
        setStatusMessage({
          text: editingEventId ? "Event updated successfully!" : "New event created and broadcasted!",
          type: "success"
        });
        resetForm(date); // keep the last used date convenient of multiple creations
      } else {
        setStatusMessage({ text: "Could not save event to storage. Check backend.", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "An error occurred during save.", type: "error" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this event? This affects all live screens instantly.")) {
      return;
    }

    try {
      const success = await onDeleteEvent(id);
      if (success) {
        setStatusMessage({ text: "Event deleted and sync broadcasted.", type: "success" });
        if (editingEventId === id) {
          resetForm();
        }
      } else {
        setStatusMessage({ text: "Could not delete event from storage.", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "An error occurred during delete.", type: "error" });
    }
  };

  // Filter events chronologically (newest first or chronological by date)
  const filteredEvents = events
    .filter((evt) => {
      const matchesSearch = 
        evt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        evt.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryFilter === "All" || evt.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by date primary, then time secondary
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time || "").localeCompare(b.time || "");
    });

  // Calculate some simple statistics
  const totalCount = events.length;
  const categoriesCount = CATEGORIES.reduce((acc, cat) => {
    acc[cat.name] = events.filter(e => e.category === cat.name).length;
    return acc;
  }, {} as Record<string, number>);

  // Render Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div id="admin-login-screen" className="min-h-screen bg-transparent flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="absolute top-6 left-6">
          <button
            id="login-back-btn"
            onClick={onBackToCalendar}
            className="flex items-center gap-2 text-[#EFF1F3]/75 hover:text-[#EFF1F3] text-sm font-semibold transition-all group"
          >
            <ChevronLeft size={16} className="transform group-hover:-translate-x-1 transition-transform text-[#D77A61]" />
            <span>Lihat Kalender Publik</span>
          </button>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-[#223843]/60 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#D77A61] ring-8 ring-[#D77A61]/10">
              <Key size={26} className="animate-pulse" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-[#EFF1F3] font-sans">
            WaktuSync Admin
          </h2>
          <p className="mt-2 text-center text-sm text-[#EFF1F3]/75 max-w-sm mx-auto font-medium">
            Akses khusus administrator. Semua perubahan disinkronkan secara real-time.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-[#223843]/65 backdrop-blur-xl py-8 px-8 shadow-2xl rounded-2xl border border-[#EFF1F3]/20">
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label htmlFor="password-field" className="block text-xs font-semibold text-[#EFF1F3]/80 uppercase tracking-widest">
                  Kata Sandi Administrator
                </label>
                <div className="mt-2.5">
                  <input
                    id="password-field"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi admin"
                    className="w-full px-4 py-3 bg-[#223843]/40 border border-[#EFF1F3]/15 rounded-xl text-[#EFF1F3] text-sm font-mono placeholder-[#EFF1F3]/40 focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all text-center"
                    disabled={authLoading}
                    autoFocus
                  />
                </div>
                {authError && (
                  <div className="mt-4 flex items-center gap-1.5 justify-center text-xs text-[#EFF1F3] bg-[#D77A61]/20 border border-[#D77A61]/30 p-2.5 rounded-xl animate-shake">
                    <AlertCircle size={14} className="shrink-0 text-[#D77A61]" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  id="admin-login-submit"
                  type="submit"
                  disabled={authLoading || !password}
                  className="w-full py-3 px-4 bg-[#D77A61] hover:bg-[#D77A61]/90 text-[#EFF1F3] font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {authLoading ? (
                    <span className="w-4 h-4 border-2 border-[#EFF1F3]/20 border-t-[#EFF1F3] rounded-full animate-spin"></span>
                  ) : (
                    "Masuk Portal Admin"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-[#EFF1F3]/10 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#223843]/40 border border-[#EFF1F3]/10 rounded-full text-[11px] font-mono font-medium text-[#EFF1F3]/70">
                PIN Default: <strong className="text-[#D77A61]">admin123</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Admin Workspace
  return (
    <div id="admin-workspace" className="min-h-screen bg-transparent flex flex-col font-sans overflow-y-auto">
      
      {/* Top Header */}
      <header className="bg-[#223843]/60 backdrop-blur-md border-b border-[#EFF1F3]/15 px-6 py-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#223843]/60 backdrop-blur-md border border-[#EFF1F3]/20 rounded-xl flex items-center justify-center text-[#D77A61] shadow-md">
              <Key size={18} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#EFF1F3] tracking-tight flex items-center gap-2">
                Pusat Kontrol WaktuSync
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D77A61]/25 text-[#EFF1F3] border border-[#D77A61]/40 shadow-xs">
                  Live Sync
                </span>
              </h1>
              <p className="text-xs text-[#EFF1F3]/70 font-semibold uppercase tracking-wider">Terhubung ke jaringan, siaran otomatis saat disimpan</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <button
              id="view-calendar-btn"
              onClick={onBackToCalendar}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#EFF1F3] bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl hover:bg-[#D77A61]/35 transition-all cursor-pointer shadow-md backdrop-blur-md"
            >
              <CalendarDays size={14} className="text-[#D77A61]" />
              <span>Kembali Ke Kalender</span>
            </button>
            <button
              id="admin-logout-btn"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#EFF1F3] bg-[#D77A61] hover:bg-[#D77A61]/90 border border-[#EFF1F3]/15 rounded-xl transition-all cursor-pointer shadow-md"
              title="Refresh all synchronized data"
            >
              <RefreshCw size={14} />
              <span>Segarkan Live</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Stats Banner */}
      <section className="bg-[#223843]/45 backdrop-blur-md border-b border-[#EFF1F3]/10 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap text-xs text-[#EFF1F3]/80 font-mono">
          <div className="flex items-center gap-1.5 pr-4 border-r border-[#EFF1F3]/15">
            <BarChart3 size={13} className="text-[#D77A61] animate-pulse" />
            <span className="font-bold text-[#EFF1F3]">{totalCount}</span> Total Kegiatan
          </div>
          <div className="flex gap-4 flex-wrap">
            {CATEGORIES.map(cat => (
              <span key={cat.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}:</span>
                <strong className="text-[#EFF1F3]">{categoriesCount[cat.name] || 0}</strong>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Content Space split layout */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* Left Side: Event database list & Search - 7cols */}
        <section className="col-span-1 lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-[#223843]/60 backdrop-blur-xl p-5 rounded-2xl border border-[#EFF1F3]/15 shadow-xl space-y-4">
            
            {/* Search and Filters Header */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#EFF1F3]/50" />
                <input
                  id="admin-event-search"
                  type="text"
                  placeholder="Cari kegiatan berdasarkan nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#223843]/40 border border-[#EFF1F3]/15 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all text-[#EFF1F3] placeholder-[#EFF1F3]/40"
                />
              </div>

              <select
                id="admin-category-filter"
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#223843]/60 border border-[#EFF1F3]/15 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all text-[#EFF1F3] min-w-[120px] cursor-pointer"
              >
                <option value="All" className="bg-[#223843] text-[#EFF1F3]">Semua Kategori</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name} className="bg-[#223843] text-[#EFF1F3]">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* List scrollbar element */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 bg-[#223843]/40 rounded-xl border border-dashed border-[#EFF1F3]/15">
                  <Calendar size={32} className="mx-auto text-[#D77A61] mb-2" />
                  <p className="text-sm font-bold text-[#EFF1F3]">Tidak ada kegiatan</p>
                  <p className="text-xs text-[#EFF1F3]/70 max-w-[240px] mx-auto mt-1">
                    Silakan ubah filter Anda atau buat kegiatan baru menggunakan panel pengisi di sebelah kanan.
                  </p>
                </div>
              ) : (
                filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    id={`admin-event-card-${evt.id}`}
                    onClick={() => handleEditSelect(evt)}
                    className={`p-4 rounded-xl border cursor-pointer hover:bg-[#223843]/85 transition-all flex items-center justify-between gap-4 group ${
                      editingEventId === evt.id 
                        ? "border-[#D77A61] bg-[#D77A61]/20 ring-1 ring-[#D77A61]/40" 
                        : "border-[#EFF1F3]/10 bg-[#223843]/40"
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: `${evt.color || "#D77A61"}20`, color: evt.color || "#D77A61" }}
                        >
                          {evt.category || "General"}
                        </span>
                        <span className="text-[11px] font-semibold text-[#EFF1F3]/70 font-mono">{evt.date}</span>
                        {evt.time && (
                          <span className="text-[11px] font-semibold text-[#EFF1F3]/70 font-mono">
                            @ {evt.time}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#EFF1F3] truncate">
                        {evt.title}
                      </h4>
                      {evt.description && (
                        <p className="text-xs text-[#EFF1F3]/70 truncate line-clamp-1">
                          {evt.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`admin-select-edit-${evt.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSelect(evt);
                        }}
                        className="p-1.5 hover:text-[#D77A61] hover:bg-[#EFF1F3]/10 rounded-lg text-[#EFF1F3]/70 transition-all"
                        title="Edit detail"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        id={`admin-del-${evt.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(evt.id);
                        }}
                        className="p-1.5 hover:text-[#D77A61] hover:bg-[#EFF1F3]/10 rounded-lg text-[#EFF1F3]/70 transition-all"
                        title="Hapus kegiatan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Quick Action Form Controller - 5cols */}
        <section className="col-span-1 lg:col-span-5">
          <div className="bg-[#223843]/60 backdrop-blur-xl p-6 rounded-2xl border border-[#EFF1F3]/15 shadow-xl space-y-5 sticky top-28">
            <div className="flex items-center justify-between border-b border-[#EFF1F3]/15 pb-3">
              <h3 className="font-extrabold text-md text-[#EFF1F3] flex items-center gap-2">
                <Sparkles size={16} className="text-[#D77A61]" />
                {editingEventId ? "Ubah Kegiatan Terpilih" : "Buat Kegiatan Baru"}
              </h3>
              
              {editingEventId && (
                <button
                  id="reset-form-btn"
                  onClick={() => resetForm()}
                  className="text-xs font-bold text-[#D77A61] hover:text-[#D77A61]/80 hover:bg-[#223843]/50 px-2.5 py-1 rounded-lg transition-all"
                >
                  Buat Baru Saja
                </button>
              )}
            </div>

            {/* Status updates notifications */}
            {statusMessage && (
              <div 
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                  statusMessage.type === "success" 
                    ? "bg-[#D77A61]/15 border-[#D77A61]/30 text-[#EFF1F3]" 
                    : "bg-[#223843]/70 border-[#D77A61]/30 text-[#EFF1F3]"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 size={15} className="shrink-0 text-[#D77A61]" />
                ) : (
                  <AlertCircle size={15} className="shrink-0 text-[#D77A61]" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              {/* Event Title */}
              <div className="space-y-1.5">
                <label htmlFor="evt-title" className="text-xs font-bold text-[#EFF1F3]/85 uppercase tracking-wider">Nama Kegiatan</label>
                <input
                  id="evt-title"
                  type="text"
                  placeholder="Contoh: Rapat Koordinasi WaktuSync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all text-[#EFF1F3] placeholder-[#EFF1F3]/40"
                  required
                />
              </div>

              {/* Event Date */}
              <div className="space-y-1.5">
                <label htmlFor="evt-date" className="text-xs font-bold text-[#EFF1F3]/85 uppercase tracking-wider">Tanggal Kegiatan</label>
                <input
                  id="evt-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all font-mono text-[#EFF1F3]"
                  required
                />
              </div>

              {/* Grid 2 Event details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="evt-time" className="text-xs font-bold text-[#EFF1F3]/85 uppercase tracking-wider">Jam (opsional)</label>
                  <input
                    id="evt-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all font-mono text-[#EFF1F3]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="evt-category" className="text-xs font-bold text-[#EFF1F3]/85 uppercase tracking-wider">Kategori</label>
                  <select
                    id="evt-category"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all text-[#EFF1F3] cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.name} value={cat.name} className="bg-[#223843] text-[#EFF1F3]">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Circle Colors */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#EFF1F3]/85 uppercase tracking-wider block">Warna Aksen Visual</span>
                <div className="flex gap-2.5 py-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleCategoryChange(cat.name)}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center border-2 ${
                        category === cat.name ? "border-[#EFF1F3] scale-110 shadow-md" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: cat.color }}
                      title={cat.name}
                    >
                      {category === cat.name && (
                        <span className="w-1.5 h-1.5 bg-[#EFF1F3] rounded-full"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="evt-desc" className="text-xs font-bold text-[#EFF1F3]/85 uppercase tracking-wider">Deskripsi Kegiatan</label>
                <textarea
                  id="evt-desc"
                  placeholder="Catatan, rincian agenda, tautan virtual, dll..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] text-[#EFF1F3] resize-none placeholder-[#EFF1F3]/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  id="admin-form-submit"
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-[#D77A61] hover:bg-[#D77A61]/90 text-[#EFF1F3] font-bold text-sm rounded-xl shift-all transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {formLoading ? (
                    <span className="w-4 h-4 border-2 border-[#EFF1F3]/20 border-t-[#EFF1F3] rounded-full animate-spin"></span>
                  ) : editingEventId ? (
                    "Simpan & Siarkan Perubahan"
                  ) : (
                    "Buat & Siarkan Kegiatan"
                  )}
                </button>

                {editingEventId && (
                  <button
                    id="admin-form-delete"
                    type="button"
                    onClick={() => handleDeleteClick(editingEventId)}
                    disabled={formLoading}
                    className="p-3 bg-[#223843]/80 hover:bg-[#223843] text-[#D77A61] rounded-xl transition-all border border-[#D77A61]/35 cursor-pointer"
                    title="Hapus permanen kegiatan"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

      </main>
    </div>
  );
}
