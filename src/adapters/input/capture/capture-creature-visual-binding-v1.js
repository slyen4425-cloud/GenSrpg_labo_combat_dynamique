import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../../contracts/capture-creature-editor-draft-v3.js";

const SOCKET_SPECS = Object.freeze([
  Object.freeze({
    id: "mouth",
    label: "Bouche",
    metaKey: "mouth"
  }),
  Object.freeze({
    id: "head",
    label: "Tête",
    metaKey: "head"
  }),
  Object.freeze({
    id: "left-hand",
    label: "Main / patte gauche",
    metaKey: "handLeft"
  }),
  Object.freeze({
    id: "right-hand",
    label: "Main / patte droite",
    metaKey: "handRight"
  }),
  Object.freeze({
    id: "tail",
    label: "Queue",
    metaKey: "tail"
  })
]);

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(field + " must be an object");
  }
  return value;
}

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

function positiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(
      field + " must be greater than 0"
    );
  }
  return number;
}

function availableAssetSet(value) {
  if (value instanceof Set) {
    return value;
  }
  if (!Array.isArray(value)) {
    throw new TypeError(
      "availableAssetIds must be an array or Set"
    );
  }
  return new Set(value);
}

function pointOrNull(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return {
    x: Number(value.x),
    y: Number(value.y)
  };
}

function socketsFromMeta(meta) {
  const player = meta.fxAnchors?.player ?? {};
  const opponent =
    meta.fxAnchors?.opponent ?? {};
  const sockets = [];

  for (const spec of SOCKET_SPECS) {
    const front = pointOrNull(
      opponent[spec.metaKey]
    );
    if (!front) {
      continue;
    }

    const back = pointOrNull(
      player[spec.metaKey]
    );

    sockets.push({
      id: spec.id,
      label: spec.label,
      front,
      back
    });
  }

  return sockets;
}

export function applyCaptureCreatureVisualBindingV1({
  record,
  binding,
  creatureMeta,
  availableAssetIds
}) {
  const sourceRecord = objectValue(
    record,
    "record"
  );
  const draft = objectValue(
    sourceRecord.draft,
    "record.draft"
  );
  const visualBinding = objectValue(
    binding,
    "binding"
  );
  const meta = objectValue(
    creatureMeta,
    "creatureMeta"
  );

  const creatureId = requiredText(
    visualBinding.creatureId,
    "binding.creatureId"
  );
  const metaId = requiredText(
    visualBinding.metaId,
    "binding.metaId"
  );

  if (draft.id !== creatureId) {
    throw new RangeError(
      "visual binding creature ID does not match record"
    );
  }

  if (
    requiredText(
      meta.id,
      "creatureMeta.id"
    ) !== metaId
  ) {
    throw new RangeError(
      "visual metadata does not match binding meta ID"
    );
  }

  const assetIds = objectValue(
    meta.assetIds,
    "creatureMeta.assetIds"
  );
  const frontAssetId = requiredText(
    assetIds.opponent,
    "creatureMeta.assetIds.opponent"
  );
  const backAssetId = requiredText(
    assetIds.player,
    "creatureMeta.assetIds.player"
  );
  const iconAssetId = requiredText(
    assetIds.icon,
    "creatureMeta.assetIds.icon"
  );

  const available =
    availableAssetSet(availableAssetIds);

  for (const assetId of [
    frontAssetId,
    backAssetId,
    iconAssetId
  ]) {
    if (!available.has(assetId)) {
      throw new RangeError(
        "visual metadata references unavailable asset: " +
          assetId
      );
    }
  }

  const presentation = {
    id: "creature:" + draft.id,
    version: 2,
    subjectType: "creature",
    subjectId: draft.id,
    profileId: requiredText(
      meta.profile,
      "creatureMeta.profile"
    ),
    displayScale: positiveNumber(
      meta.displayScale?.player,
      "creatureMeta.displayScale.player"
    ),
    position: {
      x: Number(meta.offset?.x ?? 0),
      y: Number(meta.offset?.y ?? 0)
    },
    transformOrigin: {
      x:
        typeof meta.transformOrigin?.x === "string"
          ? meta.transformOrigin.x
          : "50%",
      y:
        typeof meta.transformOrigin?.y === "string"
          ? meta.transformOrigin.y
          : "50%"
    },
    visual: {
      front: {
        assetId: frontAssetId
      },
      back: {
        assetId: backAssetId
      },
      icon: {
        assetId: iconAssetId
      }
    },
    sockets: socketsFromMeta(meta),
    audio:
      draft.presentation?.audio ?? {}
  };

  return Object.freeze({
    draft:
      normalizeCaptureCreatureEditorDraftV3({
        ...draft,
        schema:
          "capture-creature-editor-draft-v3",
        presentation
      }),
    loadout: sourceRecord.loadout
  });
}
