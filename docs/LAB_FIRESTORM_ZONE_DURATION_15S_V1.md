# Tempête de flammes — durée de zone 15 secondes V1

Date : 9 octobre 2026 — laboratoire Combat Dynamique.

## Demande et source de vérité

Demande utilisateur : porter **uniquement** la durée de la zone de flammes de l'ultime **Tempête de flammes** (`cap_fire_atk_6`) de **7 à 15 secondes**.

Un seul champ produit modifié : `data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json`, `draft.definition.effects[0].durationMs: 7000 -> 15000`.

Le contrat canonique ne change pas : `persistent_zone`, `zoneId=zone`, `reactivation=reinforce`, `maxActivations=3`, `radiusGrowthSteps=1` et short → medium → long. Restent inchangés : **5 dégâts/tick**, **tick chaque 1000ms**, **2 secondes de préparation**, cooldown **3500ms**, seuil de combat **25000ms**, niveau requis 20, coût 5, sprite et **opacité 0.5**. Les 15 secondes courent depuis la résolution de chaque activation, sans cumul additif. `configuredSkills` reste l'unique propriétaire des fiches actives.

## Gouvernance

Base `gh-pages` vérifiée : `91d087566380324a0c1b29eb5fa95b4671881831`, CI `37966746233` et Pages `37966744995` SUCCESS.

Checkpoint de départ : `checkpoint/lab-start-firestorm-zone-duration-15s-v1-2026-10-09` sur cette base.
Branche isolée : `work/lab-firestorm-zone-duration-15s-v1-2026-10-09`.
Périmètre déclaré avant codage dans `docs/LAB_CURRENT_WORK.md`. Aucun commit sur `main`, `global-assets`, GenSrpG ou labo Exploration.

## TDD RED / GREEN

- **RED** : SHA `af524aab8eb90ca13ab5458afd0e1ca3eec5ff12`, CI [37980669164](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37980669164) — 6 échecs Node ciblés, ancienne durée 7000 contre attente 15000 ; Chromium Firestorm échoue sur « authored 15s zone duration ». Les tests ont précédé la modification.
- **Changement source unique** : commit `ed96b44c67b4b9dcd2328c9b98d293fef58a6323`. Comparaison JSON objet avant/après : seule la durée de la zone change.
- **Anciennes sentinelles identifiées** : CI `37980795445` — 1332 PASS / 2 FAIL, Chromium Firestorm SUCCESS. Deux tests codés pour l'ancien 7000ms : `capture-showcase-skill-presets-v1` et `zone-idle-recall-fx-v1`. Le périmètre a été étendu dans la gouvernance **avant** leur modification ; seules les attentes ont été adaptées.
- **GREEN fonctionnel** : SHA `df6c5419f9b051be53bfb3914a5e002a056f339e`, [CI 37980914120](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37980914120) **SUCCESS**, **1334 / 1334 Node PASS, 0 FAIL** ; Chromium bibliothèque créatures **SUCCESS** ; Chromium Firestorm vrai DOM **8 / 8 scénarios PASS** (joueur/IA × 1v1/2v2 × cadence normale / expiration pendant la préparation).

La vraie chaîne testée est `cap_fire_atk_6 auteur -> CombatSession -> CombatRuntime -> PersistentZoneRuntime -> DomSkillFxRenderer`. Le navigateur observe les dimensions de la zone, les niveaux du sprite et sa disparition, pas uniquement une variable simulée. Il s'agit d'un simulateur de clic connecté au vrai Runtime/renderer, pas d'un test automatisé de chaque contrôle de l'éditeur complet.

## Horloge et attentes protégées

- Zone initiale résolue à 27000 ms : **expiration à 42000 ms**.
- Réactivation acceptée à 41000 ms, ancienne zone expire normalement à 42000 ms, renforcement résolu à 43000 ms : devient **medium**, nouvelle expiration **58000 ms**, sans tick rétroactif.
- Trois résolutions 27000 / 30500 / 34000 ms donnent short / medium / long : la zone finale expire **49000 ms**. Une activation démarrée après expiration recrée short.
- Pour `reinforce`, le prochain tick déjà programmé n'est pas décalé. `refresh` reste une sémantique distincte, non modifiée. L'occupation spatiale et les dégâts des autres zones restent protégés.

## Diff revu

Base `91d08756…` → GREEN fonctionnel `df6c5419…` : 5 commits, 0 behind, **8 fichiers** avant documentation.

Produit (seul fichier fonctionnel) : `data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json` (1 ligne).
Tests : `tests/unit/firestorm-real-runtime-sequence-v1.test.mjs`, `tests/unit/firestorm-reinforce-cadence-regression-v1.test.mjs`, `tests/unit/capture-author-defaults-heal-bubble-fire-zone-v1.test.mjs`, `tests/unit/capture-showcase-skill-presets-v1.test.mjs`, `tests/unit/zone-idle-recall-fx-v1.test.mjs`, `tests/browser/firestorm-zone-growth-smoke.mjs`.
Gouvernance : `docs/LAB_CURRENT_WORK.md` et ce rapport.

Aucun moteur, renderer, autre capacité, créature, loadout, catalogue, sprite, son, beam, statut ou progression modifié. Le correctif de croissance joueur précédemment livré reste intact.

## Fin de publication

Le SHA documentaire final devra passer à nouveau les 3 jobs CI. Ensuite seulement : checkpoint GREEN technique au SHA exact, preview figée, comparaison du HEAD `gh-pages`, fast-forward sous lease (ou arrêt en cas de divergence), nouvelle CI sur `gh-pages` et GitHub Pages SUCCESS. Validation visuelle/tactile sur Android physique distincte ; ne pas la présenter comme réalisée sans retour utilisateur.

URL : https://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/examples/dom-demo/capture-editor-v2.html
