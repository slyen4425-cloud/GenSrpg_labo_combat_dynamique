# Maraileron Author Export V1

Date : 2026-10-07

## Base

Checkpoint de départ :
`checkpoint/lab-start-maraileron-author-export-v1-2026-10-07`

Base exacte :
`539d7b82a11e9df83de2af65bdecdef0eeb81ac2`

Branche :
`work/lab-maraileron-author-export-v1-2026-10-07`

## Sources auteur

Fichiers fournis par Sylvain :
- `gensrpg-capture-skill-cap_water_atk_2.json`
- `gensrpg-capture-creature-crea_maraileron.json`

Copies canoniques dans le dépôt :
- `data/capture/showcase/cap_water_atk_2.capture-skill-transfer-v1.json`
- `data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json`

Vérification : le texte des deux fichiers déposés dans GitHub est strictement identique aux exports utilisateur lus dans la conversation.

Blob SHA :
- Morsure de marée : `eff5f7867383788db3a93a9ab59b8a53c450d58a`
- Maraileron : `8f9d2899e95378525f0ace5c8dc0412c18e33a8b`

## Procédure §33

Aucune reconstruction manuelle.

Chemin utilisé par le Human Editor :
`importCaptureTransferJsonV1`
→ `planCaptureTransferImportV1(... mode:"replace")`
→ `applyCaptureTransferPlanToEditorStateV1`

Les presets Showcase sont hydratés par les owners existants ; les capacités sont appliquées avant les créatures afin que les références du loadout soient résolues.

## Données protégées

### Morsure de marée

ID stable : `cap_water_atk_2`.

L'export auteur conserve notamment :
- niveau requis 5 ;
- forme contact ;
- élément eau ;
- `approachMode: "burrow"` ;
- énergie 5 ;
- préparation 2000 ms ;
- trajet 650 ms ;
- récupération 300 ms ;
- cooldown 20000 ms ;
- dégâts Eau 20 ;
- drain d'énergie 3 ;
- présence cible surface + underground ;
- dodgeable ;
- Presentation V9 ;
- icône et impact auteur.

### Maraileron

ID stable : `crea_maraileron`.

L'export auteur conserve notamment :
- niveau 16 ;
- profil `serpentine` ;
- PV 140 ;
- speed 15 ;
- defense 5 ;
- water 15 ;
- résistance feu +35 ;
- résistance eau +35 ;
- faiblesse électrique -50 ;
- tempo d'approche -20 % ;
- scales global / joueur / adversaire ;
- sockets face/dos exacts ;
- références d'assets exactes ;
- loadout auteur exact, avec `cap_water_atk_2` en slot-2.

## TDD

RED :
- commit `39ddc04153f8ef6d0ae440c6ca5ebc36b0e29d7e`
- CI `37663672396`
- 1230 tests
- 1226 PASS
- 4 FAIL ciblés

GREEN fonctionnel :
- commit `4f85547073512aefc3610a70b03418edb36737d5`
- CI `37664111065`
- 1230 / 1230 PASS
- 0 FAIL
- structure / frontières / indépendance : OK

## Fichiers fonctionnels

Ajoutés :
- `data/capture/showcase/cap_water_atk_2.capture-skill-transfer-v1.json`
- `data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json`
- `tests/unit/maraileron-author-export-v1.test.mjs`

Modifiés :
- `src/catalogs/capture-showcase-skill-presets-v1.js`
- `src/catalogs/capture-showcase-creature-presets-v1.js`
- `tests/unit/capture-showcase-creature-presets-v1.test.mjs`

## Owners

Inchangés :
- capacité active : `configuredSkills` ;
- créature active : `configuredCreatures` ;
- remplacement : Capture Transfer owner ;
- Human Editor : projection / hydratation seulement.

## Domaines protégés

Aucun changement de :
- Combat Runtime / Session ;
- Animation Core ;
- FX Core ;
- renderer ;
- collisions ;
- Dodge ;
- zones persistantes ;
- roster ;
- audio ;
- `main` ;
- `Zombicide-40k` ;
- dépôt Exploration.

## Suite

Micro-lot séparé :
`Burrow Visual V1`.

Le gameplay souterrain déjà GREEN reste inchangé. Le nouveau lot doit uniquement projeter visuellement :
- descente dans le sol ;
- disparition pendant le trajet souterrain ;
- repositionnement invisible sous la cible ;
- émergence rapide depuis le bas ;
- impact calé sur l'horloge Runtime existante ;
- retour normal.

Aucun contact DOM/collision ne doit devenir autoritaire pour `burrow`.
