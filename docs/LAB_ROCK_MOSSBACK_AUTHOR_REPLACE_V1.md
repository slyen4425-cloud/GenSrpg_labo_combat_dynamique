# Labo Combat — Remplacement des exports Impact rocheux et Moussados (11 octobre 2026)

## Demande / autorité

Deux exports utilisateur joints au fil doivent remplacer leurs homologues dans le propriétaire actif `configuredSkills` / `configuredCreatures`, par **ID stable**, sans catalogue parallèle et sans modification des autres créatures/capacités.

- `gensrpg-capture-skill-cap_earth_atk_4.json` -> `data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json`, ID `cap_earth_atk_4`.
- `gensrpg-capture-creature-crea_mossback.json` -> `data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json`, ID `crea_mossback`.

**Rectificatif explicite utilisateur pendant le lot :** corriger le `projectileTargeting: direct` non choisi qui était apparu dans l'export d'Impact rocheux `skyfall`. La valeur correcte est `fixed_point`. Toutes les autres données sont conservées byte pour byte.

## Inventaire des changements d'auteur

**Impact rocheux** : l'export envoyé modifie intentionnellement, par rapport au HEAD précédent, l'apparence de l'impact (échelle `1 -> 1.7`, offset vertical `-25 -> 0`, opacité `1 -> 0.7`). La hauteur `650`, la traînée `count 6 / length 50 / size 8 / anchor 0.5×0.4`, la secousse `5`, la fumée `35` et les autres paramètres sont conservés.

- SHA256 **export utilisateur original** : `67554e742c0045b882bbfe6053cd4d5dfb93e1bb2855ea4b13eb0f68d2632bb9`, 5179 octets.
- Exception expressément demandée : `"projectileTargeting": "direct"` -> `"projectileTargeting": "fixed_point"` **et rien d'autre**.
- SHA256 **fichier publié** : `04c1330d6993bb0d5e90afd2c39d544944d2c8aa4b009cdbd075f18d4c4bed6b`, 5184 octets.
- Le test inverse cette substitution et revérifie le SHA256 de l'export utilisateur.

**Moussados** : remplacement strictement égal à l'export fourni, SHA256 `1c9ec63d0b5ff99e67cb228039a3bd7420fefc27e7eccc5078a401124027fa3e`, 5311 octets. Seul écart logique avec le HEAD antérieur : ajout de `presentation.viewOverrides` :

| Vue | Scale | Position X | Position Y |
|---|---:|---:|---:|
| Joueur | 1.7 | 0 | 0 |
| Adversaire | 1.2 | -30 | 35 |

Niveau 1, stats, PV 200, résistances feu +50 % / air -50 %, sockets exacts, identifiants d'assets, audio, `skillIds` et les cinq slots de `loadout` inchangés. La capacité `cap_earth_atk_4` reste liée au troisième slot de Moussados.

## Diagnostic et correction de la cause du champ `direct` non choisi

La normalisation générique `normalizeSkillDefinition` complète toute définition sans `projectileTargeting` avec `direct`. Or `buildHumanSkillDraftV1`, propriétaire du chemin éditeur -> fiche -> export, n'écrivait **pas** ce champ en fonction du mode de trajet. Ainsi, même avec `visual.travel.trajectoryMode=skyfall`, le normaliseur insérait `direct`, et l'adaptateur Capture ne pouvait plus appliquer sa dérivation `fixed_point` (la définition contenait déjà une valeur explicite). La valeur ne provient pas d'un choix utilisateur dans l'éditeur.

Correction minimale au **propriétaire d'export Capture** `src/ui/capture-editor-human-v2.js` : pour les projectiles skyfall, générer `projectileTargeting=fixed_point`; pour les autres, `direct`. Pas de condition par nom de capacité, pas de changement à Combat Core, au renderer ni aux autres modes. Test natif couvrant création et sauvegarde/roundtrip depuis le formulaire.

## Gouvernance / CI

- Base `gh-pages` : `f47bd97cb84e358075a1bdf372b94c880fe2fa5c`.
- Checkpoint départ : `checkpoint/lab-start-rock-mossback-author-replace-v1-2026-10-11`.
- Branche : `work/lab-rock-mossback-author-replace-v1-2026-10-11`.
- TDD : nouveau test `tests/unit/capture-rock-mossback-author-replace-v1.test.mjs`, RED au commit `7e2f53d000535376371f88387f5a83033edf4276` sur les données anciennes. Actualisations chirurgicales de sentinelles historiquement figées : `capture-impact-rocheux-author-retire-v1`, `capture-impact-opacity-ui-v1`, `capture-author-refresh-model-tint-blink-v1` et `rock-impact-author-fx-settings-v1`.
- Import/export normalisé, contrat `fixed_point` à la frontière Capture, données de créature avec `statRegistry`, sockets, loadout, unicité des identifiants ; CI foundation et deux parcours Chromium réels attendus sur SHA final.
- Après CI : checkpoint GREEN au SHA documentaire final, FF `gh-pages` sous contrôle de HEAD, vérifier GitHub Pages et la CI post-publication. Validation visuelle et tactile Android à demander à l'utilisateur.

## Amélioration UX évoquée mais **hors lot**

L'utilisateur juge les paramètres FX difficiles à comprendre. Proposition pour un lot séparé, sans perte des contrôles existants : réglages simples en français avec descriptions concrètes et aperçu live, profils `Discret / Équilibré / Spectaculaire` par effet, un mode Avancé repliable par défaut, avertissement sur valeurs disproportionnées (p. ex. secousse 600 px), et commandes contextualisées aux types `linéaire / skyfall / beam`. Aucun changement UI FX n'est introduit dans ce lot ; proposition à valider avant implémentation.

## Confinement

Aucun changement à `global-assets`, sons/sprites/icônes, Combat Rules/Runtime/FX Renderer, aux 101 autres créatures de base/aux presets tiers, à `main`, `Zombicide-40k` ou à Exploration. Les deux JSON restent les seules fiches auteur modifiées.

**Verdict technique :** dépend des CI finales ; **verdict utilisateur** dépend du prochain test smartphone.
