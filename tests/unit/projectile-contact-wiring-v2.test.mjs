import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function callConfig(source, callee) {
  const marker = `const ${callee === "createDomSkillFxRenderer" ? "fx" : "combatAudio"} = ${callee}({`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing ${callee} call`);

  let index = start + marker.length;
  let depth = 1;

  while (index < source.length && depth > 0) {
    const ch = source[index];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    index += 1;
  }

  assert.equal(depth, 0, `unterminated ${callee} config`);
  return source.slice(start + marker.length, index - 1);
}

test("combat composition roots wire projectile contact on FX renderer, never audio", async () => {
  const paths = [
    "../../src/ui/combat-test-ui.js",
    "../../src/ui/combat-2v2-test-ui.js"
  ];

  for (const path of paths) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    const fxConfig = callConfig(source, "createDomSkillFxRenderer");
    const audioConfig = callConfig(source, "createDomCombatAudio");

    assert.match(
      fxConfig,
      /onProjectileContact\(contact\)[\s\S]*runtime\?\.reportActionContact\(contact\)/,
      `${path}: FX renderer must own the contact callback routing`
    );
    assert.doesNotMatch(
      audioConfig,
      /onProjectileContact/,
      `${path}: audio adapter must not receive projectile contact routing`
    );
  }
});
