import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);

async function text(path) {
  return readFile(new URL(path, root), "utf8");
}

function appearanceCard(html) {
  const title = html.indexOf("<h2>Apparence</h2>");
  assert.notEqual(title, -1, "Apparence card must exist");
  const start = html.lastIndexOf("<article", title);
  const end = html.indexOf("</article>", title);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return html.slice(start, end + "</article>".length);
}

test("Dodge appearance controls are immediately discoverable before large creature previews", async () => {
  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );
  const card = appearanceCard(html);

  assert.match(
    card,
    /<article[^>]*data-creature-appearance-card[^>]*data-collapsed="false"/,
    "Apparence must be explicitly expanded by default"
  );
  assert.match(
    card,
    /data-creature-dodge-appearance/,
    "Dodge appearance must have a dedicated visible subsection"
  );
  assert.match(
    card,
    /Esquive — effet visuel/,
    "Dodge subsection must be clearly named"
  );

  const dodge = card.indexOf(
    "data-creature-dodge-appearance"
  );
  const previews = card.indexOf(
    'class="asset-trio"'
  );
  assert.ok(
    dodge >= 0 && previews >= 0 && dodge < previews,
    "Dodge appearance subsection must appear before Face/Dos/Icon previews"
  );

  const dodgeBlockEnd = card.indexOf(
    "</section>",
    dodge
  );
  const dodgeBlock = card.slice(
    dodge,
    dodgeBlockEnd
  );
  for (const control of [
    "data-creature-dodge-fx",
    "data-creature-dodge-scale",
    "data-creature-dodge-offset-x",
    "data-creature-dodge-offset-y"
  ]) {
    assert.equal(
      dodgeBlock.includes(control),
      true,
      control + " must stay inside the dedicated Dodge appearance subsection"
    );
  }
});

test("Dodge appearance subsection has a dedicated mobile-readable visual boundary", async () => {
  const css = await text(
    "examples/dom-demo/capture-editor-v2.css"
  );

  assert.equal(
    css.includes(".creature-dodge-appearance"),
    true
  );
  assert.equal(
    css.includes(".creature-dodge-appearance__title"),
    true
  );
});
