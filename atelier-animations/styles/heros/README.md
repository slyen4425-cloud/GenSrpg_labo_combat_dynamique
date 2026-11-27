# STANDARD D'ANIMATION — HÉROS HUMANOÏDE D'EXPLORATION

**Référence : [Héros vert, huit directions de marche](references/heros-vert/README.md).** Marche validée en jeu le 27 novembre 2026. Ce standard complète les standards de créatures sans remplacer Cheval, Gorille ou Araignée.

## Recette obligatoire

- Style chibi illustré haute définition, propre à chaque héros : ne pas pixeliser, ne pas changer la tête, les proportions, les vêtements, les couleurs ni les accessoires du modèle cible.
- Huit directions N, NE, E, SE, S, SW, W, NW, chacune avec six vraies poses de marche dans l'ordre 00→05 puis 00. Une direction conserve le même angle dans toutes ses poses. Deux bras, deux jambes, alternance des appuis et opposition naturelle bras/jambe ; contrôler les deux demi-cycles et le raccord.
- Canevas auteur 512×512 PNG RGBA réellement transparent, sans ombre intégrée ni décor. Ancrage et échelle constants ; vérifier le mouvement par GIF issu des frames réelles. Pas de translation parasite, pas de recentrage sur les bras ou les pieds à chaque frame.
- **Méthode validée :** si une diagonale opposée est déjà correcte, reprendre ses six poses exactes en miroir horizontal, sans regénérer. SW depuis SE et NE depuis NW pour le héros vert. Si la tenue est asymétrique, vérifier les détails et obtenir validation avant miroir sur un nouveau modèle.
- Préparer la version jeu 128×160 RGBA par transformation commune et conservation des marges. Conserver le même identifiant de héros, chemins canoniques, portraits et réglages. Référence actuelle : 16 FPS, taille officielle 35 pour le vert, oscillation conseillée 1 (ne pas écraser les réglages personnalisés).
- Livrer huit ZIP distincts de six PNG numérotés, planche et GIFs. Tester réellement le déplacement dans toutes les directions avant validation utilisateur. Corriger uniquement les séquences défaillantes ; jamais regénérer les autres par défaut.

## Repos

Idle frontal de six poses disponible en référence artistique (respiration légère, pieds stables). L'éditeur directionnel actuel ne le lit pas séparément. Pas de modification éditeur ni de promesse d'idle huit directions dans ce standard. Toute future intégration fera l'objet d'un lot distinct.

**Périmètre :** fabrication artistique uniquement. Exploration reste propriétaire des assets et du moteur. Aucune duplication de bibliothèque, aucune modification Combat, PWA ou sauvegardes.
