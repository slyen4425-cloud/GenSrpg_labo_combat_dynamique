import { createRosterSession } from "../core/combat/roster-session.js";

export function createCaptureCombatRosterControllerV1({
  session, rosterDefinition, fighterConfigs, skillIdsByCreature, visuals, beforeActorChanged = () => {}, onActorChanged = () => {}
}) {
  const roster = createRosterSession({ combatSession: session, roster: rosterDefinition, fighterConfigs });
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
    } else if (result.outcome === "summoned" || result.outcome === "ko_replaced") {
      visuals.setCreatureFor(actorId, result.creatureId, { displayName: result.displayName });
      visuals.setSlotVisible(actorId, true);
    } else return result;
    onActorChanged(actorId, result);
    return result;
  }
  return Object.freeze({
    snapshot: () => roster.snapshot(),
    activeMember,
    isPresent: actorId => activeMember(actorId) !== null,
    skillIdsFor(actorId) {
      const member = activeMember(actorId);
      return member === null ? [] : skillIdsByCreature[member.creatureId] ?? [];
    },
    selectReserve(actorId, memberId) {
      return disposed ? { ok: false, outcome: "disposed" } : roster.selectReserve(actorId, memberId);
    },
    applyCommandResolution(resolution) {
      if (disposed) return { ok: false, outcome: "disposed" };
      if (!["recall", "summon"].includes(resolution?.commandKind)) return null;
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
  root, controller, format, commands, session, getRuntime, isTransitionPending, setStatus
}) {
  const panel = root.querySelector("[data-combat-team-menu]");
  if (!panel) return Object.freeze({ render() {}, dispose() {} });
  const host = panel.querySelector("[data-combat-team-rosters]");
  const summary = panel.querySelector("[data-combat-team-summary]");
  const buttons = [...panel.querySelectorAll("[data-combat-roster-command]")];
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
      const node = root.ownerDocument.createElement(actor.actorId === format.localActorId ? "button" : "p");
      if (actor.actorId === format.localActorId) {
        node.type = "button";
        node.dataset.rosterMemberId = member.id;
      }
      memberRefs.set(member.id, { actorId: actor.actorId, node });
      group.append(node);
    }
    host.append(group);
  }
  for (const button of buttons) {
    const command = commands[button.dataset.combatRosterCommand];
    button.textContent = command.name + " · " + command.energyCost + "⚡";
  }
  panel.hidden = false;
  function previewCommand(kind) {
    const runtime = getRuntime();
    if (!runtime || isTransitionPending() || runtime.hasActiveAction || runtime.hasActiveActionFor(format.localActorId)) return { ok: false };
    const team = controller.snapshot()[format.localActorId];
    const active = team?.activeMemberId !== null;
    const reserve = team?.members.find(m => m.id === team.selectedReserveMemberId);
    if (kind === "recall" ? !active : active || !reserve || reserve.hp <= 0) return { ok: false };
    return session.previewCommand({ actorId: format.localActorId, command: commands[kind] });
  }
  function render() {
    const state = controller.snapshot();
    const localTeamId = format.teamOf(format.localActorId);
    const count = format.actors.filter(actor => actor.teamId === localTeamId)
      .reduce((n, actor) => n + (state[actor.actorId]?.members.length ?? 0), 0);
    summary.textContent = "Équipe · " + count + " monstre" + (count > 1 ? "s" : "");
    for (const team of Object.values(state)) for (const member of team.members) {
      const ref = memberRefs.get(member.id);
      if (!ref) continue;
      ref.node.textContent = member.displayName + " · " + Math.round(member.hp) + "/" + Math.round(member.maxHp) + " PV · "
        + (member.hp <= 0 ? "KO" : member.active ? "Actif" : "Réserve");
      if (ref.actorId === format.localActorId) {
        ref.node.disabled = member.active || member.hp <= 0 || isTransitionPending() || Boolean(getRuntime()?.hasActiveAction);
        ref.node.setAttribute("aria-pressed", member.selected ? "true" : "false");
      }
    }
    buttons.forEach(button => { button.disabled = !previewCommand(button.dataset.combatRosterCommand).ok; });
  }
  function onClick(event) {
    const reserve = event.target.closest?.("[data-roster-member-id]");
    if (reserve && !reserve.disabled) {
      const result = controller.selectReserve(format.localActorId, reserve.dataset.rosterMemberId);
      if (result.ok) setStatus("Réserve sélectionnée. Utilise Rappel puis Invocation pour la faire entrer.", "info");
      render(); return;
    }
    const button = event.target.closest?.("[data-combat-roster-command]");
    if (!button || button.disabled) return;
    const kind = button.dataset.combatRosterCommand;
    if (!previewCommand(kind).ok) return;
    const result = getRuntime().startCommand({ actorId: format.localActorId, command: commands[kind] });
    setStatus(result.ok ? commands[kind].name + " en préparation…" : "Commande indisponible : " + result.outcome, result.ok ? "accent" : "warn");
    render();
  }
  panel.addEventListener("click", onClick);
  return Object.freeze({ render, dispose() { panel.removeEventListener("click", onClick); memberRefs.clear(); } });
}
