# Identifiants d'éléments — équivalence française au calcul combat (20 octobre 2026)

## Écart constaté
- Registre auteur `monster-capture-stat-registry.v1.json` : statistique Acier (`id=acier`), bonus dégâts et résistance `channel=acier`.
- Créature Scarabacier et plusieurs compétences : `element=steel`, résistance naturelle `element:steel`.
- `computeCombatDamageV1` consultait une seule clé texte exacte, excluant silencieusement l'autre. Les anciens dégâts directs, DoT et zones appellent tous cette fonction de calcul.
- Un champ `channel=acier` fonctionne bien pour les PV, mais il pouvait contourner les bonus/résistances `steel` : c'est un défaut de règles, pas une obligation de saisir de l'anglais.

## Unique correction
`src/core/combat/combat-damage-v1.js` est **l'unique propriétaire** de l'équivalence des canaux au moment des dégâts. Son résolveur `canonicalCombatDamageChannelV1` reconnaît uniquement les éléments natifs connus et leurs libellés français et clés internes : `acier` et `steel` identiques ; `feu` et `fire`, `électricité` et `electric`, etc. Les sources historiques restent inchangées dans leurs fichiers.

Le calcul additionne les contributions provenant de plusieurs clés historiques correspondant au même élément (ex. `damagePctByChannel: {acier: 10, steel: 20}` => +30%). Les vulnérabilités négatives, la pénétration et les réductions génériques restent dans le calculateur d'origine. Les canaux d'utilisateurs inconnus ne sont jamais « traduits » ni regroupés au hasard. Les IDs retournés et les exports ne sont pas réécrits.

**Ce n'est pas un second catalogue actif :** aucune création d'élément, stat, résistance ou statut ; seulement une normalisation des clés avant le calcul de Combat Rules. L'éditeur dispose de son affichage français déjà publié ; il ne porte aucune règle de dégâts.

## Validation
`tests/unit/capture-element-channel-equivalence-2026-10-20.test.mjs` contrôle l'équivalence des éléments natifs, les deux sources de bonus/résistance, les éléments personnalisés distincts, le véritable SkillDefinition -> CombatSession -> HP, un DoT réel et le tick de la zone exportée Tempête de rouille sans modifier l'export. Contrôles de non-régression, CI complète cinq jobs, déploiement Pages ; test visuel sur téléphone distinct.

## Séparation
La régression d'ombre PR #37 et les mutations visuelles sont hors du périmètre ; `main`, `global-assets` et le jeu principal restent inchangés.
