import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const catalog=JSON.parse(fs.readFileSync(path.join(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));

const expected=[
  {
    "id": "pack:capture:icon-skill-blinding-ash-01",
    "file": "capture/icons/skills/icon_skill_blinding_ash_01.webp"
  },
  {
    "id": "pack:capture:icon-skill-water-drop-01",
    "file": "capture/icons/skills/icon_skill_water_drop_01.webp"
  },
  {
    "id": "pack:capture:icon-skill-marine-bite-01",
    "file": "capture/icons/skills/icon_skill_marine_bite_01.webp"
  },
  {
    "id": "pack:capture:icon-skill-earth-carapace-01",
    "file": "capture/icons/skills/icon_skill_earth_carapace_01.webp"
  },
  {
    "id": "pack:capture:icon-skill-lightning-strike-01",
    "file": "capture/icons/skills/icon_skill_lightning_strike_01.webp"
  },
  {
    "id": "pack:capture:icon-skill-frost-bolt-01",
    "file": "capture/icons/skills/icon_skill_frost_bolt_01.webp"
  }
];

test("Capture skill icons V1 are additive unique catalogue assets",()=>{
  const allIds=catalog.assets.map(a=>a.id);
  assert.equal(new Set(allIds).size,allIds.length);
  for(const item of expected){
    const matches=catalog.assets.filter(a=>a.id===item.id);
    assert.equal(matches.length,1,item.id);
    const asset=matches[0];
    assert.equal(asset.assetType,"icon");
    assert.equal(asset.mediaType,"image");
    assert.equal(asset.category,"skill");
    assert.equal(asset.resource.file,item.file);
    assert.equal(asset.resource.mime,"image/webp");
    assert.deepEqual(asset.compatibility.uses,["combat","capture","editor"]);
  }
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(catalog.counts.icons,catalog.assets.filter(a=>a.assetType==="icon").length);
});

test("Capture skill icons V1 point to six valid WebP runtime files",()=>{
  for(const item of expected){
    const file=path.join(root,"assets/library",item.file);
    assert.ok(fs.existsSync(file),item.file);
    const bytes=fs.readFileSync(file);
    assert.ok(bytes.length>4096,item.file+" should not be an empty placeholder");
    assert.equal(bytes.subarray(0,4).toString("ascii"),"RIFF");
    assert.equal(bytes.subarray(8,12).toString("ascii"),"WEBP");
  }
});
