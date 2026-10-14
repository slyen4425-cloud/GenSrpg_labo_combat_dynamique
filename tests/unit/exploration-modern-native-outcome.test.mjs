import test from 'node:test';
import assert from 'node:assert/strict';
import {
  combatTeamIsDefeatedV1,
  battleOutcomeForDefeatedActorV1
} from '../../src/ui/combat-2v2-test-ui.js';

const format = {
  localActorId: 'local-1',
  actors: [
    {actorId:'local-1',teamId:'local'},
    {actorId:'local-2',teamId:'local'},
    {actorId:'enemy-1',teamId:'enemy'},
    {actorId:'enemy-2',teamId:'enemy'}
  ],
  teamOf(id) { return this.actors.find(actor => actor.actorId===id)?.teamId ?? null; }
};
const state = {fighters:{
  'local-1':{hp:0}, 'local-2':{hp:40},
  'enemy-1':{hp:0}, 'enemy-2':{hp:0}
}};

test('2v2: KO of one fighter never ends the team while the other slot survives', () => {
  assert.equal(combatTeamIsDefeatedV1({format,state,teamId:'local'}),false);
  assert.equal(combatTeamIsDefeatedV1({format,state,teamId:'enemy'}),true);
  assert.equal(battleOutcomeForDefeatedActorV1({format,defeatedActorId:'enemy-2'}),'victory');
});

test('Roster Session reserve HP is authoritative even after active fighter KO', () => {
  const rosterSnapshot={'enemy-1':{
    members:[
      {id:'active',hp:0},
      {id:'reserve',hp:35}
    ]
  }};
  assert.equal(combatTeamIsDefeatedV1({format,state,teamId:'enemy',rosterSnapshot}),false);
  rosterSnapshot['enemy-1'].members[1].hp=0;
  assert.equal(combatTeamIsDefeatedV1({format,state,teamId:'enemy',rosterSnapshot}),true);
});

test('unmanaged combat slot reads Combat Session HP, never absent Roster state', () => {
  const rosterSnapshot={'local-1':{members:[{id:'active',hp:0},{id:'reserve',hp:15}]}};
  assert.equal(combatTeamIsDefeatedV1({format,state,teamId:'local',rosterSnapshot}),false);
  assert.equal(combatTeamIsDefeatedV1({format,state,teamId:'enemy',rosterSnapshot}),true);
});
