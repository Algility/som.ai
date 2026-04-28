export type MessagePart = { type?: string; text?: string };

export interface ChatHistoryItem {
  id: string;
  title: string;
  messages: unknown[];
  transcript: string | null;
  timestamp: number;
}

export type ChatView = "home" | "chat" | "settings";
