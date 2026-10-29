import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const file=path.join(root,'data/capture/showcase/kitsune_lunaire.capture-creature-transfer-v1.json');
const previous='pack:capture:creature-lunaire-attack-player-7-v1';
const approved='pack:capture:creature-lunaire-attack-player-8-v1';
const baseBlob='378268e5c414bad7d2440a65617efa99765ddf1f';
function gitBlob(source){
 const bytes=Buffer.from(source);
 return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+String.fromCharCode(0))).update(bytes).digest('hex');
}

test('Kitsune approved back attack resolves to the existing 8-frame official catalog identity',()=>{
 const raw=fs.readFileSync(file,'utf8');
 const transfer=JSON.parse(raw);
 assert.equal(transfer.draft.id,'kitsune_lunaire');
 assert.equal(transfer.draft.presentation.visual.rangedAttackBack.assetId,approved,
  'the previously validated 8-frame back attack must be the single author reference');
 assert.equal(raw.includes(previous),false,'obsolete 7-frame ID must not be authored');
 const reverted=raw.replace('"'+approved+'"','"'+previous+'"');
 assert.notEqual(reverted,raw,'only the known authorized string is transformed');
 assert.equal(gitBlob(reverted),baseBlob,
  'every other byte of original author settings, animations, loadout and skills must be preserved');
});
