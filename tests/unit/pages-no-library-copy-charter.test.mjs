import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
test('Combat charter forbids duplicate whole media libraries and records separate official main and gh-pages authority',()=>{
 const charter=read('docs/LAB_CHARTE.md');
 assert.match(charter,/RÈGLE 0 — CRITIQUE/);
 assert.match(charter,/900 Mio/);
 assert.match(charter,/gh-pages/);
 assert.match(charter,/une bibliothèque canonique/i);
 assert.match(charter,/sha/i);
 assert.match(charter,/aucune suppression/i);
});
test('main CI remains test-only and does not stage a second complete GitHub Pages archive',()=>{
 const ci=read('.github/workflows/ci.yml');
 assert.match(ci,/npm run ci/);
 assert.doesNotMatch(ci,/actions\/upload-pages-artifact@|actions\/deploy-pages@/);
 assert.doesNotMatch(ci,/(?:cp|rsync)\s+-[a-zA-Z]*R.*assets\/library/);
});
