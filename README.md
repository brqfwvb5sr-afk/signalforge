# LexiCore

LexiCore is a local-first search engine for your own notes and documents.

It runs in the browser and does not use an API, backend, or AI model. The search behavior is built from code in this repo: tokenization, an inverted index, TF-IDF ranking, snippet highlighting, tag suggestions, and document similarity.

## Run Locally

```powershell
node tests\searchEngine.test.js
node server.js
```

Then open `http://127.0.0.1:8080`.

## Project Docs

- `.codex/config.toml` sets Codex subagent limits.
- `.codex/agents/` contains the custom agent roles.
- `AGENTS.md` contains repository-level instructions.
- `docs/agent-workflow.md` contains reusable multi-agent prompts.
