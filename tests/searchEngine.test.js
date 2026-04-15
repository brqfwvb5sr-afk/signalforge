import test from "node:test";
import assert from "node:assert/strict";

import {
  createSnippet,
  findFuzzyTerms,
  levenshteinDistance,
  parseQuery,
  search,
  similarDocuments,
  suggestTags
} from "../src/core/searchEngine.js";
import { tokenize } from "../src/core/text.js";

const docs = [
  {
    id: "a",
    title: "Ranking algorithms",
    body: "TF-IDF search ranking uses term frequency and inverse document frequency."
  },
  {
    id: "b",
    title: "Recipe notes",
    body: "Pasta needs tomato sauce, salt, and slow heat."
  },
  {
    id: "c",
    title: "Search index",
    body: "An inverted index maps terms to documents and makes search faster."
  }
];

test("tokenize normalizes umlauts, removes punctuation, and skips stopwords", () => {
  assert.deepEqual(tokenize("Das gr\u00f6ssere Projekt, mit Ranking!"), ["grossere", "projekt", "ranking"]);
});

test("search ranks matching documents above unrelated documents", () => {
  const results = search(docs, "ranking frequency");
  assert.equal(results[0].doc.id, "a");
  assert.ok(results.every((result) => result.score > 0));
});

test("search returns empty results for stopword-only queries", () => {
  assert.deepEqual(search(docs, "the and und das"), []);
});

test("parseQuery separates phrases, tag filters, exclusions, and normal terms", () => {
  assert.deepEqual(parseQuery('"term frequency" tag:ranking -recipe search'), {
    includeTerms: ["search"],
    excludeTerms: ["recipe"],
    tagTerms: ["ranking"],
    phrases: ["term frequency"]
  });
});

test("search requires quoted phrases", () => {
  const results = search(docs, '"term frequency"');
  assert.equal(results.length, 1);
  assert.equal(results[0].doc.id, "a");
});

test("search excludes documents with negative terms", () => {
  const results = search(docs, "notes -pasta");
  assert.equal(results.length, 0);
});

test("search supports filter-only negative queries", () => {
  const results = search(docs, "-recipe");
  assert.deepEqual(results.map((result) => result.doc.id), ["a", "c"]);
});

test("search requires tag terms to exist in the document vector", () => {
  const results = search(docs, "tag:index");
  assert.deepEqual(results.map((result) => result.doc.id), ["c"]);
});

test("search finds close misspellings with fuzzy matching", () => {
  const results = search(docs, "algoritm");
  assert.equal(results[0].doc.id, "a");
  assert.deepEqual(results[0].fuzzyMatches, [{ query: "algoritm", term: "algorithms", distance: 2 }]);
});

test("search can disable fuzzy matching", () => {
  assert.deepEqual(search(docs, "algoritm", { fuzzy: false }), []);
});

test("findFuzzyTerms limits matches by edit distance", () => {
  const matches = findFuzzyTerms("serch", ["search", "salt", "ranking"]);
  assert.deepEqual(matches, [{ term: "search", distance: 1 }]);
});

test("levenshteinDistance handles inserts, deletes, and replacements", () => {
  assert.equal(levenshteinDistance("kitten", "sitting"), 3);
});

test("similarDocuments finds documents with shared search terms", () => {
  const similar = similarDocuments("a", docs);
  assert.equal(similar[0].doc.id, "c");
});

test("suggestTags returns high-value terms from the selected document", () => {
  const tags = suggestTags(docs[0], docs, 3);
  assert.ok(tags.includes("ranking"));
});

test("snippet output escapes HTML before highlighting", () => {
  const snippet = createSnippet({ title: "x", body: "<script>alert('ranking')</script>" }, ["ranking"]);
  assert.match(snippet, /&lt;script&gt;/);
  assert.match(snippet, /<mark>ranking<\/mark>/);
});
