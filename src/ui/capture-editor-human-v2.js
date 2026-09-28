import {
  normalizeCaptureCreatureEditorDraftV2
} from "../contracts/capture-creature-editor-draft-v2.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../contracts/capture-skill-editor-draft-v1.js";
import {
  normalizeCaptureActiveSkillLoadoutV1
} from "../contracts/capture-active-skill-loadout-v1.js";
import {
  normalizeCaptureBattleSetupEditorDraftV1
} from "../contracts/capture-battle-setup-editor-draft-v1.js";
import {
  exportCaptureEditorDraftsToCombatExportV2
} from "../adapters/input/capture/capture-editor-exporter-v2.js";
import {
  GLOBAL_VISUAL_LIBRARY,
  globalVisualAssetUrl
} from "../assets/global-visual-library.js";
import {
  captureLegacySkillLibraryEntriesV1,
  captureLegacyAbilityEditorStateV1,
  mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1
} from "./capture-editor-skill-catalog-v1.js";

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(field + " est obligatoire");
  }
  return value.trim();
}

function optionalText(value) {
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text === "" ? null : text;
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(field + " doit être un nombre");
  }
  return number;
}

function positiveInteger(value, field) {
  const number = finiteNumber(value, field);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(field + " doit être un entier supérieur ou égal à 1");
  }
  return number;
}

function stableIds(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((value) => optionalText(value))
    .filter((value) => value !== null);
}

function resistanceEntries(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.entries(raw)
    .filter(([, value]) => value !== "" && value != null)
    .map(([element, value]) => ({
      kind: element.includes(":") ? element : "element:" + element,
      value: finiteNumber(value, "Résistance " + element)
    }));
}

function audioSlots(raw) {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const output = {};
  for (const role of ["attack", "hit", "ko"]) {
    const entry = raw[role];
    if (entry == null || entry === "") {
      continue;
    }

    if (typeof entry === "string") {
      output[role] = {
        assetId: requiredText(entry, "Son " + role)
      };
      continue;
    }

    output[role] = {
      assetId: requiredText(
        entry.assetId,
        "Son " + role
      ),
      ...(entry.volume == null
        ? {}
        : { volume: finiteNumber(entry.volume, "Volume " + role) })
    };
  }

  return output;
}

function visualSlot(assetId, {
  attachment,
  trigger,
  anchor = null
}) {
  const id = optionalText(assetId);
  if (id === null) {
    return null;
  }

  return {
    assetId: id,
    attachment,
    trigger,
    anchor,
    displayScale: 1,
    layer: "front",
    playbackMode: "once",
    offsetX: 0,
    offsetY: 0,
    rotationDeg: 0,
    opacity: 1
  };
}

function audioSkillSlot(assetId) {
  const id = optionalText(assetId);
  return id === null
    ? null
    : {
        assetId: id,
        volume: 1,
        loop: false
      };
}

function presentationForSkill(fields) {
  const presentation = fields.presentation ?? {};
  const iconAssetId = optionalText(
    presentation.iconAssetId
  );
  const socketId = optionalText(
    presentation.socketId
  );

  const cast = visualSlot(
    presentation.castAssetId,
    {
      attachment: "source",
      trigger: "preparation-start",
      anchor: socketId
    }
  );
  const travel = visualSlot(
    presentation.travelAssetId,
    {
      attachment: "trajectory",
      trigger: "travel-start",
      anchor: socketId
    }
  );
  const impact = visualSlot(
    presentation.impactAssetId,
    {
      attachment: "fixed-target",
      trigger: "impact",
      anchor: null
    }
  );

  const castAudio = audioSkillSlot(
    presentation.castAudioAssetId
  );
  const impactAudio = audioSkillSlot(
    presentation.impactAudioAssetId
  );

  const hasVisual =
    iconAssetId !== null ||
    cast !== null ||
    travel !== null ||
    impact !== null;
  const hasAudio =
    castAudio !== null ||
    impactAudio !== null;

  if (!hasVisual && !hasAudio) {
    return null;
  }

  const visual = {};
  if (iconAssetId !== null) {
    visual.icon = { assetId: iconAssetId };
  }
  if (cast !== null) {
    visual.cast = cast;
  }
  if (travel !== null) {
    visual.travel = travel;
  }
  if (impact !== null) {
    visual.impact = impact;
  }

  const audio = {};
  if (castAudio !== null) {
    audio.cast = castAudio;
  }
  if (impactAudio !== null) {
    audio.impact = impactAudio;
  }

  return {
    id: "skill:" + requiredText(fields.id, "ID capacité"),
    version: 1,
    subjectType: "skill",
    subjectId: requiredText(fields.id, "ID capacité"),
    visual,
    audio
  };
}

export function normalizedSocketPointV2({
  clientX,
  clientY,
  rect
}) {
  if (
    !rect ||
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    throw new TypeError("rect doit décrire une surface valide");
  }

  return Object.freeze({
    x: clamp01((clientX - rect.left) / rect.width),
    y: clamp01((clientY - rect.top) / rect.height)
  });
}

export function buildHumanCreatureDraftV2(fields) {
  if (!fields || typeof fields !== "object") {
    throw new TypeError("Données créature invalides");
  }

  const id = requiredText(fields.id, "ID créature");
  const visual = fields.visual ?? {};
  const frontAssetId = requiredText(
    visual.frontAssetId,
    "Image face"
  );

  const presentationVisual = {
    front: { assetId: frontAssetId }
  };

  const backAssetId = optionalText(
    visual.backAssetId
  );
  if (backAssetId !== null) {
    presentationVisual.back = {
      assetId: backAssetId
    };
  }

  const iconAssetId = optionalText(
    visual.iconAssetId
  );
  if (iconAssetId !== null) {
    presentationVisual.icon = {
      assetId: iconAssetId
    };
  }

  const sockets = Array.isArray(fields.sockets)
    ? fields.sockets
    : [];

  const presentation = {
    id: "creature:" + id,
    version: 1,
    subjectType: "creature",
    subjectId: id,
    profileId: requiredText(
      fields.profileId,
      "Style de position"
    ),
    visual: presentationVisual,
    sockets,
    audio: audioSlots(fields.audio)
  };

  return normalizeCaptureCreatureEditorDraftV2({
    schema: "capture-creature-editor-draft-v2",
    id,
    displayName: requiredText(
      fields.displayName,
      "Nom créature"
    ),
    description: optionalText(fields.description) ?? "",
    level: positiveInteger(fields.level, "Niveau"),
    sourceStats: {
      force: finiteNumber(fields.sourceStats?.force, "Force"),
      agility: finiteNumber(fields.sourceStats?.agility, "Agilité"),
      intelligence: finiteNumber(
        fields.sourceStats?.intelligence,
        "Intelligence"
      ),
      spirit: finiteNumber(fields.sourceStats?.spirit, "Esprit"),
      endurance: finiteNumber(
        fields.sourceStats?.endurance,
        "Endurance"
      ),
      initiative: finiteNumber(
        fields.sourceStats?.initiative,
        "Initiative"
      )
    },
    elements: stableIds(fields.elements),
    resistances: resistanceEntries(fields.resistances),
    capture: {
      capturable: fields.capture?.capturable === true,
      captureRate: finiteNumber(
        fields.capture?.captureRate,
        "Taux de capture"
      ),
      spawnChance: finiteNumber(
        fields.capture?.spawnChance,
        "Chance d’apparition"
      ),
      spawnTags: stableIds(fields.capture?.spawnTags),
      evolution: fields.capture?.evolution ?? null
    },
    combat: {
      maxHp: finiteNumber(fields.combat?.maxHp, "PV max"),
      initialHp: finiteNumber(
        fields.combat?.initialHp,
        "PV initiaux"
      ),
      maxEnergy: finiteNumber(
        fields.combat?.maxEnergy,
        "Énergie max"
      ),
      initialEnergy: finiteNumber(
        fields.combat?.initialEnergy,
        "Énergie initiale"
      ),
      energyChargeAmount: finiteNumber(
        fields.combat?.energyChargeAmount,
        "Énergie récupérée"
      ),
      energyChargeIntervalMs: finiteNumber(
        fields.combat?.energyChargeIntervalMs,
        "Intervalle de récupération"
      ),
      movementEnergyPerStep: finiteNumber(
        fields.combat?.movementEnergyPerStep,
        "Coût de déplacement"
      ),
      chargeTimeModifierPct: finiteNumber(
        fields.combat?.chargeTimeModifierPct,
        "Modificateur de charge"
      )
    },
    skillIds: stableIds(fields.linkedSkillIds),
    presentation
  });
}

export function buildHumanSkillDraftV1(fields) {
  if (!fields || typeof fields !== "object") {
    throw new TypeError("Données capacité invalides");
  }

  const id = requiredText(fields.id, "ID capacité");
  const reaction = fields.reaction ?? {};
  const projectileClash = fields.projectileClash ?? {};

  return normalizeCaptureSkillEditorDraftV1({
    schema: "capture-skill-editor-draft-v1",
    id,
    description: optionalText(fields.description) ?? "",
    requiredLevel: positiveInteger(
      fields.requiredLevel,
      "Niveau requis"
    ),
    usageScopes: stableIds(fields.usageScopes),
    definition: {
      id,
      name: requiredText(fields.name, "Nom capacité"),
      category: requiredText(
        fields.category,
        "Type de capacité"
      ),
      form: requiredText(fields.form, "Style de capacité"),
      element: optionalText(fields.element),
      approachMode: requiredText(
        fields.approachMode ?? "none",
        "Déplacement"
      ),
      energyCost: finiteNumber(
        fields.energyCost,
        "Coût énergie"
      ),
      preparationMs: finiteNumber(
        fields.preparationMs,
        "Temps de préparation"
      ),
      travelMs: finiteNumber(
        fields.travelMs,
        "Temps pour atteindre la cible"
      ),
      recoveryMs: finiteNumber(
        fields.recoveryMs,
        "Temps de récupération"
      ),
      cooldownMs: finiteNumber(
        fields.cooldownMs,
        "Temps de recharge"
      ),
      allowedDistances: stableIds(
        fields.allowedDistances
      ),
      targetRelations: stableIds(
        fields.targetRelations
      ),
      reaction: {
        blockForms: stableIds(reaction.blockForms),
        reflectForms: stableIds(reaction.reflectForms),
        immuneElements: stableIds(
          reaction.immuneElements
        ),
        counterForms: stableIds(
          reaction.counterForms
        ),
        evadeForms: stableIds(reaction.evadeForms),
        evadeApproaches: stableIds(
          reaction.evadeApproaches
        )
      },
      projectileClash: {
        mode: projectileClash.mode ?? "none",
        group: optionalText(projectileClash.group),
        interactsWith: stableIds(
          projectileClash.interactsWith
        )
      },
      effect: {
        damage: finiteNumber(fields.damage ?? 0, "Dégâts"),
        heal: finiteNumber(fields.heal ?? 0, "Soin"),
        stunMs: finiteNumber(fields.stunMs ?? 0, "Stun"),
        interruptsPreparation:
          fields.interruptsPreparation === true,
        tags: stableIds(fields.effectTags)
      }
    },
    presentation: presentationForSkill(fields)
  });
}

export function buildHumanLoadoutV1({
  creatureId,
  skillIds
}) {
  const ids = Array.isArray(skillIds)
    ? [...skillIds]
    : [];

  if (ids.length > 4) {
    throw new RangeError(
      "Le loadout actif ne peut pas dépasser 4 capacités"
    );
  }

  while (ids.length < 4) {
    ids.push(null);
  }

  return normalizeCaptureActiveSkillLoadoutV1({
    schema: "capture-active-skill-loadout-v1",
    creatureId: requiredText(
      creatureId,
      "Créature du loadout"
    ),
    slots: ids.map((skillId, index) => ({
      id: "slot-" + (index + 1),
      skillId: optionalText(skillId)
    }))
  });
}

export function buildHumanBattleSetupV1({
  battleId,
  localCreatureId,
  localDisplayName,
  opponentCreatureId,
  opponentDisplayName,
  activePerTeam
}) {
  const count = positiveInteger(
    activePerTeam,
    "Nombre de créatures actives"
  );

  if (count > 4) {
    throw new RangeError(
      "Le laboratoire V1 accepte de 1 à 4 créatures actives par équipe"
    );
  }

  const localSlots = [];
  const enemySlots = [];

  for (let index = 0; index < count; index += 1) {
    const number = index + 1;

    localSlots.push({
      actorId: "local-" + number,
      creatureId: requiredText(
        localCreatureId,
        "Créature locale"
      ),
      displayName: requiredText(
        localDisplayName,
        "Nom créature locale"
      ),
      controllerId:
        index === 0
          ? "human-local"
          : "ai-ally",
      roster: null
    });

    enemySlots.push({
      actorId: "opponent-" + number,
      creatureId: requiredText(
        opponentCreatureId,
        "Créature adverse"
      ),
      displayName: requiredText(
        opponentDisplayName,
        "Nom créature adverse"
      ),
      controllerId: "ai-enemy",
      roster: null
    });
  }

  return normalizeCaptureBattleSetupEditorDraftV1({
    schema: "capture-battle-setup-editor-draft-v1",
    id: requiredText(battleId, "ID combat"),
    localActorId: "local-1",
    teams: [
      {
        id: "local-team",
        slots: localSlots
      },
      {
        id: "enemy-team",
        slots: enemySlots
      }
    ]
  });
}

export function buildHumanEditorExportV2({
  creatureDraft,
  skillDrafts,
  loadout,
  battleSetup,
  opponentCreatureDraft,
  opponentSkillDrafts,
  opponentLoadout
}) {
  return exportCaptureEditorDraftsToCombatExportV2({
    battleSetup,
    creatureDrafts: [
      creatureDraft,
      opponentCreatureDraft
    ],
    skillDrafts: [
      ...skillDrafts,
      ...opponentSkillDrafts
    ],
    loadouts: [
      loadout,
      opponentLoadout
    ],
    metadata: {
      editor: "capture-human-v2"
    }
  });
}

function one(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(
      "Élément éditeur introuvable : " + selector
    );
  }
  return element;
}

function checkedValues(root, selector) {
  return [...root.querySelectorAll(selector)]
    .filter((element) => element.checked)
    .map((element) => element.value);
}

function selectedValue(root, selector) {
  return one(root, selector).value;
}

function numericValue(root, selector) {
  return Number(selectedValue(root, selector));
}

function writeSkillTemplateFields(root, fields) {
  const mapping = [
    ["[data-skill-id]", fields.id],
    ["[data-skill-name]", fields.name],
    ["[data-skill-description]", fields.description],
    ["[data-skill-category]", fields.category],
    ["[data-skill-element]", fields.element ?? ""],
    ["[data-skill-required-level]", fields.requiredLevel],
    ["[data-skill-damage]", fields.damage],
    ["[data-skill-heal]", fields.heal]
  ];

  for (const [selector, value] of mapping) {
    one(root, selector).value = String(value ?? "");
  }
}

function setStatus(root, message, tone = "info") {
  const status = one(root, "[data-editor-status]");
  status.textContent = message;
  status.dataset.tone = tone;
}

function setTab(root, tabId) {
  for (const button of root.querySelectorAll("[data-editor-tab]")) {
    button.dataset.active =
      button.dataset.editorTab === tabId
        ? "true"
        : "false";
  }

  for (const panel of root.querySelectorAll("[data-editor-panel]")) {
    panel.hidden =
      panel.dataset.editorPanel !== tabId;
  }
}

function createOption(select, value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.append(option);
}

function catalogMatches(asset, role) {
  if (!asset?.compatibility?.uses?.includes("editor")) {
    return false;
  }

  if (role === "creature") {
    return (
      asset.category === "creature" ||
      (
        asset.assetType === "portrait" &&
        asset.tags?.includes("creature")
      )
    );
  }

  if (role === "icon") {
    return asset.assetType === "icon";
  }

  if (role === "cast") {
    return (
      asset.category === "release" ||
      asset.tags?.includes("cast")
    );
  }

  if (role === "travel") {
    return asset.category === "travel";
  }

  if (role === "impact") {
    return asset.category === "impact";
  }

  if (role === "audio") {
    return asset.mediaType === "audio";
  }

  return false;
}

function populateSelect(select, assets, role) {
  const previous = select.value;
  const allowEmpty =
    select.dataset.requiredAsset !== "true";

  select.textContent = "";

  if (allowEmpty) {
    createOption(select, "", "Aucun");
  }

  for (const asset of assets) {
    if (catalogMatches(asset, role)) {
      createOption(
        select,
        asset.id,
        asset.label || asset.id
      );
    }
  }

  if (
    previous &&
    [...select.options].some(
      (option) => option.value === previous
    )
  ) {
    select.value = previous;
  }
}

async function hydrateAssetCatalog(root, listen) {
  const response = await fetch(
    GLOBAL_VISUAL_LIBRARY.catalogUrl,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      "Catalogue assets indisponible (" +
      response.status +
      ")"
    );
  }

  const catalog = await response.json();
  const assets = Array.isArray(catalog.assets)
    ? catalog.assets
    : [];

  const byId = new Map(
    assets.map((asset) => [asset.id, asset])
  );

  for (const select of root.querySelectorAll("[data-asset-role]")) {
    populateSelect(
      select,
      assets,
      select.dataset.assetRole
    );
  }

  function preview(select, image) {
    const asset = byId.get(select.value);
    const file = asset?.resource?.file;

    if (!file) {
      image.removeAttribute("src");
      image.dataset.empty = "true";
      return;
    }

    image.src = globalVisualAssetUrl(file);
    image.alt = asset.label || asset.id;
    image.dataset.empty = "false";
  }

  const frontSelect = one(
    root,
    "[data-creature-front-select]"
  );
  const backSelect = one(
    root,
    "[data-creature-back-select]"
  );
  const iconSelect = one(
    root,
    "[data-creature-icon-select]"
  );

  const frontImage = one(root, "[data-preview-front]");
  const backImage = one(root, "[data-preview-back]");
  const iconImage = one(root, "[data-preview-icon]");
  const socketFrontImage = one(
    root,
    "[data-socket-front-preview]"
  );
  const socketBackImage = one(
    root,
    "[data-socket-back-preview]"
  );

  function syncPreviews(select, images) {
    for (const image of images) {
      preview(select, image);
    }
  }

  for (const [select, images] of [
    [frontSelect, [frontImage, socketFrontImage]],
    [backSelect, [backImage, socketBackImage]],
    [iconSelect, [iconImage]]
  ]) {
    listen(
      select,
      "change",
      () => syncPreviews(select, images)
    );
    syncPreviews(select, images);
  }

  return catalog;
}

function initialSocketStore() {
  return new Map();
}

function socketList(store) {
  const sockets = [];

  for (const [id, value] of store.entries()) {
    if (!value.front) {
      continue;
    }

    sockets.push({
      id,
      label: value.label || id,
      front: value.front,
      back: value.back ?? null
    });
  }

  return sockets;
}

function updateSocketMarker(surface, point) {
  let marker = surface.querySelector("[data-socket-marker]");
  if (!marker) {
    marker = document.createElement("span");
    marker.dataset.socketMarker = "true";
    marker.className = "socket-marker";
    surface.append(marker);
  }

  marker.style.left = (point.x * 100) + "%";
  marker.style.top = (point.y * 100) + "%";
}

function readCreatureFields(root, sockets) {
  const elements = checkedValues(
    root,
    "[data-element]:checked"
  );

  const resistances = {};
  for (const input of root.querySelectorAll("[data-resistance]")) {
    resistances[input.dataset.resistance] = input.value;
  }

  return {
    id: selectedValue(root, "[data-creature-id]"),
    displayName: selectedValue(
      root,
      "[data-creature-name]"
    ),
    description: selectedValue(
      root,
      "[data-creature-description]"
    ),
    level: numericValue(root, "[data-creature-level]"),
    sourceStats: {
      force: numericValue(root, "[data-stat-force]"),
      agility: numericValue(root, "[data-stat-agility]"),
      intelligence: numericValue(
        root,
        "[data-stat-intelligence]"
      ),
      spirit: numericValue(root, "[data-stat-spirit]"),
      endurance: numericValue(
        root,
        "[data-stat-endurance]"
      ),
      initiative: numericValue(
        root,
        "[data-stat-initiative]"
      )
    },
    elements,
    resistances,
    capture: {
      capturable: one(
        root,
        "[data-capturable]"
      ).checked,
      captureRate: numericValue(
        root,
        "[data-capture-rate]"
      ),
      spawnChance: numericValue(
        root,
        "[data-spawn-chance]"
      ),
      spawnTags: elements,
      evolution: null
    },
    combat: {
      maxHp: numericValue(root, "[data-max-hp]"),
      initialHp: numericValue(
        root,
        "[data-initial-hp]"
      ),
      maxEnergy: numericValue(
        root,
        "[data-max-energy]"
      ),
      initialEnergy: numericValue(
        root,
        "[data-initial-energy]"
      ),
      energyChargeAmount: numericValue(
        root,
        "[data-energy-charge-amount]"
      ),
      energyChargeIntervalMs: numericValue(
        root,
        "[data-energy-charge-interval]"
      ),
      movementEnergyPerStep: numericValue(
        root,
        "[data-movement-energy]"
      ),
      chargeTimeModifierPct: numericValue(
        root,
        "[data-charge-time-modifier]"
      )
    },
    linkedSkillIds: [
      selectedValue(root, "[data-skill-id]")
    ],
    profileId: selectedValue(
      root,
      "[data-creature-profile]"
    ),
    visual: {
      frontAssetId: selectedValue(
        root,
        "[data-creature-front-select]"
      ),
      backAssetId: selectedValue(
        root,
        "[data-creature-back-select]"
      ),
      iconAssetId: selectedValue(
        root,
        "[data-creature-icon-select]"
      )
    },
    sockets: socketList(sockets),
    audio: {
      attack: selectedValue(
        root,
        "[data-creature-audio-attack]"
      ),
      hit: selectedValue(
        root,
        "[data-creature-audio-hit]"
      ),
      ko: selectedValue(
        root,
        "[data-creature-audio-ko]"
      )
    }
  };
}

function readSkillFields(root) {
  const form = selectedValue(
    root,
    "[data-skill-form]"
  );
  const clashEnabled =
    one(root, "[data-skill-clash]").checked &&
    form === "projectile";

  return {
    id: selectedValue(root, "[data-skill-id]"),
    name: selectedValue(root, "[data-skill-name]"),
    description: selectedValue(
      root,
      "[data-skill-description]"
    ),
    requiredLevel: numericValue(
      root,
      "[data-skill-required-level]"
    ),
    usageScopes: ["capture", "combat"],
    category: selectedValue(
      root,
      "[data-skill-category]"
    ),
    form,
    element: selectedValue(
      root,
      "[data-skill-element]"
    ) || null,
    approachMode: selectedValue(
      root,
      "[data-skill-approach]"
    ),
    energyCost: numericValue(
      root,
      "[data-skill-energy-cost]"
    ),
    preparationMs: numericValue(
      root,
      "[data-skill-preparation]"
    ),
    travelMs: numericValue(
      root,
      "[data-skill-travel-time]"
    ),
    recoveryMs: numericValue(
      root,
      "[data-skill-recovery]"
    ),
    cooldownMs: numericValue(
      root,
      "[data-skill-cooldown]"
    ),
    allowedDistances: checkedValues(
      root,
      "[data-skill-distance]:checked"
    ),
    targetRelations: checkedValues(
      root,
      "[data-skill-target]:checked"
    ),
    damage: numericValue(
      root,
      "[data-skill-damage]"
    ),
    heal: numericValue(root, "[data-skill-heal]"),
    stunMs: numericValue(root, "[data-skill-stun]"),
    interruptsPreparation: one(
      root,
      "[data-skill-interrupts]"
    ).checked,
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: {
      mode: clashEnabled
        ? "mutual_cancel"
        : "none",
      group: clashEnabled
        ? (
            optionalText(
              selectedValue(
                root,
                "[data-skill-clash-group]"
              )
            ) || "projectile-default"
          )
        : null,
      interactsWith: clashEnabled
        ? [
            optionalText(
              selectedValue(
                root,
                "[data-skill-clash-group]"
              )
            ) || "projectile-default"
          ]
        : []
    },
    presentation: {
      iconAssetId: selectedValue(
        root,
        "[data-skill-icon]"
      ),
      castAssetId: selectedValue(
        root,
        "[data-skill-cast-fx]"
      ),
      travelAssetId: selectedValue(
        root,
        "[data-skill-travel-fx]"
      ),
      impactAssetId: selectedValue(
        root,
        "[data-skill-impact-fx]"
      ),
      socketId: selectedValue(
        root,
        "[data-skill-socket]"
      ) || null,
      castAudioAssetId: selectedValue(
        root,
        "[data-skill-cast-audio]"
      ),
      impactAudioAssetId: selectedValue(
        root,
        "[data-skill-impact-audio]"
      )
    }
  };
}

function readLoadout(root, creatureId) {
  const skillIds = [
    ...root.querySelectorAll("[data-loadout-slot]")
  ].map((select) => select.value || null);

  return buildHumanLoadoutV1({
    creatureId,
    skillIds
  });
}

export function mountCaptureEditorHumanV2({
  root,
  opponentCreatureDraft,
  opponentSkillDrafts,
  opponentLoadout
}) {
  if (!root || typeof root.querySelector !== "function") {
    throw new TypeError("root doit être un élément DOM");
  }

  const listeners = [];
  const sockets = initialSocketStore();
  const configuredSkills = new Map();
  let selectedLegacyState = null;
  let skillDirty = false;
  let disposed = false;
  let lastExport = null;

  function listen(target, type, handler) {
    if (disposed) {
      return;
    }
    target.addEventListener(type, handler);
    listeners.push(() =>
      target.removeEventListener(type, handler)
    );
  }

  for (const tab of root.querySelectorAll("[data-editor-tab]")) {
    listen(tab, "click", () =>
      setTab(root, tab.dataset.editorTab)
    );
  }

  setTab(root, "creature");

  const librarySelect = one(
    root,
    "[data-skill-library-select]"
  );
  const libraryState = one(
    root,
    "[data-skill-library-state]"
  );
  const saveSkillButton = one(
    root,
    "[data-skill-save]"
  );

  function updateLibraryState(state) {
    selectedLegacyState = state;
    if (state === null) {
      libraryState.textContent =
        "Nouvelle capacité : tous les champs sont à définir.";
      libraryState.dataset.tone = "info";
      return;
    }

    libraryState.textContent = state.message;
    libraryState.dataset.tone =
      state.runtimeReady ? "ok" : "warning";
  }

  function refreshLoadoutOptions(preferredId = null) {
    const configured = [...configuredSkills.values()];
    const slots = [
      ...root.querySelectorAll("[data-loadout-slot]")
    ];

    for (const select of slots) {
      const previous = select.value;
      select.textContent = "";
      createOption(select, "", "Vide");

      for (const draft of configured) {
        createOption(
          select,
          draft.id,
          draft.definition.name
        );
      }

      if (
        previous &&
        configuredSkills.has(previous)
      ) {
        select.value = previous;
      }
    }

    if (
      preferredId &&
      configuredSkills.has(preferredId) &&
      !slots.some(
        (select) => select.value === preferredId
      )
    ) {
      const empty = slots.find(
        (select) => select.value === ""
      );
      if (empty) {
        empty.value = preferredId;
      }
    }
  }

  function saveCurrentSkill() {
    if (
      selectedLegacyState !== null &&
      !selectedLegacyState.runtimeReady
    ) {
      throw new Error(
        "Cette capacité historique nécessite StatusEffectV1 avant de pouvoir être enregistrée comme équivalent runtime complet."
      );
    }

    const draft = buildHumanSkillDraftV1(
      readSkillFields(root)
    );
    configuredSkills.set(draft.id, draft);
    skillDirty = false;
    refreshLoadoutOptions(draft.id);

    setStatus(
      root,
      "Capacité « " +
        draft.definition.name +
        " » enregistrée dans la bibliothèque active.",
      "ok"
    );

    return draft;
  }

  librarySelect.textContent = "";
  createOption(
    librarySelect,
    "",
    "Nouvelle capacité"
  );

  for (const entry of captureLegacySkillLibraryEntriesV1()) {
    const elementLabel =
      entry.element === null
        ? "Neutre"
        : entry.element;
    const stateLabel =
      entry.migrationState ===
      "requires-status-effect-v1"
        ? " · statut requis"
        : "";

    createOption(
      librarySelect,
      entry.id,
      "[" +
        elementLabel +
        "] " +
        entry.name +
        " · niv. " +
        entry.requiredLevel +
        stateLabel
    );
  }

  listen(librarySelect, "change", () => {
    const abilityId = librarySelect.value;

    if (!abilityId) {
      updateLibraryState(null);
      return;
    }

    const state =
      captureLegacyAbilityEditorStateV1(
        abilityId
      );
    const merged =
      mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1(
        readSkillFields(root),
        abilityId
      );

    writeSkillTemplateFields(
      root,
      merged
    );
    updateLibraryState(state);
    skillDirty = true;

    setStatus(
      root,
      "Modèle « " +
        state.template.name +
        " » chargé. Complète les réglages modernes puis enregistre la capacité.",
      state.runtimeReady ? "info" : "warning"
    );
  });

  listen(saveSkillButton, "click", () => {
    try {
      saveCurrentSkill();
    } catch (error) {
      setStatus(
        root,
        error.message,
        "error"
      );
    }
  });

  for (
    const field of root.querySelectorAll(
      '[data-editor-panel="skills"] input, ' +
      '[data-editor-panel="skills"] select, ' +
      '[data-editor-panel="skills"] textarea'
    )
  ) {
    if (
      field === librarySelect ||
      field === saveSkillButton
    ) {
      continue;
    }

    listen(field, "input", () => {
      skillDirty = true;
    });
    listen(field, "change", () => {
      skillDirty = true;
    });
  }

  try {
    const initialSkill =
      buildHumanSkillDraftV1(
        readSkillFields(root)
      );
    configuredSkills.set(
      initialSkill.id,
      initialSkill
    );
    refreshLoadoutOptions(
      initialSkill.id
    );
  } catch {
    refreshLoadoutOptions();
  }

  updateLibraryState(null);

  for (const surface of root.querySelectorAll("[data-socket-surface]")) {
    listen(surface, "pointerdown", (event) => {
      const socketId = selectedValue(
        root,
        "[data-socket-kind]"
      );
      const label = one(
        root,
        "[data-socket-kind]"
      ).selectedOptions[0]?.textContent || socketId;

      const point = normalizedSocketPointV2({
        clientX: event.clientX,
        clientY: event.clientY,
        rect: surface.getBoundingClientRect()
      });

      const current = sockets.get(socketId) ?? {
        id: socketId,
        label,
        front: null,
        back: null
      };

      current[surface.dataset.socketView] = point;
      sockets.set(socketId, current);
      updateSocketMarker(surface, point);
      setStatus(
        root,
        "Point " + label + " placé sur la vue " +
          (surface.dataset.socketView === "front" ? "face" : "dos") +
          ".",
        "ok"
      );
    });
  }

  const validateButton = one(
    root,
    "[data-editor-validate]"
  );

  function validate() {
    try {
      if (
        selectedLegacyState !== null &&
        !selectedLegacyState.runtimeReady
      ) {
        throw new Error(
          "La capacité historique sélectionnée contient un buff, debuff ou DoT. StatusEffectV1 est requis avant validation complète."
        );
      }

      if (skillDirty) {
        throw new Error(
          "La capacité en cours a été modifiée. Enregistre-la avant de valider le combat."
        );
      }

      const creatureFields = readCreatureFields(
        root,
        sockets
      );
      creatureFields.linkedSkillIds = [
        ...configuredSkills.keys()
      ];

      const creatureDraft =
        buildHumanCreatureDraftV2(creatureFields);

      const loadout = readLoadout(
        root,
        creatureDraft.id
      );

      const battleSetup = buildHumanBattleSetupV1({
        battleId: "capture-human-preview",
        localCreatureId: creatureDraft.id,
        localDisplayName: creatureDraft.displayName,
        opponentCreatureId: opponentCreatureDraft.id,
        opponentDisplayName:
          opponentCreatureDraft.displayName,
        activePerTeam: numericValue(
          root,
          "[data-active-per-team]"
        )
      });

      lastExport = buildHumanEditorExportV2({
        creatureDraft,
        skillDrafts: [
          ...configuredSkills.values()
        ],
        loadout,
        battleSetup,
        opponentCreatureDraft,
        opponentSkillDrafts,
        opponentLoadout
      });

      one(root, "[data-editor-summary]").textContent =
        lastExport.actors.length +
        " combattants · " +
        lastExport.creatures.length +
        " créatures · " +
        lastExport.skills.length +
        " capacités";

      setStatus(
        root,
        "Configuration valide. L’export Capture est prêt.",
        "ok"
      );

      return lastExport;
    } catch (error) {
      lastExport = null;
      one(root, "[data-editor-summary]").textContent =
        "Corrige les champs signalés.";
      setStatus(
        root,
        error.message,
        "error"
      );
      return null;
    }
  }

  listen(validateButton, "click", validate);

  hydrateAssetCatalog(root, listen)
    .then(() => {
      if (!disposed) {
        setStatus(
          root,
          "Bibliothèque visuelle chargée. Tu peux configurer la créature.",
          "info"
        );
      }
    })
    .catch((error) => {
      if (!disposed) {
        setStatus(
          root,
          "Bibliothèque visuelle indisponible : " +
            error.message,
          "error"
        );
      }
    });

  return Object.freeze({
    validate,
    getLastExport() {
      return lastExport;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      for (const remove of listeners.splice(0)) {
        remove();
      }
    }
  });
}
