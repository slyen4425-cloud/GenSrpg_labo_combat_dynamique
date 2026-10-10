import {
  projectStatusStatEffectsV1
} from "../../core/combat/status-effect-projection-v1.js";

const POLARITY_LABELS = Object.freeze({
  beneficial: "Buff",
  detrimental: "Debuff",
  neutral: "Statut"
});

const CHANNEL_LABELS = Object.freeze({
  fire: "Feu",
  water: "Eau",
  earth: "Terre",
  air: "Air",
  electric: "Électricité",
  electricity: "Électricité",
  light: "Lumière",
  shadow: "Ombre",
  physical: "Physique",
  poison: "Poison"
});

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
}

function compactNumber(value) {
  const number = finiteNumber(value);
  const rounded = Math.round(number * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded);
}

function secondsLabel(ms) {
  const seconds =
    Math.max(0, finiteNumber(ms)) / 1000;
  const rounded =
    Math.round(seconds * 10) / 10;
  return (
    compactNumber(rounded) +
    " s"
  );
}

function humanIdentifier(value) {
  const text = String(value ?? "")
    .trim()
    .replace(/[_-]+/g, " ");
  if (!text) {
    return "Statut";
  }
  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}

function channelLabel(channel) {
  const id = String(channel ?? "").trim();
  return CHANNEL_LABELS[id] ??
    humanIdentifier(id);
}

function signedNumber(value, suffix = "") {
  const number = finiteNumber(value);
  const sign = number > 0 ? "+" : "";
  return (
    sign +
    compactNumber(number) +
    suffix
  );
}

function channelDamageLabel(channel) {
  switch (String(channel ?? "").trim()) {
    case "physical":
      return "Dégâts physiques";
    case "fire":
      return "Dégâts de Feu";
    case "water":
      return "Dégâts d’Eau";
    case "earth":
      return "Dégâts de Terre";
    case "air":
      return "Dégâts d’Air";
    case "electric":
    case "electricity":
      return "Dégâts électriques";
    case "light":
      return "Dégâts de Lumière";
    case "shadow":
      return "Dégâts d’Ombre";
    case "poison":
      return "Dégâts de Poison";
    default:
      return "Dégâts " + channelLabel(channel);
  }
}

function channelResistanceLabel(channel) {
  switch (String(channel ?? "").trim()) {
    case "physical":
      return "Résistance physique";
    case "fire":
      return "Résistance au Feu";
    case "water":
      return "Résistance à l’Eau";
    case "earth":
      return "Résistance à la Terre";
    case "air":
      return "Résistance à l’Air";
    case "electric":
    case "electricity":
      return "Résistance à l’Électricité";
    case "light":
      return "Résistance à la Lumière";
    case "shadow":
      return "Résistance à l’Ombre";
    case "poison":
      return "Résistance au Poison";
    default:
      return "Résistance " + channelLabel(channel);
  }
}

function variationLine(label, value, {
  positiveWord = "augmentés",
  negativeWord = "réduits"
} = {}) {
  const number = finiteNumber(value);
  if (number === 0) {
    return null;
  }
  return (
    label +
    " " +
    (number > 0 ? positiveWord : negativeWord) +
    " de " +
    compactNumber(Math.abs(number)) +
    " %"
  );
}

function semanticStatModifierLines({
  definition,
  instance,
  fighter,
  elapsedMs
}) {
  const statId = String(definition.statId ?? "").trim();
  if (
    !fighter ||
    typeof fighter !== "object" ||
    !statId ||
    !fighter.statEffectRulesById?.[statId]
  ) {
    return null;
  }

  const effects = projectStatusStatEffectsV1({
    fighter: {
      ...fighter,
      statusEffects: [instance]
    },
    atMs: elapsedMs
  });
  const lines = [];

  for (
    const [channel, value] of
    Object.entries(effects.damagePctByChannel)
  ) {
    const line = variationLine(
      channelDamageLabel(channel),
      value
    );
    if (line) {
      lines.push(line);
    }
  }

  for (
    const [channel, value] of
    Object.entries(effects.resistancePctByChannel)
  ) {
    const line = variationLine(
      channelResistanceLabel(channel),
      value,
      {
        positiveWord: "augmentée",
        negativeWord: "réduite"
      }
    );
    if (line) {
      lines.push(line);
    }
  }

  if (effects.chargeTimeReductionPct !== 0) {
    lines.push(
      variationLine(
        "Temps de préparation",
        effects.chargeTimeReductionPct,
        {
          positiveWord: "réduit",
          negativeWord: "augmenté"
        }
      )
    );
  }

  if (effects.damageReductionPct !== 0) {
    lines.push(
      variationLine(
        "Dégâts reçus",
        effects.damageReductionPct,
        {
          positiveWord: "réduits",
          negativeWord: "augmentés"
        }
      )
    );
  }

  return Object.freeze(lines);
}

function effectLinesFor(
  definition,
  instance,
  fighter,
  elapsedMs
) {
  switch (definition.kind) {
    case "approach_time_modifier":
      return Object.freeze([
        variationLine("Temps de trajet de la créature", definition.modifierPct * instance.stacks,
          { positiveWord: "augmenté", negativeWord: "réduit" }) ?? "Temps de trajet inchangé"
      ]);
    case "damage_over_time":
      return Object.freeze([
        compactNumber(definition.amount) +
          " dégâts " +
          channelLabel(definition.channel) +
          " toutes les " +
          secondsLabel(definition.tickIntervalMs)
      ]);

    case "heal_over_time":
      return Object.freeze([
        compactNumber(definition.amount) +
          " PV toutes les " +
          secondsLabel(definition.tickIntervalMs)
      ]);

    case "stat_modifier": {
      const semanticLines =
        semanticStatModifierLines({
          definition,
          instance,
          fighter,
          elapsedMs
        });
      if (
        semanticLines &&
        semanticLines.length > 0
      ) {
        return semanticLines;
      }

      const stat =
        humanIdentifier(definition.statId);
      if (definition.modifierMode === "percent") {
        return Object.freeze([
          stat +
            " " +
            signedNumber(
              definition.percent,
              " %"
            )
        ]);
      }
      return Object.freeze([
        stat +
          " " +
          signedNumber(
            definition.deltaPoints,
            " pt"
          )
      ]);
    }

    case "damage_reflection":
      return Object.freeze([
        compactNumber(definition.percent * instance.stacks) +
          " % des dégâts subis renvoyés à l’attaquant"
      ]);

    case "shield":
      return Object.freeze([
        "Bouclier : " +
          compactNumber(
            instance.shieldRemaining ??
              definition.amount *
                Math.max(
                  1,
                  finiteNumber(instance.stacks, 1)
                )
          )
      ]);

    case "immobilize":
      return Object.freeze([
        "Impossible de se déplacer"
      ]);

    case "silence":
      return Object.freeze([
        "Impossible d’utiliser des capacités"
      ]);

    case "stun":
      return Object.freeze([
        "Impossible d’agir"
      ]);

    case "taunt":
      return Object.freeze([
        "Cible offensive imposée par la source"
      ]);

    default:
      return Object.freeze([]);
  }
}

function remainingLabelFor(
  definition,
  instance,
  elapsedMs
) {
  if (
    definition.durationModel ===
    "owner_action_end"
  ) {
    const actions = Math.max(
      0,
      finiteNumber(
        instance.remainingActionEnds
      )
    );
    return (
      compactNumber(actions) +
      (actions > 1 ? " actions" : " action")
    );
  }

  const remaining =
    finiteNumber(instance.expiresAtMs) -
    finiteNumber(elapsedMs);
  return secondsLabel(remaining);
}

export function projectStatusEffectInfoV1({
  instance,
  elapsedMs = 0,
  sourceSkill = null,
  fighter = null
}) {
  if (
    !instance ||
    typeof instance !== "object" ||
    !instance.definition ||
    typeof instance.definition !== "object"
  ) {
    throw new TypeError(
      "instance must be an active StatusEffectRuntimeInstanceV1"
    );
  }

  const definition = instance.definition;
  const statusId = String(
    definition.id ?? ""
  ).trim();
  if (!statusId) {
    throw new TypeError(
      "instance.definition.id must be a non-empty string"
    );
  }

  const sourceSkillId =
    typeof instance.sourceSkillId === "string" &&
    instance.sourceSkillId.trim() !== ""
      ? instance.sourceSkillId.trim()
      : null;

  const sourceSkillName =
    typeof sourceSkill?.name === "string" &&
    sourceSkill.name.trim() !== ""
      ? sourceSkill.name.trim()
      : sourceSkillId;

  const stacks = Math.max(
    1,
    Math.floor(
      finiteNumber(instance.stacks, 1)
    )
  );
  const maxStacks = Math.max(
    1,
    Math.floor(
      finiteNumber(definition.maxStacks, 1)
    )
  );

  return Object.freeze({
    statusId,
    statusName: humanIdentifier(statusId),
    sourceSkillId,
    sourceSkillName,
    typeLabel:
      POLARITY_LABELS[definition.polarity] ??
      "Statut",
    remainingLabel: remainingLabelFor(
      definition,
      instance,
      elapsedMs
    ),
    stacksLabel:
      maxStacks > 1 || stacks > 1
        ? stacks + " / " + maxStacks
        : null,
    effectLines: effectLinesFor(
      definition,
      instance,
      fighter,
      elapsedMs
    )
  });
}

export function statusEffectInfoTextV1(info) {
  if (!info || typeof info !== "object") {
    throw new TypeError(
      "info must be a projected status info object"
    );
  }

  const lines = [
    "Statut : " + info.statusName,
    info.typeLabel
  ];

  if (info.sourceSkillName) {
    lines.push(
      "Origine : " + info.sourceSkillName
    );
  }
  if (info.remainingLabel) {
    lines.push(
      "Durée : " + info.remainingLabel
    );
  }
  if (info.stacksLabel) {
    lines.push(
      "Stacks : " + info.stacksLabel
    );
  }

  lines.push(...(info.effectLines ?? []));
  return lines.join("\n");
}
