import {
  isStatusEffectRuntimeInstanceActiveV1
} from "./status-effect-instance-v1.js";

export const COMBAT_PROTECTION_DOMAINS_V1 =
  Object.freeze([
    "damage",
    "negative_status"
  ]);

const DOMAIN_SET = new Set(
  COMBAT_PROTECTION_DOMAINS_V1
);

function fighterOf(state, fighterId) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(
      "Unknown fighter: " + fighterId
    );
  }
  return fighter;
}

export function combatProtectionForIncomingV1({
  state,
  targetActorId,
  domain,
  atMs = state.elapsedMs
}) {
  if (!DOMAIN_SET.has(domain)) {
    throw new RangeError(
      "Unsupported combat protection domain: " +
        domain
    );
  }

  const time = Number(atMs);
  if (!Number.isFinite(time) || time < 0) {
    throw new RangeError(
      "atMs must be a non-negative finite number"
    );
  }

  const protectingStatusIds =
    fighterOf(state, targetActorId)
      .statusEffects
      .filter(
        (instance) =>
          instance.definition.kind ===
            "immunity" &&
          isStatusEffectRuntimeInstanceActiveV1(
            instance,
            time
          ) &&
          instance.definition.domains.includes(
            domain
          )
      )
      .map(
        (instance) =>
          instance.definition.id
      );

  return Object.freeze({
    protected:
      protectingStatusIds.length > 0,
    domain,
    protectingStatusIds:
      Object.freeze(protectingStatusIds)
  });
}
