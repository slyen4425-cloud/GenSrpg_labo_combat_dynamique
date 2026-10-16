# Tactical Radius Overlay V1 — onde expansive et zones persistantes

**16 octobre 2026.** Labo Combat autonome, sans intégration au dépôt principal.

## Objet

Afficher une **limite tactique d'un pixel**, très discrète, en dessous du sprite artistique :
- l'**onde expansive** montre sa vraie limite extérieure de contact et, plus faiblement, le bord intérieur de l'anneau actif ;
- les **zones persistantes** montrent le bord de leur surface d'occupation : ellipse pour `short` / `medium`, pour `long` bord du champ entier (car `long` affecte toutes les positions du champ par contrat).

Les marques ne sont ni une seconde hitbox, ni une deuxième résolution des dégâts. Aucune valeur utilisateur d'art/sprite ou de skill n'est réécrite.

## Propriétaire unique / autorité

- `SkillDefinition.expandingWave` et `DomSkillFxRenderer` continuent à définir le shell de croissance utilisé par `sweptExpandingWaveHitsOpaqueMaskV1`. L'anneau est un enfant du **même shell** et hérite de sa transformation WAAPI ; épaisseur intérieure = `thicknessPct / (2 * endRadiusPct)` de chaque bord de la case.
- `DomSkillFxRenderer.syncPersistentZones` continue à projeter le seul sprite présent dans `sampleZoneSpatialContext`. Le cercle discret est un frère *non sélectionnable* portant exactement mêmes taille CSS, centre et transform pour `short` / `medium`. La même occupation native utilise une ellipse insérée dans les `bounds` du sprite via `visiblePersistentZoneRelationV1`. Le marqueur ne remplace jamais ce sprite comme nœud d'échantillonnage.
- `long` a une règle native de couverture complète : un cercle visuellement plus petit serait mensonger. La marque trace uniquement la bordure de l'arène pour ce cas, sans modifier le gameplay.

## Art et calques

- Le contournement d'opacité de l'ancien shell de l'onde est volontaire : le shell n'anime **que la transformation** ; son enfant artistique conserve exactement le fondu auteur de `0.4 × opacity` à `opacity` dans la **même durée WAAPI**, indépendamment de l'anneau tactique. Même si l'art est à 0 %, la limite réelle reste lisible.
- Dans les zones, le sprite initial conserve ses layers, sa `style.opacity`, sa lecture de frames et la position d'origine ; le marqueur est dessiné derrière, avec alpha fixé par le CSS, sans glow ni nouveau timer. Le nettoyage du même record détruit les deux.
- Trait neutre doré, bord discret, sans remplissage, `pointer-events:none`. Aucun curseur supplémentaire ni constante de gameplay.

## Limites voulues

- `expanding_wave` V1 demeure mono-cible ; l'anneau n'autorise pas une touche des autres ennemis en 2v2. Le contour informe de la géométrie de propagation, pas d'un nouvel AOE.
- Les effets de zone sans sprite configuré ne possèdent pas aujourd'hui de nœud visuel d'occupation ; leur fallback natif reste intact. Ne pas activer un nouvel échantillonnage spatial implicite depuis un décor sans sprite.
- Le contour extérieur est fidèle aux **bounds géométriques du moteur**, pas à chaque pixel lumineux du sprite. Ce choix permet un gameplay lisible même avec sprites flous, transparent ou glow.
- L'affichage réel sur appareil Android paysage requiert encore une validation esthétique et tactile de l'auteur.

## Dépendances et sentinelles

Tests `tests/integration/tactical-radius-overlay-v1.test.mjs`, `expanding-wave-opacity-editor-v1.test.mjs`, `expanding-wave-visible-continuation-v1.test.mjs` ; sentinelles existantes sur Firestorm, zone ground-anchor, sprite looping, refresh/rappel/expiration, wave clash/DoT ; CI Foundation + Firestorm Chromium + Creature Library Chromium au SHA final. GREEN uniquement après 3/3 PASS, revue de diff, puis checkpoint et promotion sous lease avec production inchangée.
