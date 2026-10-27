# Attaque souterraine — 3 sprites de terrain (24 octobre 2026)

## Objectif
Raccorder les trois packs validés et déposés par l'auteur, chacun 20 frames RGBA 512×512, aux trois phases d'attaque souterraine dans Capture. Les effets remplacent les ovales / dégradés CSS à l'écran.

## Réception et intégrité
Les archives ATTAQUE_SOUTERRAINE_FX_01_DEPART_20F.zip, _02_TRAJET_20F.zip, _03_IMPACT_20F.zip ont été déposées sur work/lab-burrow-ground-fx-v2-2026-10-24/_incoming. Un importeur GitHub Actions dédié a validé les trois SHA256, les 60 vrais PNG avec canal alpha et construit 3 atlas WebP lossless 7680×384. Source commit de médias : 5834d103198e6a420207232baac5740223385135. Le présent lot transfère exactement les 64 blobs physiques dans la version du labo basée sur gh-pages@3e362dc13d7ea520cd82f3232505bc269685298a.

## Autorités et périmètre
- `src/contracts/skill-presentation-binding-v13.js` ajoute UNIQUEMENT la présentation de trois phases `visual.burrowTerrain.start/travel/impact`. Ce contrat conserve le `baseVersion` 2..12 et délègue l'ancien schéma au normaliseur existant; aucune définition de capacité et aucun Combat Runtime modifié.
- `src/ui/capture-burrow-stage-fields-v1.js` projette et sauvegarde les choix d'atlas, la taille, les offsets X/Y, la cadence ms/frame.
- `src/ui/capture-editor-human-v2.js` branche lecture/écriture, `examples/dom-demo/capture-editor-v2.html` expose la section contextuelle uniquement quand approche = burrow.
- `src/assets/burrow-terrain-builtins-v1.js` est l'unique table des 3 assets natifs. `src/adapters/renderer/capture-skill-presentation-assets-v2.js` résout les réglages depuis les présentations enregistrées.
- `src/adapters/renderer/combat-resolution-presenter.js` passe le résultat de la compétence active aux visuels; `src/ui/demo-app.js` l'applique dans le cadre du même `travelMs`; `src/adapters/renderer/dom-burrow-terrain-fx-v2.js` affiche les 3 séquences WebP et nettoie ses handles à l'interruption.
- Les capacités anciennes sans V13 utilisent les trois sprites natifs par défaut. Une option « Aucun » permet de masquer individuellement un stade sur les capacités enregistrées en V13.
- Les sprites n'ont aucun contact watcher : les dégâts, l'esquive, le temps d'impact et la présence `underground` restent gérés par l'autorité actuelle.

## Checkpoints et validation
- Source de publication initiale : gh-pages@3e362dc13d7ea520cd82f3232505bc269685298a
- Travail : work/lab-burrow-stage-selectors-v1-2026-10-24
- Préservation : les autres branches et GenSrpG main ne sont pas modifiées.
- Tests : 60 PNG et 3 WebP réels, contrat V13 aller-retour, lecture des 3 animations, annulation, tests Foundation et quatre suites Chromium en GitHub Actions.
- GREEN technique dépend du run final et du déploiement Pages; rendu sur téléphone encore à valider avec l'auteur.
