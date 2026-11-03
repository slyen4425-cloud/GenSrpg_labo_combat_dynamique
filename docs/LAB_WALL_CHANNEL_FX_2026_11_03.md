# Lot — Mur adverse et présentation de canalisation (2026-11-03)

Base immuable : gh-pages@4c6a2c13c1b705f74ddfc9dc9e10451bc2cd0453.
START : checkpoint/lab-start-wall-channel-fx-2026-11-03.
WORK : work/lab-wall-channel-fx-2026-11-03.

## Signal auteur
- Le mur adverse (placement libre en arène) est trop avancé dans le camp joueur, malgré la première projection par équipe.
- Durant une canalisation, animer le sprite auteur de cast en boucle et le laisser actif jusqu'à l'arrêt sémantique natif.
- Chaque pulsation qui fait sortir un projectile sous la cible rejoue le son « projectile/trajet », et non l'impact.

## Responsabilités et périmètre
- Projection du mur uniquement dans src/adapters/renderer/combat-entity-overlay-v1.js ; autorité physique et HP Combat State inchangés.
- Plan de préparation dans src/core/fx/skill-fx-plan.js ; animation et propriétaire de la boucle dans src/adapters/renderer/dom-skill-fx.js ; durée de vie d'une présentation dans src/adapters/renderer/combat-resolution-presenter.js.
- Rôle du son dans src/adapters/audio/dom-combat-audio.js ; callbacks natifs de tick dans src/ui/combat-test-ui.js et src/ui/combat-2v2-test-ui.js.
- Chargement sur les deux chemins 1v1/2v2 et preview auteur : seuls les imports ESM strictement nécessaires peuvent être révisés, sans nouveau catalogue.
- Documentation, tests unitaires de projection/pose/audio et smoke navigateur de mur réel.
- Protégés : exports auteur, capacités, HP/énergie, Combat Runtime/Session, autres sprites/sons, main, Exploration, GenSrpg, global-assets.

## Preuves exigées
1. RED sur le comportement actuel : mur adverse plus près de sa créature, cast persistant sans seconde horloge, rôle audio du tick.
2. GREEN des tests unitaires + vrai chemin 1v1/2v2, suppression de la boucle sur fin, interruption, échec et dispose ; non-régression placement joueur et collisions.
3. CI Laboratoire 5/5 sur SHA code+documentation exact, checkpoint GREEN exact, PR vers gh-pages, CI et déploiement Pages post-fusion. Test visuel Android auteur distinct.
