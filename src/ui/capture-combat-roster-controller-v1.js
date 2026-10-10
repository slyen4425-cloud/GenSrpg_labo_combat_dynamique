import { createRosterSession } from "../core/combat/roster-session.js";
import { normalizeCombatCommandDefinition } from "../contracts/combat-command-definition.js";

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
    } else if (["summoned", "ko_replaced", "switched"].includes(result.outcome)) {
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
  root, controller, format, commands, session, getRuntime, isTransitionPending, setStatus
}) {
  const panel = root.querySelector("[data-combat-team-menu]");
  if (!panel) return Object.freeze({ render() {}, dispose() {} });
  const host = panel.querySelector("[data-combat-team-rosters]");
  const summary = panel.querySelector("[data-combat-team-summary]");
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
    button.textContent = command.name + (command.energyCost === 0 ? " · Gratuit" : " · " + command.energyCost + "⚡");
  }
  panel.hidden = false;
  function previewCommand(kind) {
    const runtime = getRuntime();
    if (!runtime || isTransitionPending() || runtime.hasActiveActionFor(format.localActorId)) return { ok: false };
    if (kind === "switch" || kind === "recall") return controller.previewCommand(format.localActorId, commands[kind]);
    if (runtime.hasActiveAction) return { ok: false };
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
        ref.node.disabled = member.active || member.hp <= 0 || isTransitionPending() || Boolean(getRuntime()?.hasActiveActionFor(format.localActorId));
        ref.node.setAttribute("aria-pressed", member.selected ? "true" : "false");
      }
    }
    const remainingMs = state[format.localActorId]?.voluntarySwitchCooldownRemainingMs ?? 0;
    if (recallNote) {
      const note = remainingMs > 0
        ? `${baseRecallNote} Prochain changement volontaire dans ${Math.ceil(remainingMs / 1000)} s. Un KO permet toujours une relève immédiate.`
        : baseRecallNote;
      if (recallNote.textContent !== note) recallNote.textContent = note;
    }
    buttons.forEach(button => { button.disabled = !previewCommand(button.dataset.combatRosterCommand).ok; });
  }
  function onClick(event) {
    const reserve = event.target.closest?.("[data-roster-member-id]");
    if (reserve && !reserve.disabled) {
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
  panel.addEventListener("click", onClick);
  return Object.freeze({ render, dispose() { panel.removeEventListener("click", onClick); memberRefs.clear(); } });
}
