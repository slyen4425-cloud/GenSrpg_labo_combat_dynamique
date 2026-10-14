function requiredText(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }
  return value.trim();
}

function fallbackSvgDataUrl({
  creatureId,
  displayName,
  view
}) {
  const safeName = displayName
    .replace(/[<>&"']/g, "")
    .slice(0, 28);
  const safeId = creatureId
    .replace(/[<>&"']/g, "")
    .slice(0, 36);
  const facing = view === "opponent" ? -1 : 1;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">' +
    '<g transform="translate(256 250) scale(' + facing + ' 1)">' +
    '<ellipse cx="0" cy="155" rx="105" ry="28" fill="rgba(0,0,0,.25)"/>' +
    '<path d="M-82 92 C-125 15 -92 -92 -12 -132 C58 -166 130 -88 112 -13 C98 49 60 103 0 120 C-36 130 -62 119 -82 92 Z" fill="#68756c" stroke="#d8e4dc" stroke-width="8"/>' +
    '<circle cx="58" cy="-57" r="12" fill="#f6e58d"/>' +
    '<path d="M-15 119 L-55 178 M37 111 L77 175" stroke="#d8e4dc" stroke-width="14" stroke-linecap="round"/>' +
    '</g>' +
    '<rect x="28" y="360" width="456" height="110" rx="20" fill="rgba(16,19,21,.82)"/>' +
    '<text x="256" y="405" text-anchor="middle" font-family="sans-serif" font-size="28" fill="white">' + safeName + '</text>' +
    '<text x="256" y="440" text-anchor="middle" font-family="monospace" font-size="18" fill="#c9d4ce">visuel générique · ' + safeId + '</text>' +
    '</svg>';

  return "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(svg);
}

export function fallbackEncounterCreatureMetaV1({
  creatureId,
  displayName
}) {
  const id = requiredText(
    creatureId,
    "creatureId"
  );
  const name = requiredText(
    displayName,
    "displayName"
  );

  const player = fallbackSvgDataUrl({
    creatureId: id,
    displayName: name,
    view: "player"
  });
  const opponent = fallbackSvgDataUrl({
    creatureId: id,
    displayName: name,
    view: "opponent"
  });

  return Object.freeze({
    id,
    name,
    profile: "biped",
    genericFallback: true,
    assetBaseUrl:
      "https://fallback.invalid/",
    views: Object.freeze({
      player,
      opponent,
      icon: player
    }),
    runtimePreview: Object.freeze({
      player,
      opponent,
      icon: player
    }),
    displayScale: Object.freeze({
      player: 0.95,
      opponent: 0.95
    }),
    transformOrigin: Object.freeze({
      x: "50%",
      y: "88%"
    }),
    offset: Object.freeze({
      x: 0,
      y: 0
    }),
    fxAnchors: Object.freeze({
      player: Object.freeze({
        head: Object.freeze({ x: 0.55, y: 0.32 }),
        mouth: Object.freeze({ x: 0.6, y: 0.36 })
      }),
      opponent: Object.freeze({
        head: Object.freeze({ x: 0.45, y: 0.32 }),
        mouth: Object.freeze({ x: 0.4, y: 0.36 })
      })
    })
  });
}

function configuredPresentationMetaV1(
  sourceMeta,
  presentation
) {
  if (presentation == null) {
    return sourceMeta;
  }
  if (
    typeof presentation !== "object" ||
    Array.isArray(presentation)
  ) {
    throw new TypeError(
      "presentation must be an object"
    );
  }

  const scale =
    typeof presentation.displayScale === "number" &&
    Number.isFinite(presentation.displayScale) &&
    presentation.displayScale > 0
      ? presentation.displayScale
      : null;

  const sourceAnchors =
    sourceMeta.fxAnchors ?? {};
  const playerAnchors = {
    ...(sourceAnchors.player ?? {})
  };
  const opponentAnchors = {
    ...(sourceAnchors.opponent ?? {})
  };

  for (
    const socket of
      Array.isArray(presentation.sockets)
        ? presentation.sockets
        : []
  ) {
    if (
      !socket ||
      typeof socket.id !== "string" ||
      socket.id.trim() === ""
    ) {
      continue;
    }

    const socketId = socket.id.trim();

    if (socket.back) {
      playerAnchors[socketId] =
        Object.freeze({
          x: socket.back.x,
          y: socket.back.y
        });
    }

    if (socket.front) {
      opponentAnchors[socketId] =
        Object.freeze({
          x: socket.front.x,
          y: socket.front.y
        });
    }
  }

  return {
    ...sourceMeta,
    profile:
      presentation.profileId ??
      sourceMeta.profile,
    displayScale:
      scale === null
        ? sourceMeta.displayScale
        : Object.freeze({
            player: scale,
            opponent: scale
          }),
    transformOrigin:
      presentation.transformOrigin ??
      sourceMeta.transformOrigin,
    offset:
      presentation.position ??
      sourceMeta.offset,
    fxAnchors: Object.freeze({
      player:
        Object.freeze(playerAnchors),
      opponent:
        Object.freeze(opponentAnchors)
    })
  };
}

export function bindEncounterCreatureMetaV1({
  creatureId,
  displayName,
  sourceMeta,
  presentation = null,
  assetBaseUrl
}) {
  const id = requiredText(
    creatureId,
    "creatureId"
  );
  const name = requiredText(
    displayName,
    "displayName"
  );

  if (
    !sourceMeta ||
    typeof sourceMeta !== "object" ||
    Array.isArray(sourceMeta)
  ) {
    throw new TypeError(
      "sourceMeta must be an object"
    );
  }

  const configuredMeta =
    configuredPresentationMetaV1(
      sourceMeta,
      presentation
    );

  return Object.freeze({
    ...configuredMeta,
    id,
    name,
    assetBaseUrl: requiredText(
      assetBaseUrl,
      "assetBaseUrl"
    ),
    genericFallback: false
  });
}
