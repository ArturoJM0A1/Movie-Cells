/**
 * Pure formatting helpers.
 *
 * They are shared by every component so that a year, a runtime or a rating always look the same
 * everywhere. Keeping them free of side effects is what allows the same functions to be used from
 * a Lit template (inside a shadow root) and from the service layer.
 */

/** `'1993-03-01'` -> `'1993'`. Empty string when the date is missing or malformed. */
export function getYear(date: string): string {
  const year = /^(\d{4})/.exec(date ?? '');
  return year ? year[1] : '';
}

/** `360` -> `'6 h'` and `135` -> `'2 h 15 min'`. Empty string when unknown. */
export function formatRuntime(minutes: number | null): string {
  if (!minutes || minutes < 0) {
    return '';
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!hours) {
    return `${rest} min`;
  }
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** `8.243` -> `'8.2'`. Empty string when the API does not provide a rating. */
export function formatRating(rating: number | null): string {
  if (rating === null || rating === undefined || Number.isNaN(rating)) {
    return '';
  }
  return rating.toFixed(1);
}

/** Removes the HTML tags the API embeds in its descriptions and collapses whitespace. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Joins the truthy parts with a separator. Handy to build `'1993 · 1 h 30 min'`. */
export function joinMeta(...parts: (string | null | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part)).join(' · ');
}

/** Safe integer guard used by the pagination logic. */
export function toPageNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}