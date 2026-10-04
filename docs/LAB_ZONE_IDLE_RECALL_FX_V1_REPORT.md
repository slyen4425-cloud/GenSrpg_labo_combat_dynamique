# Rapport — zone-idle-recall-fx-v1 — 2026-10-04

État : correctif technique vérifié ; validation artistique sur le smartphone de Sylvain encore ouverte. Aucun GREEN utilisateur ou merge main.

## Références de reprise

- Dépôt : slyen4425-cloud/GenSrpg_labo_combat_dynamique.
- Base exacte : db1b1867d9e1f35d39bc831722282fdc105a7e3e.
- Départ : checkpoint/lab-start-zone-idle-recall-fx-v1-2026-10-04.
- Travail : work/lab-zone-idle-recall-fx-v1-2026-10-04.
- Source, tests et architecture : 2f885c18c6b5692b92a4623c3358f65f3fbac0eb.
- Sentinelle et correction de priorité hit/rappel : 794b80d3deecac4705faf5c9d581f130074d5c0c.
- CI source : run 37214761522, job 111472911974, SUCCESS ; gardes de structure/indépendance OK ; 1029 tests, 1029 PASS, 0 FAIL.
- Checkpoint technique de clôture : checkpoint/lab-zone-idle-recall-fx-v1-technical-2026-10-04.
- Preview dédiée : preview/lab-zone-idle-recall-fx-v1-2026-10-04, éditeur natif examples/dom-demo/capture-editor-v2.html.

Le SHA de clôture documentaire est celui auquel pointent ces deux références. Il ne peut pas être écrit dans son propre contenu.

## Tempête de flammes : cause et correction

La boucle temporelle fonctionnait déjà. Le mode approach-bands-v1 considérait la cible immobile hors d'une zone courte/moyenne, alors que les dimensions et offsets du sprite pouvaient couvrir cette cible. Une attaque modifiait cette relation spatiale et donnait l'impression d'un rafraîchissement nécessaire.

Sur chaque avancée de l'horloge existante, Combat Runtime reçoit désormais un échantillon spatial facultatif validé par persistent-zone-spatial-v1. DOM Skill FX reprojette les zones natives et mesure les rectangles des zones et modèles déjà rendus ; il ne calcule ni présence ni dégâts. Persistent Zone Runtime décide l'intersection ellipse/rectangle et applique les ticks, cibles/équipes et expiration natives. Le signal correspond à la même instance, source et rayon ; sans mesure valide, le fallback headless reste inchangé. Les entrées de trajet/contact ne doublent pas une relation mesurée. Aucun timer, observer ou cache gameplay concurrent.

Les zones suivent le motion anchor de leur source. Les réglages existants du binding (rayon, taille et offsets) correspondent ainsi à l'emprise affichée. Aucun preset utilisateur n'a été modifié.

## Rappel et arrivée

CombatVisualEvent recall et enter passent par Animation Core, le preset central roster-transition-profile-v1 et les contrôleurs existants. Le rappel éclaire puis contracte la créature pendant la durée réelle de préparation, avec une opacité positive ; l'arrivée est une expansion lumineuse de 420 ms. Corps et ombre utilisent les mêmes segments. Interruption, remplacement et dispose annulent/restaurent le canal existant.

Un hit non létal ne remplace plus une animation de rappel active ; ses chiffres et flash restent indépendants. Un hit létal conserve le chemin K.O. natif. Ces animations ne retardent jamais le remplacement du roster : rappel gratuit, défaut 2 secondes éditable, ancien membre ciblable pendant le délai puis relève atomique.

## Preuves et limites

- TDD initial : 7 RED et 1 témoin avant implémentation, couvrant zones courte/moyenne au repos, cible extérieure à une zone longue, expiration, rappel/arrivée et raccord Presenter.
- RED supplémentaire hit/rappel avant sa correction ; 33 sentinelles ciblées vertes après correction. Full CI sur le checkout GitHub réel : 1029/1029.
- Reproduction native sur la base db1 : zones visuellement couvrantes et deux acteurs sans attaques de contact ; PV restés à 150 malgré la présence affichée.
- Version corrigée desktop : avec seuls les sorts de zone et aucune attaque de contact, PV 150 puis 101.52/71.22 puis 53.04/16.68 au fil des ticks.
- Version corrigée mobile 390 px : joueur immobile sans aucune attaque ni activation locale, zone ennemie seule ; PV 5000 puis 4996.97 puis 4851.53. Réserves et rappel configuré à 3.5 secondes vérifiés ; ancien membre encore touchable, entrant visible immédiatement sans nouveau dégât requis.
- La vérification native confirme le parcours commande/relève et la visibilité de l'entrant. Les captures ne certifient pas tous les états transitoires lumineux/contraction ; le rendu artistique sur smartphone physique reste à valider.
- Présence = ellipse du sprite contre rectangle transformé du modèle, pas alpha-test pixel par pixel. Un échantillon courant ne reconstruit pas la trajectoire historique pendant une longue suspension de l'onglet.

Les changements de PV/durée/loadout effectués dans la page pendant la QA sont des données temporaires de test ; ils ne font pas partie des commits. Aucun média ajouté, aucune modification de main/global-assets ou du dépôt principal.
