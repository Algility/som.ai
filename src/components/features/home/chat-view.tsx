"use client";

import Image from "next/image";
import type { UIMessage } from "ai";
import { MarkdownContent } from "@/components/features/home/markdown-content";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";
import { getMessageText } from "@/lib/chat-utils";

interface ChatViewProps {
  messages: UIMessage[];
  status: string;
  isLoading: boolean;
  streamingDisplayText: string;
  copiedId: string | null;
  showScrollBottom: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onCopyMessage: (id: string, text: string) => void;
  onScrollToBottom: () => void;
  onSendMessage: (data: { message: string; model: string }, transcript?: string | null) => void;
  onStop: () => void;
}

export function ChatView({
  messages, status, isLoading, streamingDisplayText, copiedId, showScrollBottom,
  messagesContainerRef, messagesEndRef, onScroll, onCopyMessage, onScrollToBottom,
  onSendMessage, onStop,
}: ChatViewProps) {
  return (
    <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {showScrollBottom && (
        <button onClick={onScrollToBottom} className="absolute bottom-28 right-4 z-10 p-2.5 rounded-full bg-[#2a2a2a] border border-[#404040] text-[#ececec] shadow-xl hover:bg-[#333] transition-all duration-200 cursor-pointer" aria-label="Scroll to bottom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </button>
      )}
      <div ref={messagesContainerRef} onScroll={onScroll} className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 lg:px-4">
        <div className="max-w-2xl mx-auto min-h-full flex flex-col">
          <div className="flex-1 min-h-4 lg:hidden" />
          <div className="space-y-5 lg:space-y-6 py-4 lg:py-5">
            {messages.map((m, msgIdx) => {
              const msgText = getMessageText(m.parts as { type: string; text?: string }[]);
              const isStreamingThis = m.role === "assistant" && status === "streaming" && msgIdx === messages.length - 1;
              const content = isStreamingThis ? streamingDisplayText : msgText;
              return (
                <div key={m.id} className="flex flex-col gap-2">
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center flex-none overflow-hidden">
                        <Image src="/logo.png" alt="SOM" width={28} height={28} draggable={false} className="logo-no-drag w-7 h-7 object-contain select-none pointer-events-none" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-[#3a3a3a] text-[#ececec] rounded-br-sm" : "text-[#ececec]"}`}>
                      {m.role === "assistant" ? <MarkdownContent content={content} /> : msgText}
                    </div>
                  </div>
                  {m.role === "assistant" && (
                    <div className="ml-10 flex items-center gap-1 mt-0.5">
                      <button onClick={() => onCopyMessage(m.id, msgText)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[#4a4a4a] hover:text-[#888] hover:bg-[#252525] transition-all duration-150 cursor-pointer">
                        {copiedId === m.id ? (
                          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span className="text-[11px] text-[#666]">Copied</span></>
                        ) : (
                          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span className="text-[11px]">Copy</span></>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center flex-none overflow-hidden">
                  <Image src="/logo.png" alt="SOM" width={28} height={28} draggable={false} className="logo-no-drag w-7 h-7 object-contain select-none pointer-events-none" />
                </div>
                <div className="py-3.5 flex items-center gap-[5px]">
                  <span className="typing-dot w-[7px] h-[7px] rounded-full bg-[#555] [animation-delay:0s]" />
                  <span className="typing-dot w-[7px] h-[7px] rounded-full bg-[#555] [animation-delay:0.18s]" />
                  <span className="typing-dot w-[7px] h-[7px] rounded-full bg-[#555] [animation-delay:0.36s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      <div className="px-2 lg:px-4 pt-2 flex-shrink-0 pb-safe lg:pb-6">
        <div className="max-w-2xl mx-auto">
          <ClaudeChatInput onSendMessage={onSendMessage} isLoading={isLoading} onStop={onStop} />
        </div>
      </div>
    </main>
  );
}
