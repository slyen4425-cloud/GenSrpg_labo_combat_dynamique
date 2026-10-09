# Opacité des sprites de cast, aura de zone et statuts — V1

2026-10-09 — laboratoire `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Besoin

L'utilisateur souhaite superposer une aura semi-transparente autour de la créature, sans masquer totalement le modèle par un calque devant ni dissimuler l'aura en la plaçant derrière. Le réglage doit concerner le cast, la zone/aura persistante et le visuel d'un buff/debuff, notamment un soin périodique.

## Gouvernance et autorité

- Base `gh-pages` : `176bd50b528364dd5507f50b824e32d610c4991f`, CI de base SUCCESS.
- Départ `checkpoint/lab-start-sprite-opacity-controls-v1-2026-10-09` ; branche isolée `work/lab-sprite-opacity-controls-v1-2026-10-09`.
- Source de vérité **inchangée** : `SkillPresentationBinding` (actuellement V9), propriété `visual.cast.opacity`, `visual.aura.opacity`, `statusVisuals[id].sprite.opacity` déjà définie entre 0 et 1 depuis les contrats existants.
- L'éditeur humain expose 0–100 % et convertit à la frontière UI seulement. Le renderer ne stocke jamais une seconde valeur ; il consomme l'opacité normalisée après `createCaptureSkillPresentationAssetsV2`.

## Causes et corrections ciblées

1. Cast/zone : l'opacité existait dans les contrats et `capture-skill-presentation-assets-v2` ; le moteur de zone applique déjà `visual.opacity`. L'éditeur n'exposait aucun champ dédié au cast/zone. Deux contrôles numériques en **%** (0–100, défaut 100) sont ajoutés à proximité des réglages visuels existants.
2. `skillSpriteControlsFromFieldsV1` / `skillSpriteControlFieldsFromVisualsV1` / `readSkillSpriteControlsV1` / `writeSkillSpriteControlsV1` utilisent le même mapping existant de sprites. Le nouveau pourcentage est converti exactement en fraction dans `skillSpriteOpacityPercentToUnitV1` avec refus hors 0..100.
3. Cause occultée mise au jour par RED : `visualSlot` reconstruisait **systématiquement `opacity: 1`**, écrasant l'opacité d'entrée. La fonction accepte désormais l'opacité demandée, validée sur 0..1, et conserve 1 par défaut pour l'ancien contenu.
4. Cast : `DomSkillFxRenderer` forçait sa keyframe 0.35 → 1 → 1 ; les keyframes respectent désormais le plafond `visual.opacity` (0.35 × fraction, fraction, fraction) tout en conservant exactement l'échelle, les offsets, le calque et les timings.
5. Buff/debuff : l'éditeur exposait déjà « Opacité du sprite » sous forme d'un nombre 0.05..1, peu lisible. Le champ devient « Opacité du sprite (%) » de **0 à 100** ; l'initialisation convertit les anciens sprites (0.85 → 85) et la sérialisation reconvertit 35 → 0.35. `dom-status-fx.js` respectait déjà `sprite.opacity` ; aucun rendu parallèle.
6. Les autres FX (particules de cast, impacts, fumée, sprites de rayon, sons) restent intacts. Le réglage ne promet pas un composite véritablement « autour » du volume de la créature : il permet une superposition transparente dans l'ordre de calque existant.

## Validation

- Test RED `tests/unit/unified-sprite-controls-v1.test.mjs` : démonstration du défaut de mapping, du `visualSlot` forçant 1 et des keyframes cast ignorant la configuration, ainsi que l'absence des champs.
- GREEN candidat : mêmes tests protègent 40 % cast, 25 % zone, 0 et 100 %, et le aller-retour `éditeur → draft → JSON → éditeur`; vérifient le DOM de cast/zone avec leur vrai renderer, durée et layer inchangés.
- La sentinelle du vrai navigateur Chromium `tests/browser/capture-creature-library-smoke.mjs` ouvre la capacité `lib_aqua_heal`, choisit des sprites visuels, saisit 40 % cast, 25 % zone et 35 % sprite du statut de régénération, sauvegarde et intercepte le **vrai fichier JSON exporté**. Cette vérification ne doit pas modifier le fichier auteur dans le dépôt.
- Le bon fonctionnement des 103 créatures, de la capacité Onde régénérante +5 immédiatement et +5/3 s pendant 20 s, du Beam et de la bibliothèque est protégé par la CI complète.
- Déclaration GREEN technique seulement si tests du SHA final Node et vrai Chromium sont SUCCESS, checkpoint et preview sur ce SHA, revue diff de la branche, puis publication `gh-pages` avec lease; validation du rendu sur téléphone distincte.

## Conseils pour essayer

Sur la capacité, sélectionner le sprite de cast ou de zone et régler « Opacité (%) » par exemple à **40 %**. Pour un statut `Buff / Debuff / Statut`, ouvrir le « Visuel persistant du statut », choisir un sprite et régler « Opacité du sprite (%) » à **35 %**. Sauvegarder, sélectionner le bon utilisateur/monstre pour le combat et constater l'effet. La couche devant/derrière reste indépendante.
