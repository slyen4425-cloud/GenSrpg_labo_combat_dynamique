function requiredFunction(value, field) {
  if (typeof value !== "function") {
    throw new TypeError(
      field + " must be a function"
    );
  }
  return value;
}

function statusInstances(fighter) {
  return Array.isArray(fighter?.statusEffects)
    ? fighter.statusEffects
    : [];
}

function presentationUsesTint(presentation) {
  return (
    presentation?.mode === "tint" ||
    presentation?.mode === "both"
  );
}

function presentationUsesSprite(presentation) {
  return (
    presentation?.mode === "sprite" ||
    presentation?.mode === "both"
  );
}

function polarityColor(polarity) {
  switch (polarity) {
    case "beneficial":
      return "#43c97a";
    case "detrimental":
      return "#ef5b5b";
    default:
      return "#9aa5b1";
  }
}

function polarityGlyph(polarity) {
  switch (polarity) {
    case "beneficial":
      return "+";
    case "detrimental":
      return "−";
    default:
      return "•";
  }
}

function maskUrl(image) {
  const url =
    image?.currentSrc ||
    image?.src ||
    "";
  if (!url) {
    return "";
  }
  return 'url("' +
    String(url).replace(/"/g, "\\\"") +
    '")';
}

export function createDomStatusFxRenderer({
  targetFor,
  statusPresentationFor
}) {
  const resolveTarget = requiredFunction(
    targetFor,
    "targetFor"
  );
  const resolvePresentation =
    requiredFunction(
      statusPresentationFor,
      "statusPresentationFor"
    );

  const records = new Map();
  let disposed = false;

  function recordKey(
    actorId,
    statusId,
    kind
  ) {
    return (
      actorId +
      "::" +
      statusId +
      "::" +
      kind
    );
  }

  function removeRecord(key) {
    const record = records.get(key);
    if (!record) {
      return false;
    }
    record.node.remove?.();
    records.delete(key);
    return true;
  }

  function ensureTint({
    actorId,
    statusId,
    target,
    presentation,
    expected
  }) {
    const key = recordKey(
      actorId,
      statusId,
      "tint"
    );
    expected.add(key);

    let record =
      records.get(key) ?? null;
    if (!record) {
      const node =
        target.motion.ownerDocument
          .createElement("span");
      node.className =
        "status-fx status-fx--tint";
      node.dataset.statusFx = "tint";
      node.dataset.statusId = statusId;
      target.motion.append(node);
      record = { node };
      records.set(key, record);
    }

    const mask = maskUrl(target.image);
    record.node.style.backgroundColor =
      presentation.tintColor;
    record.node.style.opacity =
      String(presentation.tintOpacity);
    record.node.style.mixBlendMode = "normal";
    record.node.style.maskImage = mask;
    record.node.style.webkitMaskImage = mask;
    record.node.style.maskSize = "contain";
    record.node.style.webkitMaskSize = "contain";
    record.node.style.maskPosition = "center";
    record.node.style.webkitMaskPosition = "center";
    record.node.style.maskRepeat = "no-repeat";
    record.node.style.webkitMaskRepeat = "no-repeat";
  }

  function ensureSprite({
    actorId,
    statusId,
    target,
    presentation,
    expected
  }) {
    const sprite = presentation.sprite;
    if (!sprite?.url) {
      return;
    }

    const key = recordKey(
      actorId,
      statusId,
      "sprite"
    );
    expected.add(key);

    let record =
      records.get(key) ?? null;
    if (!record) {
      const node =
        target.motion.ownerDocument
          .createElement("span");
      node.className =
        "status-fx status-fx--sprite";
      node.dataset.statusFx = "sprite";
      node.dataset.statusId = statusId;
      target.motion.append(node);
      record = { node };
      records.set(key, record);
    }

    record.node.dataset.assetId =
      sprite.assetId ?? "";
    record.node.style.backgroundImage =
      'url("' +
      String(sprite.url)
        .replace(/"/g, "\\\"") +
      '")';
    record.node.style.opacity =
      String(sprite.opacity ?? 1);
    record.node.style.transform =
      "translate(-50%, -50%) scale(" +
      String(sprite.displayScale ?? 1) +
      ")";
  }

  function ensureHudIcon({
    actorId,
    statusId,
    instance,
    target,
    presentation,
    expected
  }) {
    if (!target?.statusHost) {
      return;
    }

    const key = recordKey(
      actorId,
      statusId,
      "hud"
    );
    expected.add(key);

    let record =
      records.get(key) ?? null;
    if (!record) {
      const node =
        target.statusHost.ownerDocument
          .createElement("span");
      node.className = "status-icon";
      node.dataset.statusFx = "hud-icon";
      node.dataset.statusId = statusId;
      target.statusHost.append(node);

      const glyphNode =
        target.statusHost.ownerDocument
          .createElement("span");
      glyphNode.className =
        "status-icon__glyph";
      node.append(glyphNode);

      record = {
        node,
        glyphNode,
        stackNode: null
      };
      records.set(key, record);
    }

    const polarity =
      instance?.definition?.polarity ??
      "neutral";
    const stacks = Math.max(
      1,
      Number(instance?.stacks) || 1
    );
    const sprite =
      presentation?.sprite ?? null;

    record.node.dataset.polarity =
      polarity;
    record.node.dataset.stacks =
      String(stacks);
    record.node.title = statusId;
    record.node.style.backgroundColor =
      presentation?.tintColor ??
      polarityColor(polarity);

    if (sprite?.url) {
      record.node.style.backgroundImage =
        'url("' +
        String(sprite.url).replace(
          /"/g,
          "\\\""
        ) +
        '")';
      record.glyphNode.textContent = "";
    } else {
      record.node.style.backgroundImage =
        "none";
      record.glyphNode.textContent =
        polarityGlyph(polarity);
    }

    if (stacks > 1) {
      if (!record.stackNode) {
        const stackNode =
          target.statusHost.ownerDocument
            .createElement("strong");
        stackNode.className =
          "status-icon__stack";
        record.node.append(stackNode);
        record.stackNode = stackNode;
      }
      record.stackNode.textContent =
        String(stacks);
    } else if (record.stackNode) {
      record.stackNode.remove?.();
      record.stackNode = null;
    }
  }

  function sync(state) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        activeCount: 0
      });
    }

    if (
      !state ||
      typeof state !== "object" ||
      Array.isArray(state) ||
      !state.fighters ||
      typeof state.fighters !== "object"
    ) {
      throw new TypeError(
        "combat state with fighters is required"
      );
    }

    const expected = new Set();

    for (
      const [actorId, fighter] of
      Object.entries(state.fighters)
    ) {
      for (
        const instance of
        statusInstances(fighter)
      ) {
        const definition =
          instance?.definition ?? null;
        const statusId =
          String(
            definition?.id ?? ""
          ).trim();

        if (!statusId) {
          continue;
        }

        const presentation =
          resolvePresentation(statusId);
        const target =
          resolveTarget(actorId);

        ensureHudIcon({
          actorId,
          statusId,
          instance,
          target,
          presentation,
          expected
        });

        if (
          !presentation ||
          presentation.mode === "none"
        ) {
          continue;
        }

        if (
          !target?.motion ||
          !target?.image ||
          !target.motion.ownerDocument
        ) {
          continue;
        }

        if (
          presentationUsesTint(
            presentation
          )
        ) {
          ensureTint({
            actorId,
            statusId,
            target,
            presentation,
            expected
          });
        }

        if (
          presentationUsesSprite(
            presentation
          )
        ) {
          ensureSprite({
            actorId,
            statusId,
            target,
            presentation,
            expected
          });
        }
      }
    }

    for (const key of [...records.keys()]) {
      if (!expected.has(key)) {
        removeRecord(key);
      }
    }

    return Object.freeze({
      status: "synced",
      activeCount: records.size
    });
  }

  function dispose() {
    if (disposed) {
      return;
    }
    for (const key of [...records.keys()]) {
      removeRecord(key);
    }
    disposed = true;
  }

  return Object.freeze({
    sync,
    dispose,
    get activeCount() {
      return records.size;
    }
  });
}
