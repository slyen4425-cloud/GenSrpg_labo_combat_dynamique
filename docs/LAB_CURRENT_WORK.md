# Point de reprise courant — 2026-10-07

## Lot actif

Landscape Toggle Removal V1

Branche :
`work/lab-landscape-toggle-removal-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-landscape-toggle-removal-v1-2026-10-07`

Base exacte :
`9d0c5101c68b835652f5b94626b42e1490c3894d`

Base GREEN précédente :
`checkpoint/lab-goutte-projectile-power-regression-v1-green-2026-10-07`

## Décision produit existante

`docs/LAB_CAPTURE_LANDSCAPE_PRODUCT_DECISION_V1.md` définit déjà le gameplay Capture smartphone en paysage comme norme produit.

Le propriétaire UI reste :
`createCapturePreviewDisplayModeV1`.

Le gate « Tourne ton téléphone » reste nécessaire uniquement quand le navigateur ne peut pas verrouiller l'orientation.

## Retour utilisateur

L'encadré :
« Combat plein écran paysage / Mode de jeu Capture »
avec sa checkbox cochée et désactivée est devenu inutile.

## Objectif

Supprimer uniquement le contrôle/toggle devenu obsolète.

Le lancement du combat doit appeler systématiquement le propriétaire display mode en paysage :
`previewDisplayMode.enter({ enabled: true })`.

## Fichiers autorisés

- `examples/dom-demo/capture-editor-v2.html`
- `examples/dom-demo/capture-editor-v2.js`
- CSS uniquement pour retirer le style mort du toggle
- tests UI preview
- documentation

## Domaines protégés

Ne pas modifier :
- `src/ui/capture-preview-display-mode-v1.js` sauf preuve ;
- fullscreen/orientation lock ;
- rotate gate ;
- scène 16:9 ;
- Combat Runtime / Rules ;
- Goutte vive ;
- audio ;
- créatures ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD

1. RED : le HTML ne doit plus contenir `data-preview-landscape-mode` ni l'encadré ;
2. RED : le script ne doit plus dépendre de `landscapeMode` ;
3. RED : lancement test => `enter({ enabled: true })` ;
4. conserver leave/dispose et rotate gate ;
5. CI complète ;
6. preview dédiée.

## Critère de fin

Le contrôle utilisateur disparaît, mais le paysage reste la norme automatique et le propriétaire UI existant reste seul responsable du fullscreen/orientation.
