import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeCreaturePresentationBindingV1
} from "../../../contracts/creature-presentation-binding-v1.js";
import {
  normalizeCreaturePresentationBindingV2,
  creaturePresentationForViewV2
} from "../../../contracts/creature-presentation-binding-v2.js";
import {
  validateCreatureProfile
} from "../../../core/profiles/profile-registry.js";

function requiredFunction(value, field) {
  if (typeof value !== "function") {
    throw new TypeError(`${field} must be a function`);
  }
  return value;
}

function normalizePresentation(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError(
      "creature presentation must be an object"
    );
  }

  if (raw.version === 2) {
    return normalizeCreaturePresentationBindingV2(raw);
  }

  return normalizeCreaturePresentationBindingV1(raw);
}

function anchorMap(sockets, view) {
  return Object.freeze(
    Object.fromEntries(
      sockets.map((socket) => [
        socket.id,
        view === "player"
          ? socket.back ?? socket.front
          : socket.front
      ])
    )
  );
}

function safeBaseUrl(url) {
  try {
    return new URL(".", url).href;
  } catch {
    return "https://invalid.local/";
  }
}

export function adaptCaptureExportToNativeVisualSourceV1({
  exported,
  assetCatalog,
  profiles,
  assetUrlForFile
}) {
  const captureExport =
    normalizeCaptureCombatExportV1(exported);

  if (
    !assetCatalog ||
    typeof assetCatalog !== "object" ||
    Array.isArray(assetCatalog) ||
    !Array.isArray(assetCatalog.assets)
  ) {
    throw new TypeError(
      "assetCatalog.assets must be an array"
    );
  }

  if (!Array.isArray(profiles)) {
    throw new TypeError("profiles must be an array");
  }

  const resolveAssetFile = requiredFunction(
    assetUrlForFile,
    "assetUrlForFile"
  );

  const normalizedProfiles = profiles.map((profile) =>
    validateCreatureProfile(profile)
  );
  const profileIds = new Set(
    normalizedProfiles.map((profile) => profile.id)
  );

  const assetById = new Map(
    assetCatalog.assets.map((asset) => [
      asset?.id,
      asset
    ])
  );

  function assetUrl(assetId) {
    const asset = assetById.get(assetId);
    const file = asset?.resource?.file;

    if (
      !asset ||
      typeof file !== "string" ||
      file.trim() === ""
    ) {
      throw new RangeError(
        `unknown asset: ${assetId}`
      );
    }

    const url = resolveAssetFile(file);
    if (typeof url !== "string" || url.trim() === "") {
      throw new TypeError(
        `assetUrlForFile returned no URL for: ${assetId}`
      );
    }

    return url;
  }

  const creatureById = new Map(
    captureExport.creatures.map((creature) => [
      creature.id,
      creature
    ])
  );
  const presentations =
    captureExport.presentation?.creatures ?? {};

  const usedCreatureIds = [
    ...new Set(
      [
        ...captureExport.actors.map(actor => actor.creatureId),
        ...captureExport.rosters.flatMap(roster => roster.members.map(member => member.creatureId))
      ]
    )
  ];

  const creatureMetas = usedCreatureIds.map((creatureId) => {
    const creature = creatureById.get(creatureId);
    const presentationId = creature?.presentationId;

    if (!presentationId) {
      if (!profileIds.has("biped")) throw new RangeError("unknown profile: biped");
      const marker = "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect x="10" y="30" width="160" height="130" rx="24" fill="#233b46" stroke="#769aa8" stroke-width="3"/><text x="90" y="102" text-anchor="middle" fill="#d7e8ed" font-family="sans-serif" font-size="17">SANS IMAGE</text></svg>'
      );
      return Object.freeze({
        id: creature.id, name: creature.displayName, profile: "biped",
        presentationFallback: "missing-creature-image",
        views: Object.freeze({ player: marker, opponent: marker, icon: marker }),
        runtimePreview: Object.freeze({ player: marker, opponent: marker, icon: marker }),
        assetBaseUrl: new URL(".", import.meta.url).href, displayScale: Object.freeze({ player: 1, opponent: 1 }),
        fxAnchors: Object.freeze({ player: {}, opponent: {} })
      });
    }

    const rawBinding = presentations[presentationId];
    if (!rawBinding) {
      throw new RangeError(
        `missing presentation for creature: ${creatureId}`
      );
    }

    const binding = normalizePresentation(rawBinding);

    if (binding.subjectId !== creatureId) {
      throw new RangeError(
        `presentation subject does not match creature: ${creatureId}`
      );
    }

    if (!profileIds.has(binding.profileId)) {
      throw new RangeError(
        `unknown profile: ${binding.profileId}`
      );
    }

    const frontUrl = assetUrl(
      binding.visual.front.assetId
    );
    const backUrl =
      binding.visual.back === null
        ? frontUrl
        : assetUrl(
            binding.visual.back.assetId
          );
    const iconUrl =
      binding.visual.icon === null
        ? frontUrl
        : assetUrl(
            binding.visual.icon.assetId
          );

    const viewSettings = Object.fromEntries(["player", "opponent"].map(view => [view,
      binding.version === 2 ? creaturePresentationForViewV2(binding, view)
        : { displayScale: 1, position: { x: 0, y: 0 } }
    ]));

    return Object.freeze({
      id: creature.id,
      name: creature.displayName,
      profile: binding.profileId,
      views: Object.freeze({
        player: backUrl,
        opponent: frontUrl,
        icon: iconUrl
      }),
      runtimePreview: Object.freeze({
        player: backUrl,
        opponent: frontUrl,
        icon: iconUrl
      }),
      assetBaseUrl: safeBaseUrl(frontUrl),
      displayScale: Object.freeze({
        player: viewSettings.player.displayScale,
        opponent: viewSettings.opponent.displayScale
      }),
      offsetByView: Object.freeze({
        player: viewSettings.player.position,
        opponent: viewSettings.opponent.position
      }),
      offset: Object.freeze(
        binding.version === 2
          ? {
              x: binding.position.x,
              y: binding.position.y
            }
          : { x: 0, y: 0 }
      ),
      transformOrigin: Object.freeze(
        binding.version === 2
          ? {
              x: binding.transformOrigin.x,
              y: binding.transformOrigin.y
            }
          : {
              x: "50%",
              y: "50%"
            }
      ),
      fxAnchors: Object.freeze({
        player: anchorMap(
          binding.sockets,
          "player"
        ),
        opponent: anchorMap(
          binding.sockets,
          "opponent"
        )
      })
    });
  });

  const arenaId =
    captureExport.presentation?.arenaId == null
      ? null
      : String(
          captureExport.presentation.arenaId
        ).trim();

  if (arenaId === "") {
    throw new TypeError(
      "presentation.arenaId must be a non-empty string"
    );
  }

  return Object.freeze({
    arenaId,
    profiles: Object.freeze([
      ...normalizedProfiles
    ]),
    creatureMetas: Object.freeze(creatureMetas)
  });
}
