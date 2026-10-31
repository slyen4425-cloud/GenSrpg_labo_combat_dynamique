# Mur destructible — réglages, sprite persistant et collision visible (2026-10-31)

## Gouvernance et sources de vérité
- Source : `gh-pages@b7260388a81df97e5b0c24344996435da8be598d`; START `checkpoint/lab-start-barrier-spatial-visual-2026-10-31`; branche `work/lab-barrier-spatial-visual-2026-10-31`.
- Chantiers liés : entités/familiers #167 ; canalisation #168. `main`, GenSrpg, Exploration et `global-assets` ne sont pas modifiés.
- Contrat : `SkillEffectV1.summon_entity` ; `Combat State.combatEntities` seul propriétaire des PV ; `Combat Damage Application` seule autorité de dégâts ; le renderer ne décide que des collisions visuelles observées et de la présentation.

## Comportement implémenté et éditable
- Statistique source officielle : `glace` (autre statistique du registre possible), points figés lors de l'invocation. `maxHp = statPoints × hpPerStatPoint`, arrondi à deux décimales ; coefficient libre strictement positif. Exemple 80 points et 2,5 PV/point = 200 PV, indépendants de ceux du combattant.
- Éditeur Effets tactiques > `summon_entity` : sélection de la stat officielle, coefficient PV/point, formes interceptées, sprite depuis la bibliothèque visuelle partagée (aucun ID manuel), échelle visuelle/collision 0,25–4, avancée et hauteur chacune entre -150 et +150 px. Ces paramètres passent par le même import/export et le contrat normalisé.
- `CombatEntity` stocke l'identifiant de l'asset et les dimensions/offsets à la création, sans recopier ni créer un catalogue d'images. Le rendu projette une image si l'asset existe ; sinon il montre une silhouette glacée provisoire distincte du sprite artistique final. L'image et le conteneur DOM **persistent** entre deux états du combat ; la baisse des PV déclenche un flash visuel, le mur disparaît à sa destruction native. L'affichage est partagé par 1v1 et 2v2.
- Projectiles : trajectoire échantillonnée par le renderer existant (une seule boucle RAF), intersection segment–rectangle sur le DOM réellement rendu. Une intersection envoie `combatEntityId` à `CombatRuntime.reportActionContact` ; celui-ci continue son unique parcours `CombatSession → ActionResolver → Combat Damage`. Si le projectile n'a pas traversé le rectangle, le mur ne prend pas ses dégâts, même s'il protège la cible. Le contact est borné par les protections/validations existantes du moteur et aucun deuxième impact n'est créé.
- Le mur absorbe les dégâts bruts reçus AVANT les protections et les effets reçus par la créature ; ces derniers n'agissent que sur les dégâts résiduels. La vie du mur n'est ni un statut de bouclier ni un combattant caché. Projetions de vie et impact visuel n'ont pas d'autorité de combat.

## Portée limitée et suites
- Le premier modèle place chaque mur devant la créature protégée, avec offsets réglables, pas librement sur toute l'arène. Son volume suit la dimension réellement affichée.
- Les **rayons et le contact** restent interceptés via le contrat de protection natif du jalon précédent, sans collision géométrique libre complète. Idem pour les attaques de zone, DoT, autres cibles de 2v2 et objets autonomes : pas de promesse de mur universel obstruant chaque trajet.
- Aucun nouveau sprite artistique de mur n'a été créé ou déclaré validé ; la sélection d'un asset déjà réel est possible, la silhouette CSS est provisoire. Preview smartphone et validation artistique de l'utilisateur toujours à faire.
- Suite issue #167 : obstacle placé librement, interception géométrique beam/contact, cibles collatérales 2v2, éventuellement déplacement bloqué, destruction FX par vrai sprite, et familiers actifs. Pas de double moteur ni de `main` mis à jour automatiquement.

## Preuves de tests
- TDD RED au commit `daff5f788d03362e0d9a452e4eecd91d21fc6732` ; référence `checkpoint/lab-red-barrier-spatial-visual-2026-10-31`, CI `41232575629` (Foundation FAIL attendu car le module spatial n'existait pas encore ; autres sentinelles vertes).
- Tests unitaires `tests/unit/capture-combat-barrier-spatial-visual-2026-10-31.test.mjs` : ratio 2,5, échelle/offsets, intersection segment–rectangle, projectile hors rectangle et collision autorisée, PV du mur distincts des amplificateurs sur le combattant.
- Vrai Chromium : `tests/browser/capture-ice-barrier-editor-smoke.mjs` : acteur et asset DOM persistants, image sélectionnable, rectangle non vide, collision, projectile contournant, perte réelle 80 → 55 PV et contrôles auteur. Les autres sentinelles 1v1/2v2 et UI mobile du workflow restent en place.
- CI avant documentation au commit `dc6145b7de5a1e761b32783631395efb1a959f37`, run `41232650713` : **5/5 SUCCESS**, Foundation 2442 tests Node, 4 jobs navigateur. Ce n'est pas encore la CI du SHA final documentaire, donc checkpoint GREEN et fusion conditionnés à sa revalidation.

## Cache public / reproductibilité
- Le HTML public, son bootstrap, l'éditeur, le chargeur de preview, la preview Combat et le contrôleur 1v1/2v2 partagent désormais une nouvelle révision ESM `wall-spatial-20261031`; le renderer d'entités et celui des projectiles ont eux-mêmes une révision dédiée. Aucun asset `global-assets` n'a été modifié. La sentinelle Ice VFX existante exige le même jeton sur ces six entrées.
- Après cette modification de livraison, **toute CI précédente est indicative seulement** ; ne pas créer le checkpoint GREEN ni fusionner avant CI 5/5 sur le commit final et CI/Pages au SHA de fusion. Le comportement sur appareil réel demeure à tester par l'utilisateur.

## Raccord final du sprite à la seule bibliothèque
- Audit de la preview : `CaptureSkillPresentationAssetsV2` exposait `audioAsset` mais pas `visualAsset`, si bien que la projection de mur ne pouvait pas résoudre le vrai sprite malgré la sélection dans l'éditeur. Cause racine corrigée : la même instance du résolveur canonique fournit désormais `visualAsset`, consommé par l'overlay ; aucun catalogue doublon ni URL fabriquée. La couverture du vrai chemin de cette méthode figure désormais dans les tests unitaire et Chromium.
- Les imports publics versionnés de la présentation sont rafraîchis à nouveau. Le SHA documentaire précédent ne suffit pas comme preuve de livraison : CI intégrale finale requise.
