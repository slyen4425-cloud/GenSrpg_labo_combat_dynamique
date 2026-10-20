import { rechargeableActionWindowStatusV1 } from "./rechargeable-action-v1.js";
import { captureCreatureReactionActionIdV1 } from "../../contracts/capture-creature-defensive-reaction-v1.js";
import {
  projectStatusStatEffectsV1
} from "./status-effect-projection-v1.js";

// Sole Combat Rules resolver for equivalent native element labels and IDs.
// Historical authored channels are not migrated or rewritten. Unknown custom
// channel names remain distinct to avoid merging unrelated user-created types.
const NATIVE_ELEMENT_CHANNEL_ALIASES_V1 = Object.freeze({
  physique: "physical",
  physical: "physical",
  feu: "fire",
  fire: "fire",
  eau: "water",
  water: "water",
  terre: "earth",
  earth: "earth",
  air: "air",
  electricite: "electric",
  electric: "electric",
  lumiere: "light",
  light: "light",
  ombre: "shadow",
  shadow: "shadow",
  nature: "nature",
  glace: "ice",
  ice: "ice",
  poison: "poison",
  acier: "steel",
  steel: "steel",
  psy: "psy",
  esprit: "spirit",
  spirit: "spirit"
});

export function canonicalCombatDamageChannelV1(value) {
  const original = typeof value === "string" && value.trim()
    ? value.trim()
    : "physical";
  const normalized = original.toLocaleLowerCase("fr")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return NATIVE_ELEMENT_CHANNEL_ALIASES_V1[normalized] ?? original;
}

// Aggregate all contributions to one semantic element. In historical data
// natural steel resistance is 'steel' while the author's Acier stat is
// 'acier'; reading only one would silently discard either contribution.
function channelPercentV1(percents, canonicalChannel) {
  let total = 0;
  for (const [channel, percentage] of Object.entries(percents ?? {})) {
    if (canonicalCombatDamageChannelV1(channel) === canonicalChannel) {
      total += Number(percentage) || 0;
    }
  }
  return total;
}

function fighterOf(state, fighterId) {
  const fighter = state?.fighters?.[fighterId];
  if (!fighter) {
    throw new RangeError(
      "Unknown fighter: " + fighterId
    );
  }
  return fighter;
}

export function computeCombatDamageV1({
  state,
  attackerId,
  targetId,
  baseDamage,
  channel = "physical",
  ignoreResistancePct = 0,
  ignoreDamageReductionPct = 0,
  atMs = state.elapsedMs
}) {
  const attacker = fighterOf(state, attackerId);
  const target = fighterOf(state, targetId);
  const amount = Math.max(
    0,
    Number(baseDamage) || 0
  );
  const damageChannel =
    typeof channel === "string" &&
    channel.trim() !== ""
      ? channel.trim()
      : "physical";
  const attackerStatus =
    projectStatusStatEffectsV1({
      fighter: attacker,
      atMs
    });
  const targetStatus =
    projectStatusStatEffectsV1({
      fighter: target,
      atMs
    });

  const canonicalChannel = canonicalCombatDamageChannelV1(damageChannel);
  const damageBonusPct =
    channelPercentV1(attacker.damagePctByChannel, canonicalChannel) +
    channelPercentV1(attackerStatus.damagePctByChannel, canonicalChannel);
  const outgoingDamagePct =
    (Number(attacker.outgoingDamagePct ?? 0) || 0) +
    (Number(attackerStatus.outgoingDamagePct ?? 0) || 0);
  const resistancePct =
    channelPercentV1(target.resistancePctByChannel, canonicalChannel) +
    channelPercentV1(targetStatus.resistancePctByChannel, canonicalChannel);

  // A guard is an active, charged, per-creature reaction. Read the same
  // combat-clock history as Dodge, with no UI or alternate damage owner.
  const guard = target.defensiveReaction;
  const guarded = guard?.type === "defense" &&
    rechargeableActionWindowStatusV1({
      state,
      actorId: targetId,
      actionId: captureCreatureReactionActionIdV1(
        target.defensiveCreatureId ?? targetId, "defense"
      ),
      activeWindowMs: guard.activeWindowMs,
      atMs
    }).active;
  const damageReductionPct =
    Math.max(
      0,
      Math.min(
        100,
        (
          Number(
            target.damageReductionPct ?? 0
          ) || 0
        ) +
        (
          Number(
            targetStatus.damageReductionPct ?? 0
          ) || 0
        ) +
        (guarded ? guard.damageReductionPct : 0)
      )
    );

  // Penetration affects only the current damage event, never a fighter's
  // resistance/status state. Negative resistance is a vulnerability, not
  // protection, and must remain a vulnerability even at 100% penetration.
  const effectiveResistancePct =
    resistancePct > 0
      ? resistancePct *
        (1 - ignoreResistancePct / 100)
      : resistancePct;
  const effectiveDamageReductionPct =
    damageReductionPct *
    (1 - ignoreDamageReductionPct / 100);

  const boosted =
    amount *
    Math.max(0, 1 + damageBonusPct / 100) *
    Math.max(0, 1 + outgoingDamagePct / 100);
  const rawDamage =
    boosted *
    Math.max(0, 1 - effectiveResistancePct / 100) *
    Math.max(
      0,
      1 - effectiveDamageReductionPct / 100
    );
  const damage =
    Math.round(rawDamage * 100) / 100;

  return Object.freeze({
    baseDamage: amount,
    damageChannel,
    damageBonusPct,
    outgoingDamagePct,
    resistancePct,
    damageReductionPct,
    damage
  });
}
