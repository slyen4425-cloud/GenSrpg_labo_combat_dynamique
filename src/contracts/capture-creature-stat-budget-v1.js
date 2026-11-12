import { normalizeCaptureCreatureStatValuesV1 } from "./capture-creature-stat-values-v1.js";
import { normalizeCaptureStatRegistryV1 } from "./capture-stat-registry-v1.js";

// Authoring-only rule for NEW standard creatures. Never retroactively
// reinterpret historical species, levels, battle stats, resistance or saves.
// One source of truth: existing Capture registry supplies every stat ID.
export const CAPTURE_NEW_CREATURE_STAT_BUDGETS_V1 = Object.freeze({
  standard: 100
});
// Epic and legendary levels intentionally remain unconfigured until approved.
export const CAPTURE_HEALTH_PV_PER_BUDGET_POINT_V1 = 5;

export function evaluateCaptureNewCreatureStatBudgetV1({
  statValues, statRegistry, tier = "standard"
} = {}) {
  if (!Object.prototype.hasOwnProperty.call(CAPTURE_NEW_CREATURE_STAT_BUDGETS_V1,tier))
    throw new RangeError("Unknown or not-yet-approved creature rarity tier: "+tier);
  const registry=normalizeCaptureStatRegistryV1(statRegistry);
  const normalized=normalizeCaptureCreatureStatValuesV1(statValues,registry);
  const contributions={};
  let spent=0;
  for(const stat of registry.stats){
    const amount=normalized.values[stat.id]??0;
    const points=stat.id==="health"
      ? amount/CAPTURE_HEALTH_PV_PER_BUDGET_POINT_V1
      : amount;
    contributions[stat.id]=points;
    spent+=points;
  }
  const budget=CAPTURE_NEW_CREATURE_STAT_BUDGETS_V1[tier];
  spent=Math.round(spent*1000)/1000;
  return Object.freeze({
    tier,budget,spent,remaining:Math.round((budget-spent)*1000)/1000,
    valid:Math.abs(budget-spent)<1e-6,
    contributions:Object.freeze(contributions)
  });
}

export function assertCaptureNewCreatureStatBudgetV1(input){
  const result=evaluateCaptureNewCreatureStatBudgetV1(input);
  if(!result.valid)
    throw new RangeError(
      "New "+result.tier+" creature must allocate exactly "+result.budget+
      " stat points; allocated "+result.spent+" (remaining "+result.remaining+")"
    );
  return result;
}
