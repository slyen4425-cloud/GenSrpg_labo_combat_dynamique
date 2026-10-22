# Audio F — musique Battle jouable pour tous, sans téléchargement dans l'interface (22 octobre 2026)

## Besoin de l'auteur
Les six morceaux `Battle_1.mp3` à `Battle_6.mp3` doivent s'entendre automatiquement dans le laboratoire Combat, **sur PC et mobile pour chaque joueur**, sans sélection de fichiers MP3 personnels et sans bouton « Télécharger ». Cette correction remplace le caractère obligatoire de l'upload local du lot Audio E. La playlist demeure un contexte de bande-son modifiable dans l'onglet **Musiques**.

**Limite technique incompressible :** GitHub Pages livre les octets des MP3 au navigateur. Retirer les boutons de téléchargement, nommer les fichiers de manière opaque et ne pas afficher leur URL n'empêche pas une récupération par navigateur, capture réseau ou enregistrement audio. Il ne faut pas annoncer un DRM ou une interdiction technique de copie. Les fichiers publiés sont des **copies runtime 96 kbps**, pas les masters d'origine.

## Source de vérité
- Originaux : dépôt **privé** `slyen4425-cloud/GenSrpG_audio_prive`, `audio/musiques/combat/Battle_1.mp3` … `Battle_6.mp3`, conservés inchangés ; les quatre morceaux Exploration restent privés et ne sont pas raccordés ici.
- Un workflow privé transcode les MP3 en copies runtime à 96 kbps sans toucher aux sources. La livraison des octets est faite dans le dépôt public uniquement sur le périmètre `assets/runtime/audio/music-v1/` de ce lot autorisé.
- Autorisation expresse reçue de l'auteur le 22 octobre 2026 : il déclare avoir créé ces musiques avec Suno en formule payante et posséder les droits correspondants, et autorise ici leur diffusion au public dans le jeu. Cette mention rapporte sa déclaration, sans vérification indépendante des conditions du compte Suno. La provenance figure aussi via `licenseRef` dans les métadonnées Battle.
- Les droits de diffusion doivent appartenir au créateur ou avoir été obtenus avant de réutiliser ce mécanisme pour de la musique tierce (ex. abonnement à une bibliothèque sonore ne vaut pas automatiquement licence de distribution).

## Propriétaires et vrais branchements
1. `src/assets/soundtrack-starter-catalog-v1.js` reste la **seule table** des `assetId` et de la playlist six Battle, `capture:combat:normal`.
2. `src/assets/soundtrack-runtime-library-v1.js` est l'adaptateur pur `assetId -> URL du MP3 runtime` (pattern des SFX existants, aucun accès GitHub privé ni token embarqué).
3. `examples/dom-demo/capture-editor-v2.js` consomme ce resolver au même emplacement existant `resolveEditorAudioAsset`, et appelle `createCombatSoundtrackPreviewBridgeV1` sans deuxième engine ni nouveau timer. Il n'est plus nécessaire d'utiliser l'import local ; celui-ci reste facultatif pour comparer une variante sur son poste.
4. `src/core/audio/soundtrack-session-v1.js` pilote la liste, enchaîne les six pistes, les fondus, le volume et l'arrêt ; les SFX des compétences et créatures restent dans `DomCombatAudio`.
5. L'onglet Musiques ne crée aucun lien de téléchargement ni n'enregistre d'URL dans le JSON du jeu.

## État de livraison
Les six copies MP3 optimisées sont présentes dans `assets/runtime/audio/music-v1/` sur la branche de travail. Le contrôle d'intégrité des six fichiers passe, et les exécutions CI 39839030941 et 39839036237 ont chacune réussi les cinq jobs. Publication sur le site public après fusion de la PR #68. Validation auditive PC et mobile par l'auteur ensuite.

## Essai
Ouvrir la [prévisualisation Capture](https://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/examples/dom-demo/capture-editor-v2.html), puis cliquer **Lancer combat**. La piste `Battle_1` doit commencer après le geste utilisateur, puis `Battle_2`, etc. Retour éditeur = arrêt de la musique. Le navigateur peut bloquer `Audio.play` selon ses politiques ; dans ce cas le combat doit rester jouable et le blocage est diagnostiqué en console. Le statut `6 / 6` dans l'import facultatif se rapporte uniquement aux remplacements locaux et n'est pas un indicateur de disponibilité des MP3 partagés.

## Tests du lot
- Test Node natif : six `assetId` whitelistés, six vrais fichiers MP3 référencés par le resolver, en-têtes MP3, playlist six ordonnée, aucun fichier Exploration accessible par ce resolver, aucune URL privée ni lien de téléchargement UI.
- Test vrai cycle de combat via `createCombatSoundtrackPreviewBridgeV1` et un output instrumenté : démarrage, morceau suivant et `dispose` à la fermeture.
- Sentinelles navigateur existantes : import UI facultatif, initialisation onglet, combat prévisualisé, non-régression animations/sons existants.
- CI 5/5 obligatoire avant checkpoint GREEN et fusion sur `gh-pages`; après publication validation auditive réelle PC et Android par l'auteur.

START `checkpoint/lab-start-battle-streaming-runtime-2026-10-22`, base publique `3c598cfe9bb09cb234fd53f839def92d07b10c22`, work `work/lab-battle-streaming-runtime-2026-10-22`.
