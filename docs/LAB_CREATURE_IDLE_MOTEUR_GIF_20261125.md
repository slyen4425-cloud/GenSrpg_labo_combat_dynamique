# Repos des créatures — Moteur / GIF / Les deux (25 novembre 2026)

## Autorité
- Labo Combat main : seul éditeur de combat et de présentation des créatures.
- Atelier Animation : outil indépendant qui **produit** des images/animations ; aucun moteur Rigby embarqué dans le combat et aucune dépendance ajoutée.
- Bibliothèque visuelle existante (canonique) : seules les images référencées par assetId sont consommées.

## Mode
- `engine` : ancien idle moteur inchangé, par défaut pour les anciennes fiches.
- `gif` : affiche le GIF ou l'atlas WebP idle en boucle, au repos, sans mouvement moteur ajouté.
- `both` : sprite animé au repos et plan moteur en même temps.
- FACE et DOS sont indépendants ; si l'un n'est pas renseigné, repli explicite sur l'autre.
- Le rendu est interrompu lors des attaques, esquives, déplacements, retours ou KO et recommence lors du repos, sans modifier les dégâts ni la physique.

## Sauvegarde
Extension de présentation `version:11` avec `visual.idle:{mode,frontAssetId,backAssetId}`. Pas de nouvel emplacement de sauvegarde ni catalogue parallèle. Les imports personnels par URL blob sont propres à la session ; pour une utilisation pérenne, publier l'asset GIF/WebP dans la bibliothèque canonique. 
