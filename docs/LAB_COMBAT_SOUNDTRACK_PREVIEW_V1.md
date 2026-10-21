# Labo Combat — Raccord de la musique à la prévisualisation v1

Date : 21 octobre 2026. Base : `gh-pages@ce4ddd47389ab1c5fa16f12b4cc3b52bcdcd39ce` (éditeur musical UI B GREEN technique). Checkpoint de départ : `checkpoint/lab-start-soundtrack-preview-runtime-v1-2026-10-21`. Branche : `work/lab-soundtrack-preview-runtime-v1-2026-10-21`.

## Prévisualisation — propriété de la lecture
`createCombatSoundtrackPreviewBridgeV1` est un adaptateur du gestionnaire unique `SoundtrackSessionV1`. Il reçoit le `SoundtrackProjectV1` et le `SoundtrackCatalogV1` produits par l'onglet Musiques et un résolveur d'assets autorisés. Il ne crée aucune deuxième horloge ou registre musique.
Le vrai `capture-editor-v2.js` :
1. Lit en mode lecture seule `soundtrackEditor.snapshot()/catalog()` au montage de la preview Combat.
2. Démarre le contexte `capture:combat:normal` si une scène et des médias utilisables existent.
3. En l'absence de scène/pistes ou si un fichier n'est pas disponible, reste silencieux sans bloquer le combat.
4. À la fermeture de la preview ou navigation, libère toutes les voix et timers musique/ambiance via `dispose` du bridge. Le `DomCombatAudio` existant reste propriétaire de tous les sons de capacités et créatures.

## Transitions de scène possibles
Le bridge accepte `transitionTo(sceneId)`. Un futur raccord aux véritables événements de boss, victoire et défaite pourra l'utiliser, **sans inventer** de résultat ni écouter le DOM global. Ce lot ne simule pas un événement de victoire. Les transitions graduelles et playlists sont exclusivement dans SoundtrackSession.

## Ressources
- Toujours aucune musique de vitrine intégrée. `GenSrpG_audio_prive` reste une archive privée et n'est jamais consulté par le navigateur.
- Le résolveur doit déjà retourner une URL autorisée par `assetId`. Aucune URL n'est incluse dans le contrat auteur ni dans le WorldDocument.
- Sur mobile, un `Audio.play` bloqué par les politiques autoplay ne doit pas interrompre le gameplay ; la validation d'écoute réelle se fera uniquement avec les médias du créateur.

## Tests
`tests/unit/combat-soundtrack-preview-bridge-v1.test.mjs` protège : aucune scène => silence, asset manquant, séquence combat/boss sans double voix, fermeture idempotente, erreur de démarrage sonore non fatale et branchement au cycle de vie vrai éditeur. CI cinq jobs et checkpoint GREEN technique avant publication. Android reste un jalon distinct.
