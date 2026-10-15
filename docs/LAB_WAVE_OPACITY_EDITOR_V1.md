# Onde expansive — opacité auteur du projectile (V1)

15 octobre 2026 — dépôt autonome `GenSrpg_labo_combat_dynamique`.

## Diagnostic

L’export auteur de « Vague incendiaire » contient déjà `presentation.visual.travel.opacity:1`, mais l'éditeur exposait seulement l'opacité des phases cast, impact et zone. Pour l'onde expansive, les keyframes de `DomSkillFxRenderer` utilisaient sans condition `opacity:0.4` au départ et `opacity:1` à l'arrivée. Ainsi modifier uniquement la donnée n'aurait pas rendu l'onde transparente.

## Implémentation

- Human Editor : champ **Opacité de l’onde (%)** de 0 à 100, placé dans les réglages « Onde expansive » à côté des rayons et de l'épaisseur, sans suggérer une prise en charge des projectiles directs par ce lot.
- Modèle : le champ UI `travelOpacityPct` traduit en `presentation.visual.travel.opacity`, sans ajouter de deuxième source de vérité ; même valeur au rechargement et dans les transferts import/export.
- Renderer : opacité de l'enveloppe animée pendant `expanding_wave` = `visual.travel.opacity × 0.4` au départ et `visual.travel.opacity` à la fin. Avec 35 % : 14 % → 35 % ; avec 0 %, visuellement invisible. L'animation continue jusqu'au rayon final après contact selon le dernier correctif.
- Absence de changement du shell de collision, du balayage, de la puissance de projectile, des dégâts, de l'esquive et du ciblage (encore mono-cible en V1).
- Anciennes capacités sans opacité explicite : défaut = 100 %, trajet précédent conservé. Le nouveau contrôle peut servir également aux projectiles ordinaires, mais leur chemin visuel historique ne sera pas altéré par ce micro-lot : la présente correction renderer cible l'onde expansive.

## Calibrage visuel

`startRadiusPct`, `endRadiusPct`, `thicknessPct` s'expriment en **% de largeur d'arène** et définissent l'enveloppe annulaire qui surveille les collisions. `travelMs` fixe la vitesse de croissance. `displayScale` de l'asset n'est pas le rayon physique de collision pour l'onde. Le contour réellement coloré dépend aussi des transparences et marges internes du sprite : pour un alignement parfait, préférer un atlas recadré où le bord externe du feu atteint bien le contour externe de la case, sinon il restera un écart perceptuel entre le shell géométrique et les pixels colorés de l'onde. L'opacité ne modifie jamais les collisions.

## Tests et validation

Sentinelle : `tests/integration/expanding-wave-opacity-editor-v1.test.mjs`.
CI de laboratoire complète (Foundation + Firestorm Browser + Creature Library Browser) requise au SHA final. Checkpoint GREEN et publication `gh-pages` seulement après preuves vertes, et sous fast-forward/lease. Validation visuelle smartphone par l'auteur séparée de GREEN technique.
