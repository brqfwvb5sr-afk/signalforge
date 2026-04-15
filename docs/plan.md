# Plan

## Current Goal

Build LexiCore: a local-first browser search engine for personal notes and documents. It must be creative and useful without APIs, remote AI models, or backend services.

## Default Milestones

1. Build the core text pipeline: normalize, tokenize, stopwords, and term frequency.
2. Build an inverted index and TF-IDF ranking.
3. Add the first usable browser UI with document editing and search.
4. Add snippets, highlighting, tag suggestions, and similar documents.
5. Add local storage plus import/export.
6. Add tests for search behavior and edge cases.
7. Publish with GitHub Pages.

## MVP Acceptance Criteria

- A user can create, edit, delete, and search documents.
- Search results are ranked by hand-written scoring code.
- Matching terms are highlighted in snippets.
- The app suggests tags from important document terms.
- The app can show similar documents using cosine similarity.
- Documents persist locally in the browser.
- The project has automated tests for the search engine.

## Next Decision

Choose the next feature after the MVP: fuzzy search, query filters, import/export, or document graph.
