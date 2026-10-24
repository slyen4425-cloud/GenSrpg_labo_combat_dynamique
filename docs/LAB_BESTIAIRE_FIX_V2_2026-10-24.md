# Lot Bestiaire V2 — parcours fiches, source des compétences, nettoyage

Date : 24 octobre 2026

## Diagnostic reproductible
- Le modèle `src/ui/capture-bestiary-cards-v1.js` parcourt `draft.skillIds` (ensemble des compétences liées/apprises), pas `transfer.loadout.slots`. Exemple Dracendre : 20 IDs liés / 5 emplacements d'équipement. Il insère donc des capacités **non équipées**, quelquefois issues du catalogue historique.
- Le modèle extrait `draft.sourceStats` pour fabriquer `attributes` et l'interface affiche un second panneau Force/Agilité/etc., inutile pour les fiches.
- Cliquer sur un portrait d'icône ne fait que changer une sélection dans une page galerie/tableau ; l'auteur demande une **page de fiche dédiée**, adaptée au menu in-game futur.

## Responsabilités et périmètre
- Source de vérité équipements : `transfer.loadout.slots`, contrat existant `src/contracts/capture-active-skill-loadout-v1.js`. 4 slots standards + slot ultime, ordre du loadout ; un ID absent signifie place libre, sans attribution fictive. Une définition absente des catalogues actifs reste signalée, aucun faux nom ou effet.
- Définition des compétences : mêmes **presets Showcase configurés** et **catalogue natif** que l'éditeur. Ne pas utiliser la liste historique de compétences comme deuxième autorité de présentation.
- Source stats : `transfer.statValues.values` et `data/capture/monster-capture-stat-registry.v1.json` inchangés. `draft.sourceStats` n'est pas exploité dans le Bestiaire. Les données de jeu ne sont pas modifiées.
- Média : identique à V1, illustration FACE seulement, icône utilisée pour naviguer. Back utilisé uniquement en validation de complétude.
- Parcours : catalogue de vignettes → sélection par un **lien de fiche dans la même page** avec URL partageable `#id` → bouton Retour au Bestiaire. Un seul propriétaire de navigation. Fonctionne mobile, et aussi bouton précédent navigateur. Nul besoin de seconde page HTML copiée.
- Pas de code modifié dans le moteur, éditeur ou logique des données. Pas de cache/liste d'IDs reconstruite, aucune correction spécifique aux créatures.
- Branche `work/lab-bestiary-fix-v2-2026-10-24` sur `gh-pages@fafb6b9a39602a386998cab4138e452f3aaba9ef`. Checkpoint START : `checkpoint/lab-start-bestiary-fix-v2-2026-10-24`.
- Fichiers : modèle Bestiaire, page CSS/JS/HTML existante, tests unitaires/navigateur, journal current_work et ce doc.

## Tests de régression
1. Dracendre avec 20 `skillIds`, seuls les 5 IDs du loadout sont rendus.
2. Emplacement ultime null affiché libre, jamais remplacé par l'ancien skillId.
3. Compétence du loadout non présente dans le catalogue actif : affichage d'un état « référence non publiée », pas de slug inventé.
4. Plus aucune donnée `attributes` de `sourceStats`.
5. Clic icône → vraie fiche / retour par bouton et historique navigateur / restauration URL profonde.
6. Validation Chromium de Venombre depuis JSON réel ; aucune vue dos affichée.
7. CI complète et checkpoint GREEN uniquement après réussite.
