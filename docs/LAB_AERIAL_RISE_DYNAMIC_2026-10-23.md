# Attaque aérienne — montée plus vive, piqué inchangé (2026-10-23)

## Retour auteur
La trajectoire du piqué et la traversée sont acceptables. La montée devrait être plus vive et plus rapide, **sans modifier la vitesse actuelle du trajet qui suit**.

## Choix de responsabilité
Le propriétaire unique du mouvement demeure `src/core/animation/plan-animation.js`. Le preset déclaratif `specialMoves.aerial.riseEasing` est ajouté dans les **cinq profils existants**, avec la valeur identique `cubic-bezier(0.25, 0.65, 0.35, 1)`.

L'ancien `cubic-bezier(0.42, 0, 0.58, 1)` restait lent au décollage et accélérait au milieu de la montée. La nouvelle courbe déplace une part nettement plus importante du dénivelé dans le début du même segment, avant une stabilisation fluide près de l'apex. À un quart de la phase de montée, la progression verticale passe approximativement de **13 % à 59 %**. Elle ne devient ni instantanée ni sautée.

Les limites des phases ne changent **pas** : `riseMs = round(travelMs * riseRatio)`, `diveMs = travelMs - riseMs`. `riseRatio=0.64` reste en place, tout comme `diveEasing="ease-in"`, la position du piqué prolongé `followThroughRatio=0.35` et la durée `returnMs`.

Il s'agit donc d'une **accélération visuelle de la montée en début de phase**, pas d'un raccourcissement du temps total d'action. Ce choix est essentiel pour conserver le contrat déjà réparé `CombatRuntime` : présence `airborne` pendant le vol, premier contact et dégâts réels, puis fin du déplacement à l'instant original. La phase de descente conserve strictement la vitesse et la durée précédentes.

## Zones protégées
- Un seul plan Animation Core et sa projection WAAPI Body+Shadow ; aucun timer, second animateur ou délai fictif de gameplay.
- Aucune modification des compétences utilisateur, créatures, assets, collisions, dégâts, interruptions, combat 1v1/2v2, audio, scène ou moteur de combat.
- Les modes ground/teleport/burrow demeurent inchangés.

## Tests
`tests/unit/aerial-rise-dynamic-2026-10-23.test.mjs` charge les cinq véritables profils et vérifie :
- le profil historique sans `riseEasing` conserve la courbe précédente ;
- le gain de montée à un quart du temps est significatif et non instantané ;
- les positions Body+Shadow, l'ombre au camp de départ, le piqué, sa traversée, sa durée et le retour sont **strictement inchangés** ;
- les keyframes du renderer reçoivent la nouvelle courbe seulement à l'ascension.

Critères de livraison : CI complète (foundation + quatre jobs navigateur), checkpoint GREEN sur le SHA exact et publication PR vers `gh-pages`. La préférence de sensation de vitesse reste à confirmer en essai Android par l'auteur.
