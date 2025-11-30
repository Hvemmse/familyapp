export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO String
  end: string; // ISO String
  location?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export enum ViewMode {
  CHAT = 'CHAT',
  CALENDAR = 'CALENDAR'
}