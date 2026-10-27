# Labo Combat — Apparence animée à distance et sous-chapitres d'édition

Date : 19 octobre 2026. Lot autonome à partir de `gh-pages@84f839e8c89c98cecb2fefc1ae7cf5578221bbf6`.

## But
L'auteur souhaite réutiliser sur les attaques à distance l'animation de créature appréciée sur le roulement du Scarabacier et rendre l'onglet Apparence lisible sur mobile.

## Présentation et compatibilité
- Le contrat optionnel `CreaturePresentationBinding V5` ajoute **`visual.rangedAttack`** à `visual.movement` (V4). Identiques paramètres éprouvés : `assetId`, `mode=roll|sprite|static`, `displayScale`, `rotationTurns`, `frameCount` (bande horizontale), `transitionMs`. Le validateur réutilise le code V4 ; les anciens V1, V2, V3, V4 restent valides sans migration ni activation implicite.
- **Créature → Apparence → 3. Animations → Animation de la créature — attaque à distance** : sélection de l'asset dans le catalogue natif ou la session d'import personnelle (usage mouvement) ; aucun ID à saisir.
- Le **Combat Resolution Presenter** indique la pose alternative au vrai événement `attack` **au release** d'une capacité de forme `projectile`, `beam` ou `area`, uniquement si l'apparence a été définie sur cette créature. La Demo UI active le **même renderer de silhouette alternative** que pour le roulement, pour la durée native de l'animation `attack`, puis restaure normalement l'image et sa teinte. Pas de second moteur de dégâts ni de chronologie indépendante.
- Les effets de la capacité (cast, projectile, rayon, impact, dégâts, collision) gardent intégralement leurs propriétaires et leurs propres sprites. L'apparence est un **visuel du corps** au moment du tir, pas une animation du projectile.
- **Mêlée :** aucune nouvelle pose imposée ; l'approche avec `visual.movement` et le signal `onContact` réel existant restent conservés. Le contact et les dégâts ne sont pas décalés ni doublés. Une pose finale facultative supplémentaire nécessitera un lot spécifique si souhaité.

## Organisation de l'onglet Apparence
Le bloc unique contient désormais cinq `<details>` natifs, visibles, avec grands sommaires et indication d'ouverture :
1. **Visuels de la créature** — face, dos, icône (ouvert).
2. **Réactions défensives** — esquive, défense et visuel de réaction (fermé).
3. **Animations** — déplacement, roulement, tir à distance (ouvert).
4. **Bibliothèque de visuels** — importer de nouveaux visuels (fermé).
5. **Posture et perspective** — profil, tempo, taille et placement face/dos (fermé).

Tous les attributs `data-...` historiques sont préservés ; le formulaire garde une seule source d'autorité. CSS ajouté uniquement à l'éditeur Capture : grand champ tactile, contraste, clavier/focus-visible, viewport smartphone.

## Cache d'images et sécurité
- Un unique propriétaire de rendu précharge les visuels mouvement et attaque à distance au chargement de la créature.
- Cache indexé par **URL + nombre de frames**, indispensable si une même source sert en image fixe ou bande de frames avec des configurations différentes.
- Une nouvelle animation annule la pose précédente. Restauration lors de fin, interruption, rappel, changement de créature, disparition et `dispose`.
- Collision sur silhouette présentée, première frame de bande animée ; limitations de silhouette multi-frame identiques au lot de mouvement précédent. Pas d'asset graphique nouveau ; assets utilisateur de session sans garantie de persistance après un rechargement.

## Tests / critères GREEN
- `tests/unit/capture-ranged-appearance-groups-2026-10-19.test.mjs` valide contrat V5/legacy, conversion de l'éditeur, résolution du catalogue, sélection de visuel au release (projectile/beam/area), absence pour la mêlée, cinq menus accessibles et cache same-URL/different-frameCounts.
- Régressions historiques `creature-movement-appearance-v1.test.mjs` + suite foundation Node et quatre suites navigateur.
- CI 5/5 au HEAD final, checkpoint puis publication sous lease depuis base inchangée, déploiement Pages réussi.
- Validation auteur mobile 1v1/2v2, joueur/adversaire et assets importés distincte de la CI.

## Branches
- Checkpoint initial : `checkpoint/lab-start-ranged-appearance-ux-2026-10-19`
- Branche de travail : `work/lab-ranged-appearance-ux-2026-10-19`
- Aucun changement de `main`, `global-assets`, `Zombicide-40k` ou du labo d'exploration.
