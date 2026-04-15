# Repository Instructions

## Project Status

This repository is for LexiCore: a local-first browser search engine for personal notes and documents. It must run without APIs, remote AI models, or backend services. The interesting behavior should come from code in this repository.

## Agent Workflow

- Use the main Codex thread as coordinator and decision maker.
- Use `planner` for milestones, task breakdowns, acceptance criteria, and risk mapping.
- Use `idea_scout` for creative feature ideas, search workflows, and scope expansion.
- Use `builder` for implementation. Only one implementation agent should edit code at a time.
- Use `debugger` for bug hunts, reproduction steps, edge cases, and test suggestions.
- Use `reviewer` after meaningful changes before merging or publishing.

## Coordination Rules

- Prefer parallel agents for read-heavy work: planning, exploration, bug search, and review.
- Keep write-heavy work serial. Do not let multiple agents edit the same feature at the same time.
- Record chosen decisions in `docs/decisions.md`.
- Record planned work in `docs/backlog.md` or `docs/plan.md`.
- Record confirmed bugs in `docs/bugs.md`.
- When an agent proposes work, include acceptance criteria before implementation starts.

## Coding Rules

- Keep changes small and focused.
- Follow existing project patterns once code exists.
- Add tests for tokenization, indexing, ranking, query parsing, similarity scoring, storage boundaries, and user-visible bug fixes.
- Do not add secrets or API keys to the repo.
- Do not add API integrations or remote model calls unless the user explicitly changes the project goal.
- Prefer browser APIs and hand-written algorithms over dependencies.
- For browser projects, prefer GitHub Pages-compatible deployment unless the project needs a backend.

## Review Guidelines

- Prioritize real bugs, behavioral regressions, missing tests, security issues, and deployment problems.
- Include file references and reproduction steps when possible.
- Treat scope creep as a risk if it blocks a working MVP.
