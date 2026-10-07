# Point de reprise courant — 2026-10-07

## Lot actif

Fireball Cast Side Placement V1

Branche :
`work/lab-fireball-cast-side-placement-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-fireball-cast-side-placement-v1-2026-10-07`

Base exacte :
`1bb89aecce8ed4e5848d2ccb98cbd72c423aeb67`

Base GREEN précédente :
`checkpoint/lab-projectile-power-values-v1-green-2026-10-07`

## Retour utilisateur

Boule de feu :
- l'auteur attend un cast horizontal à `-30` côté joueur ;
- côté opposant, le cast reste visuellement au centre / n'utilise pas le placement opposé attendu.

## Diagnostic

La chaîne runtime sait déjà résoudre la vue sémantique du lanceur.

Le défaut est dans la donnée auteur actuelle :
- présentation Boule de feu encore en `SkillPresentationBinding V8` ;
- `visual.cast.offsetX = 30` ;
- V8 ne possède pas `offsetMode`.

Le support side-aware existe déjà en V9 :
- `mirror_x` conserve l'offset joueur comme référence ;
- côté opposant, X est inversé automatiquement.

## Correction cible

Faire évoluer uniquement la présentation Boule de feu en V9 :
- `visual.cast.offsetX = -30`
- `visual.cast.offsetY = 0`
- `visual.cast.offsetMode = "mirror_x"`

Résultat attendu :
- joueur : `-30`
- opposant : `+30`

Les autres slots visuels V9 garderont explicitement `offsetMode: "same"` pour conserver leur comportement actuel.

## Périmètre autorisé

- `data/capture/showcase/fireball.capture-skill-transfer-v1.json`
- sentinelles Fireball auteur
- test dédié de résolution player/opponent
- documentation

## Domaines protégés

Ne pas modifier :
- moteur side-aware V9 ;
- Combat Runtime / Rules ;
- collision ;
- puissance projectile 2 ;
- dégâts ;
- éléments ;
- énergie ;
- timings ;
- FX assets / audio ;
- autres compétences ;
- créatures ;
- esquive (chantier interrompu/différé) ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD

1. RED : Fireball doit être V9, cast joueur -30, mirror_x ;
2. RED : resolver doit produire joueur -30 / opposant +30 ;
3. modifier uniquement le binding auteur nécessaire ;
4. préserver les autres valeurs auteur ;
5. CI complète ;
6. checkpoint/preview GREEN.

## Critère de fin

Boule de feu utilise le même owner V9 side-aware déjà existant, sans règle spécifique Fireball dans le renderer.
