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
  "dodge",
  "movement",
  "attack"
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
  file,
  frameCount=1,
  frameMs=100
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
      ...(frameCount > 1 ? {frameCount,frameMs,playbackMode:'loop'} : {}),
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

  // Creature attack animations are not skill cast/projectile sprites.
  // One shared AssetDefinition and importer remain authoritative.
  if (role === "attack") {
    return Object.freeze({
      ...common,
      assetType: "sprite",
      category: "creature",
      tags: Object.freeze([
        "creator",
        "creature",
        "attack",
        "animated"
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

  function attachImage({id,file,label,role,frameCount=1,frameMs=100}) {
    assertUsable();
    if (!CREATOR_VISUAL_ROLES_V1.includes(role))
      throw new RangeError('Unsupported creator visual role: '+String(role));
    if(typeof id!=='string'||!/^user:[a-zA-Z0-9][a-zA-Z0-9._:-]{0,125}$/.test(id))
      throw new TypeError('Identifiant personnel user: requis');
    if(assets.has(id))throw new Error('Cet asset personnel est déjà chargé');
    if(!Number.isInteger(frameCount)||frameCount<1||frameCount>32)
      throw new RangeError('Creator animation frameCount must be 1..32');
    if(!Number.isInteger(frameMs)||frameMs<30||frameMs>1000)
      throw new RangeError('Creator animation frameMs must be 30..1000');
    if((role==='creature'||role==='icon')&&frameCount!==1)
      throw new RangeError('Un modèle ou une icône doit contenir une seule image.');
    const manager=createImageSourceManager({createObjectURL,revokeObjectURL});
    manager.validateFile(file);
    try {
      const runtimeUrl=manager.load(file);
      const definition=definitionFor({
        id,label:requiredText(label||file?.name,'creator asset label'),
        role,runtimeUrl,file,frameCount,frameMs
      });
      assets.set(id,definition);
      managers.set(id,manager);
      return definition;
    }catch(error){manager.dispose();throw error;}
  }

  function importImage({file,label,role,frameCount=1,frameMs=100}) {
    assertUsable();
    // Validate first, BEFORE consuming a generated ID (historical contract).
    if(!CREATOR_VISUAL_ROLES_V1.includes(role))
      throw new RangeError('Unsupported creator visual role: '+String(role));
    const check=createImageSourceManager({createObjectURL,revokeObjectURL});
    try{check.validateFile(file);}finally{check.dispose();}
    let id = "user:" + requiredText(createId(),'creator asset id');
    const baseId=id;
    let suffix=2;
    while(assets.has(id)){id=baseId+'-'+suffix;suffix++;}
    return attachImage({id,file,label,role,frameCount,frameMs});
  }

  // Storage or room receiver may only restore an existing generated ID.
  // Never invent an ID on reload; the runtime URL is freshly reconstructed
  // from verified Blob bytes rather than persisted object URLs.
  function restoreImage({id,file,label,role,frameCount=1,frameMs=100}){
    return attachImage({id,file,label,role,frameCount,frameMs});
  }

  // Rollback ONLY an uncommitted session asset after failed IndexedDB write.
  // Never removes saved bytes or an authored creature/skill record.
  function discardSessionImage(id){
    assertUsable();
    if(!assets.has(id))return false;
    managers.get(id)?.dispose();
    managers.delete(id);
    assets.delete(id);
    return true;
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
    restoreImage,
    discardSessionImage,
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
