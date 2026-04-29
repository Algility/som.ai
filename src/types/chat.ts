import type { UIMessage } from "ai";

export type { UIMessage };

export type MessagePart = { type?: string; text?: string };

export interface ChatHistoryItem {
  id: string;
  title: string;
  messages: UIMessage[];
  transcript: string | null;
  timestamp: number;
}

export type ChatView = "home" | "chat" | "settings";
