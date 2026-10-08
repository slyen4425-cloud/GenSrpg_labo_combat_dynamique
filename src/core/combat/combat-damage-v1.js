import {
  projectStatusStatEffectsV1
} from "./status-effect-projection-v1.js";

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

  const damageBonusPct =
    (
      Number(
        attacker.damagePctByChannel?.[
          damageChannel
        ] ?? 0
      ) || 0
    ) +
    (
      Number(
        attackerStatus.damagePctByChannel?.[
          damageChannel
        ] ?? 0
      ) || 0
    );
  const resistancePct =
    (
      Number(
        target.resistancePctByChannel?.[
          damageChannel
        ] ?? 0
      ) || 0
    ) +
    (
      Number(
        targetStatus.resistancePctByChannel?.[
          damageChannel
        ] ?? 0
      ) || 0
    );

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
        )
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
    Math.max(0, 1 + damageBonusPct / 100);
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
    resistancePct,
    damageReductionPct,
    damage
  });
}
