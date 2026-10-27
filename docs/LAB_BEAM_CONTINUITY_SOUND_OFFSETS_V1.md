# Rayon continu — sons et raccord des décalages V1

Date : 2026-10-08

## Origine et gouvernance

Retour auteur : malgré le panneau Rayon générique en trois étapes (départ bouche → corps continu → impact), des séparations restaient visibles et la cohérence devait être contrôlée côté joueur comme adversaire. Le présent micro-lot poursuit le dernier GREEN déjà publié sans toucher aux nouveaux préréglages ni à la bibliothèque de sprites.

- Base publique **exacte** : `76524b596d6e421de1a0e7563ddb615e3a0024f9`.
- Checkpoint de départ préexistant : `checkpoint/lab-start-beam-continuity-sound-offsets-v1-2026-10-08`.
- Travail isolé : `work/lab-beam-continuity-sound-offsets-v1-2026-10-08`.
- Rollback : SHA de base ci-dessus, aucune modification de `main`.

## Cause et correction, sans second moteur

1. Le **propriétaire CombatResolutionPresenter** émettait déjà le FX pour `beam`, mais sa condition de démarrage de l'audio de trajet et son nettoyage de FX à la résolution ne reconnaissaient que `projectile`. Ces deux conditions utilisent désormais l'ensemble `["projectile","beam"]`, en conservant le même mécanisme de handle audio (arrêt à l'issue) et le même `cancelProjectileFor()` capable d'annuler les deux formes.
2. Le **propriétaire DomSkillFxRenderer** dessinait beam start + corps + embout dans un record commun et suivait déjà les ancres mobiles, mais ignorait les offsets visuels du cast et de la cible dans sa géométrie. `positionBeam()` prend maintenant l'offset X/Y du cast (sinon celui du beamStart/travel) comme point de sortie, et `impactFeedbackOffset` (sinon impact) comme point d'arrivée. La largeur et l'angle sont dérivés de ces deux points à chaque actualisation du repère ; pas d'horloge/timer supplémentaire.
3. Le **propriétaire CaptureSkillPresentationAssetsV2** applique à l'embout du rayon le point d'impact de la **vue cible**, au lieu de la vue lanceur. Le cast et le départ restent dans la vue lanceur. Cela préserve `same`, `mirror_x` et `custom` pour les deux équipes.

Préparation à la bouche, continuité départ/corps/embout et animations d'impact à la résolution continuent à appartenir à `SkillFxPlan` / `DomSkillFxRenderer`, aux réglages V9 existants et au gameplay autoritaire. Aucun second owner, aucun son imposé aux capacités sans audio et aucune modification artistique.

## TDD et vérifications

- Test RED (les deux lacunes initiales) : CI `37827929958`, échecs reproductibles `beam must play its configured travel audio` et origine géométrique `70px` au lieu de `100px`.
- GREEN moteur + interface avant dernière sentinelle : CI `37828057713`, SUCCESS.
- RED ciblé adversaire : CI `37828136771`, impact `{x:12,y:6}` au lieu de `{x:-30,y:9}` lorsque la cible est `opponent`.
- GREEN complet : CI `37828213599`, **1296/1296 tests Node PASS, 0 FAIL**, Browser Chromium Creature Library SUCCESS / 103 créatures toujours accessibles.
- Nouveau fichier `tests/unit/beam-continuity-sound-offsets-v1.test.mjs` : vraie présentation `CombatResolutionPresenter` release/outcome pour `beam`, audio travel start/stop, impact et cleanup; géométrie caster/target offsets, cible mobile, teardown.
- Sentinelle `tests/unit/skill-presentation-side-aware-v1.test.mjs` : les positions de l'embout `beam` correspondent à la vraie vue d'impact en player→opponent et opponent→player.

## Protection

0 fichier média ajouté/remplacé. Sources images et sons `global-assets` inchangées. Ne modifie pas le modèle « Rayon d'eau », son Undo, le panneau générique de trois phases, les assets originaux des 4 visuels, ni les fiches auteur `cap_water_atk_1`, `cap_water_atk_2`, `cap_water_atk_3` (la dernière reste `form=projectile` dans Showcase tant que l'auteur ne l'enregistre pas autrement). Les 103 créatures, dégâts, énergie, cooldowns, CombatSession, `main`, les autres dépôts sont préservés.

## Limites et validation

Le statut GREEN **technique** requiert le succès du dernier CI documentaire, un checkpoint exact et GitHub Pages SUCCESS. La qualité esthétique des raccords alpha/épaisseur, la présence de sons réellement configurés et la fluidité sur téléphone nécessitent encore une validation **Android utilisateur**. Aucun test Node seul n'est présenté comme preuve artistique.
