# Jet pressurisé — Beam V1

Date : 2026-10-08

## Statut

GREEN technique candidat, avant CI documentaire finale et checkpoint exact.

Base de travail :
`8f8d2f66104220054f939c9500e36e2653206e37`
(`checkpoint/lab-water-skills-author-updates-v1-green-2026-10-08`).

Branche :
`work/lab-pressurized-jet-beam-v1-from-water-green-2026-10-08`.

## Objectif

Ajouter un vrai trajet visuel de type rayon continu pour les compétences dont
`SkillDefinition.form === "beam"`, sans les transformer en projectile mobile et
sans créer une seconde autorité de timing ou de résolution.

Le pack artistique associé est « Jet pressurisé ».

## Propriétaires

- `SkillDefinition.form` : sémantique de la compétence ;
- `SkillFxPlan` : planification des FX depuis les événements sémantiques ;
- `DomSkillFxRenderer` : géométrie et rendu du rayon ;
- `SkillPresentationBinding.visual.travel` : asset du corps du rayon ;
- `global-assets` : catalogue et médias visuels.

Aucune branche de code ne dépend de l'identifiant ou du nom « Jet pressurisé ».

## Pack assets

Checkpoint assets :
`checkpoint/global-assets-pressurized-jet-vfx-v1-green-2026-10-08`.

SHA assets exact :
`74ac3314f2d20eeadad77b439d5f229f5dacee3e`.

Source :
4 planches générées dans ChatGPT et validées pour ce lot, transférées sous forme
WebP Q90 avec alpha et SHA contrôlés.

Archive source :
`dd2393ebb156b2a537cccb42ada6828af290b4b6711dcbc1c92b6e245605d300`.

Médias finaux :
- 20 PNG RGBA 512×512 de charge/cast ;
- 12 PNG RGBA 512×512 de départ du rayon ;
- 12 PNG RGBA 512×512 de corps du rayon ;
- 12 PNG RGBA 512×512 d'impact ;
- 4 atlas WebP horizontaux avec alpha ;
- 4 sources WebP conservées pour traçabilité.

Soit 56 frames PNG + 4 atlas runtime + 4 sources de traçabilité.

Chemin canonique :
`assets/library/capture/sprites/skills/pressurized_jet/`.

IDs :
- `pack:capture:sprite-pressurized-jet-cast-01` ;
- `pack:capture:sprite-pressurized-jet-beam-start-01` ;
- `pack:capture:sprite-pressurized-jet-beam-body-01` ;
- `pack:capture:sprite-pressurized-jet-impact-01`.

Le contenu réel du corps du rayon a été inspecté après découpe : flux d'eau
horizontal animé, alpha réel, absence de placeholder. Les SHA source, dimensions,
manifest, séquences et atlas sont également contrôlés par le builder et la CI.

## Raccord runtime

`GLOBAL_VISUAL_LIBRARY.revision` :
`2026-10-08-v19-pressurized-jet-vfx-v1`.

Le trajet `beam` :
1. part du vrai point source ;
2. cible le vrai point de destination ;
3. calcule distance et angle ;
4. dimensionne un seul visuel continu entre les deux points ;
5. anime le sprite du corps sans déplacer le nœud comme un projectile ;
6. utilise le même owner FX pour annulation/dispose.

`cast`, `travel` et `impact` restent les slots canoniques du contrat de
présentation actuel.

Le sprite `beam_start` est catalogué comme asset distinct et disponible à
l'authoring. Il n'est pas auto-injecté par un nouveau slot caché : ajouter un
second slot de départ demanderait une évolution explicite du contrat de
présentation dans un lot séparé.

## Non-régressions

La branche a été reprise au-dessus du dernier GREEN eau après comparaison des
fichiers. Les exports auteur Goutte vive / Morsure de marée sont conservés.

CI `37792303017` :
- structure / frontières : OK ;
- 1279 / 1279 tests Node PASS ;
- 0 FAIL ;
- smoke Chromium Creature Library : SUCCESS ;
- 103 créatures protégées par la sentinelle navigateur.

Le premier changement de révision globale
`5ad0e813fedecac38cb426f7ee278388602e63c3` a exposé une régression de tests
historiques liée à des sentinelles de cache/asset supprimées par la base récente.
Les sentinelles Capture icons et cache dynamique ont été restaurées, sans
modifier le runtime, puis la CI est redevenue verte.

## Domaines inchangés

- dégâts ;
- énergie ;
- cooldowns ;
- résistances / pénétration ;
- collisions projectile ;
- Dodge ;
- statuts ;
- 103 créatures configurées ;
- exports auteur eau ;
- `main` ;
- `gh-pages` ;
- `Zombicide-40k` ;
- Exploration.

## Limite de validation

Le lot est GREEN technique après CI finale + checkpoint exact.
Le rendu réel sur smartphone reste une validation utilisateur distincte avant
GREEN produit.
