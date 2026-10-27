export const CAPTURE_USED_ABILITY_CATALOG_V2_SCHEMA =
  "capture-used-ability-catalog-v2";

export const CAPTURE_USED_ABILITY_MIGRATION_STATES_V2 =
  Object.freeze([
    "portable-basic-effects",
    "requires-status-effect-v1"
  ]);

const SOURCE = Object.freeze({
  sourceId: "mc162-used-creature-abilities",
  commit: "49289784ee92a47fd51089815ca25954cdba4493",
  indexBlob: "74e223b2c9877e6a88b6ad6726290d230f1f616e",
  abilityTable: "MC162_ABILITIES",
  entityTable: "MC162_ENTITIES"
});

const STATUS_EFFECT_KINDS = new Set([
  "buff",
  "debuff",
  "dot",
  "hot"
]);

const EDITOR_CATEGORY_BY_LEGACY = Object.freeze({
  melee: "offensive",
  ranged: "offensive",
  spell: "offensive",
  control: "buff_debuff",
  defense: "defensive",
  utility: "buff_debuff",
  heal: "heal"
});

const RAW_ABILITIES = [{"id":"lib_fire_bolt","name":"Étincelle ardente","category":"spell","type":"active","desc":"Projectile de feu rapide.","element":"fire","effects":[{"kind":"damage","base":3,"element":"fire"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":3,"requiredLevel":1},{"id":"lib_fireball","name":"Boule de braise","category":"spell","type":"active","desc":"Explosion de feu plus puissante.","element":"fire","effects":[{"kind":"damage","base":5,"element":"fire"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":5,"requiredLevel":10},{"id":"lib_flame_bite","name":"Morsure brûlante","category":"melee","type":"active","desc":"Morsure physique chargée de feu.","element":"fire","effects":[{"kind":"damage","base":4,"element":"fire"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_heat_wave","name":"Vague de chaleur","category":"control","type":"active","desc":"Affaiblit temporairement la défense adverse.","element":"fire","effects":[{"kind":"debuff","stat":"defense","value":-2,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_water_bolt","name":"Jet d’eau","category":"ranged","type":"active","desc":"Attaque d’eau à distance.","element":"water","effects":[{"kind":"damage","base":3,"element":"water"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":3,"requiredLevel":1},{"id":"lib_tidal_bite","name":"Morsure de marée","category":"melee","type":"active","desc":"Frappe aquatique lourde.","element":"water","effects":[{"kind":"damage","base":4,"element":"water"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_aqua_heal","name":"Onde régénérante","category":"heal","type":"active","desc":"Rend des PV à une cible alliée.","element":"water","effects":[{"kind":"heal","base":4}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_mist_guard","name":"Brume protectrice","category":"defense","type":"active","desc":"Augmente temporairement la défense.","element":"water","effects":[{"kind":"buff","stat":"defense","value":2,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_rock_slam","name":"Impact rocheux","category":"melee","type":"active","desc":"Coup de roche puissant.","element":"earth","effects":[{"kind":"damage","base":5,"element":"earth"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":5,"requiredLevel":10},{"id":"lib_earth_guard","name":"Carapace minérale","category":"defense","type":"active","desc":"Renforce l’armure temporairement.","element":"earth","effects":[{"kind":"buff","stat":"armor","value":2,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_root_snare","name":"Entrave racinaire","category":"control","type":"active","desc":"Réduit le déplacement / l’agilité de la cible.","element":"earth","effects":[{"kind":"debuff","stat":"agilite","value":-2,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_quake","name":"Secousse","category":"spell","type":"active","desc":"Attaque de zone terrestre.","element":"earth","effects":[{"kind":"damage","base":4,"element":"earth","target":"zone"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_chain_lightning","name":"Arc électrique","category":"spell","type":"active","desc":"Éclair pouvant se propager.","element":"electric","effects":[{"kind":"damage","base":4,"element":"electric"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_static_bite","name":"Crocs statiques","category":"melee","type":"active","desc":"Morsure électrique.","element":"electric","effects":[{"kind":"damage","base":3,"element":"electric"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":3,"requiredLevel":1},{"id":"lib_thunder_dash","name":"Charge foudroyante","category":"melee","type":"active","desc":"Attaque rapide utilisant l’agilité.","element":"electric","effects":[{"kind":"damage","base":4,"element":"electric"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_paralyze","name":"Paralysie","category":"control","type":"active","desc":"Réduit fortement l’initiative adverse.","element":"electric","effects":[{"kind":"debuff","stat":"initiative","value":-4,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_gust","name":"Rafale","category":"ranged","type":"active","desc":"Attaque d’air à distance.","element":"air","effects":[{"kind":"damage","base":3,"element":"air"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":3,"requiredLevel":1},{"id":"lib_wind_blade","name":"Lame de vent","category":"ranged","type":"active","desc":"Tranche à distance avec une lame d’air.","element":"air","effects":[{"kind":"damage","base":4,"element":"air"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_aerial_dive","name":"Piqué","category":"melee","type":"active","desc":"Attaque rapide depuis les airs.","element":"air","effects":[{"kind":"damage","base":4,"element":"air"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_tailwind","name":"Vent arrière","category":"utility","type":"active","desc":"Augmente temporairement initiative et agilité.","element":"air","effects":[{"kind":"buff","stat":"initiative","value":3,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_light_bolt","name":"Rayon lumineux","category":"spell","type":"active","desc":"Attaque de lumière.","element":"light","effects":[{"kind":"damage","base":3,"element":"light"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":3,"requiredLevel":1},{"id":"lib_heal_5","name":"Lueur réparatrice","category":"heal","type":"active","desc":"Rend 5 PV.","element":"light","effects":[{"kind":"heal","base":5}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_magic_barrier","name":"Barrière lumineuse","category":"defense","type":"active","desc":"Protège la cible.","element":"light","effects":[{"kind":"buff","stat":"defense","value":3,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_flash","name":"Éblouissement","category":"control","type":"active","desc":"Réduit précision et initiative.","element":"light","effects":[{"kind":"debuff","stat":"initiative","value":-2,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_shadow_bite","name":"Morsure obscure","category":"melee","type":"active","desc":"Attaque d’ombre au contact.","element":"shadow","effects":[{"kind":"damage","base":4,"element":"shadow"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_drain","name":"Drain d’ombre","category":"spell","type":"active","desc":"Inflige des dégâts et affaiblit la cible.","element":"shadow","effects":[{"kind":"damage","base":3,"element":"shadow"},{"kind":"debuff","stat":"force","value":-2,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":3,"requiredLevel":1},{"id":"lib_lifesteal_strike","name":"Frappe vampirique","category":"melee","type":"active","desc":"Blesse puis rend une partie des PV.","element":"shadow","effects":[{"kind":"damage","base":4,"element":"shadow"},{"kind":"heal","base":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_night_veil","name":"Voile nocturne","category":"defense","type":"active","desc":"Augmente temporairement l’esquive.","element":"shadow","effects":[{"kind":"buff","stat":"agilite","value":3,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"lib_guard_break","name":"Brise-garde","category":"melee","type":"active","desc":"Réduit la défense.","element":"","effects":[{"kind":"damage","base":3},{"kind":"debuff","stat":"defense","value":-2,"duration":2}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":3,"requiredLevel":1},{"id":"lib_stunning_blow","name":"Coup étourdissant","category":"melee","type":"active","desc":"Frappe lourde qui ralentit la cible.","element":"","effects":[{"kind":"damage","base":4},{"kind":"debuff","stat":"initiative","value":-3,"duration":1}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":4,"requiredLevel":5},{"id":"lib_regen","name":"Régénération","category":"heal","type":"active","desc":"Rend progressivement des PV.","element":"","effects":[{"kind":"hot","base":2,"duration":3}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"libraryId":"creature","power":0,"requiredLevel":1},{"id":"cap_fire_atk_1","name":"Étincelle","category":"spell","type":"active","desc":"Attaque Feu de puissance 3. Disponible au niveau 1.","element":"fire","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_fire_atk_2","name":"Morsure ardente","category":"melee","type":"active","desc":"Attaque Feu de puissance 4. Disponible au niveau 5.","element":"fire","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_fire_atk_3","name":"Charge de braise","category":"melee","type":"active","desc":"Attaque Feu de puissance 5. Disponible au niveau 10.","element":"fire","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_fire_atk_4","name":"Impact flamboyant","category":"melee","type":"active","desc":"Attaque Feu de puissance 6. Disponible au niveau 16.","element":"fire","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_fire_atk_5","name":"Vague incendiaire","category":"spell","type":"active","desc":"Attaque Feu de puissance 7. Disponible au niveau 24.","element":"fire","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_fire_atk_6","name":"Tempête de flammes","category":"spell","type":"active","desc":"Attaque Feu de puissance 8. Disponible au niveau 34.","element":"fire","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_fire_atk_7","name":"Brasier primordial","category":"spell","type":"active","desc":"Attaque Feu de puissance 10. Disponible au niveau 46.","element":"fire","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_fire_special_1","name":"Cendre aveuglante","category":"control","type":"active","desc":"Technique Feu utilitaire. Disponible au niveau 12.","element":"fire","power":2,"requiredLevel":12,"effects":[{"kind":"damage","base":2,"element":"fire","target":"enemy"},{"kind":"debuff","stat":"agility","value":-2,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_fire_special_2","name":"Surchauffe","category":"control","type":"active","desc":"Technique Feu utilitaire. Disponible au niveau 28.","element":"fire","power":6,"requiredLevel":28,"effects":[{"kind":"damage","base":6,"element":"fire","target":"enemy"},{"kind":"debuff","stat":"defense","value":-3,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_water_atk_1","name":"Goutte vive","category":"spell","type":"active","desc":"Attaque Eau de puissance 3. Disponible au niveau 1.","element":"water","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_water_atk_2","name":"Morsure de marée","category":"melee","type":"active","desc":"Attaque Eau de puissance 4. Disponible au niveau 5.","element":"water","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_water_atk_3","name":"Jet pressurisé","category":"melee","type":"active","desc":"Attaque Eau de puissance 5. Disponible au niveau 10.","element":"water","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_water_atk_4","name":"Impact torrentiel","category":"melee","type":"active","desc":"Attaque Eau de puissance 6. Disponible au niveau 16.","element":"water","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_water_atk_5","name":"Déferlante","category":"spell","type":"active","desc":"Attaque Eau de puissance 7. Disponible au niveau 24.","element":"water","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_water_atk_6","name":"Tempête marine","category":"spell","type":"active","desc":"Attaque Eau de puissance 8. Disponible au niveau 34.","element":"water","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_water_atk_7","name":"Raz-de-marée ancestral","category":"spell","type":"active","desc":"Attaque Eau de puissance 10. Disponible au niveau 46.","element":"water","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_water_special_1","name":"Brume apaisante","category":"heal","type":"active","desc":"Technique Eau utilitaire. Disponible au niveau 12.","element":"water","power":4,"requiredLevel":12,"effects":[{"kind":"heal","base":4,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_water_special_2","name":"Voile aqueux","category":"defense","type":"active","desc":"Technique Eau utilitaire. Disponible au niveau 28.","element":"water","power":0,"requiredLevel":28,"effects":[{"kind":"buff","stat":"defense","value":3,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_earth_atk_1","name":"Jet de pierre","category":"spell","type":"active","desc":"Attaque Terre de puissance 3. Disponible au niveau 1.","element":"earth","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_earth_atk_2","name":"Coup minéral","category":"melee","type":"active","desc":"Attaque Terre de puissance 4. Disponible au niveau 5.","element":"earth","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_earth_atk_3","name":"Charge tellurique","category":"melee","type":"active","desc":"Attaque Terre de puissance 5. Disponible au niveau 10.","element":"earth","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_earth_atk_4","name":"Impact rocheux","category":"melee","type":"active","desc":"Attaque Terre de puissance 6. Disponible au niveau 16.","element":"earth","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_earth_atk_5","name":"Faille terrestre","category":"spell","type":"active","desc":"Attaque Terre de puissance 7. Disponible au niveau 24.","element":"earth","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_earth_atk_6","name":"Tempête de roc","category":"spell","type":"active","desc":"Attaque Terre de puissance 8. Disponible au niveau 34.","element":"earth","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_earth_atk_7","name":"Séisme primordial","category":"spell","type":"active","desc":"Attaque Terre de puissance 10. Disponible au niveau 46.","element":"earth","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_earth_special_1","name":"Peau de pierre","category":"defense","type":"active","desc":"Technique Terre utilitaire. Disponible au niveau 12.","element":"earth","power":0,"requiredLevel":12,"effects":[{"kind":"buff","stat":"defense","value":3,"duration":3,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_earth_special_2","name":"Entrave racinaire","category":"control","type":"active","desc":"Technique Terre utilitaire. Disponible au niveau 28.","element":"earth","power":2,"requiredLevel":28,"effects":[{"kind":"damage","base":2,"element":"earth","target":"enemy"},{"kind":"debuff","stat":"speed","value":-4,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_air_atk_1","name":"Souffle","category":"spell","type":"active","desc":"Attaque Air de puissance 3. Disponible au niveau 1.","element":"air","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_air_atk_2","name":"Lame de vent","category":"melee","type":"active","desc":"Attaque Air de puissance 4. Disponible au niveau 5.","element":"air","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_air_atk_3","name":"Charge aérienne","category":"melee","type":"active","desc":"Attaque Air de puissance 5. Disponible au niveau 10.","element":"air","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_air_atk_4","name":"Piqué cyclonique","category":"melee","type":"active","desc":"Attaque Air de puissance 6. Disponible au niveau 16.","element":"air","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_air_atk_5","name":"Rafale majeure","category":"spell","type":"active","desc":"Attaque Air de puissance 7. Disponible au niveau 24.","element":"air","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_air_atk_6","name":"Tempête céleste","category":"spell","type":"active","desc":"Attaque Air de puissance 8. Disponible au niveau 34.","element":"air","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_air_atk_7","name":"Ouragan primordial","category":"spell","type":"active","desc":"Attaque Air de puissance 10. Disponible au niveau 46.","element":"air","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_air_special_1","name":"Vent arrière","category":"defense","type":"active","desc":"Technique Air utilitaire. Disponible au niveau 12.","element":"air","power":0,"requiredLevel":12,"effects":[{"kind":"buff","stat":"speed","value":4,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_air_special_2","name":"Danse aérienne","category":"defense","type":"active","desc":"Technique Air utilitaire. Disponible au niveau 28.","element":"air","power":0,"requiredLevel":28,"effects":[{"kind":"buff","stat":"agility","value":4,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_electric_atk_1","name":"Étincelle statique","category":"spell","type":"active","desc":"Attaque Électricité de puissance 3. Disponible au niveau 1.","element":"electric","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_electric_atk_2","name":"Crocs voltés","category":"melee","type":"active","desc":"Attaque Électricité de puissance 4. Disponible au niveau 5.","element":"electric","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_electric_atk_3","name":"Charge éclair","category":"melee","type":"active","desc":"Attaque Électricité de puissance 5. Disponible au niveau 10.","element":"electric","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_electric_atk_4","name":"Impact foudroyant","category":"melee","type":"active","desc":"Attaque Électricité de puissance 6. Disponible au niveau 16.","element":"electric","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_electric_atk_5","name":"Arc majeur","category":"spell","type":"active","desc":"Attaque Électricité de puissance 7. Disponible au niveau 24.","element":"electric","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_electric_atk_6","name":"Orage furieux","category":"spell","type":"active","desc":"Attaque Électricité de puissance 8. Disponible au niveau 34.","element":"electric","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_electric_atk_7","name":"Foudre primordiale","category":"spell","type":"active","desc":"Attaque Électricité de puissance 10. Disponible au niveau 46.","element":"electric","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_electric_special_1","name":"Onde paralysante","category":"control","type":"active","desc":"Technique Électricité utilitaire. Disponible au niveau 12.","element":"electric","power":1,"requiredLevel":12,"effects":[{"kind":"damage","base":1,"element":"electric","target":"enemy"},{"kind":"debuff","stat":"speed","value":-5,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_electric_special_2","name":"Surcharge","category":"control","type":"active","desc":"Technique Électricité utilitaire. Disponible au niveau 28.","element":"electric","power":5,"requiredLevel":28,"effects":[{"kind":"damage","base":5,"element":"electric","target":"enemy"},{"kind":"debuff","stat":"defense","value":-2,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_light_atk_1","name":"Lueur","category":"spell","type":"active","desc":"Attaque Lumière de puissance 3. Disponible au niveau 1.","element":"light","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_light_atk_2","name":"Rayon clair","category":"melee","type":"active","desc":"Attaque Lumière de puissance 4. Disponible au niveau 5.","element":"light","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_light_atk_3","name":"Charge solaire","category":"melee","type":"active","desc":"Attaque Lumière de puissance 5. Disponible au niveau 10.","element":"light","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_light_atk_4","name":"Impact radiant","category":"melee","type":"active","desc":"Attaque Lumière de puissance 6. Disponible au niveau 16.","element":"light","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_light_atk_5","name":"Onde lumineuse","category":"spell","type":"active","desc":"Attaque Lumière de puissance 7. Disponible au niveau 24.","element":"light","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_light_atk_6","name":"Tempête astrale","category":"spell","type":"active","desc":"Attaque Lumière de puissance 8. Disponible au niveau 34.","element":"light","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_light_atk_7","name":"Jugement solaire","category":"spell","type":"active","desc":"Attaque Lumière de puissance 10. Disponible au niveau 46.","element":"light","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_light_special_1","name":"Soin lumineux","category":"heal","type":"active","desc":"Technique Lumière utilitaire. Disponible au niveau 12.","element":"light","power":5,"requiredLevel":12,"effects":[{"kind":"heal","base":5,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_light_special_2","name":"Éblouissement","category":"control","type":"active","desc":"Technique Lumière utilitaire. Disponible au niveau 28.","element":"light","power":1,"requiredLevel":28,"effects":[{"kind":"damage","base":1,"element":"light","target":"enemy"},{"kind":"debuff","stat":"agility","value":-4,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_shadow_atk_1","name":"Ombre vive","category":"spell","type":"active","desc":"Attaque Ombre de puissance 3. Disponible au niveau 1.","element":"shadow","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_shadow_atk_2","name":"Crocs obscurs","category":"melee","type":"active","desc":"Attaque Ombre de puissance 4. Disponible au niveau 5.","element":"shadow","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_shadow_atk_3","name":"Charge nocturne","category":"melee","type":"active","desc":"Attaque Ombre de puissance 5. Disponible au niveau 10.","element":"shadow","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_shadow_atk_4","name":"Impact spectral","category":"melee","type":"active","desc":"Attaque Ombre de puissance 6. Disponible au niveau 16.","element":"shadow","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_shadow_atk_5","name":"Onde noire","category":"spell","type":"active","desc":"Attaque Ombre de puissance 7. Disponible au niveau 24.","element":"shadow","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_shadow_atk_6","name":"Tempête abyssale","category":"spell","type":"active","desc":"Attaque Ombre de puissance 8. Disponible au niveau 34.","element":"shadow","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_shadow_atk_7","name":"Nuit primordiale","category":"spell","type":"active","desc":"Attaque Ombre de puissance 10. Disponible au niveau 46.","element":"shadow","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_shadow_special_1","name":"Drain nocturne","category":"control","type":"active","desc":"Technique Ombre utilitaire. Disponible au niveau 12.","element":"shadow","power":3,"requiredLevel":12,"effects":[{"kind":"damage","base":3,"element":"shadow","target":"enemy"},{"kind":"heal","base":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_shadow_special_2","name":"Voile nocturne","category":"defense","type":"active","desc":"Technique Ombre utilitaire. Disponible au niveau 28.","element":"shadow","power":0,"requiredLevel":28,"effects":[{"kind":"buff","stat":"agility","value":4,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_poison_atk_1","name":"Dard toxique","category":"spell","type":"active","desc":"Attaque Poison de puissance 3. Disponible au niveau 1.","element":"poison","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_poison_atk_2","name":"Morsure venimeuse","category":"melee","type":"active","desc":"Attaque Poison de puissance 4. Disponible au niveau 5.","element":"poison","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_poison_atk_3","name":"Jet acide","category":"melee","type":"active","desc":"Attaque Poison de puissance 5. Disponible au niveau 10.","element":"poison","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_poison_atk_4","name":"Impact toxique","category":"melee","type":"active","desc":"Attaque Poison de puissance 6. Disponible au niveau 16.","element":"poison","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_poison_atk_5","name":"Nuage corrosif","category":"spell","type":"active","desc":"Attaque Poison de puissance 7. Disponible au niveau 24.","element":"poison","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_poison_atk_6","name":"Tempête de venin","category":"spell","type":"active","desc":"Attaque Poison de puissance 8. Disponible au niveau 34.","element":"poison","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_poison_atk_7","name":"Fléau primordial","category":"spell","type":"active","desc":"Attaque Poison de puissance 10. Disponible au niveau 46.","element":"poison","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_poison_special_1","name":"Venin persistant","category":"control","type":"active","desc":"Technique Poison utilitaire. Disponible au niveau 12.","element":"poison","power":2,"requiredLevel":12,"effects":[{"kind":"damage","base":1,"element":"poison","target":"enemy"},{"kind":"dot","base":2,"value":2,"duration":3,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"},{"id":"cap_poison_special_2","name":"Brouillard toxique","category":"control","type":"active","desc":"Technique Poison utilitaire. Disponible au niveau 28.","element":"poison","power":2,"requiredLevel":28,"effects":[{"kind":"damage","base":2,"element":"poison","target":"enemy"},{"kind":"debuff","stat":"power","value":-3,"duration":3,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true,"libraryId":"creature"}];

function deepFreeze(value) {
  if (
    value &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
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

function stringArray(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }
  return Object.freeze(
    value.map((item, index) =>
      requiredString(item, `${field}[${index}]`)
    )
  );
}

function normalizeEffect(raw, field) {
  const value = objectValue(raw, field);
  const output = {
    kind: requiredString(value.kind, `${field}.kind`)
  };

  for (const key of ["base", "value", "duration"]) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      output[key] = finiteNumber(
        value[key],
        `${field}.${key}`
      );
    }
  }

  for (const key of ["element", "target", "stat"]) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      if (typeof value[key] !== "string") {
        throw new TypeError(
          `${field}.${key} must be a string`
        );
      }
      output[key] = value[key];
    }
  }

  return Object.freeze(output);
}

function normalizeAbility(raw, index) {
  const field = `abilities[${index}]`;
  const value = objectValue(raw, field);

  if (!Array.isArray(value.effects)) {
    throw new TypeError(
      `${field}.effects must be an array`
    );
  }

  const output = {
    id: requiredString(value.id, `${field}.id`),
    name: requiredString(value.name, `${field}.name`),
    category: requiredString(
      value.category,
      `${field}.category`
    ),
    type: requiredString(value.type, `${field}.type`),
    desc:
      typeof value.desc === "string"
        ? value.desc
        : (() => {
            throw new TypeError(
              `${field}.desc must be a string`
            );
          })(),
    element:
      typeof value.element === "string"
        ? value.element
        : (() => {
            throw new TypeError(
              `${field}.element must be a string`
            );
          })(),
    power: finiteNumber(value.power, `${field}.power`),
    requiredLevel: finiteNumber(
      value.requiredLevel,
      `${field}.requiredLevel`
    ),
    effects: Object.freeze(
      value.effects.map((effect, effectIndex) =>
        normalizeEffect(
          effect,
          `${field}.effects[${effectIndex}]`
        )
      )
    ),
    activeMeta: Object.freeze({
      manaCost: finiteNumber(
        value.activeMeta?.manaCost,
        `${field}.activeMeta.manaCost`
      ),
      weapon:
        typeof value.activeMeta?.weapon === "string"
          ? value.activeMeta.weapon
          : (() => {
              throw new TypeError(
                `${field}.activeMeta.weapon must be a string`
              );
            })(),
      cooldown: finiteNumber(
        value.activeMeta?.cooldown,
        `${field}.activeMeta.cooldown`
      )
    }),
    usageScopes: stringArray(
      value.usageScopes ?? [],
      `${field}.usageScopes`
    ),
    builtin: value.builtin === true,
    builtinCreature: value.builtinCreature === true,
    libraryId: requiredString(
      value.libraryId,
      `${field}.libraryId`
    )
  };

  if (
    Object.prototype.hasOwnProperty.call(
      value,
      "captureRoster"
    )
  ) {
    output.captureRoster = value.captureRoster === true;
  }

  return Object.freeze(output);
}

export const CAPTURE_USED_ABILITY_CATALOG_V2 =
  deepFreeze({
    schema: CAPTURE_USED_ABILITY_CATALOG_V2_SCHEMA,
    source: SOURCE,
    abilities: RAW_ABILITIES
  });

export function normalizeCaptureUsedAbilityCatalogV2(input) {
  const value = objectValue(
    input,
    "CaptureUsedAbilityCatalogV2"
  );

  if (
    value.schema !==
    CAPTURE_USED_ABILITY_CATALOG_V2_SCHEMA
  ) {
    throw new RangeError(
      `schema must be ${CAPTURE_USED_ABILITY_CATALOG_V2_SCHEMA}`
    );
  }

  if (!Array.isArray(value.abilities)) {
    throw new TypeError("abilities must be an array");
  }

  const abilities = value.abilities.map(normalizeAbility);
  const ids = abilities.map((ability) => ability.id);

  if (new Set(ids).size !== ids.length) {
    throw new RangeError(
      "ability ids must not contain duplicate values"
    );
  }

  return Object.freeze({
    schema: CAPTURE_USED_ABILITY_CATALOG_V2_SCHEMA,
    source: Object.freeze({
      sourceId: requiredString(
        value.source?.sourceId,
        "source.sourceId"
      ),
      commit: requiredString(
        value.source?.commit,
        "source.commit"
      ),
      indexBlob: requiredString(
        value.source?.indexBlob,
        "source.indexBlob"
      ),
      abilityTable: requiredString(
        value.source?.abilityTable,
        "source.abilityTable"
      ),
      entityTable: requiredString(
        value.source?.entityTable,
        "source.entityTable"
      )
    }),
    abilities: Object.freeze(abilities)
  });
}

export function classifyCaptureUsedAbilityV2(input) {
  const value = objectValue(
    input,
    "CaptureUsedAbilityV2"
  );
  const effects = Array.isArray(value.effects)
    ? value.effects
    : [];

  return effects.some((effect) =>
    STATUS_EFFECT_KINDS.has(
      requiredString(effect.kind, "effect.kind")
    )
  )
    ? "requires-status-effect-v1"
    : "portable-basic-effects";
}

function sumEffectBase(effects, kind) {
  return effects
    .filter((effect) => effect.kind === kind)
    .reduce(
      (sum, effect) =>
        sum + Number(effect.base ?? 0),
      0
    );
}

export function captureUsedAbilityTemplateV2(input) {
  const ability = normalizeAbility(input, 0);
  const category =
    EDITOR_CATEGORY_BY_LEGACY[ability.category];

  if (!category) {
    throw new RangeError(
      "unsupported legacy category: " +
        ability.category
    );
  }

  const legacyStatusEffects =
    ability.effects.filter((effect) =>
      STATUS_EFFECT_KINDS.has(effect.kind)
    );

  return Object.freeze({
    id: ability.id,
    name: ability.name,
    description: ability.desc,
    category,
    element:
      ability.element === ""
        ? null
        : ability.element,
    requiredLevel: ability.requiredLevel,
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
      classifyCaptureUsedAbilityV2(ability),
    legacySourceCategory: ability.category,
    legacyEffects: Object.freeze(
      ability.effects
    ),
    legacyStatusEffects: Object.freeze(
      legacyStatusEffects
    )
  });
}
