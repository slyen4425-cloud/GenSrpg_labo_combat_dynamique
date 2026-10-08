# Rayon générique, préparation à la bouche et annulation du modèle — 2026-10-08

## Pourquoi ce chantier
Retour auteur : la carte Rayon précédente affichait 4 étapes peu intuitives, le bouton utilisait le nom d’une compétence (« Jet pressurisé ») pour une mécanique générique, les valeurs remplacées par le modèle n'étaient pas récupérables et le visuel de charge apparaissait comme une animation supplémentaire non raccordée au départ.

## Base, owner et protection
- Base publique GREEN : `95485f318c1593aa2b369afa3faf9c7057000a91`.
- Départ : `checkpoint/lab-start-beam-simplified-reversible-ui-v1-2026-10-08`.
- Travail : `work/lab-beam-simplified-reversible-ui-v1-2026-10-08`.
- UI uniquement : le Human Editor utilise toujours les mêmes 12 champs canoniques, déplacés par `CaptureBeamStageLayoutV1` sans cloner leurs valeurs, juste après les zones persistantes.
- Propriétaire des valeurs du modèle : `capture-editor-beam-visual-pack-v1.js`. Le snapshot est éphémère, limité aux 19 inputs modifiés (style, choix de sprites, scale, cast offsets, playback, durée/offsets impact). Aucun stockage concurrent ni changement de la définition Gameplay.

## Ergonomie
- Le bouton est désormais `Appliquer le modèle de rayon d’eau` : c’est un modèle d'FX, pas une compétence appelée Jet pressurisé ; pack ID historique interne `pressurized-jet` conservé par compatibilité avec les tests/ressources.
- `Annuler le modèle — retrouver mes réglages` restaure les valeurs d’avant l’application et la forme précédente (par exemple Projectile). Le bouton est désactivé tant qu’aucun modèle n’a été appliqué ; choisir une autre fiche ou Nouvelle capacité efface la sauvegarde temporaire.
- Visuellement, la carte `Rayon continu — 3 phases` présente :
  1. Charge à la bouche et départ : même sprite `beam-start` durant la préparation et à l'émission, socket (ex. `mouth`) conservé. Le cast séparé reste configurable manuellement, jamais imposé par le préréglage.
  2. Corps continu : rayon source→cible, moteur FX existant.
  3. Extrémité cible et impact : suivi de cible, événement de contact existant.
- Le modèle n'utilise que trois asset IDs actifs (départ/corps/impact). L'ancien sprite `sprite-pressurized-jet-cast-01` n'est pas supprimé de la bibliothèque, mais il n’est plus ajouté automatiquement.

## Fichiers / média
- 0 nouveaux médias, 0 fichier source binaire touché. Les trois assets sont les trois atlas WebP du pack déjà présent sur la branche `global-assets` SHA `74ac3314f2d20eeadad77b439d5f229f5dacee3e`.
- Affichage et preview reposent sur `SkillPresentationBinding V9`, le même `DomSkillFxRenderer` et les mêmes repères Source/Cible que le chantier précédent. La page de démonstration utilise maintenant l'image du départ du rayon aussi pendant la préparation.
- Pas de nouveau timer gameplay ou FX, pas de moteur bis, pas de changement de contrat, pas d'altération de `cap_water_atk_3` sauvegardé (reste une attaque `projectile` tant que l'auteur ne l'enregistre pas en `beam`).
- `main`, `global-assets`, les deux autres labos, dégâts, résistances, dégâts/pénétration, audio, créatures/leurs loadouts, cooldowns inchangés.

## Tests
- RED : CI `37817811130` avant implémentation.
- Foundation GREEN : CI `37818320673` avec 1293/1293 tests Node réussis et véritable smoke Chromium validant le regroupement `6+3+3` et la bibliothèque de 103 créatures, 0 régression.
- Test supplémentaire : modèle utilise `beam-start` pour la préparation et le départ, socket `mouth` conservé sur l'export de capacité connu, aller-retour Capture Transfer.
- La CI documentaire et le déploiement final doivent réussir avant la déclaration GREEN technique ; le contrôle artistique et la disposition sur smartphone restent réservés à l’auteur.

## Rollback
La base publique d'avant le lot est `95485f318c1593aa2b369afa3faf9c7057000a91`. Le checkpoint GREEN du lot et la preview doivent pointer sur un SHA final CI-success ; publication Pages uniquement en fast-forward protégé avec confirmation de déploiement.
