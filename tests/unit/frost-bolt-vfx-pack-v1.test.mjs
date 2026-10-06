import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const pack=path.join(root,"assets/library/capture/sprites/skills/frost_bolt");
const catalogPath=path.join(root,"data/assets/catalog/global-visual-assets.v1.json");
function pngSize(file){const b=fs.readFileSync(file);assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a");return [b.readUInt32BE(16),b.readUInt32BE(20)];}
test("frost bolt pack owns 56 512x512 frames and four atlas bindings",()=>{
 const manifest=fs.readFileSync(path.join(pack,"manifest.csv"),"utf8").trim().split(/\r?\n/);assert.equal(manifest.length,57);
 for(const [role,count] of [["cast",16],["projectile",12],["impact",12],["status_aura",16]]){
   for(let i=1;i<=count;i+=1){const file=path.join(pack,"frames",`sprite_skill_frost_bolt_${role}_${String(i).padStart(2,"0")}.png`);assert.deepEqual(pngSize(file),[512,512]);}
   const atlas=path.join(pack,"atlases",`sprite_skill_frost_bolt_${role}_atlas_01.webp`);assert.equal(fs.readFileSync(atlas).subarray(0,4).toString("ascii"),"RIFF");
 }
 const seq=JSON.parse(fs.readFileSync(path.join(pack,"sprite_skill_frost_bolt_sequences_01.json"),"utf8"));
 assert.equal(seq.sequences.cast.frame_count,16);assert.equal(seq.sequences.projectile.frame_count,12);assert.equal(seq.sequences.impact.frame_count,12);assert.equal(seq.sequences.status_aura.frame_count,16);assert.equal(seq.sequences.status_aura.frame_ms,250);assert.equal(seq.sequences.status_aura.playback_mode,"loop");
});
test("frost bolt uses additive ids in the unique global visual catalogue",()=>{
 const catalog=JSON.parse(fs.readFileSync(catalogPath,"utf8"));const ids=catalog.assets.map(a=>a.id);assert.equal(new Set(ids).size,ids.length);
 for(const id of ["pack:capture:sprite-frost-bolt-cast-01","pack:capture:sprite-frost-bolt-projectile-01","pack:capture:sprite-frost-bolt-impact-01","pack:capture:sprite-frost-bolt-status-aura-01"]) assert.ok(catalog.assets.find(a=>a.id===id),id);
 assert.ok(catalog.assets.find(a=>a.id==="pack:capture:sprite-projectile-ice-01"),"generic ice projectile must remain");
 assert.equal(catalog.counts.assets,catalog.assets.length);assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==="sprite").length);
});
