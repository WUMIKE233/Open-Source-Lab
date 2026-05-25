# Architecture

Open Source Lab is a monorepo of small libraries that share a few design constraints.

## Package Boundaries

`event-forge` owns workflow execution. It validates directed acyclic task graphs, schedules tasks when dependencies complete, and reports lifecycle events.

`flagship` owns feature decisioning. It evaluates rule predicates, selects deterministic rollout buckets, and returns structured reasons for every decision.

`loglens` owns log ingestion and analysis. It normalizes different log formats into events, computes summaries, and highlights suspicious metric spikes.

## Shared Principles

- Public functions return structured data instead of logging.
- CLIs are thin wrappers around library APIs.
- Errors include enough context to fix configuration mistakes.
- Tests double as usage examples.

## Data Flow

```text
input -> validation -> pure domain logic -> structured result
```

The packages deliberately avoid shared internal utilities until duplication becomes painful. This keeps each project easy to copy, fork, or publish independently.
