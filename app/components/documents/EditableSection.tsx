"use client";

import { useState, useEffect, useRef } from "react";

export interface EditableSectionProps {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export function EditableSection({
  value,
  onChange,
  readOnly = false,
}: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
    }
  }, [editing]);

  if (readOnly) {
    return (
      <p className="text-sm leading-relaxed text-black whitespace-pre-wrap">
        {value}
      </p>
    );
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          autoResize(e.target);
        }}
        onBlur={() => {
          setEditing(false);
          onChange(draft.trim() || value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(value);
          }
        }}
        className="w-full resize-none overflow-hidden bg-transparent border-b border-primary/50 outline-none text-sm leading-relaxed text-black"
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      title="Click to edit"
      className="text-sm leading-relaxed text-black whitespace-pre-wrap cursor-pointer border-b border-dashed border-transparent hover:border-gray-300 transition-colors min-h-[1.5rem]"
    >
      {value || (
        <span className="text-gray-400 italic text-xs">
          Empty — click to add content
        </span>
      )}
    </p>
  );
}
