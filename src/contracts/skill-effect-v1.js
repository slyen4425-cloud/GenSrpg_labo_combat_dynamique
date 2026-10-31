import {
  normalizeStatusEffectV1, STATUS_EFFECT_V1_KINDS
} from "./status-effect-v1.js";
import { normalizeCaptureMarkerV1 } from "./capture-marker-v1.js";

export const SKILL_EFFECT_V1_KINDS = Object.freeze([
  "damage",
  "heal",
  "energy_restore",
  "energy_drain",
  "life_steal",
  "knockout",
  "apply_status",
  "apply_marker",
  "force_reserve_switch",
  "consume_marker",
  "cleanse",
  "dispel",
  "persistent_zone",
  "scheduled_effect",
  "summon_entity"
]);

export const SKILL_EFFECT_V1_TARGET_SCOPES =
  Object.freeze([
    "target",
    "self",
    "all_enemies",
    "all_allies",
    "all_except_self",
    "all_enemy_reserves",
    "all_ally_reserves",
    "all_active"
  ]);

export const RESERVE_EFFECT_TARGET_SCOPES_V2 = Object.freeze(["all_enemy_reserves", "all_ally_reserves"]);
export function isReserveEffectTargetScopeV2(scope) {
  return RESERVE_EFFECT_TARGET_SCOPES_V2.includes(scope);
}

const KIND_SET = new Set(SKILL_EFFECT_V1_KINDS);
const TARGET_SCOPE_SET = new Set(
  SKILL_EFFECT_V1_TARGET_SCOPES
);

const COMMON_FIELDS = new Set([
  "kind",
  "targetScope",
  "condition"
]);

const FIELDS_BY_KIND = Object.freeze({
  damage: new Set([
    ...COMMON_FIELDS,
    "amount",
    "channel",
    "ignoreResistancePct",
    "ignoreDamageReductionPct"
  ]),
  heal: new Set([
    ...COMMON_FIELDS,
    "amount"
  ]),
  energy_restore: new Set([
    ...COMMON_FIELDS,
    "amount"
  ]),
  energy_drain: new Set([
    ...COMMON_FIELDS,
    "amount"
  ]),
  life_steal: new Set([
    ...COMMON_FIELDS,
    "percent",
    "maxHeal"
  ]),
  knockout: COMMON_FIELDS,
  apply_status: new Set([
    ...COMMON_FIELDS,
    "status"
  ]),
  apply_marker: new Set([...COMMON_FIELDS, "marker", "charges"]),
  force_reserve_switch: COMMON_FIELDS,
  consume_marker: new Set([...COMMON_FIELDS, "markerId", "count", "minimum", "perCharge", "effects"]),
  cleanse: new Set([
    ...COMMON_FIELDS,
    "statusTags"
  ]),
  dispel: new Set([
    ...COMMON_FIELDS,
    "statusTags"
  ]),
  persistent_zone: new Set([
    ...COMMON_FIELDS,
    "zoneId",
    "radius",
    "durationMs",
    "tickIntervalMs",
    "reactivation",
    "maxActivations",
    "radiusGrowthSteps",
    "tickEffect",
    "statusBehavior",
    "damageTrigger",
    "persistAfterRecall"
  ]),
  scheduled_effect: new Set([
    ...COMMON_FIELDS,
    "trigger",
    "effects"
  ]),
  summon_entity: new Set([
    ...COMMON_FIELDS, "entityKind", "statId", "hpPerStatPoint", "interceptKinds", "spriteAssetId"
  ])
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

function nonNegativeNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(
      field +
        " must be a non-negative finite number"
    );
  }
  return number;
}

function penetrationPercentV1(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new RangeError(field + " must be between 0 and 100");
  }
  return number;
}

function positiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(
      field +
        " must be a positive finite number"
    );
  }
  return number;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(
      field +
        " must be an integer greater than or equal to 1"
    );
  }
  return number;
}

function nonNegativeInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(
      field +
        " must be a non-negative integer"
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

export function normalizeSkillEffectV1(input) {
  const value = objectValue(
    input,
    "SkillEffectV1"
  );

  const kind = requiredString(
    value.kind,
    "SkillEffectV1.kind"
  );
  if (!KIND_SET.has(kind)) {
    throw new RangeError(
      "Unsupported SkillEffectV1.kind: " + kind
    );
  }

  assertKnownFields(
    value,
    FIELDS_BY_KIND[kind],
    "SkillEffectV1"
  );

  const targetScope = requiredString(
    value.targetScope,
    "SkillEffectV1.targetScope"
  );
  if (!TARGET_SCOPE_SET.has(targetScope)) {
    throw new RangeError(
      "Unsupported SkillEffectV1.targetScope: " +
        targetScope
    );
  }

  if (targetScope === "all_active" && !["apply_marker", "consume_marker"].includes(kind)) {
    throw new RangeError("all_active is only valid for marker effects");
  }

  // Reserve scopes are executed by the existing RosterSession owner on a
  // temporary native CombatState: status application shares the exact same
  // clock, immunity and status lifetime rules as active combat.
  if (isReserveEffectTargetScopeV2(targetScope) && !["damage", "heal", "apply_marker", "apply_status"].includes(kind)) {
    throw new RangeError("Reserve effect scopes support damage/heal/apply_marker/apply_status only: " + kind);
  }

  if (kind === "force_reserve_switch" && targetScope !== "target") {
    throw new RangeError("force_reserve_switch requires target scope");
  }

  if (kind === "summon_entity" && !["self","target"].includes(targetScope)) {
    throw new RangeError("summon_entity.targetScope must be self or target");
  }
  if (kind === "life_steal" && targetScope !== "self") {
    throw new RangeError("SkillEffectV1.life_steal targetScope must be self");
  }

  const output = {
    kind,
    targetScope
  };

  if(value.condition != null){
    const c=objectValue(value.condition,"SkillEffectV1.condition");
    assertKnownFields(c,new Set(["type","value","minimum","invert"]),"SkillEffectV1.condition");
    const type=requiredString(c.type,"condition.type");
    if(!["sleep","status_kind","marker"].includes(type))throw new RangeError("Unknown condition type");
    const ref=type==="sleep"?null:requiredString(c.value,"condition.value");
    if(type==="sleep" && c.value!=null)throw new RangeError("Sleep has no ID");
    if(type==="status_kind" && !STATUS_EFFECT_V1_KINDS.includes(ref))throw new RangeError("Unknown status condition");
    if(type==="marker" && !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(ref))throw new RangeError("Invalid marker condition");
    const minimum=positiveInteger(c.minimum??1,"condition.minimum");
    if(minimum>99)throw new RangeError("Condition max is 99");
    if(c.invert!=null && typeof c.invert!=="boolean")throw new TypeError("Invalid condition.invert");
    if(["persistent_zone","scheduled_effect","life_steal"].includes(kind) || isReserveEffectTargetScopeV2(targetScope))
      throw new RangeError("Conditions apply to immediate active-target effects only");
    output.condition=Object.freeze({type,...(ref===null?{}:{value:ref}),minimum,
      ...(c.invert===true?{invert:true}:{})});
  }

  if (kind === "summon_entity") {
    if (value.condition != null) throw new RangeError("summon_entity conditions are unsupported");
    if (value.entityKind !== "barrier") throw new RangeError("summon_entity.entityKind only supports barrier in V1");
    output.entityKind = "barrier";
    output.statId = requiredString(value.statId, "summon_entity.statId");
    output.hpPerStatPoint = positiveNumber(value.hpPerStatPoint, "summon_entity.hpPerStatPoint");
    const kinds=value.interceptKinds??["projectile","beam","contact"];
    if (!Array.isArray(kinds) || kinds.length===0 ||
        kinds.some(kind=>!["projectile","beam","contact"].includes(kind)) ||
        new Set(kinds).size!==kinds.length) {
      throw new RangeError("summon_entity.interceptKinds must list distinct projectile/beam/contact");
    }
    output.interceptKinds=Object.freeze([...kinds]);
    if(value.spriteAssetId != null) output.spriteAssetId=requiredString(value.spriteAssetId,"summon_entity.spriteAssetId");
  }

  if (kind === "apply_marker") {
    output.marker = normalizeCaptureMarkerV1(value.marker);
    output.charges = positiveInteger(value.charges ?? 1, "SkillEffectV1.charges");
    if (output.charges > 99) throw new RangeError("Marker placement is limited to 99 charges per effect");
  }

  if (kind === "consume_marker") {
    const markerId = value.markerId ?? "*";
    if (markerId !== "*" && (typeof markerId !== "string" || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(markerId))) {
      throw new RangeError("consume_marker.markerId must be * or a stable marker ID");
    }
    output.markerId = markerId;
    output.count = value.count ?? "all";
    if (output.count !== "all") output.count = positiveInteger(output.count, "SkillEffectV1.count");
    output.minimum = positiveInteger(value.minimum ?? 1, "SkillEffectV1.minimum");
    // Optional opt-in: older authored marker consumers keep fixed child amounts.
    if (value.perCharge !== undefined && typeof value.perCharge !== "boolean") {
      throw new TypeError("consume_marker.perCharge must be a boolean");
    }
    if (value.perCharge === true) output.perCharge = true;
    if (output.count !== "all" && output.minimum > output.count) {
      throw new RangeError("Marker minimum exceeds the maximum charges consumed");
    }
    if (!Array.isArray(value.effects) || value.effects.length > 12) {
      throw new RangeError("consume_marker.effects requires an array of up to 12 effects");
    }
    output.effects = Object.freeze(value.effects.map(normalizeSkillEffectV1));
    for (const child of output.effects) {
      if (!["damage", "heal", "energy_restore", "energy_drain", "knockout", "apply_status", "cleanse", "dispel"].includes(child.kind) ||
          !["target", "self"].includes(child.targetScope)) {
        throw new RangeError("Unsupported nested effect for marker consumption");
      }
    }
  }

  if (kind === "life_steal") {
    output.percent = penetrationPercentV1(value.percent, "SkillEffectV1.percent");
    if (value.maxHeal !== undefined) {
      output.maxHeal = nonNegativeNumber(value.maxHeal, "SkillEffectV1.maxHeal");
    }
  }

  if (
    kind === "damage" ||
    kind === "heal" ||
    kind === "energy_restore" ||
    kind === "energy_drain"
  ) {
    output.amount = nonNegativeNumber(
      value.amount,
      "SkillEffectV1.amount"
    );
  }

  if (kind === "damage") {
    output.channel =
      value.channel == null
        ? null
        : requiredString(
            value.channel,
            "SkillEffectV1.channel"
          );
    for (const key of [
      "ignoreResistancePct",
      "ignoreDamageReductionPct"
    ]) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        output[key] = penetrationPercentV1(
          value[key],
          "SkillEffectV1." + key
        );
      }
    }
  }

  if (kind === "apply_status") {
    output.status = normalizeStatusEffectV1(
      value.status
    );
  }

  if (
    kind === "cleanse" ||
    kind === "dispel"
  ) {
    output.statusTags = stringArray(
      value.statusTags,
      "SkillEffectV1.statusTags"
    );
  }

  if (kind === "scheduled_effect") {
    if (targetScope !== "target") {
      throw new RangeError(
        "scheduled_effect targetScope must be target in V1"
      );
    }

    const trigger = objectValue(
      value.trigger,
      "SkillEffectV1.trigger"
    );
    for (const key of Object.keys(trigger)) {
      if (!["type", "delayMs"].includes(key)) {
        throw new TypeError(
          "SkillEffectV1.trigger contains unknown field: " +
            key
        );
      }
    }

    const triggerType = requiredString(
      trigger.type,
      "SkillEffectV1.trigger.type"
    );
    if (triggerType !== "after_ms") {
      throw new RangeError(
        "Unsupported SkillEffectV1.trigger.type: " +
          triggerType
      );
    }

    const delayMs = nonNegativeNumber(
      trigger.delayMs,
      "SkillEffectV1.trigger.delayMs"
    );

    if (!Array.isArray(value.effects)) {
      throw new TypeError(
        "SkillEffectV1.effects must be an array"
      );
    }
    if (value.effects.length === 0) {
      throw new TypeError(
        "scheduled_effect effects must contain at least one effect"
      );
    }

    const nestedEffects = Object.freeze(
      value.effects.map((entry) =>
        normalizeSkillEffectV1(entry)
      )
    );

    for (const nested of nestedEffects) {
      if (
        nested.kind === "scheduled_effect" ||
        nested.kind === "persistent_zone"
      ) {
        throw new RangeError(
          "scheduled_effect cannot contain " +
            nested.kind +
            " in V1"
        );
      }
    }

    output.trigger = Object.freeze({
      type: triggerType,
      delayMs
    });
    output.effects = nestedEffects;
  }

  if (kind === "persistent_zone") {
    output.zoneId = requiredString(
      value.zoneId,
      "SkillEffectV1.zoneId"
    );

    output.radius = requiredString(
      value.radius,
      "SkillEffectV1.radius"
    );
    if (
      !["short", "medium", "long"].includes(
        output.radius
      )
    ) {
      throw new RangeError(
        "Unsupported SkillEffectV1.radius: " +
          output.radius
      );
    }

    output.durationMs = positiveNumber(
      value.durationMs,
      "SkillEffectV1.durationMs"
    );
    output.tickIntervalMs = positiveNumber(
      value.tickIntervalMs,
      "SkillEffectV1.tickIntervalMs"
    );

    output.reactivation = requiredString(
      value.reactivation ?? "refresh",
      "SkillEffectV1.reactivation"
    );
    if (
      !["refresh", "reinforce"].includes(
        output.reactivation
      )
    ) {
      throw new RangeError(
        "Unsupported SkillEffectV1.reactivation: " +
          output.reactivation
      );
    }

    output.maxActivations = positiveInteger(
      value.maxActivations ?? 1,
      "SkillEffectV1.maxActivations"
    );
    output.radiusGrowthSteps =
      nonNegativeInteger(
        value.radiusGrowthSteps ?? 0,
        "SkillEffectV1.radiusGrowthSteps"
      );

    output.tickEffect =
      normalizeSkillEffectV1(
        objectValue(
          value.tickEffect,
          "SkillEffectV1.tickEffect"
        )
      );

    if (
      output.tickEffect.kind ===
      "persistent_zone"
    ) {
      throw new RangeError(
        "persistent_zone cannot contain another persistent_zone"
      );
    }

    if (!["damage", "apply_status", "apply_marker"].includes(output.tickEffect.kind)) {
      throw new RangeError("persistent_zone tickEffect must be damage, apply_status or apply_marker");
    }
    if (value.damageTrigger !== undefined) {
      if (output.tickEffect.kind !== "damage" || !["entry_only", "entry_and_tick"].includes(value.damageTrigger)) {
        throw new RangeError("SkillEffectV1.damageTrigger requires a damaging zone and entry_only or entry_and_tick");
      }
      output.damageTrigger = value.damageTrigger;
    }
    if (value.persistAfterRecall !== undefined) {
      if (typeof value.persistAfterRecall !== "boolean") {
        throw new TypeError("SkillEffectV1.persistAfterRecall must be boolean");
      }
      if (value.persistAfterRecall && output.tickEffect.kind !== "apply_status") {
        throw new RangeError("persistAfterRecall requires a status zone in V1");
      }
      output.persistAfterRecall = value.persistAfterRecall;
    }
    if (output.tickEffect.kind === "apply_status") {
      output.statusBehavior = requiredString(
        value.statusBehavior ?? "while_inside",
        "SkillEffectV1.statusBehavior"
      );
      if (!["while_inside", "on_enter"].includes(output.statusBehavior)) {
        throw new RangeError("Unsupported SkillEffectV1.statusBehavior: " + output.statusBehavior);
      }
    } else if (value.statusBehavior != null) {
      throw new TypeError("SkillEffectV1.statusBehavior is only valid for status zones");
    }
  }

  return Object.freeze(output);
}
