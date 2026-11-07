# Mur destructible — arrêt réel de l'approche au sol (2026-11-01)

## Reproduction observée
L'utilisateur confirme que le mur de glace subit des dégâts et que les charges négatives sont désormais interceptées, mais l'attaquant au contact continue visuellement son trajet jusqu'à Gorice au lieu de s'arrêter au mur.

Base exacte : `gh-pages@141f5f51393467e81299dd620dd691098f4ef744` (PR #187 publiée, CI/Pages GREEN).
START : `checkpoint/lab-start-wall-approach-stop-2026-11-01`.
WORK : `work/lab-wall-approach-stop-2026-11-01`.

## Cause racine
Le combat visuel `playApproachFor` utilisait `watchVisibleModelContact` uniquement pour la collision entre deux masques de créatures. Son animation sol continuait jusqu'au corps ennemi même lorsque la chaîne Combat Runtime/Damage avait une entité de mur valide. Il ne faut ajouter ni deuxième RAF, ni collision inventée par l'horloge ni déplacement compensatoire.

## Correction ciblée
- `watchVisibleModelContact` conserve **la même observation RAF** et accepte facultativement `obstacleRectsFor`. Elle balaie la trajectoire entre deux positions successives du combattant, avec élargissement géométrique selon les dimensions réelles de sa silhouette opaque, et prend le mur le plus proche. Un obstacle latéral n'est pas touché. Le body watcher historique reste le fallback.
- `CombatEntityOverlayV1.collisionRectsFor` fournit **le rectangle du même sprite existant** (et son `entityId`) aux deux présentations 1v1/2v2, sans copie de géométrie métier et sans nouvel état de PV.
- `CombatResolutionPresenter` relaie l'identifiant observé. `demo-app` arrête la phase sortante et renvoie l'acteur depuis sa position atteinte avec la primitive d'animation déjà utilisée pour le vrai contact corporel. La logique du vol, téléportation et souterrain est protégée.
- `Combat Runtime` transmet l'ID exact observé pour le contact `ground` plutôt que de recalculer un impact au corps ; le mur géré par le propriétaire de dégâts absorbe la frappe. Une collision murale ne doit pas être injectée comme un contact corporel dans le moteur des zones. Un impact sur mur ne démarre ni `contactHold` ni canalisation sur la créature protégée.
- Même entrée de modules versionnée pour les consommateurs mobiles, sans deuxième module d'observation concurrent.

## Tests et validation
- Sentinelle TDD RED `tests/unit/capture-wall-ground-approach-stop-2026-11-01.test.mjs` : mur frontal avant le corps, obstacle décalé hors trajectoire, arrivée de droite vers gauche, boucle RAF unique. Run RED initial : https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/41322950095.
- Chromium réel `tests/browser/capture-ice-barrier-editor-smoke.mjs` : rectangle de sprite réellement monté, balayage du déplacement et identification du mur sans collision imaginaire.
- Une régression de sentinelle aérienne sur `onContact()` a été corrigée **sans modifier l'aérien** (elle venait de la propagation de l'argument supplémentaire hors sol).
- Validation requise : 5/5 jobs CI au SHA final code+documentation, checkpoint GREEN exact, PR vers `gh-pages`, CI+Pages post-fusion GREEN, puis validation tactile Android distincte.

## Hors périmètre
Ne pas modifier `main`, GensRPG, Exploration, global-assets, les sprites, la position arrière/placement libre, les coefficients HP, les statuts ou les déplacements hors sol. Le travail du cadrage des sprites et du placement arrière sera isolé dans des lots distincts.
