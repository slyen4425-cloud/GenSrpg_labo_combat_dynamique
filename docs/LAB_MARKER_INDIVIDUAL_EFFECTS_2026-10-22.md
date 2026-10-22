# Marqueurs : effet individuel dès la première charge (22 octobre 2026)

## Demande et diagnostic
Le réglage « effet propre du marqueur » ne permet aujourd'hui que dégâts ou soins périodiques. L'auteur veut également toutes les familles déjà autorisées par les effets natifs : malus/bonus déplacement, recharge, énergie, dégâts sortants, stat en points/% et états de contrôle. La mécanique de seuil multiple validée ne doit pas être modifiée.

## Contrat et propriétaire
Ajouter aux marqueurs partagés un champ facultatif `onStackAdded:{effects:[...]}`, indépendant de `periodic` et `onStackThreshold`. Chaque nouvelle charge **effectivement ajoutée** (y compris la première, jusqu'à maxStacks) déclenche ses effets via `applyImmediateTacticalEffectsV1`, le moteur natif et sa protection habituelle. Pas de déclenchement sur charges inchangées, expiration, consommation, ou import/export. Un déclenchement seuil peut ensuite se produire pour la même charge, dans l'ordre documenté « effet individuel puis seuil ». Les statuts déclenchés ont leur **propre durée** — comme les statuts de seuil — et ne sont pas des projections permanentes du compteur : enlever la charge n'annule pas rétroactivement leur durée. Pas de second compteur, timer ou nouveau système de buff.

## Périmètre
- `src/contracts/capture-marker-v1.js` et `src/contracts/status-effect-v1.js` : champ additionnel, normalisation et contraintes.
- `src/core/combat/status-effect-runtime-v1.js` : déclencher les effets à chaque charge réellement ajoutée via le même resolver.
- `src/ui/capture-marker-library-v1.js` et `examples/dom-demo/capture-editor-v2.html` : choix séparé « effet individuel » avec types natifs et durée/stat contrôlées. L'existant périodique dégâts/soins conserve sa sémantique.
- `tests/unit/capture-marker-individual-effects-2026-10-22.test.mjs` : première charge, 3 charges, cumul/contrôle, plafond, indépendance seuil, persistance et rétrocompatibilité.
- `tests/browser/capture-creature-library-smoke.mjs` uniquement si nécessaire pour la preuve UI réelle.
- `docs/LAB_CURRENT_WORK.md` et ce document.

## Protégés
Règles et formules de dégâts, timeline combat, objets existants, créatures/capacités auteurs, musiques/SFX, `main`, `global-assets`, labo Exploration, dépôt GenSrpG principal. Aucun renommage d'ID de marqueur ni altération d'existant. Chaque effet importé non éditable doit être conservé fidèlement.

## Gouvernance
Base `gh-pages@155c7270cfd2ca0ebdf390bead7bcd97ec627dde`.
START `checkpoint/lab-start-marker-individual-effects-2026-10-22`.
Work `work/lab-marker-individual-effects-2026-10-22`.
CI 5/5 + vrai éditeur navigateur, checkpoint GREEN après validation.

## Validation technique
- CI branche 39851925050 : cinq jobs réussis (foundation, créatures navigateur, zones Firestorm, vague 2v2 et vague mobile).
- Le parcours Chrome crée un effet individuel de stat Esprit et un deuxième effet de recharge, réenregistre le marqueur, le recharge, puis vérifie l'export des effets individuels et de l'ancien seuil.
- Les tests unitaires couvrent l'ajout de 1 ou plusieurs charges, le plafond, les durées natives indépendantes, la consommation, le cumul des pénalités et le fonctionnement ancien.
- Le marqueur peut combiner trois domaines indépendants : `onStackAdded` immédiat, `periodic` dégâts/soins selon l'horloge, et `onStackThreshold` au seuil. Les effets natifs ne sont pas supprimés rétroactivement avec la charge : leur propre durée s'applique.
- Validation du ressenti sur smartphone et configuration exacte des marqueurs existants par l'auteur après la fusion.
