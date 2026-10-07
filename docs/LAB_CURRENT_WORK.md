# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Landscape Toggle Removal V1

Branche :
`work/lab-landscape-toggle-removal-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-landscape-toggle-removal-v1-2026-10-07`

Base :
`9d0c5101c68b835652f5b94626b42e1490c3894d`

## Résultat

Le contrôle utilisateur paysage devenu inutile est supprimé :
- plus de checkbox `data-preview-landscape-mode` ;
- plus d'encadré `Combat plein écran paysage / Mode de jeu Capture` ;
- plus de dépendance JS `landscapeMode` ;
- plus de styles morts du toggle.

Le paysage reste automatique :
`previewDisplayMode.enter({ enabled: true })`.

## Owner

Inchangé :
`createCapturePreviewDisplayModeV1`.

Il reste seul propriétaire de :
- fullscreen ;
- orientation lock paysage ;
- libération fullscreen/orientation ;
- rotate gate portrait.

## Gate portrait

Le message `Tourne ton téléphone` est conservé uniquement comme secours quand le navigateur ne peut pas verrouiller l'orientation.

## TDD

RED :
- `1a5c7d62527bbc49930485717fdfd05bc9e848d6`
- CI `37678243272`
- 1243 / 1245 PASS
- 2 FAIL ciblés.

GREEN :
- dernier commit fonctionnel/test `80a02c42b811214ec99bd26302595ed06e03e050`
- CI `37678566741`
- 1245 / 1245 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_LANDSCAPE_TOGGLE_REMOVAL_V1.md`

## Domaines protégés

Inchangés :
- display mode owner ;
- Combat Runtime / Rules ;
- Animation / FX ;
- projectile clash ;
- Goutte vive ;
- audio ;
- créatures ;
- Roster ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action

Créer checkpoint/preview GREEN puis ouvrir séparément :
**Projectile Power Help V1** — détailler dans l'éditeur le fonctionnement de la puissance projectile sans modifier aucune règle gameplay.
