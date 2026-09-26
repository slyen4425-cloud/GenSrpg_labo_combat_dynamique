# Laboratoire Combat Dynamique — Current Work

Ce fichier est le point de reprise opérationnel du laboratoire.

## État global

Date : 2026-09-25

Phase active : Phase 2B/V9 — Contrôleur adverse linéaire et combat autonome de test.

Le dépôt est autonome et ne possède aucune dépendance à GenSrpG.

## Fondation validée

Dépôt :

`slyen4425-cloud/GenSrpg_labo_combat_dynamique`

Branche stable :

`main`

SHA GREEN de fondation :

`3197388f2b3ee7491be6e6125a015315158cffa2`

Checkpoint GREEN :

`checkpoint/lab-foundation-green-2026-09-24`

CI :

- workflow : `Laboratory CI`
- run : `36043623014`
- conclusion : SUCCESS

## Documents obligatoires de reprise

Lire dans cet ordre :

1. `docs/LAB_CHARTE.md`
2. `docs/LAB_ROADMAP.md`
3. `docs/LAB_CURRENT_WORK.md`
4. `docs/LAB_ARCHITECTURE.md`
5. `docs/LAB_CHECKPOINT_POLICY.md`

Puis vérifier les branches, SHA et CI réels sur GitHub.

## Chantier précédent terminé

Nom :

`mono-image-animation-core`

Checkpoint de départ :

`checkpoint/lab-start-mono-image-animation-core-2026-09-24`

SHA de base :

`3197388f2b3ee7491be6e6125a015315158cffa2`

Branche de travail :

`work/lab-mono-image-animation-core-2026-09-24`

### Résultat

Le laboratoire possède maintenant :

- contrat `CombatVisualEvent` ;
- contrat `VisualActor` ;
- contrat `AnimationPlan` ;
- planner pur V1 ;
- animations planifiées : `idle`, `attack`, `hit`, `ko` ;
- orientation gauche/droite pilotée par l'acteur ;
- profils de données `serpentine` et `drake` ;
- registre de profils ;
- métadonnées Maraileron et Braisombre ;
- format standard des assets de créature ;
- spécification `LAB_CONTRACTS_V1.md` ;
- sentinelles CI renforcées.

Aucune logique DOM, Canvas, gameplay Capture ou dépendance GenSrpG n'est entrée dans le Core.

### SHA validé avant clôture documentaire

`a31d505496f5cb706d5c1ff74389e40f22af1cef`

### CI correspondante

- run : `36047308553`
- conclusion : SUCCESS

## Assets utilisateur reçus

Deux planches de test ont été fournies :

- Maraileron — profil `serpentine` ;
- Braisombre — profil `drake`.

Convention validée :

- vue adversaire : 3/4 face ;
- vue joueur : 3/4 dos ;
- icône : portrait ;
- deux vues recommandées, mais une seule image devra rester suffisante pour une créature utilisateur.

Les chemins cibles sont déjà réservés dans les métadonnées :

`assets/test/creatures/maraileron/maraileron_opponent.png`
`assets/test/creatures/maraileron/maraileron_player.png`
`assets/test/creatures/maraileron/maraileron_icon.png`

`assets/test/creatures/braisombre/braisombre_opponent.png`
`assets/test/creatures/braisombre/braisombre_player.png`
`assets/test/creatures/braisombre/braisombre_icon.png`

Le raccord binaire des PNG est un lot asset séparé : il ne doit pas contaminer le Core.

## Checkpoint GREEN créé

`checkpoint/lab-mono-image-animation-core-green-2026-09-24`

SHA GREEN :

`120d0b2eaa311572867ad2f7955edc14c2ae0786`

CI : SUCCESS

## Chantier courant

Nom :

`dom-renderer-demo-v1`

Objectif :

Créer un premier adaptateur DOM/CSS et une démo autonome permettant de jouer les plans V1 sans déplacer la logique d'animation dans l'UI.

Checkpoint de départ :

`checkpoint/lab-start-dom-renderer-demo-v1-2026-09-24`

SHA de base :

`120d0b2eaa311572867ad2f7955edc14c2ae0786`

Branche de travail :

`work/lab-dom-renderer-demo-v1-2026-09-24`

## Périmètre du prochain chantier

Autorisé :

- adaptateur DOM/CSS ;
- conversion `AnimationPlan -> keyframes` ;
- montage/démontage propre d'un acteur ;
- annulation/restauration ;
- interface de laboratoire minimale ;
- chargement de PNG utilisateur ;
- test visuel Maraileron/Braisombre dès que les assets sont disponibles.

Protégé / hors périmètre :

- dépôt `Zombicide-40k` ;
- intégration GenSrpG ;
- règles de dégâts ;
- tour par tour ;
- sauvegardes ;
- FX avancés ;
- caméra avancée ;
- Canvas/WebGL ;
- framework lourd.

## Tests prévus

- plan -> keyframes ;
- restauration après animation ;
- annulation sans état résiduel ;
- aucun calcul gameplay dans le renderer ;
- aucune dépendance GenSrpG ;
- interface utilisable sur mobile.

## État du chantier DOM renderer V1

Implémentation présente :

- adaptateur pur `AnimationPlan -> DOM timeline` ;
- composition état de base + transformation transitoire ;
- runtime DOM d'acteur à propriétaire unique ;
- annulation/restauration propre ;
- prise en charge explicite de `Animation.finished` / `AbortError` ;
- Asset Input avec validation PNG/WebP/JPEG et révocation Object URL ;
- démo navigateur autonome mobile-first ;
- configuration initiale Maraileron joueur / Braisombre adversaire ;
- contrôles : Idle, Attaque, Hit, KO, Stop ;
- intensité configurable ;
- documentation `LAB_RENDERER_V1.md` ;
- sentinelles de frontières renforcées.

SHA d'implémentation structurelle validé :

`dce3f648875627e116ae66d005691f04572d82fa`

CI :

- run : `36049398880`
- conclusion : SUCCESS

### Incident CI traité

Une première CI rouge a détecté un rejet asynchrone `AbortError` lors de l'annulation d'un idle en boucle.

Cause démontrée : le renderer ne consommait pas `animation.finished` pour les animations infinies.

Correction : l'observation et la résolution de l'annulation appartiennent désormais au renderer pour toutes les animations. Aucun contournement n'a été ajouté dans l'UI ou dans le test.

### Validation restante

Le chantier n'est pas encore GREEN final.

Obligatoire avant clôture :

- test manuel smartphone ;
- validation ergonomique des contrôles ;
- validation visuelle Idle / Attaque / Hit / KO ;
- vérification de l'absence d'état résiduel après Stop ou changement d'animation.

### Assets

Les planches Maraileron et Braisombre sont reçues.

Le découpage/raccord binaire reste un lot asset séparé. La démo actuelle accepte les images depuis l'appareil afin que le renderer reste testable sans couplage asset.

Checkpoint intermédiaire créé :

`checkpoint/lab-dom-renderer-demo-v1-preaudit-green-2026-09-24`

SHA de l'état pré-audit validé :

`cef6bf75919f2fc68e24a47ee02670a6e151ff45`

CI :

- run : `36049457429`
- conclusion : SUCCESS

Branche de prévisualisation :

`preview/lab-dom-renderer-demo-v1-2026-09-24`

Cette prévisualisation reste hors `main` et doit servir au test manuel smartphone avant GREEN final.


## Correction de périmètre — assets de test fournis par l'utilisateur

Le lien de prévisualisation précédent demandait de charger manuellement les images depuis le téléphone.

Ce comportement ne correspond pas au flux validé pour les deux créatures de laboratoire déjà fournies.

Décision :

- Maraileron et Braisombre doivent être découpés depuis les planches fournies ;
- leurs vues `player`, `opponent` et `icon` doivent être préparées comme assets du laboratoire ;
- la démo doit charger automatiquement les assets de laboratoire par défaut ;
- le sélecteur de fichier reste autorisé uniquement comme fonction optionnelle future pour tester une créature utilisateur externe ;
- aucun test utilisateur final du renderer ne doit être demandé tant que ces assets par défaut ne sont pas raccordés.

La prévisualisation actuelle est donc considérée comme **pré-audit technique uniquement**, pas comme version de validation utilisateur.

## Raccord assets runtime par défaut — GREEN technique

Les deux créatures de laboratoire sont désormais présentes directement dans le dépôt et chargées automatiquement par la démo :

- Maraileron côté joueur : `maraileron_player_preview.webp` ;
- Braisombre côté adversaire : `braisombre_opponent_preview.webp`.

L'import utilisateur reste disponible uniquement comme remplacement optionnel.

SHA validé :

`51a7dd14cade5b46b6e44886060e77d4865e47a1`

CI :

- run : `36052841899`
- conclusion : SUCCESS

La validation utilisateur mobile reste nécessaire avant de déclarer le chantier GREEN final.

## Checkpoint assets intégrés

Checkpoint intermédiaire GREEN créé :

`checkpoint/lab-dom-renderer-demo-v1-bundled-assets-green-2026-09-24`

SHA :

`2030deaa09d272d2d954f5cfd8972e779a2c09cc`

CI :

- run : `36052895496`
- conclusion : SUCCESS

La branche de prévisualisation pointe sur ce même SHA.

Le chantier reste en attente de validation utilisateur smartphone avant GREEN final.


## Pack runtime complet — GREEN technique

Le pack runtime léger est désormais complet pour les deux créatures de laboratoire.

Maraileron :

- `runtime/maraileron_player.webp`
- `runtime/maraileron_opponent.webp`
- `runtime/maraileron_icon.webp`

Braisombre :

- `runtime/braisombre_player.webp`
- `runtime/braisombre_opponent.webp`
- `runtime/braisombre_icon.webp`

Caractéristiques runtime :

- vues combat : 320×320 WebP transparent ;
- icônes : 192×192 WebP transparent ;
- les PNG 1024×1024 / 384×384 restent les sources maîtres hors runtime léger.

Les métadonnées `runtimePreview` pointent désormais uniquement vers ce pack `runtime/`.

Les deux anciens fichiers `*_preview.webp` ont été supprimés après bascule afin d'éviter deux sources runtime concurrentes.

SHA validé après nettoyage :

`ad92ca81a41731680ea477b70eb67a92d33162a3`

CI :

- run : `36053453627`
- conclusion : SUCCESS

Checkpoint runtime créé :

`checkpoint/lab-dom-renderer-demo-v1-runtime-pack-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-dom-renderer-demo-v1-2026-09-24`

Ces deux refs doivent pointer sur le SHA final documenté après CI du présent fichier.

Le chantier reste en attente du test utilisateur mobile avant GREEN final.


## Sous-lot actif — idle/scale polish

Base :

`0d435a14c7913718fdb246df4836635f4626eb59`

Checkpoint départ :

`checkpoint/lab-start-idle-scale-polish-2026-09-24`

Objectif :

- rendre la créature joueur plus grande que l'adversaire via les métadonnées de vue ;
- rendre l'idle Maraileron majoritairement vertical ;
- réduire fortement l'amplitude idle Braisombre ;
- ancrer Braisombre plus bas pour stabiliser visuellement les pieds ;
- ne pas modifier le comportement KO dans ce lot.

Propriétaires autorisés :

- metadata créature : échelle de vue + ancrage ;
- Creature Profile : amplitudes/timing idle ;
- VisualActor : contrat d'ancrage ;
- Render Adapter : application de l'ancrage.

Interdits :

- aucune règle spécifique dans le CSS de la démo ;
- aucune animation calculée dans l'UI ;
- aucun second moteur ou fallback concurrent ;
- aucun changement GenSrpG/Zombicide-40k.

Tests :

- joueur > adversaire ;
- idle serpentine vertical dominant ;
- idle drake amplitude réduite ;
- transformOrigin normalisé et appliqué par le renderer ;
- sentinelles existantes intactes.


## Résultat sous-lot idle/scale polish — GREEN technique

Corrections validées :

- créature joueur plus grande que la vue adversaire via `displayScale` des métadonnées ;
- Maraileron : idle majoritairement vertical, dérive latérale et rotation réduites ;
- Braisombre : idle fortement réduit, sans dérive horizontale ;
- Braisombre : respiration légère par déformation autour d'un ancrage bas `50% 88%` afin de stabiliser visuellement les pieds ;
- `VisualActor` possède désormais explicitement `transformOrigin` ;
- le Render Adapter applique seul cet ancrage ;
- les amplitudes de scale idle sont pilotées par le profil, plus par une constante cachée du planner ;
- comportement KO inchangé dans ce lot.

Incident de test rencontré :

- un plan orienté gauche produisait `-0` quand `swayX = 0` ;
- la cause a été corrigée dans le Core par normalisation des transformations dirigées à zéro ;
- aucun contournement UI/CSS/test n'a été ajouté.


Checkpoint GREEN du sous-lot :

`checkpoint/lab-idle-scale-polish-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-dom-renderer-demo-v1-2026-09-24`

SHA fonctionnel avant documentation finale :

`f49ac04b4bff8d9ce8c75e9438027b61249c227f`

CI :

- run : `36055509771`
- conclusion : SUCCESS


## Chantier actif — combat-distance-skills-v1

Base :

`4f6ec4dcdee52dd953c2e07a6b4f97afa6d4f396`

Checkpoint départ :

`checkpoint/lab-start-combat-distance-skills-v1-2026-09-24`

Branche :

`work/lab-combat-distance-skills-v1-2026-09-24`

Objectif :

Construire un petit moteur de test indépendant pour valider les décisions de gameplay suivantes avant toute intégration GenSrpG :

- trois bandes de distance : `short`, `medium`, `long` ;
- déplacement libre entre bandes tant que l'énergie disponible suffit ;
- coût de déplacement configurable par créature et par palier traversé ;
- énergie partagée entre mouvement et capacités ;
- compétences configurables avec catégorie fonctionnelle, forme d'action et élément indépendants ;
- coût énergie, préparation, temps de trajet, récupération et portée configurables ;
- défenses pouvant bloquer/renvoyer une forme d'action (ex. projectile) ;
- immunités pouvant cibler un élément (ex. feu) ;
- contres pouvant cibler une ou plusieurs formes d'action ;
- le moteur de combat décide du résultat ; le moteur visuel ne fait qu'afficher les événements décidés.

Architecture / propriétaires :

- `src/contracts/skill-definition.js` : contrat de compétence ;
- `src/core/combat/distance.js` : bandes et coût de déplacement ;
- `src/core/combat/combat-state.js` : état énergie/distance ;
- `src/core/combat/action-resolver.js` : validation et résolution pure des actions ;
- `data/combat/` : configurations de test modifiables ;
- `src/ui/combat-test-ui.js` : adaptateur UI du prototype, sans autorité de règles ;
- Animation Core / Render Adapter existants : uniquement événements visuels résultants ;
- FX minimal : plan visuel dérivé des événements résolus, rendu par un adaptateur DOM dédié, sans aucune autorité sur les règles.

Périmètre V1 du test :

- Maraileron : coût déplacement 1 énergie/palier ;
- Braisombre : coût déplacement 3 énergie/palier ;
- trois capacités de démonstration minimum :
  - projectile Feu offensif ;
  - défense contre projectile avec possibilité de renvoi ;
  - immunité Feu ;
- déplacement Courte/Moyenne/Longue directement testable sur mobile ;
- journal expliquant coût, refus, blocage, renvoi ou immunité.

Hors périmètre :

- IA de combat ;
- dégâts complets/statistiques finales ;
- sauvegarde GenSrpG ;
- intégration `Zombicide-40k` ;
- réseau ;
- éditeur complet de compétences ;
- FX avancés (particules, caméra, bibliothèque d'effets) ;
- seul un projectile générique minimal piloté par `skill-release` est autorisé dans ce lot pour valider visuellement la chronologie.

Contraintes :

- aucune règle distance/énergie dans le DOM ou le CSS ;
- aucune animation ne décide si une action touche ;
- aucune valeur gameplay importante codée dans un gestionnaire de bouton ;
- une seule autorité de résolution : `action-resolver` ;
- toutes les valeurs de test proviennent de données configurables.

Tests prévus :

- coût de déplacement par nombre de paliers ;
- refus si énergie insuffisante ;
- portée de compétence ;
- séparation catégorie / forme / élément ;
- blocage projectile sans immunité élémentaire ;
- immunité Feu indépendamment de la forme ;
- renvoi projectile ;
- UI sans logique de résolution ;
- vraie chaîne données -> resolver -> UI/adaptateur visuel.


## État technique du chantier combat-distance-skills-v1

Implémentation présente :

- contrat `SkillDefinition` séparant catégorie / forme / élément ;
- Combat State immutable ;
- Combat Session propriétaire unique de l'état courant ;
- bandes de distance `short / medium / long` ;
- coût de déplacement par palier et par créature ;
- énergie commune aux déplacements et capacités ;
- preview de mouvement/capacité sans effet de bord ;
- résolution de portée et énergie ;
- préparation / release / trajet / impact / récupération ;
- préparation propre des réactions ;
- contre pouvant annuler une attaque avant son release ;
- renvoi de projectile ;
- immunité élémentaire ;
- contre par forme d'action ;
- projectile générique minimal dérivé de la timeline résolue ;
- Presenter séparé reliant résolution -> événements visuels ;
- interface mobile avec jauges énergie, distance, déplacement, capacités, réaction et journal ;
- outils d'animation bruts conservés dans un panneau laboratoire séparé.

Données de test :

- Maraileron : 1 énergie par palier, régénération 8/s ;
- Braisombre : 3 énergie par palier, régénération 6/s ;
- Boule de feu : Offensive / Projectile / Feu ;
- Griffe : Offensive / Contact ;
- Bouclier miroir : renvoi Projectile ;
- Immunité feu : immunité Feu ;
- Riposte : contre Contact.

Frontières protégées :

- Combat Rules n'importe aucun moteur animation/FX/renderer/UI ;
- Animation Core ne connaît pas distance, énergie ou résultat de compétence ;
- Demo UI ne calcule pas coût, portée ou résultat ;
- le projectile n'influence jamais la résolution.

Dernier HEAD technique avant documentation de gouvernance :

`138acc941506a021a9f4a7cff5ba03caad71a522`

CI de ce HEAD :

- run : `36060087396`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN technique :

`checkpoint/lab-combat-distance-skills-v1-preaudit-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-combat-distance-skills-v1-2026-09-24`

SHA pré-audit :

`f864f25057c7c850aadb8bf0d8fc0c2f193f214e`

CI :

- run : `36060350286`
- conclusion : SUCCESS

Validation restante avant GREEN final :

- test smartphone de l'interface ;
- validation utilisateur de l'intuitivité des trois distances ;
- validation visuelle Boule de feu -> hit ;
- Boule de feu -> Bouclier miroir -> renvoi ;
- Boule de feu -> Immunité feu ;
- Griffe -> Riposte -> interruption avant release ;
- vérification que les coûts de déplacement sont compréhensibles pour Maraileron et Braisombre.

Le chantier ne doit pas être déclaré GREEN final avant ce retour utilisateur.


## Chantier actif — combat-timing-ui-v2

Base GREEN de reprise :

`8dd435f5f1ed8744b2ee545d4d5e1d724f13e116`

Checkpoint départ :

`checkpoint/lab-start-combat-timing-ui-v2-2026-09-24`

Branche :

`work/lab-combat-timing-ui-v2-2026-09-24`

Retour utilisateur à corriger :

- les deux créatures doivent être en `idle` par défaut et y revenir après toute action ;
- un changement Courte / Moyenne / Longue modifie la distance logique, mais visuellement seul le combattant qui se déplace change de position ;
- augmenter l'écart visuel entre les combattants ;
- supprimer le HUD distance superposé à l'arène ;
- conserver l'arène et les capacités visibles simultanément pour permettre le timing ;
- chaque capacité doit afficher une barre de préparation visible ;
- l'énergie démarre à 0 et se recharge automatiquement par ticks configurables, exemple +1 toutes les 2 secondes ;
- la recharge d'énergie et tous ses paramètres restent configurables ;
- chaque créature possède un modificateur permanent de temps de charge en pourcentage ;
- valeur positive = temps de charge plus long ; valeur négative = temps de charge réduit ;
- des effets temporaires doivent pouvoir ajouter un modificateur de charge pendant une durée, par exemple -20 % pendant 5 secondes ;
- le système doit pouvoir accueillir plus tard un timer de combat configuré sans coupler celui-ci à l'UI.

Architecture / propriétaires V2 :

- `Combat State` : énergie, temps écoulé, progression des ticks et modificateurs temporaires ;
- `Combat Timing` : calcul pur des ticks d'énergie et des temps de préparation effectifs ;
- `Combat Session` : propriétaire unique de l'état courant ;
- `Action Runtime` : horloge d'une capacité en cours, progression de charge, fenêtre de réaction et résolution ;
- `Distance Presenter` : position visuelle individuelle des combattants, sans modifier la règle de distance ;
- `Demo Visual Controller` : idle par défaut et retour à idle ;
- `Combat Test UI` : affichage uniquement, aucune formule gameplay.

Contraintes :

- aucun `setInterval` sans propriétaire et `dispose()` explicite ;
- aucune régénération d'énergie calculée dans l'UI ;
- aucune durée effective calculée dans l'UI ;
- aucun déplacement simultané des deux sprites pour représenter une action d'un seul combattant ;
- aucun CSS basé sur la distance logique qui déplace automatiquement les deux combattants ;
- Animation Core ne devient pas horloge de combat ;
- le runtime de combat ne calcule aucune animation ;
- tous les paramètres restent pilotés par les données.

Tests V2 :

- énergie initiale 0 ;
- tick +1/2000 ms configurable ;
- accumulation déterministe des ticks ;
- modificateur permanent +X/-X % du temps de préparation ;
- modificateur temporaire avec expiration ;
- résolution utilisant le temps de préparation effectif ;
- runtime de charge annulable et nettoyable ;
- seul le combattant ayant bougé reçoit un changement de position visuelle ;
- idle lancé par défaut et restauré après action ;
- interface mobile sans HUD distance superposé ;
- arène + capacités visibles ensemble ;
- barre de charge présente pour chaque capacité.


## État technique — combat-timing-ui-v2

Corrections implémentées :

- les deux créatures démarrent en idle et reviennent en idle après une animation transitoire ;
- le déplacement logique reste Courte / Moyenne / Longue ;
- le Render Adapter de distance déplace uniquement le combattant qui effectue l'action ;
- l'écart visuel initial entre les combattants a été augmenté ;
- le HUD distance superposé à l'arène a été supprimé ;
- l'arène, les jauges, le déplacement et les capacités sont réunis dans un écran combat compact ;
- chaque capacité offensive et chaque réaction possède une barre de charge visible ;
- l'énergie démarre à 0 ;
- données de test : +1 énergie toutes les 2 secondes, réserve maximale 10 ;
- Maraileron : 1 énergie par palier ;
- Braisombre : 3 énergies par palier ;
- Boule de feu coûte 3, Griffe 2, réactions 2 ;
- Combat Runtime propriétaire unique du temps actif, avec timer nettoyé par `dispose()` ;
- les ticks d'énergie sont déterministes et conservent la progression partielle ;
- `chargeTimeModifierPct` est configurable par créature ;
- +X % augmente le temps de préparation, -X % le réduit ;
- les effets temporaires de temps de charge sont pris en charge avec expiration ;
- le calcul de temps effectif appartient à `Combat Timing`, jamais à l'UI ;
- les réactions peuvent maintenant être déclenchées pendant l'action en cours ;
- un contre assez rapide peut toujours interrompre avant release ;
- le Presenter sépare désormais release visuel et résultat final pour suivre le runtime réel.

Réglages de rythme du test :

- Boule de feu : charge 1,8 s + trajet 0,7 s ;
- Griffe : charge 1,2 s ;
- Bouclier miroir : réaction 0,5 s ;
- Immunité feu : réaction 0,3 s ;
- Riposte : réaction 0,4 s.

Ces valeurs sont des données de laboratoire et ne constituent pas des constantes GenSrpG.

Sentinelles ajoutées :

- énergie initiale zéro ;
- tick configurable +1 / 2000 ms ;
- modificateur permanent +X/-X % ;
- modificateur temporaire + expiration ;
- runtime réel + nettoyage timer ;
- contre live avant release ;
- un seul sprite déplacé ;
- idle par défaut ;
- absence de sélecteur HUD distance superposé ;
- arène + capacités dans le même écran ;
- barre de charge sur toutes les capacités.

Dernier HEAD fonctionnel avant clôture documentaire :

`f561f4cd7fc97e10ca79860cf5d47be1e945e3e3`

CI :

- run : `36063415254`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN V2 :

`checkpoint/lab-combat-timing-ui-v2-preaudit-green-2026-09-24`

Branche de prévisualisation V2 :

`preview/lab-combat-timing-ui-v2-2026-09-24`

SHA pré-audit avant synchronisation finale du présent document :

`a987040b38b4e12b8a68e66e9288c910cb639657`

CI :

- run : `36063563535`
- conclusion : SUCCESS

Validation restante :

- test smartphone réel de la compacité de l'écran ;
- vérifier que l'arène reste visible pendant toute décision ;
- vérifier le ressenti du +1 énergie / 2 s ;
- vérifier le déplacement individuel Maraileron puis Braisombre ;
- vérifier les barres de charge offensive et réaction ;
- vérifier Boule de feu / renvoi / immunité ;
- vérifier Griffe / Riposte.

Le chantier reste pré-audit jusqu'au retour utilisateur.


## Sous-lot actif — combat-visibility-chargebar-polish-v2

Base :

`f0cda9e5b68d9f4208e76ee43de435cfe6281f59`

Checkpoint départ :

`checkpoint/lab-start-combat-visibility-chargebar-polish-v2-2026-09-24`

Branche :

`work/lab-combat-visibility-chargebar-polish-v2-2026-09-24`

Objectif :

- éviter que les créatures sortent visuellement de l'arène à longue portée ;
- réduire légèrement leur taille générale à l'écran ;
- permettre au Render Adapter de distance d'ajuster aussi légèrement le scale visuel selon Courte / Moyenne / Longue, sans modifier le scale métier de l'acteur ;
- déplacer les réglages de laboratoire et le choix de la créature à déplacer hors de la zone principale de combat ;
- garder l'interface principale proche du rendu réel joueur ;
- afficher une barre de charge principale sous le nom de la créature qui lance une capacité ;
- cette barre doit suivre exclusivement la progression fournie par Combat Runtime ;
- au clic Boule de feu : barre 0 -> 100 % pendant la préparation, puis disparition/reset au release ;
- même principe pour une réaction de Braisombre.

Propriétaires autorisés :

- `DOM Distance Presenter` : position et scale de scène selon distance ;
- `Demo UI` : emplacement des contrôles de test et affichage de progression ;
- `Demo CSS/HTML` : composition visuelle ;
- `Combat Runtime` reste source unique de progression.

Interdits :

- aucune durée de charge codée en CSS/HTML ;
- aucune seconde barre avec sa propre horloge ;
- aucune modification du calcul de coût/portée ;
- aucun déplacement simultané automatique des deux combattants ;
- aucun changement dans Animation Core pour compenser un problème de layout ;
- aucun changement GenSrpG principal.

Tests :

- long reste dans les bornes visuelles ;
- seul le combattant déplacé change position/scale ;
- scale court > moyen > long de façon légère et déclarative ;
- aucun contrôle de test principal superposé à l'arène ;
- barre de charge principale présente sous chaque nom ;
- barre alimentée par `progress.chargeProgress` / réaction runtime ;
- reset de la barre après release/résolution/reset ;
- CI et sentinelles existantes vertes.

Critère de fin :

pré-audit GREEN technique + test smartphone utilisateur.


## Résultat technique — combat-visibility-chargebar-polish-v2

Corrections présentes :

- taille visuelle générale légèrement réduite ;
- positions de longue portée bornées entre 14 % et 86 % du centre de l'arène ;
- projection visuelle distance centralisée dans `DOM Distance Presenter` ;
- scale de scène : Courte 1,00 / Moyenne 0,96 / Longue 0,90 ;
- seul le combattant qui paie le déplacement change de position et de scale ;
- positions reset : joueur 23 % / adversaire 77 % ;
- sélecteur de créature à déplacer sorti de l'interface principale ;
- reset sorti de l'interface principale ;
- ces contrôles sont regroupés plus bas dans `Réglages du test` ;
- arène, énergie, déplacement et capacités restent dans l'écran principal ;
- nouvelle barre de charge principale sous le nom de Maraileron ;
- nouvelle barre de réaction principale sous le nom de Braisombre ;
- ces barres consomment uniquement `Combat Runtime progress` ;
- aucune horloge CSS ou UI parallèle n'a été créée ;
- la barre Maraileron se remplit pendant la préparation puis se remet à zéro au release ;
- la barre Braisombre reflète la préparation de la réaction ;
- reset/résolution nettoient toutes les barres ;
- Boule de feu réglée à 2000 ms de préparation pour le test demandé.

Tests ajoutés / renforcés :

- long reste dans les bornes de scène ;
- scale court > moyen > long avec amplitude légère ;
- combattant stationnaire conserve position et scale ;
- réglages de test situés après le dock principal ;
- barres principales sous les noms présentes ;
- raccord `progress.chargeProgress` et `progress.reaction.progress` vérifié ;
- CSS n'invente aucune distance partagée ;
- CI complète verte.

HEAD fonctionnel avant documentation finale :

`b91954b10a146007ae862740aea57fc4e9a61eed`

CI :

- run : `36064955000`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN du sous-lot :

`checkpoint/lab-combat-visibility-chargebar-polish-v2-preaudit-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-combat-visibility-chargebar-polish-v2-2026-09-24`

SHA technique documenté :

`8e266cf2f146d3c5d2e63614e4648147e9b21ee6`

CI :

- run : `36065018526`
- conclusion : SUCCESS

Validation restante :

- smartphone : vérifier que les créatures ne sortent plus en Longue ;
- vérifier que la réduction de taille reste légère ;
- vérifier le rendu du scale Courte / Moyenne / Longue ;
- vérifier que les réglages de test plus bas donnent une interface principale crédible ;
- lancer Boule de feu et observer la barre sous Maraileron pendant 2 s puis le projectile ;
- lancer une réaction et observer la barre sous Braisombre.

Le sous-lot reste pré-audit jusqu'au retour utilisateur.


## Sous-lot actif — player-distance-hpbar-polish-v2

Base :

`fefab76a531d07a47d863ce6e6989750f939b869`

Checkpoint départ :

`checkpoint/lab-start-player-distance-hpbar-polish-v2-2026-09-24`

Branche :

`work/lab-player-distance-hpbar-polish-v2-2026-09-24`

Retour utilisateur ciblé :

- le déplacement du joueur doit être sans ambiguïté :
  - vers Courte = rapprochement visuel vers le centre ;
  - vers Longue = éloignement visuel vers l'extérieur ;
- le rapprochement joueur doit aller légèrement plus vers le centre ;
- l'éloignement doit rester assez contenu pour que le bandeau nom / PV / charge ne sorte pas de l'arène ;
- ajouter une barre de PV sous le nom des deux créatures ;
- la barre de PV doit provenir du Combat State et non d'une valeur décorative du HTML.

Choix d'architecture :

- `DOM Distance Presenter` n'infère plus la position depuis la position courante de l'adversaire ;
- il applique un delta signé à partir de la transition sémantique `from -> to` :
  - côté joueur : distance plus courte => x augmente ; distance plus longue => x diminue ;
  - côté adversaire : inverse ;
- la projection reste bornée dans l'arène ;
- le scale visuel continue d'être piloté par la distance cible ;
- `Combat State` devient propriétaire de `hp / maxHp` ;
- Demo UI ne fait qu'afficher le snapshot HP.

Tests prévus :

- joueur Moyenne -> Courte se déplace vers le centre ;
- joueur Moyenne -> Longue se déplace vers l'extérieur ;
- adversaire conserve la convention symétrique ;
- seul le combattant déplacé change de position/scale ;
- bornes de scène respectées ;
- HP initial normalisé depuis les données ;
- HP borné entre 0 et maxHp ;
- barres PV présentes sous le nom ;
- UI alimentée par `state.fighters[id].hp/maxHp` ;
- CI et sentinelles existantes vertes.


## Résultat technique — player-distance-hpbar-polish-v2

Corrections :

- le déplacement visuel n'est plus recalculé relativement à la position de l'autre combattant ;
- il dérive directement de la transition sémantique `from -> to` ;
- joueur Moyenne -> Courte : déplacement vers le centre ;
- joueur Moyenne -> Longue : déplacement vers l'extérieur ;
- adversaire : convention symétrique ;
- pas de déplacement du combattant stationnaire ;
- bornes renforcées : 20 % / 80 % ;
- reset visuel : joueur 28 % / adversaire 72 % ;
- pas visuel : 10 % de largeur d'arène par palier ;
- scale scène conservé : Courte 1,00 / Moyenne 0,96 / Longue 0,90 ;
- `Combat State` porte maintenant `hp / maxHp` ;
- données test : 100 / 100 PV pour les deux créatures ;
- `withFighterHp()` borne les PV entre 0 et maxHp ;
- Runtime inclut HP dans son signal d'état ;
- barre PV ajoutée sous le nom de chaque créature, avant la barre de charge ;
- la barre PV lit uniquement le snapshot `state.fighters[id]` ;
- aucun système de dégâts n'a été inventé dans ce lot.

Tests :

- direction joueur Courte/Longue explicitement protégée ;
- transition deux bandes protégée ;
- symétrie adversaire protégée ;
- bornes de scène protégées ;
- HP initial, max et clamp protégés ;
- barres PV et raccord UI état -> PV protégés ;
- CI complète verte.

HEAD fonctionnel avant documentation finale :

`fcee96f341a869432904d727f25c70447a5445a4`

CI :

- run : `36066616228`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN du sous-lot :

`checkpoint/lab-player-distance-hpbar-polish-v2-preaudit-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-player-distance-hpbar-polish-v2-2026-09-24`

SHA technique documenté avant synchronisation finale :

`b8aacc6b9cfa05bb0397b1d4b71f8f4d72f17f76`

CI :

- run : `36066676259`
- conclusion : SUCCESS

Validation restante :

- smartphone : confirmer que Courte rapproche bien Maraileron vers le centre ;
- confirmer que Longue l'éloigne sans faire sortir son bandeau ;
- vérifier lisibilité Nom -> PV -> Charge ;
- confirmer que la nouvelle marge de scène est suffisante.

Le sous-lot reste pré-audit jusqu'au retour utilisateur.


## Sous-lot actif — distance-z-hp-resolution-v2

Base :

`987bb0f523bed310753763a5f6f67c681396b524`

Checkpoint départ :

`checkpoint/lab-start-distance-z-hp-resolution-v2-2026-09-24`

Branche :

`work/lab-distance-z-hp-resolution-v2-2026-09-24`

Objectif :

1. corriger définitivement la perception Courte/Moyenne/Longue du joueur ;
2. garantir que le joueur passe visuellement devant l'adversaire lorsque leurs silhouettes se chevauchent ;
3. raccorder les dégâts déjà portés par les capacités aux PV du Combat State ;
4. ne démarrer le lot Objets / Rappel / Invocation / Stun qu'après GREEN technique de ces trois corrections.

Diagnostic / choix :

- la distance logique est relative entre les deux combattants ; une projection incrémentale du seul acteur peut dériver si l'autre a déjà bougé ;
- le Render Adapter recalculera donc la position cible du combattant mobile à partir de la position du combattant stationnaire + une séparation explicite par bande ;
- convention visuelle :
  - Courte = séparation minimale ;
  - Moyenne = séparation intermédiaire ;
  - Longue = séparation maximale ;
- le joueur reste à gauche et l'adversaire à droite ;
- `player z-index > opponent z-index` appartient au layout/rendering, pas aux règles de combat ;
- les dégâts sont déjà définis dans `skill.effect.damage` et les événements `hit` existent ; le raccord manquant est la mutation HP dans `Action Resolver` ;
- `resolveSkillCompletion` reste l'unique propriétaire de l'application du résultat sémantique sur le Combat State.

Interdits :

- aucun correctif de direction dans les boutons UI ;
- aucun échange de labels Courte/Longue ;
- aucun calcul de dégâts dans le Presenter ou l'UI ;
- aucune animation utilisée comme source de dégâts ;
- aucun deuxième état HP ;
- aucun ajout Objets/Rappel/Invocation avant CI GREEN de ce lot.

Tests :

- joueur à gauche : Courte plus proche du centre que Moyenne, Moyenne plus proche que Longue ;
- adversaire symétrique ;
- seul le combattant mobile change ;
- relation de séparation réelle Courte < Moyenne < Longue ;
- z-index joueur > adversaire ;
- hit retire `skill.effect.damage` à la cible ;
- reflected retire les dégâts à l'attaquant ;
- blocked / immune / countered ne retirent pas de PV ;
- PV clampés à zéro ;
- preview de compétence ne doit pas muter l'état de session ;
- completion live doit réellement committer les PV dans Combat Session.


## Résultat technique — distance-z-hp-resolution-v2

Corrections validées techniquement :

- la projection incrémentale précédente a été supprimée ;
- position cible calculée depuis le combattant stationnaire ;
- séparations explicites : Courte 0,30 / Moyenne 0,44 / Longue 0,56 ;
- joueur : Courte vers le centre, Longue vers l'extérieur ;
- adversaire : comportement symétrique ;
- un seul combattant bouge visuellement ;
- positions canonisées pour éviter les dérives flottantes ;
- bornes d'arène conservées ;
- joueur `z-index: 4`, adversaire `z-index: 3` ;
- `Action Resolver` applique désormais `skill.effect.damage` aux PV ;
- hit : cible perd les PV ;
- reflected : attaquant perd les PV ;
- blocked / immune / countered : aucun dégât de l'attaque annulée ;
- `Combat Session.completeSkill()` commit les PV lors d'une résolution live ;
- les barres PV existantes reçoivent donc maintenant l'état réellement modifié.

Sentinelles :

- Courte < Moyenne < Longue en séparation réelle ;
- symétrie adversaire ;
- seul le combattant mobile change position/scale ;
- joueur au-dessus de l'adversaire ;
- dégâts hit ;
- dégâts reflected ;
- immunité / contre sans dégâts ;
- clamp PV à zéro ;
- preview sans mutation de session ;
- completion live commit HP.

HEAD fonctionnel avant documentation :

`d87cbe84ceec5bfb3a1f4756e39adf8db56a857b`

CI :

- run : `36067840558`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN :

`checkpoint/lab-distance-z-hp-resolution-v2-preaudit-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-distance-z-hp-resolution-v2-2026-09-24`

SHA technique :

`a02d8560a655b82adaf984eccee4b5d146b2ae02`

CI :

- run : `36067913906`
- conclusion : SUCCESS

Ce lot peut servir de base au chantier suivant Objets / Rappel / Invocation / interruption par Stun.


## Correctif ciblé — distance-anchor-fix — GREEN technique

Base :

`0df6d3bcfc94cf11abf05824a273b91c6287756a`

Checkpoint départ :

`checkpoint/lab-start-distance-anchor-fix-2026-09-25`

Décision :

La projection relative au combattant stationnaire est supprimée pour l'affichage des bandes de distance.

Le Render Adapter possède désormais des ancres explicites par côté et par bande :

- joueur : Longue 18 % / Moyenne 28 % / Courte 42 % ;
- adversaire : Courte 58 % / Moyenne 72 % / Longue 82 % ;
- scale : Courte 1,00 / Moyenne 0,96 / Longue 0,90.

Un déplacement ne modifie toujours que le combattant qui agit.

Cette projection est volontairement indépendante de l'état visuel précédent : cliquer Longue donne toujours l'ancre Longue du joueur, cliquer Courte donne toujours l'ancre Courte.

Tests :

- ordre joueur `Longue < Moyenne < Courte` ;
- ordre adversaire symétrique ;
- combattant stationnaire inchangé ;
- reset Moyenne ;
- sentinelle d'architecture adaptée.

HEAD technique :

`d8bf6d1c30a8e43910ec44c64d8a990fae76480f`

CI :

- run : `36070381590`
- conclusion : SUCCESS


## Chantier actif — combat-commands-evasion-v3

Base GREEN :

`6556827221cd79b9401a27ae2b01ec5cf391b4b4`

Checkpoint départ :

`checkpoint/lab-start-combat-commands-evasion-v3-2026-09-25`

Branche :

`work/lab-combat-commands-evasion-v3-2026-09-25`

Objectifs :

1. verrouiller la règle d'impact :
   - aucun dégât au clic ;
   - aucun dégât pendant la préparation ;
   - aucun dégât au release tant que la cible n'est pas touchée ;
   - dégâts uniquement à `impactAtMs` ;
2. rendre le mode d'approche indépendant de la forme de compétence :
   - `none` ;
   - `ground` ;
   - `aerial` ;
   - `teleport` ;
3. préparer les esquives en fonction de la forme et/ou du mode d'approche ;
4. permettre plus tard à une attaque Stun qui touche avant le release d'interrompre une action en charge ;
5. ajouter ensuite les commandes de combat :
   - Objet ;
   - Rappel ;
   - Invocation ;
   avec coût énergie + préparation + interruption possible.

Architecture :

- `form` décrit ce qui touche : contact / projectile / beam / area / etc. ;
- `approachMode` décrit comment l'action atteint sa cible : none / ground / aerial / teleport ;
- `travelMs` reste l'autorité sur le temps release -> impact ;
- `Combat Runtime` reste l'unique horloge ;
- `Action Resolver` reste l'unique propriétaire des dégâts à l'impact ;
- l'UI ne déduit jamais si une esquive ou interruption réussit.

Exemples :

- Boule de feu = projectile + none ;
- Griffe = contact + ground ;
- Plongeon = contact + aerial ;
- Frappe éclair = contact + teleport.

Règle temporelle :

`préparation -> release -> trajet/approche -> impact -> dégâts -> récupération`

Une esquive doit être prête au plus tard avant `impactAtMs`.

Une attaque qui produit un Stun n'interrompt une charge que si son propre impact arrive avant le release de l'action ciblée.

Tests obligatoires :

- projectile : HP inchangés à release, changés à impact ;
- contact : HP inchangés juste avant impact, changés à impact ;
- approche aerial/teleport normalisée par contrat ;
- aucune confusion entre `form` et `approachMode` ;
- esquive calculée contre forme et/ou approche ;
- aucun calcul de dégâts dans UI/Presenter/FX ;
- avant ajout des commandes Objet/Rappel/Invocation, CI GREEN de ce socle.


## Résultat intermédiaire — impact-evasion-foundation-v3

Socle validé techniquement :

- `SkillDefinition` possède maintenant `approachMode` ;
- valeurs autorisées : none / ground / aerial / teleport ;
- `form` et `approachMode` restent deux axes indépendants ;
- réactions : `evadeForms` et `evadeApproaches` ;
- nouveau résultat sémantique : `evaded` ;
- Boule de feu explicitement `projectile + none` ;
- Griffe explicitement `contact + ground` ;
- prototype `Plongeon aérien` ;
- prototype `Frappe téléportée` ;
- prototype `Esquive` ;
- release et impact exposent le mode d'approche ;
- dégâts live verrouillés à `impactAtMs`.

Sentinelles temporelles :

- projectile : HP inchangés à 1999 ms ;
- release à 2000 ms : HP toujours inchangés ;
- 2699 ms : HP toujours inchangés ;
- impact 2700 ms : dégâts appliqués ;
- contact : HP inchangés juste avant l'impact ;
- contact : dégâts appliqués à l'instant impact ;
- une esquive lente peut réussir contre une approche aérienne longue et échouer contre une téléportation courte.

HEAD technique avant documentation :

`baeb98bacf813b32e92edff7e01da9b55dcefd0e`

CI :

- run : `36070860128`
- conclusion : SUCCESS

Le lot suivant peut maintenant construire Objet / Rappel / Invocation / Stun sur cette chronologie sans modifier l'autorité des dégâts.


## Sous-lot actif — combat-commands-stun-v3

Base :

`f204b6193e1addb46d6787a28b9c5911a8af53ba`

Checkpoint départ :

`checkpoint/lab-start-combat-commands-stun-v3-2026-09-25`

Branche :

`work/lab-combat-commands-stun-v3-2026-09-25`

Objectif :

- ajouter trois commandes de combat séparées des compétences :
  - Objet ;
  - Rappel ;
  - Invocation ;
- chaque commande possède coût énergie, préparation, récupération et interruptibilité configurables ;
- partager le même Combat Runtime de charge que les compétences ;
- permettre à un impact sémantique de type Stun d'interrompre une action encore en préparation ;
- ne jamais interrompre une action déjà release ;
- conserver le Stun de validation dans les outils de test, pas dans l'interface joueur principale.

Propriétaires :

- `CombatCommandDefinition` : contrat des commandes ;
- `Command Resolver` : coût, préparation et résultat de commande ;
- `Combat Session` : commit de l'état ;
- `Combat Runtime` : progression et interruption de la charge ;
- `Action Resolver` : produit `charge-interrupt` uniquement lorsqu'une compétence Stun touche réellement ;
- Demo UI : boutons et lecture de progression uniquement.

Données laboratoire :

- Objet : 1 énergie, 0,7 s de charge, potion test +20 PV ;
- Rappel : 2 énergies, 1,4 s de charge ;
- Invocation : 3 énergies, 2,2 s de charge ;
- Impact étourdissant : projectile, 0,5 s de préparation + 0,35 s de trajet, 5 dégâts, effet Stun.

Invariants :

- l'énergie d'une commande est dépensée au démarrage ;
- l'effet de la commande n'est appliqué qu'à sa completion ;
- toute commande est interruptible pendant sa préparation sauf configuration contraire ;
- un Stun n'existe comme interruption qu'après son propre impact ;
- `interruptActive()` refuse l'interruption si la cible n'est pas l'acteur actif, si l'action n'est pas interruptible ou si le release est déjà atteint ;
- Objet/Rappel/Invocation ne sont jamais modélisés comme de fausses compétences.

Tests exigés :

- contrat des trois commandes ;
- énergie insuffisante ;
- potion soigne uniquement à completion ;
- Rappel/Invocation produisent leurs événements sémantiques ;
- charge commandée via Combat Runtime ;
- interruption avant release ;
- refus après release ;
- `charge-interrupt` émis à l'impact du Stun, pas au start/release ;
- structure CI exige les nouveaux contrats/resolvers/données/tests ;
- UI principale expose Objet/Rappel/Invocation ;
- outil Stun de validation uniquement dans Réglages du test.


## Résultat technique — combat-commands-stun-v3

Implémentation présente :

- contrat `CombatCommandDefinition` séparé du contrat de compétence ;
- types : Item / Rappel / Invocation ;
- `Command Resolver` indépendant de l'UI et du renderer ;
- commandes partageant le Combat Runtime de charge ;
- coût énergie configurable ;
- préparation configurable ;
- récupération configurable ;
- interruptibilité pendant la préparation configurable ;
- Item laboratoire : +20 PV uniquement à completion ;
- Rappel laboratoire : événement sémantique de completion ;
- Invocation laboratoire : événement sémantique avec `summonCreatureId` ;
- boutons Objet / Rappel / Invocation visibles dans l'interface principale ;
- progression de commande raccordée à la barre de charge principale ;
- Stun prototype : 500 ms préparation + 350 ms trajet ;
- `charge-interrupt` produit uniquement à l'impact 850 ms ;
- Runtime refuse l'interruption si le release de la cible est déjà atteint ;
- contrôle `Simuler impact Stun` placé uniquement dans Réglages du test ;
- fichiers V3 rendus obligatoires par la sentinelle de structure.

Frontières conservées :

- UI ne calcule ni coût, ni durée, ni interruption ;
- Command Resolver ne dépend ni de l'animation ni du DOM ;
- Action Resolver décide si un Stun a réellement touché ;
- Combat Runtime décide si l'action active est encore interruptible ;
- Rappel/Invocation ne sont pas de fausses compétences ;
- le vrai changement de roster/asset lors d'un Rappel/Invocation reste hors de ce lot.

Tests ajoutés :

- contrat Item/Rappel/Invocation ;
- coût énergie ;
- soin uniquement à completion ;
- événements Rappel/Invocation ;
- progression runtime d'une commande ;
- interruption avant release ;
- refus après release ;
- Stun : interruption émise exactement à l'impact ;
- résolution sémantique Stun -> interruption de la commande en charge ;
- UI principale commandes / panneau test Stun séparés ;
- absence de valeurs de timing de commande codées dans l'UI.

HEAD fonctionnel avant documentation finale :

`2da10b2960449368d59875aa7c8a242dd69fa9a1`

CI de ce HEAD :

- run : `36072367866`
- conclusion : SUCCESS

Checkpoint GREEN :

`checkpoint/lab-combat-commands-stun-v3-green-2026-09-25`

Branche de prévisualisation :

`preview/lab-combat-commands-stun-v3-2026-09-25`

SHA GREEN avant synchronisation finale du présent document :

`c99f9010df2389dce17f46ac7a713cb97b5902ab`

CI :

- run : `36072510231`
- conclusion : SUCCESS

Checkpoint GREEN prévu :

`checkpoint/lab-player-ui-ko-special-moves-v5-green-2026-09-25`

Branche de prévisualisation :

`preview/lab-player-ui-ko-special-moves-v5-2026-09-25`

SHA technique avant synchronisation finale :

`84220f111c37feb666641e6b65706606896d83e7`

CI :

- run : `36102503071`
- conclusion : SUCCESS

Validation utilisateur restante :

- smartphone : visibilité des trois boutons tactiques ;
- vérifier les coûts et barres de charge ;
- Objet doit soigner uniquement à la fin de sa charge ;
- Rappel/Invocation doivent terminer leur charge et produire le journal ;
- pendant une charge Rappel/Invocation, `Simuler impact Stun` doit l'annuler ;
- après release, la même interruption doit être refusée ;
- confirmer le rythme avant d'engager le vrai roster de réserve.


## Chantier actif — player-ui-roster-v4

Base GREEN :

`6e9227a6b3e24519cba00782d7653cb215b74b63`

Checkpoint départ :

`checkpoint/lab-start-player-ui-roster-v4-2026-09-25`

Branche :

`work/lab-player-ui-roster-v4-2026-09-25`

Objectif utilisateur :

- remplacer la démo laboratoire par une vue de partie propre ;
- ne laisser à l'écran que les contrôles du joueur ;
- regrouper les capacités et actions dans des menus déroulants compacts ;
- retirer Réglages du test, simulateur Stun, contrôles Idle/Hit/KO/import/intensité ;
- créer deux équipes de deux créatures :
  - joueur : Marai + Drakon ;
  - adversaire : Drakon + Marai ;
- afficher la réserve des deux équipes ;
- rendre Rappel / Invocation réellement testables :
  - Rappel range la créature active dans la réserve ;
  - Invocation fait entrer la créature de réserve sélectionnée ;
  - PV / énergie de chaque membre sont conservés entre les changements ;
  - le visuel et le profil changent réellement dans l'arène ;
- conserver coût énergie + charge + interruption des commandes déjà validés.

Architecture / propriétaires :

- `Roster Session` : équipe, membre actif, réserve, snapshots persistants de chaque membre ;
- `Combat Session` : état des deux slots actuellement engagés ;
- `Roster Session` est le seul propriétaire du swap membre <-> slot combat ;
- `Demo Visual Controller` expose uniquement un changement de créature d'un slot ;
- `Combat Test UI` déclenche les commandes et affiche le roster, sans muter directement les stats ;
- `Combat Runtime` conserve l'autorité du timing Rappel/Invocation.

Modèle de scène :

- slots combat fixes : `player` et `opponent` ;
- membres roster uniques :
  - `player-marai`, `player-drakon` ;
  - `opponent-drakon`, `opponent-marai` ;
- les données espèce Maraileron/Braisombre sont clonées vers le slot combat actif au moment de l'invocation ;
- à un Rappel, le snapshot du slot est sauvegardé dans le membre avant de vider le slot ;
- à une Invocation, le snapshot du membre sélectionné devient le nouveau fighter du slot.

UI autorisée :

- arène ;
- bandeaux Nom / PV / Charge ;
- réserve joueur et réserve adversaire ;
- énergie joueur ;
- déplacement Courte/Moyenne/Longue ;
- menu Capacités ;
- menu Objets ;
- menu Équipe (Rappel / Invocation) ;
- statut court de combat.

UI supprimée :

- Réglages du test ;
- simulateur Stun ;
- Outils visuels laboratoire ;
- contrôle manuel de l'adversaire ;
- journal technique détaillé ;
- sélecteur de créature déplacée ;
- boutons Idle/Attaque/Hit/KO/Stop ;
- import fichiers/intensité.

Tests :

- roster 2v2 initial correct ;
- Rappel sauvegarde HP/énergie et vide le slot joueur ;
- Invocation restaure le membre choisi et ses stats ;
- swap visuel utilise la vue player/opponent correcte ;
- adversaire reste non contrôlable depuis l'UI ;
- menus joueur présents ;
- aucun contrôle laboratoire restant dans le HTML ;
- capacités ne sont plus toutes affichées simultanément ;
- commands conservent leur vrai runtime de charge ;
- sentinelles combat/impact/stun existantes restent vertes.

Hors périmètre :

- IA adversaire ;
- choix automatisé de réaction adverse ;
- KO avec remplacement forcé ;
- animations spécifiques de rappel/invocation ;
- roster GenSrpG réel ;
- modification du dépôt Zombicide-40k.

Critère de fin :

CI verte + checkpoint GREEN + preview smartphone permettant de jouer Marai/Drakon contre Drakon/Marai avec Rappel/Invocation réels.


## Résultat technique — player-ui-roster-v4

Implémentation présente :

- vue laboratoire remplacée par une vue de partie propre ;
- aucun Réglages du test / simulateur Stun / Idle-Hit-KO / import / intensité dans l'écran utilisateur ;
- seuls les contrôles joueur restent visibles ;
- menus déroulants :
  - Capacités ;
  - Objets ;
  - Équipe ;
- réserve joueur visible ;
- réserve adverse visible mais non contrôlable ;
- roster 2v2 :
  - joueur : Marai + Drakon ;
  - adversaire : Drakon + Marai ;
- nouveau `Roster Session` propriétaire unique de actif/réserve ;
- slots combat stables : `player` / `opponent` ;
- `Combat Session.replaceFighter()` remplace proprement le fighter d'un slot ;
- chaque membre conserve son snapshot PV/énergie ;
- Rappel sauvegarde le membre actif puis vide le slot visuel joueur ;
- Invocation utilise le membre de réserve sélectionné et remplace réellement :
  - stats du slot ;
  - asset ;
  - profil ;
  - nom affiché ;
- le membre rappelé redevient ensuite disponible en réserve ;
- le joueur peut sélectionner sa réserve via les cartes de réserve ;
- l'adversaire ne possède aucun bouton d'action ;
- coût énergie + charge + interruption des commandes conservés ;
- la fausse cible `reserve-creature-test` a été supprimée : la cible d'invocation appartient maintenant au Roster Session ;
- listener de réserve délégué sur un seul conteneur pour éviter les accumulations lors des rerenders.

Frontières conservées :

- UI ne copie aucune stat de membre ;
- Roster Session ne connaît ni DOM ni animation ;
- Visual Controller change seulement le visuel du slot demandé ;
- Combat Runtime reste l'autorité temporelle Rappel/Invocation ;
- Command Resolver reste propriétaire coût/charge/completion ;
- Combat Session reste propriétaire des fighters actuellement engagés.

Tests ajoutés / réécrits :

- roster initial Marai/Drakon vs Drakon/Marai ;
- un reserve par équipe au départ ;
- Rappel conserve HP/énergie ;
- Invocation sélectionnée remplace le slot joueur ;
- réinvocation d'un membre restaure son snapshot ;
- opérations joueur ne mutent pas l'adversaire ;
- command-complete recall/summon délègue au Roster Session ;
- structure exige core/data/tests roster ;
- aucun contrôle laboratoire restant dans le HTML ;
- trois menus déroulants présents ;
- aucun contrôle direct adversaire ;
- vrai raccord `Roster -> Combat slot -> visuel` protégé ;
- sentinelles Animation / Distance / Impact / Commands existantes conservées.

Dernier HEAD fonctionnel avant documentation de clôture :

`34e80fe3240a4b07c23bd48ebec38bacc9931b9e`

CI de ce HEAD :

- run : `36078895649`
- conclusion : SUCCESS

Checkpoint GREEN V4 :

`checkpoint/lab-player-ui-roster-v4-green-2026-09-25`

Branche de prévisualisation :

`preview/lab-player-ui-roster-v4-2026-09-25`

SHA GREEN avant synchronisation finale du présent document :

`1a18c110614a3631d97f6e42ccf266d69163deb1`

CI :

- run : `36078999667`
- conclusion : SUCCESS

Validation utilisateur restante :

- smartphone : vérifier lisibilité globale sans panneaux laboratoire ;
- ouvrir/fermer les trois menus ;
- vérifier que les capacités ne prennent plus tout l'écran ;
- sélectionner Drakon en réserve ;
- lancer Rappel et attendre la fin de charge ;
- vérifier disparition de Marai ;
- lancer Invocation et attendre la fin de charge ;
- vérifier entrée réelle de Drakon avec son visuel ;
- rappeler Drakon puis réinvoquer Marai ;
- vérifier persistance des PV/énergie ;
- vérifier que la réserve adverse reste seulement informative.


## Chantier actif — player-ui-ko-special-moves-v5

Base GREEN :

`a09ea4d5b60e6bad3881f2b2e83e2ce880a3e648`

Checkpoint départ :

`checkpoint/lab-start-player-ui-ko-special-moves-v5-2026-09-25`

Branche :

`work/lab-player-ui-ko-special-moves-v5-2026-09-25`

Objectifs :

- remplacer le menu déroulant Capacités par des boutons directs, adaptés à un jeu de réflexe ;
- conserver Objets / Équipe compacts si nécessaire, mais ne pas cacher les attaques principales ;
- augmenter légèrement la hauteur de l'arène de combat ;
- lorsqu'un adversaire tombe à 0 PV :
  - sauvegarder son snapshot roster ;
  - passer automatiquement au membre de réserve adverse disponible ;
  - remplacer réellement stats + visuel + nom du slot adversaire ;
  - ne donner aucun contrôle joueur sur ce choix ;
- ajouter deux mouvements visuels spécialisés :
  - `teleport-attack` : disparition -> réapparition sur la cible -> disparition -> retour au point de départ ;
  - `aerial-attack` : montée -> disparition -> piqué sur la cible -> retour ;
- ces mouvements sont déclenchés depuis `approachMode`, sans changer les règles de dégâts ;
- les dégâts restent appliqués uniquement par Combat Rules au timestamp d'impact ;
- l'animation peut finir après l'impact sans retarder artificiellement les dégâts.

Propriétaires :

- UI : composition des boutons uniquement ;
- Roster Session : remplacement automatique après KO ;
- Combat Session : PV et slot engagé ;
- Visual Controller : remplacement asset/profil et lecture du mouvement spécialisé ;
- Animation Core : séquence visuelle teleport/aerial ;
- Combat Runtime / Action Resolver : timing release/impact/dégâts inchangé.

Interdits :

- aucun KO géré uniquement par un if DOM ;
- aucun swap adverse direct dans l'UI sans passer par Roster Session ;
- aucun dégât décidé par la fin de l'animation ;
- aucune duplication d'horloge pour teleport/aerial ;
- aucun déplacement visuel spécial codé dans un bouton ;
- aucun retour des anciens outils laboratoire.

Tests :

- capacités principales visibles sans ouvrir un menu ;
- arène plus haute sur mobile ;
- KO adverse déclenche remplacement automatique par la réserve ;
- snapshot du membre KO conservé ;
- nouveau membre adverse garde son propre snapshot ;
- aucun bouton de réserve adverse ;
- teleport : opacity 1 -> 0 -> réapparition cible -> retour ;
- aerial : montée -> disparition -> piqué -> retour ;
- plans finissent sur état stable ;
- impact/dégâts restent pilotés par Combat Runtime/Resolver ;
- CI complète verte.

Critère de fin :

preview smartphone propre avec boutons directs, arène plus haute, KO adverse remplacé automatiquement, et mouvements Aérien/Téléportation visibles.


## Résultat technique — player-ui-ko-special-moves-v5

Implémentation présente :

- menu déroulant Capacités supprimé ;
- quatre capacités offensives visibles directement pour jeu de réflexe ;
- Objets et Équipe restent en menus secondaires ;
- arène augmentée à `min(54svh, 32rem)` sur grand écran, avec valeurs mobiles relevées ;
- distance conserve trois boutons Courte / Moyenne / Longue ;
- aucun retour des contrôles laboratoire.

KO adverse :

- `Roster Session.replaceKnockedOut()` est propriétaire du remplacement ;
- le membre KO conserve son snapshot PV/énergie ;
- un membre vivant de réserve est choisi automatiquement ;
- le slot `opponent` est remplacé dans Combat Session ;
- la présentation suit réellement `Hit -> KO` ;
- l'UI attend `presentation.finished` avant de remplacer l'asset adverse ;
- si aucun membre vivant ne reste, le roster retourne `team_defeated` et le slot adverse est masqué ;
- aucun contrôle joueur sur la réserve adverse.

Mouvements spéciaux :

- nouveaux événements visuels :
  - `teleport-attack` ;
  - `aerial-attack` ;
- presets dédiés dans chaque profil morphologique ;
- le Visual Controller mesure la géométrie réelle acteur/cible via `getBoundingClientRect()` ;
- il transmet uniquement les offsets visuels + `travelMs` à l'Animation Core ;
- Téléportation :
  - disparition à l'origine ;
  - apparition sur la cible exactement au temps d'impact ;
  - disparition sur cible ;
  - retour origine ;
- Aérien :
  - montée ;
  - disparition/reposition haute ;
  - piqué jusqu'à la cible exactement au temps d'impact ;
  - retour origine ;
- les dégâts restent appliqués exclusivement par Combat Rules à `impactAtMs`.

Sentinelles ajoutées / mises à jour :

- roster KO adverse -> remplacement vivant ;
- deux KO adverses -> `team_defeated` ;
- Hit -> KO expose une promesse réelle de présentation ;
- release teleport/aerial délègue au Visual Controller ;
- plan Téléportation atteint la cible à `travelMs` ;
- plan Aérien atteint la cible à `travelMs` ;
- retour de chaque plan à l'état stable ;
- capacités directes sans menu ;
- deux menus secondaires seulement ;
- arène plus haute ;
- distance toujours trois boutons ;
- géométrie spéciale sans autorité gameplay ;
- CI complète existante conservée.

HEAD technique avant synchronisation finale :

`967ca37e9be5074aed804b51c3cfb963b858b09b`

CI :

- run : `36102462561`
- conclusion : SUCCESS

Validation utilisateur restante :

- smartphone : vérifier que les quatre capacités restent immédiatement accessibles ;
- vérifier que la nouvelle hauteur d'arène améliore la lisibilité ;
- mettre Drakon adverse KO et confirmer l'entrée automatique de Marai adverse ;
- tester Frappe téléportée : disparition -> cible -> retour ;
- tester Plongeon aérien : montée -> disparition -> piqué -> retour ;
- confirmer que les dégâts arrivent au contact visuel, avant la fin du retour.

Le lot est GREEN technique, en attente de validation visuelle smartphone.


## Chantier actif — impact-mobility-ko-ui-v6

Base GREEN :

`c8ca895f64d69d8b6a4bc615e05b26a066a3fd58`

Checkpoint départ :

`checkpoint/lab-start-impact-mobility-ko-ui-v6-2026-09-25`

Branche :

`work/lab-impact-mobility-ko-ui-v6-2026-09-25`

Retour utilisateur ciblé :

- le KO adverse n'entraîne pas encore le remplacement visible attendu ;
- l'attaque aérienne doit monter nettement plus haut, jusqu'à pouvoir sortir temporairement du cadre supérieur avant de piquer ;
- l'arène peut être encore un peu plus haute ;
- les attaques corps à corps doivent utiliser un temps d'approche configurable par compétence ;
- exemples attendus :
  - Griffe : approche relativement lente, environ 1,5 s ;
  - Sprint : approche plus rapide, par exemple 0,9 s ou 0,5 s si configuré ;
- la barre de charge principale doit être plus grande et afficher :
  - nom de l'action en préparation ;
  - temps restant ;
  - progression ;
- aucun timing ne doit être dupliqué dans l'UI.

Architecture / propriétaires :

- `SkillDefinition.travelMs` reste l'autorité gameplay sur release -> impact ;
- `approachMode=ground` doit utiliser ce `travelMs` pour le déplacement visuel jusqu'à la cible ;
- `approachMode=aerial` utilise le même `travelMs` pour montée/reposition/piqué jusqu'à impact ;
- `approachMode=teleport` utilise le même `travelMs` pour disparition/réapparition à impact ;
- l'Animation Core consomme `travelMs`, il ne l'invente pas ;
- les dégâts restent appliqués uniquement par Action Resolver à `impactAtMs` ;
- `Roster Session` reste seul propriétaire du remplacement après KO ;
- le Presenter expose l'achèvement réel Hit/KO, aucune attente magique UI ;
- la Demo UI affiche nom/temps restant à partir des snapshots du Combat Runtime.

Diagnostic obligatoire KO :

- vérifier l'événement `hit` réel et son `hpAfter` ;
- vérifier la détection KO dans le Presenter ;
- vérifier l'attente de la promesse Hit -> KO ;
- vérifier `Roster Session.replaceKnockedOut("opponent")` ;
- vérifier le remplacement Combat Session + asset `opponent` ;
- corriger la première frontière fautive, pas ajouter de fallback concurrent.

Tests :

- Griffe : HP inchangés pendant les 1,5 s d'approche, dégâts à impact ;
- une compétence ground peut choisir 0,5 s / 0,9 s / 1,5 s sans changer le moteur ;
- animation ground atteint la cible à `travelMs` puis revient ;
- aérien monte au-dessus du cadre avant piqué ;
- teleport/aerial/ground utilisent la géométrie réelle cible ;
- KO adverse : Hit -> KO -> remplacement roster -> changement asset ;
- arène augmentée sans masquer le HUD ;
- barre de charge principale plus grande ;
- nom action + temps restant proviennent du Runtime ;
- sentinelles existantes intactes.

Hors périmètre :

- IA adverse complète ;
- nouveau moteur de dégâts ;
- intégration GenSrpG principal ;
- génération/modification d'images.


## Résultat technique — impact-mobility-ko-ui-v6

Corrections implémentées :

### Corps à corps configurable

- nouvel événement visuel `ground-attack` ;
- `approachMode=ground` utilise désormais le vrai `travelMs` de la compétence ;
- Griffe : `travelMs = 1500 ms` ;
- le contact visuel avec la cible se produit exactement à la fin de ces 1,5 s ;
- les dégâts restent appliqués uniquement à cet impact ;
- le retour à la position d'origine est purement visuel ;
- tests avec `travelMs = 500 / 900 / 1500 ms` démontrent que le moteur reste entièrement configurable.

### Aérien

- l'arène est mesurée au moment de l'attaque ;
- le Visual Controller calcule une translation suffisante pour faire sortir l'acteur au-dessus du cadre ;
- l'Animation Core utilise la montée la plus haute entre le preset et cette sortie réelle ;
- montée / disparition / repositionnement haut / piqué / impact / retour ;
- impact toujours aligné sur `travelMs`.

### KO

Cause renforcée :

- l'ancien contrôleur visuel redémarrait un idle après toute animation transitoire, y compris après `ko` ;
- ce comportement annulait visuellement l'état vaincu juste avant le remplacement.

Correction :

- `ko` ne redémarre plus l'idle du membre vaincu ;
- opacity KO finale = 0 ;
- Presenter dérive le KO directement de l'événement `hit` et expose `koActorId` ;
- l'UI ne déclenche le remplacement adverse que pour `koActorId === "opponent"` ;
- Roster Session reste le seul propriétaire du remplacement ;
- vrai test d'intégration ajouté :
  `damage -> hp 0 -> Hit -> KO -> presentation.finished -> replaceKnockedOut -> nouveau fighter opponent`.

### Barre de charge

Combat Runtime expose maintenant :

- `actionName` ;
- `preparationMs` ;
- `remainingPreparationMs` ;
- progression de charge.

UI :

- barre principale agrandie à `0.56rem` ;
- nom de l'action affiché au-dessus ;
- temps restant affiché en secondes ;
- aucune horloge UI, aucun `setInterval`, aucun `Date.now()` de gameplay.

### Surface de combat

- desktop/tablette : `min(59svh, 35rem)` ;
- mobile <= 680 px : `54svh` ;
- petit mobile <= 430 px : `51svh`.

Sentinelles V6 :

- timing ground configurable 0,5 / 0,9 / 1,5 s ;
- Griffe sans dégâts avant impact 2,7 s total (1,2 s charge + 1,5 s approche) ;
- ground atteint la géométrie cible exactement à `travelMs` ;
- aerial peut sortir réellement du cadre ;
- KO ne revient pas à idle ;
- KO actor identity protégée ;
- vrai flux KO/remplacement protégé en intégration ;
- nom action + temps restant fournis par Runtime ;
- barre charge et arène agrandies protégées ;
- frontières Core / UI / Renderer intactes.

CI technique avant documentation :

- run : `36117658014`
- conclusion : SUCCESS

Checkpoint GREEN technique :

`checkpoint/lab-impact-mobility-ko-ui-v6-green-2026-09-25`

Branche de prévisualisation :

`preview/lab-impact-mobility-ko-ui-v6-2026-09-25`

SHA GREEN technique avant synchronisation finale :

`24263541dfd5b73ef53c0a0e4d5b98a322fe64d9`

CI :

- run : `36117767684`
- conclusion : SUCCESS

Validation smartphone restante :

- Griffe doit prendre environ 1,5 s pour parcourir le terrain après la charge ;
- Plongeon aérien doit sortir franchement du haut du cadre avant le piqué ;
- KO adverse doit disparaître puis être remplacé par Marai adverse ;
- nom + compte à rebours de la charge doivent être immédiatement lisibles ;
- confirmer que l'arène plus haute reste confortable avec les boutons.


## Correctif actif — ko-runtime-true-path-v6

Base GREEN :

`a5da1af255ca9ccf5aeda10e402fc2c855337897`

Checkpoint départ :

`checkpoint/lab-start-ko-runtime-true-path-v6-2026-09-25`

Branche :

`work/lab-ko-runtime-true-path-v6-2026-09-25`

Retour utilisateur reproduit :

- les PV adverses atteignent bien 0 dans l'interface réelle ;
- aucune animation KO ne reste visible ;
- aucun remplacement automatique du monstre adverse n'est observé.

Diagnostic démontré :

1. `resolveSkillCompletion()` ne renvoie pas `actionType: "skill"`, alors que `resolveCommandCompletion()` renvoie explicitement `actionType: "command"`;
2. le vrai `Combat Runtime` transmet cette résolution à l'UI ;
3. `Combat Test UI.onResolved()` branche sur `resolution.actionType === "skill"`;
4. une compétence live est donc classée à tort comme une commande, ce qui court-circuite le Presenter Hit -> KO et le raccord roster ;
5. le test d'intégration KO précédent appelait directement le Presenter et ne couvrait pas ce raccord Runtime réel ;
6. indépendamment, le DOM Actor Renderer restaure toujours l'état de base après toute animation terminée, ce qui remet l'opacité KO à 1 même si le plan KO termine à 0.

Objectif :

- réparer le contrat de résolution skill à la source ;
- protéger le vrai chemin `Combat Runtime -> onResolved -> Presenter -> KO -> Roster Session`;
- préserver visuellement l'état terminal KO jusqu'au remplacement du slot ;
- ne toucher ni aux dégâts, ni au timing d'impact, ni au choix du remplaçant.

Propriétaires autorisés :

- Action Resolver : contrat de résolution skill ;
- DOM Actor Renderer / Animation Plan : politique explicite de restauration terminale ;
- tests Runtime/UI/Renderer/KO ;
- documentation de reprise.

Interdits :

- aucun `if hp === 0` ajouté dans les boutons UI ;
- aucun second système de remplacement ;
- aucun timer KO parallèle ;
- aucun changement de dégâts ou de `impactAtMs`;
- aucun changement dans `Zombicide-40k`.

Tests exigés :

- une résolution live skill expose `actionType: "skill"`;
- le Runtime appelle la branche skill réelle à l'impact ;
- HP adverses 0 -> Presenter détecte KO -> Hit -> KO -> roster replacement ;
- un plan KO peut conserver son état final sans restauration automatique à opacity 1 ;
- les animations non terminales continuent de restaurer l'état de base ;
- sentinelles V6 complètes vertes.

Critère de fin :

CI verte + checkpoint GREEN + preview smartphone où Drakon adverse tombe KO puis est remplacé par Marai adverse.


## Résultat technique — ko-runtime-true-path-v6

Causes prouvées et corrigées :

1. `resolveSkillCompletion()` renvoie désormais explicitement :
   - `actionType: "skill"` ;
   - `skillId` ;
   ce qui permet au vrai callback `Combat Runtime -> onResolved` de prendre la branche compétence et de déclencher le Presenter Hit/KO ;

2. le test KO d'intégration ne contourne plus le Runtime :
   - démarrage de la compétence via `Combat Runtime` ;
   - attente jusqu'à `impactAtMs` ;
   - vérification de `actionType === "skill"` ;
   - HP adverse à 0 ;
   - Presenter Hit -> KO ;
   - `Roster Session.replaceKnockedOut("opponent")` ;
   - remplacement réel par Marai adverse ;

3. le contrat `AnimationPlan` possède maintenant une politique explicite `restoreBaseState` ;
   - Hit/Attaque et autres animations transitoires restaurent toujours l'état normal ;
   - KO utilise `restoreBaseState: false` ;
   - le DOM Actor Renderer applique alors réellement le dernier segment du plan au lieu de remettre opacity à 1 ;
   - l'état KO reste donc invisible jusqu'au remplacement du slot.

Sentinelles ajoutées :

- identité skill conservée par une résolution live Runtime ;
- vrai flux Runtime -> Presenter -> KO -> Roster ;
- plan KO déclaré terminal ;
- renderer conserve l'opacité et la transformation terminales du KO ;
- animations transitoires continuent de restaurer l'état de base.

CI du HEAD fonctionnel :

- run : `36119322379`
- conclusion : SUCCESS

Validation smartphone restante :

- réduire Drakon adverse à 0 PV ;
- vérifier disparition visuelle du Drakon ;
- vérifier apparition automatique de Marai adverse ;
- vérifier que le nom, les PV et le visuel correspondent au nouveau membre.


## Chantier actif — hit-impact-feedback-v7

Base GREEN :

`07665e46983a1977de8f39c4525ce4b14a343ea5`

Checkpoint de départ :

`checkpoint/lab-start-hit-impact-feedback-v7-2026-09-25`

Branche de travail :

`work/lab-hit-impact-feedback-v7-2026-09-25`

Retour utilisateur :

- le recul `hit` existe déjà ;
- il manque un feedback visuel immédiat au moment où la créature subit l'impact ;
- objectif demandé : petit clignotement / coloration rouge lisible, en attendant de futurs sprites/FX plus riches.

Objectif :

- ajouter un canal visuel `filter` au contrat `AnimationPlan` ;
- piloter le flash d'impact depuis le profil de créature, pas depuis l'UI ;
- appliquer le flash uniquement pendant l'animation `hit` puis restaurer l'apparence normale ;
- conserver KO, dégâts, timing d'impact, roster et logique de combat inchangés.

Propriétaires autorisés :

- Creature Profile : paramètres du flash `hit` ;
- Animation Core : segment `hit` avec filter ;
- Render Adapter DOM : traduction du canal filter vers Web Animations ;
- tests Animation/Renderer ;
- documentation.

Fichiers autorisés :

- `data/profiles/*.profile.json` ;
- `src/core/animation/animation-plan.js` ;
- `src/core/animation/plan-animation.js` ;
- `src/adapters/renderer/dom-keyframes.js` ;
- `src/adapters/renderer/dom-actor-renderer.js` si restauration du canal nécessaire ;
- tests unitaires correspondants ;
- documentation laboratoire.

Fonctions protégées :

- aucun changement de `Action Resolver` ;
- aucun changement de PV/dégâts ;
- aucun changement de `impactAtMs` ;
- aucun changement du KO/remplacement ;
- aucun changement de `Combat Runtime` ;
- aucun code spécifique GenSrpG/Capture.

Tests prévus :

- le plan `hit` contient un filter d'impact fourni par le profil ;
- le segment de récupération revient à `filter: none` ;
- le DOM timeline expose le filter ;
- le renderer restaure `filter: none` après une animation transitoire ;
- KO terminal reste fonctionnel ;
- CI complète verte.

Risque principal :

- laisser un filtre résiduel après Hit ou KO.

Critère de fin :

- CI verte ;
- checkpoint GREEN ;
- preview smartphone où une créature touchée affiche un flash rouge bref au moment de l'impact puis revient immédiatement à son rendu normal.


## Résultat technique — hit-impact-feedback-v7

Implémentation :

- `AnimationPlan` possède maintenant un canal visuel `filter` neutre et renderer-agnostic ;
- les profils `serpentine` et `drake` configurent le feedback `hit` via :
  - `brightness` ;
  - `saturate` ;
  - `sepia` ;
  - `hueRotateDeg` ;
- le planner `hit` applique ce filter uniquement pendant le recul d'impact ;
- le segment de récupération revient à un filter neutre ;
- le DOM Render Adapter est l'unique propriétaire de la traduction vers CSS ;
- le renderer restaure explicitement `filter: none` après les animations transitoires ;
- le comportement terminal KO reste inchangé et protégé.

Sentinelles ajoutées :

- le planner consomme les paramètres `hit.filter` du profil ;
- la timeline DOM démarre neutre, applique le flash puis revient neutre ;
- le renderer ne laisse aucun filtre résiduel après Hit ;
- le KO terminal conserve toujours son état final.

CI du HEAD fonctionnel :

- run : `36120512640`
- conclusion : SUCCESS

Validation smartphone restante :

- toucher Marai puis Drakon ;
- vérifier un flash rouge bref exactement au moment du recul `hit` ;
- vérifier que la coloration disparaît immédiatement après ;
- vérifier qu'un KO continue à disparaître puis être remplacé normalement.


## Validation utilisateur — hit-impact-feedback-v7

Retour smartphone du 2026-09-25 :

- flash d'impact validé visuellement par Sylvain ;
- KO/remplacement précédemment validé ;
- V7 peut servir de base fonctionnelle au chantier UI suivant.

## Chantier actif — fullscreen-player-ui-v8

Base GREEN :

`b97b161cc8172ece1fa902dcbbe9a840147bd8ea`

Checkpoint de départ :

`checkpoint/lab-start-fullscreen-player-ui-v8-2026-09-25`

Branche de travail :

`work/lab-fullscreen-player-ui-v8-2026-09-25`

Référence ergonomique fournie par Sylvain :

- arène presque plein écran ;
- HUD adverse fixé en haut à droite ;
- HUD joueur fixé en bas à gauche ;
- capacités principales sous forme de grosses touches de jeu directement pressables ;
- nom de capacité conservé pour le moment ;
- future compatibilité icône seule ou icône + nom ;
- boutons Objets / Équipe / déplacement intégrés dans la même UI de combat.

Objectif du lot :

- transformer uniquement la couche joueur de la démo en HUD de combat plein écran ;
- détacher les informations PV/charge des conteneurs mobiles des créatures ;
- garder les créatures et leurs déplacements dans l'arène ;
- intégrer toutes les commandes dans l'arène ;
- conserver le vrai chemin existant des compétences et commandes.

Propriétaire :

- Demo UI pour la structure, les contrôles et la projection visuelle ;
- aucun transfert d'autorité depuis Combat Runtime / Combat Session / Roster Session.

Fichiers autorisés :

- `examples/dom-demo/index.html` ;
- `examples/dom-demo/demo.css` ;
- `src/ui/combat-test-ui.js` uniquement pour projeter noms/états dans le nouveau HUD et conserver les boutons data-driven ;
- `tests/unit/demo-ui-boundary.test.mjs` ;
- documentation laboratoire.

Domaines protégés :

- `src/core/combat/**` ;
- `src/core/animation/**` ;
- `src/core/fx/**` ;
- `src/adapters/renderer/**` ;
- contrats de compétences/commandes ;
- dégâts, portée, coûts, énergie, impact, KO, remplacement roster ;
- dépôt `Zombicide-40k`.

Tests prévus :

- l'arène contient directement le HUD et les commandes joueur ;
- les quatre capacités restent directement visibles et data-driven ;
- Objets / Équipe restent accessibles dans l'arène ;
- les trois commandes de distance restent présentes ;
- PV, énergie et charge restent projetés depuis l'état/runtime ;
- noms actifs joueur/adversaire proviennent du roster, sans duplication métier ;
- aucune logique de résolution n'est ajoutée à l'UI ;
- sentinelles KO/impact/timing inchangées via CI complète.

Risques :

- masquer une commande sur petit écran ;
- gêner les interactions par superposition ;
- faire bouger le HUD avec les créatures ;
- réduire excessivement la zone de combat en portrait.

Critère de fin :

- CI verte ;
- checkpoint GREEN ;
- preview smartphone où l'arène occupe presque tout l'écran et où les capacités se jouent comme des touches directement intégrées au HUD.


## Résultat technique — fullscreen-player-ui-v8

Implémentation candidate :

- l'arène occupe maintenant le viewport du laboratoire ;
- le HUD joueur et le HUD adverse sont fixés aux bords de l'arène et ne suivent plus les déplacements des créatures ;
- les capacités principales restent générées depuis les données de compétences mais sont présentées comme quatre touches de jeu permanentes ;
- le nom reste visible aujourd'hui ; la structure CSS permet une future couche d'icônes sans changer le Runtime ;
- énergie, charge et temps restant continuent de venir du Combat Runtime ;
- Objets, Équipe et les trois distances restent intégrés dans l'arène ;
- les réserves restent visibles sous forme compacte ;
- le nom affiché du combattant actif est projeté depuis le snapshot du Roster Session ;
- aucune règle de portée, coût, dégâts, KO ou remplacement n'a été déplacée vers l'UI.

Revue du diff depuis V7 GREEN :

- `docs/LAB_CURRENT_WORK.md` ;
- `docs/LAB_ROADMAP.md` ;
- `examples/dom-demo/index.html` ;
- `examples/dom-demo/demo.css` ;
- `src/ui/combat-test-ui.js` ;
- `tests/unit/demo-ui-boundary.test.mjs`.

Aucun fichier `src/core/**`, contrat gameplay, FX ou renderer n'a été modifié.

CI du HEAD fonctionnel :

- SHA : `43b02576f799d6ddc20f3bed5b6a1d00b5b4123d` ;
- run : `36121781493` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- validation smartphone V8 obligatoire avant checkpoint GREEN final.

À tester sur smartphone :

1. l'arène remplit pratiquement tout l'écran ;
2. les quatre capacités ressemblent à des touches de jeu et restent immédiatement pressables ;
3. PV joueur/adversaire restent lisibles ;
4. énergie et charge restent lisibles ;
5. Courte / Moyenne / Longue restent accessibles ;
6. Objets et Équipe s'ouvrent sans masquer durablement les capacités ;
7. les créatures restent visibles et leurs attaques/KO/flash d'impact continuent à fonctionner.


## Retour smartphone V8 — compacité des capacités

Validation partielle :

- la direction plein écran est meilleure ;
- le bloc de capacités est encore trop volumineux et mange trop l'arène.

Référence ergonomique confirmée :

- dans la référence fournie, les capacités sont des touches/icônes compactes alignées ;
- le laboratoire conserve temporairement le nom de la capacité dans chaque touche ;
- les métadonnées techniques (forme, élément, charge, trajet) ne doivent plus occuper la surface principale des touches ;
- le dock de commandes doit rester compact et ancré en bas à droite, y compris sur smartphone.

Correction autorisée dans le même lot V8 non encore GREEN :

- CSS de présentation des capacités et du dock ;
- sentinelles UI de compacité ;
- aucune modification du Runtime, des règles, des données de compétence ou des handlers.

Critère visuel supplémentaire :

- quatre capacités immédiatement accessibles avec une empreinte nettement inférieure à la candidate V8 précédente ;
- davantage d'arène visible derrière et autour du dock.


## Correction ergonomique V8 — dock capacités compact

Suite au test smartphone de Sylvain :

- les touches de capacités de la première candidate V8 étaient trop grandes ;
- elles consommaient trop de surface de combat par rapport à la référence fournie.

Correction :

- quatre touches carrées conservées en permanence ;
- disposition sur une seule rangée ;
- nom de la capacité conservé ;
- métadonnées secondaires masquées sur la touche principale ;
- structure prête à recevoir ultérieurement une icône ;
- dock global réduit et maintenu en bas à droite sur mobile ;
- commandes de distance et menus secondaires compactés sans modifier leurs handlers.

Sentinelle ajoutée :

- quatre colonnes obligatoires ;
- touches `aspect-ratio: 1` ;
- métadonnées secondaires non affichées dans la touche ;
- aucun retour en grille 2x2 dans le breakpoint mobile principal.

CI :

- SHA fonctionnel : `c39345ba6c0debf51e7cb61cd84d22efddc2c705` ;
- run : `36122256673` ;
- conclusion : SUCCESS.

Statut :

- V8 toujours en validation smartphone ;
- aucun checkpoint GREEN final tant que la compacité réelle n'est pas validée par Sylvain.


## Retour smartphone V8 — hiérarchie visuelle encore trop dense

Capture smartphone analysée le 2026-09-25.

Constat :

- le problème n'est plus seulement la taille des quatre capacités ;
- trop de blocs sont visibles simultanément ;
- HUD joueur, réserves, statut, énergie, capacités, distances et menus secondaires ont encore tous leur propre surface ;
- le HUD joueur remonte trop haut parce que le dock inférieur reste trop profond ;
- la référence cible utilise au contraire des informations plates aux bords et un dock de commandes très compact.

Correction autorisée dans V8 :

- supprimer le bandeau décoratif `Combat Capture` ;
- compacter les cartes PV joueur/adversaire ;
- masquer complètement l'affichage de charge lorsqu'il est inactif et le faire apparaître uniquement pendant une préparation réelle ;
- rendre les réserves icon-only dans la vue principale ;
- supprimer le titre visuel `Capacités` ;
- placer les quatre capacités et Objets/Équipe sur la même ligne fonctionnelle ;
- garder la distance dans une ligne segmentée très compacte ;
- maintenir joueur bas-gauche et commandes bas-droite sans empilement vertical.

Domaines protégés inchangés :

- aucun Core ;
- aucun Runtime ;
- aucune règle gameplay ;
- aucun calcul de disponibilité, coût, distance ou KO dans le CSS/HTML.


## Correction ergonomique V8 — hiérarchie simplifiée après capture smartphone

Résultat du lot :

- suppression du bandeau décoratif supérieur ;
- cartes joueur/adversaire aplaties ;
- labels `JOUEUR / ADVERSAIRE` masqués pour réduire le bruit visuel ;
- charge et barre de charge masquées quand inactives ;
- barre de charge active conservée à la hauteur V6 validée de `0.56rem` ;
- réserves réduites à des portraits circulaires icon-only ;
- noms de réserve conservés en `title` / `aria-label` ;
- titre visuel `Capacités` supprimé ;
- quatre capacités conservées en touches carrées permanentes ;
- Objets / Équipe placés verticalement à droite des capacités ;
- distance réduite à une ligne segmentée compacte ;
- statut transformé en toast minimal en haut-centre ;
- HUD joueur bas-gauche et dock commandes bas-droite pour éviter l'empilement.

Revue du diff depuis la candidate précédente :

- `docs/LAB_CURRENT_WORK.md` ;
- `examples/dom-demo/index.html` ;
- `examples/dom-demo/demo.css` ;
- `src/ui/combat-test-ui.js` uniquement pour l'accessibilité des portraits de réserve ;
- `tests/unit/demo-ui-boundary.test.mjs`.

Aucun Core, Runtime, contrat gameplay, FX, renderer, dégâts, KO ou roster n'a été modifié.

Sentinelles :

- HUD simplifié sans topbar décorative ;
- charge inactive réellement absente ;
- réserves icon-only ;
- quatre capacités permanentes ;
- Objets / Équipe sur deux lignes verticales adjacentes ;
- ancienne sentinelle V6 de hauteur de charge active préservée.

CI :

- SHA : `a14f2eacb3ca1372c190caa1c49a165f31b540ab` ;
- run : `36123016098` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- validation smartphone toujours requise avant checkpoint GREEN V8 final.


## Sous-lot actif V8 — spatial-reserve-fix

Base technique :

`4381de6b248a3cc3d04dbe8c7adcdd2879721ad3`

Checkpoint de départ :

`checkpoint/lab-start-v8-spatial-reserve-fix-2026-09-25`

Branche :

`work/lab-v8-spatial-reserve-fix-2026-09-25`

Retour smartphone :

- l'UI générale est nettement meilleure ;
- les portraits de créatures disponibles restent partiellement masqués ;
- la projection Courte / Moyenne / Longue manque de profondeur : le Presenter ne pilote actuellement que l'axe horizontal.

Diagnostic :

1. `.reserve` est en `z-index: 11` alors que les cartes de combat sont en `z-index: 12` ; lorsqu'ils se chevauchent, les portraits passent derrière le HUD ;
2. `DomDistancePresenter` ne possède qu'un ancrage X par slot/distance ; aucun ancrage Y n'existe ;
3. les positions verticales sont actuellement figées par CSS (`bottom` joueur / `top` adversaire), donc une transition de distance ne peut pas produire la diagonale demandée.

Objectifs :

- rendre les portraits de réserve visibles au-dessus des cartes sans créer une nouvelle couche UI ;
- faire posséder les ancrages X/Y au `DomDistancePresenter` ;
- joueur :
  - longue = bas-gauche ;
  - moyenne = plus proche du centre et légèrement plus haut ;
  - courte = encore plus proche du centre et plus haut, sans coller la cible ;
- adversaire :
  - longue = haut-droite ;
  - moyenne = plus proche du centre et légèrement plus bas ;
  - courte = encore plus proche du centre et plus bas ;
- conserver l'invariant : seul le combattant qui change la distance bouge visuellement.

Propriétaires autorisés :

- Demo UI/CSS : ordre de couche et présentation des portraits ;
- `DomDistancePresenter` : ancrages visuels X/Y/scale ;
- tests du Presenter et sentinelles UI ;
- documentation.

Fichiers autorisés :

- `examples/dom-demo/demo.css` ;
- `src/adapters/renderer/dom-distance-presenter.js` ;
- `tests/unit/dom-distance-presenter.test.mjs` ;
- `tests/unit/demo-ui-boundary.test.mjs` ;
- documentation.

Domaines protégés :

- Combat State et distance sémantique ;
- coûts de déplacement ;
- Combat Runtime ;
- Action Resolver ;
- Animation Core ;
- dégâts, impact, KO et Roster Session ;
- dépôt `Zombicide-40k`.

Tests prévus :

- portraits de réserve au-dessus des cartes de combat ;
- ancrages joueur ordonnés en X : longue < moyenne < courte ;
- ancrages joueur ordonnés en Y : longue > moyenne > courte ;
- ancrages adversaire miroir en X : longue > moyenne > courte ;
- ancrages adversaire ordonnés en Y : longue < moyenne < courte ;
- déplacement d'un slot ne modifie pas l'autre ;
- reset restaure les ancrages moyens X/Y ;
- CI complète verte.

## Pré-audit futur — IA adverse

Aucun code IA dans ce sous-lot.

Briques déjà disponibles :

- `Combat Runtime.startSkill()` accepte un `actorId` ;
- `Combat Runtime.previewReaction()` et `react()` existent ;
- compétences de réaction de laboratoire déjà présentes :
  - Esquive ;
  - Bouclier miroir ;
  - Immunité feu ;
  - Riposte.

Architecture cible envisagée :

`Combat State/Session snapshot -> Opponent Decision Controller -> preview légale -> Combat Runtime / Session -> Presenter`

Le futur contrôleur IA :

- ne possédera pas une deuxième horloge de combat ;
- ne calculera pas lui-même dégâts, portée ou coûts ;
- choisira uniquement parmi des actions déjà validées par les propriétaires existants ;
- pourra d'abord gérer réactions, déplacements et choix de compétence ;
- devra être testable avec une décision déterministe/injectable avant toute notion de hasard.

Point à traiter dans le futur lot IA :

- le Runtime possède actuellement une seule action active globale, ce qui convient aux réactions via `react()`, mais le HUD de charge devra devenir actor-aware avant d'afficher proprement une charge initiée par l'adversaire.


## Résultat technique — V8 spatial-reserve-fix

Corrections :

- portraits de réserve élevés au-dessus des cartes de combat dans l'ordre des couches ;
- le `DomDistancePresenter` possède désormais des ancrages X/Y explicites en plus du scale ;
- le CSS ne possède plus l'autorité verticale sur les positions de distance ;
- les fighters utilisent un centre d'ancrage `translate(-50%, -50%)` ;
- les transitions animent maintenant `left` et `top`.

Ancrages joueur :

- longue : X 0.16 / Y 0.72 ;
- moyenne : X 0.28 / Y 0.64 ;
- courte : X 0.39 / Y 0.56.

Ancrages adversaire :

- longue : X 0.84 / Y 0.24 ;
- moyenne : X 0.72 / Y 0.32 ;
- courte : X 0.61 / Y 0.40.

Invariant conservé :

- seul le combattant qui change la distance change d'ancrage et de scale.

Sentinelles :

- ordre X/Y joueur ;
- ordre X/Y adversaire ;
- slot stationnaire inchangé ;
- reset moyen X/Y ;
- portraits de réserve au-dessus du HUD ;
- positions verticales détenues par le Presenter.

CI :

- SHA fonctionnel : `10674f96d7e2265fd0017ff9fbeb7c6365c32f13` ;
- run : `36123908044` ;
- conclusion : SUCCESS.

Pré-audit IA :

- le Runtime peut déjà lancer une compétence avec `actorId: "opponent"` ;
- `previewReaction()` / `react()` fournissent le vrai chemin de réaction ;
- les données de réaction nécessaires existent déjà ;
- trois raccords sont à généraliser dans V9 : charge actor-aware, routing Presenter actor/target, KO joueur.

Statut :

- GREEN technique ;
- validation smartphone des portraits et des trois positions requise avant checkpoint GREEN final de ce sous-lot.


## Retour smartphone V8 — perspective d'échelle inversée à corriger

Validation utilisateur :

- trajectoire diagonale joueur validée ;
- comportement adversaire pas encore testable manuellement ;
- défaut identifié : la taille actuelle suit encore l'ancienne logique `short > medium > long`, alors que la perspective écran demandée est l'inverse.

Règle visuelle cible corrigée après clarification utilisateur :

La perspective est celle de la caméra du joueur, donc les deux camps n'utilisent pas la même courbe de scale.

- joueur :
  - `long` = bas-gauche, proche de la caméra joueur = plus gros ;
  - `medium` = intermédiaire ;
  - `short` = plus près du centre et plus loin de la caméra joueur = plus petit ;
- adversaire :
  - `long` = haut-droite, le plus loin de la caméra joueur = plus petit ;
  - `medium` = intermédiaire ;
  - `short` = plus près du centre et donc plus proche de la caméra joueur = plus gros.

Courbes visuelles prévues :

- joueur : `long 1.08 -> medium 0.98 -> short 0.88` ;
- adversaire : `long 0.88 -> medium 0.98 -> short 1.08`.

Correction autorisée :

- `DomDistancePresenter` uniquement pour la projection de scale ;
- tests du Presenter ;
- documentation.

Interdits :

- aucun changement de distance sémantique ;
- aucun changement de coût de mouvement ;
- aucun changement des coordonnées X/Y validées ;
- aucun changement du Combat Runtime ou de l'IA.


## Résultat technique — perspective d'échelle V8 corrigée

Clarification utilisateur appliquée :

La perspective est évaluée depuis la caméra joueur.

Courbe joueur :

- longue : `1.08` ;
- moyenne : `0.98` ;
- courte : `0.88`.

Donc le joueur est plus gros en bas-gauche et rétrécit en allant vers le centre.

Courbe adversaire :

- longue : `0.88` ;
- moyenne : `0.98` ;
- courte : `1.08`.

Donc l'adversaire est petit très loin en haut-droite et grossit lorsqu'il se rapproche du centre / de la caméra joueur.

Implémentation :

- `SCALE_BY_DISTANCE` remplacé par `SCALE_BY_SLOT_AND_DISTANCE` ;
- les ancrages X/Y validés restent inchangés ;
- seul le scale du slot qui se déplace change ;
- aucune règle de distance, coût, runtime ou gameplay modifiée.

Sentinelle ajoutée :

- joueur : `long > medium > short` ;
- adversaire : `long < medium < short` ;
- reset moyen : `0.98` pour les deux.

CI :

- SHA fonctionnel : `55005de38860b17ada66a42b0f3b15c3b36072b7` ;
- run : `36124553487` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- validation smartphone du rendu de perspective toujours requise avant checkpoint GREEN final V8.


## Retour smartphone V8 — portraits de roster mal positionnés

Capture utilisateur analysée :

- positions et échelles de distance validées ;
- les portraits roster sont visibles mais flottent encore sur les coins des cartes PV ;
- l'état initial de charge affiche encore visuellement `Prêt` + une barre vide avant la première action.

Diagnostic :

- les réserves sont positionnées absolument indépendamment des cartes de combattant ;
- leur position peut donc chevaucher une carte dont la hauteur varie ;
- le HTML initial ne déclare pas explicitement `data-active="false"` sur les surfaces de charge.

Correction autorisée :

- rattacher chaque mini-roster à l'en-tête de sa carte de combattant ;
- conserver les mêmes hooks `data-roster-reserve` et le même propriétaire Roster Session ;
- rendre l'état de charge initial explicitement inactif ;
- aucune modification des distances X/Y/scale validées ;
- aucun changement gameplay.


## Résultat technique — portraits roster intégrés au HUD

Correction appliquée :

- les mini-rosters joueur/adversaire ne flottent plus indépendamment dans l'arène ;
- chaque mini-roster est maintenant intégré à l'en-tête de sa carte de combattant ;
- les hooks `data-roster-reserve` sont inchangés : `Roster Session` reste l'unique propriétaire des membres actifs/réserve ;
- les portraits restent circulaires, compacts et accessibles ;
- aucun chevauchement possible avec les barres PV/charge dû à une variation de hauteur de carte ;
- l'état initial de charge est explicitement `data-active="false"`, donc `Prêt` et la barre vide ne sont plus affichés avant une vraie préparation.

Domaines inchangés :

- positions X/Y validées ;
- courbes de scale validées ;
- coûts/distance sémantique ;
- Combat Runtime ;
- KO/roster ;
- IA future.

Sentinelles :

- roster adversaire inclus dans l'en-tête HUD adverse ;
- roster joueur inclus dans l'en-tête HUD joueur ;
- charge initiale inactive ;
- réserve en position statique dans la carte ;
- ancienne sentinelle `z-index 13` supprimée car devenue obsolète.

CI :

- SHA fonctionnel : `a47ef2251637ae393feb9d43adb8581a48a4449e` ;
- run : `36125018103` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- validation smartphone du placement final des portraits toujours requise avant checkpoint GREEN V8 final.


## Correctif V8 — mini-roster adverse masqué

Retour utilisateur :

- mini-roster joueur validé ;
- mini-roster adverse absent.

Cause prouvée :

- après l'intégration des portraits dans les en-têtes HUD, une règle CSS incomplète a créé involontairement le groupe :
  `.reserve--opponent, .reserve__title { display: none; }` ;
- la réserve adverse entière était donc masquée ;
- la réserve joueur n'était pas concernée.

Correction autorisée :

- restaurer une règle commune neutre pour `.reserve--opponent, .reserve--player` ;
- conserver `display: none` uniquement sur `.reserve__title` ;
- ajouter une sentinelle empêchant `.reserve--opponent` d'être masqué.

Aucun autre comportement V8 ne doit changer.


## Résultat technique — roster adverse restauré

Cause corrigée :

- le sélecteur CSS cassé qui masquait `.reserve--opponent` a été remplacé ;
- `.reserve--opponent` et `.reserve--player` utilisent désormais la même règle neutre d'intégration au HUD ;
- seul `.reserve__title` reste masqué ;
- le mini-roster joueur validé n'a pas été modifié ;
- aucune position X/Y, courbe de scale, commande ou règle gameplay n'a changé.

Sentinelle ajoutée :

- la règle `.reserve--opponent` ne peut plus contenir `display: none`.

CI :

- SHA : `c5c28383d6208134992ffd29ca6539006b6b77cb` ;
- run : `36125333292` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- validation smartphone du mini-roster adverse requise avant clôture V8.


## Validation fonctionnelle utilisateur — V8

Validation smartphone reçue le 2026-09-25 :

- HUD plein écran validé ;
- capacités compactes validées ;
- portraits joueur validés ;
- portraits adverses restaurés et validés ;
- positions Courte / Moyenne / Longue validées ;
- perspective d'échelle joueur/adversaire validée.

Décision :

- V8 est déclarée fonctionnellement GREEN ;
- aucune fusion sur `main` ;
- le prochain chantier partira exclusivement du checkpoint GREEN V8.


## Validation utilisateur finale — V8

Retour smartphone du 2026-09-25 :

- interface plein écran validée ;
- capacités compactes validées ;
- hiérarchie visuelle simplifiée validée ;
- distances joueur Courte / Moyenne / Longue validées ;
- perspective d'échelle validée ;
- portraits joueur validés ;
- portraits adverses restaurés puis validés ;
- KO / remplacement / feedback d'impact précédemment validés et protégés.

Conclusion :

V8 est fonctionnellement validé sur smartphone et peut devenir la base GREEN du chantier V9 IA adverse.

Checkpoint GREEN final attendu :

`checkpoint/lab-fullscreen-player-ui-v8-green-2026-09-25`


## Chantier actif — opponent-ai-linear-v9

Base GREEN obligatoire :

`checkpoint/lab-fullscreen-player-ui-v8-green-2026-09-25`

SHA de base :

`1ea7cd4e1ae244ee3dc5912dc91ab47e5d4ee94e`

Checkpoint de départ :

`checkpoint/lab-start-opponent-ai-linear-v9-2026-09-25`

Branche :

`work/lab-opponent-ai-linear-v9-2026-09-25`

Objectif :

- rendre l'adversaire autonome dans la démo réelle ;
- commencer par une politique linéaire/déterministe afin que chaque décision soit reproductible ;
- faire utiliser à l'IA exclusivement les APIs existantes du Combat Session / Combat Runtime ;
- observer réactions, déplacements, charges, attaques, dégâts, KO et remplacement dans le vrai chemin navigateur.

Architecture cible :

`Combat State + policy -> Opponent Decision Controller -> preview existante -> Combat Runtime / Combat Session -> Presenter`

Comportement V9 initial :

1. pendant une compétence joueur, l'IA tente une réaction compatible selon une politique déclarative ;
2. après une action joueur terminée, l'IA obtient une décision ;
3. la politique possède un plan offensif linéaire :
   - compétence cible ;
   - distance préférée ;
4. si la compétence planifiée est légale maintenant, l'IA la lance via `runtime.startSkill()` ;
5. sinon, si la distance est différente et le déplacement légal, l'IA avance d'un seul palier vers la distance préférée ;
6. sinon l'IA attend ;
7. le plan avance seulement après une compétence adverse effectivement lancée ;
8. aucun hasard dans ce premier lot.

Politique de test envisagée :

- réactions :
  - Feu -> Immunité feu ;
  - Projectile -> Bouclier miroir ;
  - contact au sol -> Riposte ;
  - autre contact -> Esquive ;
- cycle offensif :
  - Griffe à courte ;
  - Boule de feu à moyenne ;
  - Plongeon aérien à longue ;
  - Frappe téléportée à moyenne.

Pré-requis techniques inclus :

- progression Runtime actor-aware : `actorId` / `targetId` ;
- progression de réaction actor-aware pour afficher la charge adverse ;
- résolution skill expose `actorId` / `targetId` ;
- Presenter UI route selon les vrais slots de la résolution et non plus selon `player -> opponent` en dur ;
- KO / remplacement générique pour joueur ou adversaire afin qu'une attaque IA puisse réellement mettre le joueur KO.

Propriétaires :

- policy data : configuration IA uniquement ;
- Opponent Decision Controller : choix de l'action adverse ;
- Combat Runtime : seule horloge réelle ;
- Combat Session / Rules : légalité, énergie, distance, dégâts et réactions ;
- Roster Session : remplacement KO ;
- Presenter / Visual Controller : rendu uniquement ;
- Demo UI : déclenchement joueur et projection des décisions déjà prises.

Fichiers autorisés :

- `data/combat/ai/linear-opponent.policy.json` ;
- `src/contracts/opponent-ai-policy.js` ;
- `src/core/combat/opponent-decision-controller.js` ;
- `src/core/combat/combat-runtime.js` ;
- `src/core/combat/action-resolver.js` ;
- `src/ui/combat-test-ui.js` ;
- tests unitaires / intégration correspondants ;
- documentation laboratoire.

Domaines protégés :

- timings d'impact existants ;
- formule de dégâts ;
- Animation Core ;
- FX Core ;
- profils créatures ;
- positions / scales V8 ;
- structure HUD V8 ;
- règles de distance et coûts ;
- `main` ;
- dépôt `Zombicide-40k`.

Interdits :

- aucun `setInterval` IA ;
- aucun `setTimeout` IA servant de seconde horloge gameplay ;
- aucun clic DOM simulé ;
- aucun calcul de dégâts/portée/énergie dans le contrôleur ;
- aucun choix aléatoire dans le premier prototype ;
- aucune action IA si le Runtime possède déjà une action active.

Tests prévus :

- policy normalisée et invalide rejetée ;
- réaction Feu / projectile / contact choisie via `runtime.previewReaction()` ;
- aucune réaction impossible ou trop chère n'est forcée ;
- plan offensif choisit une compétence seulement après `session.previewSkill()` ;
- déplacement IA passe uniquement par `session.move()` ;
- un seul palier est parcouru par décision de mouvement ;
- Runtime progress expose le vrai actorId ;
- HUD charge joueur/adversaire suit l'acteur réel ;
- Presenter reçoit les slots réels pour une attaque adverse ;
- attaque adverse réelle retire les PV joueur uniquement à l'impact ;
- KO joueur -> Hit -> KO -> Roster Session -> remplacement ;
- CI complète verte.

Risques :

- déclencher deux décisions IA pour une seule action joueur ;
- lancer une attaque IA avant la fin visuelle du Hit/KO précédent ;
- laisser l'UI redevenir propriétaire des règles ;
- masquer la charge du mauvais combattant ;
- boucle IA auto-entretenue après sa propre résolution.

Critère de fin :

- CI verte ;
- vrai test navigateur où l'adversaire réagit, se déplace et attaque ;
- dégâts joueur à l'impact ;
- KO/remplacement joueur fonctionnel ;
- validation smartphone ;
- checkpoint GREEN V9.


## Résultat technique candidat — opponent-ai-linear-v9

Implémentation :

- policy adverse déterministe stockée dans `data/combat/ai/linear-opponent.policy.json` ;
- contrat dédié `Opponent AI Policy` ;
- contrôleur `Opponent Decision Controller` séparé de l'UI ;
- aucune horloge IA, aucun clic simulé, aucun calcul parallèle de dégâts/portée/coût ;
- réactions choisies uniquement après `runtime.previewReaction()` ;
- attaques choisies uniquement après `session.previewSkill()` ;
- mouvements choisis uniquement après `session.previewMovement()` puis exécutés par `session.move()` ;
- un mouvement IA ne parcourt qu'un palier par décision ;
- Combat Runtime reste propriétaire de l'unique action active.

Réactions linéaires du prototype :

1. élément Feu -> Immunité feu ;
2. projectile -> Bouclier miroir ;
3. contact au sol -> Riposte ;
4. autre contact -> Esquive.

Cycle offensif du prototype :

1. Griffe à courte ;
2. Boule de feu à moyenne ;
3. Plongeon aérien à longue ;
4. Frappe téléportée à moyenne ;
5. boucle.

Raccord navigateur :

- la charge HUD suit désormais le vrai `actorId` ;
- une réaction adverse utilise également le HUD de charge adverse ;
- release et résolution Presenter utilisent `actorId / targetId` réels ;
- une attaque adverse anime donc le slot adverse vers le joueur ;
- KO/remplacement est générique pour `player` ou `opponent` ;
- après une résolution joueur, l'IA reçoit exactement une décision ;
- après une résolution IA, elle ne s'auto-enchaîne pas ;
- après un déplacement joueur, l'IA reçoit exactement une décision.

Vrai chemin protégé :

`joueur skill -> Runtime -> AI reaction preview/react -> impact -> résolution -> AI decision -> movement -> AI skill -> Runtime -> impact joueur -> Presenter -> KO joueur -> Roster replacement`

Tests V9 :

- validation de policy ;
- décision déplacement/attaque ;
- réaction réelle via Runtime ;
- réaction impossible non forcée ;
- Runtime occupé bloque le tour normal IA ;
- actor/target propagés dans progress et résolution ;
- attaque IA retire les PV joueur uniquement à impact ;
- KO joueur -> Hit -> KO -> remplacement réel par la réserve ;
- UI sans `runtime.react()` direct ni `setInterval`.

CI du HEAD fonctionnel :

- SHA : `cf6c713ea41b2bf649fd3940f91d1828b6aba85b` ;
- run : `36126896334` ;
- conclusion : SUCCESS.

Revue du diff depuis V8 GREEN :

- données policy IA ;
- contrat policy ;
- contrôleur de décision ;
- extension actor-aware minimale de Runtime / résolution ;
- raccord Demo UI ;
- tests unitaires et intégration ;
- documentation.

Aucun changement :

- Animation Core ;
- FX Core ;
- profils créatures ;
- positions / scales V8 ;
- structure HUD V8 ;
- formules de dégâts ;
- coûts de déplacement ;
- `main` ;
- `Zombicide-40k`.

Statut :

- GREEN technique ;
- validation smartphone obligatoire avant checkpoint GREEN V9 final.

Test utilisateur attendu :

1. lancer une compétence joueur et observer une réaction adverse si elle est légale et financée ;
2. après l'action joueur, observer une décision IA ;
3. le premier objectif IA est Griffe à courte : elle se rapproche d'un palier si nécessaire, puis utilisera Griffe lors d'une décision ultérieure ;
4. vérifier la charge adverse ;
5. vérifier que les dégâts joueur arrivent au moment de l'impact adverse ;
6. continuer plusieurs échanges pour observer le cycle Griffe -> Boule de feu -> Plongeon -> Téléportation ;
7. si le joueur tombe à 0 PV, vérifier Hit -> KO -> remplacement automatique par sa réserve.


## Correctif actif V9 — normal-offense-fix

Retour smartphone utilisateur :

- les PV adverses semblent ne jamais diminuer ;
- l'IA déclenche trop souvent des réactions défensives ;
- `Riposte` est perçue comme une capacité inconnue et beaucoup trop rapide ;
- l'adversaire doit d'abord utiliser les capacités offensives normales déjà visibles dans le prototype.

Diagnostic démontré :

La policy V9 candidate couvrait pratiquement chaque capacité joueur :

- Boule de feu -> Immunité feu ;
- Griffe au sol -> Riposte ;
- Plongeon aérien -> Esquive ;
- Frappe téléportée -> Esquive.

Conséquence :

tant que l'adversaire avait assez d'énergie, le joueur pouvait légitimement observer zéro perte de PV adverse malgré des attaques répétées.

Origine de `Riposte` :

- ancien skill de réaction du laboratoire : `data/combat/skills/contact-counter.skill.json` ;
- créé initialement pour tester le système de contre Contact ;
- préparation 400 ms ;
- ce n'est pas une des quatre capacités offensives principales de la démo joueur.

Décision corrective :

- conserver le moteur de réactions comme capacité laboratoire générique ;
- retirer toutes les réactions automatiques de la policy IA active V9 ;
- ne pas supprimer les fichiers de réaction du laboratoire ;
- l'adversaire actif utilise uniquement le cycle offensif normal :
  1. Griffe ;
  2. Boule de feu ;
  3. Plongeon aérien ;
  4. Frappe téléportée ;
- déplacement vers la distance nécessaire inchangé ;
- aucune modification du calcul de dégâts ou du rendu HP tant que leur faute n'est pas démontrée.

Base du correctif :

`a05b872adf44cf4c55a85cbb4c2960141ccb48e0`

Checkpoint départ :

`checkpoint/lab-start-v9-normal-offense-fix-2026-09-25`

Branche :

`work/lab-v9-normal-offense-fix-2026-09-25`

Fichiers autorisés :

- policy IA active ;
- chargement UI des réactions devenues inutiles pour cette policy ;
- tests policy / décision / vrai chemin ;
- documentation.

Tests obligatoires :

- policy active : zéro réaction automatique ;
- Boule de feu joueur à moyenne -> hit réel -> adversaire 100 -> 70 PV ;
- après cette résolution, l'IA prend une décision offensive normale ;
- le moteur de réaction générique reste testable avec une policy dédiée de test ;
- aucun changement aux formules HP/dégâts ;
- CI complète verte.

Critère de sortie :

- preview smartphone où les attaques joueur peuvent réellement enlever des PV ;
- plus aucune `Riposte` automatique dans le combat normal ;
- IA visible utilisant déplacement + quatre capacités offensives ;
- validation utilisateur avant GREEN V9 final.


## Résultat technique — V9 normal-offense-fix

Correction appliquée :

- la policy IA active possède désormais `reactionRules: []` ;
- aucune Riposte, Immunité feu, Esquive ou Bouclier miroir n'est déclenché automatiquement dans le combat normal ;
- les anciens skills de réaction restent disponibles dans le laboratoire pour de futurs profils spécialisés ;
- la démo normale ne charge plus ces skills de réaction ;
- le contrôleur IA conserve son architecture générique et son moteur de réactions testable séparément.

Cycle offensif adverse conservé :

1. Griffe à courte ;
2. Boule de feu à moyenne ;
3. Plongeon aérien à longue ;
4. Frappe téléportée à moyenne.

Preuve dégâts / HP :

- test vrai chemin joueur Boule de feu à moyenne ;
- aucune réaction automatique ;
- outcome : `hit` ;
- PV adversaire : `100 -> 70` ;
- la perte de PV provient toujours de Combat Rules à l'impact ;
- aucun changement n'a été effectué dans les formules de dégâts ni dans `renderHp()`.

Moteur de réaction préservé :

- une policy dédiée de test peut encore activer Immunité feu ;
- Runtime preview/react reste l'autorité ;
- une réaction trop coûteuse reste refusée.

CI du correctif :

- SHA : `cad79a564914e766ec37b5a0b38812b617205897` ;
- run : `36128018910` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique du correctif ;
- V9 reste en attente de validation smartphone ;
- pas de checkpoint GREEN V9 final avant validation utilisateur.


## Invariant confirmé — compétences 100 % configurables

Clarification utilisateur du 2026-09-25 :

GenSrpG doit rester data-driven. Aucun comportement IA, UI ou animation ne doit embarquer des valeurs gameplay cachées qui appartiennent à une compétence.

Doivent être configurables au niveau de la définition de compétence :

- coût énergie ;
- `preparationMs` ;
- `travelMs` ;
- `recoveryMs` ;
- futur `cooldownMs` ;
- dégâts / puissance ;
- distances autorisées ;
- forme / élément / `approachMode` ;
- futurs paramètres de charge, usages limités ou autres contraintes de disponibilité.

Conséquences architecture :

- l'IA lit ces valeurs mais ne les invente pas ;
- l'UI les affiche mais ne les calcule pas ;
- Combat Runtime reste l'unique propriétaire du temps réel ;
- Combat Rules / Session restent propriétaires de la légalité ;
- tout futur cooldown sera ajouté au contrat Skill Definition et à l'état de combat, jamais codé en dur dans l'IA ;
- les profils d'animation ne doivent contenir que des paramètres visuels, pas des règles gameplay.

Pour le correctif IA actuel :

- aucune valeur de cooldown n'est introduite ;
- le futur comportement « attaque rapide ou économie pour une compétence forte » devra s'appuyer uniquement sur les coûts/puissances/timings déclarés dans les skills.


## Sous-lot actif V9 — ground-perspective-approach

Base :

`f7b6bf1fe9a2e5c5ad7106c0feb5abb6300b886e`

Checkpoint départ :

`checkpoint/lab-start-v9-ground-perspective-approach-2026-09-25`

Branche :

`work/lab-v9-ground-perspective-approach-2026-09-25`

Retour utilisateur :

- le déplacement spatial V8 est validé ;
- lorsqu'un adversaire utilise une attaque de contact au sol comme Griffe et se rapproche du joueur, sa taille continue à paraître trop faible / à rétrécir ;
- visuellement, un acteur qui descend vers la caméra joueur doit grossir ;
- un acteur qui remonte vers le fond de l'arène doit rétrécir.

Cause :

- `ground-attack` applique seulement `impactScaleX/Y` fixes depuis le profil ;
- le planner ne connaît pas actuellement la profondeur relative parcourue dans l'arène ;
- aucune modulation de perspective n'est appliquée pendant l'approche.

Objectif :

- ajouter au metadata visuel la hauteur réelle de l'arène ;
- calculer dans Animation Core un multiplicateur de perspective depuis `targetTranslateY / arenaHeight` ;
- garder la force et les limites de cet effet dans le profil visuel, donc entièrement configurables ;
- appliquer ce multiplicateur uniquement à l'approche contact au sol dans ce sous-lot ;
- préserver `travelMs` et l'impact exact.

Configuration visuelle prévue par profil :

- `perspectiveScaleStrength` ;
- `perspectiveScaleMin` ;
- `perspectiveScaleMax`.

Propriétaires autorisés :

- Visual Controller : géométrie réelle / `arenaHeight` ;
- Creature Profile : paramètres de perspective visuelle ;
- Animation Core : composition du scale transitoire ;
- tests spéciaux d'animation ;
- documentation.

Interdits :

- aucun changement aux dégâts ;
- aucun changement à `impactAtMs` ;
- aucun changement aux distances X/Y V8 ;
- aucun changement aux scales de position V8 ;
- aucune logique gameplay dans le profil visuel ;
- aucun changement IA dans ce sous-lot.

Tests prévus :

- approche vers le bas => multiplicateur > 1 ;
- approche vers le haut => multiplicateur < 1 ;
- bornes min/max respectées ;
- durée du segment d'approche reste exactement `travelMs` ;
- retour maison reste scale 1 ;
- CI complète verte.


## Résultat technique — ground-perspective-approach

Implémentation :

- le Visual Controller transmet désormais `arenaHeight` depuis la géométrie réelle de l'arène ;
- `ground-attack` calcule un ratio de profondeur depuis `targetTranslateY / arenaHeight` ;
- le multiplicateur est entièrement piloté par le profil visuel :
  - `perspectiveScaleStrength: 0.8` ;
  - `perspectiveScaleMin: 0.82` ;
  - `perspectiveScaleMax: 1.22` ;
- ces valeurs sont configurables séparément dans chaque profil de créature ;
- mouvement vers le bas / caméra joueur -> scale augmente ;
- mouvement vers le haut / profondeur -> scale diminue ;
- `travelMs` reste strictement inchangé ;
- retour à la position d'origine reste scale 1.

Sentinelles :

- approche caméra > scale d'impact de base ;
- approche profondeur < scale d'impact de base ;
- limites min/max respectées ;
- impact reste à la fin exacte de `travelMs` ;
- géométrie d'arène reste visuelle et ne dépend pas des données gameplay.

CI :

- SHA : `d41cebb5fa4fa057f694b8586b53ecf9d1d6386d` ;
- run : `36129110718` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- validation smartphone requise dans la prochaine preview combinée V9.


## Sous-lot actif V9 — energy-strategy

Base :

`b64c037fecb6e89e3b270850847e1fd5b16661cc`

Checkpoint départ :

`checkpoint/lab-start-v9-energy-strategy-2026-09-25`

Branche :

`work/lab-v9-energy-strategy-2026-09-25`

Retour utilisateur :

- l'IA normale est désormais plus cohérente mais reste trop passive ;
- comportement attendu :
  - attaquer avec une compétence rapide si l'énergie le permet ;
  - sinon pouvoir économiser pour une compétence plus forte ;
- les futurs cooldowns doivent être configurés sur les skills et non codés dans l'IA.

Diagnostic :

- Drakon commence à 0 énergie et recharge 1 énergie toutes les 2 s ;
- son déplacement coûte 3 énergie par palier ;
- l'ancien cycle pouvait donc dépenser toute l'énergie en mouvement avant même une attaque ;
- le contrôleur ne distinguait pas « attaque rapide » et « économie pour attaque forte ».

Objectif :

- ajouter une stratégie énergie data-driven à la policy IA ;
- ne jamais dupliquer les coûts/dégâts/timings des compétences dans la policy ;
- alterner des décisions `quick` / `strong` configurables ;
- `quick` :
  - choisir parmi une liste de skills rapides configurée dans la policy ;
  - utiliser la première compétence légale et finançable à la distance actuelle ;
- `strong` :
  - choisir parmi une liste de skills forts configurée dans la policy ;
  - si la meilleure compétence légale n'est pas finançable, attendre et conserver l'énergie ;
- si un déplacement est nécessaire :
  - calculer le coût réel via `session.previewMovement()` ;
  - ne déplacer que si l'énergie couvre mouvement + coût du skill ciblé ;
- aucune valeur de coût, dommage, temps ou cooldown du skill dans le code IA.

Policy prévue :

- `decisionModes: ["quick", "strong"]` ;
- `quickSkillIds: ["claw", "aerial-dive"]` ;
- `strongSkillIds: ["fireball", "teleport-strike"]`.

Déclenchement temps réel :

- si l'IA répond `saving`, le Demo UI attend une future mise à jour d'état issue du Combat Runtime ;
- quand l'énergie augmente et que Runtime est libre, la décision est réévaluée ;
- aucun `setTimeout` / `setInterval` IA ajouté.

Fichiers autorisés :

- policy IA ;
- contrat policy ;
- Opponent Decision Controller ;
- Demo UI uniquement pour réessayer une décision `saving` sur `onState` ;
- tests unitaires / intégration ;
- documentation.

Domaines protégés :

- Skill Definition existante hors futur cooldown séparé ;
- dégâts ;
- Combat Runtime comme horloge ;
- Animation Core ;
- FX ;
- V8 spatialité ;
- HUD structure ;
- `main` ;
- `Zombicide-40k`.

Tests prévus :

- policy stratégie énergie normalisée ;
- quick utilise un skill rapide abordable ;
- strong attend si énergie insuffisante ;
- strong attaque dès énergie suffisante ;
- déplacement refusé si mouvement + skill non financés ;
- déplacement autorisé si budget complet disponible ;
- mode avance uniquement après un skill effectivement lancé ;
- `saving` peut être réévalué depuis une mise à jour Runtime sans timer IA ;
- CI complète verte.


## Résultat technique — V9 energy-strategy

Policy active :

- `decisionModes: ["quick", "strong"]` ;
- `quickSkillIds: ["claw", "aerial-dive"]` ;
- `strongSkillIds: ["fireball", "teleport-strike"]`.

Règles :

- mode `quick` :
  - cherche d'abord une compétence rapide compatible avec la distance actuelle ;
  - vérifie sa vraie légalité via `session.previewSkill()` ;
  - utilise son vrai `energyCost` depuis `SkillDefinition` ;
- mode `strong` :
  - vise une compétence forte compatible avec la distance actuelle ;
  - si l'énergie est insuffisante, retourne `saving` et ne dépense rien ;
  - le mode ne change pas tant que la compétence forte n'est pas réellement lancée ;
- si aucun skill du mode courant n'est utilisable à la distance actuelle :
  - sélection d'une distance autorisée depuis `skill.allowedDistances` ;
  - coût du déplacement obtenu depuis `session.previewMovement()` ;
  - aucun déplacement si `movementCost + skill.energyCost` n'est pas finançable.

Déclenchement énergie :

- Demo UI conserve uniquement l'état `aiWaitingForEnergy` ;
- une mise à jour `onState` provenant du Combat Runtime peut relancer la décision ;
- garde `aiDecisionInProgress` contre toute ré-entrée ;
- aucun `setTimeout` / `setInterval` ajouté à l'IA.

Preuves :

- quick à moyenne avec 2 énergie -> Plongeon aérien ;
- strong à moyenne avec 2 énergie -> `saving` pour Boule de feu à 3 énergie ;
- après une recharge réelle de 1 énergie -> Boule de feu démarre ;
- déplacement Griffe moyen -> court :
  - énergie 4 -> aucun mouvement, économie ;
  - énergie 5 -> mouvement coût 3, reste 2 pour Griffe ;
- le mode avance uniquement après un skill réellement lancé.

Configurabilité :

- la policy classe les skills comme rapides / forts ;
- les valeurs gameplay restent exclusivement dans les fichiers skill ;
- futur cooldown documenté comme champ de Skill Definition / Combat State, jamais comme valeur IA cachée.

CI :

- SHA fonctionnel : `5daccdb850696e1887b31c02e077905af975fa25` ;
- run : `36129830241` ;
- conclusion : SUCCESS.

Le HEAD documenté `958006ba89c169d7687d754eabca3a05d580b879` conserve la même implémentation fonctionnelle et aligne également la roadmap sur cette architecture.

Statut :

- GREEN technique ;
- validation smartphone requise avant checkpoint GREEN V9 final.


## Sous-lot actif V9 — concurrent-actions-ko-swap

Base technique :

`5332a94188995cd76850de8ee394fba25b227fcc`

Checkpoint de départ :

`checkpoint/lab-start-v9-concurrent-actions-ko-swap-2026-09-25`

Branche :

`work/lab-v9-concurrent-actions-ko-swap-2026-09-25`

Retour utilisateur :

- pendant une attaque adverse, le joueur est actuellement complètement figé ;
- comportement attendu : chaque combattant peut préparer / lancer sa propre action en parallèle si son énergie et les règles le permettent ;
- exemple cible :
  - adversaire commence Griffe ;
  - joueur peut lancer Téléportation pendant cette action ;
  - chaque action garde sa propre timeline ;
  - l'impact qui arrive réellement en premier est résolu en premier ;
- défaut KO séparé :
  - après le KO, l'ancien visuel peut réapparaître brièvement avant que le remplaçant soit affiché.

Diagnostic prouvé :

1. `Combat Runtime` possède un unique enregistrement `active` global ;
2. `canStartAction()` refuse toute nouvelle action tant que cet enregistrement existe ;
3. Demo UI désactive capacités / déplacement / commandes avec `runtime.hasActiveAction`, donc une action adverse bloque le joueur ;
4. `setCreatureFor()` restaure immédiatement l'opacité du renderer lors d'un remplacement alors que le nouvel asset image peut ne pas être encore rendu ; l'ancien bitmap peut donc apparaître brièvement avant le nouveau.

Objectif micro-lot A — actions concurrentes :

- remplacer l'unique action active par une action active maximum par acteur ;
- autoriser joueur et adversaire à agir en parallèle ;
- interdire toujours deux actions simultanées pour le même acteur ;
- conserver une seule horloge Combat Runtime ;
- trier release / impact par leur timestamp absolu afin que l'ordre réel soit déterministe ;
- chaque impact applique les règles sur l'état de combat courant, jamais sur un snapshot ancien ;
- exposer :
  - `hasActiveActionFor(actorId)` ;
  - `activeActionFor(actorId)` ;
  - `activeActions` ;
- conserver `hasActiveAction` comme « au moins une action existe » pour compatibilité ;
- UI joueur ne doit être désactivée que si le joueur lui-même possède une action active ou si une transition KO/roster l'interdit ;
- IA ne doit être bloquée que par sa propre action active.

Règle de dynamique initiale :

- recevoir un simple `hit` ne supprime pas automatiquement l'action concurrente ;
- un effet explicitement interruptif reste propriétaire de l'interruption ;
- un KO annule immédiatement les actions encore actives de ce slot afin qu'aucune action d'un membre mort ne puisse frapper après son remplacement ;
- les actions ciblant un slot KO sont également annulées avant remplacement afin qu'un ancien projectile ne touche pas la créature de réserve qui vient d'entrer.

Objectif micro-lot B — remplacement KO sans flash de l'ancien visuel :

- conserver le slot KO visuellement disparu ;
- masquer l'image avant changement de `src` ;
- ne réafficher l'image qu'une fois le nouvel asset prêt ;
- ne jamais restaurer l'ancien bitmap visible entre KO et nouveau membre ;
- Roster Session reste seul propriétaire du choix du remplaçant.

Propriétaires autorisés :

- Combat Runtime : actions temporelles concurrentes et annulation KO ;
- Combat Session / Action Resolver : inchangés sauf test d'intégration ; ils appliquent déjà les résolutions sur l'état courant ;
- Opponent Decision Controller : lecture actor-local de l'état Runtime ;
- Demo UI : disponibilité actor-local et projection des progressions ;
- Visual Controller / Asset Input : remplacement visuel atomique du slot ;
- Roster Session : inchangé ;
- tests + documentation.

Fichiers autorisés :

- `src/core/combat/combat-runtime.js` ;
- `src/core/combat/opponent-decision-controller.js` ;
- `src/ui/combat-test-ui.js` ;
- `src/ui/demo-app.js` ;
- tests unitaires / intégration correspondants ;
- documentation laboratoire.

Domaines protégés :

- SkillDefinition et données des compétences ;
- coûts / dégâts / portée ;
- positions et scales V8 ;
- Animation Core / FX Core sauf comportement déjà appelé ;
- choix du roster ;
- `main` ;
- dépôt `Zombicide-40k`.

Tests prévus :

- joueur et adversaire peuvent avoir chacun une action active simultanément ;
- une deuxième action du même acteur est refusée ;
- impact le plus tôt est résolu le premier même si son action a commencé plus tard ;
- une action concurrente non touchée par un interrupt reste active après l'impact adverse ;
- un KO annule les actions restantes du slot KO et les actions encore ciblées sur ce slot ;
- UI ne désactive pas les capacités joueur lorsque seule l'action adverse est active ;
- IA n'est pas bloquée par une action joueur si l'adversaire est libre ;
- barres de charge peuvent afficher deux actions simultanément ;
- remplacement KO n'expose jamais l'ancien asset entre disparition et nouvel asset prêt ;
- CI complète verte.

Risques :

- ordre de résolution faux lorsque deux impacts tombent dans le même tick ;
- une progression d'un acteur efface visuellement la barre de charge de l'autre ;
- une ancienne action survit au remplacement roster ;
- collision visuelle entre une animation d'attaque et une animation Hit sur le même acteur : ce point doit rester explicitement observé au test mobile et ne doit pas être masqué par une rustine.

Critère de fin :

- CI verte ;
- vrai test navigateur : attaque adverse en cours + compétence joueur lancée simultanément ;
- impacts réellement ordonnés par le temps ;
- pas de verrou global UI ;
- remplacement KO sans réapparition de l'ancien monstre ;
- validation smartphone avant GREEN final.


## Résultat technique candidat — V9 concurrent-actions-ko-swap

Micro-lot A — concurrence réelle :

- `Combat Runtime` ne possède plus une action globale unique ;
- il conserve au maximum une action active par `actorId` ;
- API ajoutée :
  - `hasActiveActionFor(actorId)` ;
  - `activeActionFor(actorId)` ;
  - `activeActions` ;
- `hasActiveAction` reste disponible et signifie seulement qu'au moins une action existe ;
- une deuxième action du même acteur reste refusée ;
- un autre acteur libre peut démarrer une compétence en parallèle ;
- release et impact sont ordonnés par timestamp absolu dans chaque tick ;
- chaque résolution utilise l'état courant du Combat Session ;
- un KO annule les actions restantes du slot KO et les actions encore ciblées sur ce slot avant remplacement roster.

Raccord IA :

- l'Opponent Decision Controller vérifie uniquement `hasActiveActionFor(policy.actorId)` ;
- une compétence joueur en cours ne bloque donc plus mécaniquement la décision adverse ;
- le moteur de réactions peut cibler explicitement l'action attaquante via `againstActorId`.

Raccord UI :

- les quatre compétences joueur sont verrouillées uniquement lorsque `player` possède lui-même une action active ;
- pendant une Griffe adverse, une compétence joueur légale et financée reste pressable ;
- les deux barres de charge sont projetées indépendamment ;
- la fin d'une action n'efface plus la barre de l'autre acteur ;
- dans ce premier jalon :
  - déplacement ;
  - Objet ;
  - Rappel ;
  - Invocation
  restent globalement verrouillés tant qu'une action existe.

Vrai chemin protégé :

`adversaire Griffe t=0 -> joueur Téléportation t=500 -> Téléportation impact t=1820 -> Griffe reste active -> Griffe impact t=2700`

Résultat test :

- après Téléportation :
  - adversaire 100 -> 76 PV ;
  - joueur encore 100 PV ;
  - Griffe adverse toujours active ;
- après Griffe :
  - joueur 100 -> 82 PV.

Invariant :

- frapper avant l'adversaire ne supprime pas automatiquement son attaque ;
- seule une règle explicitement interruptive ou un KO peut l'annuler.

Micro-lot B — remplacement KO atomique :

Cause du flash ancien visuel :

- changer `img.src` n'efface pas nécessairement immédiatement l'ancien bitmap rendu ;
- le renderer restaurait son état visible avant que le nouvel asset soit prêt.

Correction :

- l'image du slot est masquée avant le changement de source ;
- l'ancien `src` est retiré ;
- un token de chargement protège contre une réponse d'asset obsolète ;
- `assetReady` devient vrai uniquement après le `load` du nouvel asset ou si l'image est déjà réellement disponible en cache ;
- l'image n'est réaffichée que si le slot est visible ET le nouvel asset prêt ;
- Roster Session reste seul propriétaire du membre de remplacement.

Tests sentinelles :

- deux actions de deux acteurs simultanées ;
- deuxième action même acteur refusée ;
- impact plus rapide résolu avant une action commencée plus tôt ;
- action concurrente non interrompue reste active ;
- KO annule les actions survivantes liées au slot ;
- IA actor-local ;
- disponibilité UI skill actor-local ;
- barres de charge actor-local ;
- remplacement visuel ne réaffiche pas l'ancien bitmap ;
- vrai chemin Griffe adverse + Téléportation joueur concurrente.

CI fonctionnelle avant synchronisation docs :

- SHA : `6c2a32dce25359e3c1986eadff65b3e1227ad546` ;
- run : `36131885180` ;
- conclusion : SUCCESS.

Risques explicitement conservés pour test smartphone :

- si un acteur est touché alors que sa propre animation d'attaque est en cours, le renderer mono-canal peut faire entrer en concurrence l'animation Hit et l'animation d'approche ;
- ce point doit être observé visuellement et fera l'objet d'un sous-lot séparé seulement si la régression est réellement constatée.

Statut :

- GREEN technique ;
- validation smartphone obligatoire avant checkpoint GREEN final V9.


## Sous-lot actif V9 — autonomy-mobility-evasion

Base technique :

`c11e2badc050b3a4f6723d6b690cdeda8ee6541b`

Checkpoint de départ :

`checkpoint/lab-start-v9-autonomy-mobility-evasion-2026-09-25`

Branche :

`work/lab-v9-autonomy-mobility-evasion-2026-09-25`

Retour utilisateur :

1. malgré la concurrence des compétences, l'adversaire semble encore attendre une action joueur avant d'attaquer ;
2. une attaque devrait pouvoir rater si, à son impact, la cible est absente de sa position parce qu'elle exécute une mobilité évasive, par exemple Téléportation ou Plongeon aérien.

Diagnostic A — autonomie IA :

- `runtime.start()` émet bien un état initial ;
- mais Demo UI ne rappelle `runOpponentTurn()` depuis `onState` que si `aiWaitingForEnergy === true` ;
- cette variable vaut faux au démarrage ;
- l'IA reçoit donc sa première décision surtout après une résolution ou un déplacement joueur ;
- le Runtime concurrent n'est pas en faute : c'est le raccord de décision qui n'initialise pas l'autonomie adverse.

Objectif A :

- démarrer la prise de décision adverse depuis les mises à jour d'état du Combat Runtime ;
- aucune seconde horloge IA ;
- l'IA agit dès qu'elle est libre et que sa policy / énergie le permettent ;
- si elle doit économiser, elle continue d'attendre les ticks énergie du Runtime ;
- une action joueur ne doit plus être nécessaire pour réveiller l'adversaire ;
- garde anti-réentrée conservée.

Diagnostic B — esquive par mobilité :

- actuellement `Action Resolver` considère une attaque sans réaction explicite comme `hit` ;
- le Runtime connaît pourtant simultanément l'action de la cible et son temps relatif ;
- il manque un contrat gameplay permettant à une compétence de déclarer qu'elle rend son utilisateur hors cible pendant une fenêtre temporelle.

Objectif B :

- ajouter une configuration data-driven à `SkillDefinition` :
  - `evasion.window` : première valeur supportée `travel` ;
  - `evasion.incomingForms` : formes entrantes évitées ;
- aucune valeur d'esquive codée dans l'UI ;
- Téléportation et Plongeon aérien du prototype déclarent une esquive pendant leur trajet ;
- Griffe reste non évasive ;
- Combat Runtime fournit uniquement le contexte de l'action concurrente de la cible ;
- Action Resolver décide `evaded` si, au timestamp exact de l'impact entrant :
  - la cible possède une compétence active ;
  - cette compétence déclare une fenêtre `travel` ;
  - son elapsed est compris entre release et impact ;
  - la forme de l'attaque entrante est listée dans `incomingForms`;
- aucun dégât n'est appliqué dans ce cas.

Règle temporelle initiale :

- préparation de la compétence mobile : cible encore présente, donc pas d'esquive ;
- trajet `release <= elapsed <= impact` : esquive active ;
- après résolution de sa propre action : l'esquive cesse ;
- aucune prolongation implicite pendant le retour purement visuel.

Exemples attendus :

- Griffe arrive pendant le trajet de Téléportation -> `evaded`, 0 dégât ;
- Griffe arrive pendant la préparation de Téléportation -> hit normal ;
- Boule de feu peut également être évitée si `projectile` est déclaré dans `incomingForms`;
- une compétence non configurée n'esquive rien.

Propriétaires autorisés :

- Skill Contract / données skill : définition de la fenêtre d'esquive ;
- Combat Runtime : contexte temporel concurrent seulement ;
- Combat Session / Action Resolver : décision sémantique `evaded` ;
- Opponent Decision Controller / Demo UI : autonomie adverse depuis l'horloge existante ;
- Presenter : réutilisation du résultat `evaded` sans calcul gameplay ;
- tests + documentation.

Fichiers autorisés :

- `src/contracts/skill-definition.js` ;
- `data/combat/skills/*.skill.json` concernés ;
- `src/core/combat/combat-runtime.js` ;
- `src/core/combat/combat-session.js` ;
- `src/core/combat/action-resolver.js` ;
- `src/ui/combat-test-ui.js` ;
- tests unitaires / intégration ;
- documentation.

Domaines protégés :

- Animation Core ;
- FX Core ;
- dégâts de base ;
- énergie / coûts ;
- positions/scales ;
- Roster Session ;
- `main` ;
- `Zombicide-40k`.

Tests prévus :

- IA démarre sans action joueur dès qu'un tick Runtime lui donne assez d'énergie ;
- aucune seconde horloge ou timer IA ;
- joueur et IA restent capables d'agir simultanément ;
- SkillDefinition normalise l'esquive mobilité ;
- compétence sans evasion reste inchangée ;
- impact pendant préparation mobile -> hit ;
- impact pendant trajet mobile -> `evaded`, 0 dégât ;
- impact après fin de l'action mobile -> hit ;
- Téléportation et Plongeon utilisent les données configurées ;
- vrai chemin navigateur : IA autonome + contre-mobilité ;
- CI complète verte.

Risques :

- relancer l'IA trop souvent depuis `onState` ;
- faire de Combat Runtime une seconde autorité de résultat ;
- ambiguïté aux impacts exactement simultanés ;
- une animation Hit pourrait encore visuellement interrompre une mobilité même si le résultat gameplay devient `evaded` : Presenter ne doit jouer Hit que sur `hit`.

Critère de fin :

- l'IA initie seule le combat sans clic joueur ;
- une mobilité configurée peut réellement faire rater une attaque au moment de l'impact ;
- aucune logique d'esquive dans UI/Animation ;
- CI verte ;
- preview smartphone ;
- validation utilisateur avant checkpoint GREEN final.


## Résultat technique candidat — V9 autonomy-mobility-evasion

Autonomie adverse :

- la cause du comportement « l'IA attend que le joueur agisse » était le raccord UI ;
- `onState` ne relançait auparavant l'IA que si `aiWaitingForEnergy` avait déjà été positionné par une décision précédente ;
- au démarrage, cette condition était fausse ;
- désormais toute mise à jour d'état du Combat Runtime peut provoquer une décision adverse si :
  - `opponentAi` existe ;
  - l'adversaire n'a pas déjà une action active ;
  - aucune transition KO n'est en cours ;
  - aucune décision IA n'est déjà en ré-entrée ;
- aucune horloge, `setInterval` ou `setTimeout` IA ajouté ;
- le flag `aiWaitingForEnergy` devenu inutile a été supprimé ;
- avec énergie initiale 0, l'IA peut donc :
  - décider immédiatement d'économiser ;
  - recevoir les ticks énergie du Runtime ;
  - lancer seule une compétence dès qu'elle devient finançable.

Mobilité évasive configurable :

- nouveau champ normalisé `SkillDefinition.evasion` :
  - `window` : `travel` ;
  - `incomingForms` : liste des formes entrantes évitées ;
- compétence sans configuration :
  - `window: null` ;
  - `incomingForms: []` ;
  - aucun changement de comportement ;
- Téléportation et Plongeon aérien du prototype :
  - fenêtre `travel` ;
  - évitent `contact` et `projectile`.

Chaîne d'autorité :

`Skill data -> Runtime concurrent timing context -> Combat Session -> Action Resolver -> semantic outcome evaded -> Presenter`

Le Runtime ne décide pas du résultat :

- il récupère l'action active de la cible ;
- calcule son elapsed au timestamp absolu exact de l'impact entrant ;
- transmet ce contexte à Combat Session.

Action Resolver décide `evaded` uniquement si :

1. l'action de la cible est une compétence ;
2. elle déclare `evasion.window = "travel"` ;
3. la forme entrante est listée ;
4. l'impact entrant tombe entre release et impact de la compétence mobile.

Effet :

- outcome `evaded` ;
- aucun événement `hit` ;
- aucun PV retiré ;
- `evasionApplied` expose l'id de la compétence mobile responsable.

Vrai chemin protégé :

- Griffe adverse à courte : impact t=2700 ;
- Téléportation joueur démarre à t=1450 ;
- release Téléportation t=2650 ;
- impact Téléportation t=2770 ;
- à t=2700 la Griffe arrive pendant le travel Téléportation ;
- résultat Griffe : `evaded` ;
- joueur reste à 100 PV ;
- Téléportation reste active puis impacte à t=2770.

Cas négatifs protégés :

- Téléportation encore en préparation lors de l'impact -> Griffe touche ;
- Téléportation déjà résolue avant l'impact -> Griffe touche ;
- compétence sans `evasion` -> comportement historique inchangé ;
- fenêtre non supportée refusée par le contrat.

CI du vrai chemin après correction du test de portée :

- SHA : `d97643e77b5f82c02529ae676c9eb3b0724c59f4` ;
- run : `36133842247` ;
- conclusion : SUCCESS.

Nettoyage suivant :

- suppression du flag UI obsolète `aiWaitingForEnergy` ;
- aucune modification gameplay associée.

Statut :

- GREEN technique ;
- documentation synchronisée ;
- validation smartphone obligatoire avant checkpoint GREEN final V9.


## Sous-lot actif V9 — projectile-target-evasion-feedback

Base technique :

`a61e96c0e2d691088a7f999cb3c0c6f43a5debda`

Checkpoint de départ :

`checkpoint/lab-start-v9-projectile-target-evasion-feedback-2026-09-25`

Branche :

`work/lab-v9-projectile-target-evasion-feedback-2026-09-25`

Retour utilisateur :

- lorsque la cible exécute une mobilité aérienne, la Boule de feu adverse vise visuellement la créature en l'air ;
- pour la Boule de feu classique du prototype, ce comportement n'est pas souhaité ;
- une future capacité spéciale de projectile suiveur / anti-aérien pourra en revanche exploiter volontairement ce type de ciblage ;
- l'utilisateur a du mal à confirmer visuellement si une esquive enlève réellement 0 PV.

Diagnostic :

1. `dom-skill-fx.js` calcule actuellement la destination du projectile depuis le même anchor animé `[data-demo-motion]` utilisé pour les mouvements transitoires ;
2. une cible en Plongeon / Téléportation déplace donc physiquement cet anchor et la Boule de feu prend cette position transitoire comme destination ;
3. Combat Rules est déjà protégé par test : `outcome = evaded` n'applique aucun dégât ;
4. il manque cependant :
   - un test spécifique projectile réel `Boule de feu -> Téléportation -> evaded -> 0 PV` ;
   - un feedback utilisateur non ambigu indiquant explicitement `0 dégât`.

Objectif A — ciblage projectile classique :

- conserver la source du projectile sur la position visuelle réelle du lanceur ;
- viser la position stable du slot cible, indépendante de son animation transitoire ;
- aucune modification des règles de hit/esquive ;
- préparer le renderer à accepter séparément :
  - `sourceAnchors` visuels/transitoires ;
  - `targetAnchors` stables ;
- ne pas implémenter encore un projectile homing gameplay sans contrat dédié.

Objectif B — lisibilité de l'esquive :

- le résultat `evaded` affiche clairement `Esquive · 0 dégât` ;
- aucun Hit visuel ne doit être joué ;
- aucun PV ne doit changer ;
- ajouter un vrai test d'intégration avec la Boule de feu, pas seulement Griffe.

Propriétaires autorisés :

- FX Renderer : choix géométrique source / cible ;
- Demo UI : wiring des anchors et libellé de résultat ;
- tests ;
- documentation.

Domaines protégés :

- Action Resolver et règle d'esquive déjà validée ;
- Combat Runtime ;
- Animation Core ;
- Roster Session ;
- coûts, dégâts et timings ;
- positions/scales V8 hors point stable utilisé comme cible FX ;
- `main` ;
- dépôt `Zombicide-40k`.

Tests prévus :

- projectile source = anchor animé du lanceur ;
- projectile destination = anchor stable de la cible ;
- cible visuellement déplacée vers le haut n'entraîne plus une destination aérienne pour le projectile classique ;
- Boule de feu à l'impact pendant travel Téléportation -> `evaded` ;
- PV joueur inchangés ;
- statut UI contient explicitement `0 dégât` pour `evaded` ;
- aucune logique de dégâts ajoutée dans FX/UI ;
- CI complète verte.

Critère de fin :

- Boule de feu classique ne vise plus une cible transitoirement en l'air ;
- esquive projectile vérifiable sans ambiguïté par le joueur ;
- CI verte ;
- preview smartphone ;
- validation utilisateur avant checkpoint GREEN final.


## Résultat technique candidat — V9 projectile-target-evasion-feedback

Ciblage projectile :

Cause prouvée :

- le renderer projectile utilisait `[data-demo-motion]` à la fois comme source et comme cible ;
- cet élément subit les transformations transitoires des attaques aériennes / téléportées ;
- une Boule de feu pouvait donc viser visuellement la position haute de la cible.

Correction :

- `createDomSkillFxRenderer()` accepte maintenant :
  - `anchors` : positions visuelles/transitoires utilisées pour la source ;
  - `targetAnchors` : positions stables utilisées pour la destination ;
- Demo UI fournit :
  - source = `[data-demo-motion]` ;
  - destination = `fighterContainers` stables ;
- une Boule de feu classique part donc bien du lanceur visible mais vise la position stable attendue de la cible ;
- aucun calcul de hit/esquive n'a été ajouté au renderer.

Test géométrique :

- cible motion simulée à `top=20` ;
- slot stable cible à `top=120` ;
- le projectile utilise explicitement la destination stable ;
- le test interdit l'ancienne trajectoire aérienne.

Esquive projectile :

Un vrai test d'intégration utilise désormais la Boule de feu elle-même :

- distance moyenne ;
- Boule de feu adverse démarre à t=0 ;
- Téléportation joueur démarre à t=1450 ;
- release Téléportation à t=2650 ;
- impact Boule de feu à t=2700 ;
- impact Téléportation à t=2770 ;
- au moment de l'impact Boule de feu, le joueur est dans `travel` Téléportation ;
- outcome = `evaded` ;
- `evasionApplied = "teleport-strike"` ;
- aucun événement `hit` ;
- PV joueur = 100 avant et après.

Lisibilité :

- le statut UI `evaded` devient explicitement :
  - `Esquive · 0 dégât`
- l'objectif est de rendre le résultat vérifiable sur smartphone sans interpréter uniquement l'animation.

Extension future notée :

- projectile générique actuel = ciblage classique sur slot stable ;
- une capacité future `tracking / homing / anti-air` pourra être ajoutée comme stratégie distincte et configurable ;
- elle ne doit pas devenir le comportement implicite de toutes les compétences projectile.

CI :

- test FX stable target : SUCCESS ;
- test intégration Boule de feu -> Téléportation -> 0 PV : SUCCESS ;
- test feedback UI : SUCCESS ;
- SHA fonctionnel : `f4bb8c6c6a315d3a2fe555ddf96118faa4301a06` ;
- run : `36139675583` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- validation smartphone requise avant checkpoint GREEN final.


## Sous-lot actif V9 — miss-impact-feedback

Base technique :

`6cd66f9688405e697815152ac4abf0070ecd934d`

Checkpoint de départ :

`checkpoint/lab-start-v9-miss-impact-feedback-2026-09-25`

Branche :

`work/lab-v9-miss-impact-feedback-2026-09-25`

Retour utilisateur :

- le résultat d'esquive est désormais cohérent ;
- pour une lecture immédiate en combat, afficher `RATÉ` directement à l'endroit où l'impact aurait dû avoir lieu serait plus clair.

Objectif :

- conserver `Esquive · 0 dégât` dans le statut global ;
- ajouter un feedback FX local `RATÉ` au point d'impact prévu ;
- ce feedback est purement visuel et n'a aucune autorité sur le résultat ;
- il doit apparaître uniquement pour `resolution.outcome === "evaded"`.

Architecture :

`Combat Rules -> semantic outcome evaded -> Combat Resolution Presenter -> FX intent miss -> DOM Skill FX Renderer`

Propriétaires :

- Combat Rules : inchangé, décide toujours `evaded` ;
- Presenter : traduit le résultat sémantique en intention FX `miss` ;
- FX Renderer : positionne et anime le label ;
- Demo CSS : style du label uniquement.

Fichiers autorisés :

- `src/core/fx/skill-fx-plan.js` ;
- `src/adapters/renderer/combat-resolution-presenter.js` ;
- `src/adapters/renderer/dom-skill-fx.js` ;
- `examples/dom-demo/demo.css` ;
- tests FX / Presenter ;
- documentation.

Domaines protégés :

- Combat Runtime ;
- Action Resolver ;
- SkillDefinition ;
- calcul des PV ;
- trajectoire projectile ;
- positions / scales ;
- Roster Session ;
- `main` ;
- `Zombicide-40k`.

Tests prévus :

- outcome `evaded` génère une intention FX `miss` ;
- outcome `hit` ne génère pas ce feedback ;
- renderer place `RATÉ` sur l'anchor cible stable ;
- le label est nettoyé après animation ;
- aucune modification des PV / règles ;
- CI complète verte.

Critère de fin :

- `RATÉ` visible localement à l'impact manqué ;
- statut `Esquive · 0 dégât` conservé ;
- CI verte ;
- preview smartphone ;
- validation utilisateur.


## Résultat technique — V9 miss-impact-feedback

Implémentation :

- nouvel intent FX `miss` produit uniquement lorsque `resolution.outcome === "evaded"` ;
- Combat Resolution Presenter relaie cet intent sans recalculer le résultat ;
- DOM Skill FX Renderer affiche `RATÉ` au centre de l'anchor stable de la cible ;
- animation courte :
  - apparition ;
  - légère montée ;
  - disparition ;
- durée visuelle : 650 ms ;
- statut global `Esquive · 0 dégât` conservé.

Invariants :

- outcome `hit` ne produit aucun `RATÉ` ;
- aucun calcul de PV/dégât dans FX ou CSS ;
- point du label = point d'impact stable ;
- nettoyage du node après animation ;
- compatible avec projectile et attaque de contact puisque le feedback dépend du résultat sémantique, pas de la forme.

Tests :

- `evaded` -> intent `miss` ;
- `hit` -> aucun intent `miss` ;
- Presenter n'appelle aucun Hit visuel pour `evaded` ;
- renderer affiche exactement `RATÉ` au bon anchor ;
- node temporaire supprimé après animation ;
- CSS du feedback protégé comme couche purement visuelle.

CI :

- SHA fonctionnel : `c56954e25ef21b1bcb6d26343d034400aeb96853` ;
- run : `36140647607` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- validation smartphone requise avant checkpoint GREEN final V9.


## Chantier actif — asset-library-architecture

Base technique :

`42bcf128b79477b01811953d96241958e095ab99`

Checkpoint de départ :

`checkpoint/lab-start-asset-library-architecture-2026-09-25`

Branche :

`work/lab-asset-library-architecture-2026-09-25`

Objectif :

- définir une architecture unique et extensible pour les assets créateurs ;
- classer proprement icônes, sprites / FX et sons ;
- préparer une bibliothèque commune GenSrpG réutilisable ;
- permettre plus tard l'ajout d'assets personnels par les créateurs sans créer une seconde logique ;
- préserver le cas minimal d'une image unique et le fonctionnement autonome du laboratoire.

Diagnostic de l'existant :

- `Asset Input` existe déjà dans `src/assets/image-source-manager.js` pour charger et valider des images temporaires ;
- les créatures de test possèdent déjà des fichiers metadata sous `assets/test/creatures/` ;
- il n'existe pas encore de registre générique pour icônes / FX / audio ;
- il n'existe pas encore de contrat de pack ni de binding entre gameplay et assetId ;
- le dossier `assets/test/` est explicitement réservé aux assets du laboratoire et ne doit pas devenir silencieusement la bibliothèque officielle GenSrpG.

Périmètre de ce lot :

DOCUMENTATION / ARCHITECTURE UNIQUEMENT.

Livrables autorisés :

- un document de conception `docs/LAB_ASSET_LIBRARY.md` ;
- synchronisation minimale de `LAB_ROADMAP.md` ;
- synchronisation minimale de `LAB_ARCHITECTURE.md` ;
- précision du rôle de `src/assets/` dans son README ;
- aucune implémentation runtime de bibliothèque ;
- aucun import utilisateur réel ;
- aucun fichier son / sprite ajouté dans ce lot.

Propriétaires définis :

- `Asset Definition` : métadonnées d'un asset ;
- `Asset Catalog` : index des assets disponibles ;
- `Asset Pack` : groupe installable / activable d'assets ;
- `Asset Binding` : références assetId depuis compétences / créatures / commandes ;
- `Asset Input` : validation et chargement du fichier réel ;
- stockage futur créateur : adaptateur séparé, jamais Core combat ;
- Presenter / FX / Audio adapters : consommation d'assetId déjà résolu, aucune autorité gameplay.

Principes obligatoires :

- aucune compétence ne dépend d'un chemin de fichier codé en dur dans l'UI ;
- les skills / créatures référencent des `assetId` stables ;
- un asset officiel et un asset personnel utilisent le même contrat ;
- les scopes `core / pack / project / user` restent distingués ;
- l'auteur, la source et la licence font partie des métadonnées ;
- un pack ne peut jamais remplacer silencieusement un asset d'un autre scope ;
- fallback explicite si un asset optionnel est absent ;
- audio, sprite et icône n'influencent jamais les règles de combat ;
- les futures durées gameplay restent dans SkillDefinition, pas dans un sprite ou un son.

Classification initiale à documenter :

- icon ;
- sprite ;
- fx ;
- sound ;
- portrait ;
- background ;
- ui.

Événements / usages à documenter :

- skill icon ;
- release ;
- travel ;
- impact ;
- hit ;
- miss / evade ;
- block ;
- reflect ;
- immune ;
- heal ;
- buff / debuff ;
- ko ;
- summon ;
- recall ;
- ui ;
- ambience.

Sources futures :

- `core` : bibliothèque commune fournie ;
- `pack` : pack thématique installé ;
- `project` : assets propres à un jeu / monde ;
- `user` : import personnel du créateur.

Tests de ce lot :

- pas de code fonctionnel nouveau, donc CI existante seulement ;
- revue de cohérence documentaire ;
- aucune dépendance à `Zombicide-40k` ;
- aucun chemin de la future bibliothèque présenté comme déjà implémenté ;
- vocabulaire aligné avec la charte et l'architecture existante.

Risques :

- créer un second Asset Input en parallèle ;
- mélanger catalogue, stockage et rendu ;
- lier les compétences à des chemins physiques au lieu d'IDs ;
- rendre obligatoire un asset riche alors que le fallback minimal doit continuer à fonctionner ;
- confondre pack officiel et asset personnel ;
- ignorer provenance / licence des assets proposés aux créateurs.

Critère de fin :

- classification officielle documentée ;
- format conceptuel AssetDefinition documenté ;
- règles de naming documentées ;
- hiérarchie des scopes documentée ;
- modèle AssetPack documenté ;
- modèle AssetBinding documenté ;
- stratégie d'import personnel documentée sans implémentation prématurée ;
- roadmap et architecture synchronisées ;
- CI verte ;
- validation utilisateur avant passage au contrat / code.


## Résultat technique — asset-library-architecture

Livrables terminés :

- nouveau document `docs/LAB_ASSET_LIBRARY.md` ;
- classification officielle initiale :
  - icon ;
  - sprite ;
  - fx ;
  - sound ;
  - portrait ;
  - background ;
  - ui ;
- catégories fonctionnelles et tags documentés ;
- scopes documentés :
  - core ;
  - pack ;
  - project ;
  - user ;
- règle d'identité :
  - `assetId` stable ;
  - indépendant du nom de fichier et du chemin ;
- format conceptuel `AssetDefinition` documenté ;
- modèle conceptuel `AssetPack` documenté ;
- modèle `AssetBinding` documenté ;
- bindings de présentation séparés de `SkillDefinition` gameplay ;
- fallbacks obligatoires documentés ;
- provenance / auteur / licence documentés ;
- flux d'import personnel documenté ;
- séparation `Asset Catalog / Storage Adapter / Asset Input` documentée ;
- expérience future de bibliothèque créateur documentée ;
- catégories audio et niveaux sprite / FX documentés ;
- ordre des prochains lots documenté.

Synchronisation :

- `LAB_ROADMAP.md` contient désormais la Phase 5B — Bibliothèque d'assets créateurs ;
- `LAB_ARCHITECTURE.md` précise la frontière Asset Input / Catalog / Binding / Storage ;
- la structure cible mentionne la future bibliothèque sans prétendre qu'elle existe déjà ;
- `src/assets/README.md` indique clairement que le runtime actuel ne supporte que l'input image et qu'aucun catalogue/audio input n'est encore implémenté.

Revue du diff depuis la base :

- uniquement :
  - documentation ;
  - README du domaine Asset Input ;
- aucun fichier JS fonctionnel modifié ;
- aucun asset média ajouté ;
- aucun changement Combat Rules / Runtime / Animation / FX ;
- aucune dépendance vers `Zombicide-40k`.

CI :

- HEAD architecture : `e697704d1377d8015bd10d52aeb3d7aec317c801` ;
- run : `36142661060` ;
- conclusion : SUCCESS.

Statut :

- architecture GREEN technique ;
- pas encore de checkpoint GREEN final de ce chantier ;
- validation utilisateur requise avant de passer au lot B : contrats `AssetDefinition / AssetPack / AssetBinding`.

## Dernier checkpoint GREEN

`checkpoint/lab-fullscreen-player-ui-v8-green-2026-09-25`

## Règle de reprise

Ne jamais reprendre uniquement depuis un résumé de conversation.

GitHub + ce fichier + les checkpoints sont la source de vérité.


## Chantier actif — asset-library-content

Date : 2026-09-25

Base exacte :

`01206d73bec5a768c14a24c40591e9e952b3f6b8`

Checkpoint de départ :

`checkpoint/lab-start-asset-library-content-2026-09-25`

Branche de travail :

`work/lab-asset-library-content-2026-09-25`

Document de référence :

`docs/LAB_ASSET_LIBRARY.md`

Objectif :

- construire et classer un premier pack réduit de contenu Core GenSrpG ;
- commencer par les capacités du laboratoire : Griffe, Boule de feu, Frappe téléportée, Plongeon aérien ;
- préparer les feedbacks génériques Hit / Miss / Esquive / KO / Invocation / Rappel ;
- ajouter uniquement des médias créés pour GenSrpG, appartenant à Sylvain, explicitement autorisés ou générés pour le projet ;
- maintenir un inventaire documentaire dans `assets/library/core/README.md`.

Périmètre autorisé :

- `assets/library/core/icons/**` ;
- `assets/library/core/sprites/**` ;
- `assets/library/core/fx/**` ;
- `assets/library/core/audio/**` ;
- `assets/library/core/README.md` ;
- `docs/LAB_CURRENT_WORK.md`.

Domaines protégés / interdits :

- aucun fichier gameplay JS ;
- aucun changement Combat Rules / Combat Runtime / SkillDefinition ;
- aucun Asset Catalog runtime ;
- aucun contrat AssetDefinition implémenté dans ce lot ;
- aucun import utilisateur ;
- aucune logique audio moteur ;
- aucun raccord des médias au Presenter / FX / combat ;
- aucun changement dans `assets/test/` ;
- aucune modification de `slyen4425-cloud/Zombicide-40k` ;
- aucun merge sur `main`.

Convention média :

- nommage `<type>_<category>_<theme-ou-element>_<variant>.<ext>` ;
- anglais techniques, minuscules, sans espaces ni accents ;
- transparence pour icônes / sprites / FX lorsque pertinent ;
- inventaire documentaire avec label, futur assetId envisagé, type, catégorie, tags, provenance, licence et usage prévu ;
- le futur assetId reste documentaire et ne constitue pas une API runtime.

Provenance initiale :

- créations originales / générées pour le projet GenSrpG ;
- auteur documentaire : GenSrpG / Sylvain + génération assistée OpenAI lorsque pertinent ;
- statut : project-created, utilisation autorisée pour GenSrpG ;
- aucune ressource extraite d'un jeu commercial ou d'une œuvre tierce.

Tests / contrôle :

- vérifier le diff après chaque lot ;
- confirmer qu'aucun fichier JS gameplay n'a changé ;
- vérifier poids et dimensions des médias ;
- vérifier la lisibilité mobile des visuels ;
- lancer / contrôler la CI disponible ;
- ne jamais déclarer CI SUCCESS en l'absence de run GitHub ;
- documenter les formats réellement ajoutés sans les présenter comme support runtime officiel.

Critère du premier lot :

- structure Core créée uniquement pour les catégories réellement alimentées ;
- inventaire documentaire présent ;
- premier sous-ensemble cohérent de médias ajouté avec provenance/licence ;
- aucun raccord runtime ;
- CI non rouge / état GitHub explicitement rapporté.


## Résultat micro-lot — Capture Cartoon Skill Icons 01

Premier pack visuel Core ajouté.

Branche :

`work/lab-asset-library-content-2026-09-25`

Commit média :

`b5fa589bac92af747b8e13b8f5c54d0d82db383b`

Contenu :

- 30 icônes de compétences en WebP 256×256 ;
- emplacement :
  - `assets/library/core/icons/skills/` ;
- source maître conservée :
  - `assets/library/core/icons/skills/source/icon_skill_capture_cartoon_sheet_source_01.png` ;
- inventaire documentaire :
  - `assets/library/core/README.md`.

Direction graphique validée pour ce lot :

- Capture / cartoon ;
- formes simples et expressives ;
- contraste fort ;
- lecture smartphone ;
- nettement moins RPG réaliste / fantasy classique ;
- cette patte sert de référence de cohérence pour les prochaines icônes de la bibliothèque vitrine.

Exemples présents :

- Griffe ;
- Boule de feu ;
- Souffle de feu ;
- Plongeon aérien ;
- Frappe téléportée ;
- Foudre ;
- Glace ;
- Eau ;
- Tornade ;
- Terre ;
- Bouclier ;
- Soin ;
- Poison ;
- Lumière ;
- Néant ;
- Dash ;
- Météores ;
- Ronces ;
- Cristal ;
- Invocation ;
- Rappel ;
- KO ;
- Sceau ;
- Rayon ;
- Impact rocheux ;
- Charge aquatique ;
- Déluge de feu ;
- Cercle arcanique ;
- Portail ;
- Barrière.

Provenance / statut :

- création originale générée spécifiquement pour GenSrpG avec OpenAI sous direction de Sylvain ;
- aucune ressource de jeu commercial extraite ;
- aucune attribution tierce identifiée ;
- usage prévu : bibliothèque Core commune / créateur.

Important :

- les futurs `assetId` du README sont documentaires uniquement ;
- aucun AssetDefinition runtime ;
- aucun Asset Catalog ;
- aucun binding ;
- aucun raccord Combat Runtime ;
- aucun SkillDefinition modifié ;
- aucun JS gameplay modifié.

Revue diff du commit média depuis son parent :

- 30 fichiers WebP ajoutés ;
- 1 planche source ajoutée ;
- 1 README d'inventaire ajouté ;
- aucun fichier JS ;
- aucun fichier Combat Rules / Runtime / Animation / FX existant modifié ;
- aucun fichier de `Zombicide-40k` touché.

Incident de concurrence Git traité proprement :

- un commit documentaire est arrivé sur la même branche pendant l'envoi ;
- aucun force-push ;
- aucun écrasement ;
- le pack média a été reappliqué au-dessus du HEAD réel via commit fast-forward.


## Sous-lot actif — fireball-sprites-clean-capture

Base :

`ac2628ac55bbae00ba09fdab543461b2f774e182`

Checkpoint de départ :

`checkpoint/lab-start-fireball-sprites-clean-capture-2026-09-25`

Branche :

`work/lab-fireball-sprites-clean-capture-2026-09-25`

Retour utilisateur :

- la planche complète Boule de feu a été fournie de nouveau ;
- le précédent découpage GitHub n'est pas exploitable visuellement : fonds/panneaux de la planche encore visibles ;
- le précédent emplacement `assets/library/core/sprites/...` est désormais contraire à la charte corrigée ;
- les visuels doivent rester dédiés Capture pour l'instant.

Diagnostic :

- les bandes existantes contiennent bien les séquences cast / impact / travel dans quatre directions ;
- elles constituent une matière source utile mais ne sont pas des sprites runtime propres ;
- la charte corrigée impose :
  - audio commun -> `assets/library/core/audio/` ;
  - visuels Capture -> `assets/library/capture/icons|sprites|fx/`.

Objectif :

- refaire le pack Boule de feu avec transparence réellement exploitable ;
- produire des frames individuelles 256×256 ;
- produire aussi des bandes horizontales propres pour lecture atlas ;
- conserver cast, impact et quatre directions de travel ;
- préparer des variantes documentaires optionnelles à partir des frames existantes lorsque possible ;
- conserver une provenance claire ;
- déposer le résultat sous `assets/library/capture/sprites/skills/fireball/` ;
- supprimer les anciennes bandes Boule de feu sous `core/sprites` une fois le remplacement vérifié.

Fichiers autorisés :

- `assets/library/capture/sprites/skills/fireball/**` ;
- anciens `assets/library/core/sprites/skills/fireball/**` uniquement pour remplacement/suppression ;
- documentation d'inventaire associée ;
- script/outillage temporaire de génération si nécessaire, à retirer avant clôture ;
- `docs/LAB_CURRENT_WORK.md`.

Domaines protégés :

- Combat Rules ;
- Combat Runtime ;
- Animation Core ;
- SkillDefinition ;
- damage / energy / timing ;
- UI combat ;
- `main` ;
- dépôt `Zombicide-40k`.

Règles de traitement :

- aucun redessin gameplay ;
- suppression du texte, numéros, cadres et fonds de planche ;
- alpha propre autour de la flamme ;
- taille de frame normalisée 256×256 ;
- noms techniques anglais et stables ;
- trajectoire écran reste responsabilité du Presenter/Renderer ;
- aucun sprite ne décide du timing ni des dégâts.

Tests / vérifications :

- chaque frame est réellement RGBA avec alpha ;
- coins des frames transparents ;
- aucun chiffre / cadre / bande de titre visible ;
- bandes atlas ont exactement `frames × 256` de largeur et 256 px de hauteur ;
- manifest et séquences correspondent aux fichiers ;
- aucun asset Boule de feu visuel final ne reste sous `core` ;
- CI existante reste verte.

Critère de fin :

- pack Capture Boule de feu propre et documenté ;
- anciennes bandes erronées retirées ;
- CI verte ;
- SHA exact communiqué.


## Sous-lot actif — fireball-asset-demo

Base :

`48cc765fc2602dc645589107abc2912d52769eb1`

Checkpoint de départ :

`checkpoint/lab-start-fireball-asset-demo-2026-09-25`

Branche :

`work/lab-fireball-asset-demo-2026-09-25`

Objectif :

- raccorder dans la Demo UI du laboratoire l'icône Capture de Boule de feu et le pack de sprites Boule de feu déjà généré ;
- remplacer uniquement le projectile visuel générique de `fireball` par le sprite/atlas Capture ;
- conserver Combat Rules, dégâts, portée, énergie et timing inchangés ;
- fournir une URL de preview testable sur smartphone.

Propriétaires concernés :

- Demo UI pour l'affichage du bouton de compétence ;
- Render Adapter / FX Renderer pour le rendu du projectile et de l'impact ;
- catalogue visuel Capture comme source d'assets.

Fichiers autorisés :

- `examples/dom-demo/demo.css` ;
- `src/ui/combat-test-ui.js` ;
- `src/adapters/renderer/dom-skill-fx.js` ;
- tests sentinelles associés ;
- `docs/LAB_CURRENT_WORK.md`.

Domaines protégés :

- Combat Rules ;
- Combat Runtime ;
- Action Resolver ;
- SkillDefinition gameplay ;
- valeurs de dégâts / énergie / portée / timing ;
- Roster Session ;
- `main` ;
- dépôt `Zombicide-40k`.

Tests prévus :

- l'icône Boule de feu provient de `assets/library/capture/icons/skills/` ;
- le projectile `fireball` utilise les frames Capture existantes ;
- les autres projectiles gardent le fallback générique ;
- le rendu ne modifie aucun résultat gameplay ;
- CI existante verte ;
- preview smartphone fournie pour validation visuelle.

Critère de fin :

- bouton Boule de feu identifiable par son icône ;
- lancement/trajet/impact visibles avec les sprites Capture ;
- aucun changement des règles de combat ;
- CI verte ;
- lien de test communiqué.


### Ajustement de périmètre avant codage

Le diagnostic du raccord réel montre que l'icône Boule de feu encore disponible dans `core/icons` doit être projetée dans l'espace visuel Capture avant utilisation dans la démo.

Fichiers supplémentaires autorisés pour ce sous-lot :

- `assets/library/capture/icons/skills/icon_skill_fireball_01.webp` ;
- `src/core/fx/skill-fx-plan.js` uniquement pour transporter l'identité visuelle de la compétence jusqu'au FX Renderer, sans règle gameplay ;
- `examples/dom-demo/demo.js` ;
- `examples/dom-demo/demo-assets.js`.

Règles :

- le mapping physique fichier -> assetId reste limité à l'adaptateur de démo ;
- les données gameplay `data/combat/skills/*.json` restent inchangées ;
- l'absence de binding visuel doit conserver le projectile générique existant ;
- aucune horloge ni dégât n'est ajouté côté UI/FX.


### Résultat technique — fireball-asset-demo

Raccord réalisé :

- l'icône Boule de feu est exposée dans `assets/library/capture/icons/skills/icon_skill_fireball_01.webp` ;
- le binding de démo utilise des `assetId` stables `pack:capture:...` séparés des données gameplay ;
- le bouton Boule de feu affiche l'icône Capture ;
- le projectile Boule de feu utilise l'atlas de travel Capture pendant son trajet réel ;
- un impact animé Capture est affiché sur un résultat `hit` ;
- les projectiles sans binding visuel conservent le fallback générique ;
- dégâts, énergie, portée et timings de `fireball.skill.json` sont inchangés ;
- aucun raccord au dépôt principal n'a été effectué.

Validation automatisée du candidat avant synchronisation documentaire :

- work SHA code : `9cb179e5590c76774b8cd15092f95d3684a723da` ;
- CI work : `36163690048` — SUCCESS ;
- preview : `preview/lab-fireball-asset-demo-2026-09-25` ;
- CI preview : `36163744348` — SUCCESS.

Validation utilisateur mobile requise avant checkpoint GREEN final.


## Retour utilisateur — fireball-asset-demo — rendu visuel NON VALIDÉ

Date : 2026-09-25

Retour smartphone de Sylvain :

- le sprite Boule de feu est techniquement raccordé mais le rendu visuel ne donne pas l'effet attendu ;
- la présence de l'asset, la CI verte et les tests automatisés ne constituent pas une validation visuelle ;
- validation smartphone : **ÉCHEC / À REPRENDRE** ;
- aucun checkpoint GREEN final ne doit être créé pour `fireball-asset-demo` tant que Sylvain n'a pas validé le rendu.

Priorité immédiate :

- diagnostic visuel et technique du raccord existant avant toute correction ;
- vérifier découpage des frames, transparence, cadrage, scaling, atlas, background-size/background-position, animation steps, conteneur `.skill-fx`, orientation, trajectoire DOM, source/impact, synchronisation avec `travelMs`, nettoyage du node et éventuelle superposition avec le fallback ;
- corriger la cause démontrée par petit lot, sans second moteur de projectile et sans modifier les règles de combat.

Invariants :

- `SkillDefinition` reste gameplay uniquement ;
- `SkillPresentationBinding / assets` reste présentation uniquement ;
- FX / Renderer n'a aucune autorité gameplay ;
- dégâts uniquement à l'impact décidé par Combat Rules / Runtime ;
- les visuels Boule de feu restent sous `assets/library/capture/`.


## Sous-lot actif — fireball-visual-fix

Base exacte :

`b4b4d85977c64278ea292c7581c0d5590d978e1d`

Checkpoint de départ :

`checkpoint/lab-start-fireball-visual-fix-2026-09-25`

Branche :

`work/lab-fireball-visual-fix-2026-09-25`

Objectif :

- diagnostiquer puis corriger le mauvais rendu visuel de la Boule de feu existante ;
- obtenir un lancement lisible, un projectile animé et correctement cadré pendant tout le trajet, puis un impact/explosion propre ;
- conserver intégralement les règles gameplay et l'horloge existantes.

Fichiers autorisés après diagnostic :

- `examples/dom-demo/demo.js` ;
- `examples/dom-demo/demo-assets.js` ;
- `examples/dom-demo/demo.css` ;
- `src/ui/combat-test-ui.js` uniquement si le binding de présentation l'exige ;
- `src/core/fx/skill-fx-plan.js` uniquement pour transporter une intention visuelle déjà décidée ;
- `src/adapters/renderer/dom-skill-fx.js` ;
- `src/adapters/renderer/combat-resolution-presenter.js` uniquement si la séquence visuelle existante est fautive ;
- `tests/unit/skill-fx.test.mjs` ;
- `tests/unit/demo-ui-boundary.test.mjs` ;
- assets Capture Boule de feu existants uniquement si le diagnostic démontre un défaut réel de cadrage/atlas ;
- documentation laboratoire.

Domaines protégés :

- `data/combat/skills/*.json` ;
- dégâts, énergie, portée, `preparationMs`, `travelMs`, `recoveryMs` ;
- Combat Rules ;
- Combat Runtime ;
- Action Resolver ;
- Roster Session ;
- Animation Core hors preuve contraire ;
- `main` ;
- dépôt `slyen4425-cloud/Zombicide-40k`.

Diagnostic obligatoire avant code :

- frames réelles / alpha / cadrage ;
- dimensions des atlas et orientation ;
- CSS `background-size` / `background-position` / `steps` ;
- dimensions et ratio du node FX ;
- transform / rotation ;
- source, cible stable et trajectoire ;
- synchronisation travel / impact ;
- coexistence éventuelle du fallback ;
- nettoyage des nodes temporaires ;
- rendu mobile.

Tests prévus :

- une seule représentation projectile Boule de feu active ;
- frame/atlas correctement cadré sans rectangle ni planche visible ;
- progression d'animation sur toute la durée `travelMs` sans changer `travelMs` ;
- impact séparé au point cible et nettoyé ensuite ;
- fallback générique inchangé pour les autres compétences ;
- aucune valeur gameplay ajoutée aux bindings/assets ;
- CI complète verte.

Risque principal :

- masquer le défaut par du CSS compensatoire alors que la cause est dans le découpage/atlas ou inversement.

Critère de fin :

- GREEN technique uniquement après tests/CI ;
- preview smartphone obligatoire ;
- aucun checkpoint GREEN final avant validation visuelle explicite de Sylvain.


### Diagnostic affiné — lecture projectile

Clarification utilisateur :

- le défaut principal n'est pas la qualité artistique brute des frames ;
- le rendu ne donne pas la sensation d'une vraie Boule de feu quittant un monstre et atteignant l'autre ;
- le noyau du projectile ne semble pas coïncider avec la trajectoire.

Causes techniques démontrées dans le raccord actuel :

1. la démo utilise toujours l'atlas `travel_lr`, quel que soit le sens réel du tir ;
2. le renderer calcule bien l'angle de trajectoire dans `--skill-fx-angle`, mais cet angle n'est jamais appliqué au visuel ;
3. la trajectoire DOM suit le centre du node, alors que le noyau lumineux de la séquence de travel est décentré dans la frame ;
4. la séquence sprite possède son propre mouvement interne, qui se superpose donc au déplacement du node et brouille la lecture du projectile.

Correction retenue :

- utiliser une séquence de travel Capture cohérente comme sprite canonique ;
- garder le déplacement du projectile exclusivement au renderer ;
- ancrer le noyau lumineux du sprite sur la trajectoire ;
- orienter le visuel selon l'angle réel source -> cible sans modifier la trajectoire ni `travelMs` ;
- séparer le shell qui se déplace du visuel sprite qui s'oriente / s'anime ;
- conserver l'impact séparé au point cible ;
- fallback générique inchangé pour les compétences sans binding.

Aucune modification gameplay n'est autorisée pour cette correction.


### Candidat technique — fireball-visual-fix

Correctif de présentation uniquement :

- l'ancien binding `travel_lr` imposé à tous les tirs a été remplacé par une séquence canonique Capture cohérente ;
- le binding déclare désormais le point du noyau lumineux du projectile (`coreAnchor`) et son orientation native (`headingRad`) ;
- le renderer sépare :
  - le shell DOM qui suit la trajectoire source -> cible ;
  - le sprite interne qui s'anime et s'oriente ;
- le noyau lumineux reste donc attaché à la trajectoire au lieu de faire suivre la trajectoire au centre arbitraire de la frame ;
- le sprite est orienté depuis l'angle réel source -> cible ;
- le déplacement reste entièrement piloté par le renderer pendant le `travelMs` gameplay existant ;
- le projectile lié démarre visible au niveau du lanceur, reste lisible pendant tout le trajet et termine sur le point cible ;
- l'impact Capture existant reste séparé et est toujours déclenché par le résultat sémantique ;
- le fallback générique des compétences sans binding reste inchangé.

Aucun changement :

- `SkillDefinition` ;
- dégâts ;
- énergie ;
- portée ;
- `preparationMs` ;
- `travelMs` ;
- `recoveryMs` ;
- Combat Runtime ;
- Action Resolver ;
- Roster Session ;
- Animation Core ;
- dépôt `Zombicide-40k`.

SHA candidat code :

`107a43e892a2a0a910e24b16e238ac134f9489ce`

CI de validation du candidat :

- workflow : `Laboratory CI` ;
- run : `36166614668` ;
- job `foundation` : SUCCESS ;
- étape `npm run ci` : SUCCESS.

Branche preview :

`preview/lab-fireball-visual-fix-2026-09-25`

Statut :

- GREEN technique uniquement ;
- validation visuelle smartphone toujours **REQUise** ;
- aucun checkpoint GREEN final avant confirmation explicite de Sylvain que la Boule de feu ressemble enfin à un vrai projectile allant du lanceur à la cible.


### Extension validée — pipeline visuel de compétence en trois phases

Retour utilisateur du 2026-09-25 :

- le projectile est mieux lisible mais reste beaucoup trop petit ;
- avant son départ, la compétence doit montrer une invocation / charge visuelle ;
- le contrat de présentation souhaité pour une compétence riche est désormais :
  1. invocation / charge ;
  2. projectile / trajet ;
  3. impact.

Décision architecture :

`SkillDefinition` reste strictement gameplay.

Le binding de présentation peut exposer séparément :

- `cast` : visuel d'invocation/charge ;
- `travel` : visuel de projectile/trajectoire ;
- `impact` : visuel d'arrivée/explosion.

Chaîne autorisée :

`Combat Runtime preparation -> Presenter cast -> Runtime release -> Presenter travel -> Runtime impact/resolution -> Presenter impact`

Invariants :

- `cast` suit la vraie durée de préparation de l'action ; il ne décide jamais du release ;
- `travel` suit le vrai `travelMs` ; il ne décide jamais de l'impact ;
- `impact` est déclenché uniquement depuis le résultat sémantique existant ;
- interruption pendant la préparation => le cast visuel est annulé/nettoyé ;
- aucune nouvelle horloge gameplay ;
- aucune valeur de dégâts, énergie, portée ou disponibilité dans le binding visuel ;
- le même contrat doit pouvoir servir plus tard à d'autres compétences.

Extension de fichiers autorisés pour ce micro-lot :

- `src/core/combat/combat-runtime.js` uniquement pour exposer un signal de démarrage d'action déjà décidée, sans modifier son timing ou sa résolution ;
- tests Runtime/Presenter correspondants.

Réglage visuel Boule de feu demandé :

- projectile nettement plus gros que le candidat précédent ;
- cast visible sur le lanceur pendant la préparation ;
- projectile au release ;
- explosion à l'impact.


### Candidat technique — pipeline visuel cast / projectile / impact

Implémentation :

- binding Boule de feu enrichi avec trois phases de présentation distinctes :
  - `cast` ;
  - `travel` ;
  - `impact` ;
- le `cast` utilise l'atlas Capture existant `sprite_skill_fireball_cast_atlas_01.png` ;
- le `travel` conserve le projectile ancré/orienté du correctif précédent ;
- taille visuelle du projectile augmentée via `displayScale: 1.75` dans le binding de présentation ;
- taille visuelle du cast configurée séparément via `displayScale: 1.35` ;
- aucun paramètre gameplay n'a été ajouté aux assets.

Raccord temporel :

- `Combat Runtime` expose désormais un callback `onStarted` purement informatif ;
- ce signal ne modifie ni l'action ni ses timestamps ;
- `Combat Test UI` route uniquement les actions de type skill vers `Presenter.presentPreparation()` ;
- `Presenter` affiche le cast pendant la vraie `preparationMs` ;
- au vrai `release`, le cast actif de cet acteur est annulé/nettoyé puis le projectile démarre ;
- si l'action est interrompue avant release, le cast est également annulé ;
- l'impact reste déclenché uniquement depuis la résolution sémantique existante.

Tests ajoutés / renforcés :

- plan FX de préparation suit exactement `action.preparationMs` ;
- renderer cast utilise l'anchor réel du lanceur ;
- handoff Presenter `cast -> release projectile` protégé ;
- signal Runtime `onStarted` vérifié sans modification de `releaseAtMs / impactAtMs / travelMs` ;
- binding Boule de feu protège les trois assetIds et le scale de projectile ;
- sentinelles existantes conservées.

SHA candidat avant synchronisation documentaire :

`3ea9f7e06bd56f2aebc0815e3dc21f07025e8273`

CI :

- workflow : `Laboratory CI` ;
- run : `36168245446` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique uniquement ;
- validation smartphone requise sur :
  1. apparition du cast pendant la charge ;
  2. disparition du cast exactement au départ ;
  3. projectile nettement plus gros et lisible ;
  4. trajet jusqu'à la cible ;
  5. explosion à l'impact ;
- aucun checkpoint GREEN final avant validation visuelle explicite de Sylvain.


### Retour utilisateur — anchors FX créature et nouveaux cast/impact

Retour smartphone :

- le pipeline cast / travel / impact est validé comme structure ;
- le cast Boule de feu actuel n'est pas visuellement satisfaisant ;
- le cast doit devenir un orbe de feu rond qui se charge ;
- le cast joueur doit être placé derrière le modèle, vers la tête / bouche ;
- le projectile doit être encore plus gros ;
- l'impact actuel doit également être remplacé ;
- les créatures doivent exposer davantage de points d'ancrage réutilisables.

Décision architecture :

Les métadonnées de créature deviennent propriétaires des points d'ancrage visuels par vue :

- `head` ;
- `mouth` ;
- `handLeft` ;
- `handRight` ;
- `tail`.

Ces anchors sont des coordonnées normalisées de présentation uniquement.

Le binding d'une compétence peut choisir :

- `castAnchor` ;
- `travelSourceAnchor` ;
- `castLayer` (`behind` / `front`).

Pour Boule de feu :

- cast depuis `mouth` ;
- cast derrière le modèle ;
- travel depuis `mouth` ;
- impact sur l'anchor cible stable existant ;
- aucun changement gameplay.

Interdits :

- aucune détection de tête dans Combat Rules ;
- aucun anchor codé dans SkillDefinition ;
- aucun dégât/timing dans les métadonnées créature ;
- aucune seconde horloge ;
- aucun changement du dépôt principal.


### Candidat technique — anchors FX + nouvel orbe/impact Boule de feu

Implémentation du sous-lot :

Métadonnées créature :

- ajout de `fxAnchors` par vue `player / opponent` ;
- anchors disponibles :
  - `head` ;
  - `mouth` ;
  - `handLeft` ;
  - `handRight` ;
  - `tail` ;
- coordonnées normalisées de présentation uniquement ;
- anchors réglés séparément pour Maraileron et Braisombre à partir de leurs quatre visuels runtime réels.

Visual Controller :

- expose `getFxAnchorFor(slotKey, anchorName)` ;
- transforme l'anchor normalisé de la créature active en point DOM courant ;
- aucun calcul gameplay.

FX Renderer :

- accepte maintenant un resolver de source d'anchor nommé ;
- le cast et le projectile peuvent donc partir d'un anchor de créature précis ;
- fallback centre historique conservé si aucun anchor n'est demandé ;
- `castLayer: behind` place le cast sous les modèles de créature ;
- impact conserve la cible spatiale stable existante ;
- le `displayScale` d'impact est désormais consommé uniquement comme paramètre visuel.

Boule de feu :

- `castAnchor: "mouth"` ;
- `travelSourceAnchor: "mouth"` ;
- `castLayer: "behind"` ;
- projectile agrandi à `displayScale: 2.3` ;
- nouveau cast Capture :
  `assets/library/capture/fx/skills/fireball/fx_skill_fireball_cast_orb_01.svg` ;
- nouveau cast = orbe circulaire lumineux de concentration ;
- nouvel impact Capture :
  `assets/library/capture/fx/skills/fireball/fx_skill_fireball_impact_burst_01.svg` ;
- nouvel impact = déflagration circulaire/radiale ;
- anciens sprites de cast/impact ne sont plus utilisés par le binding Boule de feu de la démo.

Invariants conservés :

- aucune modification de SkillDefinition ;
- aucun changement dégâts / énergie / portée / préparation / trajet / récupération ;
- aucun changement Combat Rules / Action Resolver / Combat Runtime dans ce sous-lot ;
- anchors, couche, scale et fichiers FX restent strictement présentation ;
- aucune modification de `Zombicide-40k`.

Incident CI :

- premier run `36170550207` rouge sur une sentinelle de rotation projectile dont l'attendu utilisait encore l'ancien centre de départ ;
- cause : test obsolète après passage réel au mouth anchor ;
- correction du test uniquement avec la nouvelle géométrie `mouth -> target` ;
- aucun changement fonctionnel ajouté pour contourner le test.

SHA fonctionnel avant synchronisation documentaire :

`5fb1f5d1a5c83788523cc4e9dcf57215333fec46`

CI fonctionnelle :

- workflow : `Laboratory CI` ;
- run : `36170626133` ;
- conclusion : SUCCESS.

Validation smartphone requise :

1. le cast joueur doit apparaître derrière la créature, vers la bouche/tête ;
2. l'orbe de charge doit être rond et plus lisible que l'ancien cast ;
3. le projectile doit partir de la bouche et être nettement plus gros ;
4. l'impact doit être remplacé par la nouvelle déflagration circulaire ;
5. vérifier aussi une Boule de feu adverse : la source doit utiliser la bouche correspondante à la vue adverse ;
6. aucun checkpoint GREEN final avant validation visuelle explicite.


### Retour smartphone — fireball visual fix nettement amélioré

Retour utilisateur :

- le rendu Boule de feu est désormais jugé **beaucoup mieux** ;
- quelques micro-détails peuvent encore être ajustés plus tard ;
- l'utilisateur demande encore un projectile visuellement plus gros.

Micro-ajustement présentation :

- `travel.displayScale` passe de `2.3` à `2.8` ;
- aucun timing, dégât, coût, portée ou règle de combat modifié ;
- ce changement reste strictement dans le binding de présentation.

Important :

- une nouvelle demande gameplay est apparue séparément : deux projectiles compatibles qui se rencontrent devraient pouvoir s'annuler mutuellement ;
- cette règle ne sera pas ajoutée dans le chantier visuel ;
- elle doit partir d'un nouveau checkpoint / nouvelle branche avec configuration éditable dans `SkillDefinition`.


## Chantier actif — projectile-clash-v9

Date : 2026-09-25

Base exacte :

`966d1742c7c0f9ccbf0f66cc5095d189efcd2758`

Checkpoint de départ :

`checkpoint/lab-start-projectile-clash-v9-2026-09-25`

Branche :

`work/lab-projectile-clash-v9-2026-09-25`

Retour utilisateur :

- deux Boules de feu peuvent être lancées simultanément ;
- lorsqu'elles se rencontrent en vol, elles doivent pouvoir s'annuler mutuellement ;
- cette règle doit être **éditable / data-driven comme le reste**, jamais codée en dur pour `fireball`.

Objectif :

- ajouter une règle générique de clash entre projectiles concurrents ;
- conserver Combat Runtime comme horloge unique ;
- conserver Combat Rules comme autorité du résultat ;
- faire disparaître les deux projectiles au moment du clash ;
- aucune des deux compétences annulées ne doit infliger ses dégâts à la cible ;
- rendre le comportement configurable dans `SkillDefinition`.

Contrat gameplay retenu pour ce premier jalon :

`projectileClash` :

- `mode` :
  - `none` — comportement par défaut ;
  - `mutual_cancel` — le projectile peut s'annuler avec un projectile compatible ;
- `group` :
  - identifiant éditable de compatibilité ;
  - un clash `mutual_cancel` n'est possible que si les deux projectiles portent le même groupe non vide.

Exemple Boule de feu laboratoire :

```json
"projectileClash": {
  "mode": "mutual_cancel",
  "group": "fire-orb"
}
```

Le moteur ne connaît jamais le nom `fireball`.

Règle temporelle :

- seuls deux skills de forme `projectile` mutuellement ciblés sont candidats ;
- les deux doivent être réellement en phase de trajet ;
- le point / temps de rencontre est calculé depuis leurs vrais timestamps de release et leurs vrais `travelMs` ;
- aucune durée de collision supplémentaire n'est inventée ;
- si le temps calculé se situe hors de la fenêtre de trajet commune, aucun clash ;
- à l'instant de rencontre :
  - les deux actions deviennent `clashed` ;
  - aucun hit / dégât ;
  - leurs projectiles visuels actifs sont annulés ;
  - les autres actions concurrentes restent inchangées.

Propriétaires :

- `SkillDefinition` + data : configuration éditable du clash ;
- Combat Rules / helper projectile clash : compatibilité et calcul pur du temps de rencontre ;
- `Combat Runtime` : programmation de l'événement de clash sur l'horloge existante ;
- Presenter / FX Renderer : arrêt visuel des projectiles déjà décidés comme `clashed` ;
- Demo UI : libellé seulement.

Fichiers autorisés :

- `src/contracts/skill-definition.js` ;
- `data/combat/skills/fireball.skill.json` ;
- nouveau helper sous `src/core/combat/` si nécessaire ;
- `src/core/combat/combat-runtime.js` ;
- `src/adapters/renderer/combat-resolution-presenter.js` ;
- `src/adapters/renderer/dom-skill-fx.js` ;
- `src/ui/combat-test-ui.js` pour le libellé uniquement ;
- tests unitaires / intégration correspondants ;
- documentation laboratoire.

Domaines protégés :

- formule de dégâts ;
- coût énergie ;
- portée ;
- préparation / trajet / récupération des compétences ;
- Action Resolver hors besoin démontré ;
- Animation Core ;
- Roster Session ;
- anchors / cast / impact Boule de feu validés ;
- `main` ;
- dépôt `Zombicide-40k`.

Tests prévus :

- SkillDefinition : défaut `none` ;
- validation de `mutual_cancel` + `group` ;
- configuration invalide rejetée ;
- deux projectiles même groupe, trajectoires opposées et fenêtres qui se croisent -> clash ;
- groupes différents -> aucun clash ;
- mode `none` -> aucun clash ;
- rencontre simultanée Boule de feu / Boule de feu -> zéro dégât des deux côtés ;
- rencontre décalée -> temps de collision calculé depuis les vrais timings ;
- projectile qui a déjà impacté avant le point de rencontre -> aucun clash ;
- deux projectiles visuels annulés au clash sans `cancelAll()` global ;
- aucune animation / FX ne décide du résultat ;
- CI complète verte.

Risques :

- annuler visuellement trop de FX avec une méthode globale ;
- résoudre le clash après un impact qui aurait déjà eu lieu ;
- coder un cas spécial sur l'id `fireball` ;
- recalculer une seconde horloge dans le renderer ;
- faire dépendre la collision de la position DOM au lieu des timings gameplay.

Critère de fin :

- vrai chemin data -> SkillDefinition -> Combat Rules -> Combat Runtime -> résolution `clashed` -> Presenter -> arrêt des deux projectiles ;
- aucune perte de PV pour les deux projectiles annulés ;
- comportement entièrement éditable dans les données skill ;
- CI verte ;
- preview smartphone ;
- aucun checkpoint GREEN final avant validation utilisateur.


### Résultat technique candidat — projectile-clash-v9

Configurabilité :

- nouveau champ `SkillDefinition.projectileClash` ;
- modes du premier jalon :
  - `none` ;
  - `mutual_cancel` ;
- `group` éditable pour définir les projectiles compatibles ;
- aucun test sur l'id `fireball` dans le moteur ;
- Boule de feu laboratoire :
  - `mode: "mutual_cancel"` ;
  - `group: "fire-orb"`.

Règle pure :

- nouveau helper `src/core/combat/projectile-clash.js` ;
- vérifie forme projectile, mode, groupe et ciblage réciproque ;
- calcule le temps exact de rencontre depuis :
  - timestamps de release réels ;
  - `travelMs` réels ;
- refuse un clash hors de la fenêtre de trajet commune ;
- produit deux résolutions `clashed` ;
- aucun événement `hit` ;
- aucun dégât.

Runtime :

- aucune seconde horloge ;
- les candidats clash sont insérés dans la même file temporelle que release / résolution ;
- priorité en cas de même timestamp :
  1. release ;
  2. clash ;
  3. résolution d'impact ;
- un clash retire les deux actions actives avant leurs impacts ;
- les autres actions ne sont pas annulées.

Présentation :

- `DOM Skill FX Renderer` expose `cancelProjectileFor(slot)` ;
- aucun `cancelAll()` utilisé pour cette règle ;
- le Presenter arrête uniquement le projectile de l'acteur dont la résolution est `clashed` ;
- les deux résolutions stoppent donc les deux projectiles indépendamment ;
- UI : libellé `Projectiles annulés`.

Vrai test d'intégration :

- deux Boules de feu configurées depuis le vrai fichier data ;
- énergie initiale suffisante des deux côtés ;
- les deux actions démarrent simultanément ;
- release réel à 2000 ms ;
- rencontre à 2350 ms ;
- les deux actions deviennent `clashed` ;
- aucune action active restante ;
- aucun événement `hit` ;
- PV joueur : 100 ;
- PV adversaire : 100 ;
- avancer au-delà de l'ancien impact à 2700 ms ne produit aucun dégât tardif.

Tests complémentaires :

- défaut `none` ;
- `mutual_cancel` sans groupe rejeté ;
- mode inconnu rejeté ;
- `mutual_cancel` sur une forme non projectile rejeté ;
- groupes différents => aucun clash ;
- mode désactivé => aucun clash ;
- lancement décalé => point temporel calculé correctement ;
- projectile déjà arrivé avant fenêtre commune => aucun clash ;
- annulation visuelle actor-local ;
- Presenter ne joue aucun Hit pour `clashed`.

SHA fonctionnel avant synchronisation documentaire :

`b1cce3159e0e0ff4c959ba8af1d3012881856bea`

CI fonctionnelle :

- workflow : `Laboratory CI` ;
- run : `36177389470` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- aucune fusion sur `main` ;
- validation smartphone requise pour confirmer que les deux Boules de feu disparaissent bien visuellement à leur rencontre ;
- aucun checkpoint GREEN final avant cette validation.


## Chantier actif — approach-perspective-v9

Date : 2026-09-25

Base exacte :

`4f12d3742ee23cebe37ed8587e9a42f3b77389e6`

Checkpoint de départ :

`checkpoint/lab-start-approach-perspective-v9-2026-09-25`

Branche :

`work/lab-approach-perspective-v9-2026-09-25`

Retour utilisateur :

- la perspective doit rester identique pour toutes les approches spatiales ;
- quand le joueur attaque vers l'adversaire, l'attaquant s'éloigne de la caméra et doit rétrécir ;
- quand l'adversaire attaque vers le joueur, l'attaquant se rapproche de la caméra et doit grossir ;
- l'attaque aérienne montre actuellement le comportement inverse / incohérent ;
- les autres approches doivent être auditées pour le même défaut.

Diagnostic avant code :

- `ground-attack` possède déjà une correction de profondeur basée sur `targetTranslateY / arenaHeight` ;
- `aerial-attack` utilise encore des scales fixes indépendants de la profondeur ;
- `teleport-attack` utilise également des scales fixes à l'apparition cible ;
- ces deux approches ne suivent donc pas la règle de perspective déjà validée pour `ground-attack`.

Objectif :

- centraliser le calcul de perspective des approches spatiales ;
- appliquer le même sens caméra à `ground`, `aerial` et `teleport` ;
- joueur -> profondeur : scale < 1 ;
- adversaire -> caméra : scale > 1 ;
- conserver tous les timings / impacts / dégâts inchangés.

Propriétaire :

- Animation Core pour le calcul de transform visuel ;
- Creature Profile pour les bornes / intensité visuelles de perspective.

Fichiers autorisés :

- `src/core/animation/plan-animation.js` ;
- `data/profiles/drake.profile.json` ;
- `data/profiles/serpentine.profile.json` ;
- `tests/unit/special-attack-animation.test.mjs` ;
- documentation laboratoire si nécessaire.

Domaines protégés :

- SkillDefinition ;
- Combat Rules ;
- Action Resolver ;
- Combat Runtime ;
- dégâts / énergie / portée / timings ;
- projectile clash ;
- Boule de feu / assets / anchors / FX ;
- Roster Session ;
- Demo UI ;
- `main` ;
- dépôt `Zombicide-40k`.

Tests prévus :

- ground conserve le comportement actuel ;
- aerial rétrécit vers la profondeur et grossit vers la caméra ;
- teleport rétrécit vers la profondeur et grossit vers la caméra ;
- les bornes configurées restent respectées ;
- `travelMs` et le timestamp d'impact restent inchangés ;
- retour à l'échelle 1 au home ;
- CI complète verte.

Critère de fin :

- une seule règle de perspective partagée par les approches spatiales ;
- aucun calcul spécifique joueur/adversaire codé en dur ;
- le signe provient uniquement de la géométrie réelle `targetTranslateY` ;
- preview smartphone fournie ;
- aucun checkpoint GREEN final avant validation visuelle explicite.

### Candidat technique — perspective partagée des approches

Cause démontrée :

- `ground-attack` utilisait déjà la profondeur réelle de l'arène ;
- `aerial-attack` appliquait des scales fixes ;
- `teleport-attack` appliquait également des scales fixes ;
- l'incohérence provenait donc de l'Animation Core, pas du gameplay ni de la position des combattants.

Correction :

- le calcul historique `groundPerspectiveScale` devient une règle partagée `approachPerspectiveScale` ;
- le preset de perspective est déplacé vers une source unique : `profile.specialMoves.perspective` ;
- suppression des trois paramètres de perspective auparavant stockés uniquement dans `specialMoves.ground` ;
- `ground`, `aerial` et `teleport` consomment maintenant exactement le même facteur de profondeur ;
- aucune condition spéciale `player/opponent` : le signe est déterminé uniquement par `targetTranslateY / arenaHeight`.

Résultat attendu :

- joueur vers adversaire / profondeur : scale inférieur à la base ;
- adversaire vers joueur / caméra : scale supérieur à la base ;
- retour home : scale 1 ;
- tous les timings restent strictement inchangés.

Tests :

- maintien de la perspective ground existante ;
- nouveaux tests aerial dans les deux sens ;
- nouveaux tests teleport dans les deux sens ;
- bornes partagées min/max ;
- source de vérité unique du preset de perspective ;
- timestamp d'impact / `travelMs` inchangés.

CI fonctionnelle initiale :

- workflow `Laboratory CI` ;
- run `36178844966` ;
- job `foundation` : SUCCESS.

Statut :

- correction technique prête ;
- aucune modification du projectile clash ou de Boule de feu ;
- aucune modification gameplay ;
- preview smartphone à produire après synchronisation documentaire ;
- aucun checkpoint GREEN final avant validation visuelle utilisateur.

### Validation technique — approach-perspective-v9

SHA candidat avant preview :

`3d0d4e5d4c080be13c215ab4eae45736346077a3`

CI :

- workflow : `Laboratory CI` ;
- run : `36178992001` ;
- conclusion : SUCCESS.

Revue de périmètre :

- fichiers fonctionnels modifiés : profils visuels, Animation Core, tests ;
- documentation synchronisée ;
- aucun fichier Combat Rules / Runtime / Action Resolver modifié ;
- aucun fichier Boule de feu / projectile clash modifié ;
- `main` et `Zombicide-40k` inchangés.

Branche preview prévue :

`preview/lab-approach-perspective-v9-2026-09-25`

Validation utilisateur attendue :

- attaque aérienne joueur : la créature doit rétrécir en allant vers l'adversaire ;
- attaque aérienne adverse : la créature doit grossir en venant vers le joueur ;
- vérifier aussi Téléportation dans les deux sens ;
- Griffe / approche au sol doit conserver le comportement déjà correct.


### Retour smartphone — perspective présente mais trop peu perceptible

Retour utilisateur du 2026-09-25 :

- le sens attendu reste confirmé : joueur -> adversaire = rétrécissement ; adversaire -> joueur = grossissement ;
- le candidat `41a0aad655d03027bb1a14ec0f0d634f225f08e6` ne montre pas une variation suffisamment visible sur smartphone ;
- ce retour invalide la validation visuelle du candidat, sans invalider l'architecture du calcul partagé.

Diagnostic :

- le vrai chemin DOM transmet bien `targetTranslateY` et `arenaHeight` ;
- Animation Core applique bien `approachPerspectiveScale` aux trois approches ;
- le renderer compose correctement ce scale avec le scale de base de l'acteur ;
- aucune condition `player/opponent` n'est nécessaire ;
- avec l'ancien preset `strength=0.8 / min=0.82 / max=1.22`, le plus petit écart vertical représentatif du combat (environ 16 % de la hauteur d'arène) ne produisait qu'un facteur d'environ `0.872 / 1.128`, soit ±12,8 %, trop discret sur les sprites actuels.

Correction de données retenue :

- aucun changement dans `plan-animation.js` ;
- preset partagé renforcé dans les profils uniquement :
  - `perspectiveScaleStrength: 1.25` ;
  - `perspectiveScaleMin: 0.70` ;
  - `perspectiveScaleMax: 1.35` ;
- à 16 % de profondeur, la règle commune produit maintenant environ `0.80 / 1.20` avant composition propre à chaque approche ;
- ajout d'une sentinelle couvrant Ground / Aerial / Teleport à cette profondeur minimale représentative ;
- aucun timing, dégât, coût, portée, clash projectile, Boule de feu, Runtime, Action Resolver ou Demo UI modifié.

Statut :

- SHA fonctionnel du micro-lot : `e75cc08d5dce04d70f176e4a59f6971d731fa481` ;
- CI work : run `36184067123` — SUCCESS ;
- correction toujours en attente de validation visuelle smartphone ;
- aucun checkpoint GREEN final avant ce nouveau test.


### Décisions gameplay à conserver pour chantier ultérieur — déplacement et cooldowns

Décision utilisateur du 2026-09-25 :

- conserver pour l'instant la mécanique de déplacement existante ;
- le déplacement devra pouvoir être déclenché même pendant qu'un adversaire agit ou charge une capacité ;
- ne pas retravailler immédiatement cette mécanique dans le chantier perspective en cours ;
- les compétences devront disposer de temps de recharge configurables ;
- les cooldowns devront être traités de manière data-driven lors du futur chantier d'édition / correction de l'éditeur de compétences ;
- aucune rustine UI ou exception player/opponent ne doit être introduite pour ces besoins.

Statut :

- exigences enregistrées ;
- aucun changement fonctionnel effectué dans ce lot ;
- perspective visuelle conservée telle quelle pour le moment et à réévaluer plus tard.


### Lot séparé — icônes compétences et préparation des arènes

Décision utilisateur du 2026-09-25 :

- rattacher des icônes existantes aux autres capacités visibles du prototype ;
- conserver la Boule de feu et son binding actuel ;
- préparer plus tard plusieurs arènes liées au contexte de la zone de combat, par exemple caverne / forêt / neige ;
- ne pas coupler le décor d'arène aux règles de combat.

Branches du lot :

- départ : `checkpoint/lab-start-skill-icons-v9-2026-09-25` ;
- travail : `work/lab-skill-icons-v9-2026-09-25` ;
- preview : `preview/lab-skill-icons-v9-2026-09-25` ;
- base exacte : `c3051f6df1547fdfa5c4ad85d145ae6e12056c00`.

Diagnostic assets :

- `Griffe` -> `assets/library/core/icons/skills/icon_skill_claw_01.webp` ;
- `Plongeon aérien` -> `assets/library/core/icons/skills/icon_skill_aerial_dive_01.webp` ;
- `Frappe téléportée` -> `assets/library/core/icons/skills/icon_skill_teleport_strike_01.webp` ;
- l'UI possède déjà le slot générique `presentation.icon` ;
- aucune modification de `SkillDefinition` n'est nécessaire.

Périmètre fonctionnel :

- ajouter uniquement les bindings de présentation manquants ;
- ne créer aucun nouvel asset ;
- ne modifier aucun gameplay, timing, énergie, dégâts, portée ou FX ;
- ajouter un test assurant qu'une icône est résolue pour les quatre capacités actives ;
- documenter seulement l'architecture future des arènes par biome, sans l'implémenter dans ce lot.


Validation technique du lot icônes :

- SHA fonctionnel : `4220b0fa48fe0e23fd8dd6919ab4a82577363861` ;
- CI work : run `36185677495` — SUCCESS ;
- diff fonctionnel limité au binding de présentation des icônes ;
- test ajouté pour vérifier les quatre capacités actives et l'absence de faux FX sur les bindings icon-only ;
- architecture d'arène par biome documentée uniquement, non implémentée ;
- `main` et le dépôt `Zombicide-40k` inchangés.


### Lot UI — capacités plus hautes sur smartphone

Décision utilisateur du 2026-09-25 :

- agrandir légèrement l'UI des capacités ;
- privilégier l'augmentation en hauteur ;
- conserver la largeur générale du panneau de combat ;
- améliorer la lecture des icônes ;
- ne modifier aucun gameplay.

Branches :

- départ : `checkpoint/lab-start-skill-ui-height-v9-2026-09-25` ;
- travail : `work/lab-skill-ui-height-v9-2026-09-25` ;
- preview : `preview/lab-skill-ui-height-v9-2026-09-25` ;
- base exacte : `33b34dd7d1b8846c190f3f95b6c05008306ca021`.

Diagnostic :

- les touches de capacité étaient contraintes par `aspect-ratio: 1`, donc carrées ;
- leur largeur dépend déjà correctement de la grille quatre colonnes ;
- le propriétaire correct du changement est uniquement le CSS de la Demo UI.

Correction retenue :

- ratio des touches : `1` -> `0.8`, soit environ +25 % de hauteur à largeur identique ;
- icône : `72 %` -> `78 %` du bouton ;
- aucune modification de Combat Rules, Runtime, compétences, timings, énergie, dégâts ou bindings d'assets ;
- sentinelle UI adaptée pour verrouiller le nouveau ratio et la nouvelle occupation de l'icône.

Statut :

- SHA fonctionnel : `0946237f0efcf477130c323b653045bfc7f069f6` ;
- CI work : run `36187017741` — SUCCESS ;
- validation visuelle smartphone requise avant checkpoint GREEN.


### Lot — rangement officiel des arènes + second agrandissement UI capacités

Décision utilisateur du 2026-09-25 :

- créer une famille dédiée aux arènes dans la bibliothèque, comme pour les icônes / sprites / FX ;
- organiser les arènes par biome ;
- réserver la première arène forêt sous le nom `arena_forest_01.webp` ;
- agrandir encore légèrement les touches de capacités, surtout en hauteur ;
- respecter strictement les frontières gameplay / présentation.

Branches :

- départ : `checkpoint/lab-start-arena-library-ui-v9-2026-09-25` ;
- travail : `work/lab-arena-library-ui-v9-2026-09-25` ;
- preview : `preview/lab-arena-library-ui-v9-2026-09-25` ;
- base : `3b250a90310fca1f279d248b89ec10087a1eb666`.

Organisation ajoutée :

```
assets/library/core/arenas/
  README.md
  forest/
    README.md
```

Les futurs biomes suivront la même convention : `cave/`, `snow/`, etc.

UI capacités :

- ratio `0.8` -> `0.72` ;
- hauteur supplémentaire à largeur identique ;
- icône `78 %` -> `82 %` ;
- aucune modification du dock en largeur ;
- aucun changement Combat Rules / Runtime / dégâts / énergie / timings.

Arène forêt :

- l'image visuelle fournie est validée comme première arène forêt ;
- nom runtime réservé : `assets/library/core/arenas/forest/arena_forest_01.webp` ;
- le binaire exact n'est pas encore écrit dans Git parce que l'upload image du chat n'expose actuellement aucun flux de bytes téléchargeable aux outils de dépôt ;
- aucun faux asset ni substitut n'est créé ;
- dès que le même fichier est fourni avec un backing téléchargeable, il sera ajouté à ce chemin sans changer l'architecture.


Validation technique du lot arènes / UI :

- SHA fonctionnel : `0b6818a9ed3b9336c5ea1cb040cd2e5c54328520` ;
- CI work : run `36187645047` — SUCCESS ;
- diff limité à la présentation UI, la documentation et la nouvelle structure d'assets d'arènes ;
- aucun fichier Combat Rules / Runtime / Action Resolver / compétence gameplay modifié ;
- aucun asset binaire d'arène substitué tant que le fichier exact fourni dans le chat n'est pas exposé aux outils avec ses octets ;
- `main` et `Zombicide-40k` inchangés.


### Raccord présentation — première arène forêt

Le raccord de la démo est maintenant préparé sans dépendance gameplay :

```
demo arena context "forest"
  -> demoPresentationAssets.presentationForArena("forest")
  -> core:arena-forest-01
  -> assets/library/core/arenas/forest/arena_forest_01.webp
```

Comportement :

- si l'asset forêt est présent, la démo l'utilise comme fond d'arène ;
- le fond est en `cover / center` ;
- l'ancien sol procédural est masqué uniquement lorsqu'un background image est actif ;
- si le binding est absent, le fallback CSS générique reste disponible ;
- aucun Combat Rules / Runtime / SkillDefinition ne connaît le biome ou le chemin du fichier.

Le binaire `arena_forest_01.webp` doit être ajouté par upload dans le dossier forêt. Aucun substitut n'est utilisé.


### Intégration réelle — arène forêt

Upload utilisateur détecté sur la branche de travail :

- fichier reçu : `file_00000000a6bc81f4af7be4fe1e0521f3.png` ;
- blob GitHub : `9334800acde9cdc1e3a2b639b50f7f4902d70fa4` ;
- rangement nettoyé : `assets/library/core/arenas/forest/arena_forest_01.png` ;
- l'ancien nom brut est supprimé du tree ;
- le binding logique reste `core:arena-forest-01` ;
- la démo résout maintenant `forest -> core:arena-forest-01 -> arena_forest_01.png` ;
- la couche de sol procédurale est masquée quand l'image d'arène est active ;
- aucun gameplay n'est modifié.

Le format runtime courant de cette première arène est PNG, car il s'agit du binaire effectivement déposé. Une future optimisation WebP ne devra pas modifier l'asset ID logique ni le contrat d'arène.


Validation technique finale du lot arène forêt :

- asset réel intégré : `assets/library/core/arenas/forest/arena_forest_01.png` ;
- binding logique : `core:arena-forest-01` ;
- démo configurée sur le contexte `forest` ;
- ancien nom brut d'upload supprimé ;
- CI work finale : run `36189973204` — SUCCESS ;
- les deux échecs CI intermédiaires provenaient uniquement de sentinelles de test mal alignées (regex puis ancienne extension `.webp`) ; aucun correctif gameplay ni moteur n'a été nécessaire ;
- aucun Combat Rules / Runtime / Action Resolver / SkillDefinition modifié ;
- validation visuelle smartphone de l'arène encore attendue avant checkpoint GREEN final.


### Validation visuelle utilisateur — arène forêt / UI

Validation smartphone reçue le 2026-09-25 après intégration de la première arène forêt : utilisateur : « Wow trop beau ».

Cette validation confirme visuellement le cadrage général de l'arène forêt et l'intégration du fond dans la démo au SHA `dd2d371a18b27dc0b3fc2efa472b8056a1432b1d`.

Le lot arène / UI est considéré visuellement validé à cette étape.


### Lot — remplacement dos Braisombre + layering FX adverse

Retour visuel utilisateur du 2026-09-25 :

1. la vue actuelle du dragon comporte des défauts ;
2. remplacer uniquement la vue de dos pour le moment à partir du visuel fourni ;
3. la bonne vue face sera fournie ultérieurement ;
4. la Boule de feu en charge côté adversaire passe derrière la créature alors qu'elle doit être devant ;
5. vérifier aussi le principe pour les futurs sprites / FX.

Diagnostic :

- la vue de dos utilisée par le slot joueur est `runtime/braisombre_player.webp` ;
- la vue face adverse reste `runtime/braisombre_opponent.webp` et ne doit pas être modifiée dans ce lot ;
- le projectile Boule de feu est déjà au-dessus des fighters via `z-index: 7` ;
- l'impact est déjà au-dessus via `z-index: 10` ;
- la cause prouvée est le cast : le binding Fireball imposait `castLayer: "behind"` aux deux vues ;
- le renderer n'a pas besoin d'un `if player/opponent`.

Correction architecture :

- le binding de présentation porte maintenant `castLayerBySourceView` ;
- `player -> behind` conserve le rendu validé côté joueur ;
- `opponent -> front` affiche la charge adverse devant sa créature ;
- le renderer transmet seulement le contexte de vue source au Presentation Binding ;
- Combat Rules, Runtime, SkillDefinition, dégâts, énergie et timings restent inchangés.

Le remplacement binaire de `braisombre_player.webp` est effectué séparément dans ce même petit chantier, avec mise à jour des anchors de la vue player pour le nouveau visuel.


### Source visuelle face Braisombre validée

Retour utilisateur du 2026-09-25 :

- la nouvelle planche `7104.png` fournit la **vue face** à utiliser ;
- la vue dos présente sur cette nouvelle planche ne doit **pas** être utilisée car elle est signalée comme buguée ;
- la vue dos reste celle extraite de la planche précédente `7103.png` ;
- le remplacement doit donc composer deux sources distinctes :
  - `braisombre_opponent.webp` <- face de `7104.png` ;
  - `braisombre_player.webp` <- dos validé de `7103.png`.


### Remplacement runtime Braisombre effectué

Validation dépôt après upload utilisateur du 2026-09-26 :

- `runtime/braisombre_player.webp` remplacé par le nouveau dos validé issu de la planche précédente ;
- `runtime/braisombre_opponent.webp` remplacé par la nouvelle face validée issue de `7104.png` ;
- le dos défectueux de `7104.png` n'est pas utilisé ;
- les blobs GitHub correspondent exactement aux deux WebP préparés pour le remplacement :
  - player : `383667b9a54919c75f1027b254e7e85b983353ef` — 603624 octets ;
  - opponent : `18d00a376db5b9486a91189444443c7712a35480` — 758530 octets ;
- anciens blobs runtime remplacés :
  - ancien player : `4f7bb0d4ce80543a7a4842965fdb3c62991d76a2` ;
  - ancien opponent : `0f959ceafacb4d38ea3dd723abc5edeac89f76f1` ;
- aucun ancien PNG de modèle ni doublon ne reste dans `assets/test/creatures/braisombre/` ;
- le dossier runtime contient uniquement l'icône et les deux modèles actifs ;
- CI du commit d'upload utilisateur `c195f95a882cafc139288dced740051e1618ebad` : run `36219042858` — SUCCESS ;
- le correctif de layering FX adverse reste inchangé et vert ;
- aucune règle de combat, énergie, dégâts, timing ou SkillDefinition modifiée.

Validation visuelle smartphone des deux nouveaux modèles et du layering adverse encore requise avant checkpoint GREEN final du lot.


### Validation visuelle utilisateur — Braisombre + layering FX

Validation reçue le 2026-09-26 : utilisateur : « Parfait ».

Cette validation couvre :
- les nouveaux modèles Braisombre player/opponent ;
- le cadrage général des deux vues ;
- le correctif de layering du cast Boule de feu adverse devant la créature.

Le lot peut être checkpointé GREEN au SHA documentaire final après CI.


### Lot — bindings provisoires nouveaux sprites de capacités

Demande utilisateur du 2026-09-26 :

- lier provisoirement le sprite Griffe à l'impact de `claw` ;
- utiliser `teleportation_1` comme cast de `aerial-dive` ;
- utiliser un impact physique cohérent pour `aerial-dive` : le même impact Griffe est retenu provisoirement ;
- utiliser `teleportation_2` sur la compétence `teleport-strike` à chaque disparition réelle de la créature.

Base du lot :

- checkpoint GREEN précédent : `checkpoint/lab-dragon-back-fx-layer-v9-green-2026-09-26` ;
- base SHA : `9e54be625ce3c7c82236d40e8d85ec08f2b496bb` ;
- branche : `work/lab-skill-sprite-bindings-v9-2026-09-26` ;
- preview : `preview/lab-skill-sprite-bindings-v9-2026-09-26`.

Assets repris depuis la branche divergente `work/lab-claw-impact-sprites-2026-09-26` sans merger cette branche :

- `claw_impact` ;
- `teleportation_1` ;
- `teleportation_2`.

Important :

- `claw_impact` annonçait 8 frames dans son manifeste source mais seulement 2 fichiers étaient réellement présents ;
- l'intégration corrige donc le manifeste à 2 frames actives pour rester conforme à l'état physique réel ;
- les 6 frames manquantes pourront être ajoutées ultérieurement sans changer l'asset ID logique.

Bindings provisoires :

- `claw.impactFx -> pack:capture:sprite-claw-impact-01` ;
- `aerial-dive.castFx -> pack:capture:sprite-teleportation-1` ;
- `aerial-dive.impactFx -> pack:capture:sprite-claw-impact-01` ;
- `teleport-strike.phaseFxByLabel.teleport-vanish -> pack:capture:sprite-teleportation-2` ;
- `teleport-strike.phaseFxByLabel.teleport-return-vanish -> pack:capture:sprite-teleportation-2`.

Architecture :

- le renderer FX supporte maintenant les séquences multi-fichiers via `frames[] + frameMs`, en plus des atlas existants ;
- les phases de téléportation proviennent des labels réels du plan Animation Core ;
- `teleportation_2` se déclenche donc au début de chaque segment de disparition, y compris le retour ;
- aucun délai de gameplay, dégâts, énergie, portée ou résultat de combat n'est recalculé par les sprites ;
- Combat Rules et SkillDefinition restent indépendants des chemins et assets visuels.

Validation visuelle smartphone requise avant checkpoint GREEN final.
