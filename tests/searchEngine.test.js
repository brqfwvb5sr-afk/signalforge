import test from "node:test";
import assert from "node:assert/strict";

import { createSnippet, search, similarDocuments, suggestTags } from "../src/core/searchEngine.js";
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
  assert.deepEqual(tokenize("Das grössere Projekt, mit Ranking!"), ["grossere", "projekt", "ranking"]);
});

test("search ranks matching documents above unrelated documents", () => {
  const results = search(docs, "ranking frequency");
  assert.equal(results[0].doc.id, "a");
  assert.ok(results.every((result) => result.score > 0));
});

test("search returns empty results for stopword-only queries", () => {
  assert.deepEqual(search(docs, "the and und das"), []);
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
