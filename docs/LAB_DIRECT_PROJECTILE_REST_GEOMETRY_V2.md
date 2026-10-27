# Labo Combat — Tir direct : géométrie opaque au repos V2

Date : 2026-10-12. Chantier isolé dans `GenSrpg_labo_combat_dynamique`.

## Régression / cause

Après la ligne stable et le contact à mi-arène, le tir pouvait encore passer au-dessus d'une créature immobile, notamment si son placement auteur `actor.position` décalait le modèle par rapport au centre de son slot. Le correctif précédent `restingProjectileAimRectV1` soustrayait la position courante du modèle pour supprimer les déplacements en vol/sous terre, mais ne réinjectait pas la position **de base** de la créature. Résultat : la position de repos réelle ne correspondait pas forcément au point visé.

Autre cause géométrique identifiable : le centre du rectangle englobant les pixels opaques peut être transparent (sprites ajourés, parties séparées). Le contact est pourtant déjà testé avec le masque alpha physique. Les tests isolent ces deux régressions, sans nouvelles règles de combat.

## Correction minimale par propriétaires

- `src/ui/demo-app.js` expose en lecture seule `getRestingOffsetFor(slot)`, en provenance de l'acteur normalisé existant. `src/ui/combat-2v2-test-ui.js` le passe à l'unique FX renderer.
- `src/adapters/renderer/dom-visible-model-contact.js` réutilise **le masque de collision déjà propriétaire** pour un point réellement opaque aussi proche que possible du milieu de la silhouette. Coordonnée locale en cache par masque ; transformation par `origin/axisX/axisY` de la frame existante, donc compatible avec l'échelle, le retournement et les translations.
- `src/adapters/renderer/dom-skill-fx.js` conserve le segment figé vers le slot de repos, mais tient compte de l'offset auteur natif et de ce point opaque. Les mouvements transitoires de la cible s'annulent par différence entre le point opaque mobile et l'ancre mobile : aucun tir à tête chercheuse.
- Le fallback (pas de masque prêt ou client sans nouvelle donnée) conserve le comportement précédent et les signatures restent additives.

## Comportements protégés

- Boule de feu reste `hitPresenceStates:["surface"]` : aucun hit sur cible en vol/sous terre sauf compétence autorisée.
- L'impact et les PV ne sont déclenchés que par `CombatRuntime` après le contact opaque `sweptPointHitsOpaqueMask` ; tir joueur/adversaire à mi-arène conservé.
- Pas de changement aux capacités, à leurs sons, leurs sprites, leurs sockets, aux vitesses de travel, au HUD, à la collision ou au système de présence.
- `skyfall` vise toujours son modèle live ; `beam` conserve son traitement distinct.

## Validation

Base `gh-pages` SHA `1e56e0cb7b48335b92cf69c2f9cc8f1c80d49ca0`, checkpoint `checkpoint/lab-start-direct-projectile-rest-geometry-v2-2026-10-12`, work `work/lab-direct-projectile-rest-geometry-v2-2026-10-12`.

- RED `dcb2b63b6d22527a4228b8d521f48b35ce2715f2` : nouvelles sentinelles du pixel opaque et de l'offset auteur absentes dans le code ancien.
- GREEN technique `458252c827547961883f885368c343654994a388`, CI `38248554062` : 1 556 tests Node OK, `foundation`, Chromium `firestorm-zone-growth-browser`, Chromium `creature-library-browser` SUCCESS.
- Test nouveau `tests/unit/direct-projectile-rest-geometry-v2.test.mjs` : masque ajouré, cible au repos avec offset +/- et échelles 0,7/1/1,8 ; translations air/sous terre invariantes ; FX renderer dans les deux sens. Sentinelles antérieures skyfall, boule de feu surface-only, contact à mi-arène repassées dans la CI complète.

Le SHA de validation finale sera celui du commit documentaire après réussite CI et checkpoint GREEN exact. La validation visuelle sur Android paysage demeure obligatoire avant de déclarer un GREEN utilisateur.
