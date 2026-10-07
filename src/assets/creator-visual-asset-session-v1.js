import {
  createImageSourceManager
} from "./image-source-manager.js";

const CREATOR_VISUAL_ROLES_V1 = Object.freeze([
  "creature",
  "icon",
  "cast",
  "travel",
  "impact",
  "zone",
  "status",
  "dodge"
]);

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

function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new TypeError(label + " is required");
  }
  return text;
}

function definitionFor({
  id,
  label,
  role,
  runtimeUrl,
  file
}) {
  const common = {
    id,
    label,
    mediaType: "image",
    source: {
      scope: "user",
      packId: null,
      author: "Creator",
      license: "user-provided"
    },
    resource: {
      runtimeUrl,
      mime: file.type,
      originalName:
        typeof file.name === "string"
          ? file.name
          : ""
    },
    compatibility: {
      uses: ["combat", "capture", "editor"]
    }
  };

  if (role === "creature") {
    return Object.freeze({
      ...common,
      assetType: "portrait",
      category: "creature",
      tags: Object.freeze([
        "creator",
        "creature"
      ])
    });
  }

  if (role === "icon") {
    return Object.freeze({
      ...common,
      assetType: "icon",
      category: "skill",
      tags: Object.freeze([
        "creator",
        "icon"
      ])
    });
  }

  return Object.freeze({
    ...common,
    assetType: "sprite",
    category: role,
    tags: Object.freeze([
      "creator",
      role
    ])
  });
}

export function createCreatorVisualAssetSessionV1({
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
        "Creator visual asset session has been disposed"
      );
    }
  }

  function importImage({
    file,
    label,
    role
  }) {
    assertUsable();

    if (
      !CREATOR_VISUAL_ROLES_V1.includes(role)
    ) {
      throw new RangeError(
        "Unsupported creator visual role: " +
          String(role)
      );
    }

    const manager = createImageSourceManager({
      createObjectURL,
      revokeObjectURL
    });
    manager.validateFile(file);
    const runtimeUrl = manager.load(file);

    let id = "user:" +
      requiredText(createId(), "creator asset id");
    let suffix = 2;
    const baseId = id;
    while (assets.has(id)) {
      id = baseId + "-" + suffix;
      suffix += 1;
    }

    const definition = definitionFor({
      id,
      label: requiredText(
        label || file?.name,
        "creator asset label"
      ),
      role,
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
    importImage,
    asset,
    list,
    dispose,
    get isDisposed() {
      return disposed;
    }
  });
}

export {
  CREATOR_VISUAL_ROLES_V1
};
