#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { evaluateFlag } from "./index.js";

const [flagPath, contextPath] = process.argv.slice(2);

if (!flagPath) {
  console.error("Usage: flagship <flag.json> [context.json]");
  process.exit(1);
}

const flag = JSON.parse(await readFile(flagPath, "utf8"));
const context = contextPath ? JSON.parse(await readFile(contextPath, "utf8")) : {};
const result = evaluateFlag(flag, context);

console.log(JSON.stringify(result, null, 2));
