// One creature owns one defensive reaction; the Combat Session owns its clock
// and charge consumption. This contract never selects a visual asset.
export const CAPTURE_CREATURE_DEFENSIVE_REACTION_TYPES_V1 =
  Object.freeze(["none", "dodge", "defense"]);

export const CAPTURE_CREATURE_DEFENSIVE_REACTION_DEFAULT_V1 =
  Object.freeze({
    type: "dodge",
    maxCharges: 2,
    rechargeMs: 30000,
    activeWindowMs: 250,
    damageReductionPct: 50
  });

export function normalizeCaptureCreatureDefensiveReactionV1(raw) {
  if (raw === null || raw === undefined) return null;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError("creature.combat.reaction must be an object");
  }
  const allowed = new Set([
    "type", "maxCharges", "rechargeMs",
    "activeWindowMs", "damageReductionPct", "iconAssetId"
  ]);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      throw new TypeError("creature.combat.reaction contains unknown field: " + key);
    }
  }
  if (!CAPTURE_CREATURE_DEFENSIVE_REACTION_TYPES_V1.includes(raw.type)) {
    throw new RangeError("Unknown creature defensive reaction type: " + raw.type);
  }
  const defaults = CAPTURE_CREATURE_DEFENSIVE_REACTION_DEFAULT_V1;
  const maxCharges = Number(raw.maxCharges ?? defaults.maxCharges);
  const rechargeMs = Number(raw.rechargeMs ?? defaults.rechargeMs);
  const activeWindowMs = Number(raw.activeWindowMs ?? defaults.activeWindowMs);
  const damageReductionPct = Number(raw.damageReductionPct ?? defaults.damageReductionPct);
  if (!Number.isInteger(maxCharges) || maxCharges < 1) {
    throw new RangeError("creature reaction maxCharges must be a positive integer");
  }
  if (!Number.isFinite(rechargeMs) || rechargeMs < 0) {
    throw new RangeError("creature reaction rechargeMs must be non-negative");
  }
  if (!Number.isFinite(activeWindowMs) || activeWindowMs <= 0) {
    throw new RangeError("creature reaction activeWindowMs must be positive");
  }
  if (!Number.isFinite(damageReductionPct) ||
      damageReductionPct < 0 || damageReductionPct > 100) {
    throw new RangeError("creature reaction damageReductionPct must be within 0..100");
  }
  const iconAssetId = raw.iconAssetId ?? null;
  if (iconAssetId !== null && (typeof iconAssetId !== "string" || !/^[A-Za-z0-9._-]+(?::[A-Za-z0-9._-]+)+$/.test(iconAssetId.trim()))) {
    throw new TypeError("creature reaction iconAssetId must be a stable asset ID");
  }
  return Object.freeze({
    ...(iconAssetId === null ? {} : { iconAssetId: iconAssetId.trim() }),
    type: raw.type,
    maxCharges,
    rechargeMs,
    activeWindowMs,
    damageReductionPct
  });
}

export function captureCreatureReactionActionIdV1(creatureId, type) {
  const id = String(creatureId ?? "").trim();
  if (!id) throw new TypeError("creatureId is required for defensive action");
  if (type !== "dodge" && type !== "defense") {
    throw new RangeError("only dodge or defense has a rechargeable action");
  }
  return "capture-game-" + type + ":" + id;
}
