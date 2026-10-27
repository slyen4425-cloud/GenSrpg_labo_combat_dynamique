# Capture — IA de combat tactique V1 (laboratoire)

Date : 14 octobre 2026.

## Objectif et autorisation
L'auteur continue à importer/éditer des créatures et des capacités ; ce lot travaille uniquement le contrôleur IA du combat de test, sans modifier aucune donnée auteur. Il améliore le choix offensif et branche l'Esquive IA sur les règles rechargeables déjà utilisées par le joueur. Les modèles de combat, dégâts, cooldown, charges, zones, clash des projectiles/rayons et FX restent propriétaires.

## Propriétaires et chemin réel
- `src/core/combat/battle-actor-ai-controller.js` expose un profil `CAPTURE_AI_TACTICS_V1_DEFAULT` opt-in (`enabled=true`, `seed=17`, `dodgeChancePct=45`, `repeatPenalty=5`) **paramétrable dans le contrôleur** et non lié en dur aux JSON créatures. Les anciens appels sans `tactics` gardent la sélection round-robin pour préserver les tests et consommateurs historiques.
- Pour chaque compétence, le contrôleur considère ses relations de cible existantes (soi/alliés/ennemis), la disponibilité de `CombatSession.previewSkill`, les PV manquants et dégâts/soins déclarés, la présence d'un effet de statut ou de zone, le coût énergie, l'usage récent, un facteur varié mais **reproductible** par seed/ordre de décision. Les mécanismes particuliers de renforcement des zones restent prioritaires. Il exécute via `CombatRuntime.startSkill` uniquement ; aucune application de dégâts par l'IA.
- Le raccord dans `src/ui/combat-2v2-test-ui.js` fournit les alliés du vrai `BattleFormat`, active le profil par défaut pour les IA de la preview Capture 1v1/2v2 et laisse le mode solo-dual intact.
- La détection de menace se fait uniquement sur l'événement visible `CombatRuntime.onRelease` : pas d'espionnage des intentions à la préparation. `onClock` natif fournit `CombatState.elapsedMs`, et l'IA n'arme son Esquive qu'à l'approche de l'impact nominal. Elle vérifie les **vraies** charges, la fenêtre déjà active et `previewRechargeableReaction` avant `activateRechargeableReaction`. L'effet visuel `dodge` suit seulement l'activation réussie. L'issue `evaded` reste décidée au véritable impact par le Runtime et la Session.
- Fenêtre active et cadence de recharge viennent des `GameOptions` existantes ; si Esquive désactivée, l'IA ne la reçoit pas. Aucun second timer, intervalle ou calcul de résultat dans l'UI. L'IA n'Esquive **pas chaque attaque** ; son taux de tentative cible est configurable (45% sur le profil de démonstration). Les compétences et statuts non esquivables demeurent refusés par la preview native, sans dépenser de charge.

## Contrôles reproduits
- TDD RED `tests/unit/capture-ai-tactics-v1.test.mjs` au SHA `58fe507886cb605857278ed3d5284f8e8af0e4b7`.
- Logique IA `b4b0558eb0a9c43310163433db202ce6c8732809`; raccord UI `775f9fddf23f5df694d66c0d1b52a6294497c9da` ; vrai test complet `ccf89bfbb2bb5e114e1e2b5c6055240390c666e0`.
- Contrôles : une créature en faible PV privilégie un soin autorisé sur elle-même ; plusieurs skills viables ne suivent pas la simple rotation 1-2-3 ; pas d'Esquive avant release, ni loin de l'impact, ni sans charge, ni quand désactivée ; vrai `CombatSession + CombatRuntime` à horloge simulée via leurs API publiques : lancement projectile visible, fenêtre défensive activée, charge consommée, impact final `evaded`, PV inchangés ; aucune interception de collision/génération de dégâts par l'IA.
- CI sur code SHA `ccf89bfbb2bb5e114e1e2b5c6055240390c666e0`, run `38516911395` : **1716 tests PASS, 0 FAIL ; Foundation, Firestorm Chromium, bibliothèque créatures Chromium SUCCESS**. Refaire ces trois gates sur le SHA documentaire final puis checkpoint GREEN et publication fast-forward protégée. Vérifier CI/Pages après publication.

## Limites annoncées
- Profil de démonstration non encore réglable depuis l'éditeur ; les constantes ci-dessus sont remplaçables via l'argument `tactics`, mais leur UI/serialization est un autre lot à décider.
- Choix tactique heuristique V1, **pas une IA complète** : résistances détaillées, placement spatial, diagnostic de combo, taille des zones, IA multiacteur coordonnée et escalade de difficulté restent futurs.
- La V1 suit une seule menace visible en attente par IA (pour le moment la dernière libération pertinente). Les impacts géométriques précoces, attaques AOE indirectes et simultanéité de plusieurs adversaires seront des extensions dédiées ; aucune Esquive n'est garantie et le résultat réel dépend toujours du moteur.
- Sur smartphone Android paysage : vérifier que l'adversaire peut Esquiver visiblement, que les PV sont préservés uniquement si le Runtime conclut `evaded`, et que les capacités changent selon santé/énergie et contexte.
- Aucune modification à `Zombicide-40k`, exploration, `main`, `global-assets`, fichiers auteur et assets.
