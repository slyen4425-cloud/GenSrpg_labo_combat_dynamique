# GenSrpG / Labo Combat — Éditeur de bandes-son v1

Date : 21 octobre 2026. Base : `gh-pages@bcc504b1362780f7f5737b4861f572c95553c623` GREEN architecture audio A. Checkpoint de départ `checkpoint/lab-start-soundtrack-authoring-v1-2026-10-21`, branche isolée `work/lab-soundtrack-authoring-v1-2026-10-21`.

## Placement dans l'interface
L'onglet `Musiques` de `examples/dom-demo/capture-editor-v2.html` est une vue indépendante de `Créature`, `Combat` et `Capacités`. Le contrôleur `src/ui/soundtrack-editor-v1.js` est monté explicitement depuis `capture-editor-v2.js`. Le routage existant `setTab` reste seul propriétaire de l'affichage des onglets.

## Propriétaires et configurations
L'unique contrat est `SoundtrackCatalogV1` + `SoundtrackProjectV1`, définis dans `src/contracts/soundtrack-project-v1.js`.
- Catalogue abstrait des `assetId` et origines `app|user|project`, lisibles dans les canaux `music` et `ambience`. Les SFX sont exclus de la sélection musique et conservés dans leurs systèmes actuels.
- Identifiant de jeu requis, puis `sceneId` libre (suggestions de jeu : combat normal, boss, victoire, défaite). Le même fichier est réutilisable par plusieurs jeux mais ses paramètres sont distincts.
- Sur chaque canal : liste ordonnée de pistes, changement d'ordre, suppression, `sequence/shuffle`, `repeat`, volume 0–100 %, fondu 0–10 s.
- Enregistrement explicite dans le modèle de travail `SoundtrackProjectV1` sans fichier média ; export JSON téléchargeable et réimport après chargement de son catalogue référencé.
- Le bouton « Nouveau jeu » crée un `projectId` indépendant. Pas de `localStorage`, pas d'envoi réseau, pas de stockage de pistes utilisateur.
- Une scène sans pistes est silencieuse.

## Pourquoi les pistes sont absentes pour l'instant
Le créateur fournira ensuite des musiques de vitrine. Le dépôt privé `GenSrpG_audio_prive` sert d'archive protégée ; ni identifiants privés ni fichiers physiques ne sont chargés par cette interface. L'import actuel accepte seulement **un catalogue de métadonnées JSON** et **une configuration de projet JSON**, pas les binaires audio.

## Interfaces futures, hors lot
- Associer `sceneId` au vrai début/fin de combat et à la victoire/défaite ; ce n'est pas encore relié au runtime.
- Raccorder les scènes/biomes dans Exploration via `ExplorationSoundtrackIntentV1` ; ne jamais coupler directement le moteur Exploration au dépôt Combat.
- Ajouter les médias de vitrine autorisés, leur provenance/licence et le résolveur d'assets dans un lot distinct ; test sonore Pixel obligatoire.
- Éventuels menus du Shell GenSrpG : hors périmètre.

## Tests et limites
- Tests Node : isolation par jeu, même asset réutilisable, pistes triées, silence, catégories, roundtrip JSON, champs UI.
- Test vrai Chromium dans le runner existant : onglet visible, changement de projet, enregistrement d'une scène silencieuse ; aucune modification des autres sondes.
- CI cinq jobs et revues des chemins modifiés obligatoires avant checkpoint GREEN technique. Le créateur valide l'ergonomie sur smartphone séparément.
