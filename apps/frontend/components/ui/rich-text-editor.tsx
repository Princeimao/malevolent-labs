"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from "lucide-react";

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = "min-h-64",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  // Sync content only when the external value changes (not during typing)
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && !ref.current.isContentEditable) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const execWithFocus = (command: string, value?: string) => {
    ref.current?.focus();
    exec(command, value);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const makeLink = () => {
    const url = window.prompt("Enter URL");
    if (url) execWithFocus("createLink", url);
  };

  const tools = [
    { icon: Heading2, label: "Subheading", run: () => execWithFocus("formatBlock", "H2") },
    { icon: Bold, label: "Bold", run: () => execWithFocus("bold") },
    { icon: Italic, label: "Italic", run: () => execWithFocus("italic") },
    { icon: Underline, label: "Underline", run: () => execWithFocus("underline") },
    { icon: Strikethrough, label: "Strike", run: () => execWithFocus("strikeThrough") },
    { icon: List, label: "Bullets", run: () => execWithFocus("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered", run: () => execWithFocus("insertOrderedList") },
    { icon: Quote, label: "Quote", run: () => execWithFocus("formatBlock", "BLOCKQUOTE") },
    { icon: LinkIcon, label: "Link", run: makeLink },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/60 focus-within:border-neutral-600 transition-colors",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-800 px-2 py-1.5">
        <button
          type="button"
          title="Undo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execWithFocus("undo")}
          className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          type="button"
          title="Redo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execWithFocus("redo")}
          className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          <Redo2 className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-neutral-800" />
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={tool.run}
            className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <tool.icon className="size-4" />
          </button>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className={cn(
          "rich-editor px-4 py-3 text-sm leading-relaxed text-neutral-200 outline-none empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-600",
          minHeight
        )}
      />
    </div>
  );
}

export { RichTextEditor };
