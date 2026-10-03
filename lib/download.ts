export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari can silently drop the download if the object URL is revoked
  // before it has actually started reading the blob — give it a beat.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
