# Capture — Impact rocheux : remplacement auteur Skyfall et retrait du doublon

Date : 2026-10-10. Laboratoire autonome.

## Source et décision d'identité
- Export utilisateur exact `gensrpg-capture-skill-cap_earth_atk_4.json` : `capture-skill-transfer-v1`, `draft.id=cap_earth_atk_4`, nom `Impact rocheux`.
- Remplacement **par ID** dans `configuredSkills`, via l'unique preset `data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json` enregistré une fois dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`.
- Conserver sans correction de données : `requiredLevel=10` bien que la description auteur mentionne niveau 16 ; `form=projectile`, `targetRelations=["enemy"]`, effet `damage all_enemies=30 earth`, énergie 5, préparation 2500 ms, trajet 1200 ms, cooldown 30000 ms, impact et audio/FX exacts. `SkillPresentationBindingV10.visual.travel` : `trajectoryMode=skyfall`, `fallHeightPx=650`, `fallOffsetXPx=0`, scale 2.
- Les quatre assets référencés (`core:icon-skill-rock-smash-01`, `pack:capture:sprite-stone-carapace-cast-01`, `pack:capture:sprite-projectile-earth-01`, `pack:capture:sprite-impact-physical-01`) figurent dans le catalogue `global-assets` et leurs fichiers physiques existent.

## Collision des noms : suppression sans duplication
Deux IDs historiques partagent exactement le nom « Impact rocheux » :
- `cap_earth_atk_4` : **conservé** et remplacé par l'export auteur, sans nouvel ID ni nouvel équipage.
- `lib_rock_slam` : **retiré** de la bibliothèque active Capture. Sa présence dans les catalogues historiques de provenance est conservée pour audit, mais les trois chemins de chargement natifs ne peuvent plus l'insérer dans `configuredSkills`. Une liste de retrait explicite appartient au registre vitrine existant, pas à un second catalogue runtime.

Deux créatures seulement avaient encore des références à l'ID retiré dans `data/capture/monster-capture-creatures.v1.json` : `crea_mossback` (Moussados) et `crea_rockhorn` (Rocorne). Seul cet ID est supprimé de leurs tableaux `abilityIds` ; les 108 autres entrées restent byte-for-byte inchangées. La fiche vitrine Moussados retire aussi l'ID de `draft.skillIds`, et son slot-4 équipé passe à `null` ; aucun autre skill n'est auto-équipé à sa place, ses autres slots/statuts/visuels restent intacts. Rocorne conserve ses capacités restantes dans l'ordre historique. Les données d'origine du catalogue historique de capacités restent immuables.

## Autorités et non-régressions
- Pas de modification des contrats de capacités, ciblage, Runtime, FX ou géométrie Skyfall ; l'effet `all_enemies` est conservé tel qu'exporté.
- Aucune modification des autres exports auteur, de `global-assets`, des 103 capacités de provenance historique, de `main`, GenSrpG ou Exploration.
- Tests `tests/unit/capture-impact-rocheux-author-retire-v1.test.mjs` pour fidélité/roundtrip, transfert remplaçant par ID, retraite active, données historiques et Moussados. Sentinelle existante Moussados adaptée à la suppression explicitement demandée, pas à un changement de renderer.
- Le test RED `2c553556a98de0588bd8eda8722ae1a994a8bb1b`, CI `38080185765` FAILURE attendu, précédait toute correction de code. Premières CI partielles après lot ont révélé l'oubli de `statRegistry` **dans le nouveau test uniquement**, corrigé sans changer l'implémentation.
- Validation GREEN technique à exiger sur SHA exact avec suite foundation + Firestorm navigateur + Creature Library navigateur, checkpoint GREEN, promotion fast-forward sous lease `gh-pages`, CI et Pages sur le SHA publié. Validation tactile de la nouvelle fiche/du choix de créature sur smartphone reste distincte.
