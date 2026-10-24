# Bestiaire — précision de ciblage exceptionnel (2026-10-24)

## Contexte et demande
Le descriptif court du Bestiaire (PR #89) doit mentionner les exceptions tactiques de portée effective : cibles en vol, souterraines et immatérielles, lorsqu'elles sont autorisées par la vraie définition de compétence. Les attaques ordinaires ne doivent pas afficher les états courants ni les paramètres techniques.

## Vérification des autorités
- Contrat : `normalizeSkillDefinition`, champs `hitPresenceStates` (null ou liste explicite surface, airborne, underground) et `hitsIntangible`.
- Combat Rules : `skillPresenceReachV1` dans `src/core/combat/combat-presence-v1.js`. Une attaque offensive sans configuration touche les cibles en surface mais pas celles en vol ou sous terre pendant leur déplacement. Une liste explicite décide quels états sont atteignables. L'immatériel est indépendant, via `hitsIntangible`.
- Présentation : `src/ui/capture-skill-explanation-v1.js` reste le propriétaire unique des phrases. Pas de double calcul, aucune modification de Combat Rules.

## Plan, branche, autorisations
- Base `gh-pages@ad3ca998492c690ae9b111a29474432e64910f93`, START `checkpoint/lab-start-bestiary-special-targets-2026-10-24`, travail `work/lab-bestiary-special-targets-2026-10-24`.
- Fichiers autorisés : `src/ui/capture-skill-explanation-v1.js`, sentinelles `tests/unit/capture-skill-explanation-2026-10-24.test.mjs`, documentation / journal uniquement.
- Domaines protégés : moteur combat, Contrats Skill, intégration Capture, catalogue de capacités, UI Bestiaire, éditeur, application principale.

## Critères GREEN
- Aucun libellé de ciblage exceptionnel si uniquement normal / non configuré.
- Surface + airborne : « Peut aussi toucher les créatures en vol. »
- Surface + underground : « Peut aussi toucher les créatures sous terre. »
- Surface + airborne + underground + hitsIntangible : phrase naturelle regroupée.
- Cas limités explicitement sans surface : mention « uniquement » adaptée, sans prétendre toucher les créatures au sol.
- Existant `hitsIntangible` reste décrit sans doublon ; `dodgeable=false` reste présent.
- Vrais presets Tornade, Arc électrique, Ouragan reconnus ; autres descriptions inchangées. CI 5 jobs et checkpoint GREEN avant fusion `gh-pages`.
