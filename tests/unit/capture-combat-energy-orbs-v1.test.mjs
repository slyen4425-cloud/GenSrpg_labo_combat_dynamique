import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  projectCombatEnergyOrbsV1,
  createCombatEnergyOrbsRendererV1
} from "../../src/adapters/renderer/combat-energy-orbs-v1.js";

function domHost() {
  const host = {
    children: [],
    attributes: {},
    ownerDocument: {
      createElement(tagName) {
        return {
          tagName,
          className: "",
          attributes: {},
          style: {
            values: {},
            setProperty(key, value) {
              this.values[key] = value;
            }
          },
          setAttribute(key, value) {
            this.attributes[key] = String(value);
          }
        };
      }
    },
    replaceChildren(...nodes) {
      this.children = nodes;
    },
    setAttribute(key, value) {
      this.attributes[key] = String(value);
    }
  };
  return host;
}

test("one energy orb per point for native capacities <=12, including decimal partial fill", () => {
  assert.deepEqual(projectCombatEnergyOrbsV1({energy:2.5,maxEnergy:4}), [1,1,0.5,0]);
  assert.deepEqual(projectCombatEnergyOrbsV1({energy:0,maxEnergy:3}), [0,0,0]);
  assert.deepEqual(projectCombatEnergyOrbsV1({energy:10,maxEnergy:10}), Array(10).fill(1));
});

test("large max energy projects up to twelve proportional circles, with exact numeric data retained", () => {
  const values=projectCombatEnergyOrbsV1({energy:6,maxEnergy:24});
  assert.equal(values.length,12);
  assert.deepEqual(values.slice(0,5),[1,1,1,0,0]);
  assert.equal(projectCombatEnergyOrbsV1({energy:9,maxEnergy:18}).filter(x=>x===1).length,6);
  assert.deepEqual(projectCombatEnergyOrbsV1({energy:0,maxEnergy:0}),[0]);
  assert.deepEqual(projectCombatEnergyOrbsV1({energy:-5,maxEnergy:2}),[0,0]);
  assert.deepEqual(projectCombatEnergyOrbsV1({energy:99,maxEnergy:2}),[1,1]);
});

test("DOM projection reuses orb nodes on recharge, updates partial fill, switch and accessible number", () => {
  const host=domHost(),renderer=createCombatEnergyOrbsRendererV1({host});
  renderer.render({energy:2,maxEnergy:5});
  assert.equal(host.children.length,5);
  const initial=host.children[1];
  assert.equal(initial.style.values["--energy-orb-fill"],"100%");
  assert.equal(host.children[2].style.values["--energy-orb-fill"],"0%");
  assert.equal(host.attributes["aria-label"],"Énergie : 2 sur 5");
  renderer.render({energy:2.5,maxEnergy:5});
  assert.equal(host.children[1],initial,"no redundant DOM rebuild or lost transition");
  assert.equal(host.children[2].style.values["--energy-orb-fill"],"50%");
  renderer.render({energy:1,maxEnergy:2});
  assert.equal(host.children.length,2,"new creature with new cap gets matching circles");
  assert.equal(host.attributes["aria-label"],"Énergie : 1 sur 2");
  renderer.render({energy:0,maxEnergy:0});
  assert.equal(host.children.length,1,"zero max still has a visible empty state");
});

test("existing combat HUD has a native value plus decorative accessible orbs, no core engine edits", async () => {
  const [html,css,controller]=await Promise.all([
    readFile("examples/dom-demo/capture-editor-v2.html","utf8"),
    readFile("examples/dom-demo/demo.css","utf8"),
    readFile("src/ui/combat-2v2-test-ui.js","utf8")
  ]);
  for(const marker of ['data-combat-energy-orbs="local-1"','data-combat-energy="local-1"','data-combat-energy-value="local-1"']) {
    assert.ok(html.includes(marker),"HUD marker missing "+marker);
  }
  assert.match(css,/\.hud__energy-orb\s*\{/);
  assert.match(css,/\.hud__energy-orb::before\s*\{/);
  assert.match(controller,/createCombatEnergyOrbsRendererV1/);
  assert.match(controller,/energyOrbs\.render\(\{\s*energy: local\.energy,\s*maxEnergy: local\.maxEnergy/);
});
