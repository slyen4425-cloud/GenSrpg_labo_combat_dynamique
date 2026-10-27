// A renderer supplies geometry, never membership, HP or a second clock.
const RADII = new Set(["short", "medium", "long"]);
function id(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} must be a non-empty string`);
  return value.trim();
}
function bounds(value) {
  const result = Object.fromEntries(["left", "top", "width", "height"].map(key => [key, Number(value?.[key])]));
  if (!Object.values(result).every(Number.isFinite) || result.width <= 0 || result.height <= 0) throw new RangeError("spatial bounds must be finite with positive dimensions");
  return Object.freeze(result);
}
export function normalizePersistentZoneSpatialV1(input) {
  if (input == null) return null;
  if (!Array.isArray(input.zones) || !Array.isArray(input.actors)) throw new TypeError("zone spatial sample requires zones and actors arrays");
  const zones = input.zones.map(z => {
    if (!RADII.has(z.radius)) throw new RangeError("unsupported spatial zone radius");
    return Object.freeze({ zoneId: id(z.zoneId, "zoneId"), sourceActorId: id(z.sourceActorId, "sourceActorId"), radius: z.radius, bounds: bounds(z.bounds) });
  });
  const actors = input.actors.map(a => Object.freeze({ actorId: id(a.actorId, "actorId"), bounds: bounds(a.bounds) }));
  if (new Set(zones.map(z => z.zoneId)).size !== zones.length || new Set(actors.map(a => a.actorId)).size !== actors.length) throw new Error("duplicate spatial zone or actor");
  return Object.freeze({ zones: Object.freeze(zones), actors: Object.freeze(actors) });
}
export function visiblePersistentZoneRelationV1({ sample, zoneId, sourceActorId, radius, candidateId }) {
  const zone = sample?.zones.find(z => z.zoneId === zoneId && z.sourceActorId === sourceActorId && z.radius === radius);
  const actor = sample?.actors.find(a => a.actorId === candidateId);
  if (!zone || !actor) return null;
  const z = zone.bounds, a = actor.bounds;
  const x = z.left + z.width / 2, y = z.top + z.height / 2;
  const nearestX = Math.max(a.left, Math.min(x, a.left + a.width));
  const nearestY = Math.max(a.top, Math.min(y, a.top + a.height));
  return ((nearestX - x) / (z.width / 2)) ** 2 + ((nearestY - y) / (z.height / 2)) ** 2 <= 1;
}
