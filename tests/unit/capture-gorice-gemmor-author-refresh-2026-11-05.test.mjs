import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const doc=(id)=>JSON.parse(readFileSync(new URL("../../data/capture/showcase/"+id+".capture-creature-transfer-v1.json",import.meta.url),"utf8"));
test("author Gorice/Gemmor showcase remains canonical",()=>{
 const g=doc("gorice"),m=doc("crea_crys_2");
 assert.equal(g.schema,"capture-creature-transfer-v1");
 assert.equal(g.draft.presentation.viewOverrides.player.displayScale,1.5);
 assert.equal(g.draft.presentation.viewOverrides.opponent.displayScale,0.8);
 assert.ok(g.draft.skillIds.includes("mur_de_glace"));
 assert.equal(m.schema,"capture-creature-transfer-v1");
 assert.deepEqual(m.draft.elements,["earth","nature"]);
 assert.deepEqual(m.draft.capture.spawnTags,["earth","nature"]);
 assert.equal(m.draft.presentation.profileId,"biped");
 assert.equal(m.draft.combat.approachTimeModifierPct,25);
 assert.ok(m.draft.skillIds.includes("sangsue"));
});
