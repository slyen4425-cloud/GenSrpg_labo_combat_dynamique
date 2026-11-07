import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
test('single official main source; historic gh-pages is no longer a second edited Combat lab',()=>{
 const charter=read('docs/LAB_CHARTE.md');
 const protocol=read('docs/LAB_DELIVERY_WORKFLOW_V1.md');
 const checkpoints=read('docs/LAB_CHECKPOINT_POLICY.md');
 assert.match(charter,/RÈGLE 0 — CRITIQUE/);
 assert.match(charter,/900 Mio/);
 assert.match(charter,/une bibliothèque canonique/i);
 assert.match(charter,/aucune suppression/i);
 assert.match(charter,/main.*unique source officielle/i);
 assert.match(charter,/gh-pages.*ne reçoit plus de développement/i);
 assert.match(protocol,/main.*unique/i);
 assert.match(protocol,/gh-pages.*historique/i);
 assert.match(protocol,/Settings.*Pages/);
 assert.match(protocol,/NON VALIDÉ/);
 assert.match(checkpoints,/développement et de publication/i);
 assert.match(checkpoints,/git revert/);
});
test('main CI remains test-only and never duplicates the whole library as Pages artifact',()=>{
 const ci=read('.github/workflows/ci.yml');
 assert.match(ci,/npm run ci/);
 assert.doesNotMatch(ci,/actions\/upload-pages-artifact@|actions\/deploy-pages@/);
 assert.doesNotMatch(ci,/(?:cp|rsync)\s+-[a-zA-Z]*R.*assets\/library/);
});
