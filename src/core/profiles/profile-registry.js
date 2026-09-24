const REQUIRED_SECTIONS = ["idle", "attack", "hit", "ko"];

export function validateCreatureProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new TypeError("Creature profile must be an object");
  }
  if (typeof profile.id !== "string" || profile.id.trim() === "") {
    throw new TypeError("Creature profile id must be a non-empty string");
  }
  for (const section of REQUIRED_SECTIONS) {
    if (!profile[section] || typeof profile[section] !== "object") {
      throw new TypeError(`Creature profile requires ${section}`);
    }
  }
  return profile;
}

export function createProfileRegistry(profiles = []) {
  const map = new Map();

  for (const profile of profiles) {
    validateCreatureProfile(profile);
    if (map.has(profile.id)) {
      throw new Error(`Duplicate creature profile: ${profile.id}`);
    }
    map.set(profile.id, Object.freeze(structuredClone(profile)));
  }

  return Object.freeze({
    get(id) {
      if (!map.has(id)) {
        throw new RangeError(`Unknown creature profile: ${id}`);
      }
      return map.get(id);
    },
    has(id) {
      return map.has(id);
    },
    ids() {
      return Object.freeze([...map.keys()]);
    }
  });
}
