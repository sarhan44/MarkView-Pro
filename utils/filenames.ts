/** Safe base name for downloads (no path / reserved characters). */
export function sanitizeDownloadBasename(input: string): string {
  let s = input
    .trim()
    .replace(/^\.+/, '')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return 'document';
  return s.slice(0, 180);
}

export function withMdExtension(base: string): string {
  const b = sanitizeDownloadBasename(base.replace(/\.(md|markdown)$/i, ''));
  return `${b}.md`;
}

export function withPdfExtension(base: string): string {
  const b = sanitizeDownloadBasename(base.replace(/\.pdf$/i, ''));
  return `${b}.pdf`;
}
