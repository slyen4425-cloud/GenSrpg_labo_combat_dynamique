# Sylvorne — taille et effets de combat (2026-11-11)

- Checkpoint : `main@6e9682267c02c653c4100c08592284ddfd996284`, branche de travail `work/lab-sylvorne-combat-fx-scale-2026-11-11`.
- **Créature concernée : Sylvorne (crea_sylvorne), pas Sylvaroc.** Vues joueur 1,18→1,60 et adversaire 0,85→1,16, ancrage au sol inchangé.
- Ressources FX du catalogue officiel `global-assets`, sans copie ni nouveau registre : projectile épines, cast Nature, impact Nature et carapace de pierre.
- Mine native : marqueur au sol élargi de **30 % sur chaque dimension** (42×19→54,6×24,7). Pas d'élargissement du rayon de dégâts. Le sprite d'impact Nature passe par l'événement `impact` déjà déclenché sur l'explosion.
- Gameplay conservé : dégâts 15 Nature, énergie 4, délai 2 secondes, entrave liée à Germination ; caractéristiques et attaques des autres créatures inchangées.
- Dépendance : tests unitaires, tests navigateur, CI complète sur SHA exact ; publier seulement après GREEN.
