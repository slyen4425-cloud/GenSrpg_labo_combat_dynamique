# Labo Combat — Dracendre + Vague de chaleur : exports auteur du 15 octobre 2026

## Portée et provenance
- Dépôt exclusif : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`. Base de production `gh-pages@1efd78b440b679ca2da957fc8207141decb0d8d1`, avant tout remplacement. Checkpoint `checkpoint/lab-start-dracendre-heatwave-refresh-2026-10-15`, branche `work/lab-dracendre-heatwave-refresh-2026-10-15`.
- Dracendre original `gensrpg-capture-creature-crea_dracendre(1).json` : 4452 octets, SHA-256 `cdc0d760eddc2558ff8542ec975e5b699af1bd7f41c34ef1ca2b0c76a6ed398e`, Git blob `34bc9cb5b3526e183ba2ae00cbbe83c78a78c8f0`.
- Vague de chaleur original `gensrpg-capture-skill-lib_heat_wave.json` : 2936 octets, SHA-256 `e3bbd45ef5763f35727be806123008be034ef303322d76d85e017eeaff05ce12`, Git blob `704acb26ac14fbb0f1c452b4638785f99d7ee1dd`.
- Destination des fichiers : `data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json` (remplacement même ID) ; `data/capture/showcase/lib_heat_wave.capture-skill-transfer-v1.json` (nouveau preset Showcase même ID historique). L'unique registre `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` l'inscrit une fois. Le véritable import canonique remplace `configuredCreatures` / `configuredSkills`, pas de propriétaire parallèle.

## Données réellement exportées
- Dracendre : profil `flying`, 160 PV, élément Feu + Air, mêmes stats/13 résistances, vue face/dos/icône Braisombre, son de mouvement `gensrpg:sound:sanctuary-367a77dd` (volume 1), ultimatum `cap_fire_atk_7` ajouté à l'emplacement ultime ; les quatre slots standards sont inchangés. Le son est déjà présent au catalogue audio privé (label « vetement move ») ; **aucun nouvel asset binaire n'est importé**. Audit acoustique sur appareil non prétendu.
- Vague de chaleur : attaque contact `aerial`, préparation 1000 ms, trajet 2100 ms, recharge 15000 ms, 10 dégâts directs, et statut `stat_modifier` de `speed +20` pour 10000 ms, visuel de statut `pack:capture:sprite-fireball-2-cast-01`. Réutilisation de l'ID historique `lib_heat_wave`.
- **Discordance préexistante** : la description indique « Affaiblit temporairement la défense adverse », mais l'effet réel augmente la vitesse de la cible de 20 points, ce qui réduit potentiellement son temps de charge. Ne pas corriger en silence ni introduire un malus universel sans accord utilisateur.

## Tests et publication
Sentinelle auteur `tests/unit/capture-dracendre-heatwave-author-refresh-v1.test.mjs` : empreintes exactes, allers-retours canoniques, owner unique, audio, slots, buffs et vraie chaîne Combat. Sentinelles Dracendre/Brasier réactualisées sans perte des invariants. Trois assertions historiques de 25 capacités Showcase corrigées vers 26. Aucun changement dans les moteurs, les FX, les assets, `main`, `global-assets`, l'exploration ou Zombicide-40k.

Validation technique : CI Foundation + Firestorm Chromium + Creature Library Chromium au SHA final, checkpoint GREEN au SHA exact, preview/production `gh-pages` par fast-forward avec lease, CI et Pages postpublication. Validation Android par l'auteur séparée.

## Deux propositions — aucun changement moteur inclus dans ce lot
1. Son de déplacement volant : options dans `CreaturePresentationBinding.audio.movement` (lecture unique, boucle continue ou répétition à intervalle ms et volume) ; le propriétaire reste la créature, le scheduler audio actuel déclenche et annule pendant l'approche aérienne uniquement. Arrêt sur interruption, changement de créature ou fin d'approche.
2. Statut `outgoing_damage_modifier` à pourcentage : réduction indépendante des stats élémentaires et résistances du porteur, appliquée dans l'unique `computeCombatDamageV1` à toutes les attaques de l'acteur, y compris celles utilisant des stats personnalisées, selon filtres explicites. Définir séparément politique pour dégâts indirects, renvoi, cumul et minimum, et ne pas dupliquer le calcul.
