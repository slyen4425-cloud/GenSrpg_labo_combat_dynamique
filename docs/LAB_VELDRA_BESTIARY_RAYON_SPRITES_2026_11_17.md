# Veldra : Bestiaire, Rayon cardinal et sprites — 17 novembre 2026

Base : `main@e748a761016617aec186ac8410d9f4d45ab354ee` ; checkpoint `checkpoint/lab-start-veldra-bestiary-rayon-sprites-20261117` ; branche `work/lab-veldra-bestiary-rayon-sprites-20261117`. Charte Labo Combat appliquée, autre PWA hors périmètre.

**Rayon cardinal** : 5 ticks de 8 dégâts en 2 secondes (40 de base) ; +10 au cinquième tick réellement atteint seulement si Marque solaire active (50 sous condition, sans compter Plume solaire). Paramètres source unique du JSON Showcase. Sentinelle Combat Runtime actualisée, non réécrite.

**Bestiaire** : `describeCaptureSkillV1` est l'autorité commune Bestiaire / éditeur ; il décrit désormais l'effet générique `ally_reserve_relay` (réserve alliée, KO admis, soins plafonnés, dégâts %, durée, échange sous verrou), et les effets optionnels `channeling.finalTickEffects` sous leur condition native. `cleanse.slowOnly` ne doit pas prétendre supprimer tous les malus. Cache ESM ciblé actualisé.

**Sprite audit** : les assetId suivants ont été vérifiés dans le catalogue unique `global-assets` : Plume solaire `travel:sprite-projectile-light-01` ; Égide du zénith `cast:sprite-light-shield-cast-01` ; Rayon cardinal `beamStart/travel/impact:sprite-electric-yellow-beam-*` ; Relève céleste `cast:sprite-light-shield-cast-01`. Percée d'aurore n'a qu'une icône `icon-skill-lance-d-aurore-01` et l'approche aérienne native : **pas de sprite FX associé**. Bouclier et rayon sont des sprites génériques provisoires. Aucune création d'asset ni doublon.

Gates : test unitaire prose et fiche Bestiaire + intégration 5 ticks natifs, CI complète cinq jobs sur SHA exact, comparaison sans régression, Pages HTTPS `main` et checkpoint GREEN après vérifications. Aucun projet Exploration/Donjon/Survie/GenSRPG modifié.
