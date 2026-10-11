# Labo Combat — Impact rocheux : réglages FX de test (11 octobre 2026)

## Demande et frontière d'autorité

Suite au décalage apparent des effets de traînée/glow du projectile tombant, le créateur a autorisé expressément l'application de six **valeurs de test** dans sa capacité existante **Impact rocheux** `cap_earth_atk_4` ; il souhaite ensuite tester lui-même sur smartphone.

Le propriétaire reste le **transfert auteur Capture** unique : `data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json`. L'éditeur et le Combat consomment cette fiche via les adaptateurs existants. Aucun moteur ni média n'est corrigé/modifié dans ce lot.

## Diff strictement autorisé

| Champ auteur | Avant | Après |
|---|---:|---:|
| `presentation.feedback.projectileTrail.sizePx` | 120 | **8** |
| `presentation.feedback.projectileTrail.lengthPx` | 120 | **50** |
| `presentation.feedback.projectileTrail.count` | 8 | **6** |
| `presentation.feedback.projectileTrail.anchorY` | 0,5 | **0,4** |
| `presentation.feedback.cameraShake.amplitudePx` | 600 | **5** |
| `presentation.feedback.aftermathSmoke.sizePx` | 120 | **35** |

**Conservés sans changement :** ancrage X 0,5, trajectoire `skyfall`, hauteur 650 px, offset horizontal 0, échelle du projectile 2, couleur des particules, durée secousse 140 ms, aura `glow: null`, impact visuel, sons, timings, dégâts, capacité et loadout.

## Procédure charte

- Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique` ; branche source publiée `gh-pages`.
- Base HEAD : `38bceb6db26141f17a9da614d3df55e9eea4be9a`.
- Checkpoint départ : `checkpoint/lab-start-rock-impact-fx-settings-v1-2026-10-11`.
- Branche chantier : `work/lab-rock-impact-fx-settings-v1-2026-10-11`.
- Test TDD RED : `tests/unit/rock-impact-author-fx-settings-v1.test.mjs`, commit `a0c5528c1656605b486444ba8e15774057298eab`. Le test vérifie les six nouveaux nombres, le roundtrip import/export, la cible gameplay `fixed_point`, le catalogue unique, et reconstruit l'export source antérieur pour comparer **son Git blob SHA** `8da9dceb1396fc428f39fddab6cddd23a957f906`, garantissant l'absence de toute autre différence d'octet.
- CI RED : run `38146825084` FAILURE attendue avant la modification.
- Correctif de données minimal : commit `5a717cee7122a46f2b9fa1004b2e26f971df2626` ; aucun autre auteur JSON changé.
- Le test CI FOUNDATION ainsi que les smokes navigateur `firestorm-zone-growth-browser` et `creature-library-browser` doivent réussir **au SHA exact de ce rapport final** avant checkpoint GREEN et promotion de `gh-pages`.

## Critères et risques

Cette intervention permet de tester une **hypothèse de réglage** : des tailles de particules excessives (120 px) et une secousse de 600 px. Elle ne prouve pas que le renderer suit exactement le noyau de roche dans chaque frame du sprite : un résidu de décalage doit être traité en chantier séparé avec un test spécifique `skyfall`, et non camouflé par d'autres offsets.

**Validation Android paysage distincte** : l'utilisateur vérifie l'apparence réelle dans son combat et répond avant de conclure à un rendu artistique validé.

Tout le reste est protégé : Combat Core/Runtime/Rules, modèle de contact, FX Renderer, `global-assets`, autres capacités, 103 créatures, `main`, GenSrpG principal et Exploration.
