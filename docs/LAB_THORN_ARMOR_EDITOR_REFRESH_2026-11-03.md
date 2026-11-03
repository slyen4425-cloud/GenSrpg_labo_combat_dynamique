# Labo Combat — exposition de l'armure de ronces dans le sélecteur (2026-11-03)

- Source officielle à publier : `global-assets` avec `pack:capture:sprite-armure-ronces-plante-carnivore-01`, atlas `capture/sprites/skills/armure_ronces_plante_carnivore/atlases/armure_ronces_plante_carnivore_atlas_6f.webp`.
- Base de ce lot d'éditeur : `gh-pages@9e9d67ed1e340f8c9d820d48345d42585e8a9c86`.
- Checkpoint START : `checkpoint/lab-start-thorn-armor-selector-refresh-2026-11-03`.
- Branche de travail : `work/lab-thorn-armor-selector-refresh-2026-11-03`.
- Périmètre : maintenir l'unique `GLOBAL_VISUAL_LIBRARY`, changer sa révision v53 -> v54 seulement quand la PR `global-assets` de l'effet aura été fusionnée ; sentinelle resolver + préservation des sentinelles cache plus anciennes (assertions `vN+`, jamais `vN` exact pour un catalogue évolutif).
- Contrat media : animation masque seule de pointes, 6 frames 512 RGBA, atlas 3072 × 512 WebP sans perte ; `once`, `holdLastFrame` à index 5. Ne pas utiliser la preview composée avec la créature comme asset runtime.
- Propriétés protégées : créatures, compétences, JSON auteur, source Combat, autres assets, Exploration et GensRPG. Aucun auto-binding.
- Validation : tests unitaires + les cinq jobs CI sur SHA final, checkpoint GREEN, fusion vers `gh-pages`, déploiement Pages confirmé, résolution du vrai catalogue et aperçu public en navigateur.
- Attention : ce contrat est fondé sur la vue FACE adversaire. Un overlay dos joueur exigerait une création distincte, pas un miroir automatique.
- Publication : NON avant l'asset officiel et CI réussie.
