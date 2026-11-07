# Mur de glace — placer devant, derrière ou librement (2026-11-01)

## Retour utilisateur et base
Le mur fonctionne comme une entité destructible et intercepte désormais les attaques physiques, mais l'éditeur ne proposait qu'un placement devant la créature ou des coordonnées X/Y dont la signification n'était pas expliquée. L'utilisateur ne peut donc pas demander explicitement un mur derrière Gorice.
Base exacte : `gh-pages@8736878345bb7735d95c223177603ebe12f05685` (CI et Pages post-PR #188 GREEN).
START : `checkpoint/lab-start-wall-placement-ux-2026-11-01`.
WORK : `work/lab-wall-placement-ux-2026-11-01`.

## Cause et correctif
- Le contrat `SkillEffectV1.summon_entity` n'acceptait que `protected` (devant, défaut historique) et `arena` (coordonnées). Les presets existants ne portent pas obligatoirement `placementMode` et doivent conserver exactement ce défaut.
- Ajout natif de `placementMode:"behind"` : validé par le même SkillEffect, conservé par `Combat State.combatEntities`, exporté/importé sans migration ni doublon, projeté par **le même** `CombatEntityOverlayV1`. La direction arrière est l'opposée du calcul existant du côté ennemi ; les offsets, échelle, sprite et rectangle de collision restent identiques.
- L'éditeur propose trois choix lisibles : « Devant la créature protégée », « Derrière la créature protégée », « Libre dans l'arène (X / Y) ». Le placement libre montre une explication persistante à côté des champs : X 0 gauche / 50 centre / 100 droite, Y 0 haut / 50 centre / 100 bas ; c'est **le centre du mur dans l'arène**, pas une coordonnée relative à la créature.
- Les champs d'offset créature et les champs de coordonnées absolues restent mutuellement exclusifs.
- Le Bestiaire cesse d'annoncer « les dégâts excédentaires touchent leur cible », formule rendue fausse par la PR #187 ; une frappe interceptée s'arrête entièrement au mur même si celui-ci est détruit. Un placement arrière est annoncé explicitement dans la fiche.

## Tests
- TDD RED : `tests/unit/capture-wall-behind-placement-ux-2026-11-01.test.mjs`, run https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/41325905542 : quatre assertions RED sur `placementMode:"behind"` refusé avant correction.
- Tests unitaires : mode avant inchangé, mode derrière natif, coordonnées arena exclues hors mode arena, snapshot PV et offsets, export/import d'une seule compétence, description Bestiaire conforme.
- Chromium : `tests/browser/capture-ice-barrier-editor-smoke.mjs` teste le mur visible derrière le combattant ainsi que les choix et l'aide X/Y dans le vrai éditeur.
- Révisions des entrées ESM des interfaces 1v1/2v2 et éditeur : nouvelle version des scripts et du renderer pour éviter l'ancien écran dans un navigateur mobile déjà ouvert.

## Livraison exigée
CI Foundation + quatre Chromium sur le SHA final code+doc, checkpoint GREEN exact, PR vers `gh-pages`, CI et Pages post-fusion réussis ; validation tactile Android utilisateur distincte. Ne jamais fusionner directement sur `main`.

## Hors périmètre
Pas de changement aux PV, impacts, interception, statut, charge, approches ni à la banque d'assets. Le détourage/cadrage des sprites de mur est un chantier indépendant. GenSrpg et Exploration inchangés.
