import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("charter preserves laboratory independence", async () => {
  const charter = await readFile("docs/LAB_CHARTE.md", "utf8");
  assert.match(charter, /Indépendance absolue vis-à-vis de GenSrpG/);
  assert.match(charter, /aucune dépendance runtime à GenSrpG/);
});

test("architecture keeps UI separate from core", async () => {
  const architecture = await readFile("docs/LAB_ARCHITECTURE.md", "utf8");
  assert.match(architecture, /src\/core\/animation/);
  assert.match(architecture, /src\/ui/);
  assert.match(architecture, /Le Core doit rester utilisable indépendamment|Aucune autorité sur le moteur/);
});
