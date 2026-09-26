function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function cloneFighterForSlot(config, slotId, snapshot = null) {
  const source = snapshot ?? config;
  return {
    ...config,
    id: slotId,
    initialHp: source.hp ?? source.initialHp ?? config.initialHp ?? config.maxHp,
    initialEnergy:
      source.energy ?? source.initialEnergy ?? config.initialEnergy ?? 0,
    energyChargeProgressMs: source.energyChargeProgressMs ?? 0,
    chargeTimeEffects: source.chargeTimeEffects ?? []
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
    chargeTimeEffects: fighter.chargeTimeEffects
  });
}

export function createRosterSession({
  combatSession,
  roster,
  fighterConfigs
}) {
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
      selectedReserveMemberId: firstReserve
    });
  }

  function teamOf(teamId) {
    const team = teams.get(teamId);
    if (!team) {
      throw new RangeError(`Unknown roster team: ${teamId}`);
    }
    return team;
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
    const team = teamOf(teamId);
    if (!team.activeMemberId) {
      return Object.freeze({ ok: false, outcome: "no_active_member" });
    }

    syncActiveSnapshot(team);
    const recalledMemberId = team.activeMemberId;
    team.activeMemberId = null;

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

    const fighter = cloneFighterForSlot(
      member.fighterConfig,
      team.slotId,
      member.savedFighter
    );
    combatSession.replaceFighter(team.slotId, fighter);

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

    return Object.freeze({ ok: true, outcome: "no_roster_change" });
  }

  return Object.freeze({
    snapshot,
    selectReserve,
    recall,
    summon,
    replaceKnockedOut,
    applyCommandResolution
  });
}
