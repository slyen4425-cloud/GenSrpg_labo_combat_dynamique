import {
  normalizeBattleFormatDefinition
} from "../contracts/battle-format-definition.js";
import {
  normalizeSkillDefinition
} from "../contracts/skill-definition.js";

export const DEMO_COOP_2V2_FORMAT_URL = new URL(
  "../../data/combat/battle-formats/demo-coop-2v2.format.json",
  import.meta.url
);

const DATA_URLS = Object.freeze({
  fighters: Object.freeze({
    maraileron: new URL(
      "../../data/combat/fighters/maraileron.combat.json",
      import.meta.url
    ),
    braisombre: new URL(
      "../../data/combat/fighters/braisombre.combat.json",
      import.meta.url
    ),
    loup_volcanique: new URL(
      "../../data/combat/fighters/loup_volcanique.combat.json",
      import.meta.url
    ),
    golem_moussu: new URL(
      "../../data/combat/fighters/golem_moussu.combat.json",
      import.meta.url
    )
  }),
  skills: Object.freeze([
    new URL(
      "../../data/combat/skills/fireball.skill.json",
      import.meta.url
    ),
    new URL(
      "../../data/combat/skills/claw.skill.json",
      import.meta.url
    ),
    new URL(
      "../../data/combat/skills/aerial-dive.skill.json",
      import.meta.url
    ),
    new URL(
      "../../data/combat/skills/teleport-strike.skill.json",
      import.meta.url
    )
  ]),
  loadouts: new URL(
    "../../data/combat/loadouts/demo-coop-2v2.loadouts.json",
    import.meta.url
  )
});

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }
  return response.json();
}

function requiredSkillLoadout(raw, actorId, skillsById) {
  const list = raw?.[actorId];
  if (!Array.isArray(list)) {
    throw new TypeError(
      `Missing skill loadout for actor: ${actorId}`
    );
  }

  const normalized = list.map((skillId, index) => {
    if (typeof skillId !== "string" || skillId.trim() === "") {
      throw new TypeError(
        `skillIdsByActor.${actorId}[${index}] must be a non-empty string`
      );
    }
    const id = skillId.trim();
    if (!skillsById[id]) {
      throw new RangeError(
        `Unknown skill in ${actorId} loadout: ${id}`
      );
    }
    return id;
  });

  if (new Set(normalized).size !== normalized.length) {
    throw new RangeError(
      `skillIdsByActor.${actorId} must not contain duplicates`
    );
  }

  return Object.freeze(normalized);
}

export async function loadDemoCoop2v2NativeData({
  fetchImpl = fetch,
  formatUrl = DEMO_COOP_2V2_FORMAT_URL
} = {}) {
  const [
    rawFormat,
    maraileron,
    braisombre,
    loupVolcanique,
    golemMoussu,
    rawLoadouts,
    ...rawSkills
  ] = await Promise.all([
    fetchJson(formatUrl, fetchImpl),
    fetchJson(DATA_URLS.fighters.maraileron, fetchImpl),
    fetchJson(DATA_URLS.fighters.braisombre, fetchImpl),
    fetchJson(DATA_URLS.fighters.loup_volcanique, fetchImpl),
    fetchJson(DATA_URLS.fighters.golem_moussu, fetchImpl),
    fetchJson(DATA_URLS.loadouts, fetchImpl),
    ...DATA_URLS.skills.map((url) => fetchJson(url, fetchImpl))
  ]);

  const battleFormat = normalizeBattleFormatDefinition(rawFormat);
  const skills = Object.freeze(
    Object.fromEntries(
      rawSkills.map((rawSkill) => {
        const skill = normalizeSkillDefinition(rawSkill);
        return [skill.id, skill];
      })
    )
  );
  const fighterConfigs = Object.freeze({
    maraileron: Object.freeze({ ...maraileron }),
    braisombre: Object.freeze({ ...braisombre }),
    loup_volcanique: Object.freeze({ ...loupVolcanique }),
    golem_moussu: Object.freeze({ ...golemMoussu })
  });

  const fighters = Object.freeze(
    battleFormat.actors.map((actor) => {
      const config = fighterConfigs[actor.fighterConfigId];
      if (!config) {
        throw new RangeError(
          `Unknown fighter config: ${actor.fighterConfigId}`
        );
      }
      return Object.freeze({
        ...config,
        id: actor.actorId
      });
    })
  );

  const skillIdsByActor = Object.freeze(
    Object.fromEntries(
      battleFormat.actors.map((actor) => [
        actor.actorId,
        requiredSkillLoadout(
          rawLoadouts,
          actor.actorId,
          skills
        )
      ])
    )
  );

  return Object.freeze({
    battleFormat,
    fighterConfigs,
    fighters,
    skills,
    skillIdsByActor
  });
}

export async function resolveCoop2v2NativeData({
  combatData = null,
  fetchImpl = fetch,
  formatUrl = DEMO_COOP_2V2_FORMAT_URL
} = {}) {
  if (combatData != null) {
    return combatData;
  }

  return loadDemoCoop2v2NativeData({
    fetchImpl,
    formatUrl
  });
}
