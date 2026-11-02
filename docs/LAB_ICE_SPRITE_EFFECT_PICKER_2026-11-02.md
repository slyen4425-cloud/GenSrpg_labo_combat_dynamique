# Labo Combat — Sprite Pointe de glace et éditeur d'effets lisible (2 novembre 2026)

## Problèmes reproduits
- L'asset canonique `pack:capture:sprite-pointe-glace-01` (« Pointe de glace — éruption (Glace, 12f) ») est un Impact et n'était pas admissible dans le menu Trajet/Projectile. Il se trouve dans `global-assets` sous `capture/sprites/skills/glace_suite/pointe_glace/pointe_glace_atlas_12f.webp`, 2 623 096 octets, avec preview GIF.
- L'écran proposait à la fois un menu générique d'ajout et des blocs séparés Charge, Charge d'effets, Canalisation, Maintien, d'où la difficulté à savoir où régler quoi.

## Décision : une seule autorité
- La PR #203 donne au même asset `compatibility.editorRoles:["travel"]` dans le seul catalogue global-assets, sans modifier sa catégorie Impact ni ses frames. Le rendu Trajet sous la cible réutilise cet asset comme une animation de pic au sol, mais la compétence canalisée reste `form:area`, `channeling.effects` possédant seuls les dégâts.
- Le menu de création des effets est dérivé des `SKILL_EFFECT_V1_KINDS` déjà validés. Choisir un effet ajoute une vraie ligne d'éditeur existante (y compris statut, zones, drains, mines et marqueurs). Les panneaux des mécanismes de charge et maintien/canalisation sont repliables et s'ouvrent avec les choix correspondants. On ne duplique ni les données, ni les timers, ni les formulaires de configuration.
- Les boutons historiques d'ajout restent disponibles pour la compatibilité des parcours auteur. Un ajout sous canalisation utilise la liste officielle de pulsations et refuse les kinds non pris en charge plutôt que de produire un second dommage initial. Aucune migration automatique des capacités existantes.

## Branches, exclusions, tests
- UI : `gh-pages@42d5093706fb0ec68e7f6bd6a2e0a440e6e9a046`, checkpoint `checkpoint/lab-start-ice-sprite-effect-picker-2026-11-02`, travail `work/lab-ice-sprite-effect-picker-2026-11-02`.
- Médias : `global-assets@1cc24f0c179680a3d88bdfefbc97819669080454`, checkpoint `checkpoint/lab-start-ice-asset-role-2026-11-02`, PR #203 et fusion `e07f2c6270ebf9e8761dee005781b51d601e0e25`.
- Propriétaires modifiés : UI capture, HTML/bootstrap, version du catalogue, tests unitaires/navigateur. Moteurs Combat, JSON de capacités auteur, GenSrpg, Exploration, main, atlas binaires et sources de médias non modifiés.
- TDD RED : `072ed39ffc1b79b11e9bca5eda43ddc9a73b39d1`, workflow `41451857180` échoué intentionnellement ; tests post-code : vérification de l'invariant Impact+Travel sans recopier l'asset, contrôle du menu pour les types canoniques, vraie saisie statut et sélection du sprite officiel dans le navigateur.
- Ne déclarer GREEN technique qu'après tests complets du SHA de code ET docs, checkpoint, PR gh-pages, puis CI/Pages postfusion. Essai visuel et tactile Android requis indépendamment.
