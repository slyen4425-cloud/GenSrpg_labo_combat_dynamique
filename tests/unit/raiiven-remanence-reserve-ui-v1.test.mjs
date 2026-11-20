import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const path=new URL("../../src/ui/combat-2v2-test-ui.js",import.meta.url);
test("reserve echo selects original enemy first, then genuine Roster target without parallel damage",async()=>{
 const source=await readFile(path,"utf8");
 assert.match(source,/inspectEchoSource\(\{actorId,targetId,skill\}\)/);
 assert.match(source,/pendingReserveEcho=\{/);
 assert.match(source,/rosterController\.prepareSkillOnTarget\(\{actorId,targetRef,skill:effectiveSkill\}\)/);
 assert.match(source,/skill:effectiveSkill,targetRef/);
 assert.match(source,/completeTimedSkillOnTarget\(\{/);
 assert.match(source,/rosterController\.previewSkillOnTarget\(args\)/);
 assert.match(source,/sourceSkillId!==intent\.sourceSkillId/);
});
