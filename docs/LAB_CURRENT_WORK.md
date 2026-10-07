# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Burrow Visual V1

Branche :
`work/lab-burrow-visual-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-burrow-visual-v1-2026-10-07`

Base :
`55dfafaee495c3e058363572b723a4f9ea7c8fc5`

Base GREEN précédente :
`checkpoint/lab-maraileron-author-export-v1-green-2026-10-07`

## Résultat

`approachMode: "burrow"` possède maintenant une projection visuelle générique :

`Runtime travelMs -> Presenter -> Visual Controller -> CombatVisualEvent burrow-attack -> Animation Core -> Renderer`

Séquence :
1. `burrow-dive` ;
2. `burrow-hidden` ;
3. `burrow-emerge-impact` ;
4. `burrow-home`.

La créature descend, disparaît, est repositionnée invisiblement sous la cible puis remonte rapidement vers elle.

La somme descente + cache + émergence est exactement le `travelMs` donné par le Runtime.

## Autorité gameplay protégée

Le gameplay Burrow existant reste inchangé :
- présence underground : Runtime ;
- timing : Runtime ;
- impact : Runtime ;
- dégâts : owners existants.

Aucun contact DOM n'est autoritaire :
- Presenter transmet `onContact: null` pour burrow ;
- Visual Controller interdit aussi le watcher visible pour burrow ;
- aucun `reportActionContact` burrow ajouté.

## TDD

RED :
- commit `b850914970ccb8da3b69ba6201f967af2eedfa28`;
- CI `37664557618`;
- 1230 / 1234 PASS ;
- 4 FAIL ciblés.

GREEN fonctionnel :
- commit `507ca13631372fe4289355f8cbeb0c7c6095ad89`;
- CI `37665033128`;
- 1234 / 1234 PASS ;
- 0 FAIL.

Rapport :
`docs/LAB_BURROW_VISUAL_V1.md`

## Fichiers fonctionnels

- `src/core/profiles/burrow-visual-profile-v1.js`
- `src/contracts/combat-visual-event.js`
- `src/core/animation/plan-animation.js`
- `src/adapters/renderer/combat-resolution-presenter.js`
- `src/ui/demo-app.js`
- `tests/unit/burrow-visual-v1.test.mjs`
- `tests/unit/demo-ui-boundary.test.mjs`

## Domaines protégés

Inchangés :
- Combat Runtime / Session / Timing ;
- gameplay presence ;
- Damage / Status ;
- collision owner ;
- projectile ;
- Roster ;
- Dodge ;
- persistent zones ;
- audio ;
- données auteur ;
- main ;
- Zombicide-40k ;
- Exploration.

## Point auteur de la lignée

Le lot précédent a intégré exactement :
- `cap_water_atk_2` — Morsure de marée ;
- `crea_maraileron` — Maraileron.

Checkpoint :
`checkpoint/lab-maraileron-author-export-v1-green-2026-10-07`.

## Prochaine action protocolaire

- CI finale documentaire ;
- checkpoint `checkpoint/lab-burrow-visual-v1-green-2026-10-07` ;
- preview `preview/lab-burrow-visual-v1-2026-10-07` ;
- validation smartphone utilisateur avant GREEN utilisateur.

Le chantier Dodge Custom Vanish FX V2 reste séparé et n'est pas ouvert depuis ce lot.
