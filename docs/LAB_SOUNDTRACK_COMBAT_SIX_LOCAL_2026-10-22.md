# Labo Combat — premières six musiques Battle, essai privé par import local (22 octobre 2026)

## Réception et classement des sources
Dans le dépôt **privé** `slyen4425-cloud/GenSrpG_audio_prive`, branche `main@26985093ff60942abea146d4903ba486f6290746` :
- `audio/musiques/combat/Battle_1.mp3` — blob `cb4ed87dd2cde23456f9987334a13d3ac9609b68`
- `Battle_2.mp3` — `f9fe0046d166c3434878b52433469fca467ec8f8`
- `Battle_3.mp3` — `4bac5c69d873fbf2b2acfa5525c5a5a28c9654e6`
- `Battle_4.mp3` — `26cfab69b1ba411ca7b2052c8896884157c67638`
- `Battle_5.mp3` — `63c05b82da73fce2d7df29fe87db15c8e087047c`
- `Battle_6.mp3` — `58ce63adc32e2db909a87848193a8108e4cd907a`
- `audio/musiques/exploration/Exploration_1.mp3` à `Exploration_4.mp3` : références disponibles dans la banque de métadonnées ; **aucun raccord de lecture Exploration dans ce lot**.

Ces fichiers privés ne sont ni copiés ni servis par le dépôt public. Cette distinction est impérative : un identifiant et un titre public ne donnent pas le droit de redistribuer le morceau. Provenance / licence de redistribution à clarifier avant tout éventuel hébergement musical public.

## Raccord effectif et propriétaires
- `src/assets/soundtrack-starter-catalog-v1.js` contient **seulement** dix identifiants logiques et un projet standard préconfiguré sur les six `Battle_*` en ordre séquentiel, répétition, volume 65 %, fondu 700 ms. `Exploration_*` n'est jamais ajouté au combat par défaut.
- `src/assets/soundtrack-local-media-v1.js` associe les noms précis `Battle_#.mp3` et `Exploration_#.mp3` à leurs `assetId`, par le fichier réellement choisi par l'utilisateur sur son appareil. Validation atomique des fichiers et des types, `URL.createObjectURL`, puis `URL.revokeObjectURL` au remplacement et au `pagehide`. Aucun token GitHub / fetch du privé / base64 / upload.
- `src/ui/soundtrack-editor-v1.js` accepte un catalogue et projet initiaux ; ses autres fonctions de configuration (par jeu, scènes, séquence/shuffle, volume, export/import JSON) restent propriétaires de l'auteur.
- L'onglet Musiques affiche une sélection multiple de MP3, et un indicateur `0 / 6` à `6 / 6`. Le lecteur n'utilise les médias que lorsqu'ils sont présents.
- Le vrai `examples/dom-demo/capture-editor-v2.js` ajoute les médias locaux au résolveur `assetId` existant. `createCombatSoundtrackPreviewBridgeV1` / `SoundtrackSessionV1` demeurent **les seuls propriétaires** du lecteur continu, démarré pour `capture:combat:normal` et stoppé au retour en éditeur. Les SFX de créatures et capacités sont inchangés.
- Aucun octet musical ni chemin de GitHub privé dans les exports de projets ; ils nécessitent toujours le rechargement local des MP3 lors d'une nouvelle session.

## Essai sur PC
1. Ouvrir [le labo Combat](https://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/examples/dom-demo/capture-editor-v2.html).
2. Aller dans l'onglet **Musiques** et choisir les six fichiers personnels `Battle_1.mp3` à `Battle_6.mp3` dans le champ de sélection multiple.
3. Vérifier **6 / 6** puis lancer un vrai combat par **Lancer combat**.
4. La musique standard suit la playlist ; en revenant à l'éditeur elle s'arrête. En cas de politique autoplay bloquante, le combat doit rester utilisable. Si besoin, le rechargement des MP3 est requis à la nouvelle session.

## Validation attendue
- `tests/unit/soundtrack-local-combat-six-2026-10-22.test.mjs` : catalogue exact, stockage sans URLs dans JSON, fichier invalide rejeté atomiquement, remplacement / révocation, lecture via vrai Bridge + moteur et arrêt sur dispose.
- `tests/browser/capture-creature-library-smoke.mjs` : vrai onglet, six entrées initiales, six `File` MP3 chargés depuis une interaction simulée dans Chromium, sauvegarde d'un autre jeu toujours indépendante.
- CI de la PR : cinq jobs attendus ; checkpoint GREEN seulement sur les cinq verts.
- À valider par le créateur : écoute perceptuelle, volume/fondus, compatibilité navigateur et Android.
- Hors lot : publier les binaires privés ; stockage persistant des sons personnels ; scène Exploration, victoire/défaite ou boss (requiert les véritables événements) ; modification des sons SFX ; ajout à GenSrpG principal.

Base `gh-pages@09ff772ab9a1ff22db5cc2b0ab945fd5d6566aa1`; START `checkpoint/lab-start-soundtrack-combat-six-local-v1-2026-10-22`; travail `work/lab-soundtrack-combat-six-local-v1-2026-10-22`.
