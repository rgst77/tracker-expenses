"use client";

import { useRef, useState } from "react";

interface Props {
  onFileText: (text: string, fileName: string) => void;
}

export function FileUpload({ onFileText }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => onFileText(String(reader.result ?? ""), file.name);
    reader.readAsText(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-150"
      style={{
        borderColor: dragging ? "var(--series-1)" : "var(--gridline)",
        background: dragging ? "color-mix(in srgb, var(--series-1) 8%, var(--surface-1))" : "var(--surface-1)",
        transform: dragging ? "scale(1.01)" : "scale(1)",
      }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "linear-gradient(135deg, var(--series-1), var(--series-6))" }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Arrastra tu CSV aquí
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          o haz clic para seleccionar un archivo
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
