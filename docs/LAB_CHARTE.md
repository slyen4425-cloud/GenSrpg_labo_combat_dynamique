# Laboratoire Combat Dynamique — Charte permanente de développement

Cette charte est la référence obligatoire avant chaque travail sur le dépôt `GenSrpg_labo_combat_dynamique`.

Elle est inspirée de la charte permanente de GenSrpG, mais adaptée à un laboratoire autonome.

Objectif : empêcher les régressions, l'empilement de rustines, les doubles sources de vérité, les dépendances cachées à GenSrpG et la création d'un prototype impossible à intégrer proprement plus tard.

## 1. Indépendance absolue vis-à-vis de GenSrpG

Le laboratoire est un projet autonome.

Interdictions par défaut :

- aucun import depuis `Zombicide-40k` ;
- aucune dépendance runtime à GenSrpG ;
- aucune lecture directe de ses sauvegardes, variables globales, DOM ou assets ;
- aucun copier-coller d'un moteur historique comme fondation implicite ;
- aucune modification de `Zombicide-40k` depuis ce chantier.

Une future intégration devra passer par un adaptateur documenté et ne sera engagée qu'après validation explicite.

## 2. Responsabilités séparées

Le laboratoire est découpé en domaines distincts :

1. Event Contract — événements génériques de combat visuel ;
2. Animation Core — transformations et séquences d'animation ;
3. FX Core — flashes, particules, projectiles, ombres et caméra ;
4. Render Adapter — application des résultats visuels au renderer ;
5. Creature Profile — paramètres de morphologie et presets ;
6. Demo UI — interface de test uniquement ;
7. Asset Input — chargement et validation des images de test ;
8. Combat Rules Lab — distance, énergie et résolution des interactions de compétences pour les prototypes de gameplay.

Un domaine ne prend jamais silencieusement l'autorité d'un autre.

## 3. Une responsabilité critique = un propriétaire unique

Une seule autorité active est permise pour chaque responsabilité :

- séquencement d'une animation : Animation Core ;
- timing d'une animation : Animation Core ;
- effets visuels : FX Core ;
- mouvement de caméra : FX Core ;
- état visuel courant d'une créature : Animation State ;
- profil morphologique : Creature Profile ;
- lecture du fichier image : Asset Input ;
- affichage DOM/Canvas/WebGL : Render Adapter ;
- boutons, curseurs et prévisualisation : Demo UI ;
- contrat `attack/hit/ko/idle/etc.` : Event Contract ;
- définition d'une compétence : Skill Contract ;
- définition d'une commande tactique : Combat Command Contract ;
- progression/interruption temporelle de l'action active : Combat Runtime ;
- distance et énergie de combat : Combat Rules Lab ;
- roster actif/réserve et persistance des membres : Roster Session ;
- résultat `hit/blocked/reflected/immune/countered` : Combat Rules Lab.

Si deux modules pensent posséder la même responsabilité, le développement s'arrête jusqu'à clarification.

## 4. Le moteur ne dépend pas de l'interface

La Demo UI peut déclencher des événements et afficher des résultats.

Elle ne doit pas contenir la logique autoritaire des animations.

Interdit :

- calculer une trajectoire d'attaque dans un gestionnaire de bouton ;
- coder les timings principaux dans le HTML ;
- faire dépendre le Core d'un sélecteur DOM spécifique ;
- utiliser l'UI comme source de vérité de l'état d'animation.

Le Core doit pouvoir être testé sans interface graphique.

## 5. Contrat d'événements générique

Le laboratoire doit raisonner en événements génériques, par exemple :

- `idle`;
- `enter`;
- `attack`;
- `hit`;
- `dodge`;
- `ko`;
- `recover`;
- `skill`;
- `projectile`.

Le système ne doit pas connaître les règles de combat de GenSrpG pour les animer.

Un événement reçoit un snapshot visuel et produit une séquence visuelle.

## 6. Une image unique doit rester le cas minimal supporté

Le moteur doit fonctionner avec une seule image de créature.

Toute amélioration future — plusieurs poses, sprite sheet, squelette 2D, calques séparés — doit être additive.

Une créature disposant uniquement d'un PNG valide ne doit jamais devenir incompatible avec le moteur de base.

## 7. Profils pilotés par les données

Les différences de morphologie et de mouvement doivent être décrites autant que possible par des données.

Exemples de profils :

- humanoïde ;
- quadrupède ;
- volant ;
- flottant ;
- massif ;
- serpentin.

Les paramètres tels que amplitude idle, inclinaison, compression, vitesse d'avance, hauteur de flottement ou recul doivent provenir de profils/configurations plutôt que de branches de code dispersées.

## 8. Aucune valeur visuelle importante dispersée en nombres magiques

Les durées, amplitudes, distances, intensités, courbes et limites doivent être centralisées dans des presets ou configurations explicites.

Une valeur par défaut peut exister, mais elle doit être identifiable et surchargeable.

## 9. Une source de vérité unique

Exemples :

- animation active : Animation State ;
- profil actif : Creature Profile ;
- asset chargé : Asset Input state ;
- séquence d'effets : FX Core ;
- paramètres utilisateur de test : Demo UI state transmis explicitement au Core.

Le renderer affiche l'état ; il ne devient pas une deuxième source de vérité.

## 10. Pas de pollution globale

Interdits par défaut :

- variables métier arbitraires sur `window` ;
- `MutationObserver` sur tout le document ;
- listeners globaux bloquants ;
- `stopImmediatePropagation` comme mécanisme d'autorité ;
- `setInterval` permanent sans propriétaire ;
- retries destinés à reprendre une fonction écrasée ;
- monkey-patch global ;
- scan général du DOM ;
- auto-install implicite d'un module complexe.

Tout composant montable doit pouvoir libérer proprement listeners, timers et ressources.

## 11. Pas de rustine pour masquer une régression

En cas de bug :

1. reproduire ;
2. identifier le premier changement responsable ;
3. revenir au dernier checkpoint GREEN si nécessaire ;
4. corriger la cause démontrée ;
5. préférer un correctif soustractif ;
6. ajouter un test reproduisant la régression.

Interdit : ajouter une seconde boucle, un second listener ou un second système pour compenser un premier système défaillant.

## 12. Pas de big-bang

Les évolutions se font par petits lots vérifiables :

documenter -> contrat -> test -> implémentation minimale -> test réel -> checkpoint GREEN -> lot suivant.

Une fonctionnalité complexe est découpée en jalons indépendamment validables.

## 13. Découpage physique obligatoire du code

Structure cible :

```
src/
  contracts/
  core/
    animation/
    fx/
    profiles/
  adapters/
    renderer/
  ui/
  assets/
tests/
docs/
examples/
```

Un fichier ne doit pas devenir simultanément moteur, UI, renderer et stockage.

Si un fichier grossit au point de posséder plusieurs responsabilités, il doit être découpé avant de poursuivre l'empilement fonctionnel.

## 14. Découpage des assets et portabilité

Trois périmètres d'assets doivent rester explicitement séparés.

Structure cible :

```
assets/
  test/
    creatures/
    arenas/
    effects/
  library/
    core/
      audio/
    capture/
      icons/
      sprites/
      fx/
```

Règles permanentes :

- `assets/test/` reste réservé aux ressources de test du laboratoire et ne devient jamais silencieusement une bibliothèque GenSrpG officielle ;
- la bibliothèque `assets/library/core/audio/` est conçue comme une banque sonore commune, portable vers le dépôt principal GenSrpG et réutilisable par tous les modes qui en ont besoin ;
- les sons communs ne doivent dépendre ni d'un monde, ni du mode Capture, ni d'un chemin propre au dépôt laboratoire ;
- les références futures doivent utiliser des identifiants stables (`assetId`) plutôt que des URL GitHub ou des chemins de dépôt codés dans le gameplay ;
- provenance, auteur et licence doivent rester transportables avec les sons ;
- les assets visuels créés dans ce chantier (`icons`, `sprites`, `fx`) restent dédiés au mode Capture pour l'instant ;
- aucun autre mode ne doit consommer automatiquement ces visuels sans décision explicite ultérieure ;
- une éventuelle généralisation future des visuels fera l'objet d'un lot documenté séparé ;
- le dépôt ne doit jamais dépendre d'un chemin situé dans `Zombicide-40k`.

En cas de contradiction avec une documentation asset plus ancienne, la présente règle de charte prime : **audio commun multi-modes ; visuels Capture uniquement tant qu'aucune décision explicite ne change ce périmètre**.

## 15. Travail toujours sur une base connue

Avant tout chantier fonctionnel :

1. relever le SHA exact de la base ;
2. créer un checkpoint de départ ;
3. créer une branche de travail depuis exactement ce checkpoint ;
4. mettre à jour `docs/LAB_CURRENT_WORK.md` ;
5. ne jamais développer directement sur `main`.

## 16. Checkpoint obligatoire au début et à la fin

Format de départ :

`checkpoint/lab-start-<chantier>-YYYY-MM-DD`

Format GREEN :

`checkpoint/lab-<chantier>-green-YYYY-MM-DD`

Un checkpoint GREEN signifie que les tests exigés pour le jalon sont verts et que le comportement ciblé est validé au niveau prévu.

Un checkpoint ne doit jamais être créé rétroactivement sur un état modifié en le présentant comme la base d'origine.

## 17. Périmètre déclaré avant codage

Avant chaque lot, `LAB_CURRENT_WORK.md` doit indiquer :

- objectif ;
- propriétaire concerné ;
- branche ;
- checkpoint de départ ;
- SHA de base ;
- fichiers autorisés ;
- fonctions ou domaines protégés ;
- tests prévus ;
- risques ;
- critère de fin.

Si le périmètre déborde, le lot est arrêté et recadré.

## 18. Tests du vrai chemin

Un test ne doit pas contourner le raccord qu'il prétend vérifier.

Exemple pour une attaque :

`event attack -> profile -> animation plan -> renderer adapter -> état final`

Le test ne doit pas injecter directement l'état final attendu dans le renderer.

## 19. Tests sentinelles permanents

La CI devra progressivement couvrir au minimum :

- chargement d'une image unique ;
- idle ;
- attack ;
- hit ;
- dodge ;
- ko ;
- changement de profil ;
- interruption/annulation propre ;
- retour à idle ;
- absence de fuite de timers/listeners ;
- fonctionnement sans dépendance GenSrpG ;
- fonctionnement mobile/tactile de la démo.

## 20. Fonction stable = fonction protégée

Lorsqu'un contrat ou comportement est déclaré stable, ses invariants sont documentés et testés.

Toute modification future doit déclarer explicitement qu'elle touche ce contrat et repasser ses sentinelles.

## 21. Diagnostic avant modification

Lorsqu'une nouvelle animation ou couche visuelle casse une fonction existante, vérifier d'abord :

- ordre des couches ;
- transform CSS ou matrice du renderer ;
- origine de transformation ;
- `z-index` ;
- `pointer-events` ;
- timers restants ;
- animation non annulée ;
- état visuel non restauré ;
- listener ou promesse toujours actifs ;
- concurrence entre deux séquences.

Ne pas réécrire un autre domaine tant que sa faute n'est pas démontrée.

## 22. Performance mesurée, pas supposée

Les optimisations doivent partir d'une mesure reproductible.

Priorité :

- animation fluide sur smartphone ;
- nombre de reflows limité ;
- pas de boucle permanente inutile ;
- pas de recréation massive du DOM à chaque frame ;
- utilisation appropriée de `requestAnimationFrame` ;
- annulation propre des animations ;
- charge proportionnelle au nombre d'acteurs visibles.

Une optimisation qui change le comportement doit disposer de tests de non-régression.

## 23. Accessibilité aux appareils modestes

Le prototype doit prévoir un mode d'effets réduit.

Les animations essentielles à la compréhension du combat doivent rester lisibles sans particules lourdes, blur coûteux ou caméra complexe.

## 24. Portabilité future

Le Core ne doit dépendre ni du nom GenSrpG, ni d'un monde Capture, ni d'une structure de sauvegarde historique.

Une future intégration devra pouvoir suivre un modèle de type :

`GenSrpG/Capture -> Adapter -> Dynamic Combat Lab Core -> Render Adapter`

Le Core doit rester utilisable indépendamment.

Les ressources transportables suivent la règle du §14 : banque audio commune multi-modes, visuels limités à Capture tant qu'une décision explicite n'élargit pas leur portée.

## 25. Pas d'intégration à GenSrpG sans décision explicite

Même si une API semble prête, aucune modification de `Zombicide-40k`, aucun submodule, package, copier-coller ou raccord runtime ne doit être effectué sans validation explicite de Sylvain.

Le laboratoire doit d'abord démontrer sa valeur seul.

## 26. Publication et jalons

Avant de considérer un jalon comme GREEN :

1. tests unitaires requis ;
2. test du vrai chemin ;
3. revue des fichiers modifiés ;
4. vérification d'absence de dépendance GenSrpG ;
5. vérification mobile lorsque l'UI est concernée ;
6. documentation mise à jour ;
7. checkpoint GREEN créé sur le SHA exact.

Une CI rouge bloque un jalon GREEN.

## 27. Critère de fin d'un chantier

Un chantier est terminé uniquement si :

- le propriétaire cible est unique ;
- aucune autorité concurrente n'a été ajoutée ;
- les tests prévus sont verts ;
- le vrai raccord est testé ;
- la documentation est à jour ;
- le comportement ciblé est vérifiable ;
- le checkpoint GREEN existe.

## 28. Point de reprise unique

Lors d'un changement de fil ou d'une reprise de travail, commencer obligatoirement par lire :

1. `docs/LAB_CHARTE.md` ;
2. `docs/LAB_ROADMAP.md` ;
3. `docs/LAB_CURRENT_WORK.md` ;
4. `docs/LAB_ARCHITECTURE.md` ;
5. le checkpoint et le SHA indiqués dans `LAB_CURRENT_WORK.md`.

Ne jamais repartir uniquement d'un résumé de conversation ou de mémoire.

GitHub est la source de vérité de l'état du laboratoire.

## 29. Règle finale

Quand deux solutions sont possibles, choisir celle qui :

- réduit les effets globaux ;
- garde une seule source de vérité ;
- sépare les responsabilités ;
- facilite les tests ;
- facilite le rollback ;
- fonctionne avec une image unique ;
- reste indépendante de GenSrpG ;
- rend une future intégration possible sans dette cachée.

Cette charte prime sur la solution la plus rapide.


## 30. Séparation Combat Rules / moteur visuel

Le laboratoire peut héberger un prototype de règles de combat à condition de préserver une frontière stricte.

Chaîne autorisée :

`Combat Data -> Combat Rules -> résolution sémantique -> adaptateur de présentation -> Animation / FX -> Renderer`

Interdictions :

- Animation Core ne modifie jamais énergie, portée, distance ou résultat d'une compétence ;
- FX Core ne décide jamais d'un hit, blocage, renvoi, immunité ou contre ;
- Demo UI ne recalcule jamais les coûts ou la portée à la place de Combat Rules ;
- Combat Rules n'importe jamais Animation Core, FX Core, renderer, UI ou assets ;
- une valeur de gameplay réglable provient d'un contrat ou d'une donnée explicite, pas d'un nombre magique dans l'UI.

L'état courant du combat appartient à un propriétaire unique : Combat Session / Combat State.


## 31. Roster de combat

Lorsqu'un prototype manipule plusieurs créatures par équipe :

- le roster actif/réserve possède un propriétaire unique : `Roster Session` ;
- l'UI ne remplace jamais directement les stats d'un fighter ;
- Rappel/Invocation passent par une résolution sémantique de commande puis par le Roster Session ;
- les snapshots PV/énergie d'un membre rappelé sont persistés par le Roster Session ;
- le Combat Session continue de ne connaître que les slots actuellement engagés ;
- le contrôleur visuel ne décide que quel asset/profil afficher pour le slot reçu.

Chaîne autorisée :

`Command Runtime -> command-complete -> Roster Session -> Combat Session slot -> Visual Controller`


## 32. Accès GitHub depuis ChatGPT — vérification obligatoire avant refus

Dans les fils de travail GenSrpG / Laboratoire où le connecteur GitHub est disponible, l'assistant doit considérer GitHub comme accessible jusqu'à preuve contraire.

Procédure obligatoire avant d'affirmer qu'un dépôt ou une branche est inaccessible :

1. chercher les outils GitHub disponibles via `functions.exec` / `ALL_TOOLS` ;
2. rechercher en priorité les outils dont le nom commence par `mcp__GitHub__` ;
3. tenter réellement une lecture du dépôt ou de la branche demandée ;
4. si l'opération échoue, rapporter l'outil utilisé et l'erreur exacte ;
5. ne jamais demander un ZIP, une manipulation GitHub manuelle ou prétendre que GitHub est indisponible sans cette tentative préalable.

Cette règle ne remplace pas les règles de sécurité des branches : l'accès technique au dépôt n'autorise pas à modifier `main` sans validation prévue par la présente charte.


## 33. Intégration durable des presets créatures et capacités exportés par l’éditeur

Cette procédure est obligatoire pour toute future créature ou capacité préparée dans l’éditeur puis fournie pour intégration à la vitrine Capture.

### 33.1. L’export de l’éditeur est la donnée de référence

Pour une créature, le fichier de transfert exporté par l’éditeur est la source de vérité de sa configuration :

- `draft` ;
- `statValues` ;
- `loadout` ;
- identité ;
- niveau ;
- éléments et résistances ;
- profil de mouvement ;
- scale et positionnement ;
- assets face / dos / icône ;
- sockets et coordonnées face / dos ;
- audio ;
- capacités liées.

Pour une capacité, l’export de l’éditeur est également la source de vérité de sa définition, de ses effets, de sa présentation et de ses paramètres configurés.

L’intégration ne doit pas « améliorer », deviner, inverser, recalculer ou remplacer silencieusement une valeur fournie par l’export. Toute correction volontaire des données elles-mêmes doit être justifiée par un retour utilisateur explicite ou par un contrat démontrant que l’export est invalide.

### 33.2. Une seule autorité active

Les fiches configurées actives restent possédées par les propriétaires existants :

- `configuredCreatures` pour les créatures ;
- `configuredSkills` pour les capacités.

Il est interdit de créer une seconde fiche parallèle, un mock concurrent, un fallback ou une copie spéciale destinée uniquement à la vitrine.

Une créature ou capacité existante est remplacée par son identifiant stable. Elle ne doit jamais être dupliquée sous un autre enregistrement pour contourner un conflit.

### 33.3. Préserver toute la configuration, y compris ce qui n’est pas encore actif en combat

Le preset doit conserver intégralement la configuration enregistrée.

En particulier :

- les quatre slots de loadout peuvent rester configurés même si la progression n’en active qu’une partie au niveau courant ;
- une capacité dont le niveau requis est supérieur au niveau actuel reste enregistrée dans le loadout ;
- le filtrage de progression appartient au chemin runtime et ne doit jamais effacer ou réécrire le preset sauvegardé ;
- les sockets non utilisés par une capacité précise restent conservés ;
- les paramètres visuels et audio non utilisés dans un test donné restent conservés.

### 33.4. Sockets : coordonnées exactes, aucune compensation UI

Les coordonnées `front` et `back` d’un socket doivent être conservées exactement telles qu’exportées.

Le renderer / éditeur doit afficher le point correspondant au socket actuellement sélectionné et à la vue demandée.

Interdits :

- inverser `front` / `back` pour compenser un affichage incorrect ;
- déplacer un socket dans les données pour masquer une erreur de renderer ;
- afficher arbitrairement le dernier socket d’une fiche ;
- introduire une règle spéciale fondée sur le nom de la créature.

Si un socket paraît faux alors que la donnée source est correcte, le chemin d’affichage doit être diagnostiqué avant toute modification de la donnée.

### 33.5. Rechargement complet après import ou remplacement

Lorsqu’un preset remplace une fiche déjà présente, notamment une fiche statique de démarrage, l’éditeur doit recharger la fiche complète depuis son propriétaire actif.

Le rechargement doit couvrir au minimum :

- identité ;
- stats ;
- résistances ;
- visuels ;
- profil ;
- scale ;
- sockets ;
- audio ;
- loadout.

Un rafraîchissement partiel des seules stats ou du seul sélecteur est insuffisant.

### 33.6. Le test Combat doit utiliser la vraie fiche configurée

Lorsqu’une option de test correspond à une créature configurée, le raccord doit être explicite par identifiant stable et le test Combat doit consommer la fiche réelle depuis `configuredCreatures`.

Le mock de preview historique n’est autorisé que pour une créature qui ne possède pas encore de vraie fiche configurée.

Il ne doit jamais reprendre autorité sur une créature vitrine existante.

Aucune détection par nom de créature n’est autorisée.

### 33.7. Capacités liées et loadout

Les identifiants de capacités d’un preset doivent être résolus depuis `configuredSkills`.

L’intégration ne doit pas recréer localement une seconde version d’une capacité déjà présente.

Lorsqu’une capacité exportée est ajoutée ou remplacée :

- elle conserve son identifiant stable ;
- elle est ajoutée / remplacée dans `configuredSkills` ;
- les créatures qui la référencent continuent de la référencer par cet identifiant ;
- aucune duplication de capacité n’est créée pour satisfaire un preset particulier.

### 33.8. Procédure de vérification obligatoire

Avant de déclarer l’intégration technique GREEN :

1. auditer les identifiants créature / capacité et les collisions éventuelles ;
2. vérifier la disponibilité des assets et capacités référencés ;
3. écrire un test RED reproduisant le raccord à créer ou la régression constatée ;
4. intégrer par les propriétaires existants, sans nouvelle autorité ;
5. tester les valeurs importantes du preset : ID, sockets, profil, scale, stats, résistances, loadout et capacités liées ;
6. tester le rechargement réel dans l’éditeur après import / remplacement ;
7. tester le chemin Combat utilisant la vraie fiche configurée lorsqu’elle existe ;
8. exécuter la CI complète ;
9. publier une preview dédiée lorsque l’UI est concernée ;
10. obtenir une validation smartphone utilisateur avant de déclarer GREEN utilisateur.

Cette procédure est la référence pour les futures créatures et capacités de vitrine Capture, notamment celles créées par Sylvain dans l’éditeur puis transmises pour intégration.


### 33.9. Les sélecteurs de l’éditeur doivent lire le propriétaire actif

Cette règle complète les sections 33.2, 33.5 et 33.7 après la régression constatée lors de l’intégration d’une capacité exportée.

Lorsqu’une bibliothèque active existe dans l’éditeur :

- le sélecteur des créatures modifiables doit être dérivé de `configuredCreatures` ;
- le sélecteur des capacités modifiables doit être dérivé de `configuredSkills` ;
- sélectionner une entrée doit recharger la fiche complète depuis ce même propriétaire actif.

Un catalogue legacy, un catalogue natif de démarrage, un template de migration ou une liste statique peut servir à **initialiser** ou **migrer** une fiche, mais il ne doit jamais rester la source du sélecteur de modification une fois la fiche présente dans le propriétaire actif.

En particulier, après un import ou un remplacement par ID stable :

- le sélecteur doit être rafraîchi depuis le propriétaire actif ;
- la sélection doit restituer la version remplacée, pas le template historique portant le même ID ;
- une capacité native/laboratoire présente dans `configuredSkills` doit rester visible même si elle n’existe pas dans un catalogue legacy ;
- aucun merge avec un ancien template ne doit intervenir lors d’un simple changement de sélection.

Interdits :

- remplir le sélecteur actif directement depuis un catalogue legacy alors que `configuredSkills` ou `configuredCreatures` existe ;
- recharger une fiche depuis une autre source que celle qui possède réellement son état actif ;
- masquer une capacité active parce qu’elle n’existe pas dans une liste historique ;
- réintroduire silencieusement une ancienne version d’une fiche après remplacement ;
- maintenir deux chemins de lecture concurrents pour la même fiche selon qu’elle vient d’un preset, d’un catalogue natif ou d’un import utilisateur.

### 33.10. Sentinelles obligatoires après remplacement d’une fiche

Pour toute future intégration d’une créature ou capacité exportée qui remplace un ID existant, les tests doivent vérifier au minimum :

1. l’ID existe une seule fois dans le propriétaire actif ;
2. le sélecteur de l’éditeur expose cet ID depuis le propriétaire actif ;
3. sélectionner cet ID recharge exactement la fiche active complète ;
4. les valeurs spécifiques apportées par l’export remplacent bien les anciennes valeurs portant le même ID ;
5. une autre fiche native connue du même sélecteur reste accessible afin de détecter une liste devenue partielle ;
6. un aller-retour `fiche active -> champs éditeur -> draft normalisé` ne réintroduit pas l’ancien template ni ne perd les champs représentés ;
7. après import/remplacement, le sélecteur est rafraîchi avant toute validation UI.

Si un test montre que les données sont correctes dans le propriétaire actif mais fausses dans l’éditeur, la correction doit viser le chemin de **lecture/rechargement UI**, et non modifier les données pour compenser l’affichage.
