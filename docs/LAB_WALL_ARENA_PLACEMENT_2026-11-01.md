# Mur destructible — placement auteur dans l'arène (2026-11-01)

## Gouvernance
- Source de départ : `gh-pages@b9f4421afc99ae2217d84511f387192a862410b1`, CI 5/5 et Pages réussies.
- START `checkpoint/lab-start-wall-arena-placement-2026-11-01`; WORK `work/lab-wall-arena-placement-2026-11-01`; issue #167.
- RED `df719283422026015a921f2d259fa4ccd0a90098`, run `41256892430` en échec prévu. Tests précèdent l'implémentation.
- GREEN uniquement si Foundation et les quatre Chromium confirment le SHA final, puis checkpoint, PR, fusion et CI/Pages du SHA de fusion.

## Contrat et source de vérité
- `SkillEffectV1.summon_entity` conserve l'ancien comportement quand `placementMode` est absent.
- Nouveau choix explicite `placementMode:"arena"`, `arenaXPct` et `arenaYPct`, chacun dans 0..100 (axe Y depuis le haut). Invalide : pourcentages hors limites, coordonnées sans mode arena ou mode inconnu.
- Les coordonnées sont enregistrées dans l'entité immutable de Combat State lors de l'invocation, avec les PV issus du barème auteur de stat. Aucun identifiant manuel ni modèle parallèle.
- `CombatEntityOverlayV1` possède le seul sprite et projette le positionnement depuis l'arène affichée. La même fonction `collisionRectsFor` fournit toujours le rectangle physique réel ; Combat Damage et Combat Runtime gardent l'autorité dégâts, PV et timing.
- Le mode classique conserve l'ancrage au combattant et ses décalages. Dans l'éditeur, les réglages X/Y du mode arène et les décalages classiques s'affichent exclusivement selon le mode, sans supprimer les valeurs auteur.
- Le bestiaire explique la position libre quand elle est configurée.

## Preuves
- Unités : validation et limites, absence de changement aux anciennes compétences, snapshot des positions et PV, aller-retour `exportCaptureSkillTransferJsonV1` / `importCaptureTransferJsonV1` avec le vrai preset Mur de glace.
- Chromium : vrai sprite persistant et rectangle de contact, projection X=25 %/Y=65 % sur arène test, collision réelle, édition et bascule des réglages dans la vraie interface.
- Les sentinelles Foundation, 1v1/2v2, animations et autres tests Chromium doivent rester vertes.

## Limites explicites
- Ce lot offre des coordonnées **dans l'éditeur**, pas encore un geste de glisser-déposer dans l'arène du jeu.
- La collision avec un mur reste liée à sa cible protégée. Un mur placé dans la trajectoire d'une autre cible 2v2 n'est pas encore un obstacle collatéral universel.
- Pas de blocage des déplacements par le mur, ni de familiarités offensives, ni de canalisation (issue #168).
- Validation smartphone Android physique distincte. `main`, GenSrpg, Exploration et global-assets inchangés.
