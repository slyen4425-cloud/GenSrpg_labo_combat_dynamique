import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";
// Four real 128x128 RGB WebP verified in canonical global-assets at a989443b9985b3f444f5ea3b4c26f9c215ae04e4.
const publishedIcons = [
  {
    "id": "pack:capture:icon-skill-carapace-acier-01",
    "label": "Carapace d’acier",
    "assetType": "icon",
    "category": "skill",
    "resource": {
      "file": "capture/icons/skills/icon_skill_carapace_acier_01.webp",
      "mime": "image/webp"
    }
  },
  {
    "id": "pack:capture:icon-skill-lame-acier-01",
    "label": "Lame d’acier",
    "assetType": "icon",
    "category": "skill",
    "resource": {
      "file": "capture/icons/skills/icon_skill_lame_acier_01.webp",
      "mime": "image/webp"
    }
  },
  {
    "id": "pack:capture:icon-skill-tourbillons-rouille-01",
    "label": "Tourbillons de rouille",
    "assetType": "icon",
    "category": "skill",
    "resource": {
      "file": "capture/icons/skills/icon_skill_tourbillons_rouille_01.webp",
      "mime": "image/webp"
    }
  },
  {
    "id": "pack:capture:icon-skill-aile-acier-01",
    "label": "Aile d’acier",
    "assetType": "icon",
    "category": "skill",
    "resource": {
      "file": "capture/icons/skills/icon_skill_aile_acier_01.webp",
      "mime": "image/webp"
    }
  }
];

test("steel skill icon library: all four canonical assets resolve via editor without author skill mutation",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-10-20-v37-four-steel-skill-icons");
 const catalogUrl=new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
 assert.ok(catalogUrl.pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
 assert.equal(catalogUrl.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 assert.equal(publishedIcons.length,4);
 assert.equal(new Set(publishedIcons.map(x=>x.id)).size,4);
 const resolveAsset=createGlobalPresentationAssetResolverV1({assetCatalog:{assets:publishedIcons},assetUrlForFile:globalVisualAssetUrl});
 for(const a of publishedIcons){
  assert.equal(a.assetType,"icon");
  assert.equal(a.category,"skill");
  assert.equal(a.resource.mime,"image/webp");
  assert.ok(a.resource.file.startsWith("capture/icons/skills/icon_skill_"));
  const resolved=resolveAsset(a.id);
  assert.ok(resolved,a.id);
  assert.equal(resolved.assetId,a.id);
  assert.equal(resolved.frameCount,1);
  const url=new URL(resolved.url);
  assert.ok(url.pathname.endsWith("/global-assets/assets/library/"+a.resource.file));
  assert.equal(url.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 }
 assert.equal(resolveAsset("pack:capture:icon-skill-nonexistent-01"),null);
});
