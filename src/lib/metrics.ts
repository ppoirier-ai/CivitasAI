/**
 * Parsers for marketplace metrics — turn free-text DB fields into numbers
 * the client can sort and range-filter on.
 */

/**
 * Extract an ROI multiplier from free text:
 *   "4.2x in 5 years" -> 4.2     "220% over 5 years" -> 2.2
 * Returns null when nothing parseable is present.
 */
export function parseRoiMultiplier(text: string | null | undefined): number | null {
  if (!text) return null;
  const mult = text.match(/(\d+(?:\.\d+)?)\s*x/i);
  if (mult) return parseFloat(mult[1]);
  const pct = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) return parseFloat(pct[1]) / 100;
  return null;
}

/**
 * Extract the capital requirement as a [$M] range from free text:
 *   "$45M for initial capacity"         -> { min: 45, max: 45 }
 *   "$10M–$50M for reseller entry"      -> { min: 10, max: 50 }
 *   "$1.2B first node"                  -> { min: 1200, max: 1200 }
 * Returns null when no money tokens are present.
 */
export function parseCapitalMillions(
  text: string | null | undefined
): { min: number; max: number } | null {
  if (!text) return null;
  const values: number[] = [];
  const re = /(\d+(?:\.\d+)?)\s*([KMBT])\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseFloat(m[1]);
    const unit = m[2].toUpperCase();
    const toMillions = unit === 'K' ? 1 / 1000 : unit === 'M' ? 1 : unit === 'B' ? 1000 : 1_000_000;
    values.push(n * toMillions);
  }
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * First money token for display: "$45M", "$10M–$50M", "$1.2B".
 * Falls back to null when nothing parseable is present.
 */
export function firstMoneyToken(text: string | null | undefined): string | null {
  if (!text) return null;
  const range = text.match(/\$?\d+(?:\.\d+)?[KMBT]\s*[-–—]\s*\$?\d+(?:\.\d+)?[KMBT]/i);
  if (range) return range[0];
  return text.match(/\$?\d+(?:\.\d+)?[KMBT]/i)?.[0] ?? null;
}

/** First percentage token for display: "45% CAGR over 5 years" -> "45%". */
export function firstPercent(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.match(/\d+(?:\.\d+)?%/)?.[0] ?? null;
}
