# Raiiven — prototype d'animation par poses complètes (isolé)

**État : premier essai de 8 poses rejeté ; galop de Raiiven en préparation par référence biomécanique. Aucune animation approuvée.**

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
2. **Référence du galop** : exploiter une séquence filmée/photographique de cheval au galop pour établir des poses cohérentes. À droite, l'ordre des quatre contacts est postérieur gauche, postérieur droit, antérieur gauche, antérieur droit, suivi d'une phase de suspension. Préparer huit poses sur un cycle complet sans inventer une démarche ni passer au trot. Sources : https://www.nga.gov/artworks/167046-plate-number-628-daisy-galloping et https://www.nga.gov/artworks/167044-plate-number-626-annie-g-galloping.
3. **Planche de poses** : une illustration complète de Raiiven par position issue du cycle de galop, même perspective arrière trois-quarts et tête dirigée vers l'adversaire. L'angle n'est pas un profil latéral. Soumettre au contrôle visuel.
4. **Contrôle anatomique** : exactement quatre pattes visuellement cohérentes dans chaque illustration ; membres avant et arrière identifiables sans inversion. Les règles automatiques de fichier ne prouvent pas cette cohérence : examen visuel indispensable.
5. **Export** : huit cases 512 × 512 RGBA transparentes, sans recouvrement et avec marges sûres. Générer une planche d'images et une prévisualisation animée.
6. **Validation** : montrer planche + aperçu dans le fil de conversation, éventuellement fournir lien de prototype séparé pour test téléphone ; n'intégrer au jeu qu'après validation expresse.

## État de l'outillage

`validate_sheet.py` contrôle le contrat, puis la taille, les marges et la transparence des images produites. Ce script ne fabrique pas les poses. Ni Godot ni Blender n'ont produit de poses dans ce prototype. Un gabarit 3D/quadrupède Blender ou un modèle expérimental de génération guidée par poses animales pourrait servir uniquement de **guide invisible** pour produire chaque illustration complète ; leur intégration et leur qualité restent à valider. Ne pas présenter la génération entièrement automatique comme déjà opérationnelle.

## Contrôles

`python prototypes/raiiven-rig/validate_sheet.py --spec prototypes/raiiven-rig/rig-spec.json` vérifie la configuration.
`python prototypes/raiiven-rig/validate_sheet.py --spec prototypes/raiiven-rig/rig-spec.json --sheet chemin/atlas.png` vérifie en plus l'export.

## Retour utilisateur (19 novembre 2026)

**Première planche refusée** : vue trop latérale, tête ne vise pas l'adversaire ; cycle de déplacement incohérent et ressemblant à une marche ou un trot. **Attente corrigée : galop franc**, fidèle à la biomécanique équestre. Ne plus soumettre de planche de marche ou huit poses aléatoires ; préparation des références réelles avant nouvelle génération.
