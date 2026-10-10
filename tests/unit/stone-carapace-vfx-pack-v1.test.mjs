import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root=process.cwd();
const pack=path.join(root,'assets/library/capture/sprites/skills/stone_carapace');
const catalogPath=path.join(root,'data/assets/catalog/global-visual-assets.v1.json');
const source=path.join(root,'assets/library/capture/sprites/source/stone_carapace_v1/stone_carapace_aura_source_01.webp');
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
function pngSize(file){const b=fs.readFileSync(file);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return [b.readUInt32BE(16),b.readUInt32BE(20)];}
function webpSize(file){
 const b=fs.readFileSync(file);
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 const type=b.toString('ascii',12,16);
 if(type==='VP8L'){
   assert.equal(b[20],0x2f);
   return [1+(b[21]|((b[22]&0x3f)<<8)),1+((b[22]>>6)|(b[23]<<2)|((b[24]&0xf)<<10))];
 }
 if(type==='VP8X'){
   return [1+b[24]+(b[25]<<8)+(b[26]<<16),1+b[27]+(b[28]<<8)+(b[29]<<16)];
 }
 throw new Error('Unsupported WebP header '+type);
}

test('stone carapace keeps 16 original cast frames, 12 aura frames and real correct atlas dimensions',()=>{
 const rows=fs.readFileSync(path.join(pack,'manifest.csv'),'utf8').trim().split(/\r?\n/);
 assert.equal(rows.length,29,'28 active PNGs + CSV header');
 for(const [role,count] of [['cast',16],['aura',12]]){
   for(let i=1;i<=count;i+=1){
     const file=path.join(pack,'frames',`sprite_skill_stone_carapace_${role}_${String(i).padStart(2,'0')}.png`);
     assert.deepEqual(pngSize(file),[512,512]);
   }
   const atlas=path.join(pack,'atlases',`sprite_skill_stone_carapace_${role}_atlas_01.webp`);
   assert.deepEqual(webpSize(atlas),[count*512,512]);
 }
 for(let i=13;i<=16;i++){
   const file=path.join(pack,'frames',`sprite_skill_stone_carapace_aura_${String(i).padStart(2,'0')}.png`);
   assert.equal(fs.existsSync(file),false,'reverse/dissolve frame '+i+' must not remain active');
 }
 const seq=JSON.parse(fs.readFileSync(path.join(pack,'sprite_skill_stone_carapace_sequences_01.json'),'utf8'));
 assert.equal(seq.sequences.cast.frame_count,16);
 assert.equal(seq.sequences.aura.frame_count,12);
 assert.equal(seq.sequences.aura.frames.length,12);
 assert.match(seq.sequences.aura.frames.at(-1),/_12\.png$/);
 assert.equal(seq.sequences.aura.frame_ms,90);
 assert.equal(seq.sequences.aura.playback_mode,'loop','user status playback setting remains the playback authority');
});

test('trimmed stone aura retains canonical assetId, exact catalogue dimensions and original archived 16-frame source',()=>{
 const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
 const ids=catalog.assets.map(a=>a.id);
 assert.equal(new Set(ids).size,ids.length);
 const cast=catalog.assets.find(a=>a.id==='pack:capture:sprite-stone-carapace-cast-01');
 const aura=catalog.assets.find(a=>a.id==='pack:capture:sprite-stone-carapace-aura-01');
 assert.ok(cast);assert.ok(aura);
 assert.equal(cast.resource.frameCount,16);
 assert.equal(aura.resource.frameCount,12);
 assert.equal(aura.resource.frameMs,90);
 assert.equal(aura.resource.playbackMode,'loop');
 const provenance=JSON.parse(fs.readFileSync(path.join(pack,'provenance.json'),'utf8'));
 assert.deepEqual(provenance.hold_last_trim_v1.omitted_frames,[13,14,15,16]);
 assert.equal(provenance.hold_last_trim_v1.cutoff_frame,12);
 assert.equal(provenance.results.aura.frame_count,12);
 assert.equal(provenance.results.aura.frame_sha256.length,12);
 assert.equal(provenance.hold_last_trim_v1.original_source_preserved,true);
 assert.equal(provenance.hold_last_trim_v1.source_sheet_sha256,sha256(fs.readFileSync(source)));
 assert.equal(provenance.hold_last_trim_v1.trimmed_atlas_sha256,sha256(fs.readFileSync(path.join(pack,'atlases/sprite_skill_stone_carapace_aura_atlas_01.webp'))));
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==='sprite').length);
});
