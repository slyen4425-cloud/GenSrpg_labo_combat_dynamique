# Lot Capture — publication des réglages utilisateur (23/10/2026)

**Mandat exact** : publier sur GitHub les réglages des capacités/créatures venant de `gensrpg-capture-database-v1.json`, PAS seulement générer une nouvelle base JSON.

- Base `gh-pages@bdae1da28e0eeb251d6963fa380c3bdd1fb45a5d` ; START `checkpoint/lab-start-author-db-sync-2026-10-23` ; travail `work/lab-author-db-sync-2026-10-23`.
- Source : SHA256 `5c81d6d1c0712f1614f63f5d4936b92e8c0a3afb32852d15d146592cc0cd6865`, 123 capacités, 104 créatures, 15 stats.
- Catalogue actif 51 capacités : 47 sans changement métier (dont 18 variations d'export normalisées, NON réécrites) ; 4 capacités aux réglages réellement différents réimportées depuis l'export utilisateur : `cap_fire_atk_6`, `cap_fire_atk_7`, `cap_water_atk_1`, `cap_water_atk_2`, `cap_water_atk_3`, `cap_water_special_2`, `lib_aqua_heal`, `lib_earth_guard`, `cap_earth_atk_2`, `cap_earth_atk_3`, `cap_earth_atk_4`, `cap_earth_atk_7`, `lib_flame_bite`, `cap_fire_special_1`, `fireball`, `lib_tailwind`, `cap_air_atk_3`, `cap_air_atk_4`, `cap_air_atk_7`, `lib_gust`, `fleche_spirituel`, `Sacrifice_kitsune`.
- Catalogue actif 11 créatures : 9 inchangées, 2 fiches modifiées : `crea_dracendre` et `kitsune_lunaire`.
- Exemple du signalement : ultime **Brasier primordial** `cap_fire_atk_7` : énergie **0 → 8**. `lib_heat_wave` « Vague de chaleur » est un autre sort, distinct et inchangé à 0.
- Préservation : tous les paramètres auteur matériels (visuels, opacité, offsets, animations, sons, coûts, niveaux, effets, cooldowns et équipement) pour ces 6 fiches. Les 47/9 autres presets, notamment les 18 sérialisations comportant uniquement des champs explicites par défaut (projectileTargeting: direct, hitsIntangible: false, etc.), ne sont pas réécrits.
- **Exception héritée de la PR #74** : `Sacrifice_kitsune.definition.targetRelations` reste `["self"]` (export brut `["ally","self"]`) pour garantir le sacrifice du lanceur. Les 3 zones de 45s (régénération énergie +100 %, soin 10PV/2s, bonus dégâts +200 %) demeurent, avec l'aura personnalisée.
- Historique d'auteur : `data/capture/source-exports/capture-author-refresh-manifest-2026-10-23.json`, SHA de l'upload, ID et fingerprint de chaque fiche, ciblage brut d'origine pour la seule exception. Les réglages originaux des 23 autres fiches sont exactement les nouvelles définitions publiées.

**Périmètre** : 4 fichiers skills, 2 creatures, 1 manifeste, 1 test, cette note et journal. Protégés : motorisation Combat/Zone/Roster, UI, assets, catalogues, tous les autres presets, `main`, GenSrpG principal, labo Exploration. CI Node + 4 jobs navigateur exigés avant checkpoint GREEN et PR `gh-pages`. Validation réelle smartphone par l'auteur ensuite.

### Rectification de périmètre
Après diff champ par champ : 18 des 22 JSON initialement différents n'avaient que des valeurs par défaut rendues explicites par l'export, sans réglage auteur effectif. Elles ont été restaurées au blob exact de base (aucune modification active). Les quatre compétences réellement modifiées sont `cap_fire_atk_6` (zone 1000→750ms, 5→10 dégâts), `cap_fire_atk_7` (coût 0→8, trajet 1000→600ms, 1 utilisation max, icône), `fleche_spirituel` (puissance projectile 0→1) et `Sacrifice_kitsune` (élément esprit + visuel personnalisé). Les deux créatures changent les échelles Dracendre et l'équipement de Kitsune.
