# Combat Lab — projectile adverse / renvoi miroir et exports Grainou (2026-10-28)

## Symptôme et cause démontrée
Dans le `DomSkillFxRenderer` unique, un sprite dont l'asset déclare `resource.headingRad` suit le déplacement du projectile via `rotate(atan2(dy,dx) - headingRad)`. Pour un tir depuis la droite vers la gauche, `atan2` est proche de π : l'image entière tourne d'environ 180° et se retrouve tête-bêche. Les 8 sprites directionnels élémentaires de la bibliothèque globale possèdent cet angle natif (environ -0,45 à -0,53 rad). Les renvois `projectile_mirror` utilisent le même visual owner et héritent donc du défaut. Les projectiles non directionnels n'étaient pas concernés par cette rotation.

## Correction soustractive, autorité unique
- Dans `src/adapters/renderer/dom-skill-fx.js` seulement, `mirrorLeftward` se calcule avec `deltaX < 0` de la trajectoire réellement affichée. En cas d'asset directionnel et de déplacement vers la gauche, appliquer `scaleX(-1)` sur le sprite (pas sur sa trajectoire ni sur le modèle) et un cap local borné :
  `rotation = (theta > 0 ? theta - PI : theta + PI) + headingRad`.
- Les tirs de gauche à droite gardent `rotation = theta - headingRad` sans inversion.
- Sans `headingRad`, garder `rotate(0rad)` et aucune inversion (Tornade, sprites verticaux ou effets personnels) ; `skyfall` reste vertical.
- Le renvoi depuis `mirrorReturn.contactPoint` reprend ce traitement, avec le signe du vrai déplacement. Un miroir tenu à gauche comme à droite fonctionne ; aucune condition codée `fromSlot==="opponent"` n'a été ajoutée. Aucune modification aux contacts, collisions, puissances, dégâts, résistances, horloge, stats, AI, réacteur de miroir, ciblage, API d'assets ou UI de création.
- La chaîne publique des modules ESM (éditeur / preview 2v2 / combat 1v1 / renderer) a une révision unique `projectile-facing-grainou-20261028` pour charger la correction, sans duplicata de catalogue ou fallback.

## Données d'auteur : remplacement d'identifiants existants
- `crea_nat_1` / Grainou : export transmis conservé intégralement, 11 skillIds, loadout `coupe_feuille` et `graine_sansue_cap`, défense 30% / deux charges / 20s recharge / 0,4s fenêtre ; mêmes assets Hériplante face, dos, icône et sockets.
- `graine_sansue_cap` : export transmis conservé intégralement, CD 10s (au lieu de 45), projectileClash puissance 1 (au lieu de 0), icône `icon-skill-graine-sangsue-01`, voyage `sprite-graine-sangsue-projectile-01` et impact `sprite-graine-sangsue-debuff-01`. Marqueur unique `graine-sansue` inchangé : Nature, 5 dégâts/charge chaque 3s, restitution 100% des dégâts réels.
- L'éditeur utilise les deux chemins `data/capture/showcase/*.capture-*-transfer-v1.json` déjà répertoriés une seule fois dans ses catalogues actuels. Les deux sources complètes sont archivées dans `data/capture/source-exports/*-2026-10-28-r2.json` sans autorité runtime ; les archives antérieures restent intactes.
- Tous les IDs d'assets Hériplante et Graine sangsue utilisés sont déjà présents dans le catalogue `global-assets` : aucune mutation du dépôt média, aucun faux asset ou URL de secours.

## Tests et livraison
- TDD RED `tests/integration/capture-projectile-inbound-facing-grainou-2026-10-28.test.mjs` créé avant code : adversaire directionnel, retour miroir gauche, non-directionnel, skyfall et source auteur. Il a échoué comme attendu pour l'inversion et les nouvelles données.
- Test générique existant `tests/unit/projectile-sprite-orientation-v1.test.mjs` conservé et adapté à la nouvelle règle visuelle documentée.
- Régression bidirectionnelle : renvoi sur miroir adverse (retour vers joueur) et miroir joueur (retour vers adversaire), avec `contactPoint` initial inchangé.
- Vérification Chromium dans `tests/browser/capture-creature-library-smoke.mjs` : vrai renderer DOM, déplacement adverse, retour miroir, source visuelle, et menu éditeur de Grainou/Graine sansue, CD, assets et réaction.
- Les tests précédents `capture-graine-sansue-author-transfer` et `capture-author-grainou-coupe-feuille` sont conservés, les archives d'antan vérifiées au lieu de confondre leur état avec l'export plus récent.
- Critère de livraison : Foundation + 4 Chromium SUCCESS au même SHA, checkpoint GREEN, PR vers `gh-pages` avec contrôles de concurrence, CI déploiement SUCCESS. Contrôle tactile/visuel Android ensuite par l'auteur.
