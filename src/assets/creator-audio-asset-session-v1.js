import {
  createAudioSourceManagerV1
} from "./audio-source-manager-v1.js";

function defaultCreateId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2)
  );
}

function requiredText(value, field) {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new TypeError(field + " is required");
  }
  return text;
}

function audioFormat(file) {
  const type = String(file?.type ?? "");
  if (type === "audio/mpeg" || type === "audio/mp3") {
    return "mp3";
  }
  if (type === "audio/ogg") {
    return "ogg";
  }
  return "wav";
}

function definitionFor({
  id,
  label,
  role,
  runtimeUrl,
  file
}) {
  return Object.freeze({
    id,
    assetId: id,
    label,
    assetType: "sound",
    mediaType: "audio",
    category: "creator",
    format: audioFormat(file),
    roles: Object.freeze([role]),
    tags: Object.freeze([
      "creator",
      role
    ]),
    status: "user",
    source: Object.freeze({
      scope: "user",
      packId: null,
      author: "Creator",
      license: "user-provided"
    }),
    resource: Object.freeze({
      runtimeUrl,
      mime: file.type,
      originalName:
        typeof file.name === "string"
          ? file.name
          : ""
    }),
    compatibility: Object.freeze({
      uses: Object.freeze([
        "combat",
        "capture",
        "editor"
      ])
    })
  });
}

export function createCreatorAudioAssetSessionV1({
  createObjectURL =
    (file) => URL.createObjectURL(file),
  revokeObjectURL =
    (url) => URL.revokeObjectURL(url),
  createId = defaultCreateId
} = {}) {
  if (typeof createObjectURL !== "function") {
    throw new TypeError(
      "createObjectURL must be a function"
    );
  }
  if (typeof revokeObjectURL !== "function") {
    throw new TypeError(
      "revokeObjectURL must be a function"
    );
  }
  if (typeof createId !== "function") {
    throw new TypeError(
      "createId must be a function"
    );
  }

  const assets = new Map();
  const managers = new Map();
  let disposed = false;

  function assertUsable() {
    if (disposed) {
      throw new Error(
        "Creator audio asset session has been disposed"
      );
    }
  }

  function importAudio({
    file,
    label,
    role
  }) {
    assertUsable();
    const normalizedRole =
      requiredText(role, "creator audio role");

    const manager = createAudioSourceManagerV1({
      createObjectURL,
      revokeObjectURL
    });
    manager.validateFile(file);
    const runtimeUrl = manager.load(file);

    let id =
      "user:" +
      requiredText(
        createId(),
        "creator audio asset id"
      );
    const baseId = id;
    let suffix = 2;
    while (assets.has(id)) {
      id = baseId + "-" + suffix;
      suffix += 1;
    }

    const definition = definitionFor({
      id,
      label: requiredText(
        label || file?.name,
        "creator audio asset label"
      ),
      role: normalizedRole,
      runtimeUrl,
      file
    });

    assets.set(id, definition);
    managers.set(id, manager);
    return definition;
  }

  function asset(assetId) {
    if (typeof assetId !== "string") {
      return null;
    }
    return assets.get(assetId) ?? null;
  }

  function runtimeAsset(assetId) {
    const definition = asset(assetId);
    if (!definition) {
      return null;
    }
    return Object.freeze({
      assetId: definition.id,
      url: definition.resource.runtimeUrl
    });
  }

  function list() {
    return Object.freeze([
      ...assets.values()
    ]);
  }

  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    for (const manager of managers.values()) {
      manager.dispose();
    }
    managers.clear();
    assets.clear();
  }

  return Object.freeze({
    importAudio,
    asset,
    runtimeAsset,
    list,
    dispose,
    get isDisposed() {
      return disposed;
    }
  });
}
