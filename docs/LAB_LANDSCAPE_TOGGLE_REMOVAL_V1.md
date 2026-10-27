# Landscape Toggle Removal V1

Date : 2026-10-07

## Objectif

Supprimer le contrôle utilisateur devenu obsolète :

- checkbox `data-preview-landscape-mode`
- libellé `Combat plein écran paysage / Mode de jeu Capture`

Le paysage reste la norme automatique du mode Capture.

## Base

Base :
`9d0c5101c68b835652f5b94626b42e1490c3894d`

Checkpoint de départ :
`checkpoint/lab-start-landscape-toggle-removal-v1-2026-10-07`

Branche :
`work/lab-landscape-toggle-removal-v1-2026-10-07`

## Architecture conservée

Le propriétaire unique reste :
`createCapturePreviewDisplayModeV1`.

Le lancement appelle désormais systématiquement :

`previewDisplayMode.enter({ enabled: true })`

Inchangés :
- requestFullscreen ;
- orientation.lock("landscape") ;
- release fullscreen/orientation ;
- `data-landscape-required` ;
- gate portrait `Tourne ton téléphone` quand le navigateur ne peut pas verrouiller l'orientation ;
- scène 16:9 ;
- bouton retour.

## Correctif

Supprimés :
- HTML du toggle ;
- lookup JS `landscapeMode` ;
- dépendance de validation structure à ce contrôle ;
- styles CSS morts `.preview-landscape-toggle`.

Aucun nouveau owner, aucune variable globale, aucun fallback concurrent.

## TDD

RED :
- commit `1a5c7d62527bbc49930485717fdfd05bc9e848d6`
- CI `37678243272`
- 1243 / 1245 PASS
- 2 FAIL ciblés :
  - dépendance test au `landscapeMode` ;
  - toggle encore présent.

Implémentation :
- HTML : `7b07074fbe7d277a117aaa27e09c4e1d682f7522`
- JS automatique : `a3d916dd3b663faeeb708f47ecb999ad7e622a64`
- CSS mort retiré : `dac591f79a92bf2aee795cd8cf9c6372f329e676`
- sentinelle disclosure : `b0bfceccfe11df987585d34dac9fc791eb82c498`
- sentinelle décision produit : `80a02c42b811214ec99bd26302595ed06e03e050`

GREEN :
- CI `37678566741`
- 1245 / 1245 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

## Domaines protégés

Aucun changement de :
- `src/ui/capture-preview-display-mode-v1.js` ;
- Combat Runtime / Rules ;
- Animation / FX ;
- Goutte vive ;
- projectile clash ;
- audio ;
- créatures ;
- Roster ;
- main ;
- Zombicide-40k ;
- Exploration.

## Validation utilisateur

GREEN technique.

À vérifier sur smartphone :
- le toggle n'est plus visible ;
- Tester en combat passe directement au comportement paysage ;
- si le navigateur refuse le verrouillage orientation, le gate `Tourne ton téléphone` s'affiche encore.
