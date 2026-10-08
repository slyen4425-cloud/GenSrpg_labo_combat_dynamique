# Jet pressurisé — import auteur V1 (2026-10-08)

## Base et origine
- Source utilisateur : `gensrpg-capture-skill-cap_water_atk_3.json`, JSON `capture-skill-transfer-v1`, 4133 octets, ID `cap_water_atk_3`, nom `Jet pressurisé`, présentation V9.
- Empreinte SHA256 sémantique `JSON.stringify(raw)` : `d799c2f54712f93982a2f8d135785aa163b4cd43234983f83b451ba75d304f55` (testée en CI).
- Base de travail : `ed647100c4eacc6317ddcb4578b1568e3639895f`, dernier `gh-pages` déployé comprenant les travaux du rayon et les mises à jour Eau précédentes.
- Checkpoint de départ : `checkpoint/lab-start-water-atk3-author-import-v1-2026-10-08`, branche `work/lab-water-atk3-author-import-v1-2026-10-08`.

## Import sans double autorité
- Un seul nouveau JSON : `data/capture/showcase/cap_water_atk_3.capture-skill-transfer-v1.json`, contenu sémantique identique à l'export de l'auteur.
- Une seule nouvelle entrée : `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`. Elle est automatiquement importée en mode `replace` dans `configuredSkills` via le moteur existant. La compétence historique `cap_water_atk_3` est remplacée et pas dupliquée.
- La créature Maraileron possède déjà `cap_water_atk_3` dans son loadout ; aucune donnée créature n'a été modifiée.

## Réglages d'origine préservés
- `form=projectile`, `element=water`, `energyCost=6`, préparation 2500 ms, travel 900 ms, récupération 300 ms, cooldown 30000 ms, puissance de choc projectile 3.
- Effet de dégâts ciblés : `amount=25`, `channel=water`, `ignoreResistancePct=100`, `ignoreDamageReductionPct=100`. Aucun calcul ajouté : `CombatDamageV1` reste l'unique autorité.
- Cast `pack:capture:sprite-cast-water-01`, scale 1.5, ancré bouche, offset X +30, `playbackMode=loop`.
- Travel `pack:capture:sprite-frost-bolt-projectile-01`, scale 2.5, `playbackMode=loop`.
- Impact `pack:capture:sprite-impact-water-01`, scale 1.7, `playbackMode=once`, durée 500 ms.
- Icône `core:icon-skill-aqua-dash-01`, sans audio ; glow blanc force 1, rayon 48 px.

## Distinguer le rayon continu de l'export d'auteur
- Le moteur de rayon `SkillDefinition.form="beam"`, `SkillFxPlan`, `DomSkillFxRenderer`, et le pack `sprite-pressurized-jet-*-01` sont déjà intégrés dans le laboratoire.
- **L'export reçu ne les utilise pas** : il définit `form=projectile` avec le projectile de givre. L'import a volontairement conservé ces champs au lieu de les modifier silencieusement.
- Le futur paramétrage beam (form `beam`, visuels cast/travel/impact dédiés) est un choix auteur à faire et à exporter, pas un auto-bind basé sur l'ID de compétence.
- Les 4 assets du rayon préexistants et la page de preview dédiée sont conservés intacts.

## Médias
- 0 nouveaux médias physiques, 0 médias remplacés. Le sprite de givre, le cast Eau et l'impact Eau existent déjà dans le catalogue global, et l'icône est issue du catalogue cœur ; les médias beam demeurent sur la branche `global-assets` au SHA `74ac3314f2d20eeadad77b439d5f229f5dacee3e`.
- Les références de médias présentes dans le JSON auteur ne garantissent pas à elles seules l'aspect final sur Android. Aucune modification artistique n'a été demandée.

## Tests et protections
- TDD RED : CI `37803851479` sur les tests avant ajout de la capacité / entrée catalogue.
- GREEN initial : CI `37803913427` : foundation 1285/1285 Node PASS, 0 FAIL ; sentinelle navigateur Chromium 103 créatures attendue.
- Tests nouveaux : SHA exact des données auteur, parse/import et roundtrip, conservation du projectile de givre, absence de doublon dans Showcase, remplacement historique via batch canonique, vrais 25 dégâts eau malgré 40 % résistance Eau et 20 % défense avec 100 % de pénétration.
- Inchangés : moteur beam, collision, capacité Goutte vive/Morsure de marée, les 103 créatures, commandes, audio, global-assets, `main`, `Zombicide-40k`, Exploration.
- GREEN technique final : dernier CI + checkpoint exact + Pages build SUCCESS ; le test tactile/rendu réel Android reste à valider par l'utilisateur.
