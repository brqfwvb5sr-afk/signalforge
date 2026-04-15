import { escapeHtml, termFrequency, tokenize } from "./text.js";

const TITLE_WEIGHT = 1.6;
const BODY_WEIGHT = 1;

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
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) {
    return [];
  }

  const queryCounts = termFrequency(queryTerms);
  const queryVector = tfidfVector(queryCounts, index.idf);
  const queryTermSet = new Set(queryTerms);

  return index.documents
    .map((doc) => {
      const vector = index.vectors.get(doc.id);
      const score = cosineSimilarity(queryVector, vector) + titleBoost(doc.title, queryTermSet);
      return {
        doc,
        score,
        matchedTerms: matchedTerms(vector, queryTermSet),
        snippet: createSnippet(doc, queryTerms)
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .slice(0, options.limit || 25);
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
  const lower = source.toLowerCase();
  const firstMatch = queryTerms
    .map((term) => lower.indexOf(term.toLowerCase()))
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
