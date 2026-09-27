import { normalizeSkillDefinition } from "./skill-definition.js";

export const CAPTURE_EXPORT_VERSION = 1;

function record(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return number;
}

function nonNegativeNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number < 0) {
    throw new RangeError(`${field} must be a non-negative finite number`);
  }
  return number;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(`${field} must be a positive integer`);
  }
  return number;
}

function stringArray(value, field) {
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

function normalizeSourceStats(value, field) {
  const input = value == null ? {} : record(value, field);
  const stats = {};

  for (const [key, rawValue] of Object.entries(input)) {
    const id = requiredString(key, `${field} key`);
    stats[id] = finiteNumber(rawValue, `${field}.${id}`);
  }

  return Object.freeze(stats);
}

function normalizeCombat(value, field) {
  const input = record(value, field);

  const maxHp = nonNegativeNumber(input.maxHp, `${field}.maxHp`);
  const initialHp = nonNegativeNumber(
    input.initialHp ?? maxHp,
    `${field}.initialHp`
  );
  if (initialHp > maxHp) {
    throw new RangeError(`${field}.initialHp cannot exceed maxHp`);
  }

  const maxEnergy = nonNegativeNumber(
    input.maxEnergy,
    `${field}.maxEnergy`
  );
  const initialEnergy = nonNegativeNumber(
    input.initialEnergy ?? 0,
    `${field}.initialEnergy`
  );
  if (initialEnergy > maxEnergy) {
    throw new RangeError(
      `${field}.initialEnergy cannot exceed maxEnergy`
    );
  }

  return Object.freeze({
    maxHp,
    initialHp,
    maxEnergy,
    initialEnergy,
    energyChargeAmount: nonNegativeNumber(
      input.energyChargeAmount ?? 1,
      `${field}.energyChargeAmount`
    ),
    energyChargeIntervalMs: nonNegativeNumber(
      input.energyChargeIntervalMs ?? 2000,
      `${field}.energyChargeIntervalMs`
    ),
    movementEnergyPerStep: nonNegativeNumber(
      input.movementEnergyPerStep ?? 0,
      `${field}.movementEnergyPerStep`
    ),
    chargeTimeModifierPct: finiteNumber(
      input.chargeTimeModifierPct ?? 0,
      `${field}.chargeTimeModifierPct`
    )
  });
}

function normalizeCreature(value, index) {
  const field = `creatures[${index}]`;
  const input = record(value, field);
  const progression = input.progression == null
    ? {}
    : record(input.progression, `${field}.progression`);

  return Object.freeze({
    id: requiredString(input.id, `${field}.id`),
    displayName: requiredString(
      input.displayName,
      `${field}.displayName`
    ),
    combat: normalizeCombat(input.combat, `${field}.combat`),
    stats: normalizeSourceStats(input.stats, `${field}.stats`),
    progression: Object.freeze({
      level: positiveInteger(
        progression.level ?? 1,
        `${field}.progression.level`
      )
    }),
    skillIds: stringArray(
      input.skillIds ?? [],
      `${field}.skillIds`
    )
  });
}

function normalizeMember(value, teamIndex, memberIndex) {
  const field = `teams[${teamIndex}].members[${memberIndex}]`;
  const input = record(value, field);

  return Object.freeze({
    id: requiredString(input.id, `${field}.id`),
    creatureId: requiredString(
      input.creatureId,
      `${field}.creatureId`
    ),
    controllerId: requiredString(
      input.controllerId,
      `${field}.controllerId`
    ),
    active: input.active === true
  });
}

function normalizeTeam(value, index) {
  const field = `teams[${index}]`;
  const input = record(value, field);

  if (!Array.isArray(input.members) || input.members.length === 0) {
    throw new TypeError(`${field}.members must be a non-empty array`);
  }

  return Object.freeze({
    id: requiredString(input.id, `${field}.id`),
    members: Object.freeze(
      input.members.map((member, memberIndex) =>
        normalizeMember(member, index, memberIndex)
      )
    )
  });
}

export function normalizeCaptureExportV1(input) {
  record(input, "CaptureExportV1");

  const version = Number(input.version);
  if (version !== CAPTURE_EXPORT_VERSION) {
    throw new RangeError(
      `Unsupported CaptureExport version: ${String(input.version)}`
    );
  }

  if (!Array.isArray(input.creatures) || input.creatures.length === 0) {
    throw new TypeError("creatures must be a non-empty array");
  }
  if (!Array.isArray(input.skills)) {
    throw new TypeError("skills must be an array");
  }
  if (!Array.isArray(input.teams) || input.teams.length === 0) {
    throw new TypeError("teams must be a non-empty array");
  }

  const creatures = input.creatures.map(normalizeCreature);
  const creatureIds = new Set();
  for (const creature of creatures) {
    if (creatureIds.has(creature.id)) {
      throw new RangeError(`duplicate creature id: ${creature.id}`);
    }
    creatureIds.add(creature.id);
  }

  const skills = input.skills.map((skill) =>
    normalizeSkillDefinition(skill)
  );
  const skillIds = new Set();
  for (const skill of skills) {
    if (skillIds.has(skill.id)) {
      throw new RangeError(`duplicate skill id: ${skill.id}`);
    }
    skillIds.add(skill.id);
  }

  for (const creature of creatures) {
    for (const skillId of creature.skillIds) {
      if (!skillIds.has(skillId)) {
        throw new RangeError(
          `creature ${creature.id} references unknown skill: ${skillId}`
        );
      }
    }
  }

  const teams = input.teams.map(normalizeTeam);
  const teamIds = new Set();
  const memberIds = new Set();
  const membersById = new Map();

  for (const team of teams) {
    if (teamIds.has(team.id)) {
      throw new RangeError(`duplicate team id: ${team.id}`);
    }
    teamIds.add(team.id);

    for (const member of team.members) {
      if (memberIds.has(member.id)) {
        throw new RangeError(`duplicate member id: ${member.id}`);
      }
      memberIds.add(member.id);

      if (!creatureIds.has(member.creatureId)) {
        throw new RangeError(
          `member ${member.id} references unknown creature: ${member.creatureId}`
        );
      }

      membersById.set(member.id, member);
    }
  }

  const localMemberId = requiredString(
    input.localMemberId,
    "localMemberId"
  );
  const localMember = membersById.get(localMemberId);
  if (!localMember || localMember.active !== true) {
    throw new RangeError(
      "localMemberId must reference an active member"
    );
  }

  return Object.freeze({
    version: CAPTURE_EXPORT_VERSION,
    localMemberId,
    creatures: Object.freeze(creatures),
    skills: Object.freeze(skills),
    teams: Object.freeze(teams)
  });
}
