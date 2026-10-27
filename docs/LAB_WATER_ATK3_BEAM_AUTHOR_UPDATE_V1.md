# Jet pressurisé — remplacement de l'export auteur Beam V1

Date : 2026-10-08.

## Source et périmètre

Demande : intégrer l'export éditeur utilisateur `gensrpg-capture-skill-cap_water_atk_3(1).json`, au format `capture-skill-transfer-v1`, dans la vitrine du laboratoire dynamique de combat.

Base GitHub Pages techniquement GREEN : `de8afdce8a3944ecf19e52176b5dfa8e86c756d0`.

Checkpoint départ : `checkpoint/lab-start-water-atk3-beam-author-update-v1-2026-10-08`.

Branche : `work/lab-water-atk3-beam-author-update-v1-2026-10-08`.

## Contrat auteur conservé

- ID unique : `cap_water_atk_3`, nom `Jet pressurisé`, niveau requis 10.
- Forme : `beam`, collision de projectile `power: 0`.
- Coût : 6 énergie ; préparation 2500 ms ; trajet 900 ms ; récupération 300 ms ; cooldown 30000 ms.
- Effets : 25 dégâts Eau, pénétration des résistances à 100 % et réduction des dégâts ignorée à 100 %.
- Départ Beam : `pack:capture:sprite-pressurized-jet-beam-start-01`, socket bouche, scale 1.2, déclencheur `travel-start`, loop.
- Corps : `pack:capture:sprite-pressurized-jet-beam-body-01`, scale 0.7, stretch.
- Impact : `pack:capture:sprite-impact-water-01`, scale 1.3, 500 ms.
- Audio trajet : `gensrpg:sound:xel-48520d94`, volume 1, loop.
- Audio impact : `gensrpg:sound:sanctuary-17b7fa2c`, volume 1, non-loop.
- Pas de champ `cast` ajouté : l'export auteur possède un `beamStart` et aucun `cast`.
- Les autres champs restent strictement ceux de l'export.

**Empreinte canonique SHA-256** de `JSON.stringify` du JSON source auteur et du nouveau fichier Showcase : `d17d57096c9e694023fca2727ff24f35bb9abb05421954a34c83d7727be1b6df`. La sentinelle permanente verrouille cette valeur pour éviter les réécritures de preset.

## Autorité, raccord et ressources

Fichier auteur possédé par le catalogue Showcase existant :
`data/capture/showcase/cap_water_atk_3.capture-skill-transfer-v1.json`.

L'éditeur hydrate déjà ce chemin avec `importCaptureTransferJsonV1` et `applyCaptureTransferBatchToEditorStateV1` (`mode: "replace"`) dans l'unique propriétaire `configuredSkills`.

Le fichier est déjà listé **une seule fois** dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`. Le registre de capacités, les créatures et les loadouts ne sont pas modifiés. Maraileron conserve la référence `cap_water_atk_3` dans `slot-3`.

Les deux sprites de rayon sont exposés par la bibliothèque visuelle globale existante ; le sprite d'impact est résolu dans les assets démo, et les deux références audio sont présentes dans le catalogue privé + runtime audio existant. Aucune copie média ni nouvelle dépendance GenSrpG.

## TDD et non-régression

- RED `37838171203` : nouvelle sentinelle Beam échoue sur l'ancien preset `projectile`.
- Remplacement autorisé du preset existant (aucune nouvelle capacité).
- CI intermédiaires RED `37838220805` / `37838237222` : sentinelles historiques immuables basées sur l'ancienne version Projectile (`form`, sprites et SHA) identifiées ; assertions réalignées avec l'export utilisateur autorisé, sans désactiver de test.
- Tests auteur : empreinte sémantique SHA256, import/export, valeurs audio/visuels/effets, ressources référencées, record unique `configuredSkills`, rechargement du catalogue et conservation du loadout.
- Test Combat existant : 25 dégâts Eau malgré 40 % résistance Eau et 20 % défense, énergie consommée 6.
- CI fondation complète et vrai Chromium exigés avant GREEN technique ; URL de l'exécution retenue indiquée en clôture dans `LAB_CURRENT_WORK.md`.
- Validation utilisateur Android et rendu esthétique du Beam séparés du GREEN technique.

## Frontières

Inchangés : `main`, `global-assets`, `Zombicide-40k`, laboratoire Exploration, autres capacités, roster de 103 créatures, loadouts, moteurs de combat/FX/audio, assets médias. Pas de nouvelle autorité ou de comportement codé par nom de compétence.
