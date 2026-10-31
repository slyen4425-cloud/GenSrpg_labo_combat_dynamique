# Combat Lab — Attaque chargée par réactivation (31/10/2026)

## Périmètre et gouvernance
Base auteur gh-pages `c196971fe524c2a0442316c29ccc66cf4ff4bf7c`. Départ `checkpoint/lab-start-charged-projectile-2026-10-31`. Branche de travail `work/lab-charged-projectile-2026-10-31`. Aucun changement sur main, gh-pages, GenSrpg ni Exploration. Promotion uniquement après CI complète, revue, validation auteur, test tactile.

## Règle fonctionnelle
Option facultative `SkillDefinition.chargedAttack` réservée au projectile **direct** :
- `preparationMs` reste le délai existant avant le départ, modifiable dans l'éditeur ;
- `baseDamage` = dégâts de base ; `bonusDamagePerCharge` = dégâts ajoutés par réactivation ;
- `maxCharges` = nombre maximal d'**activations** (premier appui inclus, 2..20) ;
- `reactivationWindowMs` = temps maximal entre deux appuis successifs, toujours avant le départ ;
- `sizeIncreasePct` = croissance visuelle par réactivation (0..100 %).

Exemple : préparation 1000 ms, fenêtre 450 ms, base 5 dégâts, bonus +5, croissance +10 %, maximum trois activations. Un appui : 5 dégâts / taille 100 % ; deux : 10 / 110 % ; trois : 15 / 120 %. Les protections, esquives, résistances, collision projectile, KO restent ceux du moteur existant. Les dégâts configurés ne s'appliquent qu'à l'impact réel. Une seule dépense d'énergie, un seul coût de marqueurs, une seule utilisation et une seule recharge pour tout le tir. La cible reste verrouillée. Réactivation interdite après départ, fenêtre expirée, nombre maximum atteint ou interruption.

## Propriétaires
- Contrat et validation : `src/contracts/skill-definition.js` ; garde contre une deuxième autorité de dégâts `effect.damage` et `effects[].damage`.
- Horloge et nombre de charges : unique `src/core/combat/combat-runtime.js` ; aucune seconde `CombatSession`, aucun timer UI.
- Dégâts : `action-resolver.js` et `combat-damage-v1.js` inchangés, ils reçoivent la puissance effective lors de la résolution.
- Taille : `src/core/fx/skill-fx-plan.js` → `src/adapters/renderer/dom-skill-fx.js`, composition multiplicative avec l'échelle auteur, sans changement de trajectoire.
- Auteur : `examples/dom-demo/capture-editor-v2.html` / `src/ui/capture-editor-human-v2.js` ; export/import via le contrat existant.
- Combat joueur : boutons actuels de `src/ui/combat-test-ui.js` et `src/ui/combat-2v2-test-ui.js`, sans interface bis.
- Bestiaire : projection `describeCaptureSkillV1` du contrat, sans texte manuel divergent.

## Validation
Test initial RED `tests/unit/capture-charged-projectile-2026-10-31.test.mjs` : validation du contrat, cumul de pressions dans la fenêtre, verrou de cible et borne, dépense unique, timing du départ, taille au release, dégât réel à l'impact, rejet tardif, explication du bestiaire, champs de l'éditeur. Test de non-régression de l'ancienne Boule de feu et de tous les autres sorts par CI Fondation + 4 navigateurs. GREEN seulement sur le SHA final et toutes les preuves attendues.
