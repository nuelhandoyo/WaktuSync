export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (or empty string for all-day)
  description: string;
  category: string; // e.g. Work, Personal, Health, Urgent, Leisure, General
  color: string; // hex code
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}
