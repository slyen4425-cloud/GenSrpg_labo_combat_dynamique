import { normalizeSkillEffectV1 } from "./skill-effect-v1.js";

export const STATUS_EFFECT_V1_KINDS = Object.freeze([
  "stat_modifier",
  "outgoing_damage_modifier",
  "stack_counter",
  "approach_time_modifier",
  "energy_regen_modifier",
  "skill_cooldown_rate_modifier",
  "damage_over_time",
  "heal_over_time",
  "shield",
  "damage_reflection",
  "projectile_mirror",
  "auto_dodge",
  "triggered_buff",
  "immunity",
  "immobilize",
  "silence",
  "stun",
  "taunt"
]);

// Canonical event registry, shared with Human Editor and Combat Rules.
export const TRIGGERED_BUFF_EVENT_TYPES_V2 = Object.freeze([
  "damage_dealt", "damage_taken", "movement", "evaded"
]);

export const STATUS_EFFECT_V1_POLARITIES = Object.freeze([
  "beneficial",
  "detrimental",
  "neutral"
]);

export const STATUS_EFFECT_V1_STACKING = Object.freeze([
  "replace",
  "refresh",
  "stack"
]);

export const STATUS_EFFECT_V1_DURATION_MODELS =
  Object.freeze([
    "time_ms",
    "owner_action_end",
    "until_damage",
    "permanent"
  ]);

export const STATUS_EFFECT_V1_STAT_MODIFIER_MODES =
  Object.freeze([
    "points",
    "percent"
  ]);

export const STATUS_EFFECT_V1_DAMAGE_MODES =
  Object.freeze([
    "combat",
    "fixed"
  ]);

export const STATUS_EFFECT_V1_IMMUNITY_DOMAINS =
  Object.freeze([
    "damage",
    "negative_status"
  ]);

const KIND_SET = new Set(STATUS_EFFECT_V1_KINDS);
const POLARITY_SET = new Set(
  STATUS_EFFECT_V1_POLARITIES
);
const STACKING_SET = new Set(
  STATUS_EFFECT_V1_STACKING
);
const DURATION_MODEL_SET = new Set(
  STATUS_EFFECT_V1_DURATION_MODELS
);
const STAT_MODIFIER_MODE_SET = new Set(
  STATUS_EFFECT_V1_STAT_MODIFIER_MODES
);
const DAMAGE_MODE_SET = new Set(
  STATUS_EFFECT_V1_DAMAGE_MODES
);
export const DAMAGE_REFLECTION_INCOMING_KINDS_V1 = Object.freeze([
  "contact", "projectile", "beam", "area", "zone", "dot", "scheduled", "other"
]);
const DAMAGE_REFLECTION_INCOMING_KIND_SET = new Set(DAMAGE_REFLECTION_INCOMING_KINDS_V1);
const IMMUNITY_DOMAIN_SET = new Set(
  STATUS_EFFECT_V1_IMMUNITY_DOMAINS
);

const COMMON_FIELDS = new Set([
  "id",
  "label",
  "kind",
  "polarity",
  "durationModel",
  "durationMs",
  "durationActions",
  "stacking",
  "maxStacks",
  "tags",
  "onStackThreshold",
  "onStackAdded",
  "periodic"
]);

const FIELDS_BY_KIND = Object.freeze({
  stack_counter: COMMON_FIELDS,
  approach_time_modifier: new Set([
    ...COMMON_FIELDS,
    "modifierPct"
  ]),
  energy_regen_modifier: new Set([
    ...COMMON_FIELDS,
    "modifierPct"
  ]),
  skill_cooldown_rate_modifier: new Set([
    ...COMMON_FIELDS,
    "modifierPct"
  ]),
  outgoing_damage_modifier: new Set([...COMMON_FIELDS,"modifierPct"]),
  stat_modifier: new Set([
    ...COMMON_FIELDS,
    "statId",
    "modifierMode",
    "deltaPoints",
    "percent",
    "activationCondition"
  ]),
  damage_over_time: new Set([
    ...COMMON_FIELDS,
    "amount",
    "channel",
    "tickIntervalMs",
    "damageMode"
  ]),
  heal_over_time: new Set([
    ...COMMON_FIELDS,
    "amount",
    "tickIntervalMs"
  ]),
  shield: new Set([
    ...COMMON_FIELDS,
    "amount"
  ]),
  damage_reflection: new Set([
    ...COMMON_FIELDS,
    "percent",
    "incomingKinds",
    "contactDamage"
  ]),
  projectile_mirror: COMMON_FIELDS,
  auto_dodge: COMMON_FIELDS,
  triggered_buff: new Set([...COMMON_FIELDS, "onDamageDealt", "onEvent"]),
  immunity: new Set([
    ...COMMON_FIELDS,
    "domains",
    "intangible"
  ]),
  immobilize: COMMON_FIELDS,
  silence: COMMON_FIELDS,
  stun: COMMON_FIELDS,
  taunt: COMMON_FIELDS
});

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(field + " must be an object");
  }
  return value;
}

function requiredString(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }
  return value.trim();
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(
      field + " must be a finite number"
    );
  }
  return number;
}

function positiveNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number <= 0) {
    throw new RangeError(
      field + " must be greater than 0"
    );
  }
  return number;
}

function positiveInteger(value, field) {
  const number = positiveNumber(value, field);
  if (!Number.isInteger(number)) {
    throw new RangeError(
      field + " must be a positive integer"
    );
  }
  return number;
}

function stringArray(value, field) {
  const list = value ?? [];
  if (!Array.isArray(list)) {
    throw new TypeError(field + " must be an array");
  }
  return Object.freeze([
    ...new Set(
      list.map((entry, index) =>
        requiredString(
          entry,
          field + "[" + index + "]"
        )
      )
    )
  ]);
}

function assertKnownFields(
  value,
  allowed,
  field
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field + " contains unknown field: " + key
      );
    }
  }
}

function normalizeDuration(value) {
  const durationModel = requiredString(
    value.durationModel ?? "time_ms",
    "StatusEffectV1.durationModel"
  );

  if (!DURATION_MODEL_SET.has(durationModel)) {
    throw new RangeError(
      "Unsupported StatusEffectV1.durationModel: " +
        durationModel
    );
  }

  if (durationModel === "time_ms") {
    if (value.durationActions != null) {
      throw new TypeError(
        "StatusEffectV1.durationActions is only valid for owner_action_end"
      );
    }
    return Object.freeze({
      durationModel,
      durationMs: positiveNumber(
        value.durationMs,
        "StatusEffectV1.durationMs"
      )
    });
  }

  if (durationModel === "until_damage") {
    if(value.durationMs != null || value.durationActions != null) throw new TypeError("until_damage has no countdown");
    return Object.freeze({durationModel});
  }

  if (durationModel === "permanent") {
    if (value.durationMs != null || value.durationActions != null) {
      throw new TypeError("Permanent statuses cannot specify durationMs or durationActions");
    }
    return Object.freeze({durationModel});
  }

  if (value.durationMs != null) {
    throw new TypeError(
      "StatusEffectV1.durationMs is only valid for time_ms"
    );
  }

  return Object.freeze({
    durationModel,
    durationActions: positiveInteger(
      value.durationActions,
      "StatusEffectV1.durationActions"
    )
  });
}

export function normalizeStatusEffectV1(input) {
  const value = objectValue(
    input,
    "StatusEffectV1"
  );

  const kind = requiredString(
    value.kind,
    "StatusEffectV1.kind"
  );
  if (!KIND_SET.has(kind)) {
    throw new RangeError(
      "Unsupported StatusEffectV1.kind: " + kind
    );
  }

  assertKnownFields(
    value,
    FIELDS_BY_KIND[kind],
    "StatusEffectV1"
  );

  const polarity = requiredString(
    value.polarity,
    "StatusEffectV1.polarity"
  );
  if (!POLARITY_SET.has(polarity)) {
    throw new RangeError(
      "Unsupported StatusEffectV1.polarity: " +
        polarity
    );
  }

  const stacking = requiredString(
    value.stacking,
    "StatusEffectV1.stacking"
  );
  if (!STACKING_SET.has(stacking)) {
    throw new RangeError(
      "Unsupported StatusEffectV1.stacking: " +
        stacking
    );
  }

  const duration = normalizeDuration(value);
  if (duration.durationModel === "until_damage" &&
      (kind !== "stun" || polarity !== "detrimental" || stacking === "stack")) {
    throw new RangeError("until_damage requires detrimental non-stacking stun");
  }
  if (duration.durationModel === "permanent" &&
      (kind !== "stack_counter" ||
       !Array.isArray(value.tags) ||
       !value.tags.includes("gensrpg:marker:v1") ||
       !String(value.id).startsWith("marker:"))) {
    throw new RangeError("Permanent duration is reserved for shared markers");
  }

  const output = {
    id: requiredString(
      value.id,
      "StatusEffectV1.id"
    ),
    kind,
    polarity,
    ...duration,
    stacking,
    maxStacks:
      stacking === "stack"
        ? positiveInteger(
            value.maxStacks ?? 1,
            "StatusEffectV1.maxStacks"
          )
        : 1,
    tags: stringArray(
      value.tags,
      "StatusEffectV1.tags"
    )
  };

  if (value.label != null) {
    output.label = requiredString(value.label, "StatusEffectV1.label");
  }

  if (value.onStackThreshold != null) {
    if (stacking !== "stack") {
      throw new RangeError("onStackThreshold requires stacking: stack");
    }
    const threshold = value.onStackThreshold;
    if (!threshold || typeof threshold !== "object" || Array.isArray(threshold)) {
      throw new TypeError("onStackThreshold must be an object");
    }
    assertKnownFields(threshold, new Set(["count", "consume", "effects", "repeat"]), "onStackThreshold");
    const count = positiveInteger(threshold.count, "onStackThreshold.count");
    if (count > output.maxStacks) {
      throw new RangeError("onStackThreshold.count must not exceed maxStacks");
    }
    const consume = requiredString(threshold.consume ?? "reset", "onStackThreshold.consume");
    if (!["reset", "keep"].includes(consume)) {
      throw new RangeError("Unsupported onStackThreshold.consume: " + consume);
    }
    if (!Array.isArray(threshold.effects) || threshold.effects.length === 0 ||
        threshold.effects.length > 12) {
      throw new RangeError("onStackThreshold.effects must contain 1 to 12 effects");
    }
    const repeat = threshold.repeat ?? "once";
    if (!["once", "each_addition"].includes(repeat)) throw new RangeError("Unsupported onStackThreshold.repeat: " + repeat);
    if (repeat === "each_addition" && consume !== "keep") {
      throw new RangeError("onStackThreshold.repeat each_addition requires consume: keep");
    }
    const effects = threshold.effects.map(rawEffect => {
      const effect = normalizeSkillEffectV1(rawEffect);
      if (!["damage", "heal", "energy_restore", "energy_drain", "knockout",
          "apply_status", "cleanse", "dispel"].includes(effect.kind)) {
        throw new RangeError("Unsupported onStackThreshold effect: " + effect.kind);
      }
      if (!["target", "self"].includes(effect.targetScope)) {
        throw new RangeError("onStackThreshold targetScope must be target or self");
      }
      return effect;
    });
    output.onStackThreshold = Object.freeze({
      count, consume, ...(repeat === "once" ? {} : {repeat}), effects: Object.freeze(effects)
    });
  }

  // A marker may apply ordinary native combat effects on EVERY actual stack
  // addition, independently of the configured threshold. No extra clock.
  if (value.onStackAdded != null) {
    if (kind !== "stack_counter" || stacking !== "stack" ||
        !output.tags.includes("gensrpg:marker:v1")) {
      throw new RangeError("onStackAdded is only supported by shared markers");
    }
    const added = objectValue(value.onStackAdded,"onStackAdded");
    assertKnownFields(added,new Set(["effects"]),"onStackAdded");
    if (!Array.isArray(added.effects) || added.effects.length < 1 ||
        added.effects.length > 12) {
      throw new RangeError("onStackAdded.effects must contain 1 to 12 effects");
    }
    const effects = added.effects.map(rawEffect => {
      const effect = normalizeSkillEffectV1(rawEffect);
      if (!["damage","heal","energy_restore","energy_drain","knockout",
            "apply_status","cleanse","dispel"].includes(effect.kind)) {
        throw new RangeError("Unsupported onStackAdded effect: " + effect.kind);
      }
      if (!["target","self"].includes(effect.targetScope)) {
        throw new RangeError("onStackAdded targetScope must be target or self");
      }
      return effect;
    });
    output.onStackAdded = Object.freeze({effects:Object.freeze(effects)});
  }

  // Shared markers reuse the native stack counter and combat clock for damage,
  // heal or life steal. Only Combat Damage owns real HP loss.
  // Other statuses must keep their original, independent effect definitions.
  if (value.periodic != null) {
    if (kind !== "stack_counter" || !output.tags.includes("gensrpg:marker:v1") ||
        !["time_ms","permanent"].includes(duration.durationModel)) {
      throw new RangeError("periodic effects are supported only on clocked shared markers");
    }
    const periodic = objectValue(value.periodic, "StatusEffectV1.periodic");
    assertKnownFields(periodic, new Set(["kind", "amount", "intervalMs", "channel", "damageMode", "percent", "maxHeal"]), "periodic");
    const periodicKind = requiredString(periodic.kind, "periodic.kind");
    if (!["damage", "heal", "life_steal"].includes(periodicKind)) {
      throw new RangeError("periodic.kind must be damage, heal or life_steal");
    }
    const damaging = periodicKind === "damage" || periodicKind === "life_steal";
    if (!damaging && (periodic.channel != null || periodic.damageMode != null)) {
      throw new RangeError("heal periodic markers cannot specify damage settings");
    }
    if (periodicKind !== "life_steal" &&
        (Object.hasOwn(periodic, "percent") || Object.hasOwn(periodic, "maxHeal"))) {
      throw new RangeError("periodic.percent/maxHeal require life_steal");
    }
    if (periodicKind === "life_steal" &&
        (typeof periodic.percent !== "number" || !Number.isFinite(periodic.percent) ||
         periodic.percent < 0 || periodic.percent > 100)) {
      throw new RangeError("periodic.percent must be between 0 and 100");
    }
    if (periodicKind === "life_steal" && periodic.maxHeal !== undefined &&
        (typeof periodic.maxHeal !== "number" || !Number.isFinite(periodic.maxHeal) ||
         periodic.maxHeal < 0)) {
      throw new RangeError("periodic.maxHeal must be non-negative when provided");
    }
    const damageMode = damaging
      ? requiredString(periodic.damageMode ?? "fixed", "periodic.damageMode") : null;
    if (damageMode !== null && !DAMAGE_MODE_SET.has(damageMode)) {
      throw new RangeError("Unsupported marker periodic damage mode");
    }
    output.periodic = Object.freeze({
      kind: periodicKind,
      amount: positiveNumber(periodic.amount, "periodic.amount"),
      intervalMs: positiveNumber(periodic.intervalMs, "periodic.intervalMs"),
      ...(damaging ? {
        damageMode,
        channel: requiredString(periodic.channel ?? "physical", "periodic.channel")
      } : {}),
      ...(periodicKind === "life_steal" ? {
        percent: periodic.percent,
        ...(periodic.maxHeal === undefined ? {} : {maxHeal: periodic.maxHeal})
      } : {})
    });
  }

  if (kind === "stat_modifier") {
    const activationCondition = requiredString(
      value.activationCondition ?? "always",
      "StatusEffectV1.activationCondition"
    );
    if (!["always", "moving"].includes(activationCondition)) {
      throw new RangeError("Unsupported stat modifier activationCondition: " + activationCondition);
    }
    if (activationCondition !== "always") output.activationCondition = activationCondition;
    output.statId = requiredString(
      value.statId,
      "StatusEffectV1.statId"
    );

    const modifierMode = requiredString(
      value.modifierMode ?? "points",
      "StatusEffectV1.modifierMode"
    );
    if (!STAT_MODIFIER_MODE_SET.has(modifierMode)) {
      throw new RangeError(
        "Unsupported StatusEffectV1.modifierMode: " +
          modifierMode
      );
    }
    output.modifierMode = modifierMode;

    if (modifierMode === "points") {
      if (value.percent != null) {
        throw new TypeError(
          "StatusEffectV1.percent is only valid for percent modifierMode"
        );
      }
      output.deltaPoints = finiteNumber(
        value.deltaPoints,
        "StatusEffectV1.deltaPoints"
      );
    } else {
      if (value.deltaPoints != null) {
        throw new TypeError(
          "StatusEffectV1.deltaPoints is only valid for points modifierMode"
        );
      }
      output.percent = finiteNumber(
        value.percent,
        "StatusEffectV1.percent"
      );
    }
  }

  if (kind === "approach_time_modifier" || kind === "energy_regen_modifier" || kind === "skill_cooldown_rate_modifier" || kind === "outgoing_damage_modifier") {
    output.modifierPct = finiteNumber(value.modifierPct, "StatusEffectV1.modifierPct");
  }

  if (kind === "damage_over_time") {
    output.amount = positiveNumber(
      value.amount,
      "StatusEffectV1.amount"
    );
    output.channel = requiredString(
      value.channel,
      "StatusEffectV1.channel"
    );

    const damageMode = requiredString(
      value.damageMode ?? "combat",
      "StatusEffectV1.damageMode"
    );
    if (!DAMAGE_MODE_SET.has(damageMode)) {
      throw new RangeError(
        "Unsupported StatusEffectV1.damageMode: " +
          damageMode
      );
    }
    output.damageMode = damageMode;

    if (duration.durationModel === "time_ms") {
      output.tickIntervalMs = positiveNumber(
        value.tickIntervalMs,
        "StatusEffectV1.tickIntervalMs"
      );
    } else if (value.tickIntervalMs != null) {
      throw new TypeError(
        "StatusEffectV1.tickIntervalMs is not used by owner_action_end DoT"
      );
    }
  }

  if (kind === "heal_over_time") {
    output.amount = positiveNumber(
      value.amount,
      "StatusEffectV1.amount"
    );
    if (duration.durationModel === "time_ms") {
      output.tickIntervalMs = positiveNumber(
        value.tickIntervalMs,
        "StatusEffectV1.tickIntervalMs"
      );
    } else if (value.tickIntervalMs != null) {
      throw new TypeError(
        "StatusEffectV1.tickIntervalMs is not used by owner_action_end HoT"
      );
    }
  }

  if (kind === "shield") {
    output.amount = positiveNumber(
      value.amount,
      "StatusEffectV1.amount"
    );
  }

  if (kind === "damage_reflection") {
    output.percent = finiteNumber(
      value.percent,
      "StatusEffectV1.percent"
    );
    if (output.percent < 0 || output.percent > 100) {
      throw new RangeError("StatusEffectV1.percent must be between 0 and 100");
    }
  }

  if (kind === "damage_reflection") {
    if (value.incomingKinds !== undefined) {
      const incomingKinds = stringArray(value.incomingKinds, "StatusEffectV1.incomingKinds");
      if (incomingKinds.length === 0 || incomingKinds.some(entry => !DAMAGE_REFLECTION_INCOMING_KIND_SET.has(entry))) {
        throw new RangeError("StatusEffectV1.incomingKinds must select known attack kinds");
      }
      output.incomingKinds = incomingKinds;
    }
    if (value.contactDamage !== undefined) {
      const contactDamage = finiteNumber(value.contactDamage, "StatusEffectV1.contactDamage");
      if (contactDamage < 0) throw new RangeError("StatusEffectV1.contactDamage must be non-negative");
      output.contactDamage = contactDamage;
    }
  }

  if (kind === "triggered_buff") {
    if (duration.durationModel !== "time_ms") {
      throw new RangeError("StatusEffectV1.triggered_buff requires time_ms duration");
    }
    if (stacking === "stack") {
      throw new RangeError("StatusEffectV1.triggered_buff supports replace or refresh only");
    }
    const hasOld = value.onDamageDealt != null;
    const hasNew = value.onEvent != null;
    if (hasOld && hasNew) {
      throw new RangeError("onDamageDealt and onEvent are mutually exclusive (not both)");
    }
    if (!hasOld && !hasNew) {
      throw new TypeError("StatusEffectV1 requires onEvent or onDamageDealt");
    }
    // Legacy V1 author exports retain their exact documented semantics.
    if (hasOld && polarity !== "beneficial") {
      throw new RangeError("StatusEffectV1.triggered_buff onDamageDealt must be beneficial");
    }
    const trigger = hasNew ? value.onEvent : value.onDamageDealt;
    const label = hasNew ? "onEvent" : "onDamageDealt";
    if (!trigger || typeof trigger !== "object" || Array.isArray(trigger)) {
      throw new TypeError("StatusEffectV1." + label + " must be an object");
    }
    assertKnownFields(trigger, new Set(hasNew ? ["event", "effects"] : ["effects"]),
      "StatusEffectV1." + label);
    if (hasNew && !TRIGGERED_BUFF_EVENT_TYPES_V2.includes(trigger.event)) {
      throw new RangeError("Unsupported triggered buff event: " + trigger.event);
    }
    if (!Array.isArray(trigger.effects) || trigger.effects.length < 1 || trigger.effects.length > 12) {
      throw new RangeError("StatusEffectV1." + label + ".effects must contain 1 to 12 effects");
    }
    const effects = trigger.effects.map(raw => {
      const effect = normalizeSkillEffectV1(raw);
      if (!["damage", "heal", "energy_restore", "energy_drain",
        "apply_status", "cleanse", "dispel"].includes(effect.kind)) {
        throw new RangeError("Unsupported triggered effect: " + effect.kind);
      }
      if (!["target", "self"].includes(effect.targetScope)) {
        throw new RangeError("triggered_buff targetScope must be target or self");
      }
      if (effect.kind === "apply_status" && effect.status.kind === "triggered_buff") {
        throw new RangeError("Nested triggered_buff is not supported");
      }
      return effect;
    });
    if (hasNew) {
      output.onEvent = Object.freeze({
        event: trigger.event,
        effects: Object.freeze(effects)
      });
    } else {
      output.onDamageDealt = Object.freeze({ effects: Object.freeze(effects) });
    }
  }

  if (kind === "auto_dodge") {
    if (polarity !== "beneficial") {
      throw new RangeError("StatusEffectV1.auto_dodge must be beneficial");
    }
    if (duration.durationModel !== "time_ms") {
      throw new RangeError("StatusEffectV1.auto_dodge requires time_ms duration");
    }
  }

  if (kind === "projectile_mirror" && polarity !== "beneficial") {
    throw new RangeError("StatusEffectV1.projectile_mirror must be beneficial");
  }

  if (kind === "immunity") {
    const domains = stringArray(
      value.domains,
      "StatusEffectV1.domains"
    );
    if (domains.length === 0) {
      throw new TypeError(
        "StatusEffectV1.domains must contain at least one immunity domain"
      );
    }
    for (const domain of domains) {
      if (!IMMUNITY_DOMAIN_SET.has(domain)) {
        throw new RangeError(
          "Unsupported StatusEffectV1.immunity domain: " +
            domain
        );
      }
    }
    output.domains = domains;
    if (value.intangible != null && typeof value.intangible !== "boolean") {
      throw new TypeError("StatusEffectV1.intangible must be a boolean");
    }
    if (value.intangible === true) {
      if (polarity !== "beneficial" ||
          !domains.includes("damage") || !domains.includes("negative_status")) {
        throw new RangeError("StatusEffectV1.intangible requires beneficial damage and negative_status immunity");
      }
      output.intangible = true;
    }
  }

  return Object.freeze(output);
}
