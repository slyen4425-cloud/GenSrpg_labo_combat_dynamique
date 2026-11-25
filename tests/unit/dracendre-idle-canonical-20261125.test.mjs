import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";

const root=new URL("../../",import.meta.url);
const bytes=path=>readFileSync(new URL(path,root));
const catalog=JSON.parse(bytes("data/assets/catalog/global-visual-assets.v1.json").toString("utf8"));
const expected=[
  ["opponent","face","f65b7bf068d04a7dda64748a3e12a8ae8c70f65432ccaa0ff46c31b9b8beaf46"],
  ["player","dos","164f839b07d537e84755eff03e54711694d4701a5aceaf5ff4c89b4cdf767275"]
];
test("canonical Dracendre idles are only two original transparent Rigby2D GIFs and preserve every previous asset",()=>{
 assert.equal(catalog.storage.branch,"global-assets");
 assert.equal(catalog.assets.length,catalog.counts.assets);
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
 assert.ok(catalog.counts.assets>=555);
 assert.ok(catalog.counts.sprites>=305);
 for(const [role,side,sha256] of expected){
   const id=`pack:capture:creature-braisombre-idle-${role}-gif-v1`;
   const entry=catalog.assets.find(x=>x.id===id);
   assert.ok(entry,id);
   assert.equal(entry.resource.file,`capture/creatures/braisombre/animations/idle/${role}/braisombre_idle_${side}.gif`);
   assert.equal(entry.resource.mime,"image/gif");
   assert.equal(entry.resource.format,"animated-image");
   assert.equal(entry.resource.playbackMode,"loop");
   assert.ok(entry.tags.includes("idle")&&entry.compatibility.uses.includes("editor"));
   const data=bytes("assets/library/"+entry.resource.file);
   assert.equal(data.subarray(0,6).toString("ascii"),"GIF89a");
   assert.equal(data.readUInt16LE(6),512);
   assert.equal(data.readUInt16LE(8),512);
   assert.equal(createHash("sha256").update(data).digest("hex"),sha256,
     "The original Dracendre Rigby2D frames must never be changed");
 }
 for(const id of ["pack:capture:creature-braisombre-movement-face-12-v1",
     "pack:capture:creature-braisombre-movement-dos-12-v1",
     "pack:capture:creature-braisombre-attack-face-12-v1",
     "pack:capture:creature-braisombre-attack-dos-12-v1"]){
   assert.ok(catalog.assets.some(x=>x.id===id),"retain original flight and attack "+id);
 }
});
