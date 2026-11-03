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
      // Current authored Lumilo already equips Charge solaire in standard
      // slot 4. Do not duplicate it in slot 3: the native loadout owner
      // explicitly rejects duplicate equipped skill IDs.
      const solar=slots.find(el=>el.value==="cap_light_atk_3");
      if(!solar) throw Error("Latest Lumilo author loadout did not equip Solar charge");
      if(slots.filter(el=>el.value==="cap_light_atk_3").length!==1)
        throw Error("Charge solaire equipped more than once");
      if(slots[0]?.value!=="lib_light_bolt")
        throw Error("Rayon lumineux missing from authored slot 1");
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
          if(solarButton.disabled)throw Error("Charge solaire unavailable pre-cast: level="+
            (q("[data-test-creature-level]")?.value??"?")+
            " energy="+(q('[data-combat-energy-value="local-1"]')?.textContent??"?")+
            " status="+(q("[data-combat-live-status]")?.textContent??"?")+
            " localAction="+(q('[data-combat-action="local-1"]')?.textContent??"?")+
            " cd="+(solarButton.querySelector(".action-option__cooldown")?.textContent??"none")+
            " boltDisabled="+(q('[data-combat-skill="lib_light_bolt"]')?.disabled??"?"));
          solarButton.click();
          // In the real 2v2 preview an ally/self skill needs an explicit
          // physical target selection. Merely clicking the ability arms it;
          // the old smoke could then report success without casting anything.
          if(solarButton.dataset.targeting==="true") {
            const self=qa('[data-target-actor="local-1"]').find(el=>
              el.dataset.skillTargetCandidate==="true");
            if(!self)throw Error("Charge solaire armed but self target absent");
            self.click();
          }
          const started=q('[data-combat-action="local-1"]')?.textContent??"";
          if(!started.includes("Charge solaire"))
            throw Error("Charge solaire was armed but not actually cast: "+started);
          setTimeout(()=>{
            try {
              const action=q('[data-combat-action="local-1"]')?.textContent??"";
              const solarSkill=q('[data-combat-skill="cap_light_atk_3"]');
              if(!solarSkill)throw Error("solar skill disappeared after cast");
              if(action.includes("préparation") || action.includes("Charge solaire · lancé") ||
                 action.includes("Charge solaire · trajet"))throw Error("solar action frozen "+action);
              const bolt=q('[data-combat-skill="lib_light_bolt"]');
              if(!bolt)throw Error("Rayon lumineux disappeared after solar cast");
              if(bolt.disabled)throw Error("Rayon lumineux is still disabled after Charge solaire (actor action never released)");
              if(solarSkill.disabled!==true)throw Error("Charge solaire must remain on its own cooldown");
              // The real native solar status/bonus is asserted by the Session
              // sentinels. HUD icon rendering is intentionally NOT treated as
              // a gameplay source of truth here.
              bolt.click();
              if(bolt.dataset.targeting==="true") {
                const enemy=qa('[data-target-actor="opponent-1"]').find(el=>
                  el.dataset.skillTargetCandidate==="true");
                if(!enemy)throw Error("Rayon lumineux armed but enemy target absent");
                enemy.click();
              }
              const afterBolt=q('[data-combat-action="local-1"]')?.textContent??"";
              if(!afterBolt.includes("Rayon lumineux"))
                throw Error("follow-up Rayon lumineux could not start: "+afterBolt);
              document.body.dataset.solarLiveCastProbe="ok:solar:next-skill:unfrozen";
            }catch(e){fail(e);}
          },2200);
        }catch(e){clearInterval(awaiting);fail(e);}
      },100);
    }catch(e){clearInterval(ready);fail(e);}
  },100);
});
