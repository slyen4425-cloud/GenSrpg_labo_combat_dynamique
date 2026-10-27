import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createDomStatusFxRenderer } from "../../src/adapters/renderer/dom-status-fx.js";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const definition={id:"stack",kind:"stack_counter",polarity:"detrimental",durationModel:"time_ms",durationMs:10000,stacking:"stack",maxStacks:3,tags:[],onStackThreshold:{count:3,consume:"reset",effects:[{kind:"damage",targetScope:"target",amount:1,channel:"electric"}]}};
const status=(stacks,expiresAtMs)=>({definition,sourceActorId:"enemy",sourceSkillId:"lib_static_bite",stacks,appliedAtMs:1000,expiresAtMs});
const state=(elapsedMs,instances)=>({elapsedMs,fighters:{enemy:{statusEffects:instances}}});

test("Real status HUD countdown follows native onClock snapshots without a second clock",()=>{
 const doc={createElement(){const n={className:"",dataset:{},style:{},hidden:false,textContent:"",children:[],append(...c){this.children.push(...c)},remove(){this.removed=true},setAttribute(){}};n.ownerDocument=doc;return n;}};
 const statusHost=doc.createElement("div");
 const renderer=createDomStatusFxRenderer({targetFor:()=>({statusHost}),statusPresentationFor:()=>null,skillPresentationFor:()=>null,skillDefinitionFor:()=>null});
 renderer.sync(state(2000,[status(2,10000)]));
 assert.equal(typeof renderer.syncCountdowns,"function","status HUD must expose a lightweight native clock refresh");
 const icon=statusHost.children[0];
 const badge=icon.children.find(child=>child.className==="status-icon__expiry");
 const progress=icon.children.find(child=>child.className==="status-icon__expiry-track");
 assert.ok(badge);
 assert.ok(progress,"real shared-expiration progress bar must exist");
 const fill=progress.children.find(child=>child.className==="status-icon__expiry-fill");
 assert.ok(fill);
 assert.equal(badge.textContent,"8 s");
 assert.equal(fill.style.width,"80%");
 renderer.syncCountdowns(state(2100,[status(2,10000)]));
 assert.equal(badge.textContent,"8 s","whole seconds must not flicker each 50ms tick");
 assert.equal(fill.style.width,"79%");
 renderer.syncCountdowns(state(3100,[status(2,10000)]));
 assert.equal(badge.textContent,"7 s");
 assert.equal(fill.style.width,"69%");
 renderer.syncCountdowns(state(6100,[status(3,16000)]));
 assert.equal(badge.textContent,"10 s","a new charge refreshes the one shared lifetime");
 assert.equal(fill.style.width,"99%");
 renderer.sync(state(16000,[]));
 assert.equal(icon.removed,true,"expired HUD icon removed by canonical state");
 renderer.dispose();
});
test("Both Capture combat UI paths consume onClock state, without new timers or runtime changes",()=>{
 const renderer=read("src/adapters/renderer/dom-status-fx.js");
 const modern=read("src/ui/combat-2v2-test-ui.js");
 const classic=read("src/ui/combat-test-ui.js");
 const css=read("examples/dom-demo/demo.css");
 assert.match(modern,/onClock\(state\)\s*\{[^}]*statusFx\?\.syncCountdowns\(state\)/);
 assert.match(classic,/onClock\(state\)\s*\{[^}]*statusFx\?\.syncCountdowns\(state\)/);
 assert.match(css,/\.status-icon__expiry-track\s*\{/);
 assert.match(css,/\.status-icon__expiry-fill\s*\{/);
 assert.doesNotMatch(renderer,/setInterval|setTimeout/);
});
