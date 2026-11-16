// Historical upload sentinels validate the original author bytes, while
// allowing ONLY the explicitly approved creature Dodge field in live Showcase.
// Do not alter, rewrite, or regenerate archived source-exports.
import assert from "node:assert/strict";
import {CAPTURE_CREATURE_DEFENSIVE_REACTION_DEFAULT_V1} from "../../src/contracts/capture-creature-defensive-reaction-v1.js";

export function withoutNewDefaultDodgeV1(record) {
 assert.equal(record?.schema,"capture-creature-transfer-v1");
 const combat=record?.draft?.combat;
 assert.ok(combat && typeof combat==="object");
 const {reaction,...historicalCombat}=combat;
 assert.deepEqual(reaction,CAPTURE_CREATURE_DEFENSIVE_REACTION_DEFAULT_V1,
  "only the approved standard Dodge addition may differ from the archived author transfer");
 return {...record,draft:{...record.draft,combat:historicalCombat}};
}

export function originalCreatureBytesBeforeDodgeV1(raw) {
 const historical=withoutNewDefaultDodgeV1(JSON.parse(Buffer.from(raw).toString("utf8")));
 // The original Loup, Freclairions and Voltige exports have no trailing newline.
 return Buffer.from(JSON.stringify(historical,null,2),"utf8");
}


// Reconstitue les octets de l'export historique en retirant UNIQUEMENT les
// six champs de la révision auteur Freclairions du 16/11/2026.
export function originalFreclairionsBytesBeforeVisualRefreshV1(raw) {
 const current=JSON.parse(Buffer.from(raw).toString("utf8"));
 assert.equal(current?.draft?.id,"crea_foudrillon");
 const {draft,statValues}=current;
 assert.equal(draft.capture.rarity,"rare");
 assert.equal(statValues.values.glace,0);
 const presentation=draft.presentation;
 assert.deepEqual(presentation.viewOverrides.opponent,
  {displayScale:0.5,position:{x:0,y:50}});
 assert.deepEqual(presentation.visual.movementScaleByView,
  {player:1.5,opponent:1.5});
 assert.deepEqual(presentation.visual.movement,{
  assetId:"pack:capture:creature-guepe-cybernetique-movement-opponent-12-v1",
  mode:"sprite",displayScale:1,rotationTurns:3,frameCount:1,transitionMs:80
 });
 const {rarity,...historicalCapture}=draft.capture;
 const {glace,...historicalStatValues}=statValues.values;
 const historicalVisual={...presentation.visual};
 delete historicalVisual.movement;
 historicalVisual.movementScaleByView={player:1.5,opponent:1};
 const historical={
  ...current,
  draft:{...draft,capture:historicalCapture,presentation:{
   ...presentation,
   viewOverrides:{...presentation.viewOverrides,opponent:{displayScale:1,position:{x:0,y:0}}},
   visual:historicalVisual
  }},
  statValues:{...statValues,values:historicalStatValues}
 };
 return originalCreatureBytesBeforeDodgeV1(Buffer.from(JSON.stringify(historical,null,2),"utf8"));
}
