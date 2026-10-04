import { normalizeCaptureBattleSetupEditorDraftV1 } from "../contracts/capture-battle-setup-editor-draft-v1.js";
import { exportCaptureEditorDraftsToCombatExportV3 } from "../adapters/input/capture/capture-editor-exporter-v3.js";
import { applyCaptureCombatRulesToCreatureDraftV1 } from "../adapters/input/capture/capture-combat-rules-overlay-v1.js";
import { resolveCaptureSkillSaveModeV1 } from "./capture-editor-skill-save-mode-v1.js";
import { resolveCaptureCreatureSaveModeV1 } from "./capture-editor-creature-save-mode-v1.js";

export const CAPTURE_COMBAT_TEST_MAX_TEAM_SIZE_V1 = 6;

function teamIds(ids, label, configuredCreatures) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > CAPTURE_COMBAT_TEST_MAX_TEAM_SIZE_V1) {
    throw new RangeError(label + " doit contenir de 1 à 6 créatures.");
  }
  for (const id of ids) {
    if (!configuredCreatures.has(id)) throw new RangeError("Créature du test introuvable : " + id);
  }
  return ids;
}

function teamSlots(ids, activeCount, prefix, configuredCreatures) {
  return Array.from({ length: activeCount }, (_, slotIndex) => {
    const actorId = prefix + "-" + (slotIndex + 1);
    const members = ids.flatMap((creatureId, memberIndex) => memberIndex % activeCount === slotIndex
      ? [{ id: prefix + "-member-" + (memberIndex + 1), creatureId, displayName: configuredCreatures.get(creatureId).draft.displayName }]
      : []);
    return {
      actorId,
      creatureId: members[0].creatureId,
      displayName: members[0].displayName,
      controllerId: prefix === "opponent" ? "ai-enemy" : slotIndex === 0 ? "human-local" : "ai-ally",
      roster: { activeMemberId: members[0].id, members }
    };
  });
}

// Scenario assembly reads the active libraries; actors/members identify occurrences,
// while definitions, planned loadouts and stat values keep their canonical IDs.
export function buildCaptureEditorCombatTestV1({
  configuredCreatures, configuredSkills, localCreatureIds, opponentCreatureIds,
  activePerTeam, arenaId, combatRules, skillSpeedMultiplier = 1,
  statRegistry = null, progressionRules = null
}) {
  const local = teamIds(localCreatureIds, "L’équipe locale", configuredCreatures);
  const opponent = teamIds(opponentCreatureIds, "L’équipe adverse", configuredCreatures);
  const count = Number(activePerTeam);
  if (![1, 2].includes(count) || count > local.length || count > opponent.length) {
    throw new RangeError("Choisis 1 ou 2 créatures actives et au moins autant de membres dans chaque équipe.");
  }
  const records = [...new Set([...local, ...opponent])].map(id => configuredCreatures.get(id));
  const battleSetup = normalizeCaptureBattleSetupEditorDraftV1({
    schema: "capture-battle-setup-editor-draft-v1", id: "capture-human-preview",
    localActorId: "local-1", arenaId, skillSpeedMultiplier,
    teams: [
      { id: "local-team", slots: teamSlots(local, count, "local", configuredCreatures) },
      { id: "enemy-team", slots: teamSlots(opponent, count, "opponent", configuredCreatures) }
    ]
  });
  return exportCaptureEditorDraftsToCombatExportV3({
    battleSetup,
    creatureDrafts: records.map(record => applyCaptureCombatRulesToCreatureDraftV1({ creatureDraft: record.draft, combatRules })),
    skillDrafts: [...configuredSkills.values()],
    loadouts: records.map(record => record.loadout),
    ...(statRegistry === null ? {} : { statRegistry, statValues: records.map(r => r.statValues).filter(Boolean) }),
    ...(progressionRules === null ? {} : { progressionRules }),
    metadata: { editor: "capture-human-v2" }
  });
}

// A synchronous transaction in the existing owners lets creature validation see
// the pending skill. No render/async work occurs until the whole export succeeds.
export function prepareCaptureEditorCombatEditsV1({
  configuredSkills, configuredCreatures, selectedSkillId, selectedCreatureId,
  readSkillDraft, readCreatureRecord, buildExport
}) {
  let skillDraft = null, creatureRecord = null;
  let previousSkill, previousCreature, skillStaged = false, creatureStaged = false;
  try {
    skillDraft = readSkillDraft();
    if (skillDraft !== null) {
      resolveCaptureSkillSaveModeV1({ intent: selectedSkillId === skillDraft.id ? "update" : "create", draftId: skillDraft.id, configuredSkillIds: [...configuredSkills.keys()] });
      previousSkill = configuredSkills.get(skillDraft.id);
      configuredSkills.set(skillDraft.id, skillDraft);
      skillStaged = true;
    }
    creatureRecord = readCreatureRecord();
    if (creatureRecord !== null) {
      resolveCaptureCreatureSaveModeV1({ intent: selectedCreatureId === null ? "create" : "update", draftId: creatureRecord.draft.id, selectedCreatureId, configuredCreatureIds: [...configuredCreatures.keys()] });
      previousCreature = configuredCreatures.get(creatureRecord.draft.id);
      configuredCreatures.set(creatureRecord.draft.id, creatureRecord);
      creatureStaged = true;
    }
    const exported = buildExport();
    return Object.freeze({ exported, skillDraft, creatureRecord });
  } catch (error) {
    if (creatureStaged) {
      if (previousCreature === undefined) configuredCreatures.delete(creatureRecord.draft.id);
      else configuredCreatures.set(creatureRecord.draft.id, previousCreature);
    }
    if (skillStaged) {
      if (previousSkill === undefined) configuredSkills.delete(skillDraft.id);
      else configuredSkills.set(skillDraft.id, previousSkill);
    }
    throw error;
  }
}

export function mountCaptureEditorCombatTeamControlsV1({ root, configuredCreatures, getSelectedCreatureId }) {
  const localCount = root.querySelector("[data-test-local-team-size]");
  const opponentCount = root.querySelector("[data-test-opponent-team-size]");
  const active = root.querySelector("[data-active-per-team]");
  const localSelects = [...root.querySelectorAll("[data-test-local-creature]")];
  const opponentSelects = [...root.querySelectorAll("[data-test-opponent-creature]")];
  const members = [...root.querySelectorAll("[data-test-team-member]")];
  if (!localCount || !opponentCount || !active || localSelects.length !== 5 || opponentSelects.length !== 6) {
    throw new Error("Contrôles des équipes de test incomplets.");
  }
  const listeners = [];
  let disposed = false;
  function syncVisibility() {
    for (const member of members) {
      const size = Number(member.dataset.testTeam === "local" ? localCount.value : opponentCount.value);
      member.hidden = Number(member.dataset.testTeamIndex) >= size;
    }
    const enoughMembers = Number(localCount.value) >= 2 && Number(opponentCount.value) >= 2;
    const two = [...active.options].find(o => o.value === "2");
    if (two) two.disabled = !enoughMembers;
    if (!enoughMembers && active.value === "2") active.value = "1";
  }
  function refresh() {
    if (disposed) return;
    for (const select of [...localSelects, ...opponentSelects]) {
      const previous = select.value;
      select.textContent = "";
      for (const record of configuredCreatures.values()) {
        const option = root.ownerDocument.createElement("option");
        option.value = record.draft.id;
        option.textContent = record.draft.displayName + " · " + record.draft.id;
        select.append(option);
      }
      select.value = configuredCreatures.has(previous) ? previous : configuredCreatures.keys().next().value ?? "";
    }
    const current = root.querySelector("[data-test-current-creature]");
    if (current) current.textContent = configuredCreatures.get(getSelectedCreatureId())?.draft.displayName ?? "Créature en cours d’édition";
    syncVisibility();
  }
  for (const select of [localCount, opponentCount]) {
    select.addEventListener("change", syncVisibility);
    listeners.push(() => select.removeEventListener("change", syncVisibility));
  }
  refresh();
  return Object.freeze({
    refresh,
    read() {
      return {
        localCreatureIds: [getSelectedCreatureId(), ...localSelects.map(s => s.value)].slice(0, Number(localCount.value)),
        opponentCreatureIds: opponentSelects.map(s => s.value).slice(0, Number(opponentCount.value)),
        activePerTeam: Number(active.value)
      };
    },
    dispose() { if (disposed) return; disposed = true; listeners.splice(0).forEach(remove => remove()); }
  });
}
