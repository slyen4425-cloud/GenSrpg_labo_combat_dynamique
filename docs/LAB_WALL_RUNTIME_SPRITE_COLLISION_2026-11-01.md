# Mur destructible : visuel auteur 2v2 et interceptions réelles (2026-11-01)

## Symptômes remontés
- L'utilisateur voit un placeholder au lieu du sprite choisi dans **Mur de glace** ; demande le réglage du scale, qui existe déjà mais doit être explicite.
- Le mur laisse passer des projectiles/rayons/mêlée, ne perd pas de PV ; disparitions occasionnelles sans diagnostic.
- Dernière base GREEN de ce chantier : `gh-pages@b713f3f72a3d57413a818cf4f07f772223899394`, PR #185 (3 sprites persistants) publiée avec Laboratory CI et Pages postmerge green. START `checkpoint/lab-start-wall-runtime-sprite-collision-2026-11-01`, WORK `work/lab-wall-runtime-sprite-collision-2026-11-01`.

## Causes vérifiées dans le code
1. L'éditeur `buildPreviewPresentationAssets` proposait `asset(id)`, mais **pas `visualAsset(id)`**. L'overlay du vrai combat 2v2 demande spécifiquement `visualAsset`; il obtenait toujours `null` et affichait le sprite placeholder. Correction : déléguer à **`native.visualAsset(id)`**, déjà fondé sur le résolveur unique des assets, y compris les images locales de l'auteur.
2. Les callbacks `barrierCollisionRectsFor` des deux UI oubliaient `kind` (rayon/mêlée), retombant sur la valeur par défaut `projectile` du capteur. Correction : transmettre **le type réel** jusqu'au rectangle de l'overlay; pas d'interception inventée hors géométrie.
3. `DomSkillFxRenderer.watchProjectileContact` sortait dès que `targetCollisionModelFor` n'avait pas encore de snapshot (images adverses lentes). Cela coupait également le capteur du mur, qui n'a **pas besoin du masque du combattant**. Correction : le capteur de mur tourne indépendamment ; le masque opaque reste optionnel, même position de projectile et même observateur/scheduler. Aucun dégât dans le renderer, les PV appartiennent toujours à Combat Damage.
4. Test Chromium physique du projectile initialement ROUGE : le rectangle visible du mur s'arrêtait à Y=5757, tandis que le centre du projectile était à Y≈5764 (le projectile passait **sous** le mur), même avec le capteur actif. Cause : l'ancienne ancre verticale du mur était à `bottom:10%` avec une image 92 px + une étiquette PV ; elle ne suivait pas le centre de la piste d'attaque. Correction dans **l'overlay unique** : centrer le mur autour de `top:50%` de la créature, et appliquer le décalage auteur vers le haut dans cette même projection. Ne pas attribuer artificiellement des dégâts quand une attaque passe hors du sprite réel.
5. L'éditeur expose déjà `visualScale` (0,25–4), enregistré dans `SkillEffectV1` et projeté par l'overlay à la fois sur le sprite et sur le rectangle de collision. Clarification du libellé `Échelle du mur (scale ...)` sans nouvelle règle ni champ parallèle.

## Comportement natif à préserver
- L'effet `summon_entity/barrier` officiel `mur_de_glace` est une seule compétence, `statId:glace`, `hpPerStatPoint:1`, sprite `pack:capture:sprite-mur-glace-01`. Il reste présent tant que Combat State contient l'entité avec PV > 0. `Combat Damage` l'abaisse à chaque contact validé; lorsqu'il arrive à 0, l'entité est retirée. Une seconde invocation de la même compétence **remplace** le précédent mur (avec une nouvelle réserve de PV).
- Seuls projectiles, rayons et mêlée réellement intersectés déclenchent les interceptions configurées. Une attaque passant à côté, un DoT ou une zone (non incluse dans `interceptKinds`) ne doit pas heurter le mur automatiquement. Ne pas créer une règle de dégâts « tout ce qui vise la créature touche forcément le mur ».
- Les paramètres de placement déjà disponibles : devant le combattant + `offsetForwardPx` et `offsetUpPx`, ou position X/Y libre dans l'arène. `visualScale` affecte la taille physique et la collision. Pas d'ID manuelle ni de sprite ajouté en double.

## TDD et déploiement
- Première sentinelle RED `tests/unit/capture-wall-preview-wiring-2026-11-01.test.mjs`, Foundation du run `41316727584` : trois cas en échec (facade, `kind`, absence de masque) avant correction. Code ensuite relié à la même source.
- Vrai Chromium : `tests/browser/capture-ice-barrier-editor-smoke.mjs` déclenche un projectile depuis le DOM avec le modèle adverse absent, traversée géométrique d'un mur visible et `applyCombatDamageV1` (80→57 PV, combattant intact).
- Chaîne de cache de l'éditeur et des modules Combat FX bump `wall-live-r2-20261101` ; JSON officiel, sprites média officiels, moteur de dégâts et contrats non modifiés.
- Exiger 5/5 CI sur le SHA code/docs final ; checkpoint GREEN exact, PR vers `gh-pages`, post-merge CI/Pages GREEN. Validation tactile Android par l'utilisateur distincte. Pas de modification de main / GensRPG / Exploration / global-assets.
