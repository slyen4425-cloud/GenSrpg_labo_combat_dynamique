const REPOSITORY = "slyen4425-cloud/GenSrpg_labo_combat_dynamique";
const BRANCH = "global-assets";
// Immutable published global-assets revision: media metadata and the
// six intrinsic projectile headings must match the exact GREEN media commit.
// A mutable branch URL can serve stale metadata even with a query suffix.
const REVISION = "2026-10-28-v43-projectile-native-facing";
const CATALOG_REF = "a30333bb6da73c3c452506ad7997c5642536fa38";

export const GLOBAL_VISUAL_LIBRARY = Object.freeze({
  repository: REPOSITORY,
  branch: BRANCH,
  revision: REVISION,
  baseUrl:
    `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/assets/library/`,
  catalogUrl:
    `https://raw.githubusercontent.com/${REPOSITORY}/${CATALOG_REF}/data/assets/catalog/global-visual-assets.v1.json`
});

export function globalVisualAssetUrl(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new TypeError("relativePath must be a non-empty string");
  }
  const url = new URL(relativePath, GLOBAL_VISUAL_LIBRARY.baseUrl);
  url.searchParams.set("v", GLOBAL_VISUAL_LIBRARY.revision);
  return url.href;
}
