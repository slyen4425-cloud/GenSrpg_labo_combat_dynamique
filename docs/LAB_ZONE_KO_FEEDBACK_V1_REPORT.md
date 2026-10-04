# Rapport — zone-ko-feedback-v1 — 2026-10-04

État : correction technique vérifiée. Validation smartphone utilisateur attendue.

Base : `fc5cc99cf7050f7c8013de6ce2ca1998d769b8ba`.
Branche : `work/lab-zone-ko-feedback-v1-2026-10-04`.
Départ : `checkpoint/lab-start-zone-ko-feedback-v1-2026-10-04`.
Source/test vérifiés : `ac6ca51ada7dfb2ccfaf1cdd505b779595ee125c`.
CI GitHub : run `37211319259`, **SUCCESS**, structure OK, **1017 tests / 1017 PASS / 0 FAIL**.
Checkpoint technique prévu : `checkpoint/lab-zone-ko-feedback-v1-technical-2026-10-04`.
Preview dédiée prévue : `preview/lab-zone-ko-feedback-v1-2026-10-04`.

## Changements vérifiables

| Retour | Cause / correction | Propriétaire |
| --- | --- | --- |
| Tempête de flammes manque des dégâts au contact | Le contact réel pouvait arriver avant le seuil temporel d'entrée de zone. Le contact accepté par Runtime transmet une entrée sémantique au Zone Runtime, y compris avec delta 0. Le calcul et l'application des dégâts restent natifs. | Combat Runtime + Persistent Zone Runtime |
| Dégâts joueur peu visibles | Chiffres ancrés au quart supérieur du modèle mobile, bornés dans l'arène, couche 22 au-dessus du HUD 15, opaques dès le début et maintenus jusqu'à 70 % de l'animation. L'hypothèse d'un masquage systématique par le sprite n'est pas établie. | DOM Skill FX + CSS |
| Rappel trop court | Rappel et switch canoniques à 2000 ms, énergie 0. Onglet Combat : Durée du rappel (secondes). L'option recallPreparationMs traverse BattleSetup → Exporter → CombatExport → AdapterStack → client natif → commandes existantes. L'invocation reste immédiate. | CombatCommandDefinition + chaîne export existante |
| Réserve invisible après K.O. | Une séquence hit → ko annulée pouvait continuer après remplacement du slot ; une détection K.O. dans les rendus intermédiaires pouvait aussi créer une seconde séquence. Continuation invalidée à l'annulation/remplacement/dispose ; détection K.O. dans onState du Runtime. | Resolution Presenter + client de combat |

Aucun nouveau moteur, timer, owner de HP, registre de commandes ou copie du roster. Les anciennes configurations sans recallPreparationMs conservent leur forme et utilisent les commandes canoniques. Le réglage est un paramètre de session/test et d'export combat ; il n'est pas un champ de créature ni une sauvegarde navigateur implicite.

## Tests et preuve native

- RED avant implementation : 7 échecs et 1 contrôle passant pour contact anticipé court/moyen, contact même horloge/rejet ancien skillId, absence de double entrée, hit/K.O. annulé, remplacement invalide continuation, durée par défaut et champ optionnel.
- RED supplémentaires : 4 échecs pour perte de durée personnalisée à l'export, ancre haute, sortie d'arène/maintien lisible, couche sous les commandes.
- 65 tests ciblés PASS ; 31 sentinelles zone/contact/feedback PASS.
- Le premier run complet a révélé un test canonique d'interruption resté à 1400 ms. Il attend désormais après la durée configurée de rappel ; ses 8 tests PASS.
- CI sur checkout complet : 1017 PASS. Le miroir local manque des docs et MP3 ; ses résultats de structure/audio ne sont pas des régressions du dépôt.
- Preview native source fonctionnelle `36e596fe28b94d8e0401d86c8fafaf87a1b77c25` ; commit `ac6ca51ada7dfb2ccfaf1cdd505b779595ee125c` ne change ensuite qu'un test.
- Contrôle navigateur mobile 390 px : défaut du champ = 2 ; réglage 3,5 → note réelle « Rappel en 3,5 secondes » et barre native 3,5 s ; réserve Maraileron 38/38 visible avec opacity 1 ; énergie 12/12 ; ancien Loup conserve 132/150 après avoir été ciblé pendant le rappel.
- Contrôle navigateur K.O. pendant Boule de feu en préparation : Loup QA à 8 PV, Griffe QA à préparation 0/trajet 300/max 1, réserve Maraileron. Après K.O., Maraileron **38/38**, image non cachée, opacity **1**, avant la prochaine Boule de feu adverse encore à 9,4 s. Ces réglages QA ont été faits dans la page et ne modifient aucun preset Git.
- Combat mobile natif : PV locaux 150 → 117 et adverses 150 → 135, statut appliqué. La capture montre l'arène, les modèles, les PV et l'UI ; elle ne fige pas les chiffres transitoires. Leur placement, bornage, couche et maintien sont vérifiés par tests ; validation de lisibilité Pixel encore attendue.

## Reprise / validation

Ouvrir la preview dédiée depuis l'éditeur, puis tester Tempête de flammes à ses trois niveaux avec des contacts rapides/lents et plusieurs échelles, chiffres de dégâts des deux camps, rappel 2 s puis durée personnalisée, K.O. suivi de relève.

Pas de GREEN utilisateur sans retour smartphone. Aucun merge main, aucune modification global-assets, aucune intervention sur Zombicide-40k. Rollback fonctionnel : checkpoint de départ ci-dessus.
