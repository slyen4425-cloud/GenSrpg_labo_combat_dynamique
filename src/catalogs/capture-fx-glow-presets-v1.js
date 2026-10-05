function frozenPreset({
  id,
  label,
  description,
  strength,
  radiusPx
}) {
  return Object.freeze({
    id,
    label,
    description,
    strength,
    radiusPx
  });
}

export const CAPTURE_FX_GLOW_PRESETS_V1 =
  Object.freeze([
    frozenPreset({
      id: "discreet",
      label: "Discret",
      description:
        "Lueur légère : améliore la lisibilité sans attirer fortement l’œil.",
      strength: 0.35,
      radiusPx: 12
    }),
    frozenPreset({
      id: "visible",
      label: "Visible",
      description:
        "Lueur bien perceptible : bon choix par défaut pour la plupart des capacités.",
      strength: 0.65,
      radiusPx: 22
    }),
    frozenPreset({
      id: "intense",
      label: "Intense",
      description:
        "Lueur forte : l’effet ressort clairement pendant le combat.",
      strength: 0.85,
      radiusPx: 32
    }),
    frozenPreset({
      id: "very-intense",
      label: "Très intense",
      description:
        "Lueur spectaculaire : réservée aux attaques importantes ou ultimes.",
      strength: 1,
      radiusPx: 48
    })
  ]);

const BY_ID = new Map(
  CAPTURE_FX_GLOW_PRESETS_V1.map(
    (preset) => [preset.id, preset]
  )
);

export function captureFxGlowPresetByIdV1(
  presetId
) {
  return BY_ID.get(
    String(presetId ?? "")
  ) ?? null;
}

export function applyCaptureFxGlowPresetV1({
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
    captureFxGlowPresetByIdV1(presetId);

  if (preset === null) {
    throw new RangeError(
      "Unknown Capture FX glow preset: " +
        presetId
    );
  }

  return {
    ...presentation,
    fxGlowStrength: preset.strength,
    fxGlowRadiusPx: preset.radiusPx
  };
}

function sameNumber(left, right) {
  return Math.abs(
    Number(left) - Number(right)
  ) < 1e-9;
}

export function captureFxGlowPresetIdForValuesV1(
  presentation = {}
) {
  for (
    const preset of
      CAPTURE_FX_GLOW_PRESETS_V1
  ) {
    if (
      sameNumber(
        presentation.fxGlowStrength,
        preset.strength
      ) &&
      sameNumber(
        presentation.fxGlowRadiusPx,
        preset.radiusPx
      )
    ) {
      return preset.id;
    }
  }

  return "custom";
}
