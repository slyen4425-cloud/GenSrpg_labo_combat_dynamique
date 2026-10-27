# Sprite de zone persistante à portée longue — 16 octobre 2026

**Lot D — correction du raccord visuel, sans changement de gameplay.**

## Constat

La capacité auteur `cap_fire_atk_6` / « Tempête de flammes » évolue selon `short → medium → long`. Le lot précédent a calibré `displayScaleX=1.6` pour laisser l'ennemi de départ hors de portée au niveau 2. Les règles natives définissent `long` comme **tout le champ de bataille**, même lorsque l'ancien sprite, simplement agrandi de `radiusScale.long=1.9`, n'y parvient pas ; le contour tactique dessine déjà la frontière de l'arène.

## Solution propriétaire unique

- Le même `DomSkillFxRenderer.syncPersistentZones` projette désormais le **nœud original** de zone en `width=100%`, `height=100%`, centré à `50%/50%`, sans le scale ellipse, **uniquement si `zone.radius=long`**. Il ne clone rien et ne remplace pas les effets de dégâts : `PersistentZoneRuntime` conserve l'unique verdict d'occupation `long` et son horloge.
- Les rayons `short` et `medium` conservent exactement les dimensions et transformés précédents (issus du scale auteur et de la géométrie réellement échantillonnée) ; au retour d'une zone longue à une autre taille, les propriétés inline du plein terrain sont explicitement réinitialisées, sans recréation du nœud.
- Le sprite conserve son `assetId`, son `playbackMode`, sa boucle, ses animations et son opacité configurée. Pour les sprites importés en images séparées (`img.skill-fx__loop-frame`) dont `object-fit:contain` provoquait des bandes vides sur le 16:9, le seul état `data-zone-radius=long` emploie `object-fit:cover` ; les autres rayons et médias ne sont pas changés.
- Le contour tactique plein champ de l'étape C garde sa couleur native `skillElement` et reste sous le sprite ; aucun calcul de collision ou règle de hit spécifique au feu.

## Contrôles

- Sentinelle intégration `tests/integration/long-zone-sprite-coverage-v1.test.mjs` : même sprite du niveau 1 au niveau 3, borne totale du terrain à longue portée, retour contrôlé à taille moyenne, alpha et son conservés, expiration et cleanup.
- Sentinelle Chromium `tests/browser/firestorm-zone-growth-smoke.mjs` : 1v1 et 2v2 joueur/IA, progression courte/moyenne/longue, rectangle du sprite égal au vrai terrain à longue portée, limite visuelle et fin de zone. CI Foundation + Firestorm browser + Creature Library browser au SHA final ; test d'esthétique Android paysage distinct.
