# Mur — collisions géométriques rayons et contact (31 octobre 2026)

## Base, gouvernance et responsabilités
- Dernier `gh-pages` GREEN au départ : `671f164f2e5b3f43d2922eb1513155db19d5dec9` (CI+Pages réussies). Départ `checkpoint/lab-start-wall-beam-contact-geometry-2026-10-31`, travail `work/lab-wall-beam-contact-geometry-2026-10-31`, issue #167.
- Sentinelle TDD RED déposée au SHA `89d3b48de05b0e948fc9c2d9c698050342491f21` et repère `checkpoint/lab-red-wall-beam-contact-geometry-2026-10-31`. La preuve GitHub du résultat RED se lit dans les Actions, pas dans ce document.
- Géométrie : le module pur `combat-barrier-spatial-v1` trouve la première intersection réelle segment/rectangle. L'overlay possède le sprite et le rectangle, pas les dégâts.
- `DomSkillFxRenderer` évalue le rayon depuis ses ancrages effectivement rendus (avec les offsets auteur lorsque le rayon actif existe), et le contact depuis les rectangles des créatures visibles à l'impact. Les deux utilisent la même fonction pure et `collisionRectsFor` filtrée par forme.
- `Combat Runtime` lit ce résultat à l'instant de résolution natif, sans nouvelle boucle d'animation. Le projectile conserve sa propre observation de trajet balayé. `Combat Damage` n'autorise l'absorption de **toutes** les trois formes physiques que si l'ID exact du mur protégé a été observé ; il applique dégâts bruts, PV, destruction et reliquat à la créature.
- Un contact prolongé réévalue cette preuve à chaque tick via le même Runtime et `CombatSession.applyContactHoldTickV1`. Aucun calcul de dégâts alternatif.

## Tests ciblés
- Un segment qui rate le rectangle visible, un ID absent ou étranger, ou un segment qui s'arrête avant le mur ne peut pas faire absorber des dégâts.
- Sur plusieurs murs, le premier touché est choisi. Une collision confirmée est traitée par Combat Damage et non par les FX.
- Test natif : Session crée un mur via `summon_entity`, puis un tick `contactHold` avec ID observé réduit les PV du mur ; sans preuve, le tick frappe le combattant.
- Test runtime : rayon du combattant ennemi vers la cible protégée, résolution à l'horloge de combat ; 0 appel d'autorité de HP par le renderer et un seul appel de lecture de géométrie au moment de l'impact.
- Chromium `capture-ice-barrier-editor-smoke.mjs` : vrai rectangle DOM du sprite, segment rayon/contact passant dans ou en dehors, PV appliqués nativement, sprite persistant et éditeur de ratio existant.
- Sentinelles existantes projetile/1v1/2v2 + Foundation et quatre jobs Chromium restent obligatoires.

## Publication et limites
- Ne **pas** apposer GREEN tant que la CI 5/5 du SHA final code+docs n'est pas réussie et que le checkpoint final n'existe pas.
- Le rayon est testé selon son axe, pas selon toute l'épaisseur de son sprite ; la mêlée est échantillonnée au contact, sans obstruction préalable du déplacement. Le mur est toujours placé devant le combattant protégé (offsets auteur), non librement dans l'arène.
- Les murs appartenant à d'autres cibles dans un combat 2v2 ne sont pas encore des obstacles collatéraux. Les zones, DoT, familiers actifs et canalisation #168 restent hors de ce lot.
- Aucun changement de `main`, `global-assets`, Exploration ou GenSrpg ; validation sur téléphone physique à faire par l'utilisateur.
