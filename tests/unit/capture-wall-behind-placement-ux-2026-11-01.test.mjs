import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {exportCaptureSkillTransferJsonV1,importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";

const base={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",hpPerStatPoint:1,
 interceptKinds:["projectile","beam","contact"],visualScale:1.5,offsetForwardPx:15,offsetUpPx:4};
const state=()=>createCombatState({fighters:[
 {id:"hero",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:80}},
 {id:"enemy",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
]});
function summon(effect,sourceSkillId="wall"){
 return createCombatBarrierV1({state:state(),sourceActorId:"hero",protectedActorId:"hero",sourceSkillId,effect});
}
test("RED: behind is a native author placement, distinct from front and arbitrary arena percentages",()=>{
 const front=normalizeSkillEffectV1(base);
 assert.equal(front.placementMode,undefined,"legacy wall stays in front without migration");
 const back=normalizeSkillEffectV1({...base,placementMode:"behind"});
 assert.equal(back.placementMode,"behind");
 assert.equal(back.offsetForwardPx,15);
 assert.equal(back.visualScale,1.5);
 assert.throws(()=>normalizeSkillEffectV1({...base,placementMode:"behind",arenaXPct:40}),/arenaXPct|arena/);
 assert.throws(()=>normalizeSkillEffectV1({...base,placementMode:"unknown"}),/placementMode/);
});
test("RED: Combat State snapshots a rear wall without changing HP, sprite or default placement",()=>{
 const front=summon(normalizeSkillEffectV1(base));
 const back=summon(normalizeSkillEffectV1({...base,placementMode:"behind"}));
 assert.equal(front.record.placementMode,undefined);
 assert.equal(back.record.placementMode,"behind");
 assert.equal(back.record.hp,80);
 assert.equal(back.record.offsetForwardPx,front.record.offsetForwardPx);
 assert.equal(back.record.visualScale,front.record.visualScale);
 assert.equal(back.state.fighters.hero.hp,100);
});
test("RED: skill export/import survives behind placement without duplicate wall or legacy mutation",()=>{
 const src=JSON.parse(readFileSync(new URL("../../data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
 const original=src.draft.definition.effects[0];
 const {arenaXPct,arenaYPct,...noArenaCoords}=original;
 const back=normalizeSkillEffectV1({...noArenaCoords,placementMode:"behind"});
 const draft={...src.draft,definition:{...src.draft.definition,effects:[back]}};
 const imported=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft));
 assert.equal(imported.value.draft.definition.effects.length,1);
 assert.equal(imported.value.draft.definition.effects[0].placementMode,"behind");
 assert.equal(imported.value.draft.definition.effects[0].statId,"glace");
 assert.equal(src.draft.definition.effects[0].placementMode,"arena");
 assert.equal(src.draft.definition.effects[0].arenaXPct,47);
});
test("RED: bestiary correctly explains a rear wall and that one strike never spills onto the fighter",()=>{
 const src=JSON.parse(readFileSync(new URL("../../data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
 const skill=normalizeSkillDefinition({...src.draft.definition,
   effects:[{...src.draft.definition.effects[0],arenaXPct:undefined,arenaYPct:undefined,placementMode:"behind"}]});
 const explanation=describeCaptureSkillV1(skill).sentences.join(" ");
 assert.match(explanation,/derrière/i);
 assert.match(explanation,/arrêt|bloqu|intercept/i);
 assert.doesNotMatch(explanation,/dégâts excédentaires touchent leur cible/i);
});
