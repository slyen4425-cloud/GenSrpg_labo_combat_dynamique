// UI translation only. Presentation bindings own these values; Runtime owns lifetime.
const modes = [
  ["once", "Lire une fois à la vitesse du sprite"],
  ["loop", "Boucler pendant l’effet"],
  ["stretch", "Adapter à la durée de l’effet"]
];
const layers = [["front", "Devant la créature"], ["behind", "Derrière la créature"]];
const offsetModes = [
  ["mirror_x", "Miroir horizontal automatique"],
  ["same", "Même décalage des deux côtés"],
  ["custom", "Réglage séparé côté adversaire"]
];
const roles = ["cast", "impact", "zone"];
const controls = [
  ["PlaybackMode", "playback", false],
  ["OffsetX", "offset-x", true],
  ["OffsetY", "offset-y", true],
  ["OffsetMode", "offset-mode", false],
  ["OpponentOffsetX", "opponent-offset-x", true],
  ["OpponentOffsetY", "opponent-offset-y", true],
  ["LayerPlayer", "layer-player", false],
  ["LayerOpponent", "layer-opponent", false]
];

function sideOffsetFields(fields, role) {
  const mode = fields[role + "OffsetMode"];
  if (mode == null || mode === "") {
    return {};
  }
  if (!["same", "mirror_x", "custom"].includes(mode)) {
    throw new RangeError(
      "Mode de décalage visuel invalide: " +
        mode
    );
  }

  if (mode !== "custom") {
    return { offsetMode: mode };
  }

  const opponentOffsetX = Number(
    fields[role + "OpponentOffsetX"]
  );
  const opponentOffsetY = Number(
    fields[role + "OpponentOffsetY"]
  );
  if (
    !Number.isFinite(opponentOffsetX) ||
    !Number.isFinite(opponentOffsetY)
  ) {
    throw new RangeError(
      "Les décalages adversaire doivent être des nombres finis"
    );
  }

  return {
    offsetMode: mode,
    opponentOffsetX,
    opponentOffsetY
  };
}

export function skillSpriteControlsFromFieldsV1(fields = {}, role) {
  const layer = role === "zone" ? "behind" : "front";
  const playback = role === "zone" ? "loop"
    : role === "impact" && fields.impactDurationMs > 0 ? "stretch" : "once";
  return {
    playbackMode: fields[role + "PlaybackMode"] ?? playback,
    offsetX: fields[role + "OffsetX"] ?? 0,
    offsetY: fields[role + "OffsetY"] ?? 0,
    ...sideOffsetFields(fields, role),
    layerByView: {
      player: fields[role + "LayerPlayer"] ?? layer,
      opponent: fields[role + "LayerOpponent"] ?? layer
    }
  };
}

export function skillSpriteControlFieldsFromVisualsV1(visual = {}) {
  const fields = {};
  for (const role of roles) {
    const slot = visual[role === "zone" ? "aura" : role];
    const fallback = skillSpriteControlsFromFieldsV1({}, role);
    const offsetX = slot?.offsetX ?? 0;
    const offsetY = slot?.offsetY ?? 0;
    const offsetMode =
      slot?.offsetMode ?? "same";

    fields[role + "PlaybackMode"] = slot?.playbackMode ?? fallback.playbackMode;
    fields[role + "OffsetX"] = offsetX;
    fields[role + "OffsetY"] = offsetY;
    fields[role + "OffsetMode"] = offsetMode;
    fields[role + "OpponentOffsetX"] =
      slot?.opponentOffsetX ??
      (
        offsetMode === "mirror_x"
          ? -offsetX
          : offsetX
      );
    fields[role + "OpponentOffsetY"] =
      slot?.opponentOffsetY ?? offsetY;
    fields[role + "LayerPlayer"] = slot?.layerByView?.player ?? fallback.layerByView.player;
    fields[role + "LayerOpponent"] = slot?.layerByView?.opponent ?? fallback.layerByView.opponent;
  }
  return fields;
}

export function readSkillSpriteControlsV1(root) {
  const fields = {};
  for (const role of roles) {
    const defaults = skillSpriteControlFieldsFromVisualsV1({});
    for (const [name, suffix, numeric] of controls) {
      const node = root.querySelector(`[data-skill-${role}-${suffix}]`);
      fields[role + name] = node ? (numeric ? Number(node.value) : node.value) : defaults[role + name];
    }
  }
  return fields;
}

export function writeSkillSpriteControlsV1(root, fields = {}) {
  const defaults = skillSpriteControlFieldsFromVisualsV1({});
  for (const role of roles) {
    for (const [name, suffix] of controls) {
      const node = root.querySelector(`[data-skill-${role}-${suffix}]`);
      if (node) {
        node.value = String(
          fields[role + name] ??
            defaults[role + name]
        );
      }
    }
  }
}

const statusControls = [
  ["playbackMode", "playback", "Animation du statut", "loop", modes],
  ["offsetX", "offset-x", "Décalage horizontal joueur (px)", 0],
  ["offsetY", "offset-y", "Décalage vertical joueur (px)", 0],
  ["offsetMode", "offset-mode", "Décalage côté adversaire", "same", offsetModes],
  ["opponentOffsetX", "opponent-offset-x", "Décalage horizontal adversaire (px)", 0],
  ["opponentOffsetY", "opponent-offset-y", "Décalage vertical adversaire (px)", 0],
  ["player", "layer-player", "Statut — vue joueur", "front", layers],
  ["opponent", "layer-opponent", "Statut — vue ennemi", "front", layers]
];

export function appendStatusSpriteControlsV1(container, sprite = {}) {
  const document = container.ownerDocument;
  container.dataset.spriteControlFields = JSON.stringify(Object.keys(sprite));
  const mode =
    sprite.offsetMode ?? "same";
  for (const [key, suffix, label, fallback, options] of statusControls) {
    const field = document.createElement("label");
    field.textContent = label;
    const input = document.createElement(options ? "select" : "input");
    input.dataset["skillStatusVisual" + suffix.split("-").map(s => s[0].toUpperCase() + s.slice(1)).join("")] = "true";
    if (options) {
      for (const [value, text] of options) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        input.append(option);
      }
    } else {
      input.type = "number";
      input.step = "5";
    }

    let value;
    if (key === "player" || key === "opponent") {
      value =
        sprite.layerByView?.[key] ??
        fallback;
    } else if (key === "opponentOffsetX") {
      value =
        sprite.opponentOffsetX ??
        (
          mode === "mirror_x"
            ? -(Number(sprite.offsetX) || 0)
            : Number(sprite.offsetX) || 0
        );
    } else if (key === "opponentOffsetY") {
      value =
        sprite.opponentOffsetY ??
        (Number(sprite.offsetY) || 0);
    } else {
      value = sprite[key] ?? fallback;
    }

    input.value = String(value);
    field.append(input);
    container.append(field);
  }
}

export function readStatusSpriteControlsV1(row) {
  const box = row.querySelector("[data-skill-status-visual-sprite-fields]");
  const original = JSON.parse(box?.dataset?.spriteControlFields ?? "[]");
  const values = {};
  for (const [key, suffix, , fallback, options] of statusControls) {
    const node = row.querySelector(`[data-skill-status-visual-${suffix}]`);
    const value = node ? (options ? node.value : Number(node.value)) : fallback;
    if (key === "player" || key === "opponent") {
      if (value !== fallback || original.includes("layerByView")) {
        (values.layerByView ??= {})[key] = value;
      }
    } else if (
      ["opponentOffsetX", "opponentOffsetY"].includes(key)
    ) {
      if (
        values.offsetMode === "custom" ||
        original.includes(key)
      ) {
        values[key] = value;
      }
    } else if (
      key === "offsetMode"
    ) {
      if (
        value !== "same" ||
        original.includes("offsetMode")
      ) {
        values.offsetMode = value;
      }
    } else if (value !== fallback || original.includes(key)) {
      values[key] = value;
    }
  }
  if (values.layerByView) {
    values.layerByView = {
      player: "front",
      opponent: "front",
      ...values.layerByView
    };
  }
  return values;
}
