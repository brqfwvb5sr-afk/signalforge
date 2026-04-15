# Codex Agent Workflow

This repo uses project-scoped Codex custom agents in `.codex/agents/`.

## Agents

| Agent | Model | Writes code | Main job |
| --- | --- | --- | --- |
| `planner` | `gpt-5.4-mini` | No | Turns ideas into milestones and scoped tasks. |
| `idea_scout` | `gpt-5.4-mini` | No | Finds creative features and level ideas. |
| `builder` | `gpt-5.4` | Yes | Implements the selected task. |
| `debugger` | `gpt-5.4-mini` | No | Finds bugs and proposes fixes. |
| `reviewer` | `gpt-5.4` | No | Reviews final changes for correctness and missing tests. |

## Standard Prompt

Use this when starting a feature:

```text
Use subagents for this feature. Have planner turn the idea into a small implementation plan and have debugger list likely edge cases. Wait for both. Then have builder implement only the agreed MVP scope. After implementation, have reviewer and debugger inspect the result. Only builder may edit code.
```

## Idea Prompt

Use this when you want more creative options:

```text
Spawn idea_scout and planner in parallel. idea_scout should propose 5 fun feature ideas. planner should estimate the smallest useful MVP for each. Wait for both, then recommend one option with acceptance criteria.
```

## Debug Prompt

Use this when something is broken:

```text
Spawn debugger to reproduce or reason through this bug. It should return severity, reproduction steps, likely cause, suggested fix, and a test that should catch it. Then have builder apply the smallest fix.
```

## Review Prompt

Use this before publishing:

```text
Spawn reviewer and debugger in parallel. reviewer should look for correctness, regressions, security, deployment, and missing tests. debugger should focus on runtime edge cases. Wait for both and summarize only actionable findings.
```
