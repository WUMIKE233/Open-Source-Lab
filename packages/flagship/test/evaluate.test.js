import assert from "node:assert/strict";
import { test } from "node:test";
import { bucketIdentity, evaluateFlag, matchesRule } from "../src/index.js";

test("serves a matching targeting rule", () => {
  const result = evaluateFlag(
    {
      key: "search",
      enabled: true,
      rules: [
        {
          name: "enterprise",
          if: { all: [{ attribute: "plan", op: "eq", value: "enterprise" }] },
          serve: "new"
        }
      ],
      variants: [
        { key: "old", weight: 100, value: "classic" },
        { key: "new", weight: 0, value: "semantic" }
      ]
    },
    { identity: "u1", attributes: { plan: "enterprise" } }
  );

  assert.equal(result.variant, "new");
  assert.equal(result.value, "semantic");
  assert.equal(result.reason, "rule:enterprise");
});

test("uses deterministic weighted rollouts", () => {
  const flag = {
    key: "nav",
    enabled: true,
    variants: [
      { key: "a", weight: 50, value: "A" },
      { key: "b", weight: 50, value: "B" }
    ]
  };

  const first = evaluateFlag(flag, { identity: "same-user" });
  const second = evaluateFlag(flag, { identity: "same-user" });

  assert.deepEqual(first, second);
  assert.equal(bucketIdentity("nav", "same-user"), bucketIdentity("nav", "same-user"));
});

test("supports nested rule expressions", () => {
  assert.equal(
    matchesRule(
      {
        all: [
          { attribute: "country", op: "in", value: ["US", "CA"] },
          { any: [{ attribute: "age", op: "gte", value: 18 }, { attribute: "staff", op: "eq", value: true }] }
        ]
      },
      { country: "US", age: 20 }
    ),
    true
  );
});

test("returns disabled decisions without selecting variants", () => {
  const result = evaluateFlag({ key: "off", enabled: false, variants: [{ key: "on", weight: 100, value: true }] });

  assert.equal(result.enabled, false);
  assert.equal(result.variant, null);
  assert.equal(result.reason, "disabled");
});
