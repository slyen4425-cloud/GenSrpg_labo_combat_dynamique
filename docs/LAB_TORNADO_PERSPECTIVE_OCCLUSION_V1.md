# Tornade — perspective forte / calque départ-arrivée (2026-10-12)

## Origine / diagnostic

Source unique : fichier auteur reçu `gensrpg-capture-skill-cap_air_atk_4.json` avec ID `cap_air_atk_4`.
- Binding V11 original : `frameSpeedMultiplier:1.5`, `perspectiveAmount:0.5` (maximum), `displayScale:5`, `travel.layerByView.player/opponent:behind`.
- Le rendu utilisait **un seul z-index du projectile pendant tout le voyage** : derrière la créature du lanceur = aussi derrière la cible jusqu'au contact. `.skill-fx--layer-behind` positionne z=2, devant z=7 ; les combattants sont aux niveaux 3/4.
- L'ancien ratio de distance maximal était 0.5 (50%), insuffisant pour la Tornade très large, surtout lorsque le projectile reste en arrière de la cible. Le réglage V11 reste strict et inchangé pour les compétences existantes.
- Le fichier auteur porte `cast.opacity=0.007` et `impact.opacity=0.006` (~0.7% et 0.6%) : **ils sont volontairement conservés** par fidélité à l'auteur, bien qu'ils rendent la préparation et l'impact presque invisibles.

## Contrat additif V12

Dans `visual.travel` uniquement :
- `farScaleRatio`: 0.15..1, optionnel ; taille visuelle au fond de l'arène, prioritaire sur l'ancien facteur `perspectiveAmount` quand déclaré. `0.25` = seulement un quart du sprite proche. Joueur→ennemi réduit ; ennemi→joueur agrandit.
- `arrivalLayer`: `"front" | "behind"`, optionnel ; lorsque distinct de la couche du départ, le renderer adapte le `z-index` durant **l'unique** animation native de déplacement.
- Ces deux nouveaux réglages n'affectent ni le sprite des autres phases, ni Beam, ni Skyfall (rejet V12 sur Skyfall).
- V1..V11 ne sont pas modifiés. Sans options V12, le rendu et le `z-index` statique restent strictement ceux d'origine.

## Implémentation & ownership

Chemin réel : `Human Editor -> Capture Skill Draft / JSON transfer -> Skill Presentation Binding V12 -> Capture FX Asset Resolver -> DomSkillFxRenderer`.

- `Capture FX Asset Resolver` transmet le ratio visuel et le nouveau calque d'arrivée sans changer le point d'ancrage, l'asset ou la durée.
- `DomSkillFxRenderer` calcule les transforms sur la même trajectoire ; le passage devant s'effectue entre 37 et 38% du trajet, avec z=2 initial puis z=7 final pour la transition behind→front. Pas de nouveau timer ou callback périodique.
- Au cas où le Runtime constate un vrai contact au milieu de l'arène, le même callback canonical de collision continue à déterminer fin du déplacement et dégâts. Aucun changement au masque opaque, au socket, au point visé ni au CombatRuntime.
- Le Human Editor expose « Taille du projectile côté éloigné (ratio) » et « Projectile à l'arrivée » ; chargement, nouveau, sauvegarde, export/import V1 conservent ces paramètres.

## Compétence Tornade enregistrée

`data/capture/showcase/cap_air_atk_4.capture-skill-transfer-v1.json` est une copie du JSON utilisateur ; seules les propriétés `presentation.version:12`, `visual.travel.farScaleRatio:0.25`, `visual.travel.arrivalLayer:"front"` ont été ajoutées/modifiées. Elle est enregistrée une fois dans le seul catalogue showcase. Données strictement conservées : dégâts 45, élément Air, clash 3, préparation 3200ms, voyage 2500ms, cooldown 15000ms, frame speed 1.5, scale 5, cast/impact opacités et tous les asset IDs y compris audio.

Si la sauvegarde locale du navigateur conserve une ancienne version personnalisée de Tornade, importer la nouvelle capacité V12 explicitement avec remplacement par identifiant plutôt que supposer qu'une synchronisation du showcase écrase une capacité personnelle existante.

## Tests

- RED créé : `tests/unit/tornado-perspective-occlusion-v1.test.mjs`, contrat V12, refus des paramètres hors travel et plages invalides, véritable `SkillDraft->Binding->AssetProjection->FX renderer`, début/fin de scale, transition native z-index, rétrocompatibilité V11, import/export, champs éditeur, JSON Tornade et valeurs auteur.
- Deux tests anciens surveillant un catalogue à 17 entrées ont été recalés à 18 (nouvelle capacité sans retrait ni mutation des autres fixtures).
- CI code exact `599232f1fa17065082d86002b94b5845bd6b7e24` : run `38263241612` SUCCESS, Node 1576/1576 tests, Firestorm Chromium et Creature Library 103 Chromium SUCCESS.
- Validation smartphone Android paysage distincte ; pas de revendication de GREEN utilisateur sans observation manuelle.

## Gouvernance

Départ GREEN : `d971068ab23b66183517b40abf8452b68b308b06` ; checkpoint `checkpoint/lab-start-tornado-perspective-occlusion-v1-2026-10-12` ; branche `work/lab-tornado-perspective-occlusion-v1-2026-10-12`. Aucun changement à main, global-assets, GenSrpG ni Exploration.
