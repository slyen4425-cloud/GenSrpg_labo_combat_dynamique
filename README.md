# GenSrpG — Laboratoire combat dynamique

Prototype autonome destiné à expérimenter un moteur de combat visuel dynamique à partir d'une image unique par créature.

## Statut

Laboratoire indépendant. Ce dépôt n'est pas lié techniquement au dépôt GenSrpG/Zombicide-40k.

## Objectif initial

Valider un système capable de produire des animations simples et lisibles pour des créatures créées par les joueurs :

- idle ;
- attaque ;
- impact/dégâts ;
- esquive ;
- KO ;
- entrée en combat ;
- effets visuels et mouvements de caméra légers.

Le moteur doit fonctionner avec une seule image PNG et rester extensible vers des créatures disposant de plusieurs poses ou sprites.

## Principe d'architecture

Le moteur de combat logique et le moteur d'animation doivent rester découplés. Le laboratoire se concentre d'abord sur la couche animation/FX et sur des événements génériques (`attack`, `hit`, `ko`, etc.).

Voir `docs/` pour la charte, la roadmap, l'architecture et l'état du chantier.
