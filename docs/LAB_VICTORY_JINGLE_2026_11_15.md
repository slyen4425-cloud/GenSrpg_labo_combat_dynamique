# Capture — vrai jingle victoire/défaite (15 novembre 2026)

**Lot audio indépendant** du raccord des six créatures. Base `main@4fcba6dad6427c832a7c3181b5bafe4a8a1c0998`; checkpoint `checkpoint/lab-start-victory-jingle-after-six-models-20261115`; branche de travail `work/lab-victory-jingle-20261115`. Le résultat unique de Combat et les réserves de RosterSession ne sont pas modifiés.

## Media d'auteur réellement fourni

Original `Triumph's Call.mp3` récupéré depuis le dépôt de fichiers de l'auteur, MP3 valide (ID3), 190 638 octets, 7.152 s, SHA-256 `327d2734bca243c90c3b9f0b6bbf2f93fb78a667fbe380dc1be5486e68e250fe`, Git blob `0b52ce2bebb8643bf34618489b487a02e59e03df`. Une seule livraison runtime dans `assets/runtime/audio/music-v1/victory-01-0b52ce2b.mp3` ; aucune duplication des masters ni nouveau dépôt d'assets. ID stable `gensrpg:music:combat:victory-01` dans le **catalogue musique déjà existant**.

## Fonctionnement

- La scène `capture:combat:victory` utilise ce jingle par défaut, `sequence`, `repeat:false`. Une scène `capture:combat:defeat` distincte est réservée à l'auteur mais silencieuse par défaut : aucun faux son n'est inventé.
- Dans l'onglet **Musiques** de l'éditeur : boutons rapides Combat / Victoire / Défaite, sélection des pistes depuis le catalogue existant, réglages et export JSON déjà existants.
- La seule preuve de victoire est la fin d'équipe `team_defeated` de RosterSession, relue sur les membres de la composition native (y compris les réserves), relative à l'équipe du joueur ; un premier KO ne vaut jamais victoire.
- L'UI Combat **notifie seulement** l'issue finale à un callback ; le wrapper de présentation la passe à l'unique `SoundtrackSession` existante. L'éditeur lui passe le projet courant, tandis que le Combat embarqué emploie la scène par défaut, sauf projet explicite fourni par son hôte.
- Pas de minuteur supplémentaire, pas d'autre moteur de règles, pas de deuxième catalogue, pas de synchronisation Exploration, Dungeon ou Survie. Un échec audio n'interrompt jamais le combat.
- Le chargement navigateur peut rester soumis aux règles d'autorisation audio mobile; validation d'écoute sur Android nécessaire.

## Tests et condition de publication

Test sur le MP3 réel (octets + SHA), contrat catalogue, music non-looping, situations une créature KO / réserve vivante, équipe adverse KO, joueur KO, nul, données incomplètes, vrais points d'entrée UI. CI ciblée + complète, vrai navigateur, SHA Pages + checkpoint GREEN. Aucune suppression d'archives auteurs.
