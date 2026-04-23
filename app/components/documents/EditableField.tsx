"use client";

import { useState, useEffect, useRef } from "react";

export interface EditableFieldProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

export function EditableField({
  value,
  onChange,
  className = "",
  inputClassName = "",
  placeholder = "",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed) {
      onChange(trimmed);
    } else {
      setDraft(value); // revert if emptied
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(value);
          }
        }}
        className={`bg-transparent border-b border-primary/50 outline-none text-black ${inputClassName}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`cursor-pointer border-b border-dashed border-gray-300 hover:border-primary/50 hover:text-primary/80 transition-colors ${className}`}
    >
      {value || (
        <span className="text-gray-400 italic text-xs">{placeholder}</span>
      )}
    </span>
  );
}
