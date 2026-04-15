import test from "node:test";
import assert from "node:assert/strict";
import { rowsToCsv } from "../lib/mappers/export.ts";

test("rowsToCsv neutralizes spreadsheet formula prefixes in string cells", () => {
  const csv = rowsToCsv([
    {
      equals: "=SUM(A1:A2)",
      plus: "+CMD",
      minus: "-10",
      at: "@payload",
      safe: "plain-text"
    }
  ]);

  assert.equal(
    csv,
    [
      "equals,plus,minus,at,safe",
      "'=SUM(A1:A2),'+CMD,'-10,'@payload,plain-text"
    ].join("\n")
  );
});
