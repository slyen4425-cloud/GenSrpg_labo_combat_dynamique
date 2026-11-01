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

## Reprise du 1er novembre — diagnostic de la sentinelle temporelle
- Première CI sur `58d428d8` : 2459/2460 tests Foundation, échec de la sentinelle de tick (1 observé au lieu de 0 à 1099 ms) ; quatre navigateurs verts. Échec conservé, aucune fausse validation.
- Cause vérifiée dans l'unique `Combat Runtime` : l'action instantanée résout à t=0 et crée son maintien à t=0. Le `step(100)` du *harness* ne retarde pas le lancement ; la première échéance est exactement t=1000, pas t=1100. Correction de la sentinelle aux bornes t=999/1000 puis t=2999/3000, commit `35ceeaf`.
- Deuxième CI : l'attente d'énergie absolue du scénario échoue (2 observé contre 1 attendu), car la régénération **native** +1/2000 ms est active dans le combattant de test. Ce n'est pas une erreur de décompte des paiements : elle doit rester active dans le jeu. Le fixture d'épuisement la désactive localement (`energyChargeAmount: 0`), commit `e512728`. Pas de changement du moteur ni des réglages joueur.
- Sentinelles conservées : un seul paiement par tick accepté, pas d'effet avant échéance, arrêt sur énergie insuffisante sans tick fantôme, arrêt sur dégâts/retrait, anciens `contactHold`, charges et 1v1/2v2 protégés. La Fondation sur `e512728` passe ; confirmer les quatre navigateurs et refaire la CI cinq jobs sur ce **SHA documentaire final** avant checkpoint GREEN.
- Suivant : checkpoint GREEN exact, PR `gh-pages`, tests CI et Pages post-fusion. Puis nouveau lot éditeur/FX (répétition des visuels et sons à chaque tick) ; aucune promesse de jouabilité auteur dans le présent lot natif.
