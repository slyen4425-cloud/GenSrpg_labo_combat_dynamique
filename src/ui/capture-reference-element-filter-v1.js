// One authoring UI owner for filtering any creature/skill reference dropdown.
// The configured registries remain the only source of IDs and elements.
export function createCaptureReferenceElementFiltersV1({
  root, configuredSkills, configuredCreatures, elementMeta, listen = (node,event,cb)=>node.addEventListener(event,cb)
}) {
  const states = new WeakMap();
  const boundFilters = new WeakSet();
  const explicitSkill = "[data-skill-library-select], [data-loadout-slot]";
  const explicitCreature = "[data-creature-library-select], [data-evolution-target], [data-test-local-creature], [data-test-opponent-creature]";

  function getKind(select, options) {
    if (select.matches("[data-skill-element-filter], [data-reference-element-filter]")) return null;
    if (select.matches(explicitSkill)) return "skill";
    if (select.matches(explicitCreature)) return "creature";
    const ids = options.map(o=>o.value).filter(Boolean);
    const skills = ids.filter(id=>configuredSkills.has(id)).length;
    const creatures = ids.filter(id=>configuredCreatures.has(id)).length;
    return skills && !creatures ? "skill" : creatures && !skills ? "creature" : null;
  }
  function idsFor(kind,id) {
    if (kind==="skill") {
      const entry = configuredSkills.get(id);
      if (!entry) return null;
      return [elementMeta(entry.definition?.element).element ?? "__neutral__"];
    }
    const entry = configuredCreatures.get(id);
    if (!entry) return null;
    const elements = entry.draft?.elements ?? [];
    const ids = [...new Set(elements.map(element=>elementMeta(element).element).filter(Boolean))];
    return ids.length ? ids : ["__neutral__"];
  }
  function optionsFrom(children) {
    return children.flatMap(node=>node.tagName==="OPTION" ? [node] : [...node.querySelectorAll("option")]);
  }
  function apply(select,filter,state) {
    const selected=select.value;
    const selectedElement=filter.value;
    const nodes=state.original.map(node=>node.cloneNode(true));
    const keep=option=>{
      if (!option.value) return true;
      const elements=idsFor(state.kind,option.value);
      return !elements || !selectedElement || elements.includes(selectedElement) || option.value===selected;
    };
    const visible=[];
    for (const node of nodes) {
      if (node.tagName==="OPTION") {
        if (keep(node)) visible.push(node);
      } else if (node.tagName==="OPTGROUP") {
        for (const option of [...node.querySelectorAll("option")]) {
          if (!keep(option)) option.remove();
        }
        if (node.querySelector("option")) visible.push(node);
      } else {
        visible.push(node);
      }
    }
    select.replaceChildren(...visible);
    if (selected && [...select.options].some(option=>option.value===selected)) select.value=selected;
    state.rendered=[...select.children];
  }
  function refresh() {
    for (const select of root.querySelectorAll("select")) {
      // A refresh by the actual editor replaces option nodes. A filter refresh
      // itself also replaces nodes but updates rendered, keeping original safe.
      let state=states.get(select);
      const now=[...select.children];
      if (!state || now.length!==state.rendered.length ||
          now.some((node,i)=>node!==state.rendered[i])) {
        const original=now.map(node=>node.cloneNode(true));
        const kind=getKind(select,optionsFrom(original));
        if (!kind) continue;
        state={kind,original,rendered:now};
        states.set(select,state);
      }
      const available=optionsFrom(state.original).filter(o=>idsFor(state.kind,o.value));
      if (!available.length) continue;
      let filter=select.previousElementSibling?.matches?.("[data-skill-element-filter], [data-reference-element-filter]")
        ? select.previousElementSibling : null;
      if (!filter) {
        filter=root.ownerDocument.createElement("select");
        filter.dataset.referenceElementFilter=state.kind;
        // Preserve the previous selector contract used by existing runtime
        // author controls and Chromium tests for skill loadout slots.
        if (state.kind==="skill") filter.dataset.skillElementFilter="true";
        filter.setAttribute("aria-label",
          state.kind==="skill"?"Filtrer les capacités par élément":"Filtrer les créatures par élément");
        filter.style.cssText="max-width:100%;margin:4px 0 8px;min-height:36px";
        select.before(filter);
      }
      if (!boundFilters.has(filter)) {
        listen(filter,"change",()=>apply(select,filter,states.get(select)));
        boundFilters.add(filter);
      }
      const previous=filter.value;
      const choices=new Map();
      for (const option of available) {
        for (const id of idsFor(state.kind,option.value)) {
          if (!choices.has(id)) choices.set(id,id==="__neutral__"?"Sans élément":elementMeta(id).label);
        }
      }
      filter.textContent="";
      const placeholder=root.ownerDocument.createElement("option");
      placeholder.value="";placeholder.textContent="Tous les éléments";filter.append(placeholder);
      for (const [id,label] of choices) {
        const option=root.ownerDocument.createElement("option");
        option.value=id;option.textContent=label;filter.append(option);
      }
      filter.value=choices.has(previous)?previous:"";
      apply(select,filter,state);
    }
  }
  return Object.freeze({refresh});
}
