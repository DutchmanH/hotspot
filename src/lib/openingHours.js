import OpeningHours from 'opening_hours';

/**
 * Evaluate OSM `opening_hours` at a moment in time.
 *
 * @param {string | undefined | null} tag
 * @param {Date} [at]
 * @returns {boolean | null} true = open, false = closed, null = missing / unparseable / unknown (e.g. PH without region)
 */
export function evaluateOpenState(tag, at = new Date()) {
  if (tag == null || typeof tag !== 'string') return null;
  const trimmed = tag.trim();
  if (!trimmed) return null;

  const norm = trimmed.toLowerCase();
  if (norm === '24/7' || norm === '24h' || norm === '24 hours') return true;

  try {
    const oh = new OpeningHours(trimmed, null, {});
    if (oh.getUnknown(at)) return null;
    return oh.getState(at) === true;
  } catch {
    return null;
  }
}
