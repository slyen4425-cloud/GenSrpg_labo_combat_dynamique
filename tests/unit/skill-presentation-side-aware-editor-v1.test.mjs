import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanSkillDraftV1,
  humanSkillEditorFieldsFromDraftV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  skillSpriteControlsFromFieldsV1,
  skillSpriteControlFieldsFromVisualsV1
} from "../../src/ui/capture-editor-sprite-controls-v1.js";

function baseSkillFields() {
  return {
    id: "side-aware-test",
    name: "Side aware test",
    description: "Side-aware presentation test.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "area",
    element: null,
    approachMode: "none",
    energyCost: 0,
    preparationMs: 500,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    damage: 0,
    heal: 0,
    stunMs: 0,
    interruptsPreparation: false,
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    presentation: {
      castAssetId: "test:cast",
      castDisplayScale: 1,
      castOffsetX: 25,
      castOffsetY: -10,
      castOffsetMode: "mirror_x",
      impactAssetId: "test:impact",
      impactDisplayScale: 1,
      impactOffsetX: 15,
      impactOffsetY: 5,
      impactOffsetMode: "custom",
      impactOpponentOffsetX: -32,
      impactOpponentOffsetY: 7,
      zoneAssetId: "test:zone",
      zoneDisplayScale: 1,
      zoneDisplayScaleX: 1,
      zoneDisplayScaleY: 1,
      zoneOffsetX: 12,
      zoneOffsetY: 4,
      zoneOffsetMode: "same",
      iconAssetId: "",
      travelAssetId: "",
      socketId: null,
      castAudioAssetId: "",
      travelAudioAssetId: "",
      impactAudioAssetId: "",
      zoneAudioAssetId: ""
    }
  };
}

test("Human Editor builds V9 only when side-aware offsets are explicitly authored", () => {
  const draft =
    buildHumanSkillDraftV1(
      baseSkillFields()
    );

  assert.equal(
    draft.presentation.version,
    9
  );
  assert.equal(
    draft.presentation.visual.cast.offsetMode,
    "mirror_x"
  );
  assert.equal(
    draft.presentation.visual.impact.offsetMode,
    "custom"
  );
  assert.equal(
    draft.presentation.visual.impact.opponentOffsetX,
    -32
  );
  assert.equal(
    draft.presentation.visual.impact.opponentOffsetY,
    7
  );
  assert.equal(
    draft.presentation.visual.aura.offsetMode,
    "same"
  );
});

test("Human Editor side-aware presentation round-trip keeps player reference and opponent override", () => {
  const draft =
    buildHumanSkillDraftV1(
      baseSkillFields()
    );
  const fields =
    humanSkillEditorFieldsFromDraftV1(
      draft
    );

  assert.equal(
    fields.presentation.castOffsetX,
    25
  );
  assert.equal(
    fields.presentation.castOffsetMode,
    "mirror_x"
  );
  assert.equal(
    fields.presentation.impactOffsetMode,
    "custom"
  );
  assert.equal(
    fields.presentation.impactOpponentOffsetX,
    -32
  );
  assert.equal(
    fields.presentation.impactOpponentOffsetY,
    7
  );
  assert.equal(
    fields.presentation.zoneOffsetMode,
    "same"
  );
});

test("sprite control translator preserves legacy same semantics and explicit side modes", () => {
  const legacy =
    skillSpriteControlFieldsFromVisualsV1({
      cast: {
        offsetX: 20,
        offsetY: -5,
        layerByView: {
          player: "front",
          opponent: "front"
        }
      }
    });

  assert.equal(
    legacy.castOffsetMode,
    "same"
  );

  const explicit =
    skillSpriteControlsFromFieldsV1(
      {
        castOffsetX: 20,
        castOffsetY: -5,
        castOffsetMode: "custom",
        castOpponentOffsetX: -35,
        castOpponentOffsetY: -3
      },
      "cast"
    );

  assert.equal(
    explicit.offsetMode,
    "custom"
  );
  assert.equal(
    explicit.opponentOffsetX,
    -35
  );
  assert.equal(
    explicit.opponentOffsetY,
    -3
  );
});

test("real Human Editor page exposes mirror mode and explicit opponent X/Y for cast impact and zone", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const role of [
    "cast",
    "impact",
    "zone"
  ]) {
    assert.equal(
      html.includes(
        "data-skill-" +
          role +
          "-offset-mode"
      ),
      true,
      role + " offset mode must be visible"
    );
    assert.equal(
      html.includes(
        "data-skill-" +
          role +
          "-opponent-offset-x"
      ),
      true,
      role + " opponent X must be visible"
    );
    assert.equal(
      html.includes(
        "data-skill-" +
          role +
          "-opponent-offset-y"
      ),
      true,
      role + " opponent Y must be visible"
    );
  }

  assert.equal(
    html.includes(
      '<option value="mirror_x" selected>Miroir horizontal automatique</option>'
    ),
    true
  );
});
