const REPOSITORY = "slyen4425-cloud/GenSrpg_labo_combat_dynamique";
const BRANCH = "global-assets";
const REVISION = "2026-10-05-v13-fireball-2-projectile-alpha-clean-v1";

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
