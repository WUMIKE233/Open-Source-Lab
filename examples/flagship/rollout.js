import { evaluateFlag } from "../../packages/flagship/src/index.js";

const flag = {
  key: "new-dashboard",
  enabled: true,
  rules: [
    {
      name: "internal beta",
      if: { all: [{ attribute: "team", op: "eq", value: "internal" }] },
      serve: "enabled"
    }
  ],
  rollout: {
    percentage: 25,
    salt: "2026-q2"
  },
  defaultVariant: "disabled",
  variants: [
    { key: "disabled", weight: 75, value: false },
    { key: "enabled", weight: 25, value: true }
  ]
};

for (const user of [
  { identity: "alice", attributes: { team: "internal" } },
  { identity: "bob", attributes: { team: "customer" } },
  { identity: "carol", attributes: { team: "customer" } }
]) {
  console.log(user.identity, evaluateFlag(flag, user));
}
