// Full editor -> native combat -> real roster panel regression.
// Ensure the Rappel DOM is allied-only while the dedicated enemy panel
// still presents enemy reserves for hostile reserve-targeting skills.
document.addEventListener("DOMContentLoaded",()=>{
 const q=s=>document.querySelector(s);
 const qa=s=>[...document.querySelectorAll(s)];
 const change=(el,value)=>{if(!el)throw Error("missing control "+value);el.value=value;el.dispatchEvent(new Event("change",{bubbles:true}));};
 const fail=e=>{document.body.dataset.rosterVisibilityProbe="fail:"+String(e?.message??e).slice(0,350);};
 let polls=0;
 const bootstrap=setInterval(()=>{
  try{
   if(!q('[data-creature-library-select] option[value="crea_lumilo"]')||
      !q('[data-skill-library-select] option[value="cap_light_special_1"]')||
      q("[data-editor-test-combat]")?.disabled){
    if(++polls>110){clearInterval(bootstrap);fail("editor not ready");}
    return;
   }
   clearInterval(bootstrap);
   change(q("[data-creature-library-select]"),"crea_lumilo");
   change(q("[data-test-local-team-size]"),"3");
   change(q("[data-test-opponent-team-size]"),"3");
   // A 2v2 active battle with real reserves on both sides.
   change(q("[data-active-per-team]"),"2");
   q("[data-editor-test-combat]").click();
   let wait=0;
   const ready=setInterval(()=>{
    try{
     const panel=q("[data-combat-team-menu]"), enemy=q("[data-combat-enemy-reserves]");
     if(!panel?.querySelector("[data-combat-team-rosters]")?.children.length ||
        !enemy?.querySelector("[data-combat-enemy-reserves-list]")?.children.length){
       if(++wait>110){clearInterval(ready);fail("real roster did not mount: "+(q("[data-editor-status]")?.textContent??"").slice(0,160));}
       return;
     }
     clearInterval(ready);
     const groups=qa("[data-combat-team-rosters] > section");
     const groupNames=groups.map(g=>g.querySelector("strong")?.textContent??"");
     const localIds=qa("[data-combat-team-rosters] [data-roster-member-id]").map(el=>el.dataset.rosterMemberId);
     if(groupNames.length!==2 || groupNames.some(name=>name.includes("Adversaire")) ||
        localIds.some(id=>id.startsWith("opponent-")) || localIds.length!==3)
       throw Error("enemy displayed in local Rappel: "+JSON.stringify({groupNames,localIds}));
     const enemyIds=qa("[data-combat-enemy-reserves-list] [data-enemy-reserve-member-id]").map(el=>el.dataset.enemyReserveMemberId);
     if(enemyIds.length!==3||enemyIds.some(id=>!id.startsWith("opponent-")))
       throw Error("dedicated enemy bench lost: "+JSON.stringify(enemyIds));
     const heal=q('[data-combat-skill="cap_light_special_1"]');
     if(!heal)throw Error("Lumilo Soin lumineux not available for reserve targeting");
     heal.click();
     const after=qa("[data-combat-team-rosters] [data-roster-member-id]");
     if(after.some(el=>el.dataset.rosterMemberId.startsWith("opponent-")))
       throw Error("enemy leaked on reserve-target skill opening");
     document.body.dataset.rosterVisibilityProbe="ok:allied:enemy-separated:skill";
    }catch(e){clearInterval(ready);fail(e);}
   },100);
  }catch(e){clearInterval(bootstrap);fail(e);}
 },100);
});