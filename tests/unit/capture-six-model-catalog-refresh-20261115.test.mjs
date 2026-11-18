import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
test("one canonical global-assets owner uses fresh cache revision for six author creature sprites and five Veldra plus five Ephemus skill media",()=>{
 const src=readFileSync(new URL("../../src/assets/global-visual-library.js",import.meta.url),"utf8");
 assert.match(src,/2026-11-18-v67-veldra-five-skill-media/);
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-11-18-v67-veldra-five-skill-media");
 assert.match(GLOBAL_VISUAL_LIBRARY.catalogUrl,/global-visual-assets\.v1\.json\?v=2026-11-18-v67-veldra-five-skill-media$/);
 const sprite=globalVisualAssetUrl("capture/creatures/vipfer/runtime/vipfer_face.png");
 assert.ok(sprite.endsWith("?v=2026-11-18-v67-veldra-five-skill-media"));
 assert.ok(sprite.includes("/global-assets/assets/library/"));
 const ephemusIcon=globalVisualAssetUrl("capture/icons/skills/ephemus/ephemus-poussiere-oubli.webp");
 assert.ok(ephemusIcon.includes("/global-assets/assets/library/capture/icons/skills/ephemus/"));
 assert.ok(ephemusIcon.endsWith("?v="+GLOBAL_VISUAL_LIBRARY.revision));
 assert.doesNotMatch(src,/Zombicide-40k|gh-pages/);
});
