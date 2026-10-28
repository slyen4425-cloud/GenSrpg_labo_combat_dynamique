"""One-time reproducible Human Editor integration for sleep/conditional effects.
All replacements assert their unique old text; no regex broad rewrite.
"""
from pathlib import Path
p=Path("src/ui/capture-editor-human-v2.js")
s=p.read_text()
def change(old,new):
    global s
    count=s.count(old)
    if count!=1:
        raise RuntimeError(f"Expected one match, got {count}: {old[:90]!r}")
    s=s.replace(old,new,1)

change('import {mountCaptureContextualHelpV1}',
       'import {appendCaptureEffectConditionFieldsV1,readCaptureEffectConditionV1} from "./capture-effect-condition-fields-v1.js";\nimport {mountCaptureContextualHelpV1}')
change('  if (\n    output.stacking === "stack"\n  ) {',
       '  if (output.kind === "stun" && status.durationModel === "until_damage") {\n    delete output.durationMs;\n    output.durationModel = "until_damage";\n  }\n  if (\n    output.stacking === "stack"\n  ) {')
change('  // The combat status runtime owns active statuses by ID.\n  // Never silently replace another effect of the same authored skill.\n  const statusIds = new Set();',
       '  // Preserve one optional canonical condition on every immediate effect.\n  const conditionedEffects = builtEffects.map((built,index)=>\n    effects[index].condition\n      ? normalizeSkillEffectV1({...built,condition:effects[index].condition})\n      : built);\n  // The combat status runtime owns active statuses by ID.\n  // Never silently replace another effect of the same authored skill.\n  const statusIds = new Set();')
change('  for (const effect of builtEffects) {\n    if (effect.kind !== "apply_status") continue;',
       '  for (const effect of conditionedEffects) {\n    if (effect.kind !== "apply_status") continue;')
change('  return builtEffects;\n}\n\n\nconst CAPTURE_EDITOR_COMPAT_DISTANCES',
       '  return conditionedEffects;\n}\n\n\nconst CAPTURE_EDITOR_COMPAT_DISTANCES')
change('  row.append(header, config);\n  host.append(row);\n\n  kind.value = effect?.kind ?? "damage";',
       '  row.append(header, config);\n  appendCaptureEffectConditionFieldsV1({root,row,effect,\n    statusKinds:STATUS_EFFECT_V1_KINDS,statusLabel:tacticalStatusKindLabelV1,\n    markerOptions:captureMarkerOptionsV1});\n  host.append(row);\n\n  kind.value = effect?.kind ?? "damage";')
change('  return buildHumanTacticalSkillEffectsV1(\n    effects\n  );\n}',
       '  return buildHumanTacticalSkillEffectsV1(effects.map((effect,index)=>{\n    const condition=readCaptureEffectConditionV1(rows[index]);\n    return condition===null?effect:{...effect,condition};\n  }));\n}')
change('  const stacking =\n    document.createElement("select");\n  stacking.dataset.skillStatusStacking =\n    "true";',
       '  const sleepMode=document.createElement("input");\n  sleepMode.type="checkbox";\n  sleepMode.dataset.skillStatusSleepUntilDamage="true";\n  sleepMode.checked=status.kind==="stun" && status.durationModel==="until_damage";\n  const stacking =\n    document.createElement("select");\n  stacking.dataset.skillStatusStacking =\n    "true";')
change('    tacticalFieldV1("Durée (secondes)", duration),\n    tacticalFieldV1("Stacking", stacking),',
       '    tacticalFieldV1("Durée (secondes)", duration),\n    tacticalFieldV1("Sommeil — se réveille après perte de PV (sans minuterie)", sleepMode),\n    tacticalFieldV1("Stacking", stacking),')
change('  const statusPolarity = row.querySelector("[data-skill-status-polarity]");\n  const intangibleToggle',
       '  const statusPolarity = row.querySelector("[data-skill-status-polarity]");\n  const sleepToggle=row.querySelector("[data-skill-status-sleep-until-damage]");\n  const sleeping=statusKind==="stun" && sleepToggle?.checked===true;\n  const sleepField=sleepToggle?.parentElement;\n  if(sleepField)sleepField.hidden=statusKind!=="stun";\n  const secondsField=row.querySelector("[data-skill-status-duration-seconds]")?.parentElement;\n  if(secondsField)secondsField.hidden=sleeping;\n  const intangibleToggle')
change('  if (statusPolarity && (statusKind === "projectile_mirror" || statusKind === "auto_dodge" || intangibleSelected)) {',
       '  if (statusPolarity && (sleeping || statusKind === "projectile_mirror" || statusKind === "auto_dodge" || intangibleSelected)) {')
change('    statusPolarity.value = "beneficial";\n    statusPolarity.disabled = true;',
       '    statusPolarity.value = sleeping ? "detrimental" : "beneficial";\n    statusPolarity.disabled = true;')
change('      if (statusKind === "stat_modifier") {\n        const activation = row.querySelector(',
       '      if (statusKind === "stun" &&\n          row.querySelector("[data-skill-status-sleep-until-damage]")?.checked===true) {\n        status.durationModel="until_damage";\n      }\n      if (statusKind === "stat_modifier") {\n        const activation = row.querySelector(')
change('  stacking.value =\n    status.stacking ?? "refresh";',
       '  stacking.value =\n    status.stacking ?? "refresh";\n  sleepMode.addEventListener("change",()=>syncHumanSkillEffectRowV1(row));')
p.write_text(s)
print("Human Editor updated:",len(s),"chars")

# Run once on the isolated sleep/conditions work branch.
