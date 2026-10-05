function frozenPreset({
  id,
  label,
  description,
  trail,
  burst,
  smoke
}) {
  return Object.freeze({
    id,
    label,
    description,
    trail: Object.freeze({
      ...trail
    }),
    burst: Object.freeze({
      ...burst
    }),
    smoke: Object.freeze({
      ...smoke
    })
  });
}

export const CAPTURE_FX_PARTICLE_PRESETS_V1 =
  Object.freeze([
    frozenPreset({
      id: "none",
      label: "Aucune",
      description:
        "Aucune particule supplémentaire.",
      trail: {
        count: 0,
        lengthPx: 0,
        sizePx: 0,
        opacity: 0
      },
      burst: {
        count: 0,
        spreadPx: 0,
        sizePx: 0,
        durationMs: 0,
        opacity: 0
      },
      smoke: {
        count: 0,
        spreadPx: 0,
        sizePx: 0,
        risePx: 0,
        durationMs: 0,
        opacity: 0
      }
    }),
    frozenPreset({
      id: "discreet",
      label: "Discrète",
      description:
        "Quelques particules légères, peu envahissantes.",
      trail: {
        count: 3,
        lengthPx: 28,
        sizePx: 4,
        opacity: 0.45
      },
      burst: {
        count: 5,
        spreadPx: 36,
        sizePx: 5,
        durationMs: 260,
        opacity: 0.55
      },
      smoke: {
        count: 2,
        spreadPx: 28,
        sizePx: 20,
        risePx: 26,
        durationMs: 560,
        opacity: 0.24
      }
    }),
    frozenPreset({
      id: "visible",
      label: "Visible",
      description:
        "Traînée et impact bien perceptibles sans surcharger l’écran.",
      trail: {
        count: 5,
        lengthPx: 40,
        sizePx: 6,
        opacity: 0.65
      },
      burst: {
        count: 8,
        spreadPx: 52,
        sizePx: 7,
        durationMs: 320,
        opacity: 0.75
      },
      smoke: {
        count: 3,
        spreadPx: 36,
        sizePx: 24,
        risePx: 34,
        durationMs: 660,
        opacity: 0.32
      }
    }),
    frozenPreset({
      id: "intense",
      label: "Intense",
      description:
        "Particules nombreuses et impact marqué.",
      trail: {
        count: 7,
        lengthPx: 56,
        sizePx: 7,
        opacity: 0.8
      },
      burst: {
        count: 12,
        spreadPx: 72,
        sizePx: 9,
        durationMs: 380,
        opacity: 0.9
      },
      smoke: {
        count: 5,
        spreadPx: 46,
        sizePx: 28,
        risePx: 42,
        durationMs: 760,
        opacity: 0.42
      }
    }),
    frozenPreset({
      id: "very-intense",
      label: "Très intense",
      description:
        "Effet spectaculaire avec budget mobile toujours borné.",
      trail: {
        count: 10,
        lengthPx: 72,
        sizePx: 9,
        opacity: 0.95
      },
      burst: {
        count: 18,
        spreadPx: 96,
        sizePx: 11,
        durationMs: 460,
        opacity: 1
      },
      smoke: {
        count: 8,
        spreadPx: 60,
        sizePx: 34,
        risePx: 54,
        durationMs: 920,
        opacity: 0.5
      }
    })
  ]);

const BY_ID = new Map(
  CAPTURE_FX_PARTICLE_PRESETS_V1.map(
    (preset) => [preset.id, preset]
  )
);

export function captureFxParticlePresetByIdV1(
  presetId
) {
  return BY_ID.get(
    String(presetId ?? "")
  ) ?? null;
}

export function applyCaptureFxParticlePresetV1({
  presetId,
  presentation = {}
}) {
  if (
    !presentation ||
    typeof presentation !== "object" ||
    Array.isArray(presentation)
  ) {
    throw new TypeError(
      "presentation must be an object"
    );
  }

  const preset =
    captureFxParticlePresetByIdV1(
      presetId
    );

  if (preset === null) {
    throw new RangeError(
      "Unknown Capture FX particle preset: " +
        presetId
    );
  }

  return {
    ...presentation,
    projectileTrailCount:
      preset.trail.count,
    projectileTrailLengthPx:
      preset.trail.lengthPx,
    projectileTrailSizePx:
      preset.trail.sizePx,
    projectileTrailOpacity:
      preset.trail.opacity,
    impactBurstCount:
      preset.burst.count,
    impactBurstSpreadPx:
      preset.burst.spreadPx,
    impactBurstSizePx:
      preset.burst.sizePx,
    impactBurstDurationMs:
      preset.burst.durationMs,
    impactBurstOpacity:
      preset.burst.opacity,
    aftermathSmokeCount:
      preset.smoke.count,
    aftermathSmokeSpreadPx:
      preset.smoke.spreadPx,
    aftermathSmokeSizePx:
      preset.smoke.sizePx,
    aftermathSmokeRisePx:
      preset.smoke.risePx,
    aftermathSmokeDurationMs:
      preset.smoke.durationMs,
    aftermathSmokeOpacity:
      preset.smoke.opacity
  };
}

function sameNumber(left, right) {
  return Math.abs(
    Number(left) - Number(right)
  ) < 1e-9;
}

export function captureFxParticlePresetIdForValuesV1(
  presentation = {}
) {
  for (
    const preset of
      CAPTURE_FX_PARTICLE_PRESETS_V1
  ) {
    const trail = preset.trail;
    const burst = preset.burst;
    const smoke = preset.smoke;

    if (
      sameNumber(
        presentation.projectileTrailCount,
        trail.count
      ) &&
      sameNumber(
        presentation.projectileTrailLengthPx,
        trail.lengthPx
      ) &&
      sameNumber(
        presentation.projectileTrailSizePx,
        trail.sizePx
      ) &&
      sameNumber(
        presentation.projectileTrailOpacity,
        trail.opacity
      ) &&
      sameNumber(
        presentation.impactBurstCount,
        burst.count
      ) &&
      sameNumber(
        presentation.impactBurstSpreadPx,
        burst.spreadPx
      ) &&
      sameNumber(
        presentation.impactBurstSizePx,
        burst.sizePx
      ) &&
      sameNumber(
        presentation.impactBurstDurationMs,
        burst.durationMs
      ) &&
      sameNumber(
        presentation.impactBurstOpacity,
        burst.opacity
      ) &&
      sameNumber(
        presentation.aftermathSmokeCount,
        smoke.count
      ) &&
      sameNumber(
        presentation.aftermathSmokeSpreadPx,
        smoke.spreadPx
      ) &&
      sameNumber(
        presentation.aftermathSmokeSizePx,
        smoke.sizePx
      ) &&
      sameNumber(
        presentation.aftermathSmokeRisePx,
        smoke.risePx
      ) &&
      sameNumber(
        presentation.aftermathSmokeDurationMs,
        smoke.durationMs
      ) &&
      sameNumber(
        presentation.aftermathSmokeOpacity,
        smoke.opacity
      )
    ) {
      return preset.id;
    }
  }

  return "custom";
}
