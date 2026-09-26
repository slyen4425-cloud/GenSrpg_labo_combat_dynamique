const REPOSITORY = "slyen4425-cloud/GenSrpg_labo_combat_dynamique";
const BRANCH = "global-assets";

export const GLOBAL_VISUAL_LIBRARY = Object.freeze({
  repository: REPOSITORY,
  branch: BRANCH,
  baseUrl:
    `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/assets/library/`,
  catalogUrl:
    `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/data/assets/catalog/global-visual-assets.v1.json`
});

export function globalVisualAssetUrl(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new TypeError("relativePath must be a non-empty string");
  }
  return new URL(relativePath, GLOBAL_VISUAL_LIBRARY.baseUrl).href;
}
