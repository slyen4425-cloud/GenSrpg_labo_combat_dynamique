import test from "node:test";
import assert from "node:assert/strict";
import {GLOBAL_VISUAL_LIBRARY} from "../../src/assets/global-visual-library.js";
import {captureEditorCreatureVisualKindV1,captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";

const lumilo={
  id:"pack:capture:creature-renard-magique-dore-movement-player-12-v1",
  label:"Renard magique doré (Lumilo) — attaque joueur / dos, vol ondulant (12 frames)",
  mediaType:"image",assetType:"sprite",category:"creature",
  tags:["capture","creature","renard-magique-dore","light","attack","animated","player","dos"],
  resource:{file:"capture/creatures/renard_magique_dore/animations/movement/player/atlases/renard_magique_dore_mouvement_joueur_12f.webp",format:"sprite-strip",frameCount:12,frameMs:120,playbackMode:"loop"},
  compatibility:{uses:["combat","capture","editor"]}
};
test("RED: editor client requires fresh catalog revision to expose Lumilo player attack",()=>{
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v([0-9]+)-/)?.[1]||0)>=56,"Older assets require a canonical catalog revision v56+");
  assert.equal(captureEditorCreatureVisualKindV1(lumilo),"attack");
  assert.equal(captureEditorAssetMatchesRoleV1(lumilo,"attack"),true);
  assert.equal(captureEditorAssetMatchesRoleV1(lumilo,"movement"),false);
  assert.ok(lumilo.tags.includes("player")&&!lumilo.tags.includes("opponent"));
  assert.ok(GLOBAL_VISUAL_LIBRARY.catalogUrl.endsWith("?v="+GLOBAL_VISUAL_LIBRARY.revision));
});
