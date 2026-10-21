# Loup volcanique — DOS 12 frames : course / attaque (2026-10-21)

## Demande et statut visuel

Deux animations côté joueur/dos, issues du modèle de dos explicitement fourni par l'auteur.

| Action | 12 PNG 512×512 RGBA | Atlas 12 × 384 = 4608×384 WebP RGBA | Durée | Lecture | Validation |
| --- | --- | --- | --- | --- | --- |
| Course (`movement`) | oui | oui | 80 ms / frame | boucle | provisoire : essai en jeu requis |
| Attaque (`attack`) | oui | oui | 100 ms / frame | une fois | validée |

La course **ne doit pas être déclarée définitivement validée** : son rendu reste à vérifier en situation de jeu.
Les 2 animations peuvent être proposées au catalogue pour essai. Le raccord automatique à la fiche du loup et les comportements moteur sont hors périmètre de ce lot.

## Base, branche et protection

- Dépôt autonome : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Propriétaire : `global-assets`, sous `assets/library/capture/creatures/loup_volcanique/animations/{movement,attack}/dos/`.
- Base officielle contrôlée : `25310eee861f9b2e8f4e929cb8e50f158eeb09d1`.
- Checkpoint de départ : `checkpoint/global-assets-start-loup-volcanique-dos12-2026-10-21`.
- Branche : `work/global-assets-loup-volcanique-dos12-2026-10-21`.
- Protections : `main`, `gh-pages`, `Zombicide-40k`, les trois images officielles `runtime/`, les animations face déjà GREEN, autres créatures, gameplay/combat, Animation Core et Render Adapter.

## Sources réelles

- ZIP de transfert : `_incoming/LOUP_VOLCANIQUE_DOS_12_COURSE_ATTAQUE_PREVIEW.zip`.
- SHA256 strict : `bebd0e3735eccc6e33e510b1daf9657682081f7997e4b1304f42b3376c47eafe`.
- ZIP original contrôlé : 41 entrées, CRC correct, 24 fichiers PNG RGBA 512×512 avec 24 hash distincts.
- Aucun modèle n'est régénéré ; chaque PNG est importé à l'identique (SHA256 source confirmé).
- Marge réelle min : **52 px** sur les 24 PNG (vérifiée sur alpha).
- Atlas WebP réel sprite-strip 4608×384 par animation, RGBA et SHA256 vérifiés.
- Script : `scripts/import_loup_volcanique_dos12.py`.
- Workflow : `.github/workflows/import-loup-volcanique-dos12.yml`.

## Asset Catalog — ajout append-only

Les deux IDs suivants seront créés uniquement après dépôt et vérification du vrai ZIP :

- `pack:capture:creature-loup-volcanique-movement-dos-12-v1`
- `pack:capture:creature-loup-volcanique-attack-dos-12-v1`

Resource type `sprite`, `format=sprite-strip`, image WebP, `frameCount=12`.
Les ressources officielles de face `movement-face-12-v1` et `attack-face-12-v1` et les vues simples ne changent pas.

## Gates et sortie GREEN

1. Recevoir le ZIP au chemin `_incoming/` de la branche de lot, SHA256 et ZIP CRC vérifiés.
2. Valider PNG RGBA 512×512, marges, hashes et 12 frames distinctes par animation.
3. Produire fichiers `frames/`, `atlases/`, `previews/`, manifestes et ajouter seulement deux IDs au catalogue.
4. Contrôler catalogue et tests de non-régression, exécuter `npm run ci` et CI GitHub sur médias réels.
5. Mettre à jour `LAB_CURRENT_WORK.md`, vérifier changements / absence de pollution.
6. Promouvoir la branche `global-assets` par fast-forward et créer checkpoint GREEN du jalon technique.
7. **Ne pas dire « validé en jeu » pour la course avant test utilisateur.**

Aucun transfert binaire ni GREEN ne peut être revendiqué tant que le ZIP n'est pas réellement committé et importé.
