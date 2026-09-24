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
- distance et énergie de combat : Combat Rules Lab ;
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

## 14. Découpage des assets

Structure cible :

```
assets/
  test/
    creatures/
    arenas/
    effects/
```

Les assets de test servent au laboratoire et ne sont pas des assets GenSrpG officiels.

Le dépôt ne doit jamais dépendre d'un chemin situé dans `Zombicide-40k`.

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
