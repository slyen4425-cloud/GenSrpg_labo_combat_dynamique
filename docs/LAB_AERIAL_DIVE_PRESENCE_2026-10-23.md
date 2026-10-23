# Attaque aérienne — montée puis piqué, esquive native de présence (2026-10-23)

## Demande de l'auteur
Le contact aérien doit quitter son camp verticalement, puis fondre rapidement sur le camp adverse, sans suivre l'ennemi qui traverse l'arène. Lorsqu'un adversaire a déjà déclenché une attaque ordinaire, le combattant en vol esquive cette attaque tant que sa phase de vol est en cours ; sa propre attaque peut cependant infliger ses dégâts normalement. Un sort **explicitement** capable de toucher `airborne` peut toujours infliger ses effets. Aucune invulnérabilité permanente.

## Propriété des responsabilités, sans double autorité
- `CombatRuntime` conserve seul le release, le début et la fin de voyage, les interruptions et la livraison des résolutions.
- `combat-presence-v1` conserve seule la portée des attaques contre une créature `airborne`. Une attaque ordinaire offensive sans `hitPresenceStates` explicite est limitée à la surface pendant le vol. Les définitions explicitement configurées avec `airborne` priment ; hors vol, la créature est normale. Les compétences de support et les dégâts de zone persistante ne gagnent pas de nouveaux boucliers.
- `plan-animation` est l'unique source du plan aérien : premier segment d'ascension X=0 (ombre au camp initial), second segment piqué accéléré jusqu'à l'ancrage du camp adverse, retour d'animation historique. Le ratio d'ascension 0.64 et l'easing du piqué sont pilotés par les cinq profils de données, sans logique de durée dans l'UI.
- `demo-app` ne choisit que la destination visuelle : l'ancrage de camp existant remplace la position animée momentanée de la cible pour ce mode ; le détecteur de contact et les résultats Combat Rules restent ceux déjà uniques.

## Portée, protections
Fichiers applicatifs du lot : `src/core/combat/combat-presence-v1.js`, `src/core/animation/plan-animation.js`, `src/ui/demo-app.js`, `data/profiles/{biped,flying,massive,quadruped,serpentine}.profile.json`. Aucun nouveau statut d'immunité, minuterie de gameplay, listener, résolution de dégâts ou canal de collision. Les deux exceptions anti-air documentées modifient uniquement leur portée déclarative native. Les modes ground/burrow/teleport, la capacité de voler hors attaque, l'audio, les sprites, les missiles de surface, `main`, `global-assets` et GenSrpG principal restent protégés.

## Exceptions anti-aériennes constatées avant publication
Le catalogue auteur conservait `Ouragan` avec `["surface","airborne"]`, mais `Tornade` et `Arc électrique` n'avaient pas cette portée explicitée malgré leur comportement aérien historique. Deux **presets actifs seulement** sont enrichis du champ de portée native `hitPresenceStates:["surface","airborne"]` pour maintenir ces comportements, sans changer leurs dégâts, effets, assets ou définitions historiques archivées. Une sentinelle parcourt les trois vrais transferts et le propriétaire natif de présence. Les autres compétences ordinaires restent limitées à la surface durant le vol.

## Tests
- `tests/integration/aerial-dive-presence-2026-10-23.test.mjs` : véritable `CombatRuntime + CombatSession`, attaque adverse simultanée évitée, attaque aérienne du joueur qui inflige ses dégâts, autre attaquant aérien ordinaire incapable de chasser un volant, capacité anti-air explicitement configurée qui touche, fenêtre avant/après vol et support inchangés.
- `tests/unit/aerial-dive-visual-2026-10-23.test.mjs` : les cinq profils, ascension verticale, ombre d'origine, piqué plus court, destination camp, retour à l'état initial, délai d'impact non modifié, raccord de l'ancrage UI.
- `tests/integration/combat-presence-reach-v1.test.mjs` : une ancienne attente aérien-contre-aérien est actualisée explicitement selon la nouvelle décision auteur ; autres sentinelles conservées.
- CI Foundation + quatre navigateurs, checkpoint GREEN **uniquement après exécution réussie** ; validation animation visuelle Android distincte.

## Reprise
Base immutable : `gh-pages@02454a67faa79fbebd254c81ca6e7eab52649cde`. Checkpoint de départ `checkpoint/lab-start-aerial-dive-presence-2026-10-23`. Branche `work/lab-aerial-dive-presence-2026-10-23`. Pas de modification directe de `gh-pages`.
