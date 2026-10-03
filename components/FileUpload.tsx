"use client";

import { useRef, useState } from "react";

interface Props {
  accept: string;
  title: string;
  hint: string;
  disabled?: boolean;
  onFile: (file: File) => void;
}

export function FileUpload({ accept, title, hint, disabled = false, onFile }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && !disabled) onFile(file);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-150"
      style={{
        borderColor: dragging ? "var(--series-1)" : "var(--gridline)",
        background: dragging ? "color-mix(in srgb, var(--series-1) 8%, var(--surface-1))" : "var(--surface-1)",
        transform: dragging ? "scale(1.01)" : "scale(1)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "linear-gradient(135deg, var(--series-1), var(--series-6))" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
