const REPOSITORY = "slyen4425-cloud/GenSrpg_labo_combat_dynamique";
const BRANCH = "global-assets";

export const GLOBAL_VISUAL_LIBRARY = Object.freeze({
  repository: REPOSITORY,
  branch: BRANCH,
  revision: "2026-09-26-v2",
  baseUrl:
    `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/assets/library/`,
  catalogUrl:
    `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/data/assets/catalog/global-visual-assets.v1.json`
});

export function globalVisualAssetUrl(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new TypeError("relativePath must be a non-empty string");
  }
  const url = new URL(relativePath, GLOBAL_VISUAL_LIBRARY.baseUrl);
  url.searchParams.set("v", GLOBAL_VISUAL_LIBRARY.revision);
  return url.href;
}
