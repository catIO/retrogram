import type { ImageData } from '../components/ImageGrid';

/**
 * Parses an ISO datetime string or YYYY-MM-DD string without unwanted UTC timezone rolling.
 */
function parsePhotoDate(dateStr: string): Date | null {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const [, y, mo, d] = m;
  const year = parseInt(y, 10);
  const month = parseInt(mo, 10) - 1;
  const day = parseInt(d, 10);

  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a photo date string into date-only format (e.g. "June 7, 2023").
 */
export function formatPhotoTakenDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const date = parsePhotoDate(dateStr);
  if (!date) return null;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Returns formatted date for an image, prioritizing takenAt over createdAt.
 */
export function getPhotoDate(image: ImageData): string | null {
  const dateStr = image.takenAt || image.createdAt;
  if (!dateStr) return null;
  return formatPhotoTakenDate(dateStr);
}
