# 2026-11-10 — Monster Capture : statistiques des rencontres sauvages (lot Combat isolé)

START main `f0431774e8831467a64a0c86b5985f8c5c2e5033` ; checkpoint START `checkpoint/combat-wild-level-stats-start-2026-11-10`.
Le niveau sauvage sélectionne déjà les capacités, mais ne donne pas automatiquement de statistiques.
Premier lot sans raccord gameplay : allocateur déterministe **Combat** de points par niveau, défaut vitrine 20 points/niveau après le niveau 1 ; exemple niveau 10 = 180 points. Répartition selon PV, défense, vitesse, valeurs initiales de l'espèce et canaux des attaques réellement utilisées. Le registre officiel `capture-stat-registry-v1` reste propriétaire des IDs et effets ; aucune statistique inventée.
Ce module est volontairement **non branché aux rencontres** : les ennemis n'obtiennent pas encore ces bonus en jeu. Il faudra certifier le contrat PNJ, les canaux des capacités, les combats miroir, les réserves, puis la capture et la conservation des points avant activation.
Aucun changement du testeur niveau 20, de la progression joueur, des sauvegardes, de l'Exploration, des créatures éditées, des assets ni de V80. CI et checkpoint GREEN requis avant fusion.
