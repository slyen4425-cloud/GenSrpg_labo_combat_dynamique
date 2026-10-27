# Labo Combat — vitesse de recharge des compétences (buff/debuff) V1

Date : 11 octobre 2026

## Intention

Étendre les **statuts temporaires** de la bibliothèque de capacités, comme `energy_regen_modifier`, mais exclusivement à la **vitesse de progression des cooldowns de compétences**. Ne pas modifier les charges d'esquive ou des autres actions rechargeables ; ne pas modifier durablement les valeurs d'auteur `SkillDefinition.cooldownMs`.

## Statut auteur

- `StatusEffectV1.kind = "skill_cooldown_rate_modifier"`, `modifierPct` signé et fini. Polarity, duration, stacking, tags, cleanse, dispel restent gérés par le StatusRuntime canonique.
- +100 % = progression deux fois plus rapide pendant le statut ; −50 % = progression deux fois plus lente ; ≤−100 % = aucune progression temporaire (sans retard artificiel après son expiration).
- Le bonus s'applique aux compétences déjà en cooldown, chacune individuellement, par son identifiant de compétence existant. Une compétence redevenue prête reste prête. Le progrès gagné n'est pas annulé à l'expiration du statut.
- Les timestamps d'entrée et de sortie du statut délimitent les segments exacts au cours d'un grand pas de temps : une trame lente doit donner le même résultat que plusieurs petites trames. Les autres statuts et la régénération d'énergie restent indépendants.
- Contrat `SkillEffectV1.apply_status` déjà existant ; cible `self`/`all_allies`/`target`, ou application via `persistent_zone.tickEffect.apply_status`. Aucun nouveau `SkillEffect.kind` et aucun nouvel outil parallèle.

## Autorités de code

- `src/contracts/status-effect-v1.js` : normalisation stricte du statut ;
- `src/core/combat/combat-timing.js` : fonction pure d'avancement des deadlines, via les timestamps d'activité ;
- `src/core/combat/combat-state.js` : un seul champ propriétaire `fighter.skillCooldowns[skillId] = readyAtMs` et `skillCooldownRemainingMs` ;
- `src/core/combat/combat-session.js` : conservation de la ligne temporelle des buffs expirant au cours de `advanceMs` sans second timer ;
- `src/ui/capture-editor-human-v2.js` : sélection `Buff / Debuff / Statut → Recharge des compétences (%)`, valeur signée et cible/durée/stacking habituels, également en zone persistante ;
- `tests/unit/skill-cooldown-rate-status-v1.test.mjs` : validation, baseline, cooldown commencé, expiration exacte, frames split/grosses, debuff/pause, stacks/cleanse, Native CombatSession, export/import, UI et préservation des données source.

## Exemple

Une compétence normalement verrouillée 8 secondes, déjà lancée, est soumise à +100 % durant 2 secondes. Pendant ces 2 secondes, le cooldown avance de 4 secondes ; à l'expiration le délai reprend sa vitesse habituelle. Un debuff −50 % pendant 2 secondes ne fait avancer la recharge que d'une seconde.

## Gouvernance et validation

- Base `gh-pages` : `cbaddef299344afb6decb74562cba329a3bcf45d`.
- Checkpoint initial : `checkpoint/lab-start-skill-cooldown-regen-status-v1-2026-10-11`.
- Work : `work/lab-skill-cooldown-regen-status-v1-2026-10-11`.
- Protégés : `main`, `global-assets`, registres de créatures et capacités auteur, moteur visuel/FX, règles de dégâts et d'énergie, Zombicide-40k, Exploration.
- GREEN uniquement sur CI exacte foundation, navigateurs Firestorm et bibliothèque créatures, checkpoint SHA exact, fast-forward sous lease, puis CI et déploiement Pages publics ; contrôle tactile Android distinct.

## Résultats

- À compléter par le SHA et les runs CI lors de la publication.
