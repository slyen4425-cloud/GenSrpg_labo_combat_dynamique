import {normalizeCaptureActiveSkillLoadoutV1} from "../contracts/capture-active-skill-loadout-v1.js";
import {captureStatEffectSummaryV1} from "./capture-stat-effect-summary-v1.js";
import {describeCaptureSkillV1} from "./capture-skill-explanation-v1.js";

// The existing Capture loadout owns equipment; the Bestiary is read-only.
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
function validPublishedImage(asset, role) {
  const allowedTypes = role === "icon" ? ["icon","portrait"] : ["sprite","portrait"];
  return Boolean(
    asset && asset.mediaType === "image" &&
    allowedTypes.includes(asset.assetType) &&
    typeof asset.resource?.file === "string" &&
    /^(capture|core)\/[\w./-]+\.(png|webp|jpg|jpeg)$/i.test(asset.resource.file) &&
    !asset.resource.file.includes("../") &&
    Number(asset.resource?.frameCount ?? 1) === 1
  );
}
function statNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function readyVisual(assetMap, binding, role = "portrait") {
  const id = binding?.assetId;
  if (typeof id !== "string" || !id) return null;
  const asset = assetMap.get(id);
  if (!validPublishedImage(asset, role)) return null;
  return Object.freeze({assetId:id, file:asset.resource.file});
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
  nativeSkills = []
} = {}) {
  const assets = new Map((Array.isArray(assetCatalog?.assets) ? assetCatalog.assets : [])
    .filter(asset => asset && typeof asset.id === "string")
    .map(asset => [asset.id, asset]));
  const skillsById = new Map();
  // Native catalog then authored Showcase: same precedence as the editor.
  for (const entry of nativeSkills) {
    const definition = entry?.definition;
    if (typeof definition?.id !== "string" ||
        typeof definition?.name !== "string") continue;
    skillsById.set(definition.id, {
      name:definition.name, element:definition.element ?? null,
      requiredLevel:null, icon:null,
      explanation:describeCaptureSkillV1(definition)
    });
  }
  for (const transfer of skillTransfers) {
    const draft = transfer?.draft;
    const definition = draft?.definition;
    if (!definition || typeof definition.id !== "string" ||
        typeof definition.name !== "string") continue;
    const icon = readyVisual(assets, draft?.presentation?.visual?.icon, "icon");
    skillsById.set(definition.id, {
      name:definition.name,
      element:definition.element || null,
      requiredLevel: statNumber(draft.requiredLevel),
      icon,
      explanation:describeCaptureSkillV1(definition)
    });
  }
  const definitionsById = new Map((Array.isArray(statRegistry?.stats) ? statRegistry.stats : [])
    .filter(x => typeof x?.id === "string").map(x => [x.id, x]));
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
    const icon = readyVisual(assets, visual?.icon, "icon");
    if (!portrait || !backReady || !icon) continue;
    seen.add(id);
    const measures = Object.entries(transfer?.statValues?.values ?? {})
      .filter(([,value]) => statNumber(value) !== null)
      .map(([key,value]) => {
        const definition = definitionsById.get(key);
        return Object.freeze({
          key, label:definition?.label ?? bestiaryElementLabelV1(key), value,
          ...(definition ? {
            effectSummary:captureStatEffectSummaryV1({definition,value})
          } : {})
        });
      });
    const resistances = (Array.isArray(draft.resistances) ? draft.resistances : [])
      .filter(item => typeof item?.kind === "string" &&
        statNumber(item.value) !== null && item.value !== 0)
      .map(item => ({
        element:item.kind.startsWith("element:")
          ? item.kind.slice("element:".length) : item.kind,
        amount:item.value
      }));
    // Canonical five slot loadout, including an unassigned ultimate.
    const loadout = normalizeCaptureActiveSkillLoadoutV1(transfer.loadout);
    if (loadout.creatureId !== id) {
      throw new RangeError("Bestiary loadout creatureId differs from draft.id: "+id);
    }
    const slots = loadout.slots.map(slot => {
      const definition = slot.skillId === null ? null : skillsById.get(slot.skillId);
      return Object.freeze({
        slot:slot.id,
        state:slot.skillId === null ? "empty" : definition ? "ready" : "unpublished",
        ...(definition ?? {})
      });
    });
    const evolution = draft?.capture?.evolution;
    cards.push(Object.freeze({
      id, name:draft.displayName.trim(),
      description:typeof draft.description === "string" ? draft.description.trim() : "",
      level:statNumber(draft.level),
      elements:Object.freeze((Array.isArray(draft.elements) ? draft.elements : [])
        .filter(v => typeof v === "string" && v.trim())),
      portrait, icon,
      measures:Object.freeze(measures.map(Object.freeze)),
      resistances:Object.freeze(resistances.map(Object.freeze)),
      skills:Object.freeze(slots),
      evolution: evolution?.condition === "level" &&
        Number.isFinite(evolution.level) ?
          Object.freeze({level:evolution.level,targetId:evolution.targetId || null}) : null,
      captureRate:statNumber(draft?.capture?.captureRate),
      capturable:draft?.capture?.capturable === true
    }));
  }
  return Object.freeze(cards.sort((a,b) => a.name.localeCompare(b.name,"fr")));
}
