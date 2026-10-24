import {normalizeCaptureStatRegistryV1} from "../contracts/capture-stat-registry-v1.js";
import {projectCaptureStatDefinitionEffectsV1} from "../core/combat/capture-stat-effects-v1.js";

// Shared presentation formatter: the Editor and Bestiary show the exact same
// stat effects, computed by the authoritative combat stat projection.
function statEffectNumber(value) {
  const number = Number(value);
  return Number.isInteger(number)
    ? String(number)
    : String(
        Math.round(number * 100) / 100
      );
}

export function captureStatEffectSummaryV1({
  definition,
  value
}) {
  const normalized =
    normalizeCaptureStatRegistryV1({
      schema: "capture-stat-registry-v1",
      stats: [definition]
    }).stats[0];

  const points = Number(value ?? 0);
  const projected =
    projectCaptureStatDefinitionEffectsV1({
      definition: normalized,
      points
    });

  const perPoint = [];
  const current = [];

  if (normalized.damageChannel) {
    perPoint.push(
      "+" +
        statEffectNumber(
          normalized.damagePctPerPoint
        ) +
        " % dégâts " +
        normalized.label
    );
    current.push(
      "+" +
        statEffectNumber(projected.damagePct) +
        " % dégâts"
    );
  }

  if (normalized.resistanceChannel) {
    perPoint.push(
      "+" +
        statEffectNumber(
          normalized.resistancePctPerPoint
        ) +
        " % résistance " +
        normalized.label
    );
    current.push(
      "+" +
        statEffectNumber(
          projected.resistancePct
        ) +
        " % résistance"
    );
  }

  if (
    normalized.chargeTimeReductionPctPerPoint > 0
  ) {
    perPoint.push(
      "-" +
        statEffectNumber(
          normalized
            .chargeTimeReductionPctPerPoint
        ) +
        " % temps de charge"
    );
    current.push(
      "-" +
        statEffectNumber(
          projected.chargeTimeReductionPct
        ) +
        " % temps de charge"
    );
  }

  if((normalized.outgoingDamagePctPerPoint??0)>0){
    perPoint.push("+"+statEffectNumber(normalized.outgoingDamagePctPerPoint)+" % tous dégâts infligés");
    current.push("+"+statEffectNumber(projected.outgoingDamagePct)+" % tous dégâts infligés");
  }
  if (normalized.maxHpPerPoint > 0) {
    perPoint.push(
      "+" +
        statEffectNumber(
          normalized.maxHpPerPoint
        ) +
        " PV max"
    );
    current.push(
      statEffectNumber(projected.maxHp) +
        " PV max"
    );
  }

  if (
    normalized.damageReductionPctPerPoint > 0
  ) {
    perPoint.push(
      "-" +
        statEffectNumber(
          normalized.damageReductionPctPerPoint
        ) +
        " % dégâts reçus"
    );
    current.push(
      "-" +
        statEffectNumber(
          projected.damageReductionPct
        ) +
        " % dégâts reçus"
    );
  }

  if (perPoint.length === 0) {
    return "Aucun effet de combat configuré";
  }

  const pointLabel =
    points === 1 ? " point" : " points";

  return (
    "1 point = " +
    perPoint.join(" / ") +
    " · " +
    statEffectNumber(points) +
    pointLabel +
    " = " +
    current.join(" / ")
  );
}

