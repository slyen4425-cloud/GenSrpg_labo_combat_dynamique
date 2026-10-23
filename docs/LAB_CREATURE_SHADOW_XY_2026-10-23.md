# Laboratoire combat — Réglage manuel X/Y de l'ombre par créature (23 octobre 2026)

## Motivation et diagnostic

Le correctif `shadow-ground-anchor` a aligné les ombres ellipse et silhouette sur un même point d'appui issu du masque alpha de l'image au repos. Une créature bipède avec longue queue basse, comme Venombre, peut cependant tromper cette approximation visuelle : une image aplatie ne permet pas toujours de distinguer une queue d'une patte. La classification locomotrice reste `biped`, sans aucun lien avec cet ajustement.

## Contrat

- L'éditeur propose **Apparence → Posture et perspective → Position de l'ombre**, avec deux valeurs X/Y entre −40 et +40 % du cadre image, positives vers la droite et le bas.
- **0 / 0 = mode automatique inchangé.** Les anciennes présentations V1–V9 restent valides et leurs valeurs conservées.
- Une valeur non nulle active le nouveau `CreaturePresentationBinding` **V10**, champ optionnel `shadowOffset:{x,y}` propre à la créature, sauvegardé/exporté via le même contrat Capture.
- Une fois la créature chargée, le même adaptateur exporte `shadowOffset` vers la métadonnée visuelle native de l'acteur. Le renderer existant lit uniquement cette métadonnée et calcule un seul layout avec la même image/masque alpha.
- Le mode contact (ellipse) reçoit un déplacement X/Y ; le mode silhouette reçoit une translation X/Y du calque projeté, sans altérer son masque, son point pivot anatomique, sa lumière ni ses transformations d'animation. La direction est identique entre les deux modes.
- Un changement du modèle/asset/reprise d'un personnage recharge son unique layout et remet les offsets à la nouvelle créature ; pas de valeurs persistantes dans la scène.
- Aucune valeur spécifique n'est codée pour Venombre ; l'auteur réglera face/dos sur Android et validera le rendu. Les deux vues partagent X/Y.

## Invariants protégés

Profil `biped`, altitude du vol, calcul des points d'appui du masque, géométrie des collisions, perspective du terrain, contact des projectiles, dégâts, animation mouvement, éclairage global, lecture des assets et profils ne changent pas. Une seule ombre DOM, une seule autorité de contact et aucune deuxième boucle.

## Vérification

`tests/unit/creature-shadow-manual-offset-2026-10-23.test.mjs` : anciennes valeurs et mode auto, conversion auteur → binding V10, rejet des valeurs invalides, silhouette à queue basse, calcul de décalage, export en source visuelle native et vérification du raccord UI/CSS. La CI complète doit être verte avant checkpoint GREEN. Validation visuelle Venombre sur Android indépendante de la CI.
