import { normalizeBattleFormatDefinition } from "./battle-format-definition.js";
import { normalizeSkillDefinition } from "./skill-definition.js";

export const CAPTURE_COMBAT_PACKAGE_SCHEMA = "capture-combat-package";
export const CAPTURE_COMBAT_PACKAGE_VERSION = 1;

const PRESENTATION_LAYERS = new Set(["front", "behind"]);

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value, field) {
  if (value == null) {
    return null;
  }
  return requiredString(value, field);
}

function plainObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${field} must be a plain object`);
  }
  return value;
}

function cloneJsonValue(value, field) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${field} must contain only finite numbers`);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((item, index) =>
        cloneJsonValue(item, `${field}[${index}]`)
      )
    );
  }

  if (value && typeof value === "object") {
    plainObject(value, field);
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          cloneJsonValue(item, `${field}.${key}`)
        ])
      )
    );
  }

  throw new TypeError(`${field} must contain JSON-safe values only`);
}

function stringArray(value, field) {
  if (value == null) {
    return Object.freeze([]);
  }
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }
  const normalized = value.map((item, index) =>
    requiredString(item, `${field}[${index}]`)
  );
  if (new Set(normalized).size !== normalized.length) {
    throw new RangeError(`${field} must not contain duplicates`);
  }
  return Object.freeze(normalized);
}

function stableAssetId(value, field) {
  if (value == null) {
    return null;
  }
  const id = requiredString(value, field);
  if (
    /^[a-z][a-z0-9+.-]*:\/\//i.test(id) ||
    /[\\/]/.test(id) ||
    id.startsWith(".")
  ) {
    throw new RangeError(
      `${field} must be a stable assetId, not a URL or physical path`
    );
  }
  return id;
}

function normalizeCreaturePresentation(input, field) {
  if (input == null) {
    return null;
  }
  const raw = plainObject(input, field);
  return Object.freeze({
    profileId: optionalString(raw.profileId, `${field}.profileId`),
    frontAssetId: stableAssetId(
      raw.frontAssetId,
      `${field}.frontAssetId`
    ),
    backAssetId: stableAssetId(
      raw.backAssetId,
      `${field}.backAssetId`
    ),
    iconAssetId: stableAssetId(
      raw.iconAssetId,
      `${field}.iconAssetId`
    )
  });
}

function normalizeSkillPresentation(input, field) {
  if (input == null) {
    return null;
  }
  const raw = plainObject(input, field);
  const castLayer = optionalString(raw.castLayer, `${field}.castLayer`);
  if (castLayer !== null && !PRESENTATION_LAYERS.has(castLayer)) {
    throw new RangeError(`Unsupported ${field}.castLayer: ${castLayer}`);
  }

  return Object.freeze({
    iconAssetId: stableAssetId(raw.iconAssetId, `${field}.iconAssetId`),
    castFxAssetId: stableAssetId(
      raw.castFxAssetId,
      `${field}.castFxAssetId`
    ),
    travelFxAssetId: stableAssetId(
      raw.travelFxAssetId,
      `${field}.travelFxAssetId`
    ),
    impactFxAssetId: stableAssetId(
      raw.impactFxAssetId,
      `${field}.impactFxAssetId`
    ),
    castSoundAssetId: stableAssetId(
      raw.castSoundAssetId,
      `${field}.castSoundAssetId`
    ),
    releaseSoundAssetId: stableAssetId(
      raw.releaseSoundAssetId,
      `${field}.releaseSoundAssetId`
    ),
    impactSoundAssetId: stableAssetId(
      raw.impactSoundAssetId,
      `${field}.impactSoundAssetId`
    ),
    castAnchor: optionalString(raw.castAnchor, `${field}.castAnchor`),
    travelSourceAnchor: optionalString(
      raw.travelSourceAnchor,
      `${field}.travelSourceAnchor`
    ),
    castLayer
  });
}

function normalizeCreatures(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new TypeError("creatures must be a non-empty array");
  }

  const seenCreatureIds = new Set();
  const seenFighterConfigIds = new Set();

  return Object.freeze(
    input.map((rawCreature, index) => {
      const field = `creatures[${index}]`;
      const raw = plainObject(rawCreature, field);
      const id = requiredString(raw.id, `${field}.id`);
      const displayName = requiredString(
        raw.displayName,
        `${field}.displayName`
      );
      const fighterConfigId = requiredString(
        raw.fighterConfigId,
        `${field}.fighterConfigId`
      );

      if (seenCreatureIds.has(id)) {
        throw new RangeError(`duplicate creature id: ${id}`);
      }
      if (seenFighterConfigIds.has(fighterConfigId)) {
        throw new RangeError(
          `duplicate fighterConfigId: ${fighterConfigId}`
        );
      }
      seenCreatureIds.add(id);
      seenFighterConfigIds.add(fighterConfigId);

      const fighterConfigRaw = plainObject(
        raw.fighterConfig,
        `${field}.fighterConfig`
      );
      const fighterConfig = cloneJsonValue(
        fighterConfigRaw,
        `${field}.fighterConfig`
      );
      const fighterId = requiredString(
        fighterConfig.id,
        `${field}.fighterConfig.id`
      );
      if (fighterId !== fighterConfigId) {
        throw new RangeError(
          `${field}.fighterConfig.id must match fighterConfigId`
        );
      }

      return Object.freeze({
        id,
        displayName,
        fighterConfigId,
        fighterConfig,
        skillIds: stringArray(raw.skillIds, `${field}.skillIds`),
        presentation: normalizeCreaturePresentation(
          raw.presentation,
          `${field}.presentation`
        )
      });
    })
  );
}

function normalizeSkills(input) {
  if (input == null) {
    return Object.freeze([]);
  }
  if (!Array.isArray(input)) {
    throw new TypeError("skills must be an array");
  }

  const seen = new Set();
  return Object.freeze(
    input.map((rawSkill, index) => {
      const skill = normalizeSkillDefinition(rawSkill);
      if (seen.has(skill.id)) {
        throw new RangeError(`duplicate skill id: ${skill.id}`);
      }
      seen.add(skill.id);
      return skill;
    })
  );
}

function normalizeSkillPresentationMap(input, knownSkillIds) {
  if (input == null) {
    return Object.freeze({});
  }
  const raw = plainObject(input, "presentation.skills");
  const result = {};

  for (const [skillIdRaw, binding] of Object.entries(raw)) {
    const skillId = requiredString(
      skillIdRaw,
      "presentation.skills skillId"
    );
    if (!knownSkillIds.has(skillId)) {
      throw new RangeError(
        `presentation.skills references unknown skill: ${skillId}`
      );
    }
    result[skillId] = normalizeSkillPresentation(
      binding,
      `presentation.skills.${skillId}`
    );
  }

  return Object.freeze(result);
}

function normalizeCreaturePresentationMap(input, knownCreatureIds) {
  if (input == null) {
    return Object.freeze({});
  }
  const raw = plainObject(input, "presentation.creatures");
  const result = {};

  for (const [creatureIdRaw, binding] of Object.entries(raw)) {
    const creatureId = requiredString(
      creatureIdRaw,
      "presentation.creatures creatureId"
    );
    if (!knownCreatureIds.has(creatureId)) {
      throw new RangeError(
        `presentation.creatures references unknown creature: ${creatureId}`
      );
    }
    result[creatureId] = normalizeCreaturePresentation(
      binding,
      `presentation.creatures.${creatureId}`
    );
  }

  return Object.freeze(result);
}

function normalizeRoster(input, creatureById, fighterConfigIds) {
  if (input == null) {
    return null;
  }
  const raw = plainObject(input, "roster");
  const rawTeams = plainObject(raw.teams, "roster.teams");
  const teams = {};
  const seenMemberIds = new Set();

  for (const [teamIdRaw, rawTeamValue] of Object.entries(rawTeams)) {
    const teamId = requiredString(teamIdRaw, "roster teamId");
    const rawTeam = plainObject(rawTeamValue, `roster.teams.${teamId}`);
    const slotId = requiredString(
      rawTeam.slotId,
      `roster.teams.${teamId}.slotId`
    );
    if (!Array.isArray(rawTeam.members) || rawTeam.members.length === 0) {
      throw new TypeError(
        `roster.teams.${teamId}.members must be a non-empty array`
      );
    }

    const memberIds = new Set();
    const members = rawTeam.members.map((rawMemberValue, index) => {
      const field = `roster.teams.${teamId}.members[${index}]`;
      const rawMember = plainObject(rawMemberValue, field);
      const id = requiredString(rawMember.id, `${field}.id`);
      const creatureId = requiredString(
        rawMember.creatureId,
        `${field}.creatureId`
      );
      const fighterConfigId = requiredString(
        rawMember.fighterConfigId,
        `${field}.fighterConfigId`
      );
      const displayName = requiredString(
        rawMember.displayName,
        `${field}.displayName`
      );

      if (memberIds.has(id) || seenMemberIds.has(id)) {
        throw new RangeError(`duplicate roster member id: ${id}`);
      }
      memberIds.add(id);
      seenMemberIds.add(id);

      const creature = creatureById.get(creatureId);
      if (!creature) {
        throw new RangeError(
          `${field} references unknown creature: ${creatureId}`
        );
      }
      if (!fighterConfigIds.has(fighterConfigId)) {
        throw new RangeError(
          `${field} references unknown fighterConfigId: ${fighterConfigId}`
        );
      }
      if (creature.fighterConfigId !== fighterConfigId) {
        throw new RangeError(
          `${field}.fighterConfigId must match creature ${creatureId}`
        );
      }

      return Object.freeze({
        id,
        creatureId,
        displayName,
        fighterConfigId
      });
    });

    const activeMemberId = optionalString(
      rawTeam.activeMemberId,
      `roster.teams.${teamId}.activeMemberId`
    );
    if (activeMemberId !== null && !memberIds.has(activeMemberId)) {
      throw new RangeError(
        `roster.teams.${teamId}.activeMemberId references unknown member`
      );
    }

    teams[teamId] = Object.freeze({
      slotId,
      activeMemberId,
      members: Object.freeze(members)
    });
  }

  if (Object.keys(teams).length === 0) {
    throw new TypeError("roster.teams must contain at least one team");
  }

  return Object.freeze({ teams: Object.freeze(teams) });
}

function normalizeBattleFormat(input, creatureById, fighterConfigIds) {
  if (input == null) {
    return null;
  }

  const format = normalizeBattleFormatDefinition(input);

  for (const actor of format.actors) {
    const creature = creatureById.get(actor.creatureId);
    if (!creature) {
      throw new RangeError(
        `battleFormat actor ${actor.actorId} references unknown creature: ${actor.creatureId}`
      );
    }
    if (!fighterConfigIds.has(actor.fighterConfigId)) {
      throw new RangeError(
        `battleFormat actor ${actor.actorId} references unknown fighterConfigId: ${actor.fighterConfigId}`
      );
    }
    if (creature.fighterConfigId !== actor.fighterConfigId) {
      throw new RangeError(
        `battleFormat actor ${actor.actorId} fighterConfigId must match creature ${actor.creatureId}`
      );
    }
  }

  return format;
}

function normalizeMetadata(input) {
  if (input == null) {
    return Object.freeze({
      sourceId: null,
      sourceLabel: null
    });
  }
  const raw = plainObject(input, "metadata");
  return Object.freeze({
    sourceId: optionalString(raw.sourceId, "metadata.sourceId"),
    sourceLabel: optionalString(raw.sourceLabel, "metadata.sourceLabel")
  });
}

export function normalizeCaptureCombatPackage(input) {
  const raw = plainObject(input, "CaptureCombatPackageV1");

  if (raw.schema !== CAPTURE_COMBAT_PACKAGE_SCHEMA) {
    throw new RangeError(
      `schema must be "${CAPTURE_COMBAT_PACKAGE_SCHEMA}"`
    );
  }
  if (Number(raw.version) !== CAPTURE_COMBAT_PACKAGE_VERSION) {
    throw new RangeError(
      `version must be ${CAPTURE_COMBAT_PACKAGE_VERSION}`
    );
  }

  const creatures = normalizeCreatures(raw.creatures);
  const skills = normalizeSkills(raw.skills);
  const creatureById = new Map(
    creatures.map((creature) => [creature.id, creature])
  );
  const skillIds = new Set(skills.map((skill) => skill.id));
  const fighterConfigIds = new Set(
    creatures.map((creature) => creature.fighterConfigId)
  );

  for (const creature of creatures) {
    for (const skillId of creature.skillIds) {
      if (!skillIds.has(skillId)) {
        throw new RangeError(
          `creature ${creature.id} references unknown skill: ${skillId}`
        );
      }
    }
  }

  const roster = normalizeRoster(
    raw.roster,
    creatureById,
    fighterConfigIds
  );
  const battleFormat = normalizeBattleFormat(
    raw.battleFormat,
    creatureById,
    fighterConfigIds
  );

  const presentationRaw =
    raw.presentation == null
      ? {}
      : plainObject(raw.presentation, "presentation");

  const presentation = Object.freeze({
    creatures: normalizeCreaturePresentationMap(
      presentationRaw.creatures,
      new Set(creatureById.keys())
    ),
    skills: normalizeSkillPresentationMap(
      presentationRaw.skills,
      skillIds
    )
  });

  return Object.freeze({
    schema: CAPTURE_COMBAT_PACKAGE_SCHEMA,
    version: CAPTURE_COMBAT_PACKAGE_VERSION,
    metadata: normalizeMetadata(raw.metadata),
    creatures,
    skills,
    roster,
    battleFormat,
    presentation
  });
}
