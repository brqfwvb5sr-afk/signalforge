export const STOPWORDS = new Set([
  "a", "about", "after", "all", "also", "am", "an", "and", "are", "as", "at", "be", "because", "but", "by", "can", "do",
  "for", "from", "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "more", "not", "of", "on", "or",
  "our", "so", "than", "that", "the", "their", "then", "there", "this", "to", "was", "we", "what", "when", "with",
  "you", "your",
  "aber", "als", "am", "an", "auch", "auf", "aus", "bei", "bin", "bis", "da", "das", "dass", "dem", "den", "der",
  "des", "die", "ein", "eine", "einem", "einen", "einer", "es", "fuer", "fur", "hat", "ich", "im", "in", "ist",
  "ja", "man", "mit", "nicht", "oder", "sich", "sie", "so", "und", "von", "war", "was", "wenn", "wie", "wir",
  "zu", "zum", "zur"
]);

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
}

export function tokenize(value, options = {}) {
  const includeStopwords = options.includeStopwords === true;
  return normalizeText(value)
    .match(/[a-z0-9]+(?:[-'][a-z0-9]+)*/g)?.filter((term) => {
      return term.length > 1 && (includeStopwords || !STOPWORDS.has(term));
    }) || [];
}

export function termFrequency(tokens) {
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
