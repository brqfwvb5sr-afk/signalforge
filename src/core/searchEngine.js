import { escapeHtml, normalizeSearchText, termFrequency, tokenize } from "./text.js";

const TITLE_WEIGHT = 1.6;
const BODY_WEIGHT = 1;
const DEFAULT_FUZZY_LIMIT = 3;

export function createDocument(title = "Untitled", body = "") {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: now,
    updatedAt: now
  };
}

export function buildIndex(documents) {
  const docs = documents.map(normalizeDocument);
  const termsByDoc = new Map();
  const docFrequency = new Map();

  for (const doc of docs) {
    const titleCounts = termFrequency(tokenize(doc.title));
    const bodyCounts = termFrequency(tokenize(doc.body));
    const weighted = new Map();

    for (const [term, count] of titleCounts) {
      weighted.set(term, (weighted.get(term) || 0) + count * TITLE_WEIGHT);
    }
    for (const [term, count] of bodyCounts) {
      weighted.set(term, (weighted.get(term) || 0) + count * BODY_WEIGHT);
    }

    termsByDoc.set(doc.id, weighted);
    for (const term of weighted.keys()) {
      docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
    }
  }

  const idf = new Map();
  for (const [term, frequency] of docFrequency) {
    idf.set(term, Math.log((1 + docs.length) / (1 + frequency)) + 1);
  }

  const vectors = new Map();
  for (const doc of docs) {
    vectors.set(doc.id, tfidfVector(termsByDoc.get(doc.id), idf));
  }

  return { documents: docs, termsByDoc, docFrequency, idf, vectors };
}

export function search(documents, query, options = {}) {
  const index = buildIndex(documents);
  const parsedQuery = parseQuery(query);
  const queryTerms = queryTermsForSearch(parsedQuery);
  if (!hasExecutableQuery(parsedQuery, queryTerms)) {
    return [];
  }

  const expansion = expandQueryTerms(index, queryTerms, {
    enabled: options.fuzzy !== false,
    limit: options.fuzzyLimit || DEFAULT_FUZZY_LIMIT
  });
  if (expansion.counts.size === 0) {
    if (queryTerms.length === 0 && parsedQuery.excludeTerms.length > 0) {
      return filterOnlyResults(index, parsedQuery, options.limit || 25);
    }
    return [];
  }

  const exactTermSet = new Set(queryTerms);
  const expandedTermSet = new Set(expansion.counts.keys());
  const queryCounts = expansion.counts;
  const queryVector = tfidfVector(queryCounts, index.idf);

  return index.documents
    .map((doc) => {
      const vector = index.vectors.get(doc.id);
      if (!passesQueryFilters(doc, vector, parsedQuery)) {
        return null;
      }
      const score = cosineSimilarity(queryVector, vector) + titleBoost(doc.title, expandedTermSet);
      return {
        doc,
        score,
        matchedTerms: matchedTerms(vector, expandedTermSet),
        fuzzyMatches: fuzzyMatchesForDocument(vector, expansion.fuzzyMatches),
        snippet: createSnippet(doc, [...parsedQuery.phrases, ...exactTermSet, ...expandedTermSet])
      };
    })
    .filter((result) => result && result.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .slice(0, options.limit || 25);
}

function filterOnlyResults(index, parsedQuery, limit) {
  return index.documents
    .map((doc) => {
      const vector = index.vectors.get(doc.id);
      if (!passesQueryFilters(doc, vector, parsedQuery)) {
        return null;
      }
      return {
        doc,
        score: 0,
        matchedTerms: [],
        fuzzyMatches: [],
        snippet: createSnippet(doc, parsedQuery.excludeTerms)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.doc.title.localeCompare(b.doc.title))
    .slice(0, limit);
}

export function parseQuery(query) {
  const phrases = [];
  let remainder = String(query ?? "").replace(/"([^"]+)"/g, (_, phrase) => {
    const cleaned = normalizeSearchText(phrase);
    if (cleaned) {
      phrases.push(cleaned);
    }
    return " ";
  });

  const includeTerms = [];
  const excludeTerms = [];
  const tagTerms = [];

  for (const part of remainder.split(/\s+/)) {
    if (!part) {
      continue;
    }
    if (part.startsWith("-") && part.length > 1) {
      excludeTerms.push(...tokenize(part.slice(1)));
      continue;
    }
    if (part.toLowerCase().startsWith("tag:") && part.length > 4) {
      tagTerms.push(...tokenize(part.slice(4)));
      continue;
    }
    includeTerms.push(...tokenize(part));
  }

  return {
    includeTerms,
    excludeTerms: [...new Set(excludeTerms)],
    tagTerms: [...new Set(tagTerms)],
    phrases: [...new Set(phrases)]
  };
}

export function findFuzzyTerms(term, vocabulary, options = {}) {
  const maxDistance = options.maxDistance ?? maxFuzzyDistance(term);
  const limit = options.limit || DEFAULT_FUZZY_LIMIT;
  if (term.length < 4) {
    return [];
  }

  return [...vocabulary]
    .map((candidate) => ({
      term: candidate,
      distance: levenshteinDistance(term, candidate)
    }))
    .filter((match) => match.distance > 0 && match.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance || a.term.length - b.term.length || a.term.localeCompare(b.term))
    .slice(0, limit);
}

export function levenshteinDistance(a, b) {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < b.length; j += 1) {
      const insert = current[j] + 1;
      const remove = previous[j + 1] + 1;
      const replace = previous[j] + (a[i] === b[j] ? 0 : 1);
      current.push(Math.min(insert, remove, replace));
    }
    previous = current;
  }
  return previous[b.length];
}

export function suggestTags(document, documents, limit = 6) {
  const index = buildIndex(documents);
  const vector = index.vectors.get(document.id) || new Map();
  return [...vector.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term]) => term);
}

export function similarDocuments(documentId, documents, limit = 4) {
  const index = buildIndex(documents);
  const source = index.vectors.get(documentId);
  if (!source) {
    return [];
  }

  return index.documents
    .filter((doc) => doc.id !== documentId)
    .map((doc) => ({
      doc,
      score: cosineSimilarity(source, index.vectors.get(doc.id))
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .slice(0, limit);
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.size === 0 || b.size === 0) {
    return 0;
  }

  let dot = 0;
  let lengthA = 0;
  let lengthB = 0;

  for (const value of a.values()) {
    lengthA += value * value;
  }
  for (const value of b.values()) {
    lengthB += value * value;
  }
  for (const [term, value] of a) {
    dot += value * (b.get(term) || 0);
  }

  if (lengthA === 0 || lengthB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(lengthA) * Math.sqrt(lengthB));
}

export function createSnippet(document, queryTerms, radius = 80) {
  const source = `${document.title}\n${document.body}`;
  const lower = normalizeSearchText(source);
  const firstMatch = queryTerms
    .map((term) => lower.indexOf(normalizeSearchText(term)))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b)[0] ?? 0;

  const start = Math.max(0, firstMatch - radius);
  const end = Math.min(source.length, firstMatch + radius);
  const prefix = start > 0 ? "... " : "";
  const suffix = end < source.length ? " ..." : "";
  const raw = `${prefix}${source.slice(start, end)}${suffix}`;
  return highlight(raw, queryTerms);
}

function normalizeDocument(document) {
  return {
    id: String(document.id),
    title: String(document.title || "Untitled"),
    body: String(document.body || ""),
    createdAt: document.createdAt || new Date().toISOString(),
    updatedAt: document.updatedAt || new Date().toISOString()
  };
}

function tfidfVector(counts, idf) {
  const vector = new Map();
  if (!counts) {
    return vector;
  }
  const maxCount = Math.max(...counts.values(), 1);
  for (const [term, count] of counts) {
    const normalizedTf = count / maxCount;
    vector.set(term, normalizedTf * (idf.get(term) || 1));
  }
  return vector;
}

function queryTermsForSearch(parsedQuery) {
  return [
    ...parsedQuery.includeTerms,
    ...parsedQuery.tagTerms,
    ...parsedQuery.phrases.flatMap((phrase) => tokenize(phrase))
  ];
}

function hasExecutableQuery(parsedQuery, queryTerms) {
  return queryTerms.length > 0 || parsedQuery.excludeTerms.length > 0 || parsedQuery.phrases.length > 0;
}

function passesQueryFilters(doc, vector, parsedQuery) {
  const documentText = normalizeSearchText(`${doc.title} ${doc.body}`);
  for (const excluded of parsedQuery.excludeTerms) {
    if (vector.has(excluded) || documentText.includes(excluded)) {
      return false;
    }
  }
  for (const tag of parsedQuery.tagTerms) {
    if (!vector.has(tag)) {
      return false;
    }
  }
  for (const phrase of parsedQuery.phrases) {
    if (!documentText.includes(phrase)) {
      return false;
    }
  }
  return true;
}

function expandQueryTerms(index, queryTerms, options) {
  const counts = new Map();
  const fuzzyMatches = [];
  const vocabulary = [...index.idf.keys()];

  for (const queryTerm of queryTerms) {
    if (index.idf.has(queryTerm)) {
      counts.set(queryTerm, (counts.get(queryTerm) || 0) + 1);
      continue;
    }

    if (!options.enabled) {
      continue;
    }

    const matches = findFuzzyTerms(queryTerm, vocabulary, { limit: options.limit });
    for (const match of matches) {
      const weight = 1 / (match.distance + 1);
      counts.set(match.term, (counts.get(match.term) || 0) + weight);
      fuzzyMatches.push({ query: queryTerm, term: match.term, distance: match.distance });
    }
  }

  return { counts, fuzzyMatches };
}

function maxFuzzyDistance(term) {
  if (term.length <= 4) {
    return 1;
  }
  if (term.length <= 8) {
    return 2;
  }
  return 3;
}

function titleBoost(title, queryTermSet) {
  const titleTerms = new Set(tokenize(title));
  let boost = 0;
  for (const term of queryTermSet) {
    if (titleTerms.has(term)) {
      boost += 0.08;
    }
  }
  return boost;
}

function matchedTerms(vector, queryTermSet) {
  return [...queryTermSet].filter((term) => vector.has(term));
}

function fuzzyMatchesForDocument(vector, fuzzyMatches) {
  return fuzzyMatches.filter((match) => vector.has(match.term));
}

function highlight(value, queryTerms) {
  const uniqueTerms = [...new Set(queryTerms)].sort((a, b) => b.length - a.length);
  if (uniqueTerms.length === 0) {
    return escapeHtml(value);
  }

  const escaped = escapeHtml(value);
  const pattern = uniqueTerms.map(escapeRegExp).join("|");
  return escaped.replace(new RegExp(`\\b(${pattern})\\b`, "gi"), "<mark>$1</mark>");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
