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
