# Jet pressurisé — intégration export auteur après Beam GREEN (2026-10-08)

## Base et sources
- Base de reprise live : `ed647100c4eacc6317ddcb4578b1568e3639895f` (`gh-pages`, CI `37800971026` SUCCESS et déploiement Pages `37800970094` SUCCESS).
- Derniers travaux du rayon : `docs/LAB_PRESSURIZED_JET_BEAM_V1.md`, `docs/LAB_PRESSURIZED_JET_PREVIEW_ROUTING_V1.md` et page `examples/dom-demo/pressurized-jet-preview.html` publiée.
- Source exacte utilisateur : `gensrpg-capture-skill-cap_water_atk_3.json`, 4133 octets dans le fichier reçu, contrat `capture-skill-transfer-v1`, niveau 10, `presentation.version=9`.
- SHA-256 de `JSON.stringify(JSON.parse(source))` : `d799c2f54712f93982a2f8d135785aa163b4cd43234983f83b451ba75d304f55`.
- Checkpoint départ : `checkpoint/lab-start-water-atk3-author-after-beam-v1-2026-10-08`.
- Branche de travail : `work/lab-water-atk3-author-after-beam-v1-2026-10-08`.

## Intégration fidèle
- Ajout de `data/capture/showcase/cap_water_atk_3.capture-skill-transfer-v1.json` par copie du contenu reçu.
- Entrée unique dans `src/catalogs/capture-showcase-skill-presets-v1.js`, via l'unique hydratation et import Capture Transfer, sans créer de second registre.
- `cap_water_atk_3` / **Jet pressurisé** : niveau 10, style `projectile`, Eau, coût 6, 2500ms préparation, 900ms trajet, 300ms récupération, cooldown 30000ms, puissance de collision 3 ; 25 dégâts Eau avec `ignoreResistancePct=100` et `ignoreDamageReductionPct=100`.
- Visuels exactement ceux de l'auteur : icône `core:icon-skill-aqua-dash-01`, cast `pack:capture:sprite-cast-water-01`, trajet `pack:capture:sprite-frost-bolt-projectile-01`, impact `pack:capture:sprite-impact-water-01`, impact 500ms, aucun audio.

## Important : raccord au Beam
La nouvelle infrastructure **Beam** est bien fonctionnelle sur la version reprise. Elle exige cependant `SkillDefinition.form="beam"` et `visual.travel.assetId="pack:capture:sprite-pressurized-jet-beam-body-01"` pour représenter le rayon continu.
Le JSON reçu déclare explicitement `form="projectile"` et `sprite-frost-bolt-projectile-01`. L'intégration conserve ces choix et **ne prétend pas activer le rayon pour cette capacité**. L'éditeur comporte maintenant l'option « Rayon », et les 4 nouveaux assets du rayon sont présents dans le catalogue `global-assets` et sur la preview dédiée. La conversion de ce preset en Beam et le choix exact cast/body/impact seraient un **changement des données auteur** à valider séparément, jamais une substitution silencieuse.

## TDD et conformité
- RED : CI `37803890706`, fichier source/preset encore absents, 4 échecs intentionnels, bibliothèque Chromium fonctionnelle.
- GREEN initial : CI `37803945003`, 1285/1285 Node PASS, 0 FAIL ; Chromium Creature Library PASS et 103 créatures préservées.
- Les tests de `tests/unit/capture-water-atk3-author-after-beam-v1.test.mjs` assurent la vérification de l'empreinte du JSON complet, la normalisation/roundtrip du vrai transfert, le chargement unique dans le Showcase, le plan d'import canonique avec maintien du nombre de compétences, les effets 25 Eau malgré résistance 70 % et défense 50 % ainsi que la présence du vrai Beam preview sans régression.
- Scope : 1 nouveau JSON, 1 entrée catalogue, 1 nouveau test, documentation ; aucun changement de runtime/renderer/asset ni des deux compétences eau précédemment intégrées.
- AssetIds référencés trouvés dans le catalogue `global-assets`. Aucun nouveau média ajouté, aucun placeholder créé.

## Protection
`main`, `global-assets`, autres laboratoires, combat/progression, autres exports auteur, 103 créatures sont inchangés. Pas de GREEN utilisateur tant que la nouvelle capacité n'est pas testée sur Android.
