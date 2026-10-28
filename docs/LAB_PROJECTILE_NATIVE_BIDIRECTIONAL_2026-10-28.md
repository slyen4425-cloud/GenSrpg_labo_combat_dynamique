# Combat Lab — orientation native gauche/droite des projectiles (2026-10-28)

## Cause et source réelle
Après les PR #118-120, les atlas récents dirigés à droite ont été corrigés. Mais le sprite historique « Boule de feu » `pack:capture:sprite-fireball-travel-01` est un vrai PNG `sprite_skill_fireball_travel_rl_atlas_01.png` créé en direction gauche (tête à gauche, traînée à droite), contrairement à Graine sansue, Crachat acide, Aile acier ou Rafale, qui pointent à droite.

La source canonique `global-assets/data/assets/catalog/global-visual-assets.v1.json` contient déjà pour Boule de feu `resource.headingRad: 3.141592653589793` sur la base utilisée. Cette métadonnée a été préservée, sans réécrire le média ni les autres catalogues. La sentinelle `tests/unit/projectile-left-facing-source-2026-10-28.test.mjs` a été ajoutée dans la PR média #123, en complément des anciennes sentinelles des sprites dirigés vers la droite. Elle était verte dès la base actuelle : aucun TDD RED n'est revendiqué pour le catalogue.

## Régression réelle et TDD RED
Le propriétaire `DomSkillFxRenderer` testait `deltaX < 0` pour le miroir horizontal, sans tenir compte du cap natif. La conséquence : un sprite natif gauche tiré par le joueur vers la droite reste à gauche, tandis que l'adversaire le retourne inutilement.

Le test `tests/unit/projectile-sprite-orientation-v1.test.mjs` a été ajouté AVANT l'implémentation (commit RED `45ef7b4`), puis le renderer a été corrigé sur la même branche du labo. Aucune condition par nom de compétence ou camp.

## Correctif soustractif et autorité unique
- Le seul `headingRad` du catalogue média renseigne le sens natif, de gauche ou de droite.
- Le seul `DomSkillFxRenderer` compare le signe de la trajectoire réelle à `cos(headingRad)` et n'applique `scaleX(-1)` que lorsque ces sens diffèrent.
- Les sprites nativement à droite gardent exactement leur formule de rotation antérieure.
- Les sprites nativement à gauche calculent un petit angle autour de leur orientation native, avec normalisation circulaire pour ne jamais tourner de ~360°.
- Le renvoi Miroir reprend le même renderer et son véritable `contactPoint` : aucun second chemin de tir.
- Les sprites non directionnels, les chutes verticales, les dégâts, le ciblage, les durées, les collisions, la source d'assets et l'IA sont intacts.

## Tests sur la vraie chaîne
- Test unitaire du sprite natif gauche, tirs joueur/adversaire ; anciennes sentinelles des sprites droits maintenues.
- Test historique `tests/unit/skill-fx.test.mjs` actualisé : pour le vrai sprite Boule de feu, le tir joueur doit être un miroir horizontal et non une rotation de 180°.
- Test Chromium `tests/browser/capture-creature-library-smoke.mjs` : catalogue réel `GLOBAL_VISUAL_LIBRARY.catalogUrl` (pas de métadonnée fictive), chargement des transferts auteur, Graine sansue + Boule de feu dans les deux directions, renvoi Miroir depuis les deux bords, maintien de Tornade neutre.
- `coupe_feuille` utilise réellement `form:beam` ; le navigateur vérifie donc le renderer beam, pas un faux projectile.
- Révision de cache `2026-10-28-v44-projectile-native-bidirectional` commune aux modules éditeur / prévisualisation / 2v2, pour actualiser le renderer et le même catalogue global-assets.

## Checkpoints et publication
- Départ `gh-pages@2ce536888d8dc552017958cc94082c36114b2049`, `global-assets@8ff0f81c89a9fd55ecc889e89c3ca2bbb356095b`.
- START et WORK nommés `lab-projectile-native-left-facing` sur les deux branches.
- PR média #123 : ajout de la sentinelle, aucun pixel/catalogue modifié ; média GREEN technique sur sa branche, fusion `0233463a`.
- PR rendu #124 : version v44 sur la branche temporaire ; Foundation + quatre Chromium doivent réussir au **même SHA final**, checkpoint GREEN puis fusion vers `gh-pages` et Pages SUCCESS.
- Contrôle visuel sur le smartphone de l'auteur après publication ; ne pas confondre CI avec validation artistique réelle.
