import test from 'node:test';
import assert from 'node:assert/strict';
import { notifyExplorationCombatParentV1 } from '../../src/ui/exploration-encounter-handoff-v1.js';

test('Combat completion notifies only its same-origin Exploration parent',()=>{
 const calls=[];
 const ref={location:{origin:'https://example.test'},postMessage:(value,origin)=>calls.push({value,origin})};
 const win={location:{origin:'https://example.test'},parent:ref};
 const result={encounterId:'e1',returnToken:'r1',outcome:'victory'};
 assert.equal(notifyExplorationCombatParentV1({windowRef:win,result}),true);
 assert.deepEqual(calls,[{value:{type:'gensrpg.capture.combat-complete.v1',encounterId:'e1',returnToken:'r1'},origin:'https://example.test'}]);
 assert.equal(notifyExplorationCombatParentV1({windowRef:{location:win.location,parent:null},result}),false);
 assert.equal(notifyExplorationCombatParentV1({windowRef:{location:win.location,parent:{location:{origin:'https://other.test'},postMessage(){throw Error('should not send');}}},result}),false);
});
