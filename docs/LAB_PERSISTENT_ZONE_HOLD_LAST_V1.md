# Animation de zone : conserver la dernière frame — 2026-10-11

## Diagnostic

Le réglage « Jouer une fois puis garder la dernière image » n'était présent que dans la sélection du sprite de statut. Les zones persistantes étaient limitées aux modes `once`, `loop` et `stretch` dans l'éditeur ; le validateur des slots `SkillPresentationBindingV1` rejetait `visual.aura.playbackMode="hold-last"` même sur les présentations récentes V9/V10.

Le renderer `applySpriteVisual` supportait déjà `hold-last` avec `animationFillMode="forwards"` pour les atlases, ou des frames séparées conservées jusqu'à la suppression de l'objet propriétaire. `syncPersistentZones` crée un unique sprite à l'activation de zone, ne le redémarre pas lors d'un refresh et ne le détruit qu'à la disparition native de cette zone. Ajouter un second moteur aurait été une régression architecturale.

## Correctif minimal

- `src/contracts/skill-presentation-binding-v1.js` : autorise `hold-last` **uniquement pour `visual.aura`**, sans élargir les modes autorisés de cast / impact / projectile.
- `examples/dom-demo/capture-editor-v2.html` : ajoute « Jouer une fois puis garder la dernière image (jusqu’à la fin de la zone) » dans « Animation de la zone ».
- Aucune retouche au renderer, runtime de durée de zone, aux effets de statut, aux médias ou aux données de compétences auteur.

## Régressions et tests

- Base `gh-pages` `1720efbc90339962fd176e486ca43ba2c378265b`; départ `checkpoint/lab-start-persistent-zone-hold-last-v1-2026-10-11`.
- Test RED `382e6d41fe9dee11b2ff6de4552a2a86c29480c2` / CI `38095423671` : l'option HTML était absente et le contrat refusait l'aura `hold-last`.
- Test `tests/unit/unified-sprite-controls-v1.test.mjs` : vrai chemin `éditeur → normalisation de draft → export/import → resolver d'assets → DomSkillFxRenderer → suppression de zone`; vérifie `1` lecture, `720ms` natif du sprite test, gel sur dernière frame, même élément après refresh, aucune extension artificielle de durée et suppression par `syncPersistentZones([])`.
- Le test vérifie aussi que les autres slots cast/impact refusent `hold-last`, et que la bibliothèque des créatures et les autres scénarios restent couverts par la CI.

La validation de l'effet sur smartphone Android reste un contrôle utilisateur distinct après publication.
