# Labo combat — L'ombre suit doucement le flottement idle des volants
Date : 21 octobre 2026.

## Validation et cible
L'auteur a explicitement validé les ombres des créatures au sol sur le moteur PR #44. Il constate que les créatures volantes font une oscillation verticale en idle (profil flying : bobY 8 px), mais leur ombre statique reste visuellement décorrélée.

## Contrat : une seule animation, deux pistes déjà existantes
Le propriétaire Animation Core `planAnimation` produit déjà `idle-out/idle-home` (ou l'alternance) avec une transformation du corps et des données `ground` au sein des mêmes segments. `createAnimationPlan` transmet déjà `ground.translateY` et `ground.scale`. `animationPlanToDomTimeline` et `DomActorRenderer` possèdent et synchronisent les deux pistes WAAPI existantes.

Pour les profils `locomotion.style = "flight"` seulement :
- Réutiliser `idle.bobY` existant, sans animation supplémentaire ni détection de hauteur par polling.
- À l'apex de l'idle : ombre déplacée de `bobY * 0.18` vers le haut (1,44 px pour 8 px de flottement), et échelle de 0,975 par rapport à la base (contraction discrète).
- Au milieu/retour : translation nulle, échelle exactement 1 ; même durée, mêmes easings et offsets que le corps.
- `idle.shadowResponse` dans le seul profil `flying.profile.json` permet à terme d'ajuster ces **paramètres de profil**, sans imposer d'édition à chaque créature. Defaults identiques dans le propriétaire pour les autres profils flight.
- Limites bornées (fraction 0–0,35 et échelle 0,85–1) pour éviter les projections irréalistes et conserver les performances mobiles.

Les bipèdes, quadrupèdes, volants hors idle (esquive, approche, attaque aérienne, KO), la projection de lumière 2.5D, son pivot alpha et le mode d'ombre restent strictement inchangés. Aucune règle spéciale Scarabacier ou asset modifié.

## Sentinelles
Unité : profil joueur 1,7×, adversaire 0,95×, morphologies au sol, alternance, bobY=0, bornes, durées et keyframes, une seule paire de pistes WAAPI, annulation/dispose. Navigateur réel : instance volante dans le montage existant, lecture des deux pistes via `getAnimations()`, synchronisme et contraste des déplacements 8 px / 1,44 px, contraction de l'ombre et retour exact. Les tests existants de contact/projection et CI cinq jobs sont incontournables.

## Publication
Branche distincte `work/lab-flying-idle-shadow-sync-2026-10-21` depuis le checkpoint de départ. PR, sentinelles et CI 5/5 avant checkpoint GREEN technique et fusion vers gh-pages. Contrôle artistique tactile Android restera à faire.
