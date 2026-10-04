# Laboratoire Combat Dynamique — Roadmap

Cette roadmap décrit l'ordre de construction du laboratoire. Elle ne vaut pas autorisation d'intégrer le résultat à GenSrpG.

## Phase 0 — Fondation et gouvernance

Objectif : disposer d'un dépôt propre, reprenable et testable avant le premier moteur.

Livrables :

- charte permanente ;
- architecture cible ;
- politique de checkpoints ;
- point de reprise courant ;
- structure physique du dépôt ;
- première CI minimale.

Critère GREEN : le dépôt peut être repris depuis GitHub sans dépendre d'une conversation.

## Phase 1 — Core animation mono-image

Objectif : animer une créature à partir d'une seule image.

Sous-lots :

1. modèle d'acteur visuel ;
2. profils de transformation ;
3. plan d'animation indépendant du renderer ;
4. exécution et annulation propre ;
5. retour garanti à l'état stable.

Premiers événements :

- idle ;
- enter ;
- hit ;
- ko ;
- recover.

Critère GREEN : une image unique peut être chargée et ces événements peuvent être exécutés sans logique de combat GenSrpG.

## Phase 2 — Attaque et esquive

Objectif : produire des mouvements lisibles entre deux acteurs.

Événements :

- attack ;
- dodge ;
- recoil ;
- lunge ;
- retreat.

Contraintes :

- orientation gauche/droite ;
- distance paramétrable ;
- aucune téléportation résiduelle ;
- état final déterministe.

## Phase 2B — Prototype règles de combat distance/énergie

Objectif : tester l'expérience cible sans intégrer GenSrpG et sans contaminer le moteur visuel.

Socle :

- trois bandes de distance : courte / moyenne / longue ;
- énergie commune aux compétences et au déplacement ;
- coût de déplacement configurable par créature et par palier ;
- compétences séparant catégorie, forme et élément ;
- préparation, trajet et récupération configurables ;
- blocage, renvoi, immunité et contre ;
- réactions soumises à leur propre temps de préparation ;
- résolution sémantique avant toute animation.

Interface test :

- jauges d'énergie ;
- déplacement tactile entre les trois bandes ;
- coûts visibles ;
- capacités data-driven ;
- réaction adverse sélectionnable ;
- journal de résolution ;
- projectile générique minimal ;
- outils d'animation bruts relégués en panneau laboratoire.

Critère GREEN final : CI verte + vrai chemin données -> Combat Rules -> Presenter -> Animation/FX + validation smartphone de la lisibilité et de l'intuitivité.

### Extension V2 timing / UI persistante

- idle permanent hors actions transitoires ;
- énergie initiale configurable, zéro par défaut du test ;
- recharge discrète configurable en quantité / intervalle ;
- temps de charge effectif modifié par la créature en pourcentage ;
- modificateurs temporaires de charge avec expiration ;
- Combat Runtime propriétaire de l'horloge ;
- barre de charge visible pour chaque capacité ;
- réactions déclenchables pendant une action en cours ;
- seul le combattant qui change la distance bouge visuellement ;
- arène et capacités visibles simultanément sur smartphone ;
- HUD distance superposé supprimé.



### Extension V3 — impact, esquive et commandes tactiques

- dégâts appliqués uniquement à l'impact réel ;
- séparation `form` / `approachMode` ;
- approches `ground / aerial / teleport` ;
- esquives ciblant forme et/ou approche ;
- commandes séparées des compétences : Objet / Rappel / Invocation ;
- coût énergie et temps de préparation configurables pour chaque commande ;
- commandes interruptibles pendant leur préparation ;
- effet Stun produisant une interruption uniquement à son impact ;
- refus d'interruption après release ;
- test laboratoire du Stun hors de l'interface joueur principale.

Le changement réel de créature lors d'un Rappel/Invocation reste un raccord de roster séparé : ce lot valide le contrat, le coût, le timing, la completion et l'interruption.

### Extension V4 — vue joueur et roster 2v2

- démo nettoyée pour ressembler à une vraie partie ;
- uniquement contrôles du joueur ;
- Capacités / Objets / Équipe en menus déroulants ;
- suppression des outils laboratoire du rendu utilisateur ;
- équipe joueur : Marai + Drakon ;
- équipe adverse : Drakon + Marai ;
- réserve visible pour les deux camps ;
- Rappel réellement retire le monstre actif de la scène ;
- Invocation réellement remplace le slot joueur par le membre sélectionné ;
- PV/énergie persistants par membre entre les changements ;
- changement réel d'asset et de profil visuel lors d'une invocation ;
- aucun contrôle direct de l'adversaire.

### Extension V5 — réflexes, KO et mouvements spéciaux

- capacités offensives visibles directement, sans menu déroulant ;
- Objets et Équipe restent en menus secondaires compacts ;
- arène légèrement plus haute pour améliorer la lisibilité ;
- KO adverse suivi d'un remplacement réel depuis la réserve ;
- snapshot du membre KO conservé ;
- aucun contrôle direct joueur sur le remplacement adverse ;
- événement visuel `teleport-attack` ;
- événement visuel `aerial-attack` ;
- ciblage visuel calculé depuis la géométrie réelle des deux acteurs ;
- point d'impact visuel aligné sur `travelMs` ;
- retour visuel après impact sans retarder les dégâts.

### Extension V6 — mobilité d'impact et charge lisible

- corps à corps au sol piloté par `travelMs` configurable ;
- Griffe de test : 1,5 s pour atteindre la cible ;
- support de capacités plus rapides sans changer le moteur (0,9 s / 0,5 s) ;
- mouvement au sol jusqu'à la géométrie réelle de la cible ;
- aérien pouvant sortir complètement du haut de l'arène avant piqué ;
- KO sans retour à idle du combattant vaincu ;
- KO détecté depuis l'événement hit et remplacé par le Roster Session ;
- arène encore agrandie ;
- barre de charge principale plus grande ;
- nom de l'action et temps restant issus du Combat Runtime.


### Extension V7 — feedback visuel d'impact

- le recul `hit` reste l'animation de réaction principale ;
- un flash/coloration bref rend l'impact immédiatement lisible ;
- le feedback est piloté par le profil de créature ;
- le canal visuel reste indépendant des règles de dégâts ;
- le renderer restaure l'apparence normale après le Hit ;
- le KO terminal reste prioritaire et protégé.

### Extension V8 — interface joueur plein écran inspirée d'un jeu de capture

Objectif : transformer la démo technique en interface de combat tactile lisible sans déplacer aucune autorité gameplay dans l'UI.

- arène occupant pratiquement tout le viewport ;
- HUD joueur et adversaire intégrés aux bords de l'arène ;
- capacités principales visibles en permanence comme de vraies touches de jeu ;
- nom de capacité conservé aujourd'hui, structure compatible avec future icône ou icône + nom ;
- énergie, charge et disponibilité projetées depuis le Runtime existant ;
- Objets / Équipe / déplacement intégrés dans le HUD de combat ;
- réserve visible mais compacte ;
- aucun calcul de portée, coût, dégâts, KO ou roster dans la couche de présentation ;
- smartphone prioritaire, paysage et portrait supportés.

Critère GREEN V8 : CI verte + contrôles tactiles présents dans l'arène + aucun panneau de démo technique séparé + validation smartphone de la lisibilité et de l'accès aux actions.


### Extension V9 — contrôleur de décision adverse

Objectif : donner à l'adversaire un comportement autonome observable sans créer un second moteur de combat.

Architecture cible :

`Combat State / Roster snapshot -> Opponent Decision Controller -> preview des actions existantes -> Combat Runtime / Combat Session -> Presenter`

Principes :

- aucune seconde horloge gameplay ;
- aucune simulation de clics UI ;
- aucune duplication des calculs de portée, énergie, dégâts ou réactions ;
- décisions déterministes et testables avant ajout éventuel d'aléatoire ;
- l'IA choisit uniquement parmi des actions déjà déclarées légales par les propriétaires existants.

Premier périmètre retenu :

1. comportement offensif normal sans réaction automatique permanente ;
2. moteur de réactions générique conservé pour de futurs profils spécialisés ;
3. stratégie énergie configurable :
   - mode rapide ;
   - mode fort ;
   - économie d'énergie si la compétence forte n'est pas encore finançable ;
4. choix d'une compétence uniquement parmi les skills autorisés par la policy et validés par Combat Session ;
5. déplacement vers une distance utile uniquement si le budget réel couvre mouvement + compétence ciblée ;
6. réévaluation d'une IA en attente uniquement depuis les mises à jour du Combat Runtime ;
7. politique configurable afin de pouvoir tester plusieurs comportements ;
8. initiative adverse autonome déclenchée depuis les mises à jour d'état du Combat Runtime, sans attendre une action joueur ;
9. mobilité évasive data-driven :
   - une compétence peut déclarer une fenêtre d'esquive pendant son trajet ;
   - les formes d'attaques entrantes évitées sont configurées dans la compétence ;
   - Combat Rules décide `evaded` à l'impact réel.

Pré-requis de raccord identifiés :

- rendre le HUD de charge actor-aware ;
- router Presenter/FX selon l'actorId réel au lieu d'assumer `player -> opponent` ;
- définir le comportement de KO du joueur lorsque l'adversaire peut infliger les derniers dégâts.

Concurrence V9 :

- `Combat Runtime` reste l'unique horloge gameplay ;
- il autorise au maximum une action active par combattant ;
- joueur et adversaire peuvent donc charger / voyager / impacter en parallèle ;
- les releases et impacts dus dans un même tick sont triés par timestamp absolu ;
- le premier impact réel est résolu en premier sur l'état courant ;
- un simple Hit n'annule pas automatiquement l'autre action ;
- une interruption explicite ou un KO peut annuler l'action concernée ;
- au premier jalon, seules les compétences sont concurrentes dans l'UI ;
- déplacement, Objet, Rappel et Invocation restent globalement verrouillés pendant une action afin de ne pas changer silencieusement cible/distance en vol ;
- le moteur de réactions reste disponible via `runtime.react()`, mais il est désactivé dans la policy de combat normal V9 ;
- les projectiles concurrents peuvent utiliser une règle de clash data-driven déclarée dans `SkillDefinition`, sans détection de collision gameplay dans le renderer.

### Disponibilité future des compétences

À traiter dans un chantier gameplay séparé après stabilisation de V9 :

- système de disponibilité 100 % data-driven au niveau `SkillDefinition` ;
- possibilité d'ajouter un `cooldownMs` configurable par compétence ;
- possibilité future de charges, nombre d'utilisations ou autres contraintes ;
- aucun cooldown codé en dur dans l'IA ou l'UI ;
- Combat Runtime / Combat State resteront propriétaires du temps et de la disponibilité réelle ;
- l'IA ne fera que consulter cette disponibilité pour décider.

## Phase 3 — FX génériques

Objectif : ajouter une couche d'effets indépendante.

Sous-systèmes :

- flash ;
- impact ;
- particules simples ;
- projectile générique ;
- ombre dynamique ;
- shake léger ;
- zoom/pan caméra contrôlé.

Le moteur d'animation doit rester utilisable avec les FX désactivés.

## Phase 4 — Profils de créatures

Objectif : obtenir un comportement crédible sans demander au joueur de régler chaque paramètre.

Profils initiaux envisagés :

- humanoïde ;
- quadrupède ;
- volant ;
- flottant ;
- massif ;
- serpentin.

Chaque profil est une configuration, pas un moteur séparé.

## Phase 5 — Laboratoire utilisateur

Objectif : permettre de tester facilement une image personnelle.

Fonctions :

- import PNG/WebP ;
- choix du profil ;
- choix d'une animation ;
- réglage vitesse/amplitude/intensité ;
- mode effets réduits ;
- prévisualisation mobile ;
- export/import d'un preset de profil.

La Demo UI reste un client du Core.

## Phase 5B — Bibliothèque d'assets créateurs

Objectif : préparer une bibliothèque commune d'icônes, sprites / FX et sons utilisable par les créateurs, sans rendre le gameplay dépendant des médias.

Ordre obligatoire :

1. architecture et classification ;
2. contrats `AssetDefinition / AssetPack / AssetBinding` ;
3. Asset Catalog pur ;
4. Audio Asset Input ;
5. bindings de présentation de quelques compétences de test ;
6. petit pack d'assets autorisés ;
7. import créateur dans le laboratoire ;
8. stockage persistant GenSrpG seulement lors d'un futur chantier d'intégration explicite.

Invariants :

- références par `assetId`, jamais par chemin physique dans le gameplay ;
- séparation `core / pack / project / user` ;
- Asset Input reste propriétaire de la validation des fichiers ;
- SkillDefinition reste propriétaire du gameplay ;
- les bindings de présentation restent séparés ;
- un asset optionnel absent déclenche un fallback et ne casse pas le combat ;
- provenance / auteur / licence doivent être traçables ;
- une image unique reste un fallback valide pour une créature.

Document de référence :

`docs/LAB_ASSET_LIBRARY.md`

Le futur éditeur de compétences devra respecter en particulier la section
« Réglages visuels du futur éditeur de compétences » :

- sélection des assets par IDs stables ;
- scale indépendant par slot visuel ;
- modes d'attache lanceur / cible / position fixe / trajet ;
- anchors et offsets éditables ;
- layer devant / derrière ;
- déclencheurs utilisateur traduits vers les phases techniques ;
- presets simples avant réglages avancés.

Critère GREEN de la phase complète :

- contrats et catalogue testés ;
- au moins un vrai chemin icon / FX / audio via assetId ;
- import personnel de laboratoire testable ;
- aucun lien à `Zombicide-40k` ;
- CI verte ;
- validation utilisateur.


### Retours de production ouverts — 2026-10-03

Deux besoins de polish doivent être traités après pré-audit, sans créer d'autorité concurrente :

- **présentation des créatures par camp/vue** : permettre des réglages indépendants joueur/adversaire pour scale et offsets X/Y, afin de compenser les différences de cadrage et de perspective entre les assets ; ces réglages restent purement visuels ;
- **lisibilité des impacts** : les impacts réels doivent être suffisamment visibles en combat. Vérifier d'abord layer, durée/vitesse, scale, anchor/offset et profondeur, puis corriger via les paramètres de présentation/FX existants plutôt que par une règle gameplay ou un second moteur.

Critère de validation : preview réelle sur smartphone et validation utilisateur ; la CI seule ne suffit pas pour déclarer le rendu artistique GREEN.

## Phase 6 — Performance et robustesse mobile

Objectif : garantir une animation fluide et propre sur smartphone.

Travaux :

- profiling réel ;
- réduction reflow/repaint ;
- nettoyage timers/listeners ;
- interruption d'animation ;
- tests tactiles ;
- tests de sessions longues ;
- mode low-FX.

## Phase 7 — Support visuel avancé optionnel

Objectif : enrichir sans casser le contrat mono-image.

Extensions possibles :

- image idle alternative ;
- pose d'attaque ;
- pose hit ;
- sprite sheet ;
- calques séparés ;
- points d'ancrage ;
- animation par segments.

La créature mono-image reste toujours supportée.

## Phase 8 — Préparation d'intégration

Objectif : documenter un raccord potentiel avec GenSrpG sans le réaliser.

Livrables :

- API publique figée ;
- schéma d'événements ;
- paquet/module exportable ;
- contrat d'adaptateur ;
- matrice dépendances ;
- tests d'indépendance ;
- procédure de rollback.

## Phase 9 — Intégration éventuelle à GenSrpG

Cette phase n'existe opérationnellement qu'après validation explicite de Sylvain.

Aucune modification de `Zombicide-40k` n'est autorisée par la présente roadmap.

## Ordre permanent

Pour chaque phase :

pré-audit -> checkpoint départ -> branche de travail -> micro-lot -> tests -> checkpoint GREEN -> documentation -> phase suivante.

Pas de saut de phase structurelle pour gagner du temps.


### Avancement des retours de production — Presentation Feedback V1 — 2026-10-03

Les réglages par vue (taille et X/Y), la gestion once/loop/stretch des projectiles et la durée/scale/offset des impacts sont maintenant implémentés dans les contrats et consommateurs existants. CI technique 923/923 au commit 82c8dac19656e18e8a85c7412e1b5ebd5b38a4b0. Les notes ouvertes précédentes restent la source historique ; l’implémentation et ses preuves sont décrites dans docs/LAB_PRESENTATION_FEEDBACK_V1.md.

État : prêt pour test utilisateur dans la preview publiée. Validation artistique réelle sur smartphone encore ouverte ; aucun GREEN final, aucun merge main. Les presets et les médias globaux restent inchangés.


### Dernières planches et ombre — 2026-10-04
Implémentation technique terminée : 12 animations CAST/STATUS source-alpha (96 phases, 112 fichiers image réels), IDs/catalogue/runtime raccordés, ombre au sol issue du plan canonique et lifecycle WAAPI partagé. Full CI source 948/948 et assets 202/202 ; décodage des 108 fichiers de lecture et preview réelle clair/sombre vérifiés. Main protégé ; validation artistique/tactile finale de Sylvain ouverte. Référence : docs/LAB_CAST_STATUS_SOURCE_ALPHA_V1.md.


## Suivi 2026-10-04 — Phase 5B, réglages des sprites dans l’éditeur

Choix ouverts pour cast/impact/aura-zone/statut, filtre projectile conservé, réglages de lecture/placement exposés via les contrats existants. CI 966/966 et parcours natif desktop vérifiés sur `d8a1105604e00032573c9ace63f0f4c8cfb5368c`. Validation smartphone utilisateur à faire avant GREEN utilisateur. Détails : `docs/LAB_UNIFIED_SPRITE_CONTROLS_V1.md`.

## Suivi 2026-10-04 — Combat de test conservé dans l’éditeur final

Le test combat reste une fonction durable de l’éditeur. Toute la bibliothèque active est sélectionnable ; les miroirs et répétitions ont des états indépendants. Chaque camp possède 1–6 membres, avec 1 ou 2 actifs et les autres en réserve native. Le menu Équipe, Rappel/Invocation et le remplacement KO restent clients des owners existants. Les modifications valides sont enregistrées au lancement, sans retour aux boutons Save, et un refus permet de corriger puis réessayer. La barre Vérifier/Tester reste fixe sur téléphone.

Code `0ec42fd2d2b006c939c29a8bdb61e11a26ec97d7`, CI **989/989**, parcours natifs miroir/équipes/réserves/KO/pending edits et revue responsive vérifiés. Les fiches sans illustration utilisent un placeholder explicite et n’acquièrent aucun nouveau média. Validation sur smartphone physique de Sylvain encore ouverte avant GREEN utilisateur ; main/global-assets/Zombicide-40k inchangés. Détails : `docs/LAB_EDITOR_COMBAT_TEST_V1.md`.


## 2026-10-04 — IA de zone et relève Capture v1 : vérification technique réussie

Trois besoins utilisateur implémentés par les propriétaires existants : renforcement des zones par IA avec économie d’énergie ; remplacement gratuit en 1 s puis arrivée instantanée ; statuts influençant le temps d’approche de la créature.

Cette demande remplace pour switch seulement le verrou global de commandes de la première V9. Les autres acteurs continuent pendant le rappel ; slot toujours ciblable et relève atomique Roster Session. Le bouton unique du test Capture évite la succession de deux commandes laissant un terrain vide. Les anciennes commandes restent compatibles et gratuites.

Source `0e151d26fde11af17525f442f648b2334f07e107`, CI 1006/1006. Vérification vraie chaîne 1v1/2v2, zone adverse au rayon long, rechargement du statut +50 % dans l’éditeur et affichage en combat, panneau mobile 360/390/430/paysage. Branche `work/lab-combat-tactics-switch-travel-v1-2026-10-04`. Rapport : docs/LAB_COMBAT_TACTICS_SWITCH_TRAVEL_V1.md. Validation technique acquise ; retour utilisateur encore nécessaire pour GREEN utilisateur.
