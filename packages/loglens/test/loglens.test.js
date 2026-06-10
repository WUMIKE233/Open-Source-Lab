import assert from "node:assert/strict";
import { test } from "node:test";
import { detectMetricAnomalies, parseLogLine, summarizeErrorBudget, summarizeLogs } from "../src/index.js";

test("parses ISO log lines with key-value fields", () => {
  const event = parseLogLine("2026-05-25T10:00:00Z INFO service=api latency=42 request complete");

  assert.equal(event.timestamp, "2026-05-25T10:00:00Z");
  assert.equal(event.level, "info");
  assert.equal(event.fields.service, "api");
  assert.equal(event.fields.latency, 42);
  assert.equal(event.message, "request complete");
});

test("parses JSON logs", () => {
  const event = parseLogLine('{"level":"error","msg":"failed","service":"worker","latency":91}');

  assert.equal(event.level, "error");
  assert.equal(event.message, "failed");
  assert.equal(event.fields.service, "worker");
});

test("summarizes levels, services, and messages", () => {
  const summary = summarizeLogs([
    parseLogLine("INFO service=api ready"),
    parseLogLine("ERROR service=api failed"),
    parseLogLine("ERROR service=worker failed")
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.byLevel.error, 2);
  assert.equal(summary.byService.api, 2);
  assert.equal(summary.topMessages[0].message, "failed");
});

test("detects metric anomalies by z-score", () => {
  const events = [10, 11, 10, 12, 200].map((latency) =>
    parseLogLine(`2026-05-25T10:00:00Z INFO service=api latency=${latency} ok`)
  );

  const anomalies = detectMetricAnomalies(events, { metric: "latency", zScore: 1.5 });

  assert.equal(anomalies.length, 1);
  assert.equal(anomalies[0].value, 200);
});

test("summarizes error budget burn by service", () => {
  const events = [
    parseLogLine("INFO service=api ready"),
    parseLogLine("ERROR service=api failed"),
    parseLogLine("FATAL service=worker crashed"),
    parseLogLine("WARN service=worker slow")
  ];

  const budget = summarizeErrorBudget(events, { targetReliability: 0.5 });

  assert.equal(budget.total, 4);
  assert.equal(budget.allowedErrors, 2);
  assert.equal(budget.observedErrors, 2);
  assert.equal(budget.remainingErrors, 0);
  assert.equal(budget.burnedPercent, 100);
  assert.deepEqual(budget.byService.map((item) => [item.service, item.errors]), [
    ["api", 1],
    ["worker", 1]
  ]);
});
