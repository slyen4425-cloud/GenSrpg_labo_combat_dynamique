// Shared semantic intent for an ally/self support skill authored with a legacy
// physical contact approach. Combat Runtime must finish this cast by its native
// timer because Presentation intentionally does not move models into allies.
// This is a pure data contract; no renderer, UI or combat clock authority.
export function isPureBeneficialAllySkillV1(skill) {
  return Boolean(skill) &&
    Array.isArray(skill.targetRelations) &&
    skill.targetRelations.length > 0 &&
    skill.targetRelations.every(
      relation => relation === "self" || relation === "ally"
    ) &&
    Number(skill.effect?.damage ?? 0) === 0 &&
    Array.isArray(skill.effects) &&
    skill.effects.length > 0 &&
    skill.effects.every(effect =>
      (effect.kind === "apply_status" &&
        effect.status?.polarity === "beneficial") ||
      effect.kind === "heal" ||
      effect.kind === "energy_restore" ||
      effect.kind === "cleanse"
    );
}
