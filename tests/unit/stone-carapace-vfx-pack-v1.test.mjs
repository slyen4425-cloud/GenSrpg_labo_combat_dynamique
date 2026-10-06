import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const pack=path.join(root,'assets/library/capture/sprites/skills/stone_carapace');
const catalogPath=path.join(root,'data/assets/catalog/global-visual-assets.v1.json');
function pngSize(file){const b=fs.readFileSync(file);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return [b.readUInt32BE(16),b.readUInt32BE(20)];}
test('stone carapace pack owns 32 512x512 frames and two atlas bindings',()=>{
 const manifest=fs.readFileSync(path.join(pack,'manifest.csv'),'utf8').trim().split(/\r?\n/);assert.equal(manifest.length,33);
 for(const role of ['cast','aura']){for(let i=1;i<=16;i+=1){const file=path.join(pack,'frames',`sprite_skill_stone_carapace_${role}_${String(i).padStart(2,'0')}.png`);assert.deepEqual(pngSize(file),[512,512]);}
 const atlas=path.join(pack,'atlases',`sprite_skill_stone_carapace_${role}_atlas_01.webp`);assert.equal(fs.readFileSync(atlas).subarray(0,4).toString('ascii'),'RIFF');}
 const seq=JSON.parse(fs.readFileSync(path.join(pack,'sprite_skill_stone_carapace_sequences_01.json'),'utf8'));assert.equal(seq.sequences.cast.frame_count,16);assert.equal(seq.sequences.aura.frame_count,16);assert.equal(seq.sequences.aura.playback_mode,'loop');
});
test('stone carapace uses the unique global visual catalogue',()=>{
 const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));const ids=catalog.assets.map(a=>a.id);assert.equal(new Set(ids).size,ids.length);
 const cast=catalog.assets.find(a=>a.id==='pack:capture:sprite-stone-carapace-cast-01');const aura=catalog.assets.find(a=>a.id==='pack:capture:sprite-stone-carapace-aura-01');assert.ok(cast);assert.ok(aura);assert.equal(cast.resource.frameCount,16);assert.equal(aura.resource.frameCount,16);assert.equal(aura.resource.playbackMode,'loop');assert.equal(catalog.counts.assets,catalog.assets.length);assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==='sprite').length);
});
