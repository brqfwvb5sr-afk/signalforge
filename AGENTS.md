# Repository Instructions

## Project Status

This repository is prepared for a multi-agent Codex workflow. The concrete app or game can still be chosen, but the default working style is already set up for a 20-30 hour programming project.

## Agent Workflow

- Use the main Codex thread as coordinator and decision maker.
- Use `planner` for milestones, task breakdowns, acceptance criteria, and risk mapping.
- Use `idea_scout` for creative feature ideas, level ideas, and scope expansion.
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
- Add tests for simulation logic, parsers, state machines, and user-visible bug fixes.
- Do not add secrets or API keys to the repo.
- For browser projects, prefer GitHub Pages-compatible deployment unless the project needs a backend.

## Review Guidelines

- Prioritize real bugs, behavioral regressions, missing tests, security issues, and deployment problems.
- Include file references and reproduction steps when possible.
- Treat scope creep as a risk if it blocks a working MVP.
