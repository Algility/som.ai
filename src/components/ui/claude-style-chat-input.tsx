import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowUp, X, Check, Square } from "lucide-react";
import { SOM_MODELS, SOM_DEFAULT_MODEL_ID, type SomModel } from "@/lib/som-models";

/* --- ICONS --- */
export const Icons = {
  SelectArrow: ChevronDown,
  ArrowUp: ArrowUp,
  X: X,
  Check: Check,
};

/* --- PASTED CONTENT CARD --- */
interface PastedContentCardProps {
  content: { id: string; content: string; timestamp: Date };
  onRemove: (id: string) => void;
}

const PastedContentCard: React.FC<PastedContentCardProps> = ({ content, onRemove }) => (
  <div className="relative group flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#30302E] bg-white dark:bg-[#20201F] p-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
    <div className="overflow-hidden w-full">
      <p className="text-[10px] text-[#9CA3AF] leading-[1.4] font-mono break-words whitespace-pre-wrap line-clamp-4 select-none">
        {content.content}
      </p>
    </div>
    <div className="flex items-center justify-between w-full mt-2">
      <div className="inline-flex items-center justify-center px-1.5 py-[2px] rounded border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-transparent">
        <span className="text-[9px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider font-sans">
          PASTED
        </span>
      </div>
    </div>
    <button
      onClick={() => onRemove(content.id)}
      className="absolute top-2 right-2 p-[3px] bg-white dark:bg-[#30302E] border border-[#E5E5E5] dark:border-[#404040] rounded-full text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
    >
      <Icons.X className="w-2 h-2" />
    </button>
  </div>
);

/* --- MODEL SELECTOR --- */
interface ModelSelectorProps {
  models: SomModel[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentModel = models.find((m) => m.id === selectedModel) ?? models[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center relative shrink-0 transition font-base duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] h-8 rounded-xl px-3 min-w-[4rem] active:scale-[0.98] whitespace-nowrap !text-xs pl-2.5 pr-2 gap-1
          ${isOpen
            ? "bg-bg-200 text-text-100 dark:bg-[#454540] dark:text-[#ECECEC]"
            : "text-text-300 hover:text-text-200 hover:bg-bg-200 dark:text-[#B4B4B4] dark:hover:text-[#ECECEC] dark:hover:bg-[#454540]"
          }`}
      >
        <span className="select-none font-medium">SOM AI</span>
        <div className="flex items-center justify-center opacity-75" style={{ width: "20px", height: "20px" }}>
          <Icons.SelectArrow
            className={`shrink-0 opacity-75 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-[260px] bg-white dark:bg-[#212121] border border-[#DDDDDD] dark:border-[#30302E] rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col p-1.5 origin-bottom-right">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => { onSelect(model.id); setIsOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl flex items-start justify-between gap-2 transition-colors hover:bg-bg-200 dark:hover:bg-[#30302E] text-text-100 dark:text-[#ECECEC]"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium">{model.name}</span>
                <span className="text-[11px] text-text-300 dark:text-[#999999]">{model.description}</span>
              </div>
              {selectedModel === model.id && (
                <Icons.Check className="w-4 h-4 text-[#890B0F] shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* --- MAIN COMPONENT --- */
interface ClaudeChatInputProps {
  onSendMessage: (data: { message: string; model: string }) => void;
  isLoading?: boolean;
  onStop?: () => void;
}

export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({ onSendMessage, isLoading = false, onStop }) => {
  const [message, setMessage] = useState("");
  const [pastedContent, setPastedContent] = useState<{ id: string; content: string; timestamp: Date }[]>([]);
  const [selectedModel, setSelectedModel] = useState(SOM_DEFAULT_MODEL_ID);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const models = SOM_MODELS;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 384) + "px";
    }
  }, [message]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (text.length > 300) {
      e.preventDefault();
      setPastedContent((prev) => [...prev, { id: Math.random().toString(36).substr(2, 9), content: text, timestamp: new Date() }]);
      if (!message) setMessage("Analyzed pasted text...");
    }
  };

  const handleSend = () => {
    if (!message.trim() && pastedContent.length === 0) return;
    onSendMessage({ message, model: selectedModel });
    setMessage("");
    setPastedContent([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasContent = message.trim() || pastedContent.length > 0;

  return (
    <div className="relative w-full max-w-2xl mx-auto transition-all duration-300 font-sans">
      <div className="!box-content flex flex-col mx-2 md:mx-0 items-stretch transition-colors duration-200 ease-out relative z-10 rounded-3xl cursor-text border-[1.5px] border-[#464547] focus-within:border-[#565557] bg-white dark:bg-[#2C2C2A] antialiased">
        <div className="flex flex-col px-4 pt-3.5 pb-3 gap-2">

          {/* Pasted content row (long text pastes show as cards) */}
          {pastedContent.length > 0 && (
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-1">
              {pastedContent.map((c) => (
                <PastedContentCard
                  key={c.id}
                  content={c}
                  onRemove={(id) => setPastedContent((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <div className="max-h-96 w-full overflow-y-auto custom-scrollbar break-words transition-opacity duration-200 pl-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder="Ask your mentor anything..."
                className="w-full bg-transparent border-0 outline-none text-text-100 text-[16px] placeholder:text-text-400 resize-none overflow-hidden py-0 leading-relaxed block font-normal antialiased"
                rows={1}
                enterKeyHint="send"
                style={{ minHeight: "1.5em", touchAction: "auto" }}
              />
            </div>
          </div>

          {/* Action bar */}
          <div className="flex gap-2 w-full items-center">
            <div className="flex-1" />

            {/* Right tools */}
            <div className="flex flex-row items-center min-w-0 gap-1">
              <div className="shrink-0 p-1 -m-1">
                <ModelSelector models={models} selectedModel={selectedModel} onSelect={setSelectedModel} />
              </div>
              {isLoading ? (
                <button
                  onClick={onStop}
                  className="inline-flex items-center justify-center shrink-0 transition-colors min-h-[36px] min-w-[36px] h-9 w-9 !rounded-xl active:scale-95 bg-[#890B0D] text-white hover:bg-[#a00e10] shadow-md cursor-pointer touch-manipulation"
                  type="button"
                  aria-label="Stop generating"
                >
                  <Square className="w-3 h-3" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!hasContent}
                  className={`inline-flex items-center justify-center shrink-0 transition-colors min-h-[36px] min-w-[36px] h-9 w-9 !rounded-xl active:scale-95 touch-manipulation
                    ${hasContent ? "bg-[#890B0D] text-white hover:bg-[#a00e10] shadow-md cursor-pointer" : "bg-[#890B0D]/30 text-white/60 cursor-default"}`}
                  type="button"
                  aria-label="Send message"
                >
                  <Icons.ArrowUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ClaudeChatInput;
