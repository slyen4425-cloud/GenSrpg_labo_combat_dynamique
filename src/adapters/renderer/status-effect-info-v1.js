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

function effectLinesFor(definition, instance) {
  switch (definition.kind) {
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
  sourceSkill = null
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
      instance
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
