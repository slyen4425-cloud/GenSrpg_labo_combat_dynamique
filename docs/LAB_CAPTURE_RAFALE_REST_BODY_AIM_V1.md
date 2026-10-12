# Labo Combat — Rafale puissance de projectile 2 et trajectoire sur corps au repos

Date : 2026-10-12.

## Retour utilisateur

Rafale (lib_gust) doit avoir sa **puissance de clash de projectile à 2**. Le sprite du projectile passe au-dessus d'une créature pourtant immobile à sa position normale depuis le lot « tirs directs sur slot stable ». Le tir ne doit cependant jamais viser en hauteur une cible qui vole ni sous terre une cible enterrée, et une cible au sol doit toujours pouvoir être touchée en mouvement à mi-arène.

## Cause et propriétaires

Le rendu `src/adapters/renderer/dom-skill-fx.js` visait le **centre du slot complet** plutôt que le centre du **modèle opaque au repos**. Les modèles ont des zones transparentes, origines et tailles propres ; le centre du slot peut se situer hors du corps. Le système de collision, lui, vise déjà le masque opaque vivant. Pas de modification du moteur ni du contact.

Le nouveau calcul direct `restingProjectileAimRectV1` conserve l'ancrage stable de slot, mais reporte uniquement le **décalage du centre opaque visible relativement à l'ancre de mouvement** vers le slot au repos. Une translation vers le haut/bas déplace en même temps l'ancre du modèle et son corps opaque : elle s'annule algébriquement. Le segment est figé au départ et ne suit jamais le déplacement ultérieur de la cible. Si l'image n'est pas encore prête, l'ancien centre du slot est conservé. `skyfall` continue d'utiliser sa cible mobile. Aucune nouvelle source de vérité ou collision.

`data/capture/showcase/lib_gust.capture-skill-transfer-v1.json` ne change que `projectileClash.power: 0 -> 2` : conservation stricte dégâts 4 Air, coût énergie 3, temps 800/700/8000, sprite vent et impact, offsets, échelle, sons, particules et identité. Hash SHA-256 nouveau `5104d712da06e7c4818950dbd86bb6f3fb6ce4241842173a969a138a9ea7af55`; auteur précédent préservé par checkpoint et historique Git.

## Charte, tests et diffusion

Base LIVE GREEN `gh-pages` SHA `51d8b205a6aab7aa366552eb2837d231924d5b03` ; checkpoint `checkpoint/lab-start-capture-rafale-rest-aim-v1-2026-10-12` ; work `work/lab-capture-rafale-rest-aim-v1-2026-10-12`. Test RED `tests/unit/capture-rafale-rest-body-aim-v1.test.mjs` commit `c5d8858107a5a541e3f0001c5d2acb3e7ec4da7e`.

Périmètre autorisé : la seule valeur de puissance Rafale, le seul propriétaire FX, sentinelles du tir direct/jeu, sentinelle historique du preset, cette documentation et `LAB_CURRENT_WORK`. Aucune modification de `main`, `global-assets`, `Zombicide-40k`, Exploration, dégâts, autres compétences, collision, hit presence, calcul de dégâts ni FX de statut.

Tests requis : puissance 2 avec intégrité des autres paramètres, cible immobile sur centre opaque, translations aérienne/souterraine sans suivi, skyfall, collision opaque live à mi-arène et deux directions, Boule de feu surface-only, CI et Chromium au SHA exact, checkpoint GREEN puis fast-forward `gh-pages` non forcé, et vérification post-publication. Validation visuelle sur mobile par l'utilisateur.
