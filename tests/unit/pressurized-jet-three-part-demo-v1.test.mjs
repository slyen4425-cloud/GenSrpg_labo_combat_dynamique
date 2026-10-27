import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("public beam demonstration links the actual start atlas as a V9 beamStart slot", async () => {
  const source = await readFile(
    new URL("../../examples/dom-demo/pressurized-jet-preview.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /start: "pack:capture:sprite-pressurized-jet-beam-start-01"/);
  assert.match(source, /beamStart: slot\(IDS\.start, \{/);
  assert.match(source, /travel: slot\(IDS\.body, \{/);
  assert.match(source, /impact: slot\(IDS\.impact, \{/);
  assert.match(source, /type: "beam"/);
  assert.match(source, /createDomSkillFxRenderer/);
});
