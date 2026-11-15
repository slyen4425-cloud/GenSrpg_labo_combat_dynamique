import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
test("one canonical global-assets owner uses fresh cache revision for six author creature sprites",()=>{
 const src=readFileSync(new URL("../../src/assets/global-visual-library.js",import.meta.url),"utf8");
 assert.match(src,/2026-11-15-v65-six-author-approved-creatures/);
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-11-15-v65-six-author-approved-creatures");
 assert.match(GLOBAL_VISUAL_LIBRARY.catalogUrl,/global-visual-assets\.v1\.json\?v=2026-11-15-v65-six-author-approved-creatures$/);
 const sprite=globalVisualAssetUrl("capture/creatures/vipfer/runtime/vipfer_face.png");
 assert.ok(sprite.endsWith("?v=2026-11-15-v65-six-author-approved-creatures"));
 assert.ok(sprite.includes("/global-assets/assets/library/"));
 assert.doesNotMatch(src,/Zombicide-40k|gh-pages/);
});
