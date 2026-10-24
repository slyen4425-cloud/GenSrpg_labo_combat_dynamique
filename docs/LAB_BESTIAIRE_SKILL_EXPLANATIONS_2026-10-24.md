# Bestiaire — fiches de compétences explicatives (24-10-2026)

## Diagnostic
- Les statistiques sont devenues des lignes visuellement tassées après la légende d'effet; rétablir de véritables cartes compactes deux colonnes, sans perdre les sous-textes.
- Le Bestiaire expose actuellement seulement `name/description/element` d'une compétence ; `draft.description` est une note auteur sommaire et parfois incorrecte.
- Le gameplay réel réside dans `draft.definition` (`effects`, `contactHold`, `activationRequirements`, `reaction`, `effect`, timings). La vue n'en possède pas la projection ; il faut **un** formateur pur, piloté par ce contrat (pas de doublon des données), extensible, testé par exemples complexes.
- Les icônes viennent uniquement de `presentation.visual.icon` et de la global-visual-library. Si non publiée, ne jamais présenter un asset imaginaire.

## Architecture
- Branchement : base gh-pages@772edcff90d8ee3c4e848309a4867aaeebc34d20, checkpoint START `checkpoint/lab-start-bestiary-skill-explain-2026-10-24`, travail `work/lab-bestiary-skill-explain-2026-10-24`.
- Unique projection descriptive `src/ui/capture-skill-explanation-v1.js` : lecture uniquement de la définition normalisée `normalizeSkillDefinition`. Export d'un modèle de phrases et sections (effets directs, effets récurrents, statuts, marqueurs, zones, déclenchements, conditions, coût, cible, distance, recharge, ultimate). Aucune prédiction des dégâts effectifs en combat.
- Les autres entrées existantes (catalogues de presets et assets) restent propriétaires ; le Bestiaire n'enregistre aucun texte dérivé.
- `src/ui/capture-bestiary-cards-v1.js` transmet le seul descriptif calculé des compétences équipées ; le texte sommaire `draft.description` n'est plus exposé/rendu.
- Présentation : case compétence cliquable avec icône réelle, nom, élément ; une seule fiche détaillée dépliée à la fois, clavier/tactile, description claire avec sections. Emplacement vide/inconnu fidèle au transfert. Carte des statistiques restaurée.
- Projet futur : le même formateur peut être importé par l'éditeur pour aider à créer/vérifier des compétences. Aucun changement de l'éditeur ou gameplay dans ce lot.
- Fichiers autorisés : module UI descriptif, projection Bestiaire, Bestiaire HTML/CSS/JS, tests unitaires et navigateur, doc et journal. Aucun changement des contrats/moteur, de main/global-assets/GenSrpG principal.

## Conditions GREEN
- Contrôle sans fausse description : `Vague incendiaire` DoT, `Sangsue` maintien corps à corps, `Sacrifice Kitsune` zones et K.O., `Nid de frelon` marqueurs/réserve, et capacités ordinaires.
- 5 emplacements restent limités au loadout ; aucun retour du catalogue historique.
- Aucune note `draft.description` dans les fiches, source autoritaire inchangée.
- UI accessible: ouvrir/fermer une seule fiche, icône et état icon absent, rendu smartphone.
- Tests node + vrai Chromium, CI 5 emplois, checkpoint GREEN après validation.
