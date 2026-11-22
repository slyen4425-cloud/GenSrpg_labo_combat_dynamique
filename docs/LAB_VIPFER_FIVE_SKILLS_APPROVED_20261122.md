# Vipfer — cinq compétences validées (22 novembre 2026)

## Décision auteur
Base approuvée le 22 novembre : **Vipfer**, serpent mythique de type Acier, constriction/contre-attaque/projectiles. Cinq slots canoniques, sans copie de moteur, sans suppression des médias auteur ni d'anciens exports. Les compétences actuelles de Feu de Vipfer (`claw`, `fireball`, `cap_fire_special_1`, `lib_flame_bite`, `cap_fire_atk_6`) sont des références provisoires à remplacer uniquement lors d'un changement complet de loadout validé et testé.

| Slot | Capacité | Dégâts et effet | Recharge | Énergie |
| --- | --- | --- | --- | --- |
| 1 | **Morsure à ressort** | 12 dégâts Acier de contact, esquivable, aucun statut | 7 secondes | 2 |
| 2 | **Étreinte d'acier** | 13 dégâts Acier au contact puis **immobilisation 10 secondes** ; cible peut toujours attaquer, utiliser des compétences et esquiver | 26 secondes | 4 |
| 3 | **Mue tranchante** | **+200 Défense pendant 8 secondes** ; à la **première attaque de contact reçue**, riposte **25 dégâts Acier** ; une riposte maximum par activation, distance exclue | 32 secondes | 5 |
| 4 | **Couronne d'éclats** | **3 lames distinctes de 12 dégâts Acier**, jusqu'à **36** ; chaque projectile peut être esquivé séparément ; si au moins une touche, **ralentissement de 15 % pendant 6 secondes**, sans cumul | 28 secondes | 5 |
| 5 (ultime) | **Broyeur serpentin** | **60 dégâts Acier à l'impact** puis **10 dégâts toutes les 0,5 seconde** pendant que Vipfer maintient l'étreinte. La cible peut **attaquer pendant l'étreinte**. **Dès qu'elle inflige effectivement des dégâts à Vipfer, la constriction cesse immédiatement**. Esquivable, préparation interruptible. **Pas de durée maximale arbitraire tant que l'auteur ne l'a pas décidée.** | Une seule utilisation par combat, déverrouillé après 30 secondes ; préparation 1,5 seconde | 9 |

## Conditions natives de réalisation avant GREEN
- La vraie collision de la capacité 2 doit appliquer un statut **immobilize** de **10 000 ms** (pas de stun/silence) et sa durée doit être clairement visible.
- La riposte de la capacité 3 doit être déclenchée exactement **une seule fois**, au **premier contact** reçu, sans riposte répétée aux contacts ultérieurs, sans être déclenchée par un projectile.
- La capacité 4 exige **3 collisions/projectiles indépendants**, une dépense unique de l'énergie et du cooldown, des esquives indépendantes et aucun triple dégât automatique sur une seule collision. Ne pas afficher des clones de Vipfer en guise de lames.
- La capacité 5 exige le **vrai contact** au lancement et une horloge unique à **500 ms** ; le tick de 10 n'est pas un poison. La cible doit pouvoir riposter et l'interruption doit se produire **après une perte réelle de PV de Vipfer par la cible**, pas simplement sur un projectile bloqué, raté ou absorbé par un bouclier. On ne rajoute ni timer global ni double autorité sur les PV, l'énergie ou les esquives.
- Tester les positions joueur/ennemi, les animations distinctes, les KO, échanges, résistances, esquive et 2v2. En particulier, une étreinte ne doit pas survivre à la disparition du combattant ou de sa cible.
- Le moteur possède déjà `contactHold` avec `tickIntervalMs=500`, `maxDurationMs=0` (sans limite) et arrêt sur `damageTakenTotal`, ainsi que des fenêtres `stampede` par passage. **Ces mécanismes ne suffisent pas à eux seuls à prouver les visuels de trois lames ni l'interruption uniquement par la cible** : tester les frontières avant tout raccord.
- Actuellement les valeurs approuvées sont une **spécification**, pas une preuve que les compétences ont été installées. Aucun changement aux données de Vipfer ni à la PWA n'est autorisé dans ce lot documentaire.

## Charte et protection
- Source de départ : Combat `main@34c17c15f4ca8b457a94e49fa2f3fcfb8ca93ca0`, checkpoint `checkpoint/lab-start-vipfer-five-skills-20261122`.
- Branche de préparation temporaire : `work/lab-vipfer-five-skills-20261122`; seule `main` est l'autorité de publication.
- Seuls domaines prévus pour la future implémentation : transferts auteur/skill presets Vipfer, catalogues associés, tests de règles/renderer ciblés et journal. Protéger tous les autres monstres, animations et médias, UI PC/mobile et PWA.
- Gate d'implémentation séparé : contrat -> test RED -> code minimal -> tests unitaires/intégration/navigateur -> CI du SHA exact -> checkpoint GREEN -> HTTPS du Labo. Fusion PWA **uniquement** sur demande explicite et via un lot éditeur/publication distinct.
