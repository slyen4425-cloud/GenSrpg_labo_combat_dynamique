import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { createProfileRegistry } from "../../src/core/profiles/profile-registry.js";
import { animationPlanToDomTimeline } from "../../src/adapters/renderer/dom-keyframes.js";
import { createDomActorRenderer } from "../../src/adapters/renderer/dom-actor-renderer.js";

const profiles = await Promise.all(["biped", "quadruped", "massive", "serpentine", "flying"].map(async name =>
  JSON.parse(await readFile("data/profiles/" + name + ".profile.json", "utf8"))));
const registry = createProfileRegistry(profiles);
function actorFor(profile, view) {
  return normalizeVisualActor({ id: profile + "-" + view, creatureId: "test-creature", profile,
    view, asset: "test.webp", position: { x: 12, y: -4 }, scale: view === "player" ? 1.3 : 0.7 });
}
function planFor(actor, type) {
  return planAnimation({ actor, profile: registry.get(actor.profile),
    event: normalizeCombatVisualEvent({ type, actorId: actor.id, targetId: "other",
      metadata: { targetTranslateX: actor.view === "player" ? 180 : -180,
        targetTranslateY: actor.view === "player" ? -80 : 80,
        travelMs: 800, arenaHeight: 400, arenaExitTranslateY: -420 } }) });
}
function translation(frame) {
  return [...frame.transform.match(/translate3d\((-?[\d.]+)px, (-?[\d.]+)px, 0\)/)].slice(1).map(Number);
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function harness(actor) {
  const styles = {};
  const element = { style: {} };
  const shadowElement = { style: { setProperty(name, value) { styles[name] = value; } } };
  const calls = [];
  const renderer = createDomActorRenderer({ element, shadowElement, actor,
    animate(target, keyframes, options) {
      const done = deferred();
      const animation = { ready: Promise.resolve(), startTime: calls.length ? 25 : 10,
        finished: done.promise, cancelled: false, cancel() {
          this.cancelled = true; const error = new Error("cancelled"); error.name = "AbortError"; done.reject(error);
        } };
      calls.push({ target, keyframes, options, animation, done });
      return animation;
    } });
  return { renderer, calls, styles, element, shadowElement };
}

for (const view of ["player", "opponent"]) {
  for (const profile of ["biped", "quadruped", "massive", "serpentine", "flying"]) {
    test(profile + " " + view + ": ground shadow follows approach depth and return without body hopping", () => {
      const actor = actorFor(profile, view), plan = planFor(actor, "ground-attack");
      const timeline = animationPlanToDomTimeline(plan, actor);
      assert.ok(timeline.shadowKeyframes, "the canonical timeline must include the ground projection");
      assert.equal(timeline.shadowKeyframes.length, timeline.keyframes.length);
      let elapsed = 0;
      for (let i = 0; i < plan.segments.length - 1; i++) {
        elapsed += plan.segments[i].durationMs;
        const p = elapsed / 800, frame = timeline.shadowKeyframes[i + 1];
        assert.equal(frame.offset, timeline.keyframes[i + 1].offset);
        assert.equal(frame.easing, timeline.keyframes[i + 1].easing);
        assert.equal(translation(frame)[0], translation(timeline.keyframes[i + 1])[0]);
        assert.ok(Math.abs(translation(frame)[1] - (-4 + (view === "player" ? -80 : 80) * p)) < 0.0011);
        assert.doesNotMatch(frame.transform, /rotate\(/, "the ground ellipse must not pitch with the body");
      }
      assert.deepEqual(translation(timeline.shadowKeyframes.at(-1)), [12, -4]);
      assert.equal(timeline.shadowKeyframes.at(-1).transform, timeline.shadowKeyframes[0].transform);
    });
  }
  test(view + ": aerial shadow crosses the ground, never the offscreen apex", () => {
    const actor = actorFor("flying", view), plan = planFor(actor, "aerial-attack");
    const timeline = animationPlanToDomTimeline(plan, actor);
    assert.ok(timeline.shadowKeyframes);
    const ground = translation(timeline.shadowKeyframes[1]), body = translation(timeline.keyframes[1]);
    assert.equal(ground[0], body[0]);
    assert.ok(Math.abs(ground[1] - (-4 + (view === "player" ? -80 : 80) * 0.42)) < 0.0011);
    assert.ok(body[1] < -400);
    assert.equal(timeline.shadowKeyframes[2].transform.includes(view === "player" ? "-84px" : "76px"), true);
  });
}
test("simple attack and floating idle keep the ellipse on the ground while following lateral motion", () => {
  const actor = actorFor("serpentine", "player");
  for (const type of ["attack", "idle", "hit"]) {
    const timeline = animationPlanToDomTimeline(planFor(actor, type), actor);
    assert.ok(timeline.shadowKeyframes);
    for (let i = 0; i < timeline.keyframes.length; i++) {
      assert.equal(translation(timeline.shadowKeyframes[i])[0], translation(timeline.keyframes[i])[0]);
      assert.equal(translation(timeline.shadowKeyframes[i])[1], -4);
    }
  }
});
test("teleport and KO share body visibility, depth and terminal ownership", async () => {
  const actor = actorFor("flying", "opponent");
  const teleport = animationPlanToDomTimeline(planFor(actor, "teleport-attack"), actor);
  assert.ok(teleport.shadowKeyframes);
  assert.deepEqual(teleport.shadowKeyframes.map(f => f.opacity), teleport.keyframes.map(f => f.opacity));
  assert.deepEqual(translation(teleport.shadowKeyframes[2]), [-168, 76]);
  const h = harness(actor), handle = h.renderer.play(planFor(actor, "ko"));
  assert.equal(h.calls.length, 2);
  h.calls.forEach(c => c.done.resolve());
  await handle.finished;
  assert.equal(h.styles["--creature-shadow-fade"], "0");
  h.renderer.dispose();
  assert.equal(h.styles["--creature-shadow-fade"], "1");
  assert.equal(h.renderer.isDisposed, true);
});
test("one renderer owns both WAAPI tracks, synchronizes them and restores after completion", async () => {
  const actor = actorFor("quadruped", "player"), h = harness(actor);
  const handle = h.renderer.play(planFor(actor, "ground-attack"));
  assert.equal(h.calls.length, 2, "body and shadow tracks must be owned together");
  assert.equal(h.calls[1].target, h.shadowElement);
  assert.equal(h.calls[1].options.pseudoElement, "::before");
  assert.equal(h.calls[0].options.duration, h.calls[1].options.duration);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.calls[1].animation.startTime, h.calls[0].animation.startTime);
  h.calls.forEach(c => c.done.resolve());
  await handle.finished;
  assert.equal(h.styles["--creature-shadow-fade"], "1");
  assert.deepEqual(translation({transform: h.styles["--creature-shadow-transform"]}), [12, -4]);
});
test("attack interruption and dispose cancel both tracks, with no stale shadow restoration", async () => {
  const actor = actorFor("flying", "player"), h = harness(actor);
  const old = h.renderer.play(planFor(actor, "idle"));
  h.renderer.play(planFor(actor, "attack"));
  assert.equal(h.calls.length, 4);
  assert.ok(h.calls[0].animation.cancelled && h.calls[1].animation.cancelled);
  assert.equal((await old.finished).status, "cancelled");
  assert.equal(h.renderer.hasActiveAnimation, true);
  h.renderer.dispose();
  assert.ok(h.calls[2].animation.cancelled && h.calls[3].animation.cancelled);
  assert.equal(h.renderer.hasActiveAnimation, false);
});
test("native slot and CSS project the shadow through the existing renderer", async () => {
  const app = await readFile("src/ui/demo-app.js", "utf8"), css = await readFile("examples/dom-demo/demo.css", "utf8");
  assert.match(app, /shadowElement:\s*slotContainer/);
  assert.match(css, /var\(--creature-shadow-transform/);
  assert.match(css, /var\(--creature-shadow-fade/);
});
