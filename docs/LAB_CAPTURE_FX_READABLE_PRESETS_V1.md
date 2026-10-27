# Capture FX Readable Presets V1

Date : 2026-10-05

## Objectif

Rendre le réglage du glow compréhensible sans demander au créateur de connaître la signification de valeurs comme `0.8` ou `22 px`.

Le mode simple expose désormais quatre niveaux :

- Discret ;
- Visible ;
- Intense ;
- Très intense.

Les valeurs numériques restent disponibles dans les réglages experts.

## Architecture

Le preset lisible est uniquement une traduction UI vers les champs déjà existants du `SkillPresentationBinding V4`.

Il ne crée :

- aucun nouveau moteur FX ;
- aucune règle gameplay ;
- aucun stockage parallèle ;
- aucune seconde autorité de rendu.

Le preset modifie seulement :

- `fxGlowStrength` ;
- `fxGlowRadiusPx`.

La couleur du glow, le flash d'impact, le shake et les autres réglages restent inchangés.

## Valeurs

| Niveau | Intensité | Rayon |
| --- | ---: | ---: |
| Discret | 0.35 | 12 px |
| Visible | 0.65 | 22 px |
| Intense | 0.85 | 32 px |
| Très intense | 1.00 | 48 px |

Ces valeurs ne sont pas exposées dans le mode simple.

## UX

Le mode simple affiche :

`Présence du glow : Discret / Visible / Intense / Très intense`

Une description en langage courant accompagne le choix.

Si l'utilisateur modifie manuellement l'intensité ou le rayon dans les réglages experts, le mode simple affiche automatiquement :

`Personnalisé`

Aucun réglage avancé n'est perdu.

## Starter Profiles

Les profils vitrine ont été alignés sur les niveaux lisibles :

- Boule de feu : Intense ;
- Projectile d'eau : Visible ;
- Projectile électrique : Très intense ;
- Épine naturelle : Visible ;
- Griffe physique : Discret ;
- Zone de flammes : Intense ;
- Aura de soins : Visible ;
- Bouclier d'énergie : Visible.

Cela augmente notamment le rayon du glow de Boule de feu de 20 à 32 px et rend le glow électrique volontairement très visible.

## Tests

RED :

- commit : `5e4c86f4b7f704df8a65123e01b309f0b4787799` ;
- CI : `37360158435` — FAILURE attendue avant implémentation.

GREEN :

- commit : `12e0c244c5ab4cdf50f3c67b9b94c5165713532f` ;
- CI : `37360533617` — SUCCESS ;
- **1059 tests / 1059 PASS / 0 FAIL**.

Gardes :

- quatre niveaux ordonnés par visibilité ;
- application non mutante ;
- couleur du glow préservée ;
- flash et shake non modifiés ;
- détection exacte des presets ;
- valeurs avancées non standard -> Personnalisé ;
- profils vitrine alignés sur un niveau lisible ;
- marqueurs UI présents.

## Hors périmètre

Les particules, trails, braises, fumée et étincelles restent le lot suivant et devront réutiliser le même renderer FX.
