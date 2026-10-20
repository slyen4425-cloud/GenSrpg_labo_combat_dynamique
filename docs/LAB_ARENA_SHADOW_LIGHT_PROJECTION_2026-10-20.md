# Labo Combat — lumière d'arène et ombre projetée 2.5D (prototype de test)
Date : 20 octobre 2026.

## Pourquoi remplacer l'ellipse automatique
Retour utilisateur : l'ombre de Scarabacier restait visuellement incohérente malgré son centrage (PR #39) ; les créatures volantes et les sauts doivent conserver une projection au sol. Un centre calculé depuis un sprite n'est pas une identification anatomique des pattes : cette limite n'est pas masquée.

## Périmètre et autorité
- **Un seul état de lumière d'arène**, `arenaLight`, lu depuis les contrôles tactiles de la *prévisualisation* par `mountCombatDemo`. Pas de second registre persistant ni modification d'export auteur.
- **Un seul propriétaire des données de silhouette** : masque alpha déjà obtenu par `VisibleModelCollision`. Aucun autre chargement d'image, seconde collision ou couche de jeu.
- **Un seul noeud d'ombre par créature**, le `[data-demo-shadow]` existant. `DomActorRenderer` garde seul l'animation temporelle de son transform et son opacité pendant les actions. La direction/forme projetée n'animera pas le combattant ni n'affectera les dégâts.
- **Un seul calculateur statique** : `groundShadowLayoutFromOpaqueMaskV2` garde largeur/centre d'appui/contact ; `dom-shadow-light-v1.js` projette les paramètres de lumière et dérive un SVG-masque 64×64 maximum des pixels alpha du masque de collision. Le `::before` de l'unique élément d'ombre dessine la silhouette aplatie.
- `createSlot.applyShadowLight` est le seul point de transfert CSS ; aucun override par créature, pas de deuxième boucle `requestAnimationFrame`, pas de timer indépendant ni de nouvelle timeline.

## Essais tactiles
Au lancement du combat de test, ouvrir **☀ Lumière / ombres** (en haut à gauche) et comparer :
1. « Silhouette projetée » (nouveau rendu 2.5D par défaut) ;
2. « Ombre douce (ellipse) » ;
3. « Ombre de contact (ancienne) ».
Les curseurs changent immédiatement direction/azimut, hauteur/élévation, douceur, intensité et **hauteur de vol simulée**. Ils pilotent une lumière partagée pour tous les combattants. Une nouvelle créature chargée reprend la même lumière. Les réglages ne modifient pas les fichiers créatures/compétences ni le gameplay et **ne sont pas persistants** (prototype à valider artistiquement).

## Vol et mobilité
Le profil `locomotion.style="flight"` utilise une hauteur de vol simulée et donc une projection plus éloignée, étirée et diffuse. Les sauts et attaques aériennes conservent la trajectoire au sol *déjà* calculée et animée par `Animation Core -> DomActorRenderer` ; la silhouette reste au sol lorsque le sprite prend de l'altitude. La variation continue de projection selon chaque hauteur de frame n'est **pas encore** intégrée : une future phase devrait obtenir cette hauteur directement des segments existants, sans horloge parallèle. L'ombre 2.5D n'est pas une ombre anatomique 3D.

## Sécurité et performances
- Conversion du masque alpha acceptée en petits segments SVG horizontaux, au plus 64×64, une fois par changement de sprite ; aucun échantillonnage per-frame ni image tierce.
- SVG autonome sans script, image externe ni lien. Si un sprite est sans alpha opaque, le mode de silhouette revient explicitement à l'ellipse douce, sans inventer de faux pixels.
- Le chargement de l'arène masquée reste indépendant des coordonnées DOM : utilise `collisionModel.opaqueMask`, prévenant la régression PR #37.
- Pas de changement à `main`, `global-assets`, aux exports, au moteur de dégâts, aux profils, au catalogue d'assets, au moteur de collision ni au plan de mouvement.

## Validation
Sentinelles `combat-shadow-arena-light-projection-2026-10-20` : modèle pur, directions inversées, élévation, vol, alpha SVG local, modes, propriétaire unique, UI, 1v1/2v2, ancien bug « arène masquée ». Les sentinelles précédentes sont adaptées à la relocalisation du *propriétaire CSS*, sans perdre leur exigence de garantie unique. CI complète 5 jobs et Pages puis essai Android à valider par l'auteur avec Scarabacier, volant, 1v1/2v2, mouvement, esquive, attaque et rappel.

**Limitation annoncée** : la projection est une approximation 2.5D, non une simulation des volumes des pattes ; le point d'appui individuel par vue et la persistance des réglages devront faire l'objet d'un lot contractuel distinct si nécessaire.
