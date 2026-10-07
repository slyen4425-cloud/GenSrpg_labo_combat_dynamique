export const PRIVATE_AUDIO_ROLE_ORDER_V1 = Object.freeze([
  "preparation",
  "cast",
  "release",
  "travel",
  "impact",
  "aura",
  "movement",
  "voice",
  "death",
  "heal",
  "equip",
  "loot",
  "item",
  "ui",
  "other"
]);

export const PRIVATE_AUDIO_ROLE_LABELS_V1 = Object.freeze({
  preparation: "Préparation",
  cast: "Cast / incantation",
  release: "Attaque / déclenchement",
  travel: "Trajet / projectile",
  impact: "Impact / coup",
  aura: "Zone persistante / aura",
  movement: "Mouvement",
  voice: "Voix créature",
  death: "KO / mort",
  heal: "Soin",
  equip: "Équipement",
  loot: "Butin",
  item: "Objet",
  ui: "Interface",
  other: "Autres"
});

function requiredEntries(entries) {
  if (!Array.isArray(entries)) {
    throw new TypeError("entries must be an array");
  }
  return entries;
}

function normalizedRoles(roles) {
  if (!Array.isArray(roles)) {
    throw new TypeError("acceptedRoles must be an array");
  }

  const result = roles.map((role) => String(role).trim()).filter(Boolean);
  return Object.freeze([...new Set(result)]);
}

function displayEntry(entry) {
  const category =
    typeof entry?.category === "string" && entry.category.trim() !== ""
      ? entry.category.trim()
      : "autres";
  const label =
    typeof entry?.label === "string" && entry.label.trim() !== ""
      ? entry.label.trim()
      : String(entry?.assetId ?? "");

  return Object.freeze({
    ...entry,
    category,
    displayLabel: `${label} — ${category}`
  });
}

export function buildPrivateAudioRoleGroupsV1(
  entries,
  acceptedRoles
) {
  const source = requiredEntries(entries);
  const requested = normalizedRoles(acceptedRoles);
  const roleOrder = Object.freeze([
    ...requested,
    ...PRIVATE_AUDIO_ROLE_ORDER_V1.filter(
      (role) => !requested.includes(role)
    )
  ]);

  const groups = new Map(
    roleOrder.map((role) => [role, []])
  );

  for (const rawEntry of source) {
    const entryRoles = Array.isArray(rawEntry?.roles)
      ? rawEntry.roles
      : [];

    const role =
      roleOrder.find((candidate) =>
        entryRoles.includes(candidate)
      ) ?? "other";

    if (!groups.has(role)) {
      groups.set(role, []);
    }
    groups.get(role).push(displayEntry(rawEntry));
  }

  return Object.freeze(
    roleOrder
      .filter((role) => (groups.get(role)?.length ?? 0) > 0)
      .map((role) =>
        Object.freeze({
          role,
          label:
            PRIVATE_AUDIO_ROLE_LABELS_V1[role] ??
            role,
          entries: Object.freeze(
            [...groups.get(role)].sort((a, b) =>
              a.displayLabel.localeCompare(
                b.displayLabel,
                "fr"
              )
            )
          )
        })
      )
  );
}
