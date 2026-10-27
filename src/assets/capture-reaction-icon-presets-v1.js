// Presentation only: reaction gameplay remains owned by creature.combat.reaction.
export const CAPTURE_REACTION_ICON_IDS_V1 = Object.freeze({
  dodge: "pack:capture:icon-reaction-dodge-01",
  defense: "pack:capture:icon-reaction-defense-01"
});

export function captureReactionIconAssetIdV1(reaction) {
  if (!reaction || !["dodge", "defense"].includes(reaction.type)) return null;
  return reaction.iconAssetId ?? CAPTURE_REACTION_ICON_IDS_V1[reaction.type];
}
