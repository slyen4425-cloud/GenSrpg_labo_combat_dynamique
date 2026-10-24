// Presentation-only projection of existing Capture records. This module never
// decides a creature's production readiness; it checks published references.
const ATTRIBUTE_LABELS = Object.freeze({
  force:"Force", agility:"Agilité", intelligence:"Intelligence",
  spirit:"Esprit", endurance:"Endurance", initiative:"Initiative"
});
const ELEMENT_LABELS = Object.freeze({
  fire:"Feu", water:"Eau", earth:"Terre", air:"Air",
  electric:"Électricité", light:"Lumière", shadow:"Ombre",
  nature:"Nature", ice:"Glace", poison:"Poison", steel:"Acier",
  acier:"Acier", spirit:"Esprit", esprit:"Esprit", psy:"Psychique",
  physical:"Physique"
});
export function bestiaryElementLabelV1(key) {
  if (typeof key !== "string" || !key.trim()) return "Non précisé";
  return ELEMENT_LABELS[key] ?? key.charAt(0).toLocaleUpperCase("fr") + key.slice(1);
}
function validPublishedImage(asset) {
  return Boolean(
    asset && asset.mediaType === "image" &&
    (asset.assetType === "sprite" || asset.assetType === "portrait") &&
    typeof asset.resource?.file === "string" &&
    /^(capture|core)\/[\w./-]+\.(png|webp|jpg|jpeg)$/i.test(asset.resource.file) &&
    !asset.resource.file.includes("../") &&
    Number(asset.resource?.frameCount ?? 1) === 1
  );
}
function statNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function readyVisual(assetMap, binding) {
  const id = binding?.assetId;
  if (typeof id !== "string" || !id) return null;
  const asset = assetMap.get(id);
  if (!validPublishedImage(asset)) return null;
  return Object.freeze({assetId:id, file:asset.resource.file});
}
function skillIdList(draft) {
  return [...new Set((Array.isArray(draft.skillIds) ? draft.skillIds : [])
    .filter(id => typeof id === "string" && id.trim()))];
}

/**
 * Input: the EXISTING Showcase transfer records + global visual asset catalog.
 * Output: immutable view models. No shadow data, gameplay state, or saves.
 * A finished creature needs published front/back/icon resources, but ONLY
 * the front portrait and icon are exposed to the display.
 */
export function captureBestiaryCardsV1({
  creatureTransfers = [],
  skillTransfers = [],
  assetCatalog = {assets:[]},
  statRegistry = {stats:[]},
  historicalAbilities = []
} = {}) {
  const assets = new Map((Array.isArray(assetCatalog?.assets) ? assetCatalog.assets : [])
    .filter(asset => asset && typeof asset.id === "string")
    .map(asset => [asset.id, asset]));
  const skillsById = new Map();
  for (const entry of historicalAbilities) {
    if (typeof entry?.id === "string" && typeof entry?.name === "string") {
      skillsById.set(entry.id, {
        id:entry.id, name:entry.name, description:entry.desc ?? "",
        element:entry.element || null, requiredLevel:entry.requiredLevel ?? null,
        icon:null
      });
    }
  }
  for (const transfer of skillTransfers) {
    const draft = transfer?.draft;
    const definition = draft?.definition;
    if (!definition || typeof definition.id !== "string" ||
        typeof definition.name !== "string") continue;
    const icon = readyVisual(assets, draft?.presentation?.visual?.icon);
    skillsById.set(definition.id, {
      id:definition.id, name:definition.name,
      description: typeof draft.description === "string" ? draft.description : "",
      element:definition.element || null,
      requiredLevel: statNumber(draft.requiredLevel),
      icon
    });
  }
  const labelsById = new Map((Array.isArray(statRegistry?.stats) ? statRegistry.stats : [])
    .filter(x => typeof x?.id === "string").map(x => [x.id, x.label || x.id]));
  const cards = [];
  const seen = new Set();
  for (const transfer of creatureTransfers) {
    const draft = transfer?.draft;
    const id = draft?.id;
    if (typeof id !== "string" || !id || seen.has(id) ||
        typeof draft.displayName !== "string" || !draft.displayName.trim()) continue;
    const visual = draft?.presentation?.visual;
    const portrait = readyVisual(assets, visual?.front);
    // Readiness checks all three authored views, never displays the back.
    const backReady = Boolean(readyVisual(assets, visual?.back));
    const icon = readyVisual(assets, visual?.icon);
    if (!portrait || !backReady || !icon) continue;
    seen.add(id);
    const attributes = Object.entries(ATTRIBUTE_LABELS).map(([key,label]) => ({
      key,label,value:statNumber(draft?.sourceStats?.[key])
    })).filter(x => x.value !== null);
    const measures = Object.entries(transfer?.statValues?.values ?? {})
      .filter(([,value]) => statNumber(value) !== null)
      .map(([key,value]) => ({key,label:labelsById.get(key) ?? bestiaryElementLabelV1(key),value}));
    const resistances = (Array.isArray(draft.resistances) ? draft.resistances : [])
      .filter(item => typeof item?.kind === "string" &&
        statNumber(item.value) !== null && item.value !== 0)
      .map(item => ({
        element:item.kind.startsWith("element:")
          ? item.kind.slice("element:".length) : item.kind,
        amount:item.value
      }));
    const equipped = new Map((Array.isArray(transfer?.loadout?.slots) ?
      transfer.loadout.slots : []).filter(slot => typeof slot?.skillId === "string")
      .map(slot => [slot.skillId,slot.id]));
    const knownSkills = [];
    let unavailableSkillCount = 0;
    for (const skillId of skillIdList(draft)) {
      const skill = skillsById.get(skillId);
      if (!skill) {unavailableSkillCount += 1;continue;}
      knownSkills.push(Object.freeze({...skill, slot:equipped.get(skillId) ?? null}));
    }
    const evolution = draft?.capture?.evolution;
    cards.push(Object.freeze({
      id, name:draft.displayName.trim(),
      description:typeof draft.description === "string" ? draft.description.trim() : "",
      level:statNumber(draft.level),
      elements:Object.freeze((Array.isArray(draft.elements) ? draft.elements : [])
        .filter(v => typeof v === "string" && v.trim())),
      portrait, icon,
      attributes:Object.freeze(attributes.map(Object.freeze)),
      measures:Object.freeze(measures.map(Object.freeze)),
      resistances:Object.freeze(resistances.map(Object.freeze)),
      skills:Object.freeze(knownSkills),
      unavailableSkillCount,
      evolution: evolution?.condition === "level" &&
        Number.isFinite(evolution.level) ?
          Object.freeze({level:evolution.level,targetId:evolution.targetId || null}) : null,
      captureRate:statNumber(draft?.capture?.captureRate),
      capturable:draft?.capture?.capturable === true
    }));
  }
  return Object.freeze(cards.sort((a,b) => a.name.localeCompare(b.name,"fr")));
}
