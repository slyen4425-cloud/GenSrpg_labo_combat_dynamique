# Labo Combat — Rafraîchissement catalogue Prairie fleurie V1

Date : 2026-10-11

## Objectif
Exposer dans la bibliothèque visuelle de l'éditeur Capture le pack Prairie fleurie déjà livré par son propriétaire canonique `global-assets`.

## Autorité et état
- Propriétaire médias, manifeste, catalogue et `assetId` : branche `global-assets`, commit `d39afa6b69de7abb830f9742a5daa4b02ab8239e` (CI 38109346147 SUCCESS).
- Checkpoint source du rafraîchissement Labo : `checkpoint/lab-start-flowering-meadow-catalog-refresh-v1-2026-10-11` à `6d8e518113d873de01351ef3dce69db38566e624`.
- Branche de travail : `work/lab-flowering-meadow-catalog-refresh-v1-2026-10-11`.
- Point de publication ciblé : `gh-pages`.
- Aucun changement de `main`, du moteur, de Gameplay, de `configuredSkills`, de Zombicide ou des autres laboratoires.

## Liaison
- ID : `pack:capture:sprite-flowering-meadow-ground-01`.
- Sprite 20 frames, 80 ms par frame, mode `once`. Image de sol en floraison.
- Le fichier partagé `src/assets/global-visual-library.js` conserve l'unique branche et les URL de source. Seule la révision cache passe à `2026-10-11-v23-flowering-meadow-ground`.
- Deux tests d'assets préexistants (rock skyfall et stone carapace) imposaient l'ancienne révision et ont été synchronisés avec **la nouvelle valeur stricte** : aucun test supprimé ou relâché.

## Contrôles
- Comparaison Git : uniquement `src/assets/global-visual-library.js`, ses deux sentinelles de révision et le présent rapport.
- Première CI du seul rafraîchissement : `38109455255`, FAILED uniquement sur deux anciennes assertions de révision ; la défaillance a été diagnostiquée (aucune régression fonctionnelle).
- CI après synchronisation des sentinelles : `38109526741`, SUCCESS, incluant les tests navigateur Chromium.
- Après ce rapport, CI documentaire finale requise avant checkpoint GREEN technique et publication `gh-pages`.
- Test smartphone utilisateur et vérification visuelle finale du choix/placement de sprite dans une zone réelle : encore à réaliser. Ne pas qualifier GREEN utilisateur sans ce retour.

## Non-actions intentionnelles
Aucune compétence n'est créée automatiquement. Le créateur choisit `Prairie fleurie — pousse au sol` dans la bibliothèque GenSrpG pour une présentation de compétence/zone. Les règles de zone et les paramètres de maintien de la dernière frame restent sous l'autorité du moteur/éditeur existant.
