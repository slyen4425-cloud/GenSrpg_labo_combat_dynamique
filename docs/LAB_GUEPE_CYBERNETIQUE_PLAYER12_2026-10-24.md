# Guêpe cybernétique — vol et attaque PLAYER (12f) — 2026-10-24

Source officielle auteur approuvée: \`_incoming/GUEPE_CYBERNETIQUE_MOUVEMENT_ATTAQUE_12F_NETTOYES.zip\` (13 036 446 octets), SHA256 \`3912ff41f69f0e999ee47abf834030e19f2a991ec30ede72cad26156515f4923\`, Git blob \`ef16670bf80892dbb550125d4709b5beb23562b1\`, CRC ZIP OK. La source contient deux séquences de 12 PNG RGBA en 512×512, 2 strips WebP 4608×384, deux aperçus GIF à 12 poses, deux WebP animés, deux planches RGBA et un manifeste attestant la suppression ciblée des artefacts lumineux à gauche, sans modification RGB des pixels conservés.

La créature référencée est \`guepe_cybernetique\`, vue \`player\` (3/4 dos, modèle \`guepe_cybernetique_player.webp\`), et non \`opponent\`. Destination \`assets/library/capture/creatures/guepe_cybernetique/animations/{movement,attack}/player/\`. Deux IDs stables \`pack:capture:creature-guepe-cybernetique-movement-player-12-v1\` et \`pack:capture:creature-guepe-cybernetique-attack-player-12-v1\`. Vol en boucle et attaque jouée une fois, 100 ms/frame. Les aperçus GIF peuvent boucler même si l'attaque ne boucle pas en combat.

Exploitation des fichiers PNG **octet pour octet**, sans interpolation ni refonte ni recoloration : 24 fichiers PNG, 2 atlas, 6 aperçus, 2 manifestes, manifeste de nettoyage source, 35 médias, 2 nouveaux IDs dans \`data/assets/catalog/global-visual-assets.v1.json\`. Contrôle réel des dimensions, alpha, marges >=70 px, hashes contre le manifeste auteur et previews animées.

Périmètre de sécurité : base \`global-assets@dd45ec7848aed0aa60136cd064eaa905f4cddd95\` (CI 40128651363 SUCCESS), checkpoint départ \`checkpoint/global-assets-before-guepe-cybernetique-player12-2026-10-24\`, branche \`work/global-assets-guepe-cybernetique-player12-2026-10-24\`. Aucune modification des modèles runtime, des autres créatures, du gameplay, de l'UI, de \`main\`, \`gh-pages\` ou de GenSrpG. Catalogue accessible dans l'éditeur quand le catalogue distant est chargé ; **pas d'affectation automatique** dans la fiche de la guêpe, ni de validation mobile présumée.

Validation exigée: importeur GH Actions et \`npm run ci\`, CI sur le SHA réel incluant les médias, contrôle diff, checkpoint GREEN exact, fast-forward sous lease vers \`global-assets\`, puis contrôle CI après publication. Preview artistique en jeu par l'auteur.

## Import réel et validation

- Import automatisé GitHub Actions run `40129096598` : **SUCCESS** après correction ciblée d'un test d'opacité trop strict (trois poses RGBA ont un maximum alpha de 253/254 au lieu de 255, sans défaut de rendu). Premier run `40128975882` rouge pour cette seule assertion ; aucun média n'avait été committé. Le correctif n'a modifié aucun pixel.
- Les 35 médias physiques ont été ajoutés par le commit `29084f58a3d16cae5077b05f8243a6020f497978` : 24 PNG RGBA 512×512 octet pour octet issus du ZIP, 2 strips WebP 4608×384, 6 previews GIF/WebP/planche et 3 manifestes. Hash original ZIP et 24 empreintes PNG vérifiés ; 12 frames distinctes par séquence, marges alpha minimales 75 px (mouvement) et 75 px (attaque).
- Catalogue work : **233 assets, 132 sprites, 44 créatures** ; deux nouveaux IDs uniques résolvent les vrais atlas en `view=player`. Le `npm run ci` de l'importeur est passé avant le commit média.
- Diff work vs base : **42 fichiers** strictement dans le périmètre, dont 40 nouveaux et 2 modifiés (catalogue + journal). Aucun changement de runtime guêpe, d'une autre créature, du moteur ni de la fiche auteur.
- Reste avant publication : CI séparée du SHA **final incluant médias et documentation**, checkpoint GREEN et fast-forward `global-assets` sous lease. La validation mobile en jeu reste distincte.
