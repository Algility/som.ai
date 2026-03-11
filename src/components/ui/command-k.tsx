"use client";

import * as React from "react";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";

export interface CommandKItem {
  label: string;
  group: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string[];
  keywords?: string[];
}

const theme = {
  overlay: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
  content:
    "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4 bg-[#222] border border-[#383838] rounded-2xl shadow-2xl overflow-hidden",
  input:
    "w-full bg-transparent px-3 py-2.5 text-sm text-[#ececec] placeholder-[#555] outline-none border-b border-[#383838]",
  list: "max-h-[min(60vh,400px)] overflow-y-auto custom-scrollbar p-2",
  groupHeading: "text-[10px] font-medium uppercase tracking-wider text-[#555] px-2 py-1.5",
  item: "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#d0d0d0] hover:bg-[#252525] hover:text-[#ececec] [&[aria-selected=true]]:bg-[#252525] [&[aria-selected=true]]:text-[#ececec]",
  itemIcon: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2a2a2a] text-[#888] overflow-hidden",
  empty: "py-6 text-center text-sm text-[#555]",
};

interface CommandKProps {
  items: CommandKItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: CommandKItem) => void;
  placeholder?: string;
}

export function CommandK({
  items,
  open,
  onOpenChange,
  onSelect,
  placeholder = "Search…",
}: CommandKProps) {
  const groups = React.useMemo(() => {
    const map = new Map<string, CommandKItem[]>();
    for (const item of items) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      overlayClassName={theme.overlay}
      contentClassName={theme.content}
      label="Command palette"
    >
      <Dialog.Title className="sr-only">
        Command palette
      </Dialog.Title>
      <Command.Input
        className={theme.input}
        placeholder={placeholder}
        autoFocus
      />
      <Command.List className={theme.list}>
        <Command.Empty className={theme.empty}>No results found.</Command.Empty>
        {groups.map(([groupName, groupItems]) => (
          <Command.Group
            key={groupName}
            heading={
              <span className={theme.groupHeading}>{groupName}</span>
            }
          >
            {groupItems.map((item) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.label}
                  value={`${item.label} ${item.description ?? ""} ${item.group}`}
                  keywords={item.keywords}
                  onSelect={() => onSelect(item)}
                  className={theme.item}
                >
                  {Icon && (
                    <span className={theme.itemIcon}>
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && item.shortcut.length > 0 && (
                    <span className="text-[10px] text-[#555]">
                      {item.shortcut.join(" + ")}
                    </span>
                  )}
                </Command.Item>
              );
            })}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
