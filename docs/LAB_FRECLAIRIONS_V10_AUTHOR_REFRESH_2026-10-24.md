# Freclairions — synchronisation de l'export auteur V10 (24 octobre 2026)

## Source et autorité
L'auteur a transmis `gensrpg-capture-creature-crea_foudrillon.json`, fichier JSON UTF-8 de 5992 octets (SHA-256 `b6dc6a595d1ed1ab965eee8a0dbdd86b3d172258601fb1320e016b492c6e8fc3`). Le transfert utilise le même identifiant stable `crea_foudrillon`, affiché comme `Freclairions`, déjà présent une seule fois dans le catalogue Showcase.

- BASE : `gh-pages@e3632b5a7e24145064703bf0f870d71ff6659df8`.
- START : `checkpoint/lab-start-freclairions-v10-author-2026-10-24`.
- Branche de travail : `work/lab-freclairions-v10-author-2026-10-24`.
- Autorité active unique : `data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json` remplacé à l'identique.
- Archive de provenance, non chargée : `data/capture/source-exports/gensrpg-capture-creature-crea_foudrillon-2026-10-24.json`.
- Aucun changement de manifeste : Freclairions est déjà listé exactement une fois.

## Différence auteur V3 → V10
- Modèle Guêpe cybernétique FACE/DOS et icône conservés.
- Ajout de l'animation mouvement **DOS joueur** (`pack:capture:creature-guepe-cybernetique-movement-player-12-v1`).
- Ajout de l'animation attaque **DOS joueur** (`pack:capture:creature-guepe-cybernetique-attack-player-12-v1`).
- `movementScaleByView.player=1.5`, `movementPlayback.mode=loop`, réglage de rotation enregistré tel quel.
- Position joueur `y=-20`, `shadowOffset={x:0,y:30}`.
- Stats `acier/nature/esprit=0` nouvellement présentes, les autres stats, 26 compétences connues, 5 capacités équipées, sockets, résistances et audio préservés.
- Les champs `visual.movement` FACE et `visual.rangedAttack` FACE **n'existent pas** dans cet export. Les deux atlas du catalogue `global-assets` dédiés à cette guêpe n'existent qu'en vue DOS. Ne jamais convertir l'animation DOS en FACE artificiellement, ni utiliser une image inventée.

## Raccord runtime
Le lot générique d'attaque aérienne PR #95 sur `gh-pages` sait désormais jouer `movementBack` pendant l'envol et `rangedAttackBack` à la plongée, pour toute créature possédant ces deux slots. `adaptCaptureExportToNativeVisualSourceV1` résout les `frameCount: 1` exportés depuis les métadonnées canoniques des deux vrais médias (`resource.frameCount=12`) sans modifier les données d'auteur. Côté adversaire FACE, aucune animation personnalisée n'est attendue pour Freclairions, faute de sources FACE.

## Tests et garanties
Tests sentinelles: exactitude des octets et SHA256, une seule référence Showcase, import V10 et aller-retour canonique, compatibilité archive, position et ombre, valeurs et loadout, résolution Native Visual Adapter et choix des phases aériennes côté joueur, absence de FAUX visuel FACE. Mise à jour du seul hash historique Freclairions, sans altérer Crocs statiques. CI `npm run ci` et quatre tests Chromium ; checkpoint GREEN uniquement sur SHA exact après succès des 5 jobs et revue des fichiers. Déploiement de la branche `gh-pages` après fusion ; validation visuelle tactile Android reste celle de l'auteur.
