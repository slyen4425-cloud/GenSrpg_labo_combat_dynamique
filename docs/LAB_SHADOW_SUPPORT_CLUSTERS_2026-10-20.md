# Labo combat — Détection automatique des groupes d'appuis
Date : 20 octobre 2026.

## Retour utilisateur et diagnostic réel
Après PR #41, le Loup volcanique est mieux ancré mais Scarabacier ne l'est pas. Les deux vues WebP de Scarabacier (`global-assets/assets/library/capture/creatures/scarabacier/runtime/`), ainsi que l'image du Loup volcanique ont été inspectées depuis les octets GitHub ; les modèles ont plusieurs appendices proches du sol, des pattes de largeur réduite et, pour Scarabacier, des pinces dont le bas ne désigne pas nécessairement une surface d'appui.

Le précédent pivot de projection, calculé par moyenne de tous les pixels des 30 % inférieurs de la silhouette, reste influencé par la masse du ventre, les pinces et les ailes. Le trim de 2 % des pixels opaques, utilisé pour la géométrie de l'ellipse, peut exclure des appuis fins.

## Micro-lot (sans modèle spécifique)
`src/adapters/renderer/dom-ground-shadow-v2.js` reste l'unique calculateur de géométrie. Pendant le scan **déjà existant** du masque opaque de collision, il conserve la dernière ligne visible de chaque colonne.

Une fonction pure privée `lowerEnvelopeSupportsV3` :
1. repère les extrémités basses avec présence voisine horizontalement ;
2. choisit une ligne de référence robuste (95e percentile de ces extrémités) afin d'écarter les artefacts clairsemés ;
3. ne conserve que des groupes de colonnes adjacentes dans une étroite bande verticale autour de ce sol probable ;
4. rejette les groupes trop étroits, puis combine les centres de plusieurs appuis sans pondérer chaque pixel du torse ;
5. retourne le pivot `contactXPct/contactYPct` du **même masque** pour le SVG d'ombre existant.

La géométrie et le bas de l'ancienne ellipse (`centerXPct`, `bottomPct`) ne changent pas. Mode silhouette, éclairage global dans l'onglet Combat, projection de vol, animation depuis `DomActorRenderer`, collision, HUD et sprites restent inchangés. Calcul à l'initialisation de l'image, linéaire en pixels, sans nouvelle boucle/timer.

Si aucun groupe crédible n'est détecté (taille minuscule, masque vide, silhouette atypique), repli sur l'ancien pivot. **Il n'y a pas de reconnaissance sémantique certaine de pattes par une image 2D** ; la validation visuelle reste nécessaire, et un futur petit ajustement optionnel par vue ne devra être étudié que pour les véritables exceptions.

## Test et preuve
Nouveau test `tests/unit/combat-shadow-support-clusters-2026-10-20.test.mjs` avec régression initiale RED sur l'ancien code, scénarios : insecte lourd/pinces soulevées, quadrupède multi-appui, effet miroir joueur/opposant, bruit alpha, pattes fines et image vide. Les sentinelles PR #37/#39/#40/#41/#42 et le navigateur réel via son raccord d'origine doivent également passer. Le test ne modifie aucune donnée d'auteur ni aucun asset.

Validation attendue : CI 5/5 et checkpoint GREEN technique sur SHA exact, publication Pages ; contrôle artistique sur Android avec Scarabacier joueur/adversaire, Loup, volant, déplacement, attaque, esquive, 1v1 et 2v2, distinct de la seule validation technique.
