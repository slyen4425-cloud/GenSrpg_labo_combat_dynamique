import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adaptCaptureCreatureToFighterConfig } from '../../src/adapters/input/capture/capture-creature-to-fighter-config.js';

const transfer=JSON.parse(readFileSync(new URL('../../data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json',import.meta.url),'utf8'));

test('Moussados exposes the author-owned personal Defense action, not inherited Dodge',()=>{
  assert.equal(transfer.draft.id,'crea_mossback');
  const reaction=transfer.draft.combat.reaction;
  assert.equal(reaction?.type,'defense');
  assert.equal(reaction?.damageReductionPct,50);
  assert.equal(reaction?.maxCharges,2);
  assert.equal(reaction?.rechargeMs,30000);
  assert.equal(reaction?.activeWindowMs,250);
  const official=adaptCaptureCreatureToFighterConfig(transfer.draft);
  assert.equal(official.defensiveReaction.type,'defense');
  assert.equal(official.defensiveReaction.damageReductionPct,50);
  assert.equal(official.defensiveReaction.maxCharges,2);
  assert.equal(transfer.loadout.slots.find(s=>s.id==='slot-2')?.skillId,'lib_earth_guard',
    'Carapace minérale remains a separate, author-owned skill');
});
