# Raiiven — prototype d'animation quadrupède (isolé)

**État : préparation technique, PAS d'animation validée, PAS de squelette Godot réalisé.**

Ce chantier expérimental ne remplace aucun visuel ni sprite publié. Pas de modification de `main` ou de `global-assets` tant que la prévisualisation n'est pas validée artistiquement.

## Sources officielles

- Visuels face, dos, icône : branche `global-assets`, dossier `assets/library/capture/creatures/raiiven/runtime/`.
- Métadonnées : `assets/library/capture/creatures/raiiven/raiiven.meta.json`, également sur `global-assets`.
- Archive auteur validée : `data/capture/showcase/raiiven_monster_capture_valide.zip` sur `main`.

Ne jamais redessiner ces images silencieusement ni les substituer aux références validées.

## Protocole de réalisation

1. **Anatomie** : établir quatre membres persistants, nommés avant-gauche, avant-droit, arrière-gauche et arrière-droit ; ajouter tête, torse, queue, sans inventer de nouveaux membres. Soumettre les contours et les points de pivot au contrôle visuel.
2. **Séparation** : les trois PNG approuvés sont des visuels aplatis, pas des découpes de rig. Obtenir des pièces avec les zones occultées reconstituées et conserver les proportions, le style et les couleurs. Éviter de faire croire qu'une transformation du PNG entier anime les pattes.
3. **Animation** : tester la marche à quatre appuis sur huit images, à angle fixe (vue joueur dos trois-quarts haut-droite). Ne pas inverser pattes avant et arrière entre images. Revoir le pas, les chevauchements et l'ombre de contact.
4. **Export** : atlas PNG ou WebP transparent de 8 cases 512 × 512, sans recouvrement, et une prévisualisation animée autonome. Le contrôle automatique est défini dans `validate_sheet.py` ; la cohérence anatomique et artistique reste une validation visuelle.
5. **Validation** : aperçu d'abord, validation de l'utilisateur ensuite, intégration et mise à jour du catalogue officiel seulement sur demande explicite.

## Limitations connues

Une source aplatie ne contient pas les parties cachées des pattes : le rigging semi-automatique demande une reconstruction artistique. Godot est une option d'animation, **non encore installé ni utilisé dans ce prototype**. Aucun résultat de rendu squelettique ne doit être annoncé avant sa production.

## Contrôle

`python prototypes/raiiven-rig/validate_sheet.py --spec prototypes/raiiven-rig/rig-spec.json` valide les métadonnées.

`python prototypes/raiiven-rig/validate_sheet.py --spec prototypes/raiiven-rig/rig-spec.json --sheet chemin/atlas.png` vérifie en plus les cases de l'atlas (nécessite Pillow). Il ne certifie pas l'absence de pattes fantômes : celle-ci demande une revue image par image.
