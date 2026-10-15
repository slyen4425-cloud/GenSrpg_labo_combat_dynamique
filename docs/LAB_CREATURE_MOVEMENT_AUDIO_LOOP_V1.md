# Labo Combat — Répétition du son de déplacement aérien V1

15 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
Base de production `gh-pages@ffd5b6d9abfa42bbd0b663ec8ccb0ca19bb55e0e` (GREEN du modificateur universel des dégâts).
Checkpoint initial : `checkpoint/lab-start-creature-movement-audio-loop-v1-2026-10-15`.
Branche de travail : `work/lab-creature-movement-audio-loop-v1-2026-10-15`.

## Une seule autorité sonore : la créature
Le champ existant `CreaturePresentationBinding.audio.movement` conserve son `assetId` et `volume`. Deux champs **optionnels** sont ajoutés uniquement à ce rôle :
- `mode: "once"` (défaut implicite pour tous les anciens exports, pas de migration destructive) : un son par cue de pas, ou une fois au début d'un vol.
- `mode: "repeat"` avec `repeatIntervalMs` entier de 100 à 5000, défaut 400 : nouveau déclenchement après **fin** de l'échantillon précédent, plus la pause réglée. Aucun recouvrement systématique de samples.
- `mode: "loop"` : la même lecture audio boucle pendant le déplacement aérien, sans timer de répétition.
Le Human Editor présente ces options dans **Créature > Sons de la créature**, à côté du sélecteur de son « Pas / déplacement ». Les champs sont conservés dans l'export/import créature V1, V2/V3 utilisant le même contrat de présentation.

## Raccord moteur sans doublon
`DomCombatAudio.movementForCreature(actorSlot)` est un **lecteur** du propriétaire actuel, pas un nouveau registre.
`CombatResolutionPresenter` utilise ses `footfall` natifs et le scheduler existant pour l'approche de type `aerial`, seulement pour les attaques contact avec un trajet positif. Pour `repeat`, une unique prochaine répétition est planifiée après fin du son précédent (pause configurable), l'horloge audio n'intervient jamais dans les dégâts, cooldowns ni positions.
Les approches au sol continuent à jouer chaque contact (2 bonds, 4 pas, etc.), même si une créature a configuré `repeat` ou `loop`. Les projectiles, rayons et sons de cast/impact gardent le propriétaire compétence.
À la fin de l'approche ou au résultat sémantique, le loop et les répétitions sont arrêtés et les timers de répétition supprimés. Une interruption, un rappel, une annulation visuelle ou dispose invalide le token et arrête les sons actifs. Les anciens one-shots continuent normalement jusqu'à leur fin naturelle au moment de l'impact.

## Tests et livraison
`tests/unit/creature-movement-audio-loop-v1.test.mjs` : rétrocompatibilité du Dracendre, transfert et validation des nouveaux champs, mode repeat avec intervalle après lecture, interruption, loop et arrêt sémantique, pas terrestre, projectile indépendant, vrai DomCombatAudio et interface.
Sentinelles précédentes `creature-owned-movement-audio-v1` et `contact-approach-footstep-audio-v1` conservées et adaptées pour les nouvelles expressions tout en gardant leurs invariants comportementaux.

Pas de nouveau média physique ni de nouvel `assetId` : la configuration réutilise la banque sonore actuelle. Aucune prétention d'une validation à l'oreille du mp3 ni validation tactile Android : auteur à vérifier après déploiement. Aucune modification au dépôt principal, exploration, `main`, `global-assets` ni aux exports auteur de créatures ou compétences.

Critère GREEN : Foundation + Firestorm Chromium + Creature Library Chromium SUCCESS au SHA final, checkpoint final, preview et fast-forward sous lease, CI et Pages après publication.
