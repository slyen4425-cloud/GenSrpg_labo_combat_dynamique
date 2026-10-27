# GenSrpG — Architecture musique/ambiance v1 (sans média publié)

## Décision du créateur — 21 octobre 2026
Créer d'abord l'architecture réutilisable, puis fournir les musiques pour la vitrine. Cibles : **labo Combat et labo Exploration uniquement**. Le Shell / les menus de démarrage du dépôt GenSrpG restent hors périmètre. Les créations des joueurs doivent pouvoir référencer les mêmes ressources mais disposer de bandes-son indépendantes par jeu et par mode.

## Domaine et propriétaires
- `src/contracts/soundtrack-project-v1.js` : valide le **catalogue abstrait** commun (`assetId`, `kind: music|ambience|sfx`, `origin: app|user|project`, titre, licence facultative) et la configuration de bandes-son (`projectId`, scènes, pistes, volume, boucle, ordre, fade). Le contrat n'inclut jamais un chemin privé ou une URL.
- `src/core/audio/soundtrack-session-v1.js` : **autorité unique sur les canaux continus** `music` et `ambience`, avec séquence/shuffle, volume, fondu, changements de scènes, interruption, dispose. L'horloge est injectée (tests déterministes). Les sons d'attaque/cast/impact et de déplacement restent propriétaires de `DomCombatAudio` / des compétences et ne sont pas interceptés.
- `src/adapters/audio/dom-soundtrack-output-v1.js` : seul wrapper navigateur chargé d'utiliser `Audio` et un résolveur `assetId -> URL autorisée` fourni par l'appelant. La session et les contrats ne manipulent aucun DOM. L'audio navigateur nécessite un geste utilisateur initial avant play (autoplay mobile).
- Aucun accès direct au dépôt privé `GenSrpG_audio_prive`, aucun secret GitHub, aucun contournement des droits des contenus d'Epidemic Sound. Les enregistrements personnels et leur stockage seront définis dans un lot distinct.

## Frontière Combat / Exploration
- Exploration produit des intentions `sceneId` par `areaId` / famille de terrain / entrée-sortie de rencontre, via son propre contrat pur. Aucun import du runtime d'un autre dépôt.
- Combat pourra fournir `sceneId` par contexte combat (normal, boss, victoire/défaite), via un raccord dédié dans son interface, sans prendre autorité sur les sons FX.
- Les scènes d'un jeu sont indépendantes de celles d'un autre jeu par `projectId`. Le même `assetId` est réutilisable sans dupliquer l'audio. Les paramètres sont conservés dans le projet.
- Aucune configuration supplémentaire requise si un jeu ne veut pas de musique : `music/ambience:null` ou scène silencieuse.
- Modes de playlist `sequence`, `shuffle`, `repeat`; `fadeMs` 0..10000, volume 0..1 et boucle optionnelle par canal.

## Lots suivants — non déclarés intégrés par ce lot
1. UI éditable Combat : affectation et sauvegarde des scènes, puis branchement de SoundtrackSession sur les événements actuels de vrai combat.
2. UI éditable Exploration : association Area/biome/encounter, lecture et reprise après combat.
3. Épreuve vraie chaîne inter-modes en mobile ; tests d'absence de superposition et de non-régression sons de capacités.
4. Remplacement des ressources fictives de test par des sons de vitrine autorisés, une fois fournis par le créateur.

## Validation et suivi
- Tests `tests/unit/soundtrack-architecture-v1.test.mjs` vérifient les contrats, isolation, lecture à blanc via faux output, fondus/changements rapides, sortie DOM injectée et `dispose`.
- GREEN technique seulement après CI complète. Le contrôle artistique musical requiert plus tard des médias réels sur Android.
- Checkpoint départ `checkpoint/lab-start-soundtrack-architecture-v1-2026-10-21`, base `gh-pages@3150fd9fb8711c00e8aceaa9c3ec3cac29ed83d1`, branche `work/lab-soundtrack-architecture-v1-2026-10-21`. Ne pas fusionner directement `main`.
