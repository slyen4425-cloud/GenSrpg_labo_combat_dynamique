# Labo Combat — pilote de livraison vers GenSrpG / Exploration

Statut : **candidat, non publié sur main**. Date : 2026-10-27.

## Révisions de départ vérifiées
- Code exécutable source : `gh-pages@e97a259ff080a5a9ff40d0f4e0892f45d71f081d`.
- Bibliothèque médias : `global-assets@b3d46ce6f2639ebb59a2984aeff17f97cbcd7377`.
- `main` avant préparation : `a9cd326b4a078f461f146ae9f0a231af20611701`.
- Ces révisions sont des **repères de départ**, pas une livraison stable ni une garantie que les tests passent.

## Contrat d'intégration pilote
1. Le consommateur utilise une révision **épinglée** de `main`, jamais un lien implicite vers la tête de branche en production.
2. Le manifeste de livraison doit épingler le SHA des médias `global-assets` et la version du catalogue `data/assets/catalog/global-visual-assets.v1.json`.
3. Le runtime combat doit être consommé via les modules et contrats exportés du laboratoire, sans importer la Demo UI ou les sauvegardes de GenSrpG.
4. Les transferts de créatures/compétences et leurs visuels restent gérés par leurs propriétaires canoniques. Aucun deuxième registre.
5. Le raccordement à GenSrpG et Labo Exploration est testé séparément ; aucune activation automatique n'est présumée.

## Contrôles bloquants avant promotion
- Examiner les deux commits propres à `main` absents de `gh-pages` ; préserver leur historique.
- Résoudre la CI rouge sur `gh-pages` ou isoler précisément les causes avant toute déclaration GREEN.
- Valider le chargement du catalogue et des médias à révision figée ; vérifier les exports et le démarrage d'un combat minimal.
- Réaliser le checkpoint, le tag de version, et publier sur `main` **seulement après contrôles**.
- Mettre à jour la charte active avec la procédure de promotion avant la première publication stable.

Cette préparation n'altère ni `main`, ni `global-assets`, ni GenSrpG, ni Labo Exploration.
