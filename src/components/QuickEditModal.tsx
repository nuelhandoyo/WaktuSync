import React, { useState, useEffect } from "react";
import { Lock, Unlock, X, Clock, Calendar as CalendarIcon, Tag, AlertTriangle, Trash2 } from "lucide-react";
import { CalendarEvent } from "../types";

interface QuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  selectedEvent: CalendarEvent | null; // Null if adding, Event if editing
  onSave: (eventData: Omit<CalendarEvent, "id"> & { id?: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  isAdminAuthenticated: boolean;
  onAuthenticate: (password: string) => Promise<boolean>;
}

const CATEGORIES = [
  { name: "Work", color: "#D77A61", textClass: "text-[#D77A61]", bgClass: "bg-[#D77A61]/10" },
  { name: "Health", color: "#223843", textClass: "text-[#EFF1F3]", bgClass: "bg-[#223843]/60" },
  { name: "Personal", color: "#D77A61", textClass: "text-[#D77A61]", bgClass: "bg-[#D77A61]/10" },
  { name: "Urgent", color: "#D77A61", textClass: "text-[#D77A61]", bgClass: "bg-[#D77A61]/25" },
  { name: "Leisure", color: "#223843", textClass: "text-[#EFF1F3]", bgClass: "bg-[#223843]/40" },
  { name: "General", color: "#EFF1F3", textClass: "text-[#EFF1F3]", bgClass: "bg-[#EFF1F3]/10" }
];

export default function QuickEditModal({
  isOpen,
  onClose,
  selectedDate,
  selectedEvent,
  onSave,
  onDelete,
  isAdminAuthenticated,
  onAuthenticate
}: QuickEditModalProps) {
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  
  // Event form states
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [color, setColor] = useState("#6B7280");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize form states when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      if (selectedEvent) {
        setTitle(selectedEvent.title);
        setTime(selectedEvent.time || "");
        setDescription(selectedEvent.description || "");
        setCategory(selectedEvent.category || "General");
        setColor(selectedEvent.color || "#6B7280");
      } else {
        setTitle("");
        setTime("");
        setDescription("");
        setCategory("General");
        setColor("#6B7280");
      }
      setAuthError("");
      setErrorMessage("");
      setPassword("");
    }
  }, [isOpen, selectedEvent, selectedDate]);

  // Adjust custom color based on category selection
  const handleCategoryChange = (catName: string) => {
    setCategory(catName);
    const cat = CATEGORIES.find(c => c.name === catName);
    if (cat) {
      setColor(cat.color);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsAuthLoading(true);
    setAuthError("");
    try {
      const success = await onAuthenticate(password);
      if (!success) {
        setAuthError("Incorrect password. Please try again.");
      }
    } catch (err) {
      setAuthError("Authentication error occurred.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter an event title.");
      return;
    }
    
    setIsSaving(true);
    setErrorMessage("");
    try {
      const eventData = {
        id: selectedEvent?.id,
        title: title.trim(),
        date: selectedDate,
        time,
        description: description.trim(),
        category,
        color
      };
      const success = await onSave(eventData);
      if (success) {
        onClose();
      } else {
        setErrorMessage("Failed to save event. Ensure database is active.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!selectedEvent) return;
    if (!confirm("Are you sure you want to permanently delete this event? This updates all network-wide displays immediately.")) {
      return;
    }
    
    setIsDeleting(true);
    setErrorMessage("");
    try {
      const success = await onDelete(selectedEvent.id);
      if (success) {
        onClose();
      } else {
        setErrorMessage("Failed to delete event.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="quick-edit-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#223843]/50 backdrop-blur-md transition-opacity animate-fade-in text-[#EFF1F3]">
      <div id="quick-edit-card" className="w-full max-w-lg bg-[#223843]/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#EFF1F3]/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EFF1F3]/15 flex items-center justify-between bg-[#223843]/40">
          <div>
            <h3 className="text-lg font-bold text-[#EFF1F3] flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${selectedEvent ? 'bg-[#D77A61]' : 'bg-[#D77A61] animate-ping'}`}></span>
              {selectedEvent ? "Ubah Cepat Agenda" : "Tambah Cepat Agenda"}
            </h3>
            <p className="text-xs text-[#EFF1F3]/70 font-mono mt-0.5">Tanggal: {selectedDate}</p>
          </div>
          <button 
            id="modal-close-btn"
            onClick={onClose} 
            className="p-1.5 text-[#EFF1F3]/60 hover:text-[#EFF1F3] rounded-lg hover:bg-[#223843]/55 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Auth Barrier if not authenticated */}
        {!isAdminAuthenticated ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-[#223843]/60 rounded-full flex items-center justify-center text-[#D77A61] mb-4 ring-8 ring-[#D77A61]/10">
              <Lock size={20} />
            </div>
            <h4 className="text-md font-bold text-[#EFF1F3] mb-1">Aksi Administrator Dibutuhkan</h4>
            <p className="text-sm text-[#EFF1F3]/75 max-w-sm mb-6">
              Silakan masukkan sandi administrator untuk menambah, mengubah, atau menghapus agenda jaringan WaktuSync.
            </p>
            
            <form onSubmit={handleAuthSubmit} className="w-full max-w-xs space-y-4">
              <div>
                <input
                  id="admin-barrier-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sandi Admin"
                  className="w-full px-4 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all font-mono text-[#EFF1F3] placeholder-[#EFF1F3]/40"
                  disabled={isAuthLoading}
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-[#EFF1F3] font-medium mt-2 flex items-center gap-1 justify-center bg-[#D77A61]/20 border border-[#D77A61]/30 p-2 rounded-xl">
                    <AlertTriangle size={12} className="text-[#D77A61]" />
                    {authError}
                  </p>
                )}
              </div>
              <button
                id="admin-barrier-submit"
                type="submit"
                disabled={isAuthLoading || !password}
                className="w-full py-2.5 bg-[#D77A61] hover:bg-[#D77A61]/90 text-[#EFF1F3] font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAuthLoading ? (
                  <span className="w-4 h-4 border-2 border-[#EFF1F3]/30 border-t-[#EFF1F3] rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Unlock size={14} />
                    Verifikasi & Buka Kunci
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Editor Form */
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-[#D77A61]/25 border border-[#D77A61]/35 text-[#EFF1F3] rounded-xl flex items-center gap-2 text-xs font-semibold">
                <AlertTriangle size={14} className="shrink-0 text-[#D77A61]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="edit-title" className="text-xs font-bold text-[#EFF1F3]/80 uppercase tracking-wider">Nama Kegiatan</label>
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Diskusi Sinkronisasi Mingguan"
                className="w-full px-4 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all text-[#EFF1F3] placeholder-[#EFF1F3]/40"
                required
                autoFocus
              />
            </div>

            {/* Time & Category Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-time" className="text-xs font-bold text-[#EFF1F3]/80 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} className="text-[#D77A61]" /> Jam <span className="text-[#EFF1F3]/50 font-normal lowercase">(opsional)</span>
                </label>
                <input
                  id="edit-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all font-mono text-[#EFF1F3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#EFF1F3]/80 uppercase tracking-wider flex items-center gap-1">
                  <Tag size={12} className="text-[#D77A61]" /> Kategori
                </label>
                <select
                  id="edit-category"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all text-[#EFF1F3]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name} className="bg-[#223843] text-[#EFF1F3]">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Color Circle Indicator Row */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#EFF1F3]/80 uppercase tracking-wider block">Warna Aksen Kategori</span>
              <div className="flex gap-2.5 py-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`w-7 h-7 rounded-full transition-all flex items-center justify-center border-2 ${
                      category === cat.name ? "border-[#EFF1F3] scale-110 shadow-xs" : "border-transparent hover:scale-105"
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
              <label htmlFor="edit-desc" className="text-xs font-bold text-[#EFF1F3]/80 uppercase tracking-wider">Deskripsi Kegiatan</label>
              <textarea
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rincian acara, tautan ataupun agenda penting..."
                rows={3}
                className="w-full px-4 py-2.5 bg-[#223843]/50 border border-[#EFF1F3]/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D77A61]/50 focus:border-[#D77A61] transition-all text-[#EFF1F3] placeholder-[#EFF1F3]/40 resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-2 border-t border-[#EFF1F3]/15 flex items-center justify-between">
              {selectedEvent ? (
                <button
                  id="edit-delete-btn"
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isDeleting || isSaving}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#D77A61] hover:text-[#D77A61]/80 hover:bg-[#223843]/40 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (
                    <span className="w-3.5 h-3.5 border-2 border-[#D77A61]/30 border-t-[#D77A61] rounded-full animate-spin"></span>
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Hapus Agenda
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  id="edit-cancel-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-[#EFF1F3]/70 hover:text-[#EFF1F3] hover:bg-[#223843]/60 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  id="edit-save-btn"
                  type="submit"
                  disabled={isSaving || isDeleting}
                  className="px-5 py-2 text-xs font-bold text-[#EFF1F3] bg-[#D77A61] hover:bg-[#D77A61]/90 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving && (
                    <span className="w-3 h-3 border-2 border-[#EFF1F3]/30 border-t-[#EFF1F3] rounded-full animate-spin"></span>
                  )}
                  Simpan & Siarkan
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
