# DOM Demo — Combat Dynamique V2

## But

Valider sur smartphone le vrai chemin :

`Combat data -> Combat State/Timing -> Combat Session -> Combat Runtime -> Presenter -> Animation / FX`

sans dépendance à GenSrpG.

## Comportement par défaut

- Maraileron et Braisombre restent en idle ;
- l'énergie démarre à 0 ;
- chaque créature gagne +1 énergie toutes les 2 secondes dans les données de test ;
- Maraileron paie 1 énergie par palier de déplacement ;
- Braisombre paie 3 énergies par palier ;
- seule la créature déplacée bouge visuellement ;
- l'arène et les capacités restent visibles simultanément.

## Capacités de test

Maraileron :

- Boule de feu : Offensive / Projectile / Feu, coût 3 ;
- Griffe : Offensive / Contact, coût 2.

Braisombre peut réagir en temps réel :

- Bouclier miroir : renvoie Projectile, coût 2 ;
- Immunité feu : immunise Feu, coût 2 ;
- Riposte : contre Contact, coût 2.

Chaque carte de capacité possède une barre de charge liée au Combat Runtime.

Une réaction est déclenchée en appuyant sur sa carte pendant qu'une capacité adverse est en préparation ou en trajet.

## Charge

Les temps affichés viennent des données.

Le temps effectif peut ensuite être modifié par :

- `chargeTimeModifierPct` de la créature ;
- effets temporaires avec pourcentage et durée.

Convention : +X % ralentit la charge, -X % l'accélère.

## Distance

Les trois boutons restent :

- Courte ;
- Moyenne ;
- Longue.

La distance logique sert aux règles de portée.

Le rendu de position est séparé : seul le combattant qui choisit une nouvelle distance se déplace à l'écran.

## Outils laboratoire

Les contrôles Idle / Attaque / Hit / KO et l'import d'images restent disponibles dans le panneau `Outils visuels du laboratoire`.

Ils ne sont pas nécessaires pour utiliser le prototype de combat.


## Ajustement visibilité / barre principale

Le sous-lot de présentation conserve les règles V2 intactes et modifie seulement la projection visuelle :

- taille générale des créatures légèrement réduite ;
- position longue bornée dans l'arène ;
- scale de scène léger selon la distance :
  - Courte : 1,00 ;
  - Moyenne : 0,96 ;
  - Longue : 0,90 ;
- seul le combattant qui se déplace change de position et de scale de scène ;
- le choix de la créature déplacée et le reset sont rangés dans `Réglages du test`, sous l'interface principale ;
- une barre de charge principale est visible sous le nom de chaque créature ;
- cette barre reflète directement la progression du Combat Runtime ;
- Boule de feu utilise 2,0 s de préparation dans les données de test avant le départ du projectile.

Les petites barres présentes sur les cartes de capacité restent un détail de laboratoire. La barre sous le nom est la lecture principale pendant le combat.


## Actions tactiques V3

L'interface principale affiche maintenant :

- Objet ;
- Rappel ;
- Invocation.

Chaque action affiche son coût et sa charge, consomme la même énergie que les compétences et utilise la barre de charge principale de Maraileron.

Réglages de test :

- Objet : 1 énergie / 0,7 s ;
- Rappel : 2 énergies / 1,4 s ;
- Invocation : 3 énergies / 2,2 s.

Objet soigne de 20 PV à completion.

Rappel et Invocation valident pour l'instant le timing et l'événement sémantique. Le changement réel de créature/roster sera un lot séparé.

Dans `Réglages du test`, le bouton `Simuler impact Stun` permet de tester une interruption adverse :

1. démarrer Rappel ou Invocation ;
2. pendant la barre de charge, appuyer sur `Simuler impact Stun` ;
3. la charge doit être annulée ;
4. si l'action a déjà atteint son release, l'interruption doit être refusée.

Ce bouton n'appartient pas à l'interface joueur.


## Vue joueur V4

La démo n'affiche plus les contrôles laboratoire dans la vue de partie.

Équipe joueur :

- Marai actif ;
- Drakon en réserve.

Équipe adverse :

- Drakon actif ;
- Marai en réserve.

Contrôles visibles :

- énergie du joueur ;
- Courte / Moyenne / Longue ;
- menu Capacités ;
- menu Objets ;
- menu Équipe ;
- réserve des deux camps.

Rappel :

1. coûte l'énergie configurée ;
2. charge via Combat Runtime ;
3. à completion, sauvegarde PV/énergie du membre actif ;
4. retire le monstre joueur de la scène.

Invocation :

1. nécessite un membre de réserve sélectionné ;
2. coûte l'énergie configurée ;
3. charge via Combat Runtime ;
4. à completion, remplace le slot `player` par le membre sélectionné ;
5. restaure son snapshot PV/énergie ;
6. change réellement l'asset et le profil affichés.

La réserve adverse est visible mais n'offre aucun contrôle joueur.


## V5 — boutons directs, KO et mouvements spéciaux

- les capacités principales sont visibles directement dans le HUD ;
- Objets / Équipe restent des menus secondaires ;
- l'arène est légèrement plus haute ;
- lorsqu'un adversaire atteint 0 PV :
  1. Hit ;
  2. KO ;
  3. remplacement automatique par le membre vivant de réserve ;
- aucun bouton joueur ne contrôle la réserve adverse.

Mouvements spéciaux :

- Frappe téléportée : disparition -> apparition sur l'adversaire -> impact -> retour ;
- Plongeon aérien : montée -> disparition -> piqué sur l'adversaire -> impact -> retour.

Le contact visuel avec la cible correspond au timestamp d'impact du moteur de combat. Les dégâts ne sont pas liés à la fin du retour visuel.


## V6 — contact mobile et HUD temporel

- Griffe se déplace maintenant réellement vers l'adversaire ;
- son trajet de démonstration est de 1,5 s ;
- cette valeur provient de `data/combat/skills/claw.skill.json` ;
- modifier `travelMs` modifie automatiquement le délai jusqu'au contact ;
- les dégâts arrivent lorsque la créature atteint la cible ;
- le mouvement de retour se produit ensuite ;
- Plongeon aérien monte plus haut avant le piqué ;
- l'arène est encore légèrement plus haute ;
- la barre sous le nom est plus grande et indique :
  - action en préparation ;
  - temps restant ;
  - progression du trajet après release.

Le KO utilise maintenant un événement sémantique explicite `fighter-ko` avant le remplacement du membre adverse.
