import { createRosterSession } from "../core/combat/roster-session.js";
import { normalizeCombatCommandDefinition } from "../contracts/combat-command-definition.js";

export function createCaptureCombatRosterControllerV1({
  session, rosterDefinition, fighterConfigs, skillIdsByCreature, visuals, recallCooldownMs, battleFormat = null, beforeActorChanged = () => {}, onActorChanged = () => {}
}) {
  const roster = createRosterSession({ combatSession: session, roster: rosterDefinition, fighterConfigs, recallCooldownMs, battleFormat });
  let disposed = false;
  function activeMember(actorId) {
    const state = roster.snapshot()[actorId];
    return state?.members.find(member => member.id === state.activeMemberId) ?? null;
  }
  function project(actorId, result) {
    if (!result?.ok) return result;
    beforeActorChanged(actorId, result);
    if (result.outcome === "recalled" || result.outcome === "team_defeated") {
      visuals.setSlotVisible(actorId, false);
    } else if (["summoned", "ko_replaced", "switched"].includes(result.outcome)) {
      visuals.setCreatureFor(actorId, result.creatureId, { displayName: result.displayName });
      visuals.setSlotVisible(actorId, true);
    } else return result;
    onActorChanged(actorId, result);
    return result;
  }
  return Object.freeze({
    snapshot: () => roster.snapshot(),
    previewSkillOnTarget(options) { return disposed ? {ok:false,outcome:"disposed"} : roster.previewSkillOnTarget(options); },
    useSkillOnTarget(options) { return disposed ? {ok:false,outcome:"disposed"} : roster.useSkillOnTarget(options); },
    activeMember,
    isPresent: actorId => activeMember(actorId) !== null,
    skillIdsFor(actorId) {
      const member = activeMember(actorId);
      return member === null ? [] : skillIdsByCreature[member.creatureId] ?? [];
    },
    selectReserve(actorId, memberId) {
      return disposed ? { ok: false, outcome: "disposed" } : roster.selectReserve(actorId, memberId);
    },
    previewCommand(actorId, command) {
      if (disposed) return { ok: false, outcome: "disposed" };
      if (command.kind === "recall") {
        const preview = roster.previewRecall(actorId);
        return preview.ok ? session.previewCommand({ actorId, command }) : preview;
      }
      if (command.kind !== "switch") return session.previewCommand({ actorId, command });
      const preview = roster.previewSwitch(actorId);
      if (!preview.ok) return preview;
      const scoped = normalizeCombatCommandDefinition({ ...command, effect: { ...command.effect, rosterMemberId: preview.memberId } });
      return session.previewCommand({ actorId, command: scoped });
    },
    applyCommandResolution(resolution) {
      if (disposed) return { ok: false, outcome: "disposed" };
      if (!["recall", "summon", "switch"].includes(resolution?.commandKind)) return null;
      const actorId = resolution.actorId ?? resolution.events?.find(event => event.type === "command-complete")?.actorId;
      if (!resolution.ok || resolution.outcome !== "completed") return { ok: false, outcome: "command_not_completed" };
      return project(actorId, roster.applyCommandResolution(actorId, resolution));
    },
    replaceKnockedOut(actorId) {
      return disposed ? { ok: false, outcome: "disposed" } : project(actorId, roster.replaceKnockedOut(actorId));
    },
    dispose() { disposed = true; }
  });
}

// UI projects Roster Session snapshots and starts the canonical Runtime commands.
// It never replaces fighters or calculates command costs/timings itself.
export function mountCaptureCombatRosterPanelV1({
  root, controller, format, commands, session, getRuntime, isTransitionPending, setStatus,
  reserveTargetCandidates = () => [], onTargetReserve = () => false
}) {
  const panel = root.querySelector("[data-combat-team-menu]");
  if (!panel) return Object.freeze({ render() {}, openForSkill() {}, openEnemyForSkill() {}, dispose() {} });
  const enemyCandidate = root.querySelector("[data-combat-enemy-reserves]");
  const enemyList = enemyCandidate?.querySelector?.("[data-combat-enemy-reserves-list]");
  const enemyPanel = enemyCandidate !== panel &&
    enemyCandidate?.tagName?.toLowerCase() === "details" && enemyList ? enemyCandidate : null;
  const enemyHost = enemyPanel ? enemyList : null;
  const enemySummary = enemyPanel?.querySelector("[data-combat-enemy-reserves-summary]") ?? null;
  const host = panel.querySelector("[data-combat-team-rosters]");
  const summary = panel.querySelector("[data-combat-team-summary]");
  const summaryLabel = summary.querySelector?.("[data-combat-team-summary-label]") ?? summary;
  const recallCountdown = summary.querySelector?.("[data-combat-recall-countdown]") ?? null;
  const buttons = [...panel.querySelectorAll("[data-combat-roster-command]")];
  const recallDuration = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(commands.switch.preparationMs / 1000)
    + " seconde" + (commands.switch.preparationMs === 1000 ? "" : "s");
  const recallNote = panel.querySelector("[data-combat-recall-note]");
  const baseRecallNote = `Gratuit. Rappel en ${recallDuration}, puis arrivée immédiate de la réserve sélectionnée. Ta créature reste ciblable pendant le rappel.`;
  if (recallNote) recallNote.textContent = baseRecallNote;
  const memberRefs = new Map();
  const initial = controller.snapshot();
  host.replaceChildren();
  for (const actor of format.actors) {
    const team = initial[actor.actorId];
    if (!team) continue;
    const group = root.ownerDocument.createElement("section");
    const title = root.ownerDocument.createElement("strong");
    title.textContent = actor.actorId === format.localActorId ? "Ta créature et sa réserve"
      : actor.teamId === format.teamOf(format.localActorId) ? "Allié et sa réserve" : "Adversaire et sa réserve";
    group.append(title);
    for (const member of team.members) {
      // Every bench can be deliberately selected for a reserve-target skill.
      // Only the local bench remains a candidate for voluntary recall.
      const node = root.ownerDocument.createElement("button");
      node.type = "button";
      node.dataset.rosterMemberId = member.id;
      memberRefs.set(member.id, { actorId: actor.actorId, node });
      group.append(node);
    }
    host.append(group);
  }
  // One native inspection row per enemy member; Roster Session owns every PV.
  const enemyRefs = new Map();
  if (enemyPanel) {
    enemyHost.replaceChildren();
    for (const actor of format.actors) {
      if (actor.teamId === format.teamOf(format.localActorId)) continue;
      const team = initial[actor.actorId];
      if (!team) continue;
      const group = root.ownerDocument.createElement("section");
      group.className = "combat-enemy-reserves__team";
      const title = root.ownerDocument.createElement("strong");
      title.textContent = actor.displayName ?? "Équipe adverse";
      group.append(title);
      for (const member of team.members) {
        const row = root.ownerDocument.createElement("button");
        row.type = "button";
        row.className = "combat-enemy-reserves__member";
        row.dataset.enemyReserveTeamId = actor.actorId;
        row.dataset.enemyReserveMemberId = member.id;
        const label = root.ownerDocument.createElement("span");
        label.className = "combat-enemy-reserves__name";
        const hp = root.ownerDocument.createElement("progress");
        hp.className = "combat-enemy-reserves__hp";
        const hpText = root.ownerDocument.createElement("small");
        hpText.className = "combat-enemy-reserves__value";
        row.append(label,hp,hpText);
        enemyRefs.set(actor.actorId+":"+member.id,{actorId:actor.actorId,memberId:member.id,row,label,hp,hpText});
        group.append(row);
      }
      enemyHost.append(group);
    }
  }
  for (const button of buttons) {
    const command = commands[button.dataset.combatRosterCommand];
    button.textContent = command.name + (command.energyCost === 0 ? " · Gratuit" : " · " + command.energyCost + "⚡");
  }
  panel.hidden = false;
  function previewCommand(kind) {
    const runtime = getRuntime();
    if (!runtime || isTransitionPending() || runtime.hasActiveActionFor(format.localActorId)) return { ok: false };
    if (kind === "switch") return controller.previewCommand(format.localActorId, commands[kind]);
    if (runtime.hasActiveAction) return { ok: false };
    if (kind === "recall") return controller.previewCommand(format.localActorId, commands[kind]);
    const team = controller.snapshot()[format.localActorId];
    const active = team?.activeMemberId !== null;
    const reserve = team?.members.find(m => m.id === team.selectedReserveMemberId);
    if (kind === "recall" ? !active : active || !reserve || reserve.hp <= 0) return { ok: false };
    return session.previewCommand({ actorId: format.localActorId, command: commands[kind] });
  }
  function render() {
    const state = controller.snapshot();
    const targetableReserveKeys = new Set(reserveTargetCandidates().map(candidate =>
      candidate.targetRef.teamId + ":" + candidate.targetRef.memberId
    ));
    const localTeamId = format.teamOf(format.localActorId);
    const count = format.actors.filter(actor => actor.teamId === localTeamId)
      .reduce((n, actor) => n + (state[actor.actorId]?.members.length ?? 0), 0);
    summaryLabel.textContent = "Rappel · " + count + " monstre" + (count > 1 ? "s" : "");
    for (const team of Object.values(state)) for (const member of team.members) {
      const ref = memberRefs.get(member.id);
      if (!ref) continue;
      ref.node.textContent = member.displayName + " · " + Math.round(member.hp) + "/" + Math.round(member.maxHp) + " PV · "
        + (member.hp <= 0 ? "KO" : member.active ? "Actif" : "Réserve");
      const availableForSkill = !member.active && member.hp > 0 &&
        targetableReserveKeys.has(ref.actorId + ":" + member.id);
      ref.node.dataset.skillReserveCandidate = availableForSkill ? "true" : "false";
      const busy = isTransitionPending() || Boolean(getRuntime()?.hasActiveActionFor(format.localActorId));
      const recallCandidate = ref.actorId === format.localActorId && !member.active && member.hp > 0;
      ref.node.disabled = busy || !(availableForSkill || recallCandidate);
      if (ref.actorId === format.localActorId) {
        ref.node.setAttribute("aria-pressed", member.selected ? "true" : "false");
      }
    }
    if (enemyPanel) {
      let benchCount = 0;
      for (const ref of enemyRefs.values()) {
        const member = state[ref.actorId]?.members.find(x=>x.id===ref.memberId);
        if (!member) { ref.row.hidden = true; continue; }
        ref.row.hidden = Boolean(member.active);
        if (member.active) continue;
        benchCount++;
        const maxHp = Math.max(1,Number(member.maxHp)||1);
        const hp = Math.max(0,Math.min(maxHp,Number(member.hp)||0));
        ref.label.textContent = member.displayName;
        ref.hp.max = maxHp;
        ref.hp.value = hp;
        ref.hpText.textContent = hp<=0 ? "KO · 0 / "+Math.round(maxHp)+" PV" :
          Math.round(hp)+" / "+Math.round(maxHp)+" PV";
        const available = hp>0 && targetableReserveKeys.has(ref.actorId+":"+ref.memberId);
        const busy = isTransitionPending() || Boolean(getRuntime()?.hasActiveActionFor(format.localActorId));
        ref.row.disabled = busy || !available;
        ref.row.dataset.skillReserveCandidate = available?"true":"false";
        ref.row.dataset.defeated = hp<=0?"true":"false";
        ref.row.title = available ? "Toucher pour cibler "+member.displayName :
          "PV de "+member.displayName+" · une capacité ciblant la réserve est requise";
      }
      enemyPanel.hidden = benchCount===0;
      if(enemySummary)enemySummary.textContent="Réserves adverses · "+benchCount;
    }
    const remainingMs = state[format.localActorId]?.voluntarySwitchCooldownRemainingMs ?? 0;
    if (recallCountdown) {
      const seconds = Math.ceil(remainingMs / 1000);
      const visible = seconds > 0;
      const text = visible ? seconds + " s" : "";
      if (recallCountdown.textContent !== text) recallCountdown.textContent = text;
      if (recallCountdown.hidden !== !visible) recallCountdown.hidden = !visible;
      const accessibilityLabel = visible ? "Rappel : encore " + seconds + " secondes" : "";
      if (recallCountdown.getAttribute?.("aria-label") !== accessibilityLabel) {
        recallCountdown.setAttribute("aria-label", accessibilityLabel);
      }
    }
    buttons.forEach(button => { button.disabled = !previewCommand(button.dataset.combatRosterCommand).ok; });
  }
  function onClick(event) {
    const reserve = event.target.closest?.("[data-roster-member-id]");
    if (reserve && !reserve.disabled) {
      const memberRef = memberRefs.get(reserve.dataset.rosterMemberId);
      if (memberRef && reserve.dataset.skillReserveCandidate === "true") {
        if (onTargetReserve({scope:"reserve",teamId:memberRef.actorId,memberId:reserve.dataset.rosterMemberId})) {
          render(); return;
        }
      }
      if (!memberRef || memberRef.actorId !== format.localActorId) return;
      const result = controller.selectReserve(format.localActorId, reserve.dataset.rosterMemberId);
      if (result.ok) setStatus(`Réserve sélectionnée. Lance Rappel et invocation : remplacement gratuit après ${recallDuration}.`, "info");
      render(); return;
    }
    const button = event.target.closest?.("[data-combat-roster-command]");
    if (!button || button.disabled) return;
    const kind = button.dataset.combatRosterCommand;
    const preview = previewCommand(kind);
    if (!preview.ok) return;
    const result = getRuntime().startCommand({ actorId: format.localActorId, command: preview.action.command });
    setStatus(result.ok ? commands[kind].name + " en préparation…" : "Commande indisponible : " + result.outcome, result.ok ? "accent" : "warn");
    render();
  }
  function onEnemyClick(event) {
    const row = event.target.closest?.("[data-enemy-reserve-member-id]");
    if (!row || row.disabled || row.dataset.skillReserveCandidate!=="true") return;
    const member = enemyRefs.get(row.dataset.enemyReserveTeamId+":"+row.dataset.enemyReserveMemberId);
    if (!member) return;
    if (onTargetReserve({scope:"reserve",teamId:member.actorId,memberId:member.memberId})) {
      enemyPanel.open=false;
      render();
    }
  }
  panel.addEventListener("click",onClick);
  enemyPanel?.addEventListener("click",onEnemyClick);
  return Object.freeze({
    render,
    openForSkill(){panel.hidden=false;panel.open=true;if(enemyPanel)enemyPanel.open=false;render();},
    openEnemyForSkill(){
      if(enemyPanel){enemyPanel.hidden=false;enemyPanel.open=true;panel.open=false;}
      else {panel.hidden=false;panel.open=true;}
      render();
    },
    dispose(){
      panel.removeEventListener("click",onClick);
      enemyPanel?.removeEventListener("click",onEnemyClick);
      memberRefs.clear();enemyRefs.clear();
    }
  });
}
