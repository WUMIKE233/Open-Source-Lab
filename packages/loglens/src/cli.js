#!/usr/bin/env node
import { collectStdin, detectMetricAnomalies, summarizeLogs } from "./index.js";

const metricIndex = process.argv.indexOf("--metric");
const metric = metricIndex >= 0 ? process.argv[metricIndex + 1] : undefined;
const events = await collectStdin(process.stdin);

console.log(
  JSON.stringify(
    {
      summary: summarizeLogs(events),
      anomalies: detectMetricAnomalies(events, { metric })
    },
    null,
    2
  )
);
