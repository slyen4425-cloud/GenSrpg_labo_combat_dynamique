import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const root = new URL("../../", import.meta.url);
const path = name => new URL(name, root);
const read = name => readFileSync(path(name));
const json = name => JSON.parse(read(name).toString("utf8"));
const hashes = b => createHash("sha256").update(b).digest("hex");
test("18 approved UI icons: unique genuine transparent media, IDs and registry mapping", () => {
  const prov=json("assets/library/core/icons/ui/ui_icons_2026_11_09.provenance.json");
  const catalog=json("data/assets/catalog/global-visual-assets.v1.json");
  assert.equal(prov.owner,"global-assets");
  assert.equal(prov.assets.length,18);
  assert.equal(new Set(prov.assets.map(a=>a.assetId)).size,18);
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(catalog.counts.icons,catalog.assets.filter(a=>a.assetType==="icon").length);
  assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
  // This media branch does not own the gameplay stat registry on main.
  // Assert only approved, author-mapped stat IDs, without copying the registry.
  const statIds=new Set("health speed physical defense fire water earth air electric light shadow poison acier nature esprit glace".split(" "));
  const existingPaths=new Set();
  for(const item of prov.assets){
    assert.ok(item.type==="symbol" || statIds.has(item.registryStatId), item.assetId);
    const match=catalog.assets.filter(a=>a.id===item.assetId);
    assert.equal(match.length,1,item.assetId);
    const entry=match[0];
    assert.equal(entry.assetType,"icon");
    assert.equal(entry.category,"ui");
    assert.ok(item.runtime.startsWith("assets/library/"));
    assert.equal(entry.resource.file,item.runtime.slice("assets/library/".length));
    assert.ok(!existingPaths.has(entry.resource.file));
    existingPaths.add(entry.resource.file);
    const webp=read(item.runtime);
    const png=read(item.master);
    assert.equal(hashes(webp),item.sha256Runtime);
    assert.equal(webp.toString("ascii",0,4),"RIFF");
    assert.equal(webp.toString("ascii",8,16),"WEBPVP8L");
    assert.equal(webp[20],0x2f);
    assert.equal(1+webp[21]+((webp[22]&0x3f)<<8),128);
    assert.equal(1+(webp[22]>>6)+(webp[23]<<2)+((webp[24]&0xf)<<10),128);
    assert.equal(png.toString("hex",0,8),"89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16),256);
    assert.equal(png.readUInt32BE(20),256);
  }
  assert.equal(prov.assets.filter(a=>a.type==="symbol").length,2);
  assert.equal(prov.assets.filter(a=>a.type!=="symbol").length,16);
});
