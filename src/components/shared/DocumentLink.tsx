export function DocumentLink({ url, showUrl = false }: { url: string; showUrl?: boolean }) {
  let href: string | undefined;
  try { const parsed = new URL(url); if (['http:', 'https:'].includes(parsed.protocol)) href = parsed.href; } catch { /* Invalid stored links are displayed as text. */ }
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{showUrl ? url : 'Open document ↗'}</a> : <span className="muted">Document link unavailable</span>;
}
