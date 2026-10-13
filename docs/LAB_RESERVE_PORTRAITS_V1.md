# Reserve Creature Portraits V1 — Rapport technique

Date: 2026-10-13.

## Source et frontière
- Base originale LIVE: `gh-pages@e4a53d82c79f88692f904b73e1a7660680639a08`; CI `38394748761` et Pages `38394747659` SUCCESS.
- Checkpoint départ: `checkpoint/lab-start-reserve-portraits-v1-2026-10-13`.
- Branche dédiée: `work/lab-reserve-portraits-v1-2026-10-13`.
- Scope: présentation des rangées de membres des réserves des deux camps, CSS compact et injection du descripteur déjà fourni par Visual Controller. Aucun changement Combat Rules, Roster Session, assets, créatures, capacités, targeting, recall, IA, main, global-assets ou autre dépôt.

## Vrai chemin
`Roster Session.snapshot().members[].creatureId -> Visual Controller.getCreatureDescriptor(id).iconUrl -> mountCaptureCombatRosterPanelV1 -> img portrait`.

La ligne conserve nom, PV, KO, sélection, désactivation, et ciblage des réserves. Un portrait absent laisse la ligne textuelle ; pas d'asset placeholder ni de bibliothèque secondaire. Les balises `img` sont décoratives (`alt=""`), chargées paresseusement ; le vrai libellé texte reste accessible. Le CSS compact vise le mobile paysage.

## Tests
- Sentinelle RED dédiée `tests/unit/capture-reserve-portraits-v1.test.mjs` : absence de portrait reproduite sur la chaîne réelle.
- GREEN Node après correction de la syntaxe d'une assertion de test ; les sentinelles historiques Roster/Targeting passent.
- CI sur commit de code `e7ba2276ba6fb657f33bfa4f3e8fc671140d9bd8`, run `38399670373` avec relance du seul job Chromium chronométré : Foundation + Firestorm Chromium + bibliothèque 103 créatures Chromium SUCCESS.
- Un premier passage du job navigateur a atteint son timeout de 50 s sans assertion de régression fonctionnelle ; relance ciblée SUCCESS sur le même SHA, sans modification des tests historiques.

## Sortie
Avant publication : SHA documentaire exact avec CI complète, checkpoint GREEN sur ce SHA, relecture du HEAD gh-pages, fast-forward protégé uniquement si la base n'a pas bougé, puis CI/Pages post-publication SUCCESS. Le test visuel sur smartphone réel reste distinct et non présumé.
