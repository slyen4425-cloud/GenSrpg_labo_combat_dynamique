# Human Editor — Zones : clarification et correctif des contrôles V1

Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`. Date : 2026-10-10.

## Retour utilisateur reproduit

Un créateur qui souhaite configurer `Voile brumeux` trouve séparément un effet `Buff / Debuff / Statut` et une `Zone persistante`. L'UI de zone expose également les champs de dégâts ; lorsqu'il choisit `Bonus / Malus / Statut`, ceux-ci ne se masquent pas et le menu `Actif uniquement dans la zone` paraît impossible à ouvrir.

## Cause vérifiée

`syncHumanSkillEffectRowV1` gérait déjà l'activation et la visibilité des sous-formulaires via `data-skill-zone-effect-config-kind` et `data-skill-zone-status-config-kind`. L'écouteur de l'éditeur de capacités qui appelle cette fonction ne surveillait toutefois pas `[data-skill-zone-effect-kind]`, `[data-skill-zone-status-kind]`, ni `[data-skill-zone-status-stacking]`. Les changements ne mettaient donc pas à jour le DOM ; le `select` de comportement restait `disabled` puisque la ligne avait été initialisée en zone de dégâts. Un ancien test Chromium simulait un changement de valeur et ne vérifiait que l'export JSON, pas l'état visible/activable du formulaire.

## Réparation UI ciblée

- La liste `Effet appliqué par cette zone` actualise maintenant immédiatement les sous-formulaires exclusifs dégâts/statut.
- Les sélecteurs `Quand appliquer le statut ?` (dans la zone / à l'entrée) et `Conserver la zone après rappel / changement` sont **dans la section statut seulement**. Plus de contrôle désactivé ressemblant à une option active lorsque le mode dégâts est sélectionné.
- Le type de statut n'expose que les paramètres qui lui appartiennent (stat/DoT/HoT/bouclier/reflet, et `Stacks max` seulement si stacking).
- La zone décrit directement son propre effet. Un effet `apply_status` indépendant reste disponible pour appliquer un buff hors zone, mais n'est pas requis pour une zone de soutien.
- Les champs déjà saisis ne sont pas effacés lors d'un aller-retour temporaire entre choix de sous-formulaires ; la sauvegarde/export existants continuent d'utiliser les contrats natifs.
- La phrase héritée « Toute réactivation renouvelle la durée » est conservée pour les auteurs et la sentinelle permanente.

## Validation exigée

Le test dans `tests/browser/capture-creature-library-smoke.mjs` vérifie désormais le **DOM réel du Human Editor Chromium** : passage dégâts -> statut, `hidden` mutuel, `disabled=false`, deux valeurs du menu accessibles, paramètres spécifiques au sous-type, enregistrement/export de deux zones Défense/Pois et conservation du soin existant. En parallèle : suite Node complète, navigateur bibliothèque 103 créatures, Chromium Firestorm 8/8, préservation des anciens textes d'aide.

**Jalons source** : TDD RED `ef5ec45efe48f10cc41f01bea26bf8c1e612583b`; source `436a3086801224fafb09bd5963e613a4d102c719`, puis sentinelle legacy préservée au `04f0e654a28132a70422f6bc3b2643f218004890`.

Le contrôle final de la CI sur le SHA documentaire, la création du checkpoint GREEN, la preview et la publication publique devront être relevés après exécution ; ne pas les déclarer acquis à partir de la seule écriture du document. La validation tactile sur appareil Android réel appartient encore au retour utilisateur.

## Invariants non touchés

Contrats de zone, Combat State, Status Runtime, Roster Session, attributs d'auteur, modes de ciblage, sprites et médias, export/import, `main`, `global-assets`, `Zombicide-40k` restent inchangés. Aucun nouveau système de jeu.

## Résultat de CI du correctif exact (avant archivage GREEN)

- `388f6dfdc9da9c4c69f145d48bd2e9e5e7e3cf1b`, **Laboratory CI `38023220775` SUCCESS**, jobs `foundation`, `creature-library-browser`, `firestorm-zone-growth-browser` tous SUCCESS.
- **1 372 / 1 372 tests Node**, 0 FAIL ; Chromium natif charge les 103 créatures, ouvre le panneau zone, simule le changement de type à travers le même écouteur réel, valide exclusivité `hidden`, `select.disabled=false`, 2 options et sous-champs ; sauvegarde et export du buff Défense dans la zone et du Poison à l'entrée réussis. Firestorm et contrôles auteur inchangés.
- Comparaison avec `gh-pages` de départ : 4 fichiers uniquement (1 UI, 1 sentinelle browser, 2 docs), pas de code de combat ni de presets/médias modifiés. La source finale attend une dernière CI au SHA de ce rapport ; les branches checkpoint/preview et la publication seront créées uniquement après son passage.
