# Rayon lié source → cible et configuration groupée — V1
Date : 2026-10-08

## Problème utilisateur et cause vérifiée

Choisir « Style : Rayon » activait le plan FX beam, mais le `DomSkillFxRenderer` n'affichait qu'un corps étiré. Le sprite `beam_start` était catalogué mais aucun slot contractuel ne le portait, et la représentation `impact` n'était lancée qu'à l'arrivée. Les trois parties n'étaient ni réunies géométriquement ni synchronisées, et l'éditeur demandait de nombreuses sélections indépendantes.

## Base / isolation

- Base GitHub Pages déployée : `01e44318a2337f4bffddc29cc712ad6f560dd1fc`.
- Checkpoint départ : `checkpoint/lab-start-beam-linked-fx-ui-v1-2026-10-08`.
- Branche : `work/lab-beam-linked-fx-ui-v1-2026-10-08`.
- Source média : branche autoritaire `global-assets`, commit `74ac3314f2d20eeadad77b439d5f229f5dacee3e`.
- 0 image/son créé ou remplacé. Les 4 IDs existants dans `assets/library/capture/sprites/skills/pressurized_jet/` restent : `pack:capture:sprite-pressurized-jet-cast-01`, `pack:capture:sprite-pressurized-jet-beam-start-01`, `pack:capture:sprite-pressurized-jet-beam-body-01` et `pack:capture:sprite-pressurized-jet-impact-01` (atlases WebP).

## Architecture et comportement

1. `SkillPresentationBinding.visual.beamStart` devient un slot **optionnel**, rétrocompatible, normalisé par les contrats existants ; `CaptureSkillPresentationAssetsV2` résout l'asset et le calque, sans créer de deuxième registre.
2. Pendant l'événement `beam`, `DomSkillFxRenderer` crée un **seul record FX** et trois sous-sprites : `beamStart` (source), `travel` (corps entre source et cible) et `impact` (embout cible pendant le rayon). Les trois utilisent la durée de l'événement ; les sprites des embouts bouclent seulement pendant cette durée. L'impact gameplay existant reste émis au contact autoritaire et rejoue son animation réelle.
3. L'origine s'appuie sur `travelSourceAnchor` (par exemple « bouche »), et la destination sur `projectileTargetRect`. Le même scheduler de frame déjà fourni au renderer recalcule angle / largeur tant que le beam est actif ; cleanup annule la frame et les animations dans le même owner. Aucun timer de combat supplémentaire.
4. L'ancien cas beam avec **seul `travel`** reste valide. Les projectiles et les zones conservent leur ancien chemin.

## Ergonomie de l'éditeur

- Onglet **Capacités → 7 — Effets visuels** : nouveau bouton « Configurer le rayon Jet pressurisé ».
- Le bouton n'est activable que lorsque les 4 médias de la bibliothèque sont présents. Une seule action renseigne Style=Rayon, cast animé à la sortie sans décalage, départ du rayon, corps du rayon en boucle, impact cible.
- Les paramètres de dégâts, pénétration, énergie, cooldown et sons ne sont **pas modifiés**. Les réglages avancés restent disponibles, notamment le nouveau champ « Départ du rayon (lié au lanceur) ».
- Le choix du pack ne modifie que les champs courants de l'éditeur ; l'utilisateur doit ensuite cliquer sur **« Mettre à jour la capacité existante »**. Aucune mutation silencieuse du JSON Showcase auteur `cap_water_atk_3` (qui reste tel qu'importé, `form=projectile`) et aucune conversion implicite d'autres skills.
- Autorité du pack UX : `src/ui/capture-editor-beam-visual-pack-v1.js`, présentation et non gameplay.

## Vérification prévue / limites

- TDD RED : CI `37809073531`, le slot de départ n'était pas reconnu.
- Premières GREEN : CI `37809477964` (nouveau moteur + UI) puis `37809784765` (tests moteur/source/cible et roundtrip).
- Sentinelle `tests/unit/pressurized-jet-preview-routing-v1.test.mjs` : vrai binding V9, trois parties sous le même nœud.
- `tests/unit/capture-linked-beam-authoring-v1.test.mjs` : pack UI, roundtrip de l'auteur en restant isolé, moteur réalisant un rayon vivant, extrémités ancrées et déplacement de cible, cleanup complet.
- Browser smoke `tests/browser/capture-creature-library-smoke.mjs` : contrôles UI et les 103 créatures, dont leur repli en cas de panne du CDN.
- Dernière CI/documentation et publication Pages à confirmer avant GREEN technique final.
- **Test visuel Android toujours nécessaire** : raccord esthétique des transparences aux jonctions et comportement pendant déplacement réel ; les tests structurels ne prouvent pas seuls une continuité parfaite pixel par pixel.

## Protections

`main`, le dépôt `Zombicide-40k`, Exploration, `global-assets`, les 103 créatures et les compétences existantes restent intacts ; aucun second moteur FX, pas de nouvelle autorité sur timing/dégâts. Rollback sur `01e44318a2337f4bffddc29cc712ad6f560dd1fc`.
