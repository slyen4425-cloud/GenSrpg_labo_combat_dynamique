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
