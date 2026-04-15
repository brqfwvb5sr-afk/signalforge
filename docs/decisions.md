# Decisions

## Accepted

Date: 2026-04-15
Decision: Build LexiCore.
Reason: It is creative, useful, large enough for a 20-30 hour project, and can be built entirely from local code without APIs or AI models.
Alternatives considered: Browser game, API-based AI tool, local model tool.
Impact: The MVP focuses on search algorithms, document storage, and a browser UI.

Date: 2026-04-15
Decision: Add Fuzzy Search as the first post-MVP feature.
Reason: It makes LexiCore feel smarter while staying entirely local and hand-written.
Alternatives considered: Query filters, document graph, markdown import.
Impact: The search engine now uses Levenshtein distance to match close misspellings.

Date: 2026-04-15
Decision: Add a small query language.
Reason: Quoted phrases, negative terms, and `tag:` filters make LexiCore behave more like a real search engine without adding dependencies.
Alternatives considered: Markdown import, document graph, benchmark panel.
Impact: The parser now separates normal terms, exact phrases, required indexed terms, and exclusions.

## Pending

- Deployment target.
- Repository rename from `signalforge` to `lexicore`, if desired.

## Template

```text
Date:
Decision:
Reason:
Alternatives considered:
Impact:
```
