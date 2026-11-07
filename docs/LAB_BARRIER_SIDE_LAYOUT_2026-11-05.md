# Combat — Éditeur du mur destructible : lisibilité et réglages par camp (2026-11-05)

## Retour auteur
La capture de l'éditeur montre une longue grille sans ordre logique, des champs X/Y agrandis et des cases d'interception surdimensionnées. Le réglage visuel et spatial du mur doit être indépendant côté joueur et côté adversaire, comme le sprite adverse l'était déjà.

## Propriétaires et périmètre
- **SkillEffectV1** : seule définition sauvegardée, ajoute des valeurs adverses toutes facultatives.
- **CombatEntityV1** : transporte ces champs dans le même record d'entité ; un seul stock de PV et un seul identifiant de mur.
- **CombatEntityOverlayV1** : choisit l'échelle et les coordonnées du camp affiché ; le rectangle du sprite reste la géométrie réelle du capteur existant.
- **Capture Human Editor V2** : quatre ensembles lisibles (résistance, apparence joueur, position joueur, réglages adverses), puis interceptions compactes.
- **CSS éditeur** : grille adaptable aux tailles d'écran, cases 18 × 18 px dans des cibles tactiles >= 42 px.

## Contrat d'auteur
Le mur conserve `visualScale`, `visualScaleX`, `visualScaleY`, `placementMode`, `arenaXPct`, `arenaYPct`, `offsetForwardPx` et `offsetUpPx` pour le côté joueur. Les nouveaux champs facultatifs sont :
- `opponentVisualScale`, `opponentVisualScaleX`, `opponentVisualScaleY` ;
- `opponentPlacementMode`, `opponentArenaXPct`, `opponentArenaYPct` ;
- `opponentOffsetForwardPx`, `opponentOffsetUpPx`.

Les limites suivent les paramètres existants : échelle 0,25..12, multiplicateurs X/Y 0,25..8, coordonnées 0..100 %, décalages -150..150 px. Un champ adverse laissé vide signifie **hériter de la valeur du joueur**, sans créer de donnée supplémentaire. Le menu « Même placement que le joueur » conserve le comportement historique.

En arène libre, si `opponentArenaXPct` est absent, la projection historique place le mur adverse vers son protecteur ; si X adverse est fourni, ce pourcentage est exact dans l'arène entière. Y adverse peut hériter de Y joueur ou être réglé indépendamment. Les tailles s'appuient sur le facteur de présentation d'arène existant, identique à celui qui met les FX en parité entre portable et PC.

## Compatibilité
- Aucune altération rétroactive des exports auteur, y compris le mur de glace configuré à X=47/Y=55, scale=4 et largeur=1,5.
- Aucune seconde logique de collision, aucun remplacement de Combat Runtime, Damage ou State ; les calculs PV et interruptions restent inchangés.
- Un seul sélecteur de sprite joueur et un seul sprite adverse facultatif.
- Les valeurs ennemies facultatives transitent par le même export/import `SkillEffectV1`.

## TDD et critères de validation
- `tests/unit/capture-wall-side-layout-2026-11-05.test.mjs` : contrat, invalides, copie de valeurs, dimensions par équipe, positions, rétrocompatibilité et export/import.
- `tests/browser/capture-ice-barrier-editor-smoke.mjs` : éditeur réellement monté dans Chromium, groupes, modification par camp, valeurs joueur inchangées et cases compactes.
- Sentinelles existantes de projection 1v1/2v2, parité PC/téléphone, mur et impacts.
- CI Foundation et quatre navigateurs sur SHA exact. Un checkpoint GREEN n'est autorisé qu'après réussite et revue, puis PR vers gh-pages ; validation tactile Android réel distincte.
