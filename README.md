# Open Source Lab

Open Source Lab is a zero-dependency JavaScript monorepo containing three practical open source projects:

- `@osl/event-forge`: a lightweight workflow DAG runner with retries, timeouts, cancellation, and lifecycle hooks.
- `@osl/flagship`: a deterministic feature flag evaluator with segment rules and weighted rollouts.
- `@osl/loglens`: a log parsing and anomaly detection toolkit with a streaming CLI.

The projects are intentionally dependency-light so contributors can inspect, test, and ship changes quickly.

## Quick Start

```bash
npm test
```

Each package is ESM-first and works on Node.js 20+.

## Repository Layout

```text
packages/
  event-forge/   Workflow orchestration primitives
  flagship/      Feature flag and rollout evaluation
  loglens/       Log parsing, summarization, and anomaly detection
docs/
  architecture.md
```

## Project Philosophy

These libraries are designed as small, understandable building blocks:

- predictable APIs over large frameworks
- pure functions where possible
- no external runtime dependencies
- tests that document behavior
- readable source code for first-time contributors

## Development

Run all tests:

```bash
npm test
```

Run the smoke check:

```bash
npm run check
```

## License

MIT
