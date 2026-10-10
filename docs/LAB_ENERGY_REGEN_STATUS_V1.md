# GenSrpG Labo Combat — Buff et debuff de régénération d’énergie V1

Date : 10 octobre 2026

## Mission
Ajouter à l'unique éditeur tactique un **statut temporaire** `energy_regen_modifier` utilisable par les compétences, sans altérer la configuration permanente pré-combat de la créature.

### Contrat et comportement
- Contrat unique : `StatusEffectV1` ajoute le kind `energy_regen_modifier`, portant le champ numérique fini et signé `modifierPct`.
- **+100 %** : chaque tick natif de régénération donne deux fois la quantité normale. **−50 %** : la moitié. **−100 %** ou en-dessous : 0, sans perte d'énergie. **0 %** : inchangé.
- Intervalle de récupération, progression du prochain tick, énergie maximale et réglage permanent du combattant restent identiques. Énergie calculée au timestamp absolu de chaque tick ; buff expiré avant ce tick n'applique rien.
- Stacking `replace`, `refresh`, `stack` et bornes existantes ; la dissipation et le nettoyage utilisent le moteur de statuts autoritaire. Effets applicables sur soi, alliés et zones persistantes utilisant le statut. Le `SkillDefinition` ne change pas.
- Compétences auteur existantes non modifiées : il s'agit d'un **nouvel effet sélectionnable**, pas d'un remplacement forcé ni d'une compétence prééquipée.

### Architecture / propriétaire
- `src/contracts/status-effect-v1.js` : validation et sérialisation.
- `src/core/combat/combat-timing.js` : quantité à l'instant du tick dans `advanceEnergyTicks`, appelée par l'unique horloge d'énergie.
- `src/core/combat/combat-state.js` et `combat-session.js` : transport non permanent de la durée initiale lorsque le statut expire à l'intérieur d'un grand pas de temps ; pas de second timer.
- `src/ui/capture-editor-human-v2.js` : entrée utilisateur `Buff / Debuff / Statut → Régénération d'énergie (%)`, nombre signé, durée et stacking existants ; aussi disponible dans la configuration `Zone persistante → Statut` ; export/import par le contract existant.
- `tests/unit/energy-regeneration-status-v1.test.mjs` : validation, modèle de ticks, découpe par expiration, buff/debuff/stack/cleanse, création réelle d'une compétence, aller-retour UI.

### Gouvernance
- Base `gh-pages` : `dbdb5fd08b03c9e89df777582bf6d1c2176bb974`.
- Checkpoint de départ : `checkpoint/lab-start-energy-regen-status-v1-2026-10-10`.
- Work : `work/lab-energy-regen-status-v1-2026-10-10`.
- Aucun changement de `main`, `global-assets`, Zombicide-40k, Exploration, médias, créatures, presets ou calcul des dégâts.
- Contrôle : CI foundation, vrai Chrome Firestorm et vraie bibliothèque Capture, puis checkpoint GREEN sur SHA exact, fast-forward sous lease, CI et Pages publics. Vérification tactile Android distincte de la CI.

### Exemple d'utilisation auteur
1. Capacités → Effets tactiques → Ajouter un effet `Buff / Debuff / Statut`.
2. Choisir sa portée `Soi-même` ou `Tous les alliés`.
3. Type de statut : `Régénération d'énergie (%)`.
4. Polarité `Bénéfique`, variation `+100`, durée `6 secondes`, stacking `Rafraîchir la durée`.
5. Enregistrer la compétence et l'essayer dans le combat. Une créature régénérant normalement 2 points toutes les 2 s régénère temporairement 4 points par tick tant que le statut est actif, puis retrouve son rythme initial.

## CI et livraison
- Phase RED : erreurs sur les nouveaux contracts et contrôles avant implémentation attendues et confirmées.
- Phase initiale GREEN : run `38086986049` SUCCESS (avant extension des sentinelles d'intégration).
- Contrôle end-to-end : run de l'état final à reporter après vérification.
