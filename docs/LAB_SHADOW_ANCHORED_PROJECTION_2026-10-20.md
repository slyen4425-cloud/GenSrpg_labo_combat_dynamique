# Labo Combat — Projection d'ombre verrouillée au contact du sol
Date : 20 octobre 2026

## Déclencheur
Captures utilisateur `7975.png` et `7976.png` (Scarabacier 1,7× côté joueur contre Loup) : ombre détachée sous la créature malgré la détection multi-appuis PR #43. Les pattes semblent suspendues à plusieurs dizaines de pixels au-dessus de l'ombre. Ce défaut apparaît aussi, plus légèrement, sur le Loup.

## Cause dans le vrai renderer
`groundShadowLayoutFromOpaqueMaskV2` a déjà un point d'appui alpha `contactXPct/contactYPct`. Mais `examples/dom-demo/demo.css` réalisait **après** ce calcul :
```css
transform: translate(var(--shadow-light-cast-x), var(--shadow-light-cast-y))
           skewX(...) scaleY(...);
```
Cette translation est appliquée uniformément **à tous les pixels de l'ombre**, y compris ceux du pied. Même un ancrage alpha exact ne peut donc plus coïncider avec la patte. Le déplacement en pixels augmente avec `actor.scale`; Scarabacier 1,7× révèle le défaut mieux que le Loup 1,2×. Ajouter un nouveau détecteur anatomique n'y change rien.

## Correction architecture
- Garder le calcul d'appuis PR #43 et le mode 1 silhouette/1 mask/1 shadow node.
- Garder `transform-origin` au pivot de contact. En mode silhouette, **supprimer la translation rigide** du pseudo-masque.
- Convertir dans le calculateur de lumière existant la portée lumineuse `castXPct` en un `skewDeg` directionnel qui déforme seulement les parties éloignées du point de contact ; `skewX` et `scaleY` ont leur pivot sur l'appui. Le pied ne bouge jamais pendant le réglage de direction.
- Le signe, la portée, la hauteur de vol et l'élévation sont toujours contrôlés par la lumière globale. Les champs `castXPct/castYPct` subsistent pour compatibilité de l'API et diagnostic ; la seconde composante reste non représentative d'un vrai volume 3D.
- Modes `contact` et `soft`, Animation Core, `DomActorRenderer`, mouvement, collision et exports intacts. Aucun cas particulier Scarabacier.

## Vérifications automatiques
- Nouveau test unitaire assure l'absence de `translate()` sur la silhouette, le pivot alpha, la cisaille directionnelle inversée et la portée majorée pour le vol.
- Sentinelle **Chromium réel** `tests/browser/shadow-light-fixture.html` : acteur joueur 1,7×, adversaire volant 0,95× ; compare la coordonnée écran du pivot sur le sprite et le noeud d'ombre ; vérifie que la matrice du pseudo-élément n'a aucune translation et que le cisaillement s'inverse sans déplacer le pivot. Compatibilité ancien mode/contact et sans console Capture.
- Les anciens tests de projet #37–#43 et les cinq jobs CI restent obligatoires.
- Validation artistique Android des vraies images Scarabacier/Loup après déploiement. Un test géométrique vert ne remplace pas le jugement visuel ni une véritable perception 3D.
