# Labo Combat — Modificateur universel des dégâts infligés V1

15 octobre 2026. Lot isolé fondé sur `gh-pages@2d352918b0ac5f829c2bb349da7fb4ad121d2f06`. Branche `work/lab-universal-outgoing-damage-v1-2026-10-15`, checkpoint de départ `checkpoint/lab-start-universal-outgoing-damage-v1-2026-10-15`.

## Besoin auteur et comportement
- Une même propriété de dégâts **sortants**, sans canal, sans résistance : `outgoingDamagePct` dans le combattant et les projections, `outgoingDamagePctPerPoint` dans la définition d'une statistique personnalisée et ses règles de buff/stat.
- Exemple univers alternatif : `Puissance` avec `outgoingDamagePctPerPoint:1`. Une créature ayant 25 points gagne +25 % de TOUS les dégâts infligés, physique, élémentaire ou canal nouvellement créé, mais pas +25 % de résistance. L'univers Capture de base n'ajoute pas de nouvelle stat Puissance.
- Exemple buff/debuff temporaire via **Appliquer un statut** : `outgoing_damage_modifier` et `modifierPct:-30` ou `modifierPct:+20`, durée, polarité, stacks et rechargement configurés comme les autres statuts. À l'expiration, effet disparu.
- Calculateur unique `computeCombatDamageV1` applique `max(0,1+(stat+status)/100)` multiplicativement au bonus du canal ; défense, résistance, réduction entrante et pénétration conservent leurs propriétaires existants. Valeurs élémentaires / statistiques futures automatiquement concernées, pas de `all_elements` factice ni duplication d'effets par canal.
- L'éditeur affiche « Tous dégâts infligés % / point » dans les définitions de stats avec aide lisible « 1 point = … », et « Dégâts infligés (tous types, %) » dans les types de statuts. Les exports V3 conservent cette propriété en sauvegardes/parties et le combattant la reçoit via l'adaptateur.
- Aucune créature ou capacité auteur, stat de l'univers de base, image, audio ou autre dépôt ne change ; ancien format sans nouveau champ reste valide.

## Vérification et limites
- Sentinelle `tests/unit/capture-universal-outgoing-damage-v1.test.mjs` : définition `Puissance`, 25 points = 25 % dégâts, physique/feu/canal perso, malus -30 %, buff +20 %, stacks, expiration, résistance intacte, UI.
- Foundation, Firestorm Chromium et Creature Library Chromium au SHA final exigés. Une exécution antérieure du lot s'est interrompue sur le **timeout Chromium 50s** indépendant (Foundation et Firestorm GREEN) ; ne pas masquer ce fait.
- Aucun changement du traitement spécifique des sources directes vs indirectes (DoT, réflexion). Les voies de dégâts qui utilisent `computeCombatDamageV1` appliquent la règle ; les dégâts fixes et les renvois calculés sur PV réels conservent leurs règles propriétaires et ne sont pas artificiellement amplifiés. Si demandé, ajouter un filtrage éditable dans un lot distinct après décision.
- Validation manuelle Android du rendu, édition stat personnalisée, sauvegarde et buff/debuff en partie demeure distincte des tests Chromium.
