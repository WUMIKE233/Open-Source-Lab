# Open Source Lab

**中文** | [English](#english)

Open Source Lab 是一个零运行时依赖的 JavaScript 开源 monorepo，收录了三个面向真实工程场景的小型库：工作流编排、Feature Flag 灰度发布、日志解析与异常检测。

这些项目的目标不是追求庞大框架，而是提供清晰、可读、容易测试、适合二次开发的开源基础组件。

## 项目内容

- `@osl/event-forge`：轻量级工作流 DAG 执行器，支持依赖校验、重试、超时、取消和生命周期 hooks。
- `@osl/flagship`：确定性的 Feature Flag 评估器，支持用户分群规则、稳定分桶和加权灰度发布。
- `@osl/loglens`：日志解析与异常检测工具，支持结构化日志摘要、指标异常识别和流式 CLI。

## 快速开始

```bash
git clone https://github.com/WUMIKE233/Open-Source-Lab.git
cd Open-Source-Lab
npm test
```

每个包都以 ESM 为优先设计，支持 Node.js 20 及以上版本。

## 仓库结构

```text
packages/
  event-forge/   工作流编排基础能力
  flagship/      Feature Flag 与灰度发布评估
  loglens/       日志解析、摘要与异常检测
docs/
  architecture.md
scripts/
  smoke-check.js
```

## 设计原则

- 使用可预测的小型 API，而不是厚重框架。
- 优先使用纯函数，让行为更容易测试和复用。
- 默认不引入运行时依赖，降低供应链风险。
- 测试既用于验证，也作为使用示例。
- 源码保持可读，方便第一次参与开源的贡献者理解。

## 开发

运行全部测试：

```bash
npm test
```

运行 smoke check：

```bash
npm run check
```

## 贡献

欢迎提交 issue 和 pull request。建议在贡献前阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，并为行为变更补充相应测试。

## 许可证

本项目基于 MIT License 开源，详见 [LICENSE](LICENSE)。

---

## English

Open Source Lab is a zero-runtime-dependency JavaScript monorepo containing three practical open source libraries for real engineering workflows: workflow orchestration, feature flag rollout evaluation, and log analysis.

The goal is not to build large frameworks. Instead, this repository provides small, readable, testable building blocks that are easy to inspect, extend, and reuse.

## Projects

- `@osl/event-forge`: a lightweight workflow DAG runner with dependency validation, retries, timeouts, cancellation, and lifecycle hooks.
- `@osl/flagship`: a deterministic feature flag evaluator with segment rules, stable bucketing, and weighted rollouts.
- `@osl/loglens`: a log parsing and anomaly detection toolkit with structured summaries, metric anomaly detection, and a streaming CLI.

## Quick Start

```bash
git clone https://github.com/WUMIKE233/Open-Source-Lab.git
cd Open-Source-Lab
npm test
```

Each package is ESM-first and supports Node.js 20 or newer.

## Repository Layout

```text
packages/
  event-forge/   Workflow orchestration primitives
  flagship/      Feature flag and rollout evaluation
  loglens/       Log parsing, summarization, and anomaly detection
docs/
  architecture.md
scripts/
  smoke-check.js
```

## Design Principles

- Prefer predictable small APIs over heavyweight frameworks.
- Use pure functions where possible so behavior is easy to test and reuse.
- Avoid runtime dependencies by default to reduce supply-chain risk.
- Let tests document behavior as practical examples.
- Keep the source approachable for first-time contributors.

## Development

Run all tests:

```bash
npm test
```

Run the smoke check:

```bash
npm run check
```

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before contributing, and include tests for behavioral changes.

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.
