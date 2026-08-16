/**
 * HTML-escape user-derived text before it is interpolated into markup.
 * Single source of truth — previously duplicated in the queue email renderer
 * and the export serializer.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
