import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const read=path=>readFile(new URL("../../"+path,import.meta.url));
const iconId="pack:capture:creature-cheval-de-feu-icon-v1";
const horseDir="assets/library/capture/creatures/cheval-de-feu/";
const sourceUpload="assets/library/capture/creatures/file_00000000519c8210be0a8e0b97e62743.png";

test("Cheval de feu: auteur icone PNG intacte, sept médias canoniques et catalogue cohérent",async()=>{
 const [json,rawMeta,icon,uploaded]=await Promise.all([
  read("data/assets/catalog/global-visual-assets.v1.json"),
  read(horseDir+"cheval-de-feu.meta.json"),
  read(horseDir+"runtime/icone.png"),
  read(sourceUpload)
 ]);
 const catalog=JSON.parse(json.toString("utf8"));
 const meta=JSON.parse(rawMeta.toString("utf8"));
 assert.equal(catalog.counts.assets,553);
 assert.equal(catalog.counts.portraits,26);
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
 assert.equal(Buffer.compare(icon,uploaded),0,"le portrait auteur ne doit pas être modifié");
 assert.equal(icon.subarray(0,8).toString("hex"),"89504e470d0a1a0a","le portrait doit être un PNG réel");
 assert.equal(icon.readUInt32BE(16),icon.readUInt32BE(20),"portrait carré");
 assert.ok(icon.readUInt32BE(16)>=512,"portrait HD");
 assert.ok([4,6].includes(icon[25]),"PNG avec canal alpha");
 const gitSha=createHash("sha1").update(Buffer.concat([Buffer.from("blob "+icon.length),Buffer.from([0]),icon])).digest("hex");
 assert.equal(gitSha,"a76e43987492997185a96b0e06aae8de21c3d757");
 const found=catalog.assets.filter(x=>x.id===iconId);
 assert.equal(found.length,1);
 assert.equal(found[0].resource.file,"capture/creatures/cheval-de-feu/runtime/icone.png");
 assert.equal(found[0].resource.mime,"image/png");
 assert.equal(found[0].assetType,"portrait");
 assert.equal(meta.assetIds.icon,iconId);
 const expected={
  opponent:"pack:capture:creature-cheval-de-feu-opponent-v1",
  player:"pack:capture:creature-cheval-de-feu-player-v1",
  movementOpponent:"pack:capture:creature-cheval-de-feu-movement-opponent-6-v1",
  attackOpponent:"pack:capture:creature-cheval-de-feu-attack-opponent-5-v1",
  movementPlayer:"pack:capture:creature-cheval-de-feu-movement-player-7-v1",
  attackPlayer:"pack:capture:creature-cheval-de-feu-attack-player-5-v1"
 };
 for(const [view,id] of Object.entries(expected)){
  assert.equal(meta.assetIds[view],id);
  assert.equal(catalog.assets.filter(x=>x.id===id).length,1);
 }
});
