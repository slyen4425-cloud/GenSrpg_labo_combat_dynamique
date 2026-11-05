import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {resolveCombatBarrierSpriteAssetIdForSideV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";
const player="pack:capture:sprite-mur-glace-arcanique-01",enemy="pack:capture:sprite-mur-glace-pointes-01";
const base={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",hpPerStatPoint:2,
interceptKinds:["projectile","beam","contact"],spriteAssetId:player};
test("opponent barrier asset is optional, inherited from player and normalized without editing original",()=>{
 const legacy=normalizeSkillEffectV1(base);
 assert.equal(legacy.opponentSpriteAssetId,undefined);
 assert.equal(resolveCombatBarrierSpriteAssetIdForSideV1(legacy,true),player);
 assert.equal(resolveCombatBarrierSpriteAssetIdForSideV1(legacy,false),player);
 const dual=normalizeSkillEffectV1({...base,opponentSpriteAssetId:enemy});
 assert.equal(dual.spriteAssetId,player);
 assert.equal(dual.opponentSpriteAssetId,enemy);
 assert.equal(resolveCombatBarrierSpriteAssetIdForSideV1(dual,true),enemy);
 assert.equal(resolveCombatBarrierSpriteAssetIdForSideV1(dual,false),player);
 assert.throws(()=>normalizeSkillEffectV1({...base,opponentSpriteAssetId:""}));
});
test("canonical Combat State preserves wall player+opponent options without touching HP/geometry",()=>{
 const state=createCombatState({fighters:[{id:"hero",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:15}}]});
 const wall=createCombatBarrierV1({state,sourceActorId:"hero",protectedActorId:"hero",sourceSkillId:"ice-wall",effect:normalizeSkillEffectV1({...base,opponentSpriteAssetId:enemy})}).record;
 assert.equal(wall.spriteAssetId,player);assert.equal(wall.opponentSpriteAssetId,enemy);assert.equal(wall.maxHp,30);
 assert.deepEqual(wall.interceptKinds,["projectile","beam","contact"]);
});
test("editor stores both wall sprite selectors in the same summon_entity row",()=>{
 const code=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(code,/skillBarrierOpponentSpriteAssetId/);
 assert.match(code,/data-skill-barrier-opponent-sprite-asset-id/);
 assert.match(code,/opponentSpriteAssetId/);
});
