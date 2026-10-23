# Ombres au sol — consolidation de l'autorité de contact (23 octobre 2026)

## Retour auteur
La créature Venombre semble flotter, même si elle est bipède. Tous les personnages créés ultérieurement doivent avoir une ombre fiable ; pas de traitement par identifiant d'espèce, pas de double renderer ni de masque cachant le problème.

## Diagnostic source et distinction
Le fichier auteur transmis utilisait `crea_tox_2.presentation.profileId="quadruped"`, corrigé en `biped` dans le catalogue actif (PR #81). **Cela ne classait pourtant pas Venombre comme aérien** : le moteur ne classait que `locomotion.style === "flight"` ou un second test de nom `actor.profile === "flying"`.

Il existait un deuxième problème de précision, indépendant du nom de Venombre :
- `shadowGeometryFromOpaqueMaskV2` calcule le véritable appui probable depuis les regroupements de l'enveloppe basse, sous `supports.yRatio` ;
- la silhouette projetée positionne son pivot depuis ce support ;
- mais la petite ellipse utilise `geometry.contactYRatio` calculé séparément depuis `yBounds.end`, le bas du contour opaque. Une queue, une aile ou un effet bas peut être à une autre hauteur que les pattes.

Les deux modes et les morphologies (bipède, quadrupède, massif, rampant, volant) pouvaient donc diverger même en partageant le même masque alpha.

## Correction
1. `src/adapters/renderer/dom-ground-shadow-v2.js` définit `geometry.contactYRatio = supports.yRatio` : l'unique appui de la silhouette existante alimente **les deux modes**. Le `bottomPct` de l'ellipse et le pivot `contactYPct` dérivent désormais strictement de la même grandeur. Aucun nouveau calcul d'ombre ni paramètre spécifique Venombre.
2. `src/ui/demo-app.js` ne déduit `flying` que du **style de locomotion du profil enregistré**. Le nom `actor.profile` n'est plus une seconde autorité de classification.
3. La projection de la lumière, le masque et son cache, le modèle de collision, la hauteur native en déplacement/attaque, les mêmes éléments DOM/CSS et le renderer d'Animation Core restent inchangés.

## Limites honnêtes
Le repérage automatique des pattes à partir d'une silhouette 2D est une estimation. Des dessins avec queue ou accessoires plus bas que les pieds, plusieurs contacts à hauteurs différentes ou personnages entièrement lévitants peuvent demander ultérieurement un **point d'appui explicite et configurable par l'auteur** dans le contrat de présentation, après un lot de conception dédié. Rien ici ne prétend déduire parfaitement l'anatomie de toutes les images depuis leurs seuls pixels.

## Validation
Sentinelles synthétiques : silhouette bipède asymétrique, appendice bas, cohérence mathématique ellipse/projeté, cinq profils vol/sol, Venombre profil bipède, fallback vide. Régressions existantes pour ombres, orientation, animation, largeur de profil, collision et chargement. CI Foundation + quatre navigateurs requise. Test visuel réel sur Venombre face/dos et Pixel de l'auteur reste distinct.
