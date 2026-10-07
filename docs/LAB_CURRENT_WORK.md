# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Fireball Author Correction V4

Branche :
`work/lab-fireball-author-correction-v4-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-fireball-author-correction-v4-2026-10-07`

Base :
`9f7bb7e0e10fab9d058d65808047ead24f5961dd`

## Résultat

La fiche Showcase `fireball` a été corrigée uniquement sur les valeurs explicitement signalées par l'utilisateur :

- socket cast : `mouth` ;
- socket travel : `mouth` ;
- cast `offsetX = 30` ;
- cast `offsetY = 0`.

Toutes les autres valeurs auteur de Fireball restent inchangées.

Le remplacement canonique reste possédé par le Transfer pipeline existant :
`import -> plan mode replace -> apply`.

Aucun moteur, Runtime, renderer, contrat gameplay ou autre preset n'a été modifié.

## TDD

RED :
- commit `000eb77040979da5634fc17d0a49acc896f2bee7` ;
- CI `37631531458` ;
- sentinelle V4 rouge sur `anchor: null !== mouth`.

Correction données :
- commit `255f36113bb57601d41f643cac2b52a8c7aef8df`.

Sentinelle historique alignée :
- commit `7d7c4f214da4c719f27fe54a8e3c404154aefe06`.

GREEN fonctionnel :
- CI `37631687787` ;
- 1221 / 1221 PASS ;
- 0 FAIL.

Rapport :
`docs/LAB_FIREBALL_AUTHOR_CORRECTION_V4.md`

## Prochaine action

Après CI finale sur le SHA documenté :
- créer `checkpoint/lab-fireball-author-correction-v4-green-2026-10-07` ;
- créer `preview/lab-fireball-author-correction-v4-2026-10-07` ;
- fournir le lien de test smartphone ;
- attendre la validation utilisateur avant GREEN utilisateur.

