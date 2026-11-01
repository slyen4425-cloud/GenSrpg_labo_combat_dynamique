const REPOSITORY = "slyen4425-cloud/GenSrpg_labo_combat_dynamique";
const BRANCH = "global-assets";
// Cache revision for the one canonical global-assets catalog and its image URLs.
// Delivery must wait until the authoritative branch has propagated; the REAL
// browser test now checks its metadata rather than inventing directional assets.
const REVISION = "2026-11-01-v49-approved-raw-ice-wall-12f";

export const GLOBAL_VISUAL_LIBRARY = Object.freeze({
  repository: REPOSITORY,
  branch: BRANCH,
  revision: REVISION,
  baseUrl:
    `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/assets/library/`,
  catalogUrl:
    `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/data/assets/catalog/global-visual-assets.v1.json?v=${REVISION}`
});

export function globalVisualAssetUrl(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new TypeError("relativePath must be a non-empty string");
  }
  const url = new URL(relativePath, GLOBAL_VISUAL_LIBRARY.baseUrl);
  url.searchParams.set("v", GLOBAL_VISUAL_LIBRARY.revision);
  return url.href;
}
