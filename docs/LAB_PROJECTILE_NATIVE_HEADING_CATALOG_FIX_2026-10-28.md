# Labo Combat — Orientation des projectiles : réparation du catalogue canonique (2026-10-28)

## Signalement
Après le premier correctif des tirs adverses et des retours miroir (#118), plusieurs projectiles restent à l'envers. Le trajet était correctement inversé au contact, mais de nombreux sprites ne suivaient aucune orientation.

## Cause démontrée par le vrai navigateur
Le moteur `DomSkillFxRenderer` suit le signe de `deltaX`, mais applique `scaleX(-1)` pour un tir vers la gauche **uniquement lorsque le média résolu porte une valeur finie `resource.headingRad`**. Ce contrat préserve Tornade et les effets verticaux.
Or six atlas directionnels utilisés dans l'éditeur n'avaient pas de `headingRad` dans leur catalogue global-assets. L'ancien test navigateur #118 remplaçait le vrai résolveur par `assetForId:()=>({url:"/directional-projectile.webp",headingRad:-0.48})` : il validait uniquement un sprite fictif et masquait la mauvaise intégration des médias d'auteur.

## Correction — une seule autorité
Le catalogue de référence `global-assets/data/assets/catalog/global-visual-assets.v1.json` est désormais **la seule source du cap intrinsèque**, avec `headingRad:0` explicite pour six atlas conçus pour le vol horizontal vers la droite :
- `sprite-air-wind-bolt-01` (Rafale de vent)
- `sprite-steel-wing-projectile-01` (Aile acier)
- `sprite-kitsune-lunaire-projectile-01` (Sakura)
- `sprite-crachat-acide-projectile-01` (Crachat acide)
- `sprite-feuille-tranchante-projectile-03` (Coupe feuille)
- `sprite-graine-sangsue-projectile-01` (Graine sansue)

On n'a modifié aucun pixel, sprite atlas, déplacement, collision, timing, miroir, durée, élément, puissance ou compétence. Les huit anciens projectiles élémentaires à caps précisément calibrés (environ −0,45 à −0,53 rad) sont intacts. Aucun cap ajouté aux sprites non directionnels (Tornade) ni aux effets skyfall (chute de pierre/météorites). Le renderer unique conserve l'inversion horizontale quand le vol réel va vers la gauche, y compris le renvoi miroir à partir du véritable `contactPoint`.

Le catalogue média validé est livré avec un ref immuable, `a30333bb6da73c3c452506ad7997c5642536fa38`, référencé par `src/assets/global-visual-library.js` dans l'éditeur public. Les fichiers image continuent de provenir de `global-assets`. Le pointage explicite sur le commit évite les réponses obsolètes d'un cache CDN de branche, sans créer de deuxième registre ni mécanisme de secours.

## Contrôles et chaîne de preuve
- START : `gh-pages@d2f9f19618d26bc86adbd7c5698f59d4e72dfa5c` ; `global-assets@4d2f931c40fd87142958481bb972520bba2f2b2c`.
- Tests RED média avant correction : `f3e4875c`, CI `40710334697` FAILURE attendu.
- Test global-assets après correction : `0bdc986c`, CI push `40710792232` SUCCESS et PR `40711001526` SUCCESS ; checkpoint GREEN `checkpoint/lab-projectile-heading-catalog-global-assets-green-2026-10-28`.
- PR #119 fusionnée vers `global-assets@a30333bb`, CI `40711328559` SUCCESS.
- Test navigateur réel `verify-projectile-inbound-facing` : aucun `assetForId` fictif ; importe `GLOBAL_VISUAL_LIBRARY.catalogUrl` et `createGlobalPresentationAssetResolverV1`, utilise les transferts actifs `graine_sansue_cap`, `coupe_feuille` et `cap_air_atk_4`. Teste tir joueur, tir adverse, retour miroir avec `contactPoint`, Tornade qui reste droite et les six caps média.
- Premier navigateur RED sur cache CDN mutable (asset sans heading malgré branche média mise à jour), d'où épingle immuable du catalogue à son SHA. Les assertions de cohérence de cache vérifient le même URL de module média pour l'éditeur et la page.
- Validation requise côté `gh-pages` : Foundation + les 4 tests Chromium SUCCESS au SHA final, checkpoint GREEN, fusion PR, CI Pages SUCCESS, puis inspection Android de l'auteur.

## Périmètre strict
Un catalogue média, deux composants purs d'URL/version, les entrées HTML/éditeur déjà versionnées, la sentinelle cache, la sentinelle navigateur et la documentation. Pas de second renderer, pas de `fromSlot===opponent` pour orienter, pas de patch des sprites, pas de nouveau moteur, pas de modification des capacités/creatures de l'auteur ni de GenSrpg.
