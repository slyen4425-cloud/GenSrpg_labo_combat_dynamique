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
