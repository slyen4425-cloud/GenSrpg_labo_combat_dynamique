import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEmbeddedCombatLifecycleV1} from '../../src/ui/embedded-combat-lifecycle-v1.js';

// A host receives actual Lab fighter HP / native outcomes, never a second
// CombatSession or an invented UI result. 1v1 and 2v2 are both supported.
const fmt=(paired=false)=>{
 const actors=paired?[
  {actorId:'p',teamId:'player'},{actorId:'p2',teamId:'player'},
  {actorId:'e',teamId:'enemy'},{actorId:'e2',teamId:'enemy'}
 ]:[{actorId:'p',teamId:'player'},{actorId:'e',teamId:'enemy'}];
 return {actors,localActorId:'p',teamOf:id=>actors.find(a=>a.actorId===id)?.teamId};
};
const state=(hp)=>({fighters:Object.fromEntries(Object.entries(hp).map(([id,value])=>[
 id,{hp:value,maxHp:20}
]))});
test('embedded 1v1 observes real enemy KO once and returns the unmodified native state',async()=>{
 const host=createEmbeddedCombatLifecycleV1({format:fmt()});
 const live=state({p:12,e:15});
 assert.equal(host.observe(live),false);
 const finished=state({p:11,e:0});
 assert.equal(host.observe(finished),true);
 assert.equal(host.observe(finished),false,'idempotent completion');
 const result=await host.completion;
 assert.equal(result.outcome,'victory');
 assert.equal(result.state,finished,'no copied/simulated Combat state');
});
test('native 1v1 defeat and flee are distinct outcomes',async()=>{
 const losing=createEmbeddedCombatLifecycleV1({format:fmt()});
 assert.equal(losing.observe(state({p:0,e:7})),true);
 assert.equal((await losing.completion).outcome,'defeat');
 const leaving=createEmbeddedCombatLifecycleV1({format:fmt()});
 assert.equal(leaving.flee(state({p:8,e:9})),true);
 assert.equal(leaving.flee(state({p:8,e:9})),false);
 assert.equal((await leaving.completion).outcome,'flee');
});
test('native 2v2 waits for both enemy fighters, preserving the player side',async()=>{
 const host=createEmbeddedCombatLifecycleV1({format:fmt(true)});
 assert.equal(host.observe(state({p:8,p2:0,e:0,e2:4})),false);
 const after=state({p:8,p2:0,e:0,e2:0});
 assert.equal(host.observe(after),true);
 assert.equal((await host.completion).state,after);
});
test('embedded lifecycle rejects unverified, ambiguous or inconsistent battle state',()=>{
 assert.throws(()=>createEmbeddedCombatLifecycleV1({format:{}}),/BattleFormat/);
 const host=createEmbeddedCombatLifecycleV1({format:fmt()});
 assert.throws(()=>host.observe(state({p:10})),/fighter/);
 assert.throws(()=>host.observe(state({p:0,e:0})),/Simultaneous/);
 assert.throws(()=>host.flee(state({p:22,e:10})),/fighter/);
});
test('existing main UI passes an embedded snapshot only to the one native Lab session',()=>{
 const preview=readFileSync(new URL('../../src/ui/capture-combat-preview-v1.js',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../../src/ui/combat-2v2-test-ui.js',import.meta.url),'utf8');
 assert.match(preview,/embeddedBattle\s*=\s*null/);
 assert.match(preview,/nativeCombatSource,\s*embeddedBattle,/);
 assert.match(scene,/initialHpByActor\s*=\s*embeddedBattle\?\.initialHpByActor/);
 assert.match(scene,/createCombatSession\s*\(\s*\{/);
 assert.match(scene,/embeddedLifecycle\?\.observe\(state\)/);
 assert.match(scene,/completion:\s*embeddedLifecycle\?\.completion/);
 assert.match(scene,/flee\(\)\s*\{/);
 assert.doesNotMatch(scene,/captureStartBattleAutomatic/);
});
