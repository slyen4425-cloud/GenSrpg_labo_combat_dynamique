import {
  projectStatusEffectInfoV1,
  statusEffectInfoTextV1
} from "./status-effect-info-v1.js";
import { applySpriteVisual, spriteOwnerDurationMs } from "./dom-skill-fx.js";

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
  statusPresentationFor,
  skillPresentationFor = null,
  skillDefinitionFor = null
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
  const resolveSkillPresentation =
    typeof skillPresentationFor === "function"
      ? skillPresentationFor
      : () => null;
  const resolveSkillDefinition =
    typeof skillDefinitionFor === "function"
      ? skillDefinitionFor
      : () => null;

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
    record.frameAnimation?.cancel?.();
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
    instance,
    expected
  }) {
    const sprite = presentation.sprite;
    if (!sprite?.url && !sprite?.frames?.length) {
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
    const spriteSignature = JSON.stringify([
      sprite.assetId, sprite.url, sprite.frames, sprite.frameCount, sprite.frameMs, sprite.playbackMode
    ]);
    if (record && (record.spriteSignature !== spriteSignature || record.motion !== target.motion)) {
      removeRecord(key);
      record = null;
    }
    if (!record) {
      const node =
        target.motion.ownerDocument
          .createElement("span");
      node.className =
        "status-fx status-fx--sprite";
      node.dataset.statusFx = "sprite";
      node.dataset.statusId = statusId;
      target.motion.append(node);
      const durationMs = spriteOwnerDurationMs(instance, instance?.appliedAtMs, Number(sprite.frameMs) * Number(sprite.frameCount));
      const playback = applySpriteVisual(node, { ...sprite, playbackMode: sprite.playbackMode ?? "loop" }, durationMs);
      record = { node, frameAnimation: playback.frameAnimation, spritePlayback: playback, playbackStartedAtMs: instance?.appliedAtMs, spriteSignature, motion: target.motion };
      records.set(key, record);
    }

    record.node.dataset.assetId =
      sprite.assetId ?? "";
    record.node.style.opacity =
      String(sprite.opacity ?? 1);
    record.node.style.left = `calc(50% + ${Number(sprite.offsetX) || 0}px)`;
    record.node.style.top = `calc(50% + ${Number(sprite.offsetY) || 0}px)`;
    record.node.style.zIndex = sprite.layer === "behind" ? "-1" : "3";
    if (sprite.playbackMode === "stretch") {
      record.spritePlayback?.setDuration?.(spriteOwnerDurationMs(instance, record.playbackStartedAtMs, Number(sprite.frameMs) * Number(sprite.frameCount)));
    }
    record.node.style.transform =
      "translate(-50%, -50%) scale(" +
      String(sprite.displayScale ?? 1) +
      ")";
  }

  function ensureHudIcon({
    actorId,
    statusId,
    instance,
    fighter,
    target,
    presentation,
    elapsedMs,
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
        stackNode: null,
        detailsNode: null,
        currentInfo: null
      };

      node.tabIndex = 0;
      node.setAttribute?.("role", "button");

      node.onclick = (event) => {
        event?.stopPropagation?.();

        if (!record.detailsNode) {
          const detailsNode =
            target.statusHost.ownerDocument
              .createElement("span");
          detailsNode.className =
            "status-icon__details";
          detailsNode.dataset.statusFx =
            "hud-details";
          detailsNode.hidden = true;
          node.append(detailsNode);
          record.detailsNode = detailsNode;
        }

        record.detailsNode.hidden =
          !record.detailsNode.hidden;

        if (
          !record.detailsNode.hidden &&
          record.currentInfo
        ) {
          record.detailsNode.textContent =
            statusEffectInfoTextV1(
              record.currentInfo
            );
        }
      };

      node.onkeydown = (event) => {
        if (
          event?.key === "Enter" ||
          event?.key === " "
        ) {
          event.preventDefault?.();
          node.onclick(event);
        }
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
    const sourceSkillId =
      typeof instance?.sourceSkillId === "string" &&
      instance.sourceSkillId.trim() !== ""
        ? instance.sourceSkillId.trim()
        : null;
    const sourceSkillPresentation =
      sourceSkillId === null
        ? null
        : resolveSkillPresentation(
            sourceSkillId,
            {
              sourceActorId:
                instance?.sourceActorId ?? null
            }
          );
    const sourceSkillDefinition =
      sourceSkillId === null
        ? null
        : resolveSkillDefinition(
            sourceSkillId
          );
    const info = projectStatusEffectInfoV1({
      instance,
      elapsedMs,
      sourceSkill:
        sourceSkillDefinition,
      fighter
    });
    record.currentInfo = info;
    const sourceSkillIcon =
      sourceSkillPresentation?.icon ?? null;
    const sprite =
      presentation?.sprite ?? null;
    const spritePreviewUrl = sprite?.url || sprite?.frames?.[Math.floor((sprite.frames.length - 1) / 2)];
    const hudVisual =
      sourceSkillIcon?.url
        ? sourceSkillIcon
        : spritePreviewUrl
          ? sprite
          : null;

    record.node.dataset.polarity =
      polarity;
    record.node.dataset.stacks =
      String(stacks);
    record.node.dataset.sourceSkillId =
      sourceSkillId ?? "";
    record.node.title =
      info.typeLabel +
      " · " +
      info.statusName;
    record.node.setAttribute?.(
      "aria-label",
      statusEffectInfoTextV1(info)
    );

    if (
      record.detailsNode &&
      !record.detailsNode.hidden
    ) {
      record.detailsNode.textContent =
        statusEffectInfoTextV1(info);
    }
    record.node.style.backgroundColor =
      presentation?.tintColor ??
      polarityColor(polarity);

    const hudUrl = hudVisual?.url || hudVisual?.frames?.[Math.floor((hudVisual.frames.length - 1) / 2)];
    if (hudUrl) {
      record.node.style.backgroundImage =
        'url("' +
        String(hudUrl).replace(
          /"/g,
          "\\\""
        ) +
        '")';
      record.node.dataset.assetId =
        hudVisual.assetId ?? "";
      const frameCount = hudVisual.url ? Math.max(1, Math.floor(Number(hudVisual.frameCount) || 1)) : 1;
      record.node.style.backgroundSize = frameCount > 1 ? `${frameCount * 100}% 100%` : "contain";
      record.node.style.backgroundPosition = frameCount > 1
        ? `${100 * Math.floor((frameCount - 1) / 2) / (frameCount - 1)}% 0%`
        : "center";
      record.glyphNode.textContent = "";
    } else {
      record.node.style.backgroundImage =
        "none";
      record.node.style.backgroundSize = "contain";
      record.node.style.backgroundPosition = "center";
      record.node.dataset.assetId = "";
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
          resolvePresentation(statusId, { actorId });
        const target =
          resolveTarget(actorId);

        ensureHudIcon({
          actorId,
          statusId,
          instance,
          fighter,
          target,
          presentation,
          elapsedMs:
            Number(state.elapsedMs) || 0,
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
            instance,
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
