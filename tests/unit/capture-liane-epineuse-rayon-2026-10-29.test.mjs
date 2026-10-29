import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const base=resolve(root,"assets/library/capture/sprites/skills/liane_epineuse_rayon");
const catalog=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
const hash=data=>createHash("sha256").update(data).digest("hex");
const id="pack:capture:sprite-liane-epineuse-rayon-01";
const roleFile="capture/sprites/skills/liane_epineuse_rayon/liane_epineuse_rayon_atlas_12f.webp";

test("Real author-approved 12-frame thorn-vine beam extension and target wrap are in the one catalog",()=>{
 assert.equal(catalog.storage.branch,"global-assets");
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==="sprite").length);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 const assets=catalog.assets.filter(a=>a.id===id);
 assert.equal(assets.length,1,"One authoritative entry only");
 const asset=assets[0];
 assert.equal(asset.category,"travel","Beam body uses same category as other beam-travel visuals");
 assert.equal(asset.assetType,"sprite");
 assert.equal(asset.mediaType,"image");
 assert.ok(asset.tags.includes("beam"));
 assert.ok(asset.tags.includes("nature"));
 assert.ok(["editor","combat","capture"].every(x=>asset.compatibility.uses.includes(x)));
 assert.equal(asset.resource.file,roleFile);
 assert.deepEqual([asset.resource.frameCount,asset.resource.frameMs,asset.resource.playbackMode],[12,150,"once"]);
 const sequence=JSON.parse(readFileSync(resolve(base,"sprite_skill_liane_epineuse_rayon_sequence_01.json"),"utf8"));
 const manifest=JSON.parse(readFileSync(resolve(base,"manifest.json"),"utf8"));
 const provenance=JSON.parse(readFileSync(resolve(base,"provenance.json"),"utf8"));
 assert.equal(manifest.assetId,id);
 assert.equal(manifest.intendedEditorVisualRole,"beam");
 assert.equal(sequence.id,id);
 assert.equal(sequence.role,"beam");
 assert.equal(sequence.playback_mode,"once");
 assert.equal(sequence.frame_count,12);
 assert.deepEqual(sequence.frame_durations_ms,[150,150,150,150,150,150,150,190,190,190,190,650]);
 assert.deepEqual(sequence.phases,{extensionFrames:[1,7],wrapFrames:[8,12]});
 assert.equal(sequence.visualIntent.origin,"caster");
 assert.equal(sequence.visualIntent.target,"opponent");
 assert.equal(sequence.visualIntent.stretchesBetweenActors,true);
 assert.equal(sequence.visualIntent.end,"thorny vine coils around target");
 assert.equal(provenance.sourceArchiveSha256,"59e6ad68defadd3ef9d187665fb345aeb8c11ddeebc24d34124e539677aabec3");
 assert.equal(provenance.sourceGitBlobSha,"f45b36716e92ff779383f91eee10d34c60e96378");
 assert.equal(provenance.sourceArchiveBytes,5636465);
 const atlas=readFileSync(resolve(root,catalog.storage.libraryRoot,asset.resource.file));
 assert.equal(atlas.toString("ascii",0,4),"RIFF");
 assert.equal(atlas.toString("ascii",8,12),"WEBP");
 assert.equal(hash(atlas),provenance.sourceFileSha256[sequence.atlas.file]);
 assert.equal(sequence.frames.length,12);
 const distinct=new Set();
 for(let n=1;n<=12;n++){
   const file="frames/liane_epineuse_rayon_"+String(n).padStart(2,"0")+".webp";
   assert.equal(sequence.frames[n-1],file);
   assert.equal(manifest.frames[n-1],file);
   const content=readFileSync(resolve(base,file));
   assert.equal(content.toString("ascii",0,4),"RIFF");
   assert.equal(content.toString("ascii",8,12),"WEBP");
   assert.equal(hash(content),provenance.sourceFileSha256[file]);
   distinct.add(hash(content));
 }
 assert.equal(distinct.size,12);
 assert.equal(sequence.atlas.file,"liane_epineuse_rayon_atlas_12f.webp");
 assert.deepEqual([sequence.atlas.frameWidth,sequence.atlas.frameHeight,sequence.atlas.frameCount],[512,512,12]);
 assert.equal(sequence.preview,"preview_liane_epineuse_rayon_12f.webp");
 for(const f of ["preview_liane_epineuse_rayon_12f.webp","planche_liane_epineuse_12f.png","apercu_12_etapes_fond_sombre.png","source/sprite_sheet_d_attaque_de_liane_magique.png"]){
   assert.ok(existsSync(resolve(base,f)),f);
   assert.equal(hash(readFileSync(resolve(base,f))),provenance.sourceFileSha256[f]);
 }
});
