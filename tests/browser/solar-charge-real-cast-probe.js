// Chromium-only probe: actual Capture Editor -> preview -> real skill button.
// It never mutates or bypasses any Combat Runtime/Session effects.
document.addEventListener("DOMContentLoaded", () => {
  const q = selector => document.querySelector(selector);
  const qa = selector => [...document.querySelectorAll(selector)];
  const change = (el,value) => {
    el.value=value;
    el.dispatchEvent(new Event("change",{bubbles:true}));
  };
  let count=0;
  const fail = error => {document.body.dataset.solarLiveCastProbe="fail:"+String(error?.message??error).slice(0,300);};
  const ready=setInterval(()=>{
    try {
      if (!q('[data-creature-library-select] option[value="crea_lumilo"]') ||
          !q('[data-skill-library-select] option[value="cap_light_atk_3"]') ||
          q("[data-editor-test-combat]")?.disabled) {
        if (++count>130){clearInterval(ready);fail("editor/previews did not become ready");}
        return;
      }
      clearInterval(ready);
      change(q("[data-creature-library-select]"),"crea_lumilo");
      const slots=qa("[data-loadout-slot]").filter(el=>el.dataset.loadoutSlotType==="standard");
      const solar=slots.find(el=>el.querySelector('[value="cap_light_atk_3"]'));
      if(!solar) throw Error("Solar skill not available in saved Lumilo loadout slots");
      change(solar,"cap_light_atk_3");
      if(solar.value!=="cap_light_atk_3")throw Error("Solar not selected");
      q("[data-editor-test-combat]").click();
      let tries=0;
      const awaiting=setInterval(()=>{
        try {
          const solarButton=q('[data-combat-skill="cap_light_atk_3"]');
          if(!solarButton) {
            const err=q("[data-editor-status]")?.textContent??"";
            if(++tries>95){clearInterval(awaiting);fail("real preview missing solar button: "+err.slice(0,125));}
            return;
          }
          clearInterval(awaiting);
          solarButton.click();
          setTimeout(()=>{
            try {
              const action=q('[data-combat-action="local-1"]')?.textContent??"";
              const solarSkill=q('[data-combat-skill="cap_light_atk_3"]');
              if(!solarSkill)throw Error("solar skill disappeared after cast");
              if(action.includes("préparation") || action.includes("Charge solaire · lancé") ||
                 action.includes("Charge solaire · trajet"))throw Error("solar action frozen "+action);
              const bolt=q('[data-combat-skill="lib_light_bolt"]');
              if(!bolt)throw Error("Rayon lumineux disappeared after solar cast");
              // A second real button remains operable; AI is intentionally left active.
              bolt.click();
              const status=q("[data-combat-status-icons='local-1']");
              if(!status?.children.length)throw Error("solar buff not visible on active creature");
              document.body.dataset.solarLiveCastProbe="ok:solar:next-skill:unfrozen";
            }catch(e){fail(e);}
          },2200);
        }catch(e){clearInterval(awaiting);fail(e);}
      },100);
    }catch(e){clearInterval(ready);fail(e);}
  },100);
});
