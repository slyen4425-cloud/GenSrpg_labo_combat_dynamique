import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root=process.cwd();
const catalog=JSON.parse(fs.readFileSync(path.join(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
const provenance=JSON.parse(fs.readFileSync(path.join(root,"assets/library/capture/icons/skills/capture_skill_icons_v2.provenance.json"),"utf8"));
const expected=[
  {
    "id": "pack:capture:icon-skill-seismic-shock-01",
    "label": "Secousse sismique",
    "file": "capture/icons/skills/icon_skill_seismic_shock_01.webp",
    "sha256": "ca5ea3439c3635dbe5d6549ac675a523dd00de8374e684092743e8d52ac2828d"
  },
  {
    "id": "pack:capture:icon-skill-energy-blossom-01",
    "label": "Fleuraison énergie",
    "file": "capture/icons/skills/icon_skill_energy_blossom_01.webp",
    "sha256": "871d878c55904f2ac9695ccf485ddb836233f96cdd904272604fdfa7d483d8bd"
  },
  {
    "id": "pack:capture:icon-skill-burning-bite-01",
    "label": "Morsure brûlante",
    "file": "capture/icons/skills/icon_skill_burning_bite_01.webp",
    "sha256": "013f36e0702c5ff574cc730645750964ca995fcc234122bd616fb36db902f421"
  },
  {
    "id": "pack:capture:icon-skill-healing-wave-01",
    "label": "Onde de soin",
    "file": "capture/icons/skills/icon_skill_healing_wave_01.webp",
    "sha256": "47daffbddfaa4240cc8bd712f6cb2a7126b3741b50e7a579cad93f6d50186960"
  },
  {
    "id": "pack:capture:icon-skill-rock-impact-01",
    "label": "Impact rocheux",
    "file": "capture/icons/skills/icon_skill_rock_impact_01.webp",
    "sha256": "91a1512c1bf22ac98b69ece7d51fbf6d63430a4264a89227e6ebe091034ecc3f"
  },
  {
    "id": "pack:capture:icon-skill-earth-charge-01",
    "label": "Charge tellurique",
    "file": "capture/icons/skills/icon_skill_earth_charge_01.webp",
    "sha256": "42369b2f23f35dae3818b7080ddfc77079b1cdff8ca8b498e2bd03c19e1d35e4"
  },
  {
    "id": "pack:capture:icon-skill-flame-storm-01",
    "label": "Tempête de flammes",
    "file": "capture/icons/skills/icon_skill_flame_storm_01.webp",
    "sha256": "017b11cbeb0c7c83bec5fdd7f94c4da47a4fd17a11efc0a2ffbf9ebf4b59d310"
  },
  {
    "id": "pack:capture:icon-skill-pressurized-jet-01",
    "label": "Jet pressurisé",
    "file": "capture/icons/skills/icon_skill_pressurized_jet_01.webp",
    "sha256": "26df67a9dcc2820d2d52f08c82fb95db27de5cb4d39b51f9d8527aebf2c539d6"
  }
];

test("Capture V2 icons remain unique, additive and selectable from canonical library",()=>{
  assert.equal(catalog.storage.branch,"global-assets");
  assert.ok(catalog.counts.assets>=130,"must retain original 130 catalogue assets while allowing additive packs");
  assert.equal(catalog.counts.icons,45);
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(catalog.counts.icons,catalog.assets.filter(x=>x.assetType==="icon").length);
  assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
  for(const entry of expected){
    const matches=catalog.assets.filter(a=>a.id===entry.id);
    assert.equal(matches.length,1,entry.id);
    const a=matches[0];
    assert.equal(a.label,entry.label);
    assert.equal(a.assetType,"icon");
    assert.equal(a.category,"skill");
    assert.equal(a.mediaType,"image");
    assert.deepEqual(a.compatibility.uses,["combat","capture","editor"]);
    assert.equal(a.resource.file,entry.file);
    assert.equal(a.resource.mime,"image/webp");
    assert.ok(!a.resource.file.includes("work/"));
    assert.deepEqual(provenance.assets.find(x=>x.id===entry.id)?.sha256,entry.sha256);
  }
  for(const id of ["pack:capture:icon-skill-blinding-ash-01","pack:capture:icon-skill-water-drop-01","pack:capture:icon-skill-marine-bite-01","pack:capture:icon-skill-earth-carapace-01","pack:capture:icon-skill-lightning-strike-01","pack:capture:icon-skill-frost-bolt-01"]){
    assert.equal(catalog.assets.filter(a=>a.id===id).length,1,id+" historical");
  }
});

test("Capture V2 icons have checked RGB WebP files, each exactly 128x128",()=>{
 for(const entry of expected){
  const p=path.join(root,"assets/library",entry.file);
  assert.ok(fs.existsSync(p),p);
  const b=fs.readFileSync(p);
  assert.ok(b.length>4096);
  assert.equal(b.toString("ascii",0,4),"RIFF");
  assert.equal(b.toString("ascii",8,12),"WEBP");
  assert.equal(b.toString("ascii",12,16),"VP8 ");
  assert.deepEqual(Array.from(b.subarray(23,26)),[0x9d,0x01,0x2a]);
  assert.equal(b.readUInt16LE(26)&0x3fff,128);
  assert.equal(b.readUInt16LE(28)&0x3fff,128);
  assert.equal(createHash("sha256").update(b).digest("hex"),entry.sha256);
 }
});
