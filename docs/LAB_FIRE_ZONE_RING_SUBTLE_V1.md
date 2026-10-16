# Zone de feu — contour très discret, bulle préservée (16/10/2026)

## Retour utilisateur et cause

Le contour tactique de **Tempête de flammes** (zone persistante) demeure trop visible malgré la réduction générale de 0.88 à 0.52. **L'onde expansive / bulle qui grandit est validée** et doit rester strictement inchangée.

La feuille CSS utilisait la même palette élémentaire pour `.skill-fx--tactical-zone` et `.skill-fx--expanding-wave`. La réduction précédente conservait pour la zone 1.5 CSS px, alpha 0.52, un halo coloré et un très léger remplissage. La page réelle de l'éditeur chargeait `./demo.css` sans changement d'URL, laissant une possibilité de cache mobile (non prouvée sur l'appareil utilisateur).

## Correction limitée au rendu

- Seule la zone **persistante de feu** reçoit une surcharge CSS `.skill-fx--tactical-zone[data-element="fire"]` : bordure 1 px, alpha 0.18, aucun halo, arrière-plan transparent.
- La palette partagée avec l'onde expansive garde exactement son alpha 0.52 et ses réglages antérieurs. Toutes les autres zones élémentaires conservent leurs réglages.
- L'éditeur référence maintenant la feuille avec `./demo.css?v=fire-zone-ring-20261016` afin de demander au navigateur une nouvelle ressource et éviter un vieux CSS servi par cache HTTP standard.
- Aucun changement à `DomSkillFxRenderer`, `CombatRuntime`, hitbox, rayon, règle de dégâts, sprite, placement, animation, son ou sauvegarde. Le contour continue de suivre **la même géométrie native** ; le marqueur reste non interactif et est supprimé à l'expiration.

## Sentinelles

- Intégration : seules les valeurs de la zone de feu diffèrent ; la palette de l'onde reste identique ; CSS versionné depuis la vraie page éditeur.
- Chrome réel : style calculé (bord alpha .18, 1 px, halo 0, remplissage transparent), 1v1/2v2, joueur/IA, étapes courte/moyenne/longue, sprite niveau 3 plein arène, cleanup.
- CI obligatoire : Foundation + Firestorm Chromium + Creature Library Chromium sur SHA exact, checkpoint GREEN puis publication `gh-pages` avec lease. Validation esthétique Android paysage uniquement par l'utilisateur.
