import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createOpponentDecisionController } from "../../src/core/combat/opponent-decision-controller.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const [
  fireball,
  claw,
  aerialDive,
  teleportStrike,
  dodge,
  mirrorShield,
  fireImmunity,
  contactCounter,
  policy
] = await Promise.all([
  json("data/combat/skills/fireball.skill.json"),
  json("data/combat/skills/claw.skill.json"),
  json("data/combat/skills/aerial-dive.skill.json"),
  json("data/combat/skills/teleport-strike.skill.json"),
  json("data/combat/skills/dodge.skill.json"),
  json("data/combat/skills/mirror-shield.skill.json"),
  json("data/combat/skills/fire-immunity.skill.json"),
  json("data/combat/skills/contact-counter.skill.json"),
  json("data/combat/ai/opponent-aggressive.policy.json")
]);

const skills = [
  fireball,
  claw,
  aerialDive,
  teleportStrike
].map(normalizeSkillDefinition);

const reactions = [
  dodge,
  mirrorShield,
  fireImmunity,
  contactCounter
].map(normalizeSkillDefinition);

function controller() {
  return createOpponentDecisionController({
    actorId: "opponent",
    targetId: "player",
    skills,
    reactions,
    policy
  });
}

function playerAction(skillId) {
  const skill = skills.find((item) => item.id === skillId);
  return {
    actionType: "skill",
    actorId: "player",
    targetId: "opponent",
    skill
  };
}

test("projectile reaction prefers mirror shield when legal", () => {
  const ai = controller();
  const checked = [];

  const decision = ai.chooseReaction({
    action: playerAction("fireball"),
    previewReaction(skill) {
      checked.push(skill.id);
      return { ok: true, outcome: "reflected" };
    }
  });

  assert.equal(decision.kind, "reaction");
  assert.equal(decision.skill.id, "mirror-shield");
  assert.deepEqual(checked, ["mirror-shield"]);
});

test("ground contact reaction prefers counter before dodge", () => {
  const ai = controller();

  const decision = ai.chooseReaction({
    action: playerAction("claw"),
    previewReaction(skill) {
      return {
        ok: skill.id === "contact-counter",
        outcome:
          skill.id === "contact-counter"
            ? "countered"
            : "no_effect"
      };
    }
  });

  assert.equal(decision.kind, "reaction");
  assert.equal(decision.skill.id, "contact-counter");
});

test("aerial and teleport approaches prefer dodge", () => {
  for (const skillId of ["aerial-dive", "teleport-strike"]) {
    const ai = controller();
    const decision = ai.chooseReaction({
      action: playerAction(skillId),
      previewReaction(skill) {
        return {
          ok: skill.id === "dodge",
          outcome: skill.id === "dodge" ? "evaded" : "no_effect"
        };
      }
    });

    assert.equal(decision.kind, "reaction");
    assert.equal(decision.skill.id, "dodge");
  }
});

test("AI proposes movement toward the desired skill range before switching skill", () => {
  const ai = controller();

  const decision = ai.chooseAction({
    currentDistance: "medium",
    previewSkill(skill) {
      return skill.id === "claw"
        ? { ok: false, outcome: "out_of_range" }
        : { ok: true, outcome: "hit" };
    },
    previewMovement(toDistance) {
      return toDistance === "short"
        ? { ok: true, outcome: "moved", cost: 3 }
        : { ok: false, outcome: "insufficient_energy" };
    }
  });

  assert.deepEqual(
    {
      kind: decision.kind,
      toDistance: decision.toDistance,
      forSkillId: decision.forSkillId
    },
    {
      kind: "move",
      toDistance: "short",
      forSkillId: "claw"
    }
  );
  assert.equal(ai.skillCursor, 0);
});

test("confirmed skills advance the deterministic offensive cycle", () => {
  const ai = controller();

  const first = ai.chooseAction({
    currentDistance: "short",
    previewSkill(skill) {
      return skill.id === "claw"
        ? { ok: true, outcome: "hit" }
        : { ok: false, outcome: "out_of_range" };
    },
    previewMovement() {
      return { ok: false, outcome: "insufficient_energy" };
    }
  });

  assert.equal(first.kind, "skill");
  assert.equal(first.skill.id, "claw");
  ai.confirm(first);
  assert.equal(ai.skillCursor, 1);

  const second = ai.chooseAction({
    currentDistance: "medium",
    previewSkill(skill) {
      return skill.id === "aerial-dive"
        ? { ok: true, outcome: "hit" }
        : { ok: false, outcome: "insufficient_energy" };
    },
    previewMovement() {
      return { ok: false, outcome: "insufficient_energy" };
    }
  });

  assert.equal(second.kind, "skill");
  assert.equal(second.skill.id, "aerial-dive");
});

test("AI falls back to another legal skill when desired action cannot start", () => {
  const ai = controller();

  const decision = ai.chooseAction({
    currentDistance: "medium",
    previewSkill(skill) {
      if (skill.id === "teleport-strike") {
        return { ok: true, outcome: "hit" };
      }
      return {
        ok: false,
        outcome:
          skill.id === "claw"
            ? "out_of_range"
            : "insufficient_energy"
      };
    },
    previewMovement() {
      return { ok: false, outcome: "insufficient_energy" };
    }
  });

  assert.equal(decision.kind, "skill");
  assert.equal(decision.skill.id, "teleport-strike");
});

test("AI waits when no action or reaction is legal", () => {
  const ai = controller();

  const action = ai.chooseAction({
    currentDistance: "medium",
    previewSkill() {
      return { ok: false, outcome: "insufficient_energy" };
    },
    previewMovement() {
      return { ok: false, outcome: "insufficient_energy" };
    }
  });

  const reaction = ai.chooseReaction({
    action: playerAction("fireball"),
    previewReaction() {
      return { ok: false, outcome: "insufficient_energy" };
    }
  });

  assert.equal(action.kind, "wait");
  assert.equal(reaction.kind, "wait");
});

test("AI ignores skills that do not target the opponent slot", () => {
  const ai = controller();
  const action = playerAction("fireball");
  action.targetId = "someone-else";

  const decision = ai.chooseReaction({
    action,
    previewReaction() {
      throw new Error("previewReaction should not be called");
    }
  });

  assert.equal(decision.kind, "wait");
  assert.equal(decision.reason, "not_targeted");
});
