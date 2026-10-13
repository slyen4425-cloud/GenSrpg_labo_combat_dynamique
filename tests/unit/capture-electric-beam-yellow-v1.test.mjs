import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const root=process.cwd();
const pack=path.join(root,"assets/library/capture/sprites/skills/electric_beam_yellow");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
const seq=JSON.parse(fs.readFileSync(path.join(pack,"sprite_skill_electric_beam_sequences_01.json"),"utf8")).sequences;
const pro=JSON.parse(fs.readFileSync(path.join(pack,"provenance.json"),"utf8"));
const cases=[
 {id:"pack:capture:sprite-electric-yellow-beam-cast-01",name:"cast",count:20,ms:60,mode:"once",category:"release"},
 {id:"pack:capture:sprite-electric-yellow-beam-body-01",name:"beam_body",count:12,ms:45,mode:"loop",category:"travel"},
 {id:"pack:capture:sprite-electric-yellow-beam-impact-01",name:"impact",count:12,ms:45,mode:"once",category:"impact"}
];
const sha=(b)=>createHash("sha256").update(b).digest("hex");
test("single global catalog owns three additive electric yellow beam assets",()=>{
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(x=>x.assetType==="sprite").length);
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
 assert.equal(catalog.storage.branch,"global-assets");
 assert.ok(catalog.counts.assets>=141);
 assert.ok(catalog.counts.sprites>=76);
 for(const row of cases){
  const matches=catalog.assets.filter(x=>x.id===row.id);
  assert.equal(matches.length,1,row.id);
  const a=matches[0];assert.equal(a.assetType,"sprite");assert.equal(a.mediaType,"image");
  assert.equal(a.category,row.category);assert.equal(a.resource.format,"sprite-strip");assert.equal(a.resource.mime,"image/webp");
  assert.equal(a.resource.frameCount,row.count);assert.equal(a.resource.frameMs,row.ms);assert.equal(a.resource.playbackMode,row.mode);
  assert.ok(a.tags.includes("electric"));assert.ok(a.tags.includes("capture"));
  assert.equal(a.resource.file,"capture/sprites/skills/electric_beam_yellow/atlases/sprite_skill_electric_beam_"+row.name+"_atlas_01.webp");
  assert.deepEqual(a.compatibility.uses,["combat","capture","editor"]);
 }
 for(const id of ["pack:capture:sprite-pressurized-jet-cast-01","pack:capture:sprite-pressurized-jet-beam-start-01","pack:capture:sprite-pressurized-jet-beam-body-01","pack:capture:sprite-pressurized-jet-impact-01","pack:capture:icon-skill-rafale-01"]){
  assert.equal(catalog.assets.filter(x=>x.id===id).length,1,id+" preserved");
 }
});
test("exactly 60 real 512x512 PNG frames match source manifest and both animation formats",()=>{
 const rows=fs.readFileSync(path.join(pack,"manifest.csv"),"utf8").trim().split(/\r?\n/).slice(1);
 assert.equal(rows.length,60);
 const used=new Set();
 for(const line of rows){
  const m=/^(cast|beam_body|impact),(\d+),(frames\/[^,]+),"\d+,\d+,\d+,\d+",512,512,([a-f0-9]{64}),(\d+)$/.exec(line);
  assert.ok(m,"Unexpected manifest row: "+line);
  const [_,kind,index,filename,expected]=m;
  used.add(filename);
  const b=fs.readFileSync(path.join(pack,filename));
  assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);
  assert.equal(sha(b),expected);
 }
 assert.equal(used.size,60);
 const counts={cast:20,beam_body:12,impact:12};
 const full=JSON.parse(fs.readFileSync(path.join(pack,"sprite_skill_electric_beam_sequences_full20_01.json"),"utf8")).sequences;
 for(const row of cases){
  const s=seq[row.name];
  assert.equal(s.frame_count,row.count);assert.equal(s.frame_ms,row.ms);assert.equal(s.playback_mode,row.mode);
  assert.equal(s.frames.length,row.count);assert.ok(s.frames.every(f=>used.has(f)));
  assert.equal(full[row.name].frame_count,20);assert.equal(full[row.name].frames.length,20);
 }
});
test("5 genuine WebP atlas binaries exactly match verified source provenance",()=>{
 let n=0;
 for(const [role,group] of Object.entries(pro.sequences)){
  for(const key of ["atlas_runtime","atlas_full20"]){
   const a=group[key];if(!a)continue;n++;
   const file=path.join(pack,a.file);const bytes=fs.readFileSync(file);
   assert.equal(bytes.toString("ascii",0,4),"RIFF");assert.equal(bytes.toString("ascii",8,12),"WEBP");
   assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
   assert.equal(bytes.length,a.bytes);assert.equal(sha(bytes),a.sha256);
   const expectCount=key==="atlas_runtime"?seq[role].frame_count:20;
   assert.deepEqual(a.size,[512*expectCount,512]);
  }
  assert.match(group.source_sha256,/^[a-f0-9]{64}$/);
  assert.equal(sha(fs.readFileSync(path.join(pack,group.source))),group.source_sha256);
 }
 assert.equal(n,5);
});
test("staging ZIP and temporary transfer tooling are not shipped in canonical asset branch",()=>{
 for(const p of ["rayon_electrique_jaune_01_cast.zip","rayon_electrique_jaune_02_corps.zip","rayon_electrique_jaune_03_impact.zip",".github/workflows/temp-electric-beam-yellow-import-v1.yml","scripts/import-electric-beam-yellow-v1.py"]){
  assert.equal(fs.existsSync(path.join(root,p)),false,p);
 }
});
