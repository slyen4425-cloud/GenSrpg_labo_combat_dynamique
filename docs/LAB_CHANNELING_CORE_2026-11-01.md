# Canalisation V1 — ticks et énergie du moteur natif (2026-11-01)

## Référence et gouvernance
- Base GREEN `gh-pages@d0bfecf724f6f3ed70c1ae9bdd2d07289c713b83` après PR #179, CI 5/5 et Pages réussies.
- START `checkpoint/lab-start-channeling-core-2026-11-01`, WORK `work/lab-channeling-core-2026-11-01`, issue #168.
- RED `6b63d7cfa3d48ffad24c8a9eaf9220bc5cf64d22`, branche `checkpoint/lab-red-channeling-core-2026-11-01`, run GitHub `41281865499` attendu en échec (contrat et moteur absents).
- La validation de ce lot exige la CI 5/5 du SHA final contenant ce rapport, un checkpoint GREEN sur ce SHA, PR vers `gh-pages` et CI/Pages après fusion.

## Contrat
- `SkillDefinition.channeling` est facultatif ; anciens fichiers restent identiques.
- `tickIntervalMs` : 100 à 60000 ms, `maxDurationMs` : 0 (non borné) à 120000 ms, `maxTicks` : 1 à 500 ou absent, `energyCostPerTick` : non négatif ; au moins une cause de fin (durée, nombre ou coût).
- Effets de tick 1 à 12, issus de `SkillEffectV1` existant : dégâts, soins, statut, marqueurs, sur soi ou cible. Pas de zone programmée ni d'effet différé dupliquant l'ordonnanceur.
- `stopOnDamage`, `stopOnStun`, `stopOnSilence` configurables, actifs par défaut. KO, absence de cible, rappel et annulation interrompent systématiquement.
- Canalisation incompatible avec charge, contactHold et projectile étendu ; seuls les effets des ticks infligent des dégâts dans cette V1 (pas de second dommage à l'impact initial).

## Propriétaires
- Combat Runtime partage **le même registre de maintien et le même tick** que `contactHold` : aucun timer, système de PV ou ordonnanceur supplémentaire.
- Combat Session vérifie état du lanceur, statut et énergie **avant** de créer un nouvel état ; elle paie l'énergie et applique tous les effets via `applyImmediateTacticalEffectsV1` en une transaction. Un tick refusé ne paie rien et n'applique rien.
- Combat Runtime borne la durée/le nombre de ticks, vérifie le résultat de chaque paiement, et expose `onChannelStart/onChannelTick/onChannelEnd` pour l'affichage futur.
- Une compétence canalisée occupe toujours l'action de son utilisateur jusqu'à son arrêt ; la résolution initiale conserve les cooldowns natifs.
- Annulation/rappel passe par le même `cancelActionsForActor` et non par un gestionnaire ad hoc.

## Tests
- Normalisation de la compétence et rejets invalides.
- Paiement exact et unique 3 énergie/tick, dégâts sur chaque tick accepté, échec sans énergie ne produit ni dégâts ni coût.
- Runtime déterministe : zéro effet avant premier tick, N ticks au bon intervalle, arrêt automatique sur insuffisance d'énergie ; interruption sur dégâts PV réels et rappel sans effets fantômes.
- Sentinelles existantes contactHold / charges / 1v1 / 2v2 / navigateur doivent rester vertes.

## Périmètre non livré
- Ce lot pose le **socle moteur uniquement**. Il ne représente pas une fonctionnalité déjà utilisable depuis l'éditeur, et il ne déclenche pas encore les sprites/sons auteur à chaque tick. Ces éléments doivent suivre sur une branche distincte après la validation de ce socle.
- Les conditions avancées de portée/visée à chaque tick et les esquives/réflections multi-cibles restent à cadrer et tester, sans changer le contrat historique.
- Aucun changement de `main`, GenSrpg, Exploration ni global-assets. Essai smartphone réel à réaliser après raccordement de l'éditeur/FX.
