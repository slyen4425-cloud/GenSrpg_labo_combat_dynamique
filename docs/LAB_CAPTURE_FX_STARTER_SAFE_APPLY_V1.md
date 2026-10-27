# Capture FX Starter Safe Apply V1

Date : 2026-10-06

## Constat

Après utilisation de la liste de packs FX GenSrpG, la capacité `Cendre aveuglante` pouvait ne plus correspondre à sa configuration auteur.

La source vitrine `data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json` n'avait pourtant pas été modifiée depuis sa création le 3 octobre 2026. La régression provenait de l'application d'un Starter FX sur une capacité déjà configurée.

## Cause racine

Le bouton Starter FX appelait `applyCaptureFxStarterProfileV1` avec une présentation artificielle presque vide :

- socket courant ;
- `statusVisuals: {}`.

Le Starter Profile pouvait alors remplacer les champs médias déjà configurés :

- icône ;
- cast ;
- projectile ;
- impact ;
- zone ;
- certains réglages associés.

Si le brouillon était ensuite sauvegardé, cette version remplaçait la présentation auteur dans la bibliothèque active de la session.

## Correctif

### 1. Règle non destructive

`applyCaptureFxStarterProfileV1` conserve maintenant les médias déjà renseignés.

Pour chaque slot auteur existant :

- icône ;
- cast ;
- travel/projectile ;
- impact ;
- zone ;

le Starter FX ne remplace ni l'asset ni les paramètres associés.

Les sons auteur déjà renseignés restent également prioritaires.

Les éléments suivants sont toujours conservés :

- `socketId` ;
- `statusVisuals` ;
- champs de présentation futurs inconnus du Starter Profile.

Les couches d'enrichissement FX peuvent toujours être appliquées :

- glow ;
- cast burst ;
- projectile trail ;
- impact burst ;
- flash ;
- shake ;
- aftermath smoke.

### 2. Capacité neuve

Si un slot média est vide, le pack peut toujours fournir la base vitrine correspondante.

Ainsi le même système reste utile pour une nouvelle capacité sans devenir destructif sur une capacité existante.

### 3. État réel de l'éditeur

Le bouton ne construit plus une présentation fictive.

Il utilise maintenant :

`readSkillFields(root).presentation`

avant d'appeler le Starter Profile.

Les sprites, sons, sockets et status visuals réellement visibles dans l'éditeur deviennent donc la source préservée.

### 4. UX

Le bloc est désormais présenté comme :

`Mode simple — Pack FX GenSrpG`

Le texte précise explicitement qu'un pack :

- conserve les sprites, sons, sockets et visuels de statut existants ;
- ajoute les enrichissements FX ;
- peut remplir les médias seulement sur une capacité neuve et vide.

## Cendre aveuglante

Une sentinelle dédiée utilise la configuration exportée le 3 octobre :

- icône : `core:icon-skill-poison-cloud-01` ;
- cast : `pack:capture:sprite-cast-physical-01`, scale 1 ;
- projectile : `pack:capture:sprite-projectile-earth-01`, scale 2.5 ;
- impact : `pack:capture:sprite-impact-nature-01`, scale 2 ;
- status visual `cap_fire_special_1:1` : `pack:capture:sprite-teleportation-2`, scale 3, opacity 0.85.

Le test impose que l'application du pack Boule de feu conserve ces valeurs et ajoute seulement l'enrichissement FX.

## Tests

RED :
- commit `86ce88a3e74030ee3ef26fd9651fa6690f8496df` ;
- CI `37386306779` ;
- échec attendu : icône Cendre remplacée par l'icône Fireball.

GREEN :
- HEAD fonctionnel `3f698bc415cff5b38e0fc9f43ac8131d16043a1a` ;
- CI `37386675219` ;
- **1091 tests / 1091 PASS / 0 FAIL**.

## Checkpoints

Avant correctif :
`checkpoint/lab-before-starter-safe-apply-cendre-v1-2026-10-06`

GREEN technique :
`checkpoint/lab-capture-fx-starter-safe-apply-v1-technical-2026-10-06`

Preview :
`preview/lab-capture-fx-starter-safe-apply-v1-2026-10-06`

## Invariants

Aucun changement dans :

- Combat Runtime ;
- Session ;
- dégâts ;
- collision ;
- règles de capacité.

Ce lot corrige uniquement l'ownership de la présentation dans l'éditeur et l'application des packs FX.
