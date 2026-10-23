# Synchronisation non destructive de la base Capture — 23 octobre 2026

## Origine
Export auteur `gensrpg-capture-database-v1.json`, SHA-256 original `5c81d6d1c0712f1614f63f5d4936b92e8c0a3afb32852d15d146592cc0cd6865` (104 créatures, 123 capacités, 15 statistiques). La copie brute est archivée séparément et reste immuable.

## Base et périmètre
Base `gh-pages@bdae1da28e0eeb251d6963fa380c3bdd1fb45a5d`, START `checkpoint/lab-start-capture-author-db-refresh-2026-10-23`, branche `work/lab-capture-author-db-refresh-2026-10-23`.

Lot réservé à la synchronisation **des deltas auteur intentionnels sur les presets actifs**, en laissant les autres définitions intactes :
- `kitsune_lunaire`: désormais cinq compétences autorisées et équipement complet : Aura Lunaire en slot 4, Sacrifice Kitsune en ultime.
- `crea_dracendre`: sprites de mouvement échelle joueur et adversaire 1,7 ; tous les identifiants de sprites et mécanismes aériens restent inchangés.
- `Sacrifice_kitsune`: visuel de zone échelle 1,6, position (-20,-60) et opacité 0,2 ; préserver `element:psy` et ciblage `self` de la réparation anti-buff adverse (#74), ainsi que les 3 zones natives et 45 s.
- `cap_fire_atk_6`: dégâts périodiques 5→10, intervalle 1000→750 ms.
- `cap_fire_atk_7`: coût énergie 0→8, vol 1000→600 ms, utilisation illimitée→1, icône Brasier.
- `fleche_spirituel`: collision de projectile `power:0→1`.

## Exclusions volontaires de l'export
Les champs optionnels par défaut `hitsIntangible:false`, `projectileTargeting:direct`, `targetLocations:active`, `offsetMode:same` etc. ne sont **pas** réécrits dans les autres compétences. Les différences de format JSON et les champs `maxHpPerPoint:0` n'entraînent pas de réimportation globale. Les entrées déjà strictement identiques, les autres créatures et capacités, les catalogues historiques, marqueurs, engine, audio, Dracendre hors ses deux scales, et GenSrpG principal restent protégés.

## Vérifications
Validation par les contrats natifs, test de la nouvelle configuration réelle, conservation du fichier source et des archives immuables, unicité des IDs, CI Foundation + 4 navigateurs, puis checkpoint GREEN, PR `gh-pages`, sans modification de `main`. Validation smartphone de Kitsune/Dracendre et des visuels à réaliser ensuite.
