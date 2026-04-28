import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatRow } from "@/lib/supabase";
import type { ChatHistoryItem } from "@/types/chat";
import { getChatTitle, isUuid } from "@/lib/chat-utils";

const LOCAL_KEY = "som_chat_history";
const HISTORY_LIMIT = 20;

export async function loadRemoteChatHistory(
  supabase: SupabaseClient,
  limit: number = HISTORY_LIMIT
): Promise<ChatHistoryItem[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("id, client_chat_id, title, messages, transcript, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToHistoryItem);
}

function rowToHistoryItem(row: ChatRow): ChatHistoryItem {
  const msgs = (row.messages ?? []) as Array<{ role: string; parts: unknown[] }>;
  const derivedTitle = getChatTitle(msgs) || "New chat";
  return {
    id: (row.client_chat_id ?? row.id) as string,
    title: row.title && row.title.trim() ? row.title : derivedTitle,
    messages: row.messages,
    transcript: row.transcript,
    timestamp: new Date(row.updated_at).getTime(),
  };
}

export function loadLocalChatHistory(): ChatHistoryItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? (JSON.parse(saved) as ChatHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalChatHistory(items: ChatHistoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
}

interface UpsertChatInput {
  supabase: SupabaseClient;
  userId: string;
  chatId: string;
  title: string;
  messages: unknown[];
  transcript: string | null;
}

export async function upsertChat({
  supabase,
  userId,
  chatId,
  title,
  messages,
  transcript,
}: UpsertChatInput): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .upsert(
      { client_chat_id: chatId, title, messages, transcript, user_id: userId },
      { onConflict: "client_chat_id" }
    );
  if (error) throw new Error(error.message);
}

export async function deleteChatById(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const q = supabase.from("chats").delete();
  const req = isUuid(id) ? q.eq("id", id) : q.eq("client_chat_id", id);
  const { error } = await req;
  if (error) throw new Error(error.message);
}

export async function renameChatById(
  supabase: SupabaseClient,
  id: string,
  title: string
): Promise<void> {
  const q = supabase.from("chats").update({ title });
  const req = isUuid(id) ? q.eq("id", id) : q.eq("client_chat_id", id);
  const { error } = await req;
  if (error) throw new Error(error.message);
}
