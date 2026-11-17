# 2026-11-17 — Créature POURPRE face adversaire : 12f course + attaque

## Diagnostic
Le fichier `_incoming/creature_pourpre_face_mouvement_attaque_12f_valide.zip` existe dans `global-assets` (18 331 888 octets, Git blob `f5a16e641ebc0ed79663825b1b72349fc7847582`). Le catalogue ne contient que les deux animations `player` (dos) de Pourpre publiées le 16 novembre. Les deux animations `opponent` (face) sont absentes des références, d'où l'absence dans les menus de l'application. `creature_violette` est une AUTRE créature.

## Lot ciblé
- Owner : `global-assets`, catalogue visuel `data/assets/catalog/global-visual-assets.v1.json`.
- Base : `global-assets@97e793e8e767570a617269d9209137fa3351c046` ; checkpoint `checkpoint/lab-start-pourpre-face-12f-2026-11-17`; work `work/lab-pourpre-face-12f-2026-11-17`.
- Sources : seul le ZIP face de 12f déjà déposé et validé ; ne rien inventer ni redessiner.
- Nouveaux objets : 2 animations `opponent` (course loop + attaque once) dans `assets/library/capture/creatures/creature_pourpre/animations/{movement,attack}/opponent/`, et 2 entrées additives dans le catalogue canonique.
- Protégés : tout `creature_violette`, toutes les animations `player` de Pourpre (8f), ses modèles face/dos/icône, gameplay, éditeur, `main` du labo, les autres dépôts, sauvegardes et modèles existants.
- Vérifications : noms/dimensions exacts du ZIP, SHA256/Git blob et CRC, douze frames originales par animation, vrais PNG RGBA 512×512 et alpha, marges de sécurité, atlases pixel identiques aux frames, previews à 12 poses, unicité IDs, catalogue, CI `npm run ci`, checkpoint GREEN, fast-forward sans force sous lease de `global-assets`, CI du SHA canonique.
- App principale : vérifier la visibilité depuis son résolveur de catalogue unique ; aucune copie de bibliothèque ni modification moteur sans nécessité démontrée.
- État : média importé sur branche de travail, CI complète de l'import verte ; publication canonique contrôlée après CI du commit documentaire.

## Audit et résultat de l’import réel

- Source intacte : `_incoming/creature_pourpre_face_mouvement_attaque_12f_valide.zip`, SHA-256 `9817f86f4c76d5e09f785cafa99b6cace5e910dd9d4ba7e76267a9b38279619c`, Git blob `f5a16e641ebc0ed79663825b1b72349fc7847582`, CRC ZIP OK.
- Exactement 12 PNG RGBA 512 × 512 par action, 24 poses distinctes ; modèle face maître du ZIP strictement identique au PNG face canonique de Pourpre.
- L’archive elle-même avertissait que les deux frames 01 étaient différentes du modèle maître, et plusieurs PNG n’avaient que 22–41 px de marge basse. Correction ciblée des **deux seules frames 01** par l’image maître officielle, plus **translation fixe de 20 px vers le haut des 22 poses restantes**, sans interpolation, recadrage destructeur, redimensionnement, redessin ni modification de palette.
- Contrôle automatique de marge de sécurité : minimum **42 px** partout. Toutes les frames gardent leur format 512², transparence réelle, identité de source et ordre original.
- Exports réels : deux atlases horizontaux 6144 × 512 WEBP lossless, deux previews WEBP animées 12 poses, 24 PNG individuels et deux manifestes déclarant l’origine et les corrections. Vérification pixel alpha + rendu sur atlas et preview.
- Séquences : course loop 83 ms/image ; attaque once, cadences source `[110,100,90,90,85,75,110,95,95,110,130,430]` enregistrées dans `resource.frameDurationsMs` et le manifeste, avec `resource.frameMs=100` comme cadence de secours pour les lecteurs à durée uniforme.
- Nouveaux IDs catalogue : `pack:capture:creature-pourpre-movement-opponent-12-v1` et `pack:capture:creature-pourpre-attack-opponent-12-v1`.
- Résultat import GitHub Actions `43993017476` : SUCCESS, **349 tests PASS, 0 FAIL** ; commit média `5b2ae51c176ca2538d83f68e42979644e831c3fd`.
- Catalogue 430 → 432 assets, 206 → 208 sprites ; références Violette et DOS Pourpre inchangées. Aucun autre média modifié, aucun raccord automatique de fiche configurée, aucune modification de code du jeu principal.
- Les scripts/workflows d’audit one-shot ont été retirés de la branche avant publication pour éviter des traitements temporaires dormants ; seul l’importeur reproductible et le test permanent sont conservés.
- Publication officielle, contrôle `global-assets` et CI du SHA final : à valider séparément. Validation artistique du raccord entre la frame maître restaurée et la deuxième pose sur smartphone non encore revendiquée.
