"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

/**
 * Memoised markdown renderer — only re-renders when the content string
 * changes. This means completed messages stay frozen while the streaming
 * one updates.
 */
export const MarkdownContent = memo(function MarkdownContent({
  content,
}: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        h1: ({ children }) => (
          <h1 className="text-base font-semibold mt-4 mb-1.5 text-[#f0f0f0]">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-[0.95rem] font-semibold mt-3 mb-1 text-[#f0f0f0]">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-2.5 mb-0.5 text-[#f0f0f0]">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ className, children }) =>
          className ? (
            <code className={`${className} text-[#d0d0d0] font-mono text-[0.82em]`}>
              {children}
            </code>
          ) : (
            <code className="bg-[#272727] text-[#d0d0d0] px-1.5 py-[2px] rounded text-[0.83em] font-mono">
              {children}
            </code>
          ),
        pre: ({ children }) => (
          <pre className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 my-2 overflow-x-auto leading-relaxed text-[0.82em]">
            {children}
          </pre>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-[#f0f0f0]">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-[#ccc]">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c8a870] underline underline-offset-2 hover:text-[#d4b880]"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#3a3a3a] pl-3 my-2 text-[#888] italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-t border-[#2a2a2a] my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
});
