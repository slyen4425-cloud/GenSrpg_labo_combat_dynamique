# Soin lumineux (Lumilo) — purification de tous les effets négatifs

## Décision d'auteur / diagnostic (24 octobre 2026)
Retour explicite : le soin de Lumilo doit supprimer **tous les effets négatifs**, dont les marqueurs négatifs, sans effacer les bonus. La phrase de Bestiaire doit décrire cet effet précisément.

- Base : `gh-pages@d18c1d3134d087a83124817f2d25f262ec6eb183`
- START : `checkpoint/lab-start-lumilo-cleanse-2026-10-24`
- Branche : `work/lab-lumilo-cleanse-2026-10-24`
- Compétence : `cap_light_special_1`, nom `Soin lumineux`, équipe `crea_lumilo` slot 3.
- Ancien comportement (export 18 octobre conservé) : soigner 35 PV ; `consume_marker(markerId="*",count="all", minimum=1)` sur **tous** les marqueurs, quelle que soit leur polarité ; à consommation effective, inflige 10 dégâts via effet enfant. Contraire à l'intention auteur.
- Capacité native existante : `cleanse` avec `statusTags:[]` appelle `removeStatusEffectsV1` avec `polarity:"detrimental"`, en supprimant tous les états négatifs, y compris les marqueurs détériorants (convertis en statut `stack_counter`). Aucun nouveau type ou moteur.
- Changement autorisé par le retour auteur : conserver le soin 35, remplacer seulement `consume_marker` et son effet dommage par `cleanse` sans filtre, appliqué à la même cible. Tous les paramètres, présentation, identité, niveau, coût, temps, ciblage restent inchangés. Exports historiques non écrasés ; nouveau snapshot d'auteur daté pour traçabilité. Pas de nouvelle autorité.
- Formulation publique depuis `src/ui/capture-skill-explanation-v1.js` : « Rend 35 PV à la cible. Supprime tous les effets et marqueurs négatifs de la cible. » Le texte doit être généré du contrat `cleanse`, pas spécifiquement de Lumilo. Pour `cleanse` avec tags, éviter d'affirmer « tous ».

## Périmètre et tests
- Fichiers : seul preset `data/capture/showcase/cap_light_special_1.capture-skill-transfer-v1.json`, nouveau snapshot source-export révisé, module UI d'explications, sentinelles de `Soin lumineux`, tests intégration sur vrai `CombatSession`, `docs/LAB_CURRENT_WORK.md` et ce diagnostic.
- Moteur/contrats/éditeur, autres presets et stats, icônes et présentations, dossier GenSrpG central strictement protégés.
- RED: test valeur export et mise à jour de comportement, combat avec statut négatif + marqueur négatif + bonus et marqueur positif/neutre, doit purifier uniquement le négatif; ne pas blesser la cible; réussir sans aucun marqueur.
- GREEN: test vrai chemin, autres tests unitaires, CI 5 jobs dont navigateur; checkpoint sur SHA exact avant PR/merge. Validation visuelle smartphone auteur après publication.
