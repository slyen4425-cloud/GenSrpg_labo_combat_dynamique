# Import deux compétences Esprit — export du 22 octobre 2026

Source auteur : `gensrpg-capture-database-v1(3).json` (SHA-256 `c8e9f365d84341388b8e10f40f3285df1fc5893e08e5882b648e713c63c41323`), 104 créatures, 121 capacités, 15 statistiques. Comparaison avec l'export précédent SHA-256 `81a1fff688b9ad59a357fdb2650a7c87677ba760ba98ad26646732eca55c2541` (104,119,15).

**Ajouts identifiés** : deux capacités uniquement : `Onde Spirituel` (miroir projectile 2 s, cible alliée/soi) et `fleche_spirituel` (9 dégâts canal `spirit`, 1 charge du marqueur `eclat-spirituel` 20 s, 3 charges déclenchent 10 dégâts en canal `esprit` puis remise à zéro). IDs et canaux différents conservés littéralement, aucune correction sémantique inventée.

**Différences exclues** : changements automatiques des champs de pénétration à zéro de `fireball` et re-sérialisation historique de `lib_fire_bolt`. Aucun écrasement des capacités actuelles. L'export affiche 93 anciennes créatures avec une nouvelle valeur Esprit non nulle ; ces fiches historiques ne sont pas importées comme des doublons actifs (la bibliothèque showroom ne gère qu'une sélection de 11 créatures).

Chaque nouvelle capacité est une fiche de transfert active sous `data/capture/showcase/`, indexée une fois dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`. Les copies dans `source-exports/` sont inactives et uniquement de provenance. `configuredSkills` demeure l'unique autorité après import. Le marqueur `eclat-spirituel` réutilise le registre existant, sans doublon. La Flèche ne reçoit pas de FX/animation artificiels : présentation source `null`.

Base : `gh-pages@b424b8968392d9ebc402cf9a731f49449ba2298a`. Branche : `work/lab-author-spirit-skills-2026-10-22`, checkpoint départ `checkpoint/lab-start-author-spirit-skills-2026-10-22`. Vérification : `tests/unit/capture-author-spirit-skills-2026-10-22.test.mjs`, CI et vrai navigateur ; validation tactile Android non supposée.
