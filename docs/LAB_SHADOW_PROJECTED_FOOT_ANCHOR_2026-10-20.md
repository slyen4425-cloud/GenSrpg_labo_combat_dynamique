# Labo combat — Ancrage de l'ombre projetée aux points d'appui
Date : 20 octobre 2026

## Retour et cause
La photo du Loup volcanique côté joueur montrait une silhouette noire dont les proportions et la projection semblaient plausibles mais dont le point d'appui restait décalé. Le prototype PR #40 utilisait pour les silhouettes de taille 100% la propriété `bottomPct` conçue pour une petite ellipse, tout en écrasant son pseudo-masque depuis `center bottom`. L'origine de projection ne correspondait donc pas aux pattes du masque alpha, surtout pour les poses basses et asymétriques.

## Correction sans autorité supplémentaire
- Le modèle `groundShadowLayoutFromOpaqueMaskV2` retourne `contactYPct` et `contactXPct` depuis les pixels les plus bas du même masque alpha de collision. Le `centerXPct` historique de l'ellipse reste inchangé. `bottomPct` reste inchangé pour les anciennes ellipses.
- En mode silhouette, le seul élément `[data-demo-shadow]` occupe le cadre du sprite et revient à `bottom:0%` : on n'applique pas une seconde fois le décalage prévu pour l'ellipse.
- Le pseudo-élément SVG conserve l'unique projection 2.5D existante, mais son origine de transformation est le contact calculé `(centerXPct,contactYPct)`, et non le bas géométrique de l'image. Le trajet de l'ombre animé par `DomActorRenderer` n'est pas modifié.
- Modes `soft`/`contact` : largeur, hauteur, position, opacité et animation antérieures inchangées. Vol : même calcul de masque + décalage lumineux existant, sans deuxième logique.
- Masque vide : point d'appui neutre, affichage ellipse douce déjà prévu.

## Périmètre
`src/adapters/renderer/dom-ground-shadow-v2.js`, `src/ui/demo-app.js`, `examples/dom-demo/demo.css`, test unitaire dédié et sentinelle Chrome du même rendu réel. Aucun ajustement par ID de créature, aucun changement aux exports, au gameplay, à `main` ni à `global-assets`.

## Tests et validation visuelle
Exécuter `node --test tests/unit/combat-shadow-projected-foot-anchor-2026-10-20.test.mjs`, les sentinelles antérieures d'ombres puis la CI cinq jobs. La sentinelle Chrome réelle vérifie que les silhouettes sont alignées au cadre sprite, pivotent sur le point d'appui et restent réversibles en mode contact.
Validation artistique distincte sur téléphone : Loup volcanique côté joueur puis opposant, Scarabacier (penché), volant, 1v1/2v2, déplacement/esquive/rappel. Si persiste une dissociation entre pattes et contact, traiter dans un lot distinct des appuis configurables par vue, sans augmenter les offsets globaux à l'aveugle.

## Suite distincte
Déplacer les commandes de lumière depuis la fenêtre de combat vers **Éditeur > Combat** par un lot UI après validation du raccord et des tests. La lumière doit rester unique et commune à l'arène, sans être copiée dans chaque fiche créature.
