import { resumeStatusEffectsV1 } from "./status-effect-runtime-v1.js";
import { normalizeRosterVoluntarySwitchCooldownMsV1 } from "../../contracts/roster-switch-policy-v1.js";
import {
  createCombatState
} from "./combat-state.js";
import {
  resolveSkillStart
} from "./action-resolver.js";
import {
  applyImmediateTacticalEffectsV1,
  unsupportedImmediateTacticalEffectV1
} from "./immediate-tactical-effects-v1.js";
import {
  normalizeCombatTargetRefV1
} from "../../contracts/combat-target-ref-v1.js";

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function cloneFighterForSlot(config, slotId, snapshot = null, atMs = 0) {
  const source = snapshot ?? config;
  return {
    ...config,
    id: slotId,
    initialHp: source.hp ?? source.initialHp ?? config.initialHp ?? config.maxHp,
    initialEnergy:
      source.energy ?? source.initialEnergy ?? config.initialEnergy ?? 0,
    energyChargeProgressMs: source.energyChargeProgressMs ?? 0,
    chargeTimeEffects: source.chargeTimeEffects ?? [],
    skillCooldowns: source.skillCooldowns ?? {},
    skillUseCounts: source.skillUseCounts ?? {},
    statusEffects: resumeStatusEffectsV1(source.statusEffects ?? [], atMs),
    damageDealtTotal: source.damageDealtTotal ?? 0,
    damageTakenTotal: source.damageTakenTotal ?? 0,
    knockoutsTotal: source.knockoutsTotal ?? 0
  };
}

function snapshotFighter(fighter) {
  return Object.freeze({
    hp: fighter.hp,
    maxHp: fighter.maxHp,
    energy: fighter.energy,
    maxEnergy: fighter.maxEnergy,
    energyChargeAmount: fighter.energyChargeAmount,
    energyChargeIntervalMs: fighter.energyChargeIntervalMs,
    energyChargeProgressMs: fighter.energyChargeProgressMs,
    movementEnergyPerStep: fighter.movementEnergyPerStep,
    chargeTimeModifierPct: fighter.chargeTimeModifierPct,
    approachTimeModifierPct:
      fighter.approachTimeModifierPct,
    chargeTimeEffects: fighter.chargeTimeEffects,
    skillCooldowns: fighter.skillCooldowns,
    skillUseCounts: fighter.skillUseCounts,
    statusEffects: fighter.statusEffects,
    damageDealtTotal: fighter.damageDealtTotal,
    damageTakenTotal: fighter.damageTakenTotal,
    knockoutsTotal: fighter.knockoutsTotal
  });
}

export function createRosterSession({
  combatSession,
  roster,
  fighterConfigs,
  battleFormat = null,
  recallCooldownMs
}) {
  const voluntaryCooldownMs = normalizeRosterVoluntarySwitchCooldownMsV1(recallCooldownMs);
  if (!combatSession || typeof combatSession.snapshot !== "function") {
    throw new TypeError("combatSession is required");
  }
  if (!roster?.teams || typeof roster.teams !== "object") {
    throw new TypeError("roster.teams is required");
  }
  if (!fighterConfigs || typeof fighterConfigs !== "object") {
    throw new TypeError("fighterConfigs are required");
  }

  const teams = new Map();

  for (const [teamId, rawTeam] of Object.entries(roster.teams)) {
    const slotId = requiredString(rawTeam.slotId, `${teamId}.slotId`);
    const members = new Map();

    for (const rawMember of rawTeam.members ?? []) {
      const id = requiredString(rawMember.id, `${teamId}.member.id`);
      const fighterConfigId = requiredString(
        rawMember.fighterConfigId,
        `${id}.fighterConfigId`
      );
      const fighterConfig = fighterConfigs[fighterConfigId];
      if (!fighterConfig) {
        throw new RangeError(`Unknown fighter config: ${fighterConfigId}`);
      }

      members.set(id, {
        id,
        creatureId: requiredString(rawMember.creatureId, `${id}.creatureId`),
        displayName: requiredString(rawMember.displayName, `${id}.displayName`),
        fighterConfigId,
        fighterConfig,
        savedFighter: null
      });
    }

    const activeMemberId = rawTeam.activeMemberId ?? null;
    if (activeMemberId && !members.has(activeMemberId)) {
      throw new RangeError(`Unknown active roster member: ${activeMemberId}`);
    }

    const firstReserve = [...members.keys()].find((id) => id !== activeMemberId) ?? null;

    teams.set(teamId, {
      id: teamId,
      slotId,
      members,
      activeMemberId,
      selectedReserveMemberId: firstReserve,
      nextVoluntarySwitchAtMs: 0
    });
  }

  function teamOf(teamId) {
    const team = teams.get(teamId);
    if (!team) {
      throw new RangeError(`Unknown roster team: ${teamId}`);
    }
    return team;
  }

  function rosterTeamForActor(actorId) {
    return (
      [...teams.values()].find(
        (team) => team.slotId === actorId
      ) ?? null
    );
  }

  function relationToReserveTeam(
    actorId,
    targetTeam
  ) {
    if (
      battleFormat &&
      typeof battleFormat.teamOf === "function"
    ) {
      const actorBattleTeam =
        battleFormat.teamOf(actorId);
      const targetBattleTeam =
        battleFormat.teamOf(targetTeam.slotId);
      if (
        actorBattleTeam !== null &&
        actorBattleTeam !== undefined &&
        targetBattleTeam !== null &&
        targetBattleTeam !== undefined
      ) {
        return actorBattleTeam === targetBattleTeam
          ? "ally"
          : "enemy";
      }
    }

    const actorRosterTeam =
      rosterTeamForActor(actorId);
    return actorRosterTeam?.id === targetTeam.id
      ? "ally"
      : "enemy";
  }

  function reserveActorId(team, member) {
    return (
      "__reserve__:" +
      team.id +
      ":" +
      member.id
    );
  }

  function materializeReserveFighter(
    team,
    member,
    atMs = combatSession.snapshot().elapsedMs
  ) {
    const anchorFighter =
      combatSession.snapshot().fighters[
        team.slotId
      ];
    if (!anchorFighter) {
      throw new RangeError(
        "Missing combat slot: " +
          team.slotId
      );
    }

    const detachedId =
      reserveActorId(team, member);
    const raw = cloneFighterForSlot(
      member.fighterConfig,
      detachedId,
      member.savedFighter,
      atMs
    );
    return createCombatState({
      distance:
        combatSession.snapshot().distance,
      fighters: [
        anchorFighter,
        raw
      ],
      elapsedMs: atMs
    }).fighters[detachedId];
  }

  function reserveEffectsForSkill(skill) {
    const effects = [
      ...(skill.effects ?? [])
    ];

    if (
      Number(skill.effect?.damage) > 0
    ) {
      effects.unshift(
        Object.freeze({
          kind: "damage",
          targetScope: "target",
          amount:
            Number(skill.effect.damage),
          channel:
            skill.element ?? null
        })
      );
    }

    if (
      Number(skill.effect?.heal) > 0
    ) {
      effects.unshift(
        Object.freeze({
          kind: "heal",
          targetScope: "target",
          amount:
            Number(skill.effect.heal)
        })
      );
    }

    for (const effect of effects) {
      if (
        effect.kind === "persistent_zone" ||
        effect.kind === "scheduled_effect"
      ) {
        return Object.freeze({
          ok: false,
          outcome:
            "unsupported_reserve_effect",
          kind: effect.kind
        });
      }
      if (effect.targetScope !== "target") {
        return Object.freeze({
          ok: false,
          outcome:
            "unsupported_reserve_effect",
          kind: effect.kind,
          targetScope: effect.targetScope
        });
      }
    }

    return Object.freeze({
      ok: true,
      effects: Object.freeze(effects)
    });
  }

  function zeroEffectSkill(skill) {
    return Object.freeze({
      ...skill,
      effect: Object.freeze({
        damage: 0,
        heal: 0,
        interruptsPreparation: false,
        stunMs: 0,
        tags: Object.freeze([])
      }),
      effects: Object.freeze([])
    });
  }

  function syncActiveSnapshot(team) {
    if (!team.activeMemberId) {
      return;
    }
    const fighter = combatSession.snapshot().fighters[team.slotId];
    if (!fighter) {
      throw new RangeError(`Missing combat slot: ${team.slotId}`);
    }
    team.members.get(team.activeMemberId).savedFighter = snapshotFighter(fighter);
  }

  function memberView(member, activeMemberId, selectedReserveMemberId) {
    const saved = member.savedFighter;
    const config = member.fighterConfig;
    return Object.freeze({
      id: member.id,
      creatureId: member.creatureId,
      displayName: member.displayName,
      active: member.id === activeMemberId,
      selected: member.id === selectedReserveMemberId,
      hp: saved?.hp ?? config.initialHp ?? config.maxHp,
      maxHp: saved?.maxHp ?? config.maxHp,
      energy: saved?.energy ?? config.initialEnergy ?? 0,
      maxEnergy: saved?.maxEnergy ?? config.maxEnergy
    });
  }

  function snapshot() {
    const result = {};
    for (const [teamId, team] of teams) {
      if (team.activeMemberId) {
        syncActiveSnapshot(team);
      }
      result[teamId] = Object.freeze({
        id: teamId,
        slotId: team.slotId,
        activeMemberId: team.activeMemberId,
        selectedReserveMemberId: team.selectedReserveMemberId,
        voluntarySwitchCooldownRemainingMs: remainingVoluntaryCooldownMs(team),
        members: Object.freeze(
          [...team.members.values()].map((member) =>
            memberView(
              member,
              team.activeMemberId,
              team.selectedReserveMemberId
            )
          )
        )
      });
    }
    return Object.freeze(result);
  }

  // The combat session clock is authoritative. No UI clock or independent timer.
  function remainingVoluntaryCooldownMs(team) {
    return Math.max(0, team.nextVoluntarySwitchAtMs - combatSession.snapshot().elapsedMs);
  }

  function voluntaryCooldownPreview(team) {
    const remainingMs = remainingVoluntaryCooldownMs(team);
    return remainingMs > 0
      ? Object.freeze({ ok: false, outcome: "recall_cooldown", remainingMs })
      : null;
  }

  function commitVoluntaryCooldown(team) {
    team.nextVoluntarySwitchAtMs = combatSession.snapshot().elapsedMs + voluntaryCooldownMs;
  }

  function previewRecall(teamId) {
    const team = teamOf(teamId);
    if (!team.activeMemberId) return Object.freeze({ ok: false, outcome: "no_active_member" });
    if (combatSession.snapshot().fighters[team.slotId]?.hp <= 0) return Object.freeze({ ok: false, outcome: "active_member_ko" });
    return voluntaryCooldownPreview(team) ?? Object.freeze({ ok: true, outcome: "ready" });
  }

  function selectReserve(teamId, memberId) {
    const team = teamOf(teamId);
    if (!team.members.has(memberId)) {
      throw new RangeError(`Unknown roster member: ${memberId}`);
    }
    if (memberId === team.activeMemberId) {
      return Object.freeze({ ok: false, outcome: "member_already_active" });
    }
    team.selectedReserveMemberId = memberId;
    return Object.freeze({ ok: true, outcome: "selected", memberId });
  }

  function recall(teamId) {
    const preview = previewRecall(teamId);
    if (!preview.ok) return preview;
    const team = teamOf(teamId);

    syncActiveSnapshot(team);
    const recalledMemberId = team.activeMemberId;
    combatSession.departFighter(team.slotId, {departingMemberId: recalledMemberId});
    team.activeMemberId = null;
    commitVoluntaryCooldown(team);

    if (
      !team.selectedReserveMemberId ||
      team.selectedReserveMemberId === recalledMemberId
    ) {
      team.selectedReserveMemberId =
        [...team.members.keys()].find((id) => id !== recalledMemberId) ??
        recalledMemberId;
    }

    return Object.freeze({
      ok: true,
      outcome: "recalled",
      teamId,
      slotId: team.slotId,
      memberId: recalledMemberId
    });
  }

  function summon(teamId, memberId = null) {
    const team = teamOf(teamId);
    if (team.activeMemberId) {
      return Object.freeze({ ok: false, outcome: "active_member_present" });
    }

    const targetId = memberId ?? team.selectedReserveMemberId;
    const member = team.members.get(targetId);
    if (!member) {
      return Object.freeze({ ok: false, outcome: "no_reserve_selected" });
    }
    if ((member.savedFighter?.hp ?? member.fighterConfig.initialHp ?? member.fighterConfig.maxHp) <= 0) {
      return Object.freeze({ ok: false, outcome: "reserve_ko" });
    }

    const fighter = cloneFighterForSlot(
      member.fighterConfig,
      team.slotId,
      member.savedFighter,
      combatSession.snapshot().elapsedMs
    );
    combatSession.replaceFighter(team.slotId, fighter, { clearSourceZones: true });

    team.activeMemberId = member.id;
    team.selectedReserveMemberId =
      [...team.members.keys()].find((id) => id !== member.id) ?? null;

    return Object.freeze({
      ok: true,
      outcome: "summoned",
      teamId,
      slotId: team.slotId,
      memberId: member.id,
      creatureId: member.creatureId,
      displayName: member.displayName
    });
  }

  function previewSwitch(teamId, memberId = null) {
    const team = teamOf(teamId);
    if (!team.activeMemberId) return Object.freeze({ ok: false, outcome: "no_active_member" });
    if (combatSession.snapshot().fighters[team.slotId]?.hp <= 0) return Object.freeze({ ok: false, outcome: "active_member_ko" });
    const cooldown = voluntaryCooldownPreview(team);
    if (cooldown) return cooldown;
    const targetId = memberId ?? team.selectedReserveMemberId;
    if (targetId === team.activeMemberId) return Object.freeze({ ok: false, outcome: "member_already_active" });
    const member = team.members.get(targetId);
    if (!member) return Object.freeze({ ok: false, outcome: "no_reserve_selected" });
    if ((member.savedFighter?.hp ?? member.fighterConfig.initialHp ?? member.fighterConfig.maxHp) <= 0) return Object.freeze({ ok: false, outcome: "reserve_ko" });
    return Object.freeze({ ok: true, outcome: "ready", memberId: member.id });
  }

  function switchMember(teamId, memberId = null) {
    const preview = previewSwitch(teamId, memberId);
    if (!preview.ok) return preview;
    const team = teamOf(teamId);
    const member = team.members.get(preview.memberId);
    syncActiveSnapshot(team);
    const recalledMemberId = team.activeMemberId;
    const fighter = cloneFighterForSlot(member.fighterConfig, team.slotId, member.savedFighter, combatSession.snapshot().elapsedMs);
    // No absent slot: the outgoing member stays targetable until this atomic replacement.
    combatSession.replaceFighter(team.slotId, fighter, {
      clearSourceZones: true,
      departingMemberId: recalledMemberId
    });
    team.activeMemberId = member.id;
    team.selectedReserveMemberId = recalledMemberId;
    commitVoluntaryCooldown(team);
    return Object.freeze({ ok: true, outcome: "switched", teamId, slotId: team.slotId,
      recalledMemberId, memberId: member.id, creatureId: member.creatureId, displayName: member.displayName });
  }

  function replaceKnockedOut(teamId) {
    const team = teamOf(teamId);
    if (!team.activeMemberId) {
      return Object.freeze({ ok: false, outcome: "no_active_member" });
    }

    const fighter = combatSession.snapshot().fighters[team.slotId];
    if (!fighter || fighter.hp > 0) {
      return Object.freeze({ ok: false, outcome: "active_member_not_ko" });
    }

    syncActiveSnapshot(team);
    const defeatedMemberId = team.activeMemberId;
    combatSession.departFighter(team.slotId, {departingMemberId: defeatedMemberId});
    team.activeMemberId = null;

    const replacement = [...team.members.values()].find((member) => {
      if (member.id === defeatedMemberId) {
        return false;
      }
      const hp =
        member.savedFighter?.hp ??
        member.fighterConfig.initialHp ??
        member.fighterConfig.maxHp;
      return hp > 0;
    });

    if (!replacement) {
      team.selectedReserveMemberId = null;
      return Object.freeze({
        ok: true,
        outcome: "team_defeated",
        teamId,
        slotId: team.slotId,
        defeatedMemberId
      });
    }

    team.selectedReserveMemberId = replacement.id;
    const summoned = summon(teamId, replacement.id);

    return Object.freeze({
      ...summoned,
      outcome: "ko_replaced",
      defeatedMemberId,
      replacementMemberId: replacement.id
    });
  }

  function reserveMemberSnapshot(
    teamId,
    memberId
  ) {
    const team = teamOf(teamId);
    const member = team.members.get(memberId);
    if (!member) {
      throw new RangeError(
        "Unknown roster member: " +
          memberId
      );
    }
    if (member.id === team.activeMemberId) {
      throw new RangeError(
        "Roster member is active, not reserve: " +
          memberId
      );
    }
    return snapshotFighter(
      materializeReserveFighter(
        team,
        member
      )
    );
  }

  function useSkillOnTarget({
    actorId,
    targetRef: targetRefInput,
    skill
  }) {
    const targetRef =
      normalizeCombatTargetRefV1(
        targetRefInput
      );
    const locations =
      skill.targetLocations ?? ["active"];

    if (!locations.includes(targetRef.scope)) {
      return Object.freeze({
        ok: false,
        outcome: "target_location",
        targetRef
      });
    }

    if (targetRef.scope === "active") {
      return combatSession.useSkill({
        actorId,
        targetId: targetRef.actorId,
        skill
      });
    }

    const team = teamOf(targetRef.teamId);
    const member =
      team.members.get(targetRef.memberId);
    if (!member) {
      throw new RangeError(
        "Unknown roster member: " +
          targetRef.memberId
      );
    }
    if (member.id === team.activeMemberId) {
      return Object.freeze({
        ok: false,
        outcome: "target_not_reserve",
        targetRef
      });
    }

    const relation =
      relationToReserveTeam(
        actorId,
        team
      );
    if (
      !skill.targetRelations.includes("any") &&
      !skill.targetRelations.includes(
        relation
      )
    ) {
      return Object.freeze({
        ok: false,
        outcome: "target_relation",
        relation,
        targetRef
      });
    }

    const reserveEffects =
      reserveEffectsForSkill(skill);
    if (!reserveEffects.ok) {
      return reserveEffects;
    }

    const now =
      combatSession.snapshot().elapsedMs;
    const reserveFighter =
      materializeReserveFighter(
        team,
        member,
        now
      );
    if (reserveFighter.hp <= 0) {
      return Object.freeze({
        ok: false,
        outcome: "reserve_ko",
        targetRef
      });
    }

    const currentState =
      combatSession.snapshot();
    const started = resolveSkillStart({
      state: currentState,
      actorId,
      targetId: team.slotId,
      skill: zeroEffectSkill(skill),
      skillSpeedMultiplier:
        combatSession.skillSpeedMultiplier,
      battleFormat
    });
    if (!started.ok) {
      return started;
    }

    if (
      started.action.targetId !==
      team.slotId
    ) {
      return Object.freeze({
        ok: false,
        outcome:
          "taunted_target_locked",
        forcedTargetId:
          started.action.targetId,
        targetRef
      });
    }

    const detachedId =
      reserveActorId(team, member);
    const evaluationState =
      createCombatState({
        distance: currentState.distance,
        fighters: [
          started.state.fighters[
            actorId
          ],
          {
            ...reserveFighter,
            id: detachedId
          }
        ],
        elapsedMs: now
      });

    const evaluationSkill =
      Object.freeze({
        ...skill,
        effect: Object.freeze({
          damage: 0,
          heal: 0,
          interruptsPreparation: false,
          stunMs: 0,
          tags: Object.freeze([])
        }),
        effects:
          reserveEffects.effects
      });

    const unsupported =
      unsupportedImmediateTacticalEffectV1(
        evaluationSkill,
        {
          state: evaluationState,
          actorId,
          targetId: detachedId
        }
      );
    if (unsupported !== null) {
      return Object.freeze({
        ok: false,
        outcome:
          "unsupported_reserve_effect",
        tacticalEffect: unsupported,
        targetRef
      });
    }

    const tactical =
      applyImmediateTacticalEffectsV1({
        state: evaluationState,
        actorId,
        targetId: detachedId,
        skill: evaluationSkill,
        atMs: 0,
        combatAtMs: now,
        battleFormat: null
      });

    combatSession.replaceFighter(
      actorId,
      tactical.state.fighters[
        actorId
      ]
    );
    member.savedFighter =
      snapshotFighter(
        tactical.state.fighters[
          detachedId
        ]
      );

    return Object.freeze({
      ok: true,
      outcome: "resolved",
      actorId,
      targetRef,
      relation,
      action: started.action,
      state: combatSession.snapshot(),
      events: Object.freeze([
        ...started.events,
        ...tactical.events
      ])
    });
  }

  function applyCommandResolution(teamId, resolution) {
    if (!resolution?.ok || resolution.outcome !== "completed") {
      return Object.freeze({ ok: false, outcome: "command_not_completed" });
    }

    if (resolution.commandKind === "recall") {
      return recall(teamId);
    }
    if (resolution.commandKind === "summon") {
      return summon(teamId);
    }
    if (resolution.commandKind === "switch") {
      const memberId = resolution.events?.find(event => event.type === "command-complete")?.rosterMemberId;
      if (!memberId) return Object.freeze({ ok: false, outcome: "no_reserve_selected" });
      return switchMember(teamId, memberId);
    }

    return Object.freeze({ ok: true, outcome: "no_roster_change" });
  }

  return Object.freeze({
    snapshot,
    reserveMemberSnapshot,
    useSkillOnTarget,
    selectReserve,
    recall,
    summon,
    previewRecall,
    previewSwitch,
    switchMember,
    replaceKnockedOut,
    applyCommandResolution
  });
}
