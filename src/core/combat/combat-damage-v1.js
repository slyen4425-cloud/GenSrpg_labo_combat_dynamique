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
  channel = "physical"
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
  const damageBonusPct =
    Number(
      attacker.damagePctByChannel?.[
        damageChannel
      ] ?? 0
    ) || 0;
  const resistancePct =
    Number(
      target.resistancePctByChannel?.[
        damageChannel
      ] ?? 0
    ) || 0;

  const boosted =
    amount *
    Math.max(0, 1 + damageBonusPct / 100);
  const rawDamage =
    boosted *
    Math.max(0, 1 - resistancePct / 100);
  const damage =
    Math.round(rawDamage * 100) / 100;

  return Object.freeze({
    baseDamage: amount,
    damageChannel,
    damageBonusPct,
    resistancePct,
    damage
  });
}
