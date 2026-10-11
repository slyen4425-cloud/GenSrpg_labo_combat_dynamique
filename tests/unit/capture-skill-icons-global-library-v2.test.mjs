import assert from "node:assert/strict";
import test from "node:test";
import { GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";

const cases=[
  [
    "seismic-shock",
    "seismic_shock"
  ],
  [
    "energy-blossom",
    "energy_blossom"
  ],
  [
    "burning-bite",
    "burning_bite"
  ],
  [
    "healing-wave",
    "healing_wave"
  ],
  [
    "rock-impact",
    "rock_impact"
  ],
  [
    "earth-charge",
    "earth_charge"
  ],
  [
    "flame-storm",
    "flame_storm"
  ],
  [
    "pressurized-jet",
    "pressurized_jet"
  ]
];

test("Capture Skill Icons V2 refreshes the single global-assets catalog URL",()=>{
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-10-11-v24-capture-skill-icons-v2");
  const catalogUrl=new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
  assert.ok(catalogUrl.pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
  assert.equal(catalogUrl.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
});

test("Capture V2 icons use canonical assetIds and only global-assets resource paths",()=>{
  assert.equal(cases.length,8);
  for(const [idPart,filePart] of cases){
    const assetId="pack:capture:icon-skill-"+idPart+"-01";
    const file="capture/icons/skills/icon_skill_"+filePart+"_01.webp";
    assert.match(assetId,/^pack:capture:icon-skill-/);
    const url=new URL(globalVisualAssetUrl(file));
    assert.ok(url.pathname.endsWith("/global-assets/assets/library/"+file));
    assert.equal(url.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
    assert.ok(!url.pathname.includes("/work/"));
  }
});
