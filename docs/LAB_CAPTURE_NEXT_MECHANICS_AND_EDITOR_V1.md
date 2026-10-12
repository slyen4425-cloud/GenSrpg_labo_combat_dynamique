# Labo Combat — Clarté éditeur Capacité et prochains mécanismes (12 octobre 2026)

## Source et périmètre
Demande auteur : conserver le réglage rapide des effets visuels au premier plan ; rendre Cast, Projectile et Impact personnalisables faciles à trouver ; minimiser les valeurs manuelles de glow, traînée et fumée. Prévoir ensuite six créatures visibles dans le banc adverse avec des barres de vie compactes et une icône par créature. Étudier renvoi réel de projectile, immatériel, effets à seuil de stacks et drain de vie.

**Ce document est un état d'inventaire et un backlog, pas une annonce d'implémentation des quatre mécanismes.** Le lot courant ne change pas les règles de combat ni les exports de compétences.

## Réorganisation Capacité V1 — réalisée en présentation

- Le flux de presets rapide « Choisir un style » → « Choisir l'intensité » reste au premier plan, sans auto-application.
- Le panneau « Personnaliser les animations — Cast · Projectile · Impact » est directement accessible et ouvert lors de l'affichage. Les sections Cast / Projectile / Calques / Impact / Zone possèdent chacune leur bouton de dépliage explicite.
- Les paramètres très techniques « FX experts — Glow, fumée, traînée et secousses » sont repliés par défaut, **sans suppression des valeurs ni changement de moteur**. Ils restent éditables et exportables.
- Les préréglages Glow et Particules déjà présents dans « 3. Personnaliser » restent disponibles mais ce détail optionnel demeure fermé par défaut.
- Aucun identifiant d'input `data-skill-*` n'est dupliqué ni retiré ; le même Human Editor demeure l'unique contrôleur.

## État réel des mécaniques

### A — Miroir / renvoi de projectile — nouveau lot moteur
- Présent : l'effet de statut `damage_reflection` et sa valeur en pourcentage existent ; des réactions tactiques `reflectForms` existent dans le contrat.
- **Absent ou non validé pour le besoin auteur** : inversion physique d'un projectile en vol avec retour vers le lanceur, nouveau contact, impact, et résolution des dégâts en une seule action.
- Contrat à concevoir au propriétaire Combat Rules / projectile runtime, puis visuel piloté par événement `reflected`. Ne pas utiliser une deuxième boucle JS ni simuler un nouveau projectile sans source d'autorité. Préciser les règles de collision, bouclier, immunités, distance et anti-boucle miroir↔miroir.
- Exemple d'acceptation : une boule de feu touche Miroir, repart clairement vers l'attaquant ; les dégâts sont appliqués seulement au contact du retour, pas à la première collision miroir.

### B — Immatériel — nouvelle règle par statut/type d'attaque
- Présent : statut `immunity` avec domaines `damage` et `negative_status`; le moteur teste les dégâts directs et périodiques, et les états négatifs. Les présences surface/aérien/souterrain sont un autre système, à ne pas confondre.
- **À ajouter** : statut `immaterial` (ou capacité/présence explicitement définie) interdisant dégâts et états à une attaque ordinaire, avec exception d'une propriété explicite « touche immatériel » sur certaines attaques.
- Une immunité générique 100 % ne suffit pas : elle n'exprime pas l'exception « attaque spectrale ».
- Décider ce qui se passe avec soin/buff autorisé, collision physique, ciblage réserve, AoE et effets de zone. Résolution côté moteur, jamais par simple invisibilité FX.

### C — Stacks et déclenchement au seuil — compléter l'existant
- Présent : `STATUS_EFFECT_V1_STACKING` (`refresh`, `replace`, `stack`), `maxStacks` ; addition bornée via Status Effect Runtime ; multiplicateurs de DoT/HoT selon stacks. Human Editor expose « Empiler » et « Stacks max » sur les statuts.
- **À ajouter** : règle générique de seuil (`thresholdStacks=5`, effet `onThreshold`) déclenchant une seule fois un effet/KO/soin/buff/etc. au moment où la cinquième application est réellement acceptée.
- Applicable aux statuts positifs ou négatifs ; prévoir reset/consommation des stacks après déclenchement, politique du doublon, cap max, KO conditionnel, immunités, dissipation et export/import. Définir le lien aux systèmes de déclenchement existants pour éviter les doubles owners.

### D — Drain de vie — à implémenter après vérification de la chaîne dégâts/soin
- Présent : `energy_drain` (drain d'énergie), dégâts normaux, soins normaux et le système canonique de dégâts réellement appliqués.
- **Non identifié comme mécanisme HP autonome dans les modules examinés** : « infliger X PV à l'ennemi, soigner le lanceur de Y % des PV retirés ». Ne pas confondre avec `energy_drain`.
- Contrat conseillé : `life_drain` ou composant de soin lié au résultat de dégâts, limité à `appliedHpDamage` (PV réellement perdus, hors dégâts annulés / overkill). Aucun second coup : un événement canonique de dégât et un soin lié, avec log et HP corrects. Vérifier les soins max, immunités, boucliers, DoT, cibles réserve et KO.

### E — Réserve adverse à six créatures — proposition HUD distincte
- Conserver l'onglet **à gauche de la barre de PV adverse en haut** tel que validé ; rendre sa liste compacte (barres PV plus fines, nombre, état KO et petite icône de chaque créature).
- Tester six créatures par camp en téléphone paysage ; défilement vertical limité, pas d'occlusion de l'arène ou du bouton de ciblage ; garder les portraits fournis par le Roster/Creature profile comme source unique d'assets, sans image de remplacement arbitraire.
- **Non inclus dans le lot présent** : nécessite d'identifier le contrat d'image du banc avant l'UI.

## Ordre de réalisation suggéré (lots isolés)

1. Recevoir la validation Android de la disposition Capacité.
2. Préparer le seuil de stacks avec tests positifs/négatifs/KO (étend un contrat déjà en place).
3. Implémenter le drain de vie lié au résultat de dégâts.
4. Concevoir la règle immatérielle et les attaques pouvant la toucher.
5. Miroir de projectile : chantier plus large impliquant Rules, Runtime, collision/contact et animation.
6. Panneau réserve six créatures + portraits : UI indépendante, lorsque le contrat d'icône est vérifié.

Chaque lot exige sa déclaration `LAB_CURRENT_WORK`, test RED sur vrai chemin, CI/Pages et checkpoint GREEN propres. Aucun de ces points n'autorise un changement dans `Zombicide-40k`.
