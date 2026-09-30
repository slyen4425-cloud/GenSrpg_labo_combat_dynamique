import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("city arena presentation does not zoom scenery beyond its authored height", async () => {
  const source = await readFile(
    new URL(
      "../../examples/dom-demo/demo-assets.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /city:\s*Object\.freeze\(\{[\s\S]*?backgroundSize:\s*"auto 100%"/
  );
});

test("combat scene uses centralized front-biased vertical anchors", async () => {
  const css = await readFile(
    new URL(
      "../../examples/dom-demo/demo.css",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "--arena-near-y: 62%",
    "--arena-far-y: 38%",
    "--arena-coop-near-primary-y: 67%",
    "--arena-coop-near-secondary-y: 64%",
    "--arena-coop-far-primary-y: 36%",
    "--arena-coop-far-secondary-y: 37%",
    "top: var(--arena-near-y)",
    "top: var(--arena-far-y)",
    "top: var(--arena-coop-near-primary-y)",
    "top: var(--arena-coop-far-primary-y)"
  ]) {
    assert.equal(
      css.includes(marker),
      true,
      marker + " must define the front-biased scene composition"
    );
  }
});

test("fighters have a presentation-only ground contact shadow", async () => {
  const css = await readFile(
    new URL(
      "../../examples/dom-demo/demo.css",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    css,
    /\.fighter::before\s*\{[\s\S]*?border-radius:\s*50%[\s\S]*?background:\s*rgba\(0,\s*0,\s*0,/s
  );
  assert.match(
    css,
    /\.fighter__motion\s*\{[\s\S]*?z-index:\s*1/s
  );
});

test("arena perception change does not rewrite creature displayScale ownership", async () => {
  const presentationContract = await readFile(
    new URL(
      "../../src/contracts/creature-presentation-binding-v2.js",
      import.meta.url
    ),
    "utf8"
  );
  const testSource = await readFile(
    new URL(
      "../../examples/dom-demo/demo-assets.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    presentationContract.includes("displayScale"),
    true
  );
  assert.equal(
    testSource.includes("creatureDisplayScale"),
    false,
    "arena presentation must not invent a second creature scale owner"
  );
});
