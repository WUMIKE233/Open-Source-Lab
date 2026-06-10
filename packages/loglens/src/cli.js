#!/usr/bin/env node
import { collectStdin, detectMetricAnomalies, summarizeErrorBudget, summarizeLogs } from "./index.js";

const metricIndex = process.argv.indexOf("--metric");
const metric = metricIndex >= 0 ? process.argv[metricIndex + 1] : undefined;
const reliabilityIndex = process.argv.indexOf("--target-reliability");
const targetReliability = reliabilityIndex >= 0 ? Number(process.argv[reliabilityIndex + 1]) : undefined;
const events = await collectStdin(process.stdin);

console.log(
  JSON.stringify(
    {
      summary: summarizeLogs(events),
      anomalies: detectMetricAnomalies(events, { metric }),
      errorBudget: summarizeErrorBudget(events, { targetReliability })
    },
    null,
    2
  )
);
