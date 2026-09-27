import {
  normalizeCaptureCreatureEditorDraftV1
} from "../contracts/capture-creature-editor-draft-v1.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../contracts/capture-skill-editor-draft-v1.js";
import {
  exportCaptureEditorDraftsToCombatExportV1
} from "../adapters/input/capture/capture-editor-exporter-v1.js";

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(field + " must be an object");
  }
  return value;
}

function textValue(value) {
  return value == null ? "" : String(value).trim();
}

function optionalText(value) {
  const text = textValue(value);
  return text === "" ? null : text;
}

function numberValue(value, field, { optional = false } = {}) {
  const text = textValue(value);
  if (text === "") {
    if (optional) {
      return undefined;
    }
    throw new TypeError(field + " is required");
  }

  const number = Number(text);
  if (!Number.isFinite(number)) {
    throw new TypeError(field + " must be a finite number");
  }
  return number;
}

function csvValue(value) {
  const text = textValue(value);
  if (text === "") {
    return [];
  }
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function jsonValue(value, field, { emptyValue = null } = {}) {
  const text = value == null ? "" : String(value).trim();
  if (text === "") {
    return emptyValue;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new TypeError(field + " must contain valid JSON: " + error.message);
  }
}

function withOptionalNumber(target, fields, key, fieldName = key) {
  const value = numberValue(fields[key], fieldName, { optional: true });
  if (value !== undefined) {
    target[key] = value;
  }
}

export function buildCaptureCreatureDraftFromEditorFieldsV1(fields) {
  objectValue(fields, "creatureFields");

  const evolutionCondition = textValue(fields.evolutionCondition);
  let evolution = null;

  if (evolutionCondition !== "" && evolutionCondition !== "none") {
    evolution = {
      condition: evolutionCondition,
      targetId: textValue(fields.evolutionTargetId)
    };
    if (evolutionCondition === "level") {
      evolution.level = numberValue(
        fields.evolutionLevel,
        "capture.evolution.level"
      );
    }
  }

  const combat = {
    maxHp: numberValue(fields.maxHp, "combat.maxHp"),
    maxEnergy: numberValue(fields.maxEnergy, "combat.maxEnergy")
  };

  for (const key of [
    "initialHp",
    "initialEnergy",
    "energyChargeAmount",
    "energyChargeIntervalMs",
    "movementEnergyPerStep",
    "chargeTimeModifierPct"
  ]) {
    withOptionalNumber(combat, fields, key, "combat." + key);
  }

  return normalizeCaptureCreatureEditorDraftV1({
    schema: "capture-creature-editor-draft-v1",
    id: textValue(fields.id),
    displayName: textValue(fields.displayName),
    description: optionalText(fields.description),
    level: numberValue(fields.level, "level"),
    sourceStats: {
      force: numberValue(fields.statForce, "sourceStats.force"),
      agility: numberValue(fields.statAgility, "sourceStats.agility"),
      intelligence: numberValue(
        fields.statIntelligence,
        "sourceStats.intelligence"
      ),
      spirit: numberValue(fields.statSpirit, "sourceStats.spirit"),
      endurance: numberValue(
        fields.statEndurance,
        "sourceStats.endurance"
      ),
      initiative: numberValue(
        fields.statInitiative,
        "sourceStats.initiative"
      )
    },
    elements: csvValue(fields.elementsCsv),
    resistances: jsonValue(
      fields.resistancesJson,
      "resistances",
      { emptyValue: [] }
    ),
    capture: {
      capturable: fields.capturable === true,
      captureRate: numberValue(
        fields.captureRate,
        "capture.captureRate"
      ),
      spawnChance: numberValue(
        fields.spawnChance,
        "capture.spawnChance"
      ),
      spawnTags: csvValue(fields.spawnTagsCsv),
      evolution
    },
    combat,
    skillIds: csvValue(fields.skillIdsCsv),
    presentationId: optionalText(fields.presentationId)
  });
}

export function buildCaptureSkillDraftFromEditorFieldsV1(fields) {
  objectValue(fields, "skillFields");

  return normalizeCaptureSkillEditorDraftV1({
    schema: "capture-skill-editor-draft-v1",
    id: textValue(fields.id),
    description: optionalText(fields.description),
    requiredLevel: numberValue(
      fields.requiredLevel,
      "requiredLevel"
    ),
    usageScopes: csvValue(fields.usageScopesCsv),
    definition: jsonValue(
      fields.definitionJson,
      "definition"
    ),
    presentation: jsonValue(
      fields.presentationJson,
      "presentation",
      { emptyValue: null }
    )
  });
}

export function buildCaptureEditorExportFromFieldsV1({
  creatureFields,
  skillFields,
  context
}) {
  const creatureDraft =
    buildCaptureCreatureDraftFromEditorFieldsV1(creatureFields);
  const skillDraft =
    buildCaptureSkillDraftFromEditorFieldsV1(skillFields);
  const value = objectValue(context, "context");
  const battle = objectValue(value.battle, "context.battle");

  const actors = (value.actors ?? []).map((actor) =>
    actor.actorId === battle.localActorId
      ? {
          ...actor,
          creatureId: creatureDraft.id,
          displayName: creatureDraft.displayName
        }
      : actor
  );

  return exportCaptureEditorDraftsToCombatExportV1({
    battle,
    teams: value.teams,
    actors,
    rosters: value.rosters ?? [],
    creatureDrafts: [
      creatureDraft,
      ...(value.additionalCreatureDrafts ?? [])
    ],
    skillDrafts: [
      skillDraft,
      ...(value.additionalSkillDrafts ?? [])
    ],
    metadata: value.metadata ?? {}
  });
}

function requiredElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error("Capture editor element not found: " + selector);
  }
  return element;
}

function formFields(form) {
  const output = {};
  for (const element of form.elements) {
    if (!element.name) {
      continue;
    }
    output[element.name] =
      element.type === "checkbox"
        ? element.checked
        : element.value;
  }
  return output;
}

export function mountCaptureEditorTestUi({
  root,
  context
}) {
  if (!root || typeof root.querySelector !== "function") {
    throw new TypeError("root must provide querySelector()");
  }

  objectValue(context, "context");

  const creatureForm = requiredElement(
    root,
    "[data-capture-creature-form]"
  );
  const skillForm = requiredElement(
    root,
    "[data-capture-skill-form]"
  );
  const submit = requiredElement(
    root,
    "[data-capture-editor-submit]"
  );
  const status = requiredElement(
    root,
    "[data-capture-editor-status]"
  );
  const output = requiredElement(
    root,
    "[data-capture-editor-output]"
  );

  let disposed = false;

  function setStatus(message, tone) {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function generate() {
    if (disposed) {
      return null;
    }

    try {
      const exported = buildCaptureEditorExportFromFieldsV1({
        creatureFields: formFields(creatureForm),
        skillFields: formFields(skillForm),
        context
      });

      output.textContent = JSON.stringify(exported, null, 2);
      setStatus(
        "Export valide · CaptureCombatExportV1 généré.",
        "ok"
      );
      return exported;
    } catch (error) {
      output.textContent = "";
      setStatus(error.message, "error");
      return null;
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    generate();
  }

  submit.addEventListener("click", onSubmit);

  return Object.freeze({
    generate,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      submit.removeEventListener("click", onSubmit);
    }
  });
}
