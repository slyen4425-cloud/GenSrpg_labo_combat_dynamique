# Raiiven — prototype d'animation par poses complètes (isolé)

**État : préparation technique ; aucune nouvelle pose ni animation générée pour le moment.**

Ce chantier expérimental ne remplace aucun visuel ni sprite publié. Pas de modification de `main`, `global-assets` ou de la PWA sans validation de l'utilisateur.

## Sources officielles

- Visuels validés : branche `global-assets`, dossier `assets/library/capture/creatures/raiiven/runtime/` (face, dos, icône).
- Métadonnées : `assets/library/capture/creatures/raiiven/raiiven.meta.json` sur `global-assets`.
- Archive auteur : `data/capture/showcase/raiiven_monster_capture_valide.zip` sur `main`.

## Règle artistique impérative

**Chaque frame doit être une illustration COMPLÈTE, entièrement générée, de la créature dans une pose différente.** Ne jamais afficher des morceaux découpés ou un assemblage articulé comme résultat final. Aucun découpage ni rigging de membres n'est requis dans ce prototype. Un éventuel squelette de référence ne pourrait servir que de guide de pose invisible, jamais de rendu.

Conserver la silhouette, la tête, les couleurs, le style, les quatre membres et la perspective des références approuvées ; éviter les jambes additionnelles, la confusion avant/arrière et les changements de morphologie.

## Protocole

1. **Référence artistique** : choisir la vue joueur, arrière trois-quarts haut-droite, en partant du PNG officiel de dos.
2. **Planche de poses** : produire huit illustrations complètes de Raiiven à angle fixe, chaque image correspondant à un temps du cycle de marche. Soumettre au contrôle visuel.
3. **Contrôle anatomique** : exactement quatre pattes visuellement cohérentes dans chaque illustration ; membres avant et arrière identifiables sans inversion. Les règles automatiques de fichier ne prouvent pas cette cohérence : examen visuel indispensable.
4. **Export** : huit cases 512 × 512 RGBA transparentes, sans recouvrement et avec marges sûres. Générer une planche d'images et une prévisualisation animée.
5. **Validation** : montrer planche + aperçu dans le fil de conversation, éventuellement fournir lien de prototype séparé pour test téléphone ; n'intégrer au jeu qu'après validation expresse.

## État de l'outillage

`validate_sheet.py` contrôle le contrat, puis la taille, les marges et la transparence des images produites. Ce script ne fabrique pas les poses. Godot n'est pas nécessaire pour cette méthode de génération d'images complètes, et aucune animation Godot n'a été réalisée.

## Contrôles

`python prototypes/raiiven-rig/validate_sheet.py --spec prototypes/raiiven-rig/rig-spec.json` vérifie la configuration.
`python prototypes/raiiven-rig/validate_sheet.py --spec prototypes/raiiven-rig/rig-spec.json --sheet chemin/atlas.png` vérifie en plus l'export.
