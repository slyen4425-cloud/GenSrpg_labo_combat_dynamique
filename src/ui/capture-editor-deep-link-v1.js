// The existing Lab author editor owns the tabs and their state.
// This only reads an allowlisted deep-link hint and clicks the EXACT native tab.
// No parallel editor, copied rules, storage, or interaction handlers.
const VALID_TABS=Object.freeze(["creature","skills","combat"]);
export function applyCaptureAuthorTabFromUrlV1({root,href}={}){
 if(!root||typeof root.querySelector!=="function")
  throw new TypeError("Existing Lab author root is required");
 const url=new URL(href);
 const tab=url.searchParams.get("tab");
 if(!VALID_TABS.includes(tab))return false;
 const nativeButton=root.querySelector('[data-editor-tab="'+tab+'"]');
 if(!nativeButton||typeof nativeButton.click!=="function")
  throw new Error("Canonical Lab editor tab is unavailable: "+tab);
 nativeButton.click();
 return true;
}
