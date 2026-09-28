export const CAPTURE_LEGACY_ABILITY_CATALOG_SCHEMA =
  "capture-legacy-ability-catalog-v1";

export const CAPTURE_LEGACY_ABILITY_MIGRATION_STATES =
  Object.freeze([
    "portable-basic-effects",
    "requires-status-effect-v1"
  ]);

const SOURCE = Object.freeze({
  repository: "slyen4425-cloud/Zombicide-40k",
  checkpoint:
    "checkpoint/gensrpg-phase7-dungeon-generated-branch-plan-green-2026-09-27",
  commit: "49289784ee92a47fd51089815ca25954cdba4493",
  indexBlob: "74e223b2c9877e6a88b6ad6726290d230f1f616e",
  functionName: "gensCaptureExpandedAbilityRoster"
});

const ATTACK_LEVELS = Object.freeze([
  1,
  5,
  10,
  16,
  24,
  34,
  46
]);

const ATTACK_POWERS = Object.freeze([
  3,
  4,
  5,
  6,
  7,
  8,
  10
]);

const ATTACK_CATEGORIES = Object.freeze([
  "spell",
  "melee",
  "melee",
  "melee",
  "spell",
  "spell",
  "spell"
]);

const ELEMENT_GROUPS = Object.freeze([
  Object.freeze({
    id: "fire",
    label: "Feu",
    attacks: Object.freeze([
      "Étincelle",
      "Morsure ardente",
      "Charge de braise",
      "Impact flamboyant",
      "Vague incendiaire",
      "Tempête de flammes",
      "Brasier primordial"
    ]),
    specials: Object.freeze([
      Object.freeze({
        id: "cap_fire_special_1",
        name: "Cendre aveuglante",
        category: "control",
        power: 2,
        requiredLevel: 12,
        effects: Object.freeze([
          Object.freeze({
            kind: "damage",
            base: 2,
            element: "fire",
            target: "enemy"
          }),
          Object.freeze({
            kind: "debuff",
            stat: "agility",
            value: -2,
            duration: 2,
            target: "enemy"
          })
        ])
      }),
      Object.freeze({
        id: "cap_fire_special_2",
        name: "Surchauffe",
        category: "control",
        power: 6,
        requiredLevel: 28,
        effects: Object.freeze([
          Object.freeze({
            kind: "damage",
            base: 6,
            element: "fire",
            target: "enemy"
          }),
          Object.freeze({
            kind: "debuff",
            stat: "defense",
            value: -3,
            duration: 2,
            target: "enemy"
          })
        ])
      })
    ])
  }),
  Object.freeze({
    id: "water",
    label: "Eau",
    attacks: Object.freeze([
      "Goutte vive",
      "Morsure de marée",
      "Jet pressurisé",
      "Impact torrentiel",
      "Déferlante",
      "Tempête marine",
      "Raz-de-marée ancestral"
    ]),
    specials: Object.freeze([
      Object.freeze({
        id: "cap_water_special_1",
        name: "Brume apaisante",
        category: "heal",
        power: 4,
        requiredLevel: 12,
        effects: Object.freeze([
          Object.freeze({
            kind: "heal",
            base: 4,
            target: "self"
          })
        ])
      }),
      Object.freeze({
        id: "cap_water_special_2",
        name: "Voile aqueux",
        category: "defense",
        power: 0,
        requiredLevel: 28,
        effects: Object.freeze([
          Object.freeze({
            kind: "buff",
            stat: "defense",
            value: 3,
            duration: 2,
            target: "self"
          })
        ])
      })
    ])
  }),
  Object.freeze({
    id: "earth",
    label: "Terre",
    attacks: Object.freeze([
      "Jet de pierre",
      "Coup minéral",
      "Charge tellurique",
      "Impact rocheux",
      "Faille terrestre",
      "Tempête de roc",
      "Séisme primordial"
    ]),
    specials: Object.freeze([
      Object.freeze({
        id: "cap_earth_special_1",
        name: "Peau de pierre",
        category: "defense",
        power: 0,
        requiredLevel: 12,
        effects: Object.freeze([
          Object.freeze({
            kind: "buff",
            stat: "defense",
            value: 3,
            duration: 3,
            target: "self"
          })
        ])
      }),
      Object.freeze({
        id: "cap_earth_special_2",
        name: "Entrave racinaire",
        category: "control",
        power: 2,
        requiredLevel: 28,
        effects: Object.freeze([
          Object.freeze({
            kind: "damage",
            base: 2,
            element: "earth",
            target: "enemy"
          }),
          Object.freeze({
            kind: "debuff",
            stat: "speed",
            value: -4,
            duration: 2,
            target: "enemy"
          })
        ])
      })
    ])
  }),
  Object.freeze({
    id: "air",
    label: "Air",
    attacks: Object.freeze([
      "Souffle",
      "Lame de vent",
      "Charge aérienne",
      "Piqué cyclonique",
      "Rafale majeure",
      "Tempête céleste",
      "Ouragan primordial"
    ]),
    specials: Object.freeze([
      Object.freeze({
        id: "cap_air_special_1",
        name: "Vent arrière",
        category: "defense",
        power: 0,
        requiredLevel: 12,
        effects: Object.freeze([
          Object.freeze({
            kind: "buff",
            stat: "speed",
            value: 4,
            duration: 2,
            target: "self"
          })
        ])
      }),
      Object.freeze({
        id: "cap_air_special_2",
        name: "Danse aérienne",
        category: "defense",
        power: 0,
        requiredLevel: 28,
        effects: Object.freeze([
          Object.freeze({
            kind: "buff",
            stat: "agility",
            value: 4,
            duration: 2,
            target: "self"
          })
        ])
      })
    ])
  }),
  Object.freeze({
    id: "electric",
    label: "Électricité",
    attacks: Object.freeze([
      "Étincelle statique",
      "Crocs voltés",
      "Charge éclair",
      "Impact foudroyant",
      "Arc majeur",
      "Orage furieux",
      "Foudre primordiale"
    ]),
    specials: Object.freeze([
      Object.freeze({
        id: "cap_electric_special_1",
        name: "Onde paralysante",
        category: "control",
        power: 1,
        requiredLevel: 12,
        effects: Object.freeze([
          Object.freeze({
            kind: "damage",
            base: 1,
            element: "electric",
            target: "enemy"
          }),
          Object.freeze({
            kind: "debuff",
            stat: "speed",
            value: -5,
            duration: 2,
            target: "enemy"
          })
        ])
      }),
      Object.freeze({
        id: "cap_electric_special_2",
        name: "Surcharge",
        category: "control",
        power: 5,
        requiredLevel: 28,
        effects: Object.freeze([
          Object.freeze({
            kind: "damage",
            base: 5,
            element: "electric",
            target: "enemy"
          }),
          Object.freeze({
            kind: "debuff",
            stat: "defense",
            value: -2,
            duration: 2,
            target: "enemy"
          })
        ])
      })
    ])
  }),
  Object.freeze({
    id: "light",
    label: "Lumière",
    attacks: Object.freeze([
      "Lueur",
      "Rayon clair",
      "Charge solaire",
      "Impact radiant",
      "Onde lumineuse",
      "Tempête astrale",
      "Jugement solaire"
    ]),
    specials: Object.freeze([
      Object.freeze({
        id: "cap_light_special_1",
        name: "Soin lumineux",
        category: "heal",
        power: 5,
        requiredLevel: 12,
        effects: Object.freeze([
          Object.freeze({
            kind: "heal",
            base: 5,
            target: "self"
          })
        ])
      }),
      Object.freeze({
        id: "cap_light_special_2",
        name: "Éblouissement",
        category: "control",
        power: 1,
        requiredLevel: 28,
        effects: Object.freeze([
          Object.freeze({
            kind: "damage",
            base: 1,
            element: "light",
            target: "enemy"
          }),
          Object.freeze({
            kind: "debuff",
            stat: "agility",
            value: -4,
            duration: 2,
            target: "enemy"
          })
        ])
      })
    ])
  }),
  Object.freeze({
    id: "shadow",
    label: "Ombre",
    attacks: Object.freeze([
      "Ombre vive",
      "Crocs obscurs",
      "Charge nocturne",
      "Impact spectral",
      "Onde noire",
      "Tempête abyssale",
      "Nuit primordiale"
    ]),
    specials: Object.freeze([
      Object.freeze({
        id: "cap_shadow_special_1",
        name: "Drain nocturne",
        category: "control",
        power: 3,
        requiredLevel: 12,
        effects: Object.freeze([
          Object.freeze({
            kind: "damage",
            base: 3,
            element: "shadow",
            target: "enemy"
          }),
          Object.freeze({
            kind: "heal",
            base: 2,
            target: "self"
          })
        ])
      }),
      Object.freeze({
        id: "cap_shadow_special_2",
        name: "Voile nocturne",
        category: "defense",
        power: 0,
        requiredLevel: 28,
        effects: Object.freeze([
          Object.freeze({
            kind: "buff",
            stat: "agility",
            value: 4,
            duration: 2,
            target: "self"
          })
        ])
      })
    ])
  }),
  Object.freeze({
    id: "poison",
    label: "Poison",
    attacks: Object.freeze([
      "Dard toxique",
      "Morsure venimeuse",
      "Jet acide",
      "Impact toxique",
      "Nuage corrosif",
      "Tempête de venin",
      "Fléau primordial"
    ]),
    specials: Object.freeze([
      Object.freeze({
        id: "cap_poison_special_1",
        name: "Venin persistant",
        category: "control",
        power: 2,
        requiredLevel: 12,
        effects: Object.freeze([
          Object.freeze({
            kind: "damage",
            base: 1,
            element: "poison",
            target: "enemy"
          }),
          Object.freeze({
            kind: "dot",
            base: 2,
            value: 2,
            duration: 3,
            element: "poison",
            target: "enemy"
          })
        ])
      }),
      Object.freeze({
        id: "cap_poison_special_2",
        name: "Brouillard toxique",
        category: "control",
        power: 2,
        requiredLevel: 28,
        effects: Object.freeze([
          Object.freeze({
            kind: "damage",
            base: 2,
            element: "poison",
            target: "enemy"
          }),
          Object.freeze({
            kind: "debuff",
            stat: "power",
            value: -3,
            duration: 3,
            target: "enemy"
          })
        ])
      })
    ])
  })
]);

const NEUTRAL_SPECS = Object.freeze([
  Object.freeze({
    id: "cap_neutral_1",
    name: "Coup vif",
    category: "melee",
    power: 3,
    requiredLevel: 1,
    effects: Object.freeze([
      Object.freeze({
        kind: "damage",
        base: 3,
        target: "enemy"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_2",
    name: "Charge",
    category: "melee",
    power: 4,
    requiredLevel: 4,
    effects: Object.freeze([
      Object.freeze({
        kind: "damage",
        base: 4,
        target: "enemy"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_3",
    name: "Feinte",
    category: "melee",
    power: 3,
    requiredLevel: 8,
    effects: Object.freeze([
      Object.freeze({
        kind: "damage",
        base: 3,
        target: "enemy"
      }),
      Object.freeze({
        kind: "debuff",
        stat: "defense",
        value: -1,
        duration: 2,
        target: "enemy"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_4",
    name: "Concentration",
    category: "utility",
    power: 0,
    requiredLevel: 10,
    effects: Object.freeze([
      Object.freeze({
        kind: "buff",
        stat: "agility",
        value: 2,
        duration: 2,
        target: "self"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_5",
    name: "Coup lourd",
    category: "melee",
    power: 6,
    requiredLevel: 14,
    effects: Object.freeze([
      Object.freeze({
        kind: "damage",
        base: 6,
        target: "enemy"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_6",
    name: "Garde",
    category: "utility",
    power: 0,
    requiredLevel: 18,
    effects: Object.freeze([
      Object.freeze({
        kind: "buff",
        stat: "defense",
        value: 4,
        duration: 2,
        target: "self"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_7",
    name: "Percée",
    category: "melee",
    power: 6,
    requiredLevel: 22,
    effects: Object.freeze([
      Object.freeze({
        kind: "damage",
        base: 6,
        target: "enemy"
      }),
      Object.freeze({
        kind: "debuff",
        stat: "defense",
        value: -2,
        duration: 2,
        target: "enemy"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_8",
    name: "Récupération",
    category: "melee",
    power: 6,
    requiredLevel: 26,
    effects: Object.freeze([
      Object.freeze({
        kind: "heal",
        base: 6,
        target: "self"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_9",
    name: "Furie",
    category: "melee",
    power: 8,
    requiredLevel: 32,
    effects: Object.freeze([
      Object.freeze({
        kind: "damage",
        base: 8,
        target: "enemy"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_10",
    name: "Instinct supérieur",
    category: "utility",
    power: 0,
    requiredLevel: 38,
    effects: Object.freeze([
      Object.freeze({
        kind: "buff",
        stat: "agility",
        value: 5,
        duration: 2,
        target: "self"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_11",
    name: "Impact ultime",
    category: "melee",
    power: 10,
    requiredLevel: 45,
    effects: Object.freeze([
      Object.freeze({
        kind: "damage",
        base: 10,
        target: "enemy"
      })
    ])
  }),
  Object.freeze({
    id: "cap_neutral_12",
    name: "Dernier recours",
    category: "melee",
    power: 12,
    requiredLevel: 55,
    effects: Object.freeze([
      Object.freeze({
        kind: "damage",
        base: 12,
        target: "enemy"
      })
    ])
  })
]);

const STATUS_EFFECT_KINDS = new Set([
  "buff",
  "debuff",
  "dot"
]);

const EDITOR_CATEGORY_BY_LEGACY =
  Object.freeze({
    melee: "offensive",
    spell: "offensive",
    control: "buff_debuff",
    defense: "defensive",
    utility: "buff_debuff",
    heal: "heal"
  });

function freezeArray(values) {
  return Object.freeze([...values]);
}

function historicalBase({
  id,
  name,
  category,
  desc,
  element,
  power,
  requiredLevel,
  effects
}) {
  return Object.freeze({
    id,
    name,
    category,
    type: "active",
    desc,
    element,
    power,
    requiredLevel,
    effects: freezeArray(effects),
    activeMeta: Object.freeze({
      manaCost: 0,
      weapon: "",
      cooldown: 0
    }),
    usageScopes: Object.freeze([
      "captureCreature",
      "enemy"
    ]),
    builtin: true,
    builtinCreature: true,
    captureRoster: true
  });
}

function elementalAttack(group, index) {
  const power = ATTACK_POWERS[index];
  const level = ATTACK_LEVELS[index];

  return historicalBase({
    id: `cap_${group.id}_atk_${index + 1}`,
    name: group.attacks[index],
    category: ATTACK_CATEGORIES[index],
    desc:
      `Attaque ${group.label} de puissance ${power}. Disponible au niveau ${level}.`,
    element: group.id,
    power,
    requiredLevel: level,
    effects: [
      Object.freeze({
        kind: "damage",
        base: power,
        element: group.id,
        target: "enemy"
      })
    ]
  });
}

function elementalSpecial(group, spec) {
  return historicalBase({
    id: spec.id,
    name: spec.name,
    category: spec.category,
    desc:
      `Technique ${group.label} utilitaire. Disponible au niveau ${spec.requiredLevel}.`,
    element: group.id,
    power: spec.power,
    requiredLevel: spec.requiredLevel,
    effects: spec.effects
  });
}

function neutralAbility(spec) {
  return historicalBase({
    id: spec.id,
    name: spec.name,
    category: spec.category,
    desc:
      `Technique neutre de puissance ${spec.power === 0 ? "—" : spec.power}. Disponible au niveau ${spec.requiredLevel}.`,
    element: "",
    power: spec.power,
    requiredLevel: spec.requiredLevel,
    effects: spec.effects
  });
}

function buildHistoricalRoster() {
  const abilities = [];

  for (const group of ELEMENT_GROUPS) {
    for (let index = 0; index < 7; index += 1) {
      abilities.push(
        elementalAttack(group, index)
      );
    }

    for (const special of group.specials) {
      abilities.push(
        elementalSpecial(group, special)
      );
    }
  }

  for (const spec of NEUTRAL_SPECS) {
    abilities.push(
      neutralAbility(spec)
    );
  }

  return Object.freeze(abilities);
}

export const CAPTURE_LEGACY_ABILITY_CATALOG_V1 =
  Object.freeze({
    schema:
      CAPTURE_LEGACY_ABILITY_CATALOG_SCHEMA,
    source: SOURCE,
    abilities: buildHistoricalRoster()
  });

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(
      `${field} must be an object`
    );
  }
  return value;
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(
      `${field} must be a non-empty string`
    );
  }
  return value.trim();
}

function finiteNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(
      `${field} must be a finite number`
    );
  }
  return value;
}

function normalizeEffect(raw, index) {
  const value = objectValue(
    raw,
    `effects[${index}]`
  );

  const output = {
    kind: requiredString(
      value.kind,
      `effects[${index}].kind`
    )
  };

  for (const key of [
    "base",
    "value",
    "duration"
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(
        value,
        key
      )
    ) {
      output[key] = finiteNumber(
        value[key],
        `effects[${index}].${key}`
      );
    }
  }

  for (const key of [
    "element",
    "target",
    "stat"
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(
        value,
        key
      )
    ) {
      if (typeof value[key] !== "string") {
        throw new TypeError(
          `effects[${index}].${key} must be a string`
        );
      }
      output[key] = value[key];
    }
  }

  return Object.freeze(output);
}

function normalizeAbility(raw, index) {
  const value = objectValue(
    raw,
    `abilities[${index}]`
  );

  if (!Array.isArray(value.effects)) {
    throw new TypeError(
      `abilities[${index}].effects must be an array`
    );
  }

  return Object.freeze({
    id: requiredString(
      value.id,
      `abilities[${index}].id`
    ),
    name: requiredString(
      value.name,
      `abilities[${index}].name`
    ),
    category: requiredString(
      value.category,
      `abilities[${index}].category`
    ),
    type: requiredString(
      value.type,
      `abilities[${index}].type`
    ),
    desc:
      typeof value.desc === "string"
        ? value.desc
        : (() => {
            throw new TypeError(
              `abilities[${index}].desc must be a string`
            );
          })(),
    element:
      typeof value.element === "string"
        ? value.element
        : (() => {
            throw new TypeError(
              `abilities[${index}].element must be a string`
            );
          })(),
    power: finiteNumber(
      value.power,
      `abilities[${index}].power`
    ),
    requiredLevel: finiteNumber(
      value.requiredLevel,
      `abilities[${index}].requiredLevel`
    ),
    effects: Object.freeze(
      value.effects.map(normalizeEffect)
    ),
    activeMeta: Object.freeze({
      manaCost: finiteNumber(
        value.activeMeta?.manaCost,
        `abilities[${index}].activeMeta.manaCost`
      ),
      weapon:
        typeof value.activeMeta?.weapon === "string"
          ? value.activeMeta.weapon
          : (() => {
              throw new TypeError(
                `abilities[${index}].activeMeta.weapon must be a string`
              );
            })(),
      cooldown: finiteNumber(
        value.activeMeta?.cooldown,
        `abilities[${index}].activeMeta.cooldown`
      )
    }),
    usageScopes: freezeArray(
      (value.usageScopes ?? []).map(
        (scope, scopeIndex) =>
          requiredString(
            scope,
            `abilities[${index}].usageScopes[${scopeIndex}]`
          )
      )
    ),
    builtin: value.builtin === true,
    builtinCreature:
      value.builtinCreature === true,
    captureRoster:
      value.captureRoster === true
  });
}

export function normalizeCaptureLegacyAbilityCatalogV1(
  input
) {
  const value = objectValue(
    input,
    "CaptureLegacyAbilityCatalogV1"
  );

  if (
    value.schema !==
    CAPTURE_LEGACY_ABILITY_CATALOG_SCHEMA
  ) {
    throw new RangeError(
      `schema must be ${CAPTURE_LEGACY_ABILITY_CATALOG_SCHEMA}`
    );
  }

  if (!Array.isArray(value.abilities)) {
    throw new TypeError(
      "abilities must be an array"
    );
  }

  const abilities = value.abilities.map(
    normalizeAbility
  );
  const ids = abilities.map(
    (ability) => ability.id
  );

  if (new Set(ids).size !== ids.length) {
    throw new RangeError(
      "ability ids must not contain duplicate values"
    );
  }

  return Object.freeze({
    schema:
      CAPTURE_LEGACY_ABILITY_CATALOG_SCHEMA,
    source: Object.freeze({
      repository: requiredString(
        value.source?.repository,
        "source.repository"
      ),
      checkpoint: requiredString(
        value.source?.checkpoint,
        "source.checkpoint"
      ),
      commit: requiredString(
        value.source?.commit,
        "source.commit"
      ),
      indexBlob: requiredString(
        value.source?.indexBlob,
        "source.indexBlob"
      ),
      functionName: requiredString(
        value.source?.functionName,
        "source.functionName"
      )
    }),
    abilities: Object.freeze(abilities)
  });
}

export function classifyCaptureLegacyAbilityV1(
  input
) {
  const value = objectValue(
    input,
    "CaptureLegacyAbilityV1"
  );

  const effects = Array.isArray(
    value.effects
  )
    ? value.effects
    : [];

  return effects.some(
    (effect) =>
      STATUS_EFFECT_KINDS.has(
        requiredString(
          effect.kind,
          "effect.kind"
        )
      )
  )
    ? "requires-status-effect-v1"
    : "portable-basic-effects";
}

function sumEffectBase(
  effects,
  kind
) {
  return effects
    .filter(
      (effect) =>
        effect.kind === kind
    )
    .reduce(
      (sum, effect) =>
        sum +
        finiteNumber(
          effect.base ?? 0,
          "effect.base"
        ),
      0
    );
}

export function captureLegacyAbilityTemplateV1(
  input
) {
  const ability = normalizeAbility(
    input,
    0
  );

  return Object.freeze({
    id: ability.id,
    name: ability.name,
    description: ability.desc,
    category:
      EDITOR_CATEGORY_BY_LEGACY[
        ability.category
      ],
    element:
      ability.element === ""
        ? null
        : ability.element,
    requiredLevel:
      ability.requiredLevel,
    effect: Object.freeze({
      damage: sumEffectBase(
        ability.effects,
        "damage"
      ),
      heal: sumEffectBase(
        ability.effects,
        "heal"
      )
    }),
    migrationState:
      classifyCaptureLegacyAbilityV1(
        ability
      ),
    legacySourceCategory:
      ability.category,
    legacyStatusEffects:
      Object.freeze(
        ability.effects.filter(
          (effect) =>
            STATUS_EFFECT_KINDS.has(
              effect.kind
            )
        )
      )
  });
}
