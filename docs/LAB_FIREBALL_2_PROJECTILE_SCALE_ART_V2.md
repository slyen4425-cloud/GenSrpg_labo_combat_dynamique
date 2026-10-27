# LAB — Fireball 2 Projectile Scale & Art V2

## Statut

GREEN technique. Validation visuelle utilisateur attendue avant tout merge vers main.

## Retour utilisateur

Deux défauts étaient visibles dans le vrai combat :
- le réglage de scale projectile semblait ne pas s'appliquer ;
- le projectile Fireball 2 était beaucoup plus pauvre et petit que le modèle visuel attendu.

## Diagnostic démontré

### Scale

Le contrat et l'éditeur acceptaient déjà `displayScale` jusqu'à 8×, mais `src/adapters/renderer/dom-skill-fx.js` limitait encore le projectile à 4× avec `Math.min(4, ...)`. Le réglage était donc silencieusement tronqué dans le Render Adapter.

RED : `tests/unit/projectile-display-scale-v2.test.mjs`, commit `6c751ae66ce663a585de0ab29f632a63aa6820e8`, CI `37325539693` FAILURE attendu : 1035 anciens tests PASS / 1 nouveau FAIL.

Correctif minimal : seule la limite projectile du Render Adapter passe de 4 à 8. Aucun changement de géométrie, collision, trajectoire ou timing.

### Qualité / taille perçue

Le projectile alpha-clean V1 occupait seulement 7,3 % de sa frame source 512×512. Le scale agrandissait donc principalement une grande zone transparente, tandis que le feu visible restait petit et visuellement pauvre.

RED asset : commit `2e340123856597795cb3966d789fba2f2597aaf6`, CI `37325708492` FAILURE attendu : frame 01 couverture alpha 0.073, 204 tests PASS / 1 nouveau FAIL.

## Nouveau projectile V2

Le projectile est reconstruit uniquement depuis des sources HD déjà présentes dans le pack Fireball 2 : les phases avancées du Cast 512×512 servent de tête vortex détaillée. Une traînée de flammes distincte est ajoutée derrière sans nappe alpha commune.

Invariants :
- 12 PNG RGBA 512×512 ;
- atlas runtime 6144×512 ;
- même assetId `pack:capture:sprite-fireball-2-projectile-01` ;
- même catalogue et même resolver ;
- `headingRad: 0` ;
- `coreAnchor: { x: 0.666, y: 0.5 }` aligné sur le noyau visuel ;
- Cast et Impact inchangés ;
- aucune seconde autorité.

Sentinelles média :
- couverture alpha > 8 % et < 30 % ;
- pixels faible-alpha < 25 % des pixels visibles ;
- bounding box alpha forte >= 55 % de largeur et >= 36 % de hauteur ;
- dimensions et format RGBA conservés.

Publication asset : `dff69879fb99372f9727496fb8d67a3f1cd05325`.
Checkpoint asset : `checkpoint/lab-global-assets-fireball-2-projectile-scale-art-v2-green-2026-10-05`.
CI checkpoint asset : `37326842870` SUCCESS.
CI `global-assets` : `37326864054` SUCCESS.

## Raccord fonctionnel

Render Adapter : clamp projectile 4× -> 8×.
Cache revision : `2026-10-05-v14-fireball-2-projectile-scale-art-v2`.
Source fonctionnelle avant documentation finale : `31b445a2a2a49547e566cbaa68143a5448ff6c5f`.
CI : `37326902430` SUCCESS, 1036/1036 PASS, structure/indépendance OK.

## Architecture protégée

Aucun changement dans Combat Runtime, Combat Rules, Animation Core, FX Core, contact/collision, dégâts, énergie, cooldown ou définition de compétence. Aucun fichier Zombicide-40k touché.

## Validation utilisateur

Dans `capture-editor-v2.html`, sélectionner Fireball 2 comme projectile, modifier le scale (notamment 1×, 4× puis >4×), sauvegarder et lancer le combat.

À vérifier :
- taille change réellement au-delà de 4× ;
- vortex visible nettement plus riche et gros ;
- traînée lisible sans sous-calque/voile ;
- collision et impact inchangés.
