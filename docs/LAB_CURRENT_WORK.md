# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Goutte Projectile Power Regression V1

Branche :
`work/lab-goutte-projectile-power-regression-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-goutte-projectile-power-regression-v1-2026-10-07`

Base :
`ffdb2533bfa28446a2bea22afa36c5093c4d8cce`

## Résultat

Le contrat existant est confirmé :
- `projectileClash.power = 0` = hors système de clash ;
- puissance positive = participe au clash ;
- puissance supérieure = survit ;
- puissance égale = annulation mutuelle.

L'export auteur de Goutte vive possède déjà `power = 1`.

Le vrai chemin complet a été testé :
`Author Transfer -> configuredSkills -> Combat Export -> Native Adapter -> Combat Runtime`.

Résultat :
- historique natif avant remplacement : 0 ;
- auteur / configuredSkills / export / natif : 1 ;
- Runtime : 1 vs 1 => mutual cancel.

Aucune règle gameplay n'a été modifiée.

## Correction UI

Le champ explique désormais :
`0 = hors système de clash : les projectiles se traversent. Minimum actif = 1.`

## TDD

Premier test de fixture invalide :
- commit `f12c78d342b3f8e899118a9f6bfa67c0902d8fab`
- CI `37676606620`
- l'échec venait uniquement du fixture CaptureDatabase.

Fixture corrigé :
- `4c23cd165b21a096e159c76158f10e3162392dc4`
- CI `37676741992` SUCCESS.

Clarté UI :
- `88505159d8bc942d5c9fd86e8f64396a50516d95`
- sentinelle `4382e5bde5d2e2bd1af427d94828c8d0ba3a3b50`
- CI `37677076374`
- 1244 / 1244 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_GOUTTE_PROJECTILE_POWER_REGRESSION_V1.md`

## Domaines protégés

Inchangés :
- donnée auteur Goutte vive ;
- Projectile Clash / Combat Rules ;
- Combat Runtime ;
- Animation / FX ;
- collision DOM ;
- Roster ;
- audio ;
- créatures ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action

Créer le checkpoint GREEN puis ouvrir séparément le lot UI :
**Landscape Toggle Removal V1** — supprimer l'encadré/toggle paysage devenu inutile, sans changer le mode paysage devenu norme.
