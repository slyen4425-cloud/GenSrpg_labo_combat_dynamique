import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");

test("Sylvorne editor published document refreshes the exact auto-binding module",()=>{
 const html=read("examples/dom-demo/capture-editor-v2.html");
 const entry=read("examples/dom-demo/capture-editor-v2.js");
 const token="sylvorne-editor-media-20261111";
 assert.ok(html.includes(token));
 assert.ok(entry.includes("capture-editor-human-v2.js?v="));
 assert.ok(entry.includes(token));
});

test("creature editor retains an authored canonical assetId while a menu is not hydrated",()=>{
 const source=read("src/ui/capture-editor-human-v2.js");
 assert.ok(source.includes("function setFieldValue(root, selector, value)"));
 assert.ok(source.includes('field.matches?.("select[data-asset-role]")'));
 assert.ok(source.includes("createOption(field, publishedValue,"));
 assert.ok(source.includes("field.value = publishedValue;"));
 const browser=read("tests/browser/capture-creature-library-smoke.mjs");
 assert.ok(browser.includes("verify-sylvorne-editor-media"));
 assert.ok(browser.includes("ok:face:back:icon:restored"));
});
