# Labo Combat — Sangsue, maintien visuel au contact
Date : 21 octobre 2026.

## Contrat
La PR noyau CombatRuntime fournit `contactHold`, pulses, déclencheur de sortie et callbacks. Ce lot complète **uniquement** la représentation : depuis `CombatResolutionPresenter`, l'approche de la capacité annotée `contactHold` conserve le même `onContact` canonique, qui consulte `CombatRuntime.reportActionContact`.

Si le moteur répond `contact_held`, `DomActorRenderer.pauseActive()` suspend **ensemble** les deux pistes WAAPI (corps et ombre) à leur position de collision. La carte `activeApproachBySlot` demeure l'unique propriétaire visuel. Lorsque `onContactHoldEnd` du runtime est émis (dégât réel, KO, fin de durée ou annulation), les interfaces 1v1/2v2 appellent `releaseHeldApproachFor` ; le renderer réutilise `returnActiveToBaseFromCurrent` et le retour puis l'idle d'origine. Le défenseur conserve tous ses droits d'action. Ni nouveau timer ni déplacement spécial Sangsue.

La logique de réaction on-hit existante attend que le retour visuel soit terminé avant de rejouer la pose hit. L'ombre reste associée au même plan.

## Tests
- Fausse WAAPI (deux pistes réelles de rendu), pause au contact, capture des transformations courantes, reprise du retour natif et annulation d'origine ;
- Sentinelles de raccord `Presenter -> playApproachFor -> CombatRuntime callback -> visuals.returnHeldApproachFor`, 1v1 et 2v2 ;
- Tests Chromium et CI existants non régressifs. La configuration utilisateur des ticks depuis l'éditeur est réservée à un troisième lot.

## Fin
Un test visuel sur téléphone de la vraie Sangsue (configurée par export ou UI, après troisième lot) est nécessaire avant de parler de validation esthétique.
