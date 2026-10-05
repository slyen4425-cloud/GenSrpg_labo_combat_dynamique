# Boule de feu 2 — HD assets V1

Date : 2026-10-05

## But

Publier un nouveau pack visuel Capture intitulé **Boule de feu 2**, séparé de l'ancienne Boule de feu, avec trois phases : cast, projectile et impact.

## Gouvernance

- Source runtime de bibliothèque : `global-assets`.
- Base assets exacte : `0217dca50ec4004d5ac3bb25d6f5998ccf9edc4f`.
- Checkpoint de sécurité : `checkpoint/lab-global-assets-before-fireball-2-hd-2026-10-05`.
- Branche de travail : `work/lab-global-assets-fireball-2-hd-2026-10-05`.
- Aucun changement de `main`.
- Aucun changement de `Zombicide-40k`.
- Aucun remplacement de l'ancienne Boule de feu.
- Aucun changement gameplay, timing autoritaire, collision, dégâts, énergie, cooldown ou trajectoire.

## Résultat physique

Chemin : `assets/library/capture/sprites/skills/fireball_2/`

- 12 frames cast PNG RGBA natives 512×512.
- 12 frames projectile PNG RGBA natives 512×512.
- 12 frames impact PNG RGBA natives 512×512.
- 36 frames individuelles au total.
- 3 atlas WebP horizontaux 6144×512, 12 frames chacun.
- `manifest.csv` et `sprite_skill_fireball_2_sequences_01.json` décrivent les séquences.

Le choix 512×512 est volontaire : il respecte le minimum HD demandé et garde un atlas horizontal de 6144 px, plus sûr pour smartphone qu'un atlas 12×1024 (12288 px). Un futur pipeline adaptatif pourra ajouter des masters 1024 sans changer les IDs ni le moteur.

## Catalogue

Trois IDs supplémentaires, sans collision :

- `pack:capture:sprite-fireball-2-cast-01` — Boule de feu 2 — cast
- `pack:capture:sprite-fireball-2-projectile-01` — Boule de feu 2 — projectile
- `pack:capture:sprite-fireball-2-impact-01` — Boule de feu 2 — impact

Compteurs catalogue après génération : 98 assets, 51 sprites.

## Validation technique

Workflow one-shot : run `37293482898` — SUCCESS.

Le workflow a vérifié :

- exactement 36 PNG ;
- exactement 3 atlas ;
- chaque frame = 512×512 RGBA avec transparence ;
- chaque atlas = 6144×512 ;
- aucune collision d'assetId ;
- les trois IDs Boule de feu 2 sont présents dans le catalogue.

HEAD généré avant ce rapport : `97c8a318fb54d87d38fd07f4025d4714126dbaaa`.

La CI complète doit être GREEN sur le HEAD documenté final avant avance de `global-assets`.
