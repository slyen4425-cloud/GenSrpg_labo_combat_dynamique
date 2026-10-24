# Bestiaire Capture — fiches de présentation (24 octobre 2026)

## Demande auteur
Onglet de consultation, pas une interface de création. Une grande illustration de **face uniquement** par créature, avec fiche lisible : nom, élément, description, statistiques, résistances et compétences. Le futur jeu pourra présenter la même vue dans son menu, sans raccorder maintenant le dépôt principal.

## Gouvernance
- Base immuable : gh-pages @ `812ade5548216c94e2367ca149400f3c85e5454b`.
- Départ : `checkpoint/lab-start-bestiary-creature-cards-2026-10-24`.
- Travail : `work/lab-bestiary-creature-cards-2026-10-24`.
- Propriétaire métier : les transferts Capture déjà publiés. Propriétaire des médias : catalogue `global-assets`, chargé via `GLOBAL_VISUAL_LIBRARY`. Propriétaire de l'affichage : composant Bestiaire, sans duplication/édition de données.
- Inclusion automatique : uniquement les fiches liées à des assets publiés **face, dos et icône**, dont le portrait de face est enregistré et exploitable. Le dos est seulement une condition de complétude, **jamais affiché**. Éviter faux « terminé » à partir d'un emoji/placeholder.
- Manifest des presets Showcase existant : ajout futur d'un fichier de créature dans ce manifest suffit pour être découvert, sans modifier le Bestiaire. Aucune déclaration manuelle dans une seconde base.
- Les capacités viennent des presets de compétences existants ; valeurs absentes indiquées sans les inventer. Les compétences non documentées restent conservées dans les données, pas remplacées.
- L'image front correspond à `presentation.visual.front.assetId`, pas à une déduction depuis un nom ou à l'asset dos.

## Périmètre
Autorisé : `src/ui/capture-bestiary-cards-v1.js`, `examples/dom-demo/bestiary.html`, `examples/dom-demo/bestiary.js`, `examples/dom-demo/bestiary.css`, ajout d'une entrée de navigation dans `examples/dom-demo/capture-editor-v2.html`, tests dédiés (unitaire + navigateur réel), `.github/workflows/ci.yml` (ajout d'une étape), ce document et journal `LAB_CURRENT_WORK.md`.

Protégé : `main`, `global-assets`, moteur de combat, profils/ombres, stats et sauvegardes auteur, bibliothèques d'assets, registre de compétences, `Zombicide-40k`, styles de l'éditeur hors navigation.

## Tests/acceptation
- Refus d'une créature sans face, dos, icône ou média non référencé dans le catalogue.
- Le rendu de la fiche ne comporte **aucun portrait dos** ; l'image utilisée est celle de la face.
- Source unique, pas de catalogue bestiaire parallèle ni faux noms/valeurs.
- Chargement asynchrone, erreur explicite de ressource, filtre élément, recherche, navigation smartphone.
- Mise à jour d'un preset/manifest visible au rechargement ; page autonome pouvant être montée plus tard dans le menu du jeu.
- Test Chromium de la vraie page et chargement du transfert Venombre publié, avec seul catalogue média distant injecté en fixture, sans détourner le code de l'application.
- Lancement des tests unitaires et des jobs CI ; checkpoint GREEN après réussite seulement.
