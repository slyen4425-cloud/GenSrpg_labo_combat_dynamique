const AUDIO_ROOT = new URL(
  "../../assets/runtime/audio-test/",
  import.meta.url
);

const PREVIEW_AUDIO_FILES = Object.freeze({
  "gensrpg:sound:effect-135ee2ed": "fire_cast.mp3",
  "gensrpg:sound:effect-df32b429": "melee_impact.mp3",
  "gensrpg:sound:effect-0221d6ed": "teleport.mp3"
});

export function privateAudioPreviewAssetV1(assetId) {
  if (typeof assetId !== "string" || assetId.trim() === "") {
    return null;
  }

  const normalizedId = assetId.trim();
  const filename = PREVIEW_AUDIO_FILES[normalizedId];

  if (!filename) {
    return null;
  }

  return Object.freeze({
    assetId: normalizedId,
    url: new URL(filename, AUDIO_ROOT).href
  });
}

export const PRIVATE_AUDIO_PREVIEW_ASSET_IDS_V1 =
  Object.freeze(Object.keys(PREVIEW_AUDIO_FILES));
