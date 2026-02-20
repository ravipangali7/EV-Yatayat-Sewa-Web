/**
 * Minimal Devanagari (Nepali) to Roman for search matching.
 * Enables "Ram" to match "राम" in place/stop search.
 */
const DEVA_TO_ROMAN: Record<string, string> = {
  "\u0905": "a", "\u0906": "a", "\u0907": "i", "\u0908": "i", "\u0909": "u", "\u090a": "u",
  "\u090f": "e", "\u0910": "ai", "\u0911": "o", "\u0912": "au", "\u0913": "o", "\u0914": "au",
  "\u0915": "k", "\u0916": "kh", "\u0917": "g", "\u0918": "gh", "\u0919": "ng",
  "\u091a": "ch", "\u091b": "chh", "\u091c": "j", "\u091d": "jh", "\u091e": "ny",
  "\u091f": "t", "\u0920": "th", "\u0921": "d", "\u0922": "dh", "\u0923": "n",
  "\u0924": "t", "\u0925": "th", "\u0926": "d", "\u0927": "dh", "\u0928": "n",
  "\u092a": "p", "\u092b": "ph", "\u092c": "b", "\u092d": "bh", "\u092e": "m",
  "\u092f": "y", "\u0930": "r", "\u0931": "r", "\u0932": "l", "\u0933": "l", "\u0935": "v",
  "\u0936": "sh", "\u0937": "sh", "\u0938": "s", "\u0939": "h",
  "\u093e": "a", "\u093f": "i", "\u0940": "i", "\u0941": "u", "\u0942": "u",
  "\u0943": "ri", "\u0947": "e", "\u0948": "ai", "\u094b": "o", "\u094c": "au",
  "\u0945": "e", "\u0946": "e", "\u0949": "o", "\u094a": "o",
  "\u0902": "n", "\u0903": "h", "\u0901": "n",
};

export function romanize(text: string): string {
  if (!text || typeof text !== "string") return "";
  const out: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const two = text.slice(i, i + 2);
    if (DEVA_TO_ROMAN[two]) {
      out.push(DEVA_TO_ROMAN[two]);
      i++;
      continue;
    }
    if (DEVA_TO_ROMAN[c]) {
      out.push(DEVA_TO_ROMAN[c]);
      continue;
    }
    const code = c.charCodeAt(0);
    if (code >= 0x0900 && code <= 0x097f) continue; // skip unmapped Devanagari
    if (/[a-zA-Z0-9]/.test(c)) out.push(c.toLowerCase());
    else if (/\s/.test(c)) out.push(" ");
  }
  return out.join("").toLowerCase();
}

/** Romanize, lowercase, remove spaces, apply phonetic equivalences, then collapse repeated chars for flexible/voice matching. */
export function normalizePhonetic(text: string): string {
  if (!text || typeof text !== "string") return "";
  let s = romanize(text).toLowerCase().replace(/\s+/g, "");
  s = s.replace(/sh/g, "s").replace(/kh/g, "k").replace(/gh/g, "g").replace(/ch/g, "c");
  s = s.replace(/th/g, "t").replace(/dh/g, "d").replace(/ph/g, "p").replace(/bh/g, "b");
  s = s.replace(/ng/g, "n").replace(/v/g, "b").replace(/z/g, "j");
  s = s.replace(/(.)\1+/g, "$1"); // collapse repeated chars (voice/typos)
  return s;
}

/** Trim and collapse multiple spaces; use for voice transcript before matching. */
export function normalizeSearchInput(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text.trim().replace(/\s+/g, " ");
}

/** From normalizePhonetic, remove vowels for fuzzy match (e.g. bsundhra vs basundhara). */
export function consonantSkeleton(text: string): string {
  return normalizePhonetic(text).replace(/[aeiou]/g, "");
}

/** True if query matches name: direct, romanized, phonetic, or consonant skeleton. Space-insensitive; sh/kh variants. */
export function matchesSearch(name: string, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const n = (name || "").toLowerCase();
  if (n.includes(q) || q.includes(n)) return true;
  const nNoSpace = n.replace(/\s+/g, "");
  const qNoSpace = q.replace(/\s+/g, "");
  if (nNoSpace.includes(qNoSpace) || qNoSpace.includes(nNoSpace)) return true;
  const nRoman = romanize(name);
  const qRoman = romanize(query);
  if (qRoman.length > 0 && (nRoman.includes(qRoman) || qRoman.includes(nRoman))) return true;
  const nRomanNoSpace = nRoman.replace(/\s+/g, "");
  const qRomanNoSpace = qRoman.replace(/\s+/g, "");
  if (qRomanNoSpace.length > 0 && (nRomanNoSpace.includes(qRomanNoSpace) || qRomanNoSpace.includes(nRomanNoSpace))) return true;
  const nPh = normalizePhonetic(name);
  const qPh = normalizePhonetic(query);
  if (qPh.length > 0 && (nPh.includes(qPh) || qPh.includes(nPh))) return true;
  const skQ = consonantSkeleton(query);
  const skN = consonantSkeleton(name);
  if (skQ.length >= 2 && skN.includes(skQ)) return true;
  return false;
}

/** Space-separated variants for filter value so typing vasundhara, sama kusi, samakhushi, etc. matches. */
export function getSearchableVariants(name: string): string {
  if (!name || typeof name !== "string") return "";
  const n = name.trim();
  const rom = romanize(n);
  const romNoSpace = rom.replace(/\s+/g, "");
  const phonetic = normalizePhonetic(n);
  const withV = rom.toLowerCase().replace(/b/g, "v");
  const sk = consonantSkeleton(n);
  return [n, rom, romNoSpace, phonetic, withV, sk].filter(Boolean).join(" ");
}
