# Export de bibliothèque de marqueurs — réconciliation V1

Date : 17 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Incident utilisateur et preuve

Deux exports transmis par l'auteur n'étaient pas concordants :
- `gensrpg-marqueurs(2).json` : `{"schema":"capture-markers-v1","markers":[]}`.
- `gensrpg-capture-skill-lib_paralyze.json` : `draft.definition.effects[1].kind:"apply_marker"`, avec définition complète `venin-static` : permanent, 20 charges max, 2 dégâts par charge toutes les 5 secondes, canal électrique et K.O. au seuil 20.

La définition du marqueur était **présente et intacte dans la capacité**, mais l'export de la bibliothèque avait pu être produit depuis une liste interne distincte, non synchronisée avec les modifications non enregistrées de l'éditeur de capacités.

## Correction : une projection d'export, aucun propriétaire gameplay supplémentaire

Le module pur `src/ui/capture-marker-export-v1.js` construit l'instantané exportable à partir de :
1. la `Map` de la bibliothèque auteur (y compris marqueurs non encore placés) ;
2. chaque `apply_marker.marker` de la `Map configuredSkills`, propriétaire actif des capacités ;
3. le brouillon de capacité **actuellement visible dans l'éditeur**, même lorsqu'il n'a pas encore été sauvegardé dans `configuredSkills`, exactement comme le bouton « Exporter la capacité ».

Chaque définition est normalisée par `CaptureMarkerV1`. Un identifiant est dédupliqué seulement lorsque sa définition est strictement identique ; deux définitions différentes portant le même ID bloquent l'export avec une erreur explicite plutôt que masquer le conflit. Toutes les définitions originales restent inchangées. Une capacité incomplète sans `apply_marker` n'empêche pas l'export de marqueurs indépendants.

Le bouton exporte `capture-markers-v1` avec la liste complète. Lorsque celle-ci est réellement vide, **aucun fichier contenant `markers: []` n'est téléchargé silencieusement** : l'auteur reçoit une explication en français.

## Sentinelles

- Test unitaire : `tests/unit/capture-marker-export-reconciliation-v1.test.mjs` relit les **deux exports originaux archivés** et vérifie `venin-static` et toutes ses propriétés (permanent, limite, tick, canal, icône, seuil K.O.), sans toucher aux données d'auteur.
- Même test : fusion Map + configuredSkills + capacité non enregistrée, marqueurs indépendants, rejet des définitions contradictoires.
- Vrai navigateur Chromium : `tests/browser/capture-creature-library-smoke.mjs` sélectionne `lib_paralyze`, intercepte le `Blob` du **véritable bouton** « Exporter la bibliothèque JSON », puis vérifie le document JSON, sa structure et la fidélité à `venin-static`.
- La CI Foundation et les 4 tests navigateurs doivent passer sur **le SHA documentaire final**. Checkpoint GREEN sur ce SHA exact, fast-forward `gh-pages` protégé par `expected_sha`, puis résultat GitHub Pages SUCCESS.
- Android tactile : validation auteur distincte et encore attendue.

Base `gh-pages@35dd597c399e5948f49739c2fbb984563ce34526` ; checkpoint `checkpoint/lab-start-marker-export-reconcile-2026-10-17` ; branche `work/lab-marker-export-reconcile-2026-10-17`. Le moteur de combat, la logique périodique, le loadout et les assets ne sont pas modifiés.
