# Correction : identifiants de statuts partagés entre compétences Capture

**14 octobre 2026 — Régression vérifiée après création de Surcharge et Esquive foudroyante.**

## Cause racine

Les auteurs de compétences ont chacun le droit de générer des identifiants locaux simples `status-1`, `status-2`, etc. Dans la version précédente, la liste des statuts d'un combattant utilisait **uniquement** `definition.id` comme clé de rafraîchissement, remplacement, cumul, échéances et HUD.

Sur les exports auteurs actuels :
- `cap_electric_special_2` (Surcharge) contient 5 statuts, dont `status-1 = approach_time_modifier -50 %` et `status-2 = energy_regen_modifier +50 %` ;
- `dodge` (Esquive foudroyante) contient `status-1 = auto_dodge` ;
- `lib_chain_lightning` (Arc électrique) contient `status-2 = stun` de 3 secondes.

Comme la politique de chaque statut est `refresh`, appliquer Esquive après Surcharge ne créait pas `auto_dodge` : le moteur rafraîchissait le modifier de trajet précédent. De même, Arc pouvait rafraîchir la régénération d'énergie au lieu de poser `stun` : il ne pouvait donc plus interrompre la course de la cible. Cela **ressemblait** à un plafond de quatre buffs, mais aucun plafond numérique n'existe.

## Correction du propriétaire runtime et visuel

- `status-effect-runtime-v1.js` : l'identité d'un statut distingue désormais **ID local et provenance**. Une définition différente venue d'une autre compétence ne remplace pas celle en place sous le même ID, y compris dans les actions finies et les ticks temporisés. Une réapplication de la même compétence conserve sa logique de `refresh`, `replace` ou `stack`.
- **Compatibilité des cumuls historiques** : deux compétences appliquant la **même définition complète de statut** avec le même ID continuent à fusionner en un seul statut (sourceSkillId du dernier auteur conservé). Cette règle est exigée par les anciennes sentinelles `status-source-skill-icon-v1` et `status-effect-runtime-v1`. Les définitions différentes sont isolées ; on ne change pas globalement la façon dont une brûlure partagée peut accumuler ses charges.
- `combat-state.js` : la contrainte d'unicité porte sur le couple `(sourceSkillId, definition.id)` et accepte les ID courts identiques quand la provenance est différente. Un double statut avec exactement la même clé reste invalide.
- `dom-status-fx.js` : les entrées de HUD, coloration et sprite sont séparées par combattant, compétence source, ID local et type de présentation. Le moteur d'affichage continue de rechercher les vrais visuels auteurs par `statusId` **inchangé** et `sourceSkillId`. La chronologie des stacks suit le statut correspondant ; aucun second timer.

## Vraies validations

Sentinelle `tests/unit/capture-cross-skill-status-identity-v1.test.mjs` :
- import des trois fichiers auteurs LIVE non modifiés ;
- vrai `CombatSession` : cinq statuts Surcharge + auto_dodge = **six**, deux `status-1` de nature distincte, attaque entrante auto-esquivée ;
- vrai `CombatRuntime` : Surcharge `status-2` régénération + Arc `status-2` stun coexistent, Arc termine immédiatement l'action mobile en cours, sans coup tardif ;
- réapplication d'Esquive de la même compétence = rafraîchissement et non doublon ;
- expiration séparée de l'Esquive à 10 s et du bonus de trajet à 60 s ;
- icônes de HUD indépendantes (pas d'effacement arbitraire à 4).
- anciens tests de source du HUD, stacking inter-compétences, énergies et résolutions réexécutés par Foundation.

Aucun export auteur, asset, capacité, stat, effet visuel de compétence, règle d'esquive, stun ou moteur d'impact modifié : seuls les propriétaires de l'identité de statuts et une sentinelle.

## Gouvernance

Départ `gh-pages@7fc9f8327258eef821abc8d7689574d15b4f81ae`, checkpoint `checkpoint/lab-start-cross-skill-status-identity-v1-2026-10-14`, branche `work/lab-cross-skill-status-identity-v1-2026-10-14`. RED `ac31dad0d9afbb654145150a5b0b7d089f6ea922` ; correction dans `status-effect-runtime-v1.js`, `combat-state.js` et `dom-status-fx.js`, puis adaptation de compatibilité testée via CI. Checkpoints GREEN exact SHA et CI + Pages de production requis ; validation Android réelle par l'auteur (pas encore certifiée).
