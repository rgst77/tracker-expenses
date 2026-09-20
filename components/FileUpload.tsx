"use client";

import { useRef, useState } from "react";

interface Props {
  onFileText: (text: string, fileName: string) => void;
}

// Placeholder upload UI — functional only. The real drag & drop / branded
// experience is a deliberate later pass, not this component.
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
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-16 text-center transition-colors ${
        dragging
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-zinc-300 dark:border-zinc-700"
      }`}
    >
      <p className="text-lg font-medium">Arrastra tu CSV aquí</p>
      <p className="text-sm text-zinc-500">o haz clic para seleccionar un archivo</p>
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
