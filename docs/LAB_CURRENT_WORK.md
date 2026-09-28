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


Validation technique du lot sprites :

- SHA fonctionnel : `bb2f4193ebb82e3d57a2d7ecf7bd1086b7e383c6` ;
- CI work : run `36221971880` — SUCCESS ;
- diff revu depuis le checkpoint de départ : uniquement nouveaux assets Capture, Presentation Binding, renderer FX, visual controller, CSS, tests et documentation ;
- aucun fichier Combat Rules, Combat Runtime, résolution dégâts/énergie/portée ou roster modifié ;
- le déclenchement `teleportation_2` dépend des labels `teleport-vanish` et `teleport-return-vanish` émis par le plan d'animation existant ;
- `teleportation_1` est provisoirement lié au cast de Plongeon aérien ;
- l'impact Griffe est provisoirement partagé entre Griffe et Plongeon aérien ;
- validation visuelle smartphone requise avant checkpoint GREEN final.


### Ajustement visuel — scales + correction Griffe

Retour utilisateur du 2026-09-26 :

- les nouveaux sprites fonctionnent ;
- certains manquent encore de présence / taille ;
- le futur éditeur doit obligatoirement proposer un réglage manuel du scale par effet ;
- la configuration des sprites attachés aux phases de téléportation doit rester simple et intuitive.

Correction asset détectée sur `work/lab-claw-impact-sprites-2026-09-26` :

- commit source : `ba1346d3455c98c78d63fcf925189609e9d6c40a` ;
- `claw_impact` contient maintenant 8 frames réelles ;
- frames 01–02 : PNG ;
- frames 03–08 : SVG ;
- le manifeste runtime du chantier combat est aligné sur ces 8 fichiers ;
- le binding supporte explicitement les séquences à extensions mixtes.

Scales provisoires de test :

- Griffe impact : `1.7 -> 2.2` ;
- Téléportation 1 / cast aérien : `1.8 -> 2.35` ;
- Téléportation 2 / disparition : `1.65 -> 2.1`.

Ces valeurs sont uniquement des réglages de présentation de laboratoire.

Documentation officielle ajoutée :

- `docs/LAB_ASSET_LIBRARY.md` définit les futurs réglages de l'éditeur :
  - scale indépendant par slot ;
  - choix d'asset par catalogue ;
  - attachment lanceur / cible / position fixe / trajet / sol ;
  - anchor ;
  - offsets X/Y ;
  - layer devant / derrière ;
  - trigger utilisateur ;
  - rotation / opacité optionnelles ;
  - presets simples + réglages avancés ;
  - mapping des termes utilisateurs vers les phases techniques Animation Core.
- `docs/LAB_ROADMAP.md` renvoie explicitement vers ce contrat pour le futur chantier éditeur.

Aucune règle de combat n'est modifiée par ces réglages.


Validation technique finale du sous-lot scale / Griffe :

- SHA validé : `eed8df55d2570bd7abbf38839bfb630703665aea` ;
- CI work : run `36222547220` — SUCCESS ;
- l'échec intermédiaire du SHA `4a0470b0270154253ed5984dc3ce36d3c2f87114` provenait d'une sentinelle encore alignée sur l'ancienne séquence Griffe à 2 frames ;
- après mise à jour des tests à 8 frames et couverture des nouveaux scales, CI verte ;
- aucun changement Combat Rules / Runtime / dégâts / énergie / portée / cooldown.


### Correction — aura de charge aérienne trop peu visible

Retour utilisateur du 2026-09-26 : l'effet `teleportation_1` utilisé comme cast de Plongeon aérien est presque invisible malgré le scale augmenté.

Cause démontrée :

- la séquence contient 8 frames à 42 ms = 336 ms de lecture native ;
- la préparation de `aerial-dive` dure 900 ms ;
- le renderer jouait la séquence une seule fois puis conservait la dernière frame ;
- la frame 08 est volontairement faible, donc l'effet restait presque invisible pendant la majorité de la préparation.

Correction :

- l'asset `teleportation_1` reste non-loop par défaut dans la bibliothèque ;
- le Presentation Binding de `aerial-dive.castFx` applique `playbackMode: "loop"` ;
- le renderer de séquences supporte désormais `once / loop / stretch` ;
- le loop s'arrête automatiquement quand le slot Cast se termine ;
- aucun timing gameplay n'est modifié : `preparationMs` reste 900 ms et reste propriété du Runtime / SkillDefinition.

Ce réglage est ajouté au contrat du futur éditeur de compétences afin qu'un même asset puisse être joué une fois, bouclé comme aura, ou étiré à la durée d'un slot sans modifier sa source.


### Correction de direction — audio runtime GenSrpG

Retour utilisateur du 2026-09-26 : le prototype local demandant de sélectionner manuellement des WAV n'est pas conforme à l'objectif produit.

Décision :

- le prototype `Sons 0/3` est rejeté comme direction produit ;
- la nouvelle branche repart du dernier SHA Combat propre `42d9fc194c468c8393c4baa2128cff05853e50ab` ;
- aucun loader de fichiers utilisateur n'est présent dans cette nouvelle direction ;
- le dépôt privé `slyen4425-cloud/GenSrpG_audio_prive` reste la banque source / provenance ;
- le jeu doit consommer une bibliothèque runtime via des `assetId` stables et un resolver de livraison ;
- l'éditeur de compétence doit enregistrer les `assetId` sonores par slot de présentation, sans chemin physique ni fichier local ;
- le catalogue de test public contient les métadonnées et IDs mais pas les sources privées ;
- le manifeste privé associe les IDs runtime aux chemins source du dépôt privé ;
- une couche de publication/livraison doit fournir automatiquement les URLs jouables au client.

Flux cible :

`source privée -> publication runtime -> catalogue assetId -> resolver -> jeu / éditeur`

Important : tout son réellement lu dans un navigateur est techniquement récupérable par le client. La confidentialité protège donc la banque source et l'organisation interne ; la copie runtime doit être considérée comme un asset distribué au jeu.


### Lot audio runtime automatique — test réel

Demande utilisateur du 2026-09-26 : tester le fonctionnement final sans téléchargement manuel.

Principe validé pour ce test :

`source privée -> copie runtime compressée -> catalogue assetId -> resolver -> Audio Adapter -> compétence`

Source privée :

- dépôt `slyen4425-cloud/GenSrpG_audio_prive` ;
- WAV maîtres conservés hors du laboratoire public ;
- workflow privé génère des MP3 runtime compressés.

Copies runtime de test publiées uniquement sur la branche laboratoire :

- `assets/runtime/audio-test/fire_cast.mp3` ;
- `assets/runtime/audio-test/melee_impact.mp3` ;
- `assets/runtime/audio-test/teleport.mp3`.

Bindings actifs :

- `fireball.castSound -> gensrpg:sound:fire-cast-01` ;
- `claw.impactSound -> gensrpg:sound:melee-impact-01` ;
- `aerial-dive.castSound -> gensrpg:sound:teleport-01` ;
- `teleport-strike` joue `gensrpg:sound:teleport-01` sur les phases `teleport-vanish` et `teleport-return-vanish`.

Aucune sélection de fichier utilisateur n'est requise. Aucun bouton `Sons 0/3` n'est présent dans cette direction.

Les copies runtime sont des fichiers de test distribuables au navigateur ; elles ne remplacent pas les sources privées.


## Chantier actif — concurrence hit / animation d'approche + audio d'impact

Date : 2026-09-26

Nom :

`concurrent-hit-presentation-v9`

Objectif :

Corriger une régression de présentation où un `hit` reçu pendant la préparation ou le trajet d'une attaque d'approche peut annuler visuellement l'attaque, alors que le Combat Runtime continue jusqu'à l'impact et applique correctement le résultat gameplay.

Le lot ajoute aussi un son d'impact provisoire aux compétences offensives de test qui n'en ont pas encore.

Checkpoint de départ :

`checkpoint/lab-start-concurrent-hit-presentation-v9-2026-09-26`

SHA de base :

`f291db91474f35fcd6b3df2ba616aed7d3ee215c`

Branche de travail :

`work/lab-concurrent-hit-presentation-v9-2026-09-26`

Branche preview :

`preview/lab-concurrent-hit-presentation-v9-2026-09-26`

Propriétaires concernés :

- Combat Runtime reste propriétaire de `releaseAtMs / impactAtMs` et du résultat gameplay ;
- Animation Core reste propriétaire du plan `aerial / ground / teleport` ;
- Visual Controller / Render Adapter gère uniquement la concurrence entre animations de présentation ;
- SkillPresentationBinding reste propriétaire des sons d'impact.

Cause démontrée :

- `DomActorRenderer.play()` annule volontairement l'animation précédente d'un slot ;
- `playEventFor(slot, "hit")` utilise ce même renderer que `playApproachFor()` ;
- un hit normal peut donc remplacer un piqué déjà engagé ;
- inversement, si un hit commencé pendant la charge est annulé par le départ du piqué, son callback de fin peut relancer `idle` et écraser le nouveau piqué ;
- le gameplay n'est pas fautif : `impactAtMs = preparationMs + travelMs` ;
- le plan aérien atteint la cible exactement à la somme `rise + reposition + dive = travelMs`.

Fichiers autorisés pour ce lot :

- `src/ui/demo-app.js`
- `src/adapters/renderer/combat-resolution-presenter.js`
- `examples/dom-demo/demo-assets.js`
- tests ciblés de présentation / assets / animation
- documentation du lot

Domaines protégés :

- aucun changement de dégâts, énergie, portée ou résolution ;
- aucun changement du calcul `impactAtMs` ;
- aucun nouveau timer gameplay ;
- aucun accès à GenSrpG principal ;
- aucun changement de `main`.

Critères de fin :

1. un hit reçu pendant la préparation ne peut plus faire relancer un idle obsolète après le départ de l'attaque ;
2. un hit non-KO reçu pendant une approche ne peut plus annuler cette approche ;
3. un KO / contre / reflet qui annule réellement l'action conserve le droit d'annuler la présentation ;
4. l'impact gameplay reste synchronisé avec le contact prévu par `travelMs` ;
5. chaque compétence offensive de test possède un `impactSound` provisoire ;
6. tests verts puis validation mobile utilisateur avant checkpoint GREEN.


### Résultat technique du lot concurrence hit / approche

Correctifs appliqués :

- un `hit` normal reçu pendant une approche `ground / aerial / teleport` n'écrase plus l'animation d'approche ;
- le hit est différé visuellement jusqu'à la fin de l'approche protégée, tandis que l'impact FX et l'audio peuvent rester immédiats ;
- une animation annulée / remplacée ne relance plus un `idle` obsolète : `startIdleFor()` n'est appelé qu'après une fin réelle `status === "finished"` ;
- `KO` reste une interruption explicite et annule immédiatement l'approche avant `hit -> ko` ;
- `fireball`, `claw`, `aerial-dive` et `teleport-strike` possèdent désormais tous un `impactSound` provisoire dans leur Presentation Binding ;
- aucun changement n'a été apporté au calcul de dégâts ni à `impactAtMs`.

Invariant confirmé :

Pour `aerial-dive`, `rise + reposition + dive = travelMs`. Le Combat Runtime résout à `preparationMs + travelMs`, soit le même instant logique que le contact cible. Le problème observé venait donc bien d'une annulation de présentation, pas d'un décalage de règle gameplay.

CI :

- SHA technique : `7e47d5ae1ba62dff0fdb37a6d1941952019d33a5`
- run : `36252505422`
- conclusion : SUCCESS

Validation mobile utilisateur encore requise avant checkpoint GREEN.


## Bibliothèque visuelle globale — migration 2026-09-26

Décision appliquée :

Les assets réutilisables ne doivent plus être consommés depuis une branche `work/` ou `preview/`.

Source stable créée :

- branche : `global-assets`
- catalogue : `data/assets/catalog/global-visual-assets.v1.json`
- racine : `assets/library/`

Contenu consolidé :

- 31 icônes ;
- 22 séquences sprites ;
- 2 FX ;
- 1 arène ;
- nouveaux lots : 5 casts, 5 impacts, 8 projectiles élémentaires.

Le combat courant résout désormais ses visuels depuis la branche stable `global-assets` via `src/assets/global-visual-library.js`.

Les bindings continuent à référencer uniquement des `assetId`. Les branches de travail ne sont plus des sources runtime de bibliothèque.

CI :

- `global-assets` : SUCCESS au SHA `12e9ac9253269d3de8937136eabc98857678439d`
- raccord Combat : SUCCESS au SHA `6edb9fa9979852e8a0c7f91814322ff5c422b91a`

`main` reste inchangée.


### Extension bibliothèque globale — créatures et arène

Vérification / migration effectuée le 2026-09-26 :

- l'arène forêt était déjà résolue depuis `global-assets` ;
- Maraileron et Braisombre ont été publiés dans `assets/library/capture/creatures/<id>/` sur `global-assets` ;
- chaque créature conserve un dossier propre avec metadata + `runtime/player`, `runtime/opponent`, `runtime/icon` ;
- `src/ui/demo-app.js` charge désormais les metadata de créatures via le resolver global ;
- les anciens fichiers sous `assets/test/creatures/` ne sont plus la source runtime ; ils restent seulement des fixtures historiques du laboratoire ;
- le catalogue global contient maintenant les six visuels de créatures avec leurs `assetId`.

CI du raccord créatures : SUCCESS, run `36261750143`.

Règle confirmée : bibliothèque globale stable, rangement par famille/type, jamais de branche `work/` comme source runtime.


## Preview test — Loup volcanique / arène lave — 2026-09-26

Objectif :

- vérifier le nouveau monstre **Loup volcanique** dans le vrai combat laboratoire ;
- remplacer visuellement et dans le roster de test la créature Maraileron par `loup_volcanique` ;
- afficher une autre arène de la bibliothèque, ici `core:arena-lava-01` ;
- ne modifier aucune règle de dégâts, énergie, distance, timing, IA ou animation.

Base :

- checkpoint : `checkpoint/lab-start-loup-lava-preview-v9-2026-09-26` ;
- branche travail : `work/lab-loup-lava-preview-v9-2026-09-26` ;
- branche preview : `preview/lab-loup-lava-preview-v9-2026-09-26`.

Principe :

- la démo normale reste Maraileron / forêt par défaut ;
- la variante est activée uniquement par `?variant=loup-lava` ;
- les visuels du loup et l'arène lave sont résolus depuis la branche stable `global-assets` ;
- un roster et une configuration combattant spécifiques à la preview sont fournis côté données de test ;
- le montage combat déduit désormais son combattant initial depuis le roster chargé au lieu de coder en dur Maraileron / Braisombre.

CI technique avant publication preview :

- SHA : `27b382628f9d8d9f9682eb10bba5cbe3b84ceb25` ;
- run : `36274238057` ;
- conclusion : SUCCESS.

Validation visuelle smartphone utilisateur requise avant tout checkpoint GREEN de cette variante.


## Diagnostic isolé — arène lave locale / preview loup — 2026-09-26

Objectif :

- conserver exactement l'état combat mobile validé au SHA `bca09271a2850200b07164cfbe12b16507c71b89` ;
- vérifier uniquement le chemin de rendu d'une arène avec un binaire WebP valide, sans republier `global-assets` ;
- déterminer si l'absence d'arène vient du binaire livré par `global-assets` ou du mécanisme de présentation.

Base / branches :

- base connue fonctionnelle : `bca09271a2850200b07164cfbe12b16507c71b89` ;
- checkpoint : `checkpoint/lab-start-arena-local-diagnostic-v9-2026-09-26` ;
- travail : `work/lab-arena-local-diagnostic-v9-2026-09-26` ;
- preview : `preview/lab-arena-local-diagnostic-v9-2026-09-26`.

Périmètre autorisé :

- `assets/test/arenas/lava/arena_lava_01.webp` : copie de test uniquement ;
- `examples/dom-demo/demo-assets.js` : binding diagnostic uniquement ;
- tests ciblés présentation arène ;
- présente section de documentation.

Domaines protégés :

- aucun changement Combat Rules / Runtime / Animation / FX ;
- aucun changement du renderer ;
- aucun changement de `global-assets` ;
- aucun changement de `main` ;
- aucun second système d'affichage d'arène.

Principe du test :

- réutiliser le mécanisme déjà validé `presentationForArena() -> background url -> custom property CSS` ;
- seule la provenance du binaire change temporairement vers `assets/test/` sur cette branche isolée ;
- si l'arène locale apparaît avec combat fonctionnel, la cause est la livraison / disponibilité du binaire global, pas le renderer ;
- si elle n'apparaît pas, le diagnostic reste sur le mécanisme de présentation existant.

Critère de fin :

- CI verte ;
- test smartphone utilisateur ;
- aucune promotion stable avant résultat du test.


## Preview test — 4 créatures / arène cité — 2026-09-26

Objectif :

- proposer les quatre créatures disponibles dans une même simulation : Maraileron, Braisombre, Loup volcanique et Golem moussu ;
- conserver les mécaniques de roster existantes (actif + réserves, rappel / invocation) ;
- tester une autre arène, ici la cité, via le même chemin de présentation déjà validé ;
- ne modifier aucune règle de dégâts, énergie, distance, IA, timing ou animation.

Base / branches :

- base mobile validée : `cbb763f816f5dcc50f273e55d3ae2c5e01094b0b` ;
- checkpoint : `checkpoint/lab-start-four-creatures-city-preview-v9-2026-09-26` ;
- travail : `work/lab-four-creatures-city-preview-v9-2026-09-26` ;
- preview : `preview/lab-four-creatures-city-preview-v9-2026-09-26`.

Périmètre autorisé :

- métadonnées visuelles du Golem moussu chargées depuis `global-assets` ;
- fixture combattant du Golem moussu côté données de test ;
- roster de preview contenant les quatre créatures ;
- fixture locale de l'arène cité sous `assets/test/arenas/city/` ;
- binding de présentation et bootstrap de variante preview ;
- tests ciblés ;
- présente documentation.

Domaines protégés :

- aucun changement Combat Rules / Runtime / Animation Core / FX Core ;
- aucun changement du renderer ;
- aucun changement de `main` ;
- aucun changement de `global-assets` ;
- aucune deuxième logique de rendu d'arène.

Critères :

- les quatre créatures sont accessibles dans le roster ;
- Loup volcanique et Golem moussu peuvent être affichés comme actifs ;
- l'arène cité s'affiche par le mécanisme `presentationForArena()` existant ;
- CI verte ;
- validation smartphone utilisateur avant checkpoint GREEN.


### Ajustement preview — cadrage arène cité + note futur éditeur

Retour smartphone utilisateur : l'arène cité est visible mais la créature adverse peut sembler flotter / se trouver dans le vide.

Correctif de présentation :

- aucun changement du renderer, du moteur de combat ou du gameplay ;
- le binding d'arène expose désormais des paramètres génériques `backgroundPosition` et `backgroundSize` ;
- les valeurs par défaut restent `center` / `cover` pour les autres arènes ;
- la cité utilise pour ce test `backgroundPosition: center bottom` et `backgroundSize: auto 112%` afin de remonter visuellement le sol derrière la zone adverse ;
- `demo.js` applique ces métadonnées génériquement via les variables CSS de présentation, sans branche spéciale propre à l'arène cité.

Note de développement ajoutée dans `docs/LAB_ASSET_LIBRARY.md` :

- futur import d'images d'arène personnalisées dans GenSrpG ;
- cadrage X/Y et zoom réglables ;
- preview immédiate et reset ;
- image source conservée séparément du cadrage ;
- `assetId` stable et aucune autorité gameplay du décor.

Checkpoint avant ce micro-lot : `checkpoint/lab-four-city-before-arena-framing-note-2026-09-26`.

Validation smartphone requise avant checkpoint GREEN.


### Correctif preview — Loup volcanique adverse invisible — 2026-09-27

Retour utilisateur : le Loup volcanique côté adversaire n'était pas visible en combat.

Cause démontrée :

- le fichier `global-assets/assets/library/capture/creatures/loup_volcanique/runtime/loup_volcanique_opponent.webp` existait mais son blob publié n'était pas un WebP décodable ;
- le fichier joueur et l'icône étaient valides ;
- la source WebP adverse valide existait encore dans la branche de staging historique `temp/inspect-loup-blobs-2026-09-26` sous forme de fragments base64 ;
- ces fragments ont été reconstitués puis validés visuellement avant publication.

Réparation :

- checkpoint global-assets : `checkpoint/global-assets-before-wolf-opponent-repair-2026-09-27` ;
- branche : `work/global-assets-wolf-opponent-repair-2026-09-27` ;
- remplacement du seul binaire adverse par un WebP valide ;
- `visualRevision` du Loup volcanique incrémentée ;
- ajout d'un test de signature `RIFF....WEBP` pour les trois runtime assets du Loup ;
- la Demo UI propage désormais `visualRevision` dans l'URL des bitmaps runtime afin qu'un binaire corrigé ne reste pas masqué par un ancien cache navigateur/CDN ;
- aucun changement Combat Rules / Runtime / Animation / FX / dégâts / énergie.

Validation smartphone utilisateur requise avant checkpoint GREEN du correctif.


### Micro-lot UI combat — nom / PV / icônes de créatures — 2026-09-27

Retour utilisateur : agrandir l'UI de statut joueur et adversaire, rapprocher sa hauteur visuelle de celle des capacités, placer le nom de la créature au-dessus des PV, puis les icônes de créatures sous les PV.

Base / sécurité :

- base validée : `80bdcd39c3f092421073f183199e0945ae020b26` ;
- checkpoint : `checkpoint/lab-four-city-before-hud-card-enlarge-2026-09-27` ;
- branche : `work/lab-four-creatures-city-preview-v9-2026-09-26` ;
- `main` et `global-assets` protégées.

Périmètre autorisé :

- `examples/dom-demo/index.html` pour réordonner uniquement les éléments du HUD de statut ;
- `examples/dom-demo/demo.css` pour taille / espacement / hiérarchie visuelle ;
- tests UI ciblés ;
- présente documentation.

Domaines protégés :

- aucun changement Combat Rules / Runtime / Animation / FX / IA / roster ;
- aucun changement des créatures, dégâts, PV réels, énergie ou timings ;
- aucun changement du renderer de créatures.

Résultat visuel cible :

- nom au-dessus de la barre de PV ;
- valeur PV lisible sur la même ligne que la barre ;
- rangée d'icônes de l'équipe sous les PV ;
- mêmes règles pour joueur et adversaire ;
- carte de statut agrandie pour atteindre la même hauteur visuelle de référence que les touches principales de capacités.

Tests :

- structure HTML ordre nom -> PV -> roster ;
- CSS commun joueur/adversaire, sans duplication spéciale ;
- contrôles existants et sélecteurs `data-*` inchangés ;
- CI verte puis validation smartphone utilisateur avant checkpoint GREEN.


### Micro-lot UI — indicateur créature vaincue + réflexion format 2v2 — 2026-09-27

Retour utilisateur :

- une créature à 0 PV doit être immédiatement identifiable dans la rangée d'icônes ;
- réfléchir à un futur mode avec deux créatures actives simultanément par camp, sans rendre tous les combats obligatoirement 2v2.

Base / sécurité :

- base validée : `cb9f8c56991016260038b695252ee1d2503dcf93` ;
- checkpoint : `checkpoint/lab-four-city-before-defeated-indicator-2v2-note-2026-09-27` ;
- branche : `work/lab-four-creatures-city-preview-v9-2026-09-26` ;
- `main` et `global-assets` protégées.

Périmètre implémenté maintenant :

- dériver l'état visuel `vaincu` uniquement depuis le snapshot roster existant (`member.hp <= 0`) ;
- exposer cet état via un attribut de présentation `data-defeated` ;
- afficher une croix rouge lisible sur l'icône correspondante ;
- mettre à jour le libellé accessible avec `vaincu` ;
- aucun nouvel état gameplay, aucune seconde source de vérité.

Périmètre différé :

- aucun 2v2 n'est implémenté dans ce micro-lot ;
- documenter dans `LAB_ARCHITECTURE.md` un futur format de combat configurable où le nombre de combattants actifs par équipe est une donnée de match et non une constante globale.

Tests :

- l'UI marque un membre à 0 PV avec `data-defeated=true` ;
- le style de défaite est commun joueur/adversaire ;
- aucun test ne suppose que la défaite est décidée par l'UI ;
- CI verte puis validation smartphone utilisateur avant checkpoint GREEN.


Résultat technique du micro-lot :

- `reserveCard()` ne décide pas la défaite : il lit uniquement `member.hp` provenant du snapshot Roster Session ;
- `member.hp <= 0` expose `data-defeated="true"` ;
- l'icône reçoit une croix rouge et un léger voile désaturé ;
- le libellé accessible devient `<nom> — vaincu` ;
- aucun nouvel état métier ni second mécanisme de KO n'a été ajouté ;
- la réflexion 2v2 est documentée dans `docs/LAB_ARCHITECTURE.md` comme **format optionnel par combat**, avec 1v1 conservé comme format possible ;
- aucun vrai 2v2 n'est implémenté dans ce lot.

CI work : SUCCESS, run `36293147255`, SHA `fc4c9984a8079f1dda77f76df5089d59da800806`.

Validation smartphone de la croix rouge encore requise avant checkpoint GREEN.


### Validation KO + micro-lot retrait UI distance / conception 2v2 coop — 2026-09-27

Validation utilisateur : l'indicateur rouge de créature vaincue est validé.

- checkpoint GREEN : `checkpoint/lab-defeated-icon-green-2026-09-27` ;
- SHA validé : `0315ccf9ad9fcfb0322e23b08b37f3e0a65b107b`.

Nouveau lot demandé :

1. retirer purement et simplement de l'interface les boutons de distance `Courte / Moyenne / Longue` ;
2. ne pas masquer ces boutons par CSS : les éléments et leur branche UI doivent être réellement retirés ;
3. éviter qu'une distance interne restante rende des capacités artificiellement indisponibles dans cette preview ;
4. documenter la conception future du 2v2 coop sans l'implémenter maintenant.

Base / sécurité :

- base : `0315ccf9ad9fcfb0322e23b08b37f3e0a65b107b` ;
- checkpoint : `checkpoint/lab-start-distance-ui-removal-2v2-targeting-design-2026-09-27` ;
- branche : `work/lab-four-creatures-city-preview-v9-2026-09-26` ;
- `main` et `global-assets` protégées.

Périmètre autorisé pour le retrait distance :

- `examples/dom-demo/index.html` : suppression réelle du bloc de boutons de distance ;
- `src/ui/combat-test-ui.js` : suppression de la collecte, du rendu de disponibilité et des listeners de déplacement manuel ;
- données de compétences de la démo : neutralisation uniforme de la contrainte de portée afin qu'aucune capacité ne reste cachée/inutilisable à cause d'une distance non pilotable ;
- tests UI / données ciblés ;
- CSS devenu orphelin relatif aux boutons de distance peut être supprimé.

Domaines protégés :

- aucun changement du calcul de dégâts, énergie, timing, KO, roster ou IA ;
- aucun changement Animation Core / FX / renderer ;
- pas de suppression précipitée du module de distance interne tant qu'il sert encore au placement spatial de présentation ;
- pas de `display:none` ni de second chemin compensatoire.

Conception 2v2 validée à documenter :

- le 2v2 est réservé aux combats avec **deux contrôleurs alliés distincts** ;
- le second contrôleur peut être humain ou IA ;
- un joueur humain ne contrôle pas les capacités de son allié ;
- chaque joueur voit sa propre créature et la créature alliée, mais sa barre d'actions ne montre que ses propres capacités ;
- l'allié expose surtout état, PV et action en cours ;
- les adversaires peuvent rester plus sobres visuellement ;
- toute créature visible peut devenir cible par clic si la compétence l'autorise, y compris un allié pour soin / protection / renforcement ;
- la sélection de cible doit être explicite et lisible, avec distinction visuelle allié / ennemi / cible choisie.

Critère de fin du micro-lot actuel :

- aucune commande de distance visible ;
- aucune capacité de la preview bloquée uniquement par la distance ;
- CI verte ;
- notes 2v2 mises à jour sans implémentation fonctionnelle du 2v2 ;
- validation smartphone utilisateur.


Résultat du lot distance / conception 2v2 :

- les trois commandes `Courte / Moyenne / Longue` ont été supprimées du HTML ;
- leurs styles CSS et leur branche UI (`movementButtons`, `renderMovement`, listeners manuels) ont été supprimés, pas masqués ;
- la Demo UI n'appelle plus `session.previewMovement()` ni `session.move("player", ...)` ;
- les quatre capacités offensives de la preview acceptent désormais les trois bandes internes, afin qu'aucune capacité ne reste bloquée par une distance que le joueur ne peut plus piloter ;
- le Core de distance n'a pas été supprimé dans ce micro-lot : il reste testé séparément et sert encore à certains calculs / placements existants, ce qui évite une refonte hors périmètre ;
- les tests IA dépendant historiquement des portées ont été découplés des données de preview : le comportement de déplacement du Core reste couvert avec une compétence synthétique explicitement restreinte ;
- l'architecture 2v2 coop a été précisée dans `docs/LAB_ARCHITECTURE.md` : un contrôleur par créature active, barre de capacités uniquement pour l'acteur local, allié en HUD léger, ciblage par clic incluant les alliés si la compétence l'autorise.

CI work : SUCCESS, run `36293995262`, SHA `f071a03ff066d387547e05999f61b8c0e789902f`.

Validation smartphone requise avant checkpoint GREEN du retrait distance.


### Micro-lot FX — projectile contre cible en mouvement — 2026-09-27

Validation utilisateur préalable : retrait des distances validé sur smartphone.

- checkpoint GREEN précédent : `checkpoint/lab-distance-ui-removal-green-2026-09-27` ;
- base du nouveau lot : `c44cc2e4d588fda77dba53713345efed11af7445` ;
- checkpoint de départ : `checkpoint/lab-start-projectile-live-contact-2026-09-27`.

Bug observé : lorsqu'une créature avance pendant une attaque de contact (ex. Griffe) et que l'adversaire lance une Boule de feu, le projectile peut visuellement traverser la créature puis terminer sur son ancien slot stable. Les dégâts sont corrects et ne doivent pas être modifiés.

Cause architecturale ciblée :

- le projectile classique vise actuellement le `targetAnchor` stable pendant tout son trajet ;
- la créature visuelle peut cependant se déplacer via son `motion anchor` ;
- l'impact `hit` utilise lui aussi le slot stable, d'où un impact visuel possible dans le vide lorsque la cible est encore en mouvement.

Périmètre autorisé :

- `src/adapters/renderer/dom-skill-fx.js` : détection de contact **strictement visuelle** entre le projectile actif et l'anchor visuel mobile de sa cible ;
- impact `hit` sur l'anchor visuel courant de la cible ;
- injection d'un scheduler de frame testable, actif uniquement pendant un projectile ;
- tests unitaires FX ciblés ;
- documentation architecture du comportement.

Domaines protégés :

- aucun changement dégâts / PV / hit / evade / timing sémantique ;
- aucun changement Combat Rules, Runtime ou Action Resolver ;
- aucun calcul de collision DOM ne décide d'un résultat gameplay ;
- le projectile `evaded` conserve son principe de miss vers le point stable ;
- pas de boucle permanente : le suivi existe uniquement tant qu'un projectile FX est actif.

Résultat visuel cible :

- si un projectile rencontre réellement la créature cible pendant que celle-ci se déplace, il ne doit pas visuellement la traverser ;
- un impact sémantique `hit` doit être dessiné sur la créature à sa position visuelle courante, pas sur un emplacement vide ;
- les dégâts restent exactement ceux du moteur actuel.

Critères :

- test collision visuelle projectile / cible mobile ;
- test impact `hit` sur anchor mobile ;
- miss reste sur anchor stable ;
- nettoyage frame/cancel sans fuite ;
- CI verte puis validation smartphone utilisateur.


Résultat technique du lot projectile / cible mobile :

- la trajectoire nominale du projectile reste dirigée vers le slot stable : aucun comportement homing/tracking n'a été introduit ;
- pendant la seule durée de vie d'un projectile FX, le renderer vérifie le contact entre le centre du projectile et l'anchor visuel mobile de la cible ;
- lors d'un contact visuel réel, l'animation du projectile est annulée/nettoyée afin d'empêcher la traversée de la créature ;
- un impact sémantique `hit` se positionne maintenant sur l'anchor visuel courant de la cible ;
- le feedback `miss` conserve le point stable ;
- aucune donnée de collision DOM ne modifie les dégâts, PV, résultats ou timestamps du Combat Runtime ;
- le scheduler de frame est injecté et nettoyé avec le projectile : aucune boucle permanente.

Tests ajoutés / renforcés :

- projectile qui rencontre une cible mobile : arrêt + cleanup ;
- impact `hit` sur position live différente du slot stable ;
- miss toujours sur slot stable ;
- CI work : SUCCESS, run `36294688977`, SHA `de3dc86a67f8e3dae5dccf6875b74612bd549698`.

Validation smartphone requise sur le cas Griffe croisant Boule de feu avant checkpoint GREEN.


### Chantier dédié — preview coop 2v2 lisible — 2026-09-27

Validation utilisateur préalable : correction projectile / cible mobile validée.

- checkpoint GREEN précédent : `checkpoint/lab-projectile-live-contact-green-2026-09-27` ;
- base du chantier : `bef336ca64996e2fbe7c520bb47610589c1f0652` ;
- checkpoint de départ : `checkpoint/lab-start-coop-2v2-preview-2026-09-27` ;
- branche de travail : `work/lab-coop-2v2-preview-2026-09-27` ;
- branche preview : `preview/lab-coop-2v2-preview-2026-09-27`.

Objectif : produire une première simulation 2v2 réelle et testable sans transformer tous les combats du laboratoire en 2v2.

Format demandé :

- 2 créatures actives par camp ;
- le joueur local contrôle une seule créature et ne voit qu'une seule barre de capacités ;
- l'allié a son propre contrôleur distinct, ici une IA de test ;
- les deux adversaires ont chacun leur propre contrôleur IA ;
- chaque joueur voit l'état de son allié et des adversaires (nom / PV / action en cours) ;
- une créature visible peut être sélectionnée par clic comme cible ;
- les compétences actuelles sont offensives et ne doivent autoriser que des cibles ennemies ;
- le système de cible doit déjà distinguer `enemy / ally / self` afin de préparer soins / boucliers / buffs futurs.

Périmètre autorisé :

- nouveau contrat `BattleFormatDefinition` data-driven ;
- nouveau contrôleur IA générique d'acteur, sans dépendance DOM ;
- généralisation du contrôleur visuel pour accepter N slots déclarés dans le DOM ;
- passage explicite de `targetSlot` au presenter pour les attaques d'approche ;
- nouvelle UI de démonstration 2v2 dédiée, séparée de la page 1v1 ;
- nouvelle page exemple `coop-2v2.html` ;
- styles 2v2 ciblés et tests associés ;
- données de format de combat de test.

Domaines protégés :

- aucune duplication de Combat Rules / Combat Runtime / Animation Core / FX Core ;
- aucun booléen global `is2v2` dans le moteur ;
- la page 1v1 existante reste fonctionnelle et son flux n'est pas remplacé ;
- pas de seconde barre de capacités pour l'allié ;
- pas de faux partage d'autorité : l'allié IA possède un `controllerId` différent du joueur local ;
- les règles de cible ne sont pas décidées par le CSS ;
- `main` et `global-assets` restent intouchées.

Risques :

- le visual controller actuel suppose historiquement deux slots et doit être généralisé sans régression 1v1 ;
- le presenter d'approche doit recevoir la vraie cible quand plusieurs adversaires existent ;
- le runtime sait déjà gérer plusieurs `actorId`, mais le nouveau test doit démontrer quatre acteurs actifs sans introduire de source de vérité parallèle.

Critères de fin :

- 4 créatures visibles simultanément ;
- 1 seule barre de capacités pour le joueur local ;
- allié IA autonome ;
- 2 adversaires IA autonomes ;
- clic sur une créature = cible sélectionnée avec feedback lisible ;
- capacité offensive refusée sur allié / soi et autorisée sur ennemi vivant ;
- nom / PV / action des quatre acteurs lisibles sur smartphone ;
- CI verte ;
- validation smartphone utilisateur avant checkpoint GREEN.


Résultat technique du chantier coop 2v2 :

- nouvelle page dédiée `examples/dom-demo/coop-2v2.html` : aucun masquage ou duplication du flux 1v1 ;
- format `data/combat/battle-formats/demo-coop-2v2.format.json` avec 2 acteurs par équipe ;
- `player` = Loup volcanique contrôlé localement ;
- `ally` = Golem moussu contrôlé par IA indépendante ;
- `opponent` = Maraileron IA ;
- `opponent-b` = Braisombre IA ;
- une seule barre de capacités est rendue pour le joueur local ;
- les trois autres acteurs exposent seulement nom, PV et action en cours ;
- quatre acteurs utilisent le même `CombatSession` / `CombatRuntime` ;
- le visual controller accepte désormais les slots déclarés par la page et n'est plus limité à deux clés codées en dur ;
- le `targetSlot` est transmis explicitement aux attaques de contact / aériennes / téléportées ;
- sélection d'une cible par clic sur la créature ou sa carte ;
- relation de cible `self / ally / enemy` calculée par le Core `targeting.js` ;
- `SkillDefinition.targetRelations` ajouté, défaut `enemy` pour préserver les compétences existantes ;
- sélectionner l'allié est possible mais les quatre compétences offensives sont correctement désactivées pour cette cible ;
- contrôleur IA générique `battle-actor-ai-controller.js`, sans DOM, utilisé séparément par l'allié et les deux ennemis ;
- les décisions IA sont déclenchées par les changements d'état du Runtime et utilisent son horloge, sans boucle d'animation parallèle.

Tests :

- contrat BattleFormat 2v2 ;
- relations de cible et cible alliée refusée pour compétence offensive ;
- contrôleur IA allié avec deux cibles ennemies ;
- page 4 acteurs / une seule barre de capacités ;
- positions et cartes 2v2 ;
- sentinelles 1v1 adaptées au contrôleur visuel N-slots ;
- CI work : SUCCESS, run `36301369144`, SHA `f029eff36f9c82f73df582ca80738642273fb5f1`.

Validation smartphone utilisateur requise avant checkpoint GREEN 2v2.


### Micro-lot spatial polish 2v2 — 2026-09-27

Validation utilisateur du prototype 2v2 : fonctionnement global validé sur smartphone.

- checkpoint GREEN fonctionnel : `checkpoint/lab-coop-2v2-functional-green-2026-09-27` ;
- SHA validé : `9f32e4ba4a14203f1911c4a9f2ec8891c6d3e4fe` ;
- checkpoint de départ du polish : `checkpoint/lab-start-coop-2v2-spatial-polish-2026-09-27`.

Retour visuel demandé :

- décaler légèrement le groupe allié / joueur vers la droite ;
- décaler légèrement le groupe adverse vers la gauche ;
- descendre un peu le premier adversaire, actuellement trop haut ;
- ne modifier ni tailles, ni règles, ni contrôleurs, ni ciblage.

Périmètre autorisé :

- `examples/dom-demo/demo.css` : positions 2v2 uniquement ;
- tests CSS 2v2 ciblés ;
- présente documentation.

Domaines protégés :

- aucune modification Combat Rules / Runtime / IA / Targeting / FX / Animation ;
- aucune modification des barres de capacités ou cartes HUD ;
- aucun changement 1v1 ;
- aucun masquage ni compensation.

Critères :

- espacement central plus lisible ;
- équipes visuellement mieux regroupées ;
- premier adversaire moins haut ;
- CI verte ;
- validation smartphone utilisateur.


Résultat du spatial polish 2v2 :

- groupe joueur / allié légèrement décalé vers la droite ;
- groupe adverse légèrement décalé vers la gauche ;
- premier adversaire descendu pour mieux reposer visuellement dans l'arène ;
- tailles, HUD, ciblage, IA, Runtime et règles inchangés ;
- réglages appliqués aux tailles standard et mobile ;
- CI work : SUCCESS, run `36302152121`, SHA `4262c85b400c55e21c8d6abb4d2b13dc48b2affc`.

Validation smartphone requise avant checkpoint GREEN du polish spatial.


### Micro-lot 2v2 — séparation latérale / scale adverses / variété IA — 2026-09-27

Retour utilisateur :

- le décalage latéral entre les deux créatures d'un même camp reste trop peu prononcé ;
- les créatures adverses paraissent trop petites depuis le retrait des distances Courte / Moyenne / Longue ;
- les IA donnent l'impression d'utiliser toujours la même technique.

Base / sécurité :

- base : `9e1b165cadca0279da08278f253488cf96733b4e` ;
- checkpoint : `checkpoint/lab-start-coop-2v2-spacing-scale-ai-variety-2026-09-27` ;
- branche : `work/lab-coop-2v2-preview-2026-09-27` ;
- `main` et `global-assets` protégées.

Périmètre autorisé :

- `examples/dom-demo/demo.css` : positions et taille des quatre acteurs **uniquement dans la preview coop 2v2** ;
- `src/core/combat/battle-actor-ai-controller.js` : sélection séquentielle engagée afin que l'IA puisse attendre l'énergie nécessaire à sa prochaine technique au lieu de retomber systématiquement sur une technique moins chère ;
- `tests/unit/coop-2v2.test.mjs` : sentinelles position / scale / variété IA ;
- présente documentation.

Domaines protégés :

- aucun changement Combat Rules / dégâts / PV / énergie gagnée / temps de charge ;
- aucun changement 1v1 ;
- aucune modification des assets créatures ni de leur `displayScale` propre ;
- aucun changement du ciblage 2v2, du renderer, FX ou Animation Core ;
- pas de randomisation opaque : l'IA reste déterministe et testable.

Intentions :

- augmenter la séparation horizontale des binômes pour que les quatre silhouettes se lisent mieux ;
- agrandir légèrement les deux adversaires tout en conservant une différence de perspective par rapport au premier plan ;
- faire parcourir à chaque IA sa séquence de techniques complète : si la prochaine technique coûte plus d'énergie, elle attend au lieu de sauter immédiatement vers la première technique bon marché disponible.

Critères :

- 4 positions encore distinctes sur mobile ;
- adversaires visuellement plus présents sans masquer les cartes HUD ;
- l'IA démontre au moins deux coûts de techniques différents et ne spamme pas uniquement les capacités à 2 énergie ;
- CI verte ;
- validation smartphone utilisateur.


Résultat du micro-lot séparation / scale / variété IA :

- séparation horizontale renforcée dans la preview 2v2 : joueur `26%`, allié `58%`, adversaires `74%` et `42%` sur la vue standard ;
- réglages mobiles correspondants renforcés : `27% / 59% / 73% / 41%` ;
- les deux adversaires ont été agrandis uniquement dans la preview 2v2 (`31%` et `30%` de largeur de référence) afin de compenser la disparition des paliers visuels de distance sans toucher au `displayScale` propre des assets ;
- aucune modification du 1v1 ni des métadonnées créatures.

IA :

- cause du manque de variété : le contrôleur balayait la liste et choisissait immédiatement la première technique abordable ; avec la régénération d'énergie actuelle, les techniques à 2 énergie étaient donc favorisées au détriment des capacités à 3 énergie ;
- correction : l'IA s'engage maintenant sur sa prochaine technique planifiée ; si elle manque d'énergie, elle attend jusqu'à pouvoir la lancer au lieu de retomber sur une capacité moins chère ;
- la séquence reste déterministe, lisible et testable ; aucune randomisation cachée n'a été ajoutée ;
- test dédié : une IA avec 2 énergie attend une technique prévue à 3 énergie, la lance après recharge, puis passe à la technique suivante.

CI work : SUCCESS, run `36302550999`, SHA `257ed4d105e9cb5b0c08ab5a14eb3c08b0afb2ba`.

Validation smartphone requise avant checkpoint GREEN.


### Micro-lot 2v2 — HUD allié / taille HUD local / feedback cible — 2026-09-27

Retour utilisateur :

- placer l'état allié au-dessus de l'UI des capacités, plutôt qu'en carte isolée à gauche ;
- conserver pour la créature locale une taille de HUD équivalente au 1v1 ;
- afficher avec l'allié une indication visuelle de sa créature / réserve restante sans créer une fausse logique de roster ;
- lors d'un clic de cible, afficher brièvement un petit cercle sous la créature sélectionnée ;
- noter pour le futur éditeur que le rythme des animations et les cooldowns de capacités devront être configurables.

Base / sécurité :

- base : `8985039439a07e40902fda203ac087986cdff9c8` ;
- checkpoint : `checkpoint/lab-start-coop-2v2-hud-target-pulse-2026-09-27` ;
- branche : `work/lab-coop-2v2-preview-2026-09-27` ;
- `main` et `global-assets` protégées.

Périmètre autorisé :

- `examples/dom-demo/coop-2v2.html` : réorganisation du HUD local / allié ;
- `examples/dom-demo/demo.css` : styles 2v2 ciblés uniquement ;
- `src/ui/combat-2v2-test-ui.js` : feedback temporaire de sélection et icône de créature alliée issue du descriptor visuel existant ;
- `docs/LAB_ARCHITECTURE.md` : note futur éditeur sur vitesse d'animation / cooldown ;
- tests ciblés 2v2 ;
- présente documentation.

Domaines protégés :

- aucun changement Combat Rules / dégâts / PV / énergie / IA ;
- aucun changement du renderer de créatures ou FX ;
- aucun changement du 1v1 ;
- aucun cooldown ajouté dans ce micro-lot ;
- aucune modification de timing d'attaque aérienne dans ce micro-lot ;
- aucun faux roster : tant qu'une réserve propre à chaque contrôleur n'existe pas dans le modèle 2v2, l'UI n'invente pas de membres de réserve.

Intentions UI :

- HUD local : mêmes proportions de référence que le `combat-card` 1v1 ;
- HUD allié : panneau compact directement au-dessus de la barre de capacités, avec nom / PV / action / icône de sa créature active ;
- cercle de ciblage : feedback transitoire uniquement, distinct de la surbrillance persistante de cible sélectionnée ;
- le cercle n'a aucune autorité gameplay.

Critères :

- HUD local visuellement équivalent au 1v1 ;
- allié lisible juste au-dessus des capacités ;
- aucune fausse réserve affichée ;
- clic sur une cible => pulse circulaire temporaire sous sa créature ;
- timers du pulse nettoyés au dispose ;
- CI verte ;
- validation smartphone utilisateur.


Résultat du micro-lot HUD / cible :

- la carte locale garde désormais les proportions de référence du HUD 1v1 (`15.5rem / 39vw`, hauteur `5rem -> 6.5rem`) ;
- le HUD allié a été déplacé dans une pile de commandes directement au-dessus de la barre de capacités ;
- ce HUD allié affiche nom, PV, action en cours et l'icône de la créature active récupérée via `visuals.getCreatureDescriptor()` ;
- aucune réserve fictive n'a été inventée : le prototype 2v2 n'affiche que la créature alliée réellement déclarée dans le format actuel ;
- la sélection persistante conserve son contour / glow ;
- chaque nouvelle sélection déclenche en plus un cercle temporaire sous la créature ciblée (`680ms`) ;
- le feedback de ciblage reste purement visuel et n'intervient jamais dans `Targeting` ni `Combat Rules` ;
- les timers de pulse sont centralisés et nettoyés lors d'une nouvelle sélection ou du `dispose()`.

Note architecture ajoutée :

- futur réglage éditeur du rythme de combat ;
- vitesse visuelle d'approche / retour distincte du timing gameplay ;
- futur `cooldownMs` appartenant à `SkillDefinition` / Core, jamais simulé par un simple bouton désactivé dans l'UI ;
- aucune modification de vitesse aérienne ni cooldown n'a été introduite dans ce micro-lot.

CI work : SUCCESS, run `36304095546`, SHA `b7958f14f924ef15f38674bfadcb027dd51ca787`.

Validation smartphone requise avant checkpoint GREEN de ce polish HUD.


### Micro-lot 2v2 — couche d'approche + scale adversaires — 2026-09-27

Retour smartphone utilisateur :

- pendant `Griffe`, l'attaquant peut passer derrière la créature ciblée pendant une fraction de seconde ;
- les deux adversaires sont visuellement un peu trop petits dans la composition 2v2.

Base / sécurité :

- base validée actuelle : `aca6139aec640a3ee16142e02d1c702bc4e625d6` ;
- checkpoint : `checkpoint/lab-coop-2v2-before-approach-layer-enemy-scale-2026-09-27` ;
- branche : `work/lab-coop-2v2-preview-2026-09-27` ;
- `main` et `global-assets` protégées.

Cause visuelle visée :

- les combattants 2v2 utilisent plusieurs couches `z-index` fixes ;
- lors d'une approche de contact, deux combattants peuvent se superposer ;
- l'attaquant doit être temporairement au premier plan pendant **son animation d'approche**, puis revenir automatiquement à sa couche normale.

Périmètre autorisé :

- `src/ui/demo-app.js` : exposer un état de présentation transitoire `data-approach-active` sur le slot attaquant uniquement pendant `playApproachFor()` ;
- `examples/dom-demo/demo.css` : une seule règle de couche commune pour cet état ;
- `examples/dom-demo/demo.css` : augmentation modérée des deux tailles adverses 2v2 uniquement ;
- tests UI / animation ciblés ;
- présente documentation.

Domaines protégés :

- aucun changement Combat Rules / Runtime / dégâts / hit / ciblage / IA ;
- aucun changement des offsets ou timings de `Griffe` ;
- aucun masquage, aucune duplication de sprite, aucun second renderer ;
- aucun changement 1v1 ;
- l'état de couche doit être nettoyé en fin, annulation et dispose.

Critères :

- l'attaquant reste visible au-dessus de sa cible pendant l'approche ;
- la couche temporaire disparaît immédiatement après l'approche ;
- les adversaires 2v2 gagnent légèrement en taille sans déplacer leurs ancres ;
- CI verte ;
- validation smartphone utilisateur.


Résultat technique du micro-lot couche / scale :

- `playApproachFor()` marque désormais uniquement le combattant qui exécute l'approche avec `data-approach-active=true` ;
- la page 2v2 donne temporairement à cet acteur une couche `z-index: 9`, ce qui l'empêche de passer derrière sa cible pendant Griffe / téléportation / aérien ;
- l'attribut est supprimé dans `finally()`, dans `cancelFor()`, lors d'un masquage de slot et au `dispose()` ;
- aucun sprite n'est dupliqué et aucune règle gameplay n'a été modifiée ;
- tailles adverses 2v2 augmentées uniquement dans la composition 2v2 :
  - adversaire A : `min(34%, 19.5rem)` ;
  - adversaire B : `min(33%, 19rem)` ;
- positions et ancres restent inchangées.

Tests :

- sentinelle de couche temporaire + nettoyage ;
- sentinelle tailles adverses 2v2 ;
- sentinelles 1v1 / approche existantes conservées ;
- CI work : SUCCESS, run `36304832800`, SHA `98304287d3d050d8dfaf83ec4ad39df0977fec70`.

Validation smartphone requise avant checkpoint GREEN de ce micro-lot.


### Micro-lot 2v2 — barres de charge lisibles + hauteur HUD local — 2026-09-27

Retour smartphone utilisateur :

- pendant la préparation d'une capacité, le 2v2 n'affiche actuellement qu'un texte / chiffre de compte à rebours ;
- l'absence de barre visuelle rend la charge peu lisible ;
- le HUD local PV / nom paraît plus tassé qu'en 1v1 et doit retrouver la même présence verticale.

Base / sécurité :

- base : `1e384b997c0ff07b40fca3ce183a5f8ce285b190` ;
- checkpoint : `checkpoint/lab-coop-2v2-before-charge-bars-local-hud-height-2026-09-27` ;
- branche : `work/lab-coop-2v2-preview-2026-09-27` ;
- `main` et `global-assets` protégées.

Cause constatée :

- le Runtime fournit déjà `chargeProgress` et `remainingPreparationMs` pour chaque `actorId` ;
- la page 2v2 n'expose cependant aucun élément `progress` de charge dans ses cartes et `onProgress()` ne met à jour qu'un libellé texte ;
- le 1v1 possède déjà la bonne hiérarchie : nom / PV / action / barre de charge.

Périmètre autorisé :

- `examples/dom-demo/coop-2v2.html` : ajouter une barre de charge runtime dans les quatre cartes d'acteur ;
- `src/ui/combat-2v2-test-ui.js` : binder ces barres génériquement par `actorId` à `progress.chargeProgress` ;
- `examples/dom-demo/demo.css` : style commun compact + proportions locales identiques au HUD 1v1 ;
- tests ciblés 2v2 ;
- présente documentation.

Domaines protégés :

- aucun changement du temps de préparation, des dégâts, de l'énergie, de l'IA ou du Runtime ;
- aucun timer UI de substitution : la barre lit uniquement le `CombatRuntime.onProgress` existant ;
- aucune modification 1v1 ;
- aucune barre de capacités supplémentaire pour l'allié ;
- aucun cooldown ajouté dans ce lot.

Critères :

- chaque acteur affiche une vraie barre pendant sa préparation ;
- la barre disparaît / revient à zéro hors préparation ;
- le HUD local retrouve gap / min-height / barre de PV et charge équivalents au 1v1 ;
- les cartes allié / adversaires restent compactes ;
- CI verte puis validation smartphone utilisateur.


Résultat technique du micro-lot barres de charge / HUD local :

- les quatre cartes 2v2 possèdent désormais un vrai `<progress>` de charge relié au Runtime ;
- `src/ui/combat-2v2-test-ui.js` construit `chargeRefs` par `actorId` et alimente la barre uniquement depuis `onProgress().chargeProgress` ;
- la barre est active uniquement pendant la phase `preparation`, puis repasse à zéro hors préparation ;
- aucune horloge ni progression secondaire n'a été ajoutée côté UI ;
- le joueur local utilise une barre de charge de `0.56rem`, identique à la référence 1v1 ;
- allié et adversaires utilisent une barre compacte de `0.38rem` pour conserver la lisibilité mobile ;
- cause du HUD local trop bas sur très petit écran : dans le breakpoint `max-width: 430px`, la règle générale `.squad-card { min-height: 3.2rem; }` arrivait après la règle locale 2v2 et reprenait la main à spécificité égale ;
- correction : `.squad-card--local-full` réaffirme `min-height: 5.2rem` et son padding au breakpoint 430px, correspondant à la référence mobile 1v1 ;
- aucun changement gameplay, IA, cooldown, énergie ou timing.

Tests :

- 4 barres runtime présentes dans la page ;
- binding générique par `actorId` ;
- utilisation de `progress.chargeProgress` ;
- hauteur locale 430px protégée par sentinelle ;
- CI work : SUCCESS, run `36305384418`, SHA `c799374b9c3d9c0604568bd9eef902cdf8230a8a`.

Validation smartphone requise avant checkpoint GREEN.


### Micro-lot 2v2 — adversaires +30 % visuels — 2026-09-27

Demande smartphone :

- augmenter visuellement les deux créatures adversaires du prototype 2v2 de **+30 % par rapport à leur taille actuelle** ;
- ne modifier ni le 1v1 ni la géométrie logique du combat.

Base / sécurité :

- SHA de base vérifié : `7682ee988f8376da04aacdfcbc3ad3316d23098e` ;
- checkpoint de départ : `checkpoint/lab-start-coop-2v2-enemy-scale-plus30-2026-09-27` ;
- branche de travail : `work/lab-coop-2v2-preview-2026-09-27` ;
- preview au même SHA avant modification : `preview/lab-coop-2v2-preview-2026-09-27` ;
- CI preview de base : SUCCESS, run `36305433077` ;
- `main` et `global-assets` protégées.

Constat CSS au SHA de base :

- composition 2v2 générale :
  - adversaire A : `min(34%, 19.5rem)` ;
  - adversaire B : `min(33%, 19rem)` ;
- breakpoint smartphone `max-width: 680px` :
  - adversaire A : `31%` ;
  - adversaire B : `30%`.

Périmètre autorisé :

- `examples/dom-demo/demo.css` : appliquer ×1,30 uniquement aux largeurs des deux adversaires 2v2, y compris l'override smartphone existant ;
- `tests/unit/coop-2v2.test.mjs` : adapter les sentinelles de taille et protéger explicitement le breakpoint smartphone ;
- présente documentation.

Valeurs cibles issues du ×1,30 exact :

- général :
  - A : `min(44.2%, 25.35rem)` ;
  - B : `min(42.9%, 24.7rem)` ;
- smartphone ≤680 px :
  - A : `40.3%` ;
  - B : `39%`.

Domaines protégés :

- aucun changement Combat Rules / Runtime / dégâts / ciblage / IA / timings ;
- aucun changement de positions `top/left`, anchors, renderer, FX ou sélection ;
- aucun changement 1v1 ;
- aucun masquage, aucune duplication de sprite, aucun second renderer.

Critères :

- deux adversaires environ 30 % plus grands dans le 2v2, y compris sur smartphone ;
- positions et anchors inchangés ;
- ciblage / FX / projectiles continuent d'utiliser les mêmes acteurs et mêmes ancres ;
- sentinelle 1v1 inchangée ;
- CI GREEN ;
- déplacement de la branche preview uniquement après CI GREEN ;
- validation smartphone utilisateur avant checkpoint GREEN final.


Résultat technique du micro-lot +30 % adversaires :

- aucune position `top/left` n'a été modifiée ;
- aucune ancre, cible, règle FX, règle projectile ou règle gameplay n'a été modifiée ;
- seules les largeurs 2v2 existantes ont été multipliées par ×1,30 :
  - général A : `min(34%, 19.5rem)` -> `min(44.2%, 25.35rem)` ;
  - général B : `min(33%, 19rem)` -> `min(42.9%, 24.7rem)` ;
  - smartphone A : `31%` -> `40.3%` ;
  - smartphone B : `30%` -> `39%` ;
- le breakpoint smartphone a été inclus explicitement afin que le +30 % soit réel sur mobile et non uniquement sur la composition large ;
- les sentinelles 2v2 vérifient les quatre valeurs nouvelles ainsi que les positions existantes ;
- CI du HEAD fonctionnel : SUCCESS, run `36308718701`, SHA `f82de81d61d2b84cbb439a5466a72a312f7ea81c`.

Validation smartphone utilisateur requise avant checkpoint GREEN final.


### Micro-lot 2v2 — profondeur perspective pendant les approches — 2026-09-27

Retour smartphone :

- le correctif de couche temporaire évite le passage derrière intempestif, mais force actuellement tout attaquant en `z-index: 9` ;
- lorsqu'un ennemi situé dans le fond attaque une créature située plus bas dans l'arène, son image passe donc artificiellement devant la cible.

Base / sécurité :

- SHA de base : `a2acb05b187d311c2b74d068f25d1c5e475f4e5c` ;
- checkpoint : `checkpoint/lab-start-coop-2v2-approach-depth-2026-09-27` ;
- branche : `work/lab-coop-2v2-preview-2026-09-27` ;
- CI de base GREEN ;
- `main` et `global-assets` protégées.

Cause démontrée :

- `playApproachFor()` expose un unique booléen `data-approach-active` ;
- le CSS 2v2 associe ce booléen à `z-index: 9` sans tenir compte de la profondeur visuelle ;
- les centres Y acteur/cible sont déjà calculés par le propriétaire de composition au démarrage de l'approche.

Correction ciblée :

- conserver un seul renderer et le même plan d'animation ;
- dériver uniquement une profondeur de présentation `front` / `behind` depuis les centres Y déjà mesurés ;
- acteur démarrant plus bas que la cible : couche temporaire avant ;
- acteur démarrant plus haut que la cible : couche temporaire arrière ;
- nettoyer cet état en fin, cancel, masquage et dispose.

Fichiers autorisés :

- `src/ui/demo-app.js` ;
- `examples/dom-demo/demo.css` ;
- `tests/unit/coop-2v2.test.mjs` ;
- présente documentation.

Domaines protégés :

- Combat Rules, Runtime, IA, dégâts, ciblage, timings, offsets et anchors ;
- aucun second renderer, aucune duplication de sprite ;
- aucun changement 1v1.

Critères :

- un ennemi venant du fond ne recouvre plus artificiellement sa cible pendant l'approche ;
- un attaquant venant du premier plan reste lisible devant sa cible ;
- état de profondeur nettoyé après l'action ;
- CI GREEN avant mise à jour de preview.


### Micro-lot global — impact visuel des interactions projectile / défense — 2026-09-27

Demande utilisateur :

- afficher un impact quand deux boules de feu se rencontrent ;
- ne pas coder ce comportement spécifiquement pour la boule de feu ;
- préparer le même chemin pour projectile ↔ projectile de types différents et projectile ↔ défense/bouclier.

Base / sécurité :

- SHA de base : `4b60167a9516d27d92354c6793d9ad658c0cd77f` ;
- checkpoint : `checkpoint/lab-start-global-projectile-clash-impact-2026-09-27` ;
- branche : `work/lab-coop-2v2-preview-2026-09-27` ;
- CI base GREEN ;
- `main` et `global-assets` protégées.

État réel :

- Combat Core possède déjà `projectileClash` et produit l'événement sémantique `projectile-clash` ;
- le Presenter annule correctement les deux projectiles lors d'un clash, mais ne joue aucun FX au point de rencontre ;
- `SkillDefinition.projectileClash` ne permet actuellement que des groupes identiques ;
- les défenses `blocked/reflected/immune` n'émettent pas encore de feedback d'impact via `planSkillOutcomeFx`.

Correction prévue :

1. étendre le contrat `projectileClash` avec `interactsWith` data-driven, rétrocompatible (défaut = son propre groupe) ;
2. laisser Combat Core décider uniquement si l'interaction existe, sans dépendre du renderer ;
3. créer un plan FX générique `clash-impact` depuis l'événement sémantique `projectile-clash` ;
4. positionner ce FX par interpolation entre source et cible avec le `progress` déjà calculé par Combat Core ;
5. éviter les doubles impacts : une seule des deux résolutions du même clash possède le rendu canonique ;
6. réutiliser l'impact lié à la compétence via la couche Presentation Assets ;
7. produire aussi un impact générique au point de contact pour `blocked/reflected/immune`.

Fichiers autorisés :

- `src/contracts/skill-definition.js` ;
- `src/core/combat/projectile-clash.js` ;
- `src/core/fx/skill-fx-plan.js` ;
- `src/adapters/renderer/combat-resolution-presenter.js` ;
- `src/adapters/renderer/dom-skill-fx.js` ;
- `data/combat/skills/fireball.skill.json` si nécessaire pour expliciter la compatibilité ;
- tests projectile / FX / présentation concernés ;
- présente documentation.

Domaines protégés :

- pas de détection collision gameplay dans le DOM ;
- aucun dégât décidé par le renderer ;
- aucun timer gameplay UI ;
- aucun second projectile renderer ;
- aucune règle spéciale `if fireball` dans Core/Renderer.

Critères :

- boule de feu ↔ boule de feu : annulation + impact visuel au point de rencontre ;
- interaction de groupes différents testable uniquement par données ;
- blocage/réflexion/immunité : impact visuel au point de contact sans changer le résultat gameplay ;
- CI GREEN avant déplacement de preview.


Résultat technique du micro-lot profondeur d'approche :

- la couche temporaire n'est plus un `z-index: 9` aveugle ;
- `playApproachFor()` réutilise les centres Y déjà calculés et dérive `front` / `behind` uniquement pour la présentation ;
- un acteur venant du premier plan reçoit la couche temporaire `front` (`z-index: 9`) ;
- un acteur venant du fond reçoit la couche temporaire `behind` (`z-index: 2`) ;
- `data-approach-depth` est nettoyé en fin, cancel, masquage et dispose ;
- aucune position, aucun timing, aucun anchor et aucune règle gameplay n'a changé ;
- CI GREEN : run `36309586700`, SHA `4b60167a9516d27d92354c6793d9ad658c0cd77f`.

Résultat technique du micro-lot interactions / clash FX :

- `SkillDefinition.projectileClash` expose désormais `interactsWith` ;
- rétrocompatibilité : un `mutual_cancel` sans liste explicite interagit par défaut avec son propre groupe ;
- deux groupes différents peuvent s'annuler si les deux compétences déclarent la compatibilité réciproque ;
- `projectile-clash` transporte les groupes, une clé d'interaction et le `progress` exact du point de rencontre ;
- `planSkillOutcomeFx()` produit un unique `clash-impact` canonique pour la paire ;
- le DOM FX interpole ce point depuis les ancres existantes et le `progress` sémantique, en respectant notamment `travelSourceAnchor` ;
- le rendu réutilise l'impact associé à la compétence dans Presentation Assets : aucune règle `if fireball` n'a été ajoutée au Core/Renderer ;
- `blocked`, `reflected` et `immune` produisent maintenant un impact de présentation au point de contact sans modifier le résultat gameplay ;
- la boule de feu déclare explicitement `interactsWith: ["fire-orb"]` comme donnée éditable ;
- un test synthétique valide déjà une compatibilité `fire-orb` ↔ `ice-bolt` sans ajout de branche moteur ;
- CI GREEN du chemin fonctionnel : run `36309912297`, SHA `0fce2e1ba773ebe794158f3f481cb12f47fc84e3` ;
- CI GREEN documentation architecture incluse : run `36309926477`, SHA `64ddac85b2cd530b70aeb0759b50d381b6c15fe6`.

Validation smartphone requise avant tout checkpoint GREEN final.


### Micro-lot 2v2 — lisibilité clash FX + repositionnement acteurs — 2026-09-27

Retour smartphone :

- l'utilisateur ne perçoit pas l'impact visuel au point de rencontre de deux boules de feu ;
- l'adversaire B doit être plus à gauche et plus haut, presque à la même hauteur que l'adversaire A ;
- l'allié doit être plus à droite et plus bas.

Base / sécurité :

- SHA de base : `9601b6c85b4ac0764af5b1e49adf387b961a196d` ;
- checkpoint : `checkpoint/lab-start-2v2-layout-clash-impact-polish-2026-09-27` ;
- branche : `work/lab-coop-2v2-preview-2026-09-27` ;
- preview au même SHA et CI GREEN ;
- `main` et `global-assets` protégées.

Cause visuelle clash démontrée :

- `clash-impact` réutilise bien le sprite d'impact de la compétence ;
- mais le DOM lui attribue uniquement `.skill-fx--clash-impact` ;
- les dimensions / z-index renforcés sont portés par `.skill-fx--impact` ;
- le clash est donc rendu avec la petite taille générique `.skill-fx`, ce qui le rend difficile à percevoir sur smartphone.

Correction ciblée :

- `clash-impact` doit hériter du style d'un impact normal et garder une classe spécifique de clash ;
- renforcer légèrement sa taille / durée de lecture sans créer un deuxième renderer ;
- repositionner uniquement les conteneurs 2v2 :
  - adversaire B : plus à gauche, top presque aligné sur adversaire A ;
  - allié : plus à droite et plus bas ;
- conserver les mêmes mécanismes d'anchors FX, qui suivent automatiquement les conteneurs.

Valeurs cibles de composition proposées pour ce test :

- adversaire B général : `top: 32%`, `left: 31%` ;
- adversaire B smartphone : `top: 32%`, `left: 30%` ;
- allié général : `top: 66%`, `left: 66%` ;
- allié smartphone : `top: 66%`, `left: 67%`.

Fichiers autorisés :

- `src/adapters/renderer/dom-skill-fx.js` ;
- `src/core/fx/skill-fx-plan.js` si durée clash nécessaire ;
- `examples/dom-demo/demo.css` ;
- tests FX / 2v2 concernés ;
- présente documentation.

Domaines protégés :

- aucun changement Combat Rules / Runtime / dégâts / ciblage / IA ;
- aucun second renderer, aucune duplication de projectile ;
- aucun changement 1v1.

Critères :

- collision boule de feu ↔ boule de feu visuellement évidente sur smartphone ;
- adversaire B plus haut et plus à gauche ;
- allié plus bas et plus à droite ;
- projectiles / impacts / sélection restent alignés ;
- CI GREEN avant déplacement preview.


Résultat technique du micro-lot lisibilité clash FX / composition 2v2 :

- cause confirmée de l'impact peu visible : `clash-impact` n'héritait pas de `.skill-fx--impact` et restait à la petite taille générique `.skill-fx` ;
- correction : le même nœud de clash porte désormais `.skill-fx--impact` + `.skill-fx--clash-impact`, sans second renderer ;
- le clash garde le sprite d'impact lié à la compétence par Presentation Assets ;
- classe spécifique clash : `z-index: 12`, largeur `clamp(5.2rem, 15vw, 9rem)` ;
- durée visuelle clash : `520ms` au lieu de `420ms` ;
- mécanique, dégâts et point sémantique de collision inchangés.

Composition 2v2 ajustée :

- adversaire B général : `top: 32%`, `left: 31%` ;
- adversaire B smartphone ≤680px : `top: 32%`, `left: 30%` ;
- allié général : `top: 66%`, `left: 66%` ;
- allié smartphone ≤680px : `top: 66%`, `left: 67%` ;
- tailles inchangées ;
- adversaire A et joueur local inchangés ;
- anchors FX / ciblage restent attachés aux mêmes conteneurs et suivent donc automatiquement ces positions.

Tests :

- sentinelle du plein style clash + classe spécifique ;
- sentinelle durée `520ms` ;
- sentinelles positions générale + smartphone ;
- CI GREEN : run `36310387573`, SHA `240e47dc048bf26711b5c2b5a579800bcc863b16`.

Validation smartphone requise avant checkpoint GREEN final.


## Audit Capture -> adaptateur du laboratoire — 2026-09-27

Objectif :

- cartographier en lecture seule le Capture réel du dépôt `slyen4425-cloud/Zombicide-40k` ;
- identifier les données/propriétaires réutilisables pour un futur adaptateur ;
- distinguer ce qui peut être traduit proprement de ce qui est legacy et ne doit pas être repris ;
- définir un contrat d'adaptateur portable sans créer de dépendance runtime vers GenSrpG.

Base laboratoire :

- SHA : `5ef53a67c5beddd9b70df88d73b242a3f12d282c` ;
- checkpoint : `checkpoint/lab-start-capture-adapter-audit-2026-09-27` ;
- branche : `work/lab-capture-adapter-audit-2026-09-27` ;
- base CI GREEN ;
- branche preview 2v2 laissée inchangée.

Périmètre autorisé :

- lecture du dépôt principal uniquement ;
- documentation d'audit dans le laboratoire ;
- éventuellement contrats/tests purs du futur adaptateur après clôture de l'audit et sans import GenSrpG.

Interdit :

- aucune modification de `Zombicide-40k` ;
- aucun import depuis `Zombicide-40k` dans le laboratoire ;
- aucun copier-coller du moteur historique ;
- aucune lecture de sauvegardes/DOM/globals GenSrpG au runtime ;
- aucun raccord production ;
- aucun changement au moteur 1v1/2v2 pendant ce lot d'audit.

Propriétaires concernés côté laboratoire :

- contrats de données ;
- futur adaptateur d'entrée Capture ;
- Skill Contract ;
- Creature Profile / FighterConfig ;
- Presentation Assets / AssetBinding.

Propriétaires protégés :

- Combat Rules ;
- Combat Runtime ;
- Animation Core ;
- FX Core ;
- Renderer ;
- Demo UI existante.

Livrables audit :

1. inventaire des propriétaires Capture historiques et restructurés ;
2. matrice `GenSrpG Capture -> contrat laboratoire` ;
3. liste des données réutilisables directement ;
4. liste des données nécessitant traduction ;
5. liste des couches legacy à ne pas importer ;
6. proposition de contrat d'adaptateur pur et versionné ;
7. plan de micro-lots pour une future prévisualisation éditeur -> combat dynamique.

Critère de fin de l'audit :

- aucun code du dépôt principal modifié ;
- aucun couplage runtime créé ;
- sources de vérité et frontières documentées ;
- CI du laboratoire GREEN après documentation.


Résultat audit Capture -> adaptateur :

- documentation : `docs/LAB_CAPTURE_ADAPTER_AUDIT.md` ;
- dépôt principal consulté en lecture seule uniquement ;
- aucun `index.html`, runtime, asset ou sauvegarde GenSrpG importé dans le laboratoire ;
- futur propriétaire Capture GenSrpG confirmé : `assets/gensrpg/capture/`, encore `contract-only-not-loaded` ;
- chaînes legacy 128..144 et seed 162 identifiées comme sources de comportement, jamais comme dépendances ;
- propriétaire final capacité historique : `captureAbilityTruth144` ;
- entrée publique historique la plus propre : `captureFix139` ;
- progression Capture reste Capture-owned et hors Combat Package minimal ;
- cible retenue : export JSON portable versionné -> adaptateur labo -> contrats Fighter / Skill / Roster / BattleFormat / Presentation ;
- aucun code historique Capture n'est réutilisable directement ;
- le mapping des champs legacy exacts restera la responsabilité d'un futur exporter GenSrpG, pas du labo.

CI audit :
- run `36312645910` — SUCCESS ;
- SHA audité : `304c2c7f906b2878d502ee52cf909469e901309f`.

Prochaine étape après checkpoint GREEN :
- micro-lot séparé `CaptureCombatPackageV1` pur ;
- contrat + tests uniquement avant tout raccord UI.


### Résultat de l'audit Capture -> adaptateur

Document livré :

- `docs/LAB_CAPTURE_ADAPTER_AUDIT.md`.

Sources GenSrpG vérifiées en lecture seule :

- branche : `work/gensrpg-phase7-dungeon-generated-room-create-restore-2026-09-27` ;
- HEAD observé : `9ec3a39af709405f5d9ee54a61aa2c041c7339e6` ;
- module cible `assets/gensrpg/capture/` encore contract-only / inerte ;
- runtime Capture historique toujours stratifié de `capturePlaytestFix128` à `captureAbilityTruth144`, plus `builtinMonsterCapture162` ;
- `captureAbilityTruth144` reste le dernier propriétaire cartographié des effets de capacités ;
- `captureFix139` reste le propriétaire du lancement Capture ;
- les providers Shell Phase 5 restent routing-only.

Frontière retenue :

`Capture / éditeur -> CaptureExportV1 -> adaptateur pur -> contrats natifs du laboratoire`.

Décisions :

- aucun import du dépôt principal ;
- aucun accès aux sauvegardes/globals/DOM GenSrpG ;
- aucun copier-coller des `captureFix*` ;
- `gameStyle: dungeon` est traité comme dette historique, pas comme contrat ;
- PV, identité et roster peuvent être traduits explicitement ;
- stats non consommées par le Combat State restent non-mappées ;
- les capacités ne seront jamais inférées depuis leur nom/texte/ID ;
- visuel/audio restent dans Presentation Bindings par `assetId` ;
- progression reste hors Combat Session.

CI audit documentaire :

- run `36314005301` — SUCCESS ;
- SHA `425f5d597418f8fdd25cd74bc14f2281bb081bb7`.

Prochaine étape après checkpoint GREEN :

1. créer un chantier séparé `CaptureExportV1` ;
2. contrat pur uniquement ;
3. tests RED avant implémentation de normalisation ;
4. aucune dépendance GenSrpG ;
5. aucun raccord UI/runtime avant GREEN du contrat.


### Clôture exacte du jalon audit Capture -> adaptateur

État documentaire final avant checkpoint :

- HEAD : `01a26c065857a6c8fda81cef8bdf6a38470f38ca` ;
- CI : run `36314041915` — SUCCESS ;
- aucune modification du dépôt `Zombicide-40k` ;
- aucun code runtime du laboratoire modifié dans ce jalon ;
- livrable : `docs/LAB_CAPTURE_ADAPTER_AUDIT.md`.

Le checkpoint `checkpoint/lab-capture-adapter-audit-green-2026-09-27` doit être fast-forwardé sur le SHA documentaire final validé après CI du présent commit.


## Micro-lot A — CaptureCombatExportV1 pur — 2026-09-27

Base :

- checkpoint GREEN précédent : `checkpoint/lab-capture-adapter-audit-green-2026-09-27` ;
- SHA de base : `017afc72ace8f29ee2765361171282c2a4d0c2f4` ;
- checkpoint de départ : `checkpoint/lab-start-capture-export-v1-2026-09-27` ;
- branche : `work/lab-capture-export-v1-2026-09-27`.

Objectif :

Définir et valider un snapshot JSON portable `capture-combat-export-v1` que pourra produire plus tard GenSrpG/éditeur, sans aucune dépendance au dépôt principal.

Propriétaire :

- nouveau contrat frontière : `src/contracts/capture-combat-export-v1.js`.

Autorisé :

- contrat pur ;
- tests unitaires du contrat ;
- documentation du schéma ;
- fixture locale minimale si nécessaire.

Protégé / interdit :

- aucun import depuis `Zombicide-40k` ;
- aucun DOM, storage, global, réseau ou chemin GitHub ;
- aucune conversion vers FighterConfig/SkillDefinition dans ce lot ;
- aucune modification Combat Rules / Runtime / Renderer / UI ;
- aucune lecture du legacy Capture au runtime ;
- aucune inférence de compétence par nom, texte ou ID.

Forme minimale retenue :

- `schema` exact ;
- `battle` avec identité et acteur local ;
- `teams` ;
- `actors` ;
- `creatures` ;
- `skills` ;
- `rosters` optionnels ;
- `presentation` JSON-compatible optionnelle.

Le contrat vérifie uniquement la cohérence structurelle et référentielle. Les sémantiques gameplay détaillées restent la responsabilité des futurs adaptateurs dédiés.

Tests RED prévus avant implémentation :

1. snapshot 1v1 valide ;
2. doublons d'identifiants refusés ;
3. références acteur -> créature vérifiées ;
4. appartenance équipe cohérente ;
5. `localActorId` valide ;
6. skill IDs des créatures résolus ;
7. roster actif/réserve cohérent ;
8. valeurs opaques `definition/presentation` strictement JSON-compatibles ;
9. source du contrat sans autorité DOM/storage/GenSrpG.

Critère GREEN :

- tests du contrat + CI globale SUCCESS ;
- aucun autre propriétaire modifié ;
- documentation synchronisée ;
- checkpoint GREEN exact avant lot B.


Résultat micro-lot A — `CaptureCombatExportV1` :

- test RED : commit `b9efd6c7841768bb1f3fad08b1824f49700ef3d4`, CI `36316028828` — FAILURE attendue car contrat absent ;
- implémentation minimale : commit `d8ea0a017c83408146e28eb3188aeceaea1979ab` ;
- CI : run `36316095637` — SUCCESS.

Contrat créé :

- `src/contracts/capture-combat-export-v1.js` ;
- schéma exact `capture-combat-export-v1` ;
- données JSON compatibles uniquement ;
- équipes / acteurs / créatures / skills / rosters avec cohérence référentielle ;
- aucune inférence par label/ID de compétence ;
- aucune autorité DOM, storage, réseau ou GenSrpG ;
- aucune conversion vers les contrats natifs dans ce lot.

Tests :

- `tests/unit/capture-combat-export-v1.test.mjs` ;
- 1v1 valide ;
- IDs dupliqués refusés ;
- références créature/skill vérifiées ;
- appartenance équipe vérifiée ;
- acteur local vérifié ;
- roster actif/réserve cohérent ;
- blobs opaques `definition/presentation` strictement JSON-compatibles ;
- sentinelle d'indépendance.

Prochaine action après checkpoint GREEN exact :

- micro-lot B séparé : adaptateur pur créature -> FighterConfig uniquement ;
- aucune formule RPG inventée ;
- uniquement les champs combat explicitement exportés.


## Micro-lot B — Capture creature -> FighterConfig V1 — 2026-09-27

Base :

- checkpoint GREEN : `checkpoint/lab-capture-export-v1-green-2026-09-27` ;
- SHA : `308ee041b330dbb58f2fc40f56c2f64328c2e57c` ;
- checkpoint départ : `checkpoint/lab-start-capture-creature-adapter-v1-2026-09-27` ;
- branche : `work/lab-capture-creature-adapter-v1-2026-09-27`.

Objectif :

Créer un adaptateur pur qui transforme une créature déjà normalisée par `CaptureCombatExportV1` en configuration de fighter consommable par le Combat State.

Propriétaire :

- `src/adapters/input/capture/capture-creature-to-fighter-config.js`.

Règles :

- aucune formule Force/Agilité/Défense ;
- aucun calcul de stats RPG ;
- aucune lecture `metadata.sourceStats` comme gameplay ;
- seuls les champs combat explicitement exportés peuvent être traduits ;
- `maxHp` et `maxEnergy` requis ;
- les defaults éventuels restent ceux du Combat State cible, pas de second système de defaults ;
- aucun DOM/storage/global/réseau ;
- aucune dépendance GenSrpG.

Champs V1 traduisibles :

- `maxHp` ;
- `initialHp` si fourni ;
- `maxEnergy` ;
- `initialEnergy` si fourni ;
- `energyChargeAmount` si fourni ;
- `energyChargeIntervalMs` si fourni ;
- `movementEnergyPerStep` si fourni ;
- `chargeTimeModifierPct` si fourni.

Non traduits dans ce lot :

- niveau ;
- speed/agility/defense ;
- résistances ;
- buffs/debuffs ;
- progression ;
- assets ;
- skills.

Tests RED :

1. conversion directe ;
2. fighterId surchargeable sans muter la créature ;
3. champs optionnels absents restent absents ;
4. `maxHp/maxEnergy` requis et numériques ;
5. valeurs négatives refusées selon le contrat cible ;
6. `chargeTimeModifierPct` accepte une valeur finie signée ;
7. métadonnées/stats source n'influencent pas le FighterConfig ;
8. résultat réellement accepté par `createCombatState` ;
9. sentinelle d'indépendance.

Critère GREEN :

- tests ciblés + CI globale SUCCESS ;
- aucun autre domaine modifié ;
- checkpoint GREEN avant lot compétence.


Résultat micro-lot B — Capture creature -> FighterConfig V1 :

- test RED : commit `d2027d19adff1d9dd4f99c1af758679f3e6ee9a7`, CI `36316208928` — FAILURE attendue car adaptateur absent ;
- implémentation : `src/adapters/input/capture/capture-creature-to-fighter-config.js` ;
- commit : `c32006916bde0df3f8af4be99ef6bd3bab6ae736` ;
- CI : run `36316241433` — SUCCESS.

Garanties :

- seuls les champs `combat` explicitement exportés sont traduits ;
- `maxHp` et `maxEnergy` sont requis ;
- valeurs numériques vérifiées selon les contraintes du Combat State ;
- `initialHp` / `initialEnergy` ne peuvent dépasser les maxima ;
- `chargeTimeModifierPct` reste signé et fini ;
- les champs absents restent absents afin de laisser les defaults au propriétaire cible ;
- aucune lecture de niveau, speed, agility, defense, force ou autres métadonnées comme gameplay ;
- aucun asset / skill / progression dans cet adaptateur ;
- résultat testé par le vrai `createCombatState`.

Prochaine action après checkpoint GREEN exact :

- micro-lot C : skill exportée -> `SkillDefinition` ;
- aucune inférence depuis le nom ou l'ID ;
- validation par le vrai `normalizeSkillDefinition`.


## Micro-lot C — Capture skill -> SkillDefinition V1 — 2026-09-27

Base :

- checkpoint GREEN : `checkpoint/lab-capture-creature-adapter-v1-green-2026-09-27` ;
- SHA : `729289646e605a58d1a98d9f354950729a6527a0` ;
- checkpoint départ : `checkpoint/lab-start-capture-skill-adapter-v1-2026-09-27` ;
- branche : `work/lab-capture-skill-adapter-v1-2026-09-27`.

Objectif :

Adapter une compétence sémantique provenant de `CaptureCombatExportV1` vers le contrat natif `SkillDefinition`.

Principe :

- `normalizeSkillDefinition` reste l'unique autorité des catégories, formes, timings, cibles, réactions, effets et clash projectile ;
- l'adaptateur ne réimplémente aucune règle ;
- aucune inférence depuis le nom, le texte, l'élément ou un ID historique ;
- les données de présentation restent hors du gameplay.

Propriétaire :

- `src/adapters/input/capture/capture-skill-to-skill-definition.js`.

Protégé / interdit :

- aucun changement `src/contracts/skill-definition.js` ;
- aucun changement Combat Rules / Runtime / FX / Renderer ;
- aucun assetId copié dans SkillDefinition ;
- aucune connaissance des `captureFix*` ;
- aucun DOM/storage/global/réseau.

Tests RED :

1. conversion canonique vers le vrai normalizer ;
2. defaults natifs conservés ;
3. mismatch `skill.id / definition.id` refusé ;
4. aucune inférence depuis label/nom ;
5. présentation/métadonnées ignorées ;
6. erreurs natives SkillDefinition conservées ;
7. vraie résolution `CombatSession.previewSkill` avec la compétence adaptée ;
8. sentinelle d'indépendance.

Critère GREEN :

- tests + CI globale SUCCESS ;
- seul adaptateur d'entrée ajouté ;
- checkpoint GREEN avant roster/format.


Résultat micro-lot C — Capture skill -> SkillDefinition V1 :

- test RED : commit `2938faab641c2baee588208e3a71577949ee5521`, CI `36316346812` — FAILURE attendue car adaptateur absent ;
- implémentation : `src/adapters/input/capture/capture-skill-to-skill-definition.js` ;
- commit : `96ed91038eb795706bf342ce7625d9157d526b0a` ;
- CI : run `36316372954` — SUCCESS.

Garanties :

- `normalizeSkillDefinition` reste l'unique autorité sémantique ;
- mismatch `skill.id / definition.id` refusé ;
- aucun comportement inféré depuis le nom, le label, l'élément ou l'ID ;
- présentation et metadata ne pénètrent pas SkillDefinition ;
- les erreurs natives catégorie/forme/clash restent celles du contrat existant ;
- compétence adaptée testée dans le vrai chemin `CombatSession.previewSkill`.

Prochaine action après checkpoint GREEN exact :

- micro-lot D : équipes/acteurs/rosters -> `BattleFormatDefinition` + définition de roster ;
- support 1v1/2v2 via données, sans branche globale de mode.


## Micro-lot D — Capture teams/actors/rosters -> formats natifs V1 — 2026-09-27

Base :

- checkpoint GREEN : `checkpoint/lab-capture-skill-adapter-v1-green-2026-09-27` ;
- SHA : `43deeb24f4e8a2497152e882537320b34fa19061` ;
- checkpoint départ : `checkpoint/lab-start-capture-roster-format-adapter-v1-2026-09-27` ;
- branche : `work/lab-capture-roster-format-adapter-v1-2026-09-27`.

Objectif :

Transformer les structures `battle/teams/actors/rosters` d'un `CaptureCombatExportV1` en :

- `BattleFormatDefinition` natif ;
- définition de roster compatible avec `Roster Session`.

Propriétaire :

- `src/adapters/input/capture/capture-roster-format-adapter-v1.js`.

Règles :

- `normalizeCaptureCombatExportV1` reste propriétaire de la cohérence de l'export ;
- `normalizeBattleFormatDefinition` reste propriétaire du format de bataille ;
- aucun `is2v2` global ;
- 1v1 et 2v2 utilisent exactement le même chemin data-driven ;
- chaque acteur utilise par convention V1 `fighterConfigId = creatureId` ;
- chaque roster exporté devient un slot Roster Session, sans inventer de pool partagé ;
- l'actif du roster doit correspondre à la créature déclarée sur l'acteur du même slot ;
- aucune logique de remplacement/KO ajoutée ici : elle reste dans `Roster Session`.

Protégé / interdit :

- aucun changement BattleFormatDefinition ;
- aucun changement Roster Session ;
- aucun changement Combat Session / Runtime / UI ;
- aucune connaissance du legacy Capture ou de GenSrpG ;
- aucun DOM/storage/global/réseau.

Tests RED :

1. export 1v1 -> BattleFormat natif ;
2. export 2v2 -> quatre acteurs / deux équipes sans branche spéciale ;
3. rosters -> schéma réellement accepté par `createRosterSession` ;
4. `fighterConfigId = creatureId` explicite ;
5. mismatch roster actif / acteur refusé ;
6. absence de roster autorisée ;
7. sentinelle d'indépendance.

Critère GREEN :

- tests + CI globale SUCCESS ;
- vrai `BattleFormatDefinition` et vrai `Roster Session` consommés ;
- checkpoint GREEN avant présentation/assets.


Résultat micro-lot D — Capture teams/actors/rosters -> formats natifs V1 :

- test RED : commit `5afefa204bd981c3c32ff196898c91f88cf4b3fd`, CI `36316547804` — FAILURE attendue car adaptateur absent ;
- implémentation : `src/adapters/input/capture/capture-roster-format-adapter-v1.js` ;
- commit : `8cbf9c6d6580ebc691b0a57920a77e7dd1fe368d` ;
- CI : run `36316578370` — SUCCESS.

Garanties :

- `normalizeCaptureCombatExportV1` reste propriétaire de l'export ;
- `normalizeBattleFormatDefinition` reste propriétaire du format ;
- 1v1 et 2v2 utilisent le même chemin ;
- aucune variable `is2v2` ;
- `fighterConfigId = creatureId` est une traduction V1 explicite ;
- chaque roster exporté devient un slot Roster Session ;
- l'actif du roster doit correspondre à la créature de l'acteur du slot ;
- aucun remplacement/KO n'est implémenté dans l'adaptateur ;
- sortie roster consommée par le vrai `createRosterSession`.

Prochaine action après checkpoint GREEN exact :

- micro-lot E : Presentation Binding exporté -> binding neutre du laboratoire ;
- uniquement IDs d'assets et réglages de présentation ;
- zéro gameplay.


## Micro-lot E — SkillPresentationBindingV1 + raccord export Capture — 2026-09-27

Base :

- checkpoint GREEN : `checkpoint/lab-capture-roster-format-adapter-v1-green-2026-09-27` ;
- SHA : `b902a045c6afd84a1c4705debb40421811c5dc6a` ;
- checkpoint départ : `checkpoint/lab-start-capture-presentation-binding-v1-2026-09-27` ;
- branche : `work/lab-capture-presentation-binding-v1-2026-09-27`.

Objectif :

Formaliser la donnée que le futur éditeur de compétences devra produire pour les visuels/audio, puis permettre à un `CaptureCombatExportV1` de fournir ce binding sans contaminer `SkillDefinition`.

Nouveaux propriétaires :

- `src/contracts/skill-presentation-binding-v1.js` : validation du binding de présentation ;
- `src/adapters/input/capture/capture-skill-presentation-adapter-v1.js` : sélection du binding exporté pour une skill.

Principes :

- gameplay et présentation restent séparés ;
- références uniquement par `assetId` stable ;
- aucun chemin physique, URL GitHub ou URL HTTP dans le binding ;
- Asset Catalog reste responsable de résoudre un `assetId` en ressource ;
- le binding ne vérifie pas l'existence physique de l'asset ;
- absence de binding = `null` et fallback de présentation possible ;
- aucun effet obligatoire pour qu'une compétence fonctionne.

Slots visuels V1 :

- `icon` ;
- `cast` ;
- `travel` ;
- `impact` ;
- `hit` ;
- `miss` ;
- `ko` ;
- `vanish` ;
- `reappear` ;
- `return` ;
- `aura` ;
- `ground`.

Réglages visuels V1 :

- `assetId` ;
- `displayScale` ;
- `attachment` ;
- `anchor` ;
- `offsetX / offsetY` ;
- `layer` ;
- `trigger` ;
- `playbackMode` ;
- `rotationDeg` ;
- `opacity`.

Slots audio V1 :

- `cast`, `release`, `travel`, `impact`, `vanish`, `reappear`, `hit`, `miss`.

Réglages audio :

- `assetId` ;
- `volume` ;
- `loop`.

Interdit :

- dégâts, soins, énergie, cooldown, cible, portée ou élément dans le binding ;
- DOM/storage/global/réseau ;
- résolution physique d'asset ;
- modification du renderer ou de `demo-assets.js` dans ce lot.

Tests RED :

1. binding visuel/audio valide ;
2. defaults de présentation stables ;
3. assetId stable exigé, chemins/URLs refusés ;
4. scale/offset/opacity/volume validés ;
5. clés de gameplay ou inconnues refusées ;
6. export sans binding -> `null` ;
7. id/subject du binding cohérents avec la skill exportée ;
8. aucune résolution d'asset ni autorité runtime ;
9. aucune modification de SkillDefinition.

Critère GREEN :

- contrat + adaptateur purs ;
- tests + CI globale SUCCESS ;
- checkpoint GREEN avant toute preview éditeur.


Résultat micro-lot E — SkillPresentationBindingV1 + raccord export Capture :

- test RED : commit `285eacba8f1824bfb9438c0a27dbc90764b9f8bd`, CI `36316752753` — FAILURE attendue car contrat/adaptateur absents ;
- contrat : `src/contracts/skill-presentation-binding-v1.js` ;
- adaptateur : `src/adapters/input/capture/capture-skill-presentation-adapter-v1.js` ;
- commits : `a6d3aeb8fe44c4b211f695a554add9e03d1b8cc9` puis `6691b19105d0336e149a9cb9d324d3f078f48455` ;
- CI finale : run `36316808236` — SUCCESS.

Garanties :

- gameplay totalement absent du binding ;
- `assetId` logique stable requis, chemins/URLs refusés ;
- slots visuels et audio versionnés ;
- scale, attachment, anchor, offsets, layer, trigger, playback, rotation, opacity, volume et loop validés ;
- clés inconnues refusées afin d'éviter une sémantique implicite ;
- binding absent -> `null` ;
- identité `presentationId / binding.id / subjectId` vérifiée ;
- aucune résolution physique d'asset ;
- aucun changement renderer / Demo UI / SkillDefinition.

Prochaine action après checkpoint GREEN exact :

- micro-lot F : assembler un `CaptureCombatPackageV1` purement local ;
- chaîne : export -> fighter configs + skills + battle format + rosters + presentation bindings ;
- test vrai chemin jusqu'à Combat Session, sans UI et sans GenSrpG.


## Réconciliation — pile autoritaire Capture Adapter V1 — 2026-09-27

Base autoritaire :

- `checkpoint/lab-capture-presentation-binding-v1-green-2026-09-27` ;
- SHA : `a12c50f40a0d8a4ccba3aaeee1b3d162fc100b4a` ;
- CI : run `36316845123` — SUCCESS.

Checkpoint de départ :

`checkpoint/lab-start-capture-adapter-stack-v1-2026-09-27`

Branche :

`work/lab-capture-adapter-stack-v1-2026-09-27`

### Décision d'autorité

Après cartographie GitHub, plusieurs branches historiques/parallèles couvrent des responsabilités proches.

La pile linéaire retenue comme seule lignée d'intégration pour ce chantier est :

1. `checkpoint/lab-capture-adapter-audit-green-2026-09-27` ;
2. `checkpoint/lab-capture-export-v1-green-2026-09-27` ;
3. `checkpoint/lab-capture-creature-adapter-v1-green-2026-09-27` ;
4. `checkpoint/lab-capture-skill-adapter-v1-green-2026-09-27` ;
5. `checkpoint/lab-capture-roster-format-adapter-v1-green-2026-09-27` ;
6. `checkpoint/lab-capture-presentation-binding-v1-green-2026-09-27`.

Les branches parallèles suivantes ne doivent pas être fusionnées automatiquement dans cette pile :

- variantes sans suffixe `-v1` issues d'une divergence antérieure ;
- `capture-creature-fighter-adapter` ;
- `capture-combat-package` / `capture-package-preview-ui` tant qu'un ré-audit de raccord avec la pile autoritaire et le 2v2 courant n'est pas fait.

Elles restent des historiques Git utiles ; elles ne deviennent pas une seconde autorité active.

### Pourquoi cette lignée

- elle utilise `CaptureCombatExportV1` comme frontière unique ;
- le Creature Adapter laisse les defaults au vrai `Combat State` ;
- le Skill Adapter délègue la sémantique au vrai `SkillDefinition` ;
- roster et format réutilisent leurs contrats natifs ;
- présentation reste séparée du gameplay par `SkillPresentationBindingV1` ;
- 1v1 et 2v2 utilisent la même structure de données ;
- aucun propriétaire ne lit GenSrpG, DOM, storage ou chemins physiques d'assets.

## Micro-lot — composition Capture Adapter Stack V1

Objectif :

Ajouter un point d'entrée pur qui compose les propriétaires GREEN existants, sans recréer leurs règles.

Propriétaire :

- `src/adapters/input/capture/capture-export-adapter-stack-v1.js`.

Entrée :

- un `CaptureCombatExportV1`.

Sortie cible :

- `battleFormat` natif ;
- `roster` natif ;
- `fighterConfigs` par `creatureId` ;
- `fighters` actifs par `actorId` pour `CombatSession` ;
- `skills` normalisés par ID ;
- `skillPresentations` par ID, `null` si absent.

Règles :

- composition uniquement ;
- aucune formule ;
- aucun default propre à la pile ;
- aucune inférence par nom/label ;
- aucune résolution d'asset ;
- aucun UI/renderer/runtime ;
- aucune dépendance GenSrpG.

Fichiers autorisés :

- nouveau point d'entrée d'adaptation ;
- son test d'intégration ;
- présente documentation.

Tests RED prévus :

1. export 1v1 -> pile native complète ;
2. export 2v2 -> même chemin, sans `is2v2` ;
3. vrais `CombatSession` + `RosterSession` consomment les sorties ;
4. skill normalisé fonctionne dans `previewSkill` ;
5. presentation binding reste séparé ;
6. source sans DOM/storage/network/GenSrpG ;
7. aucun duplicata de logique de validation des sous-adaptateurs.

Critère GREEN :

- RED observé avant implémentation ;
- composition minimale ;
- vraie chaîne export -> adapters -> CombatSession/RosterSession testée ;
- CI globale SUCCESS ;
- documentation synchronisée ;
- checkpoint GREEN exact.


Résultat — composition Capture Adapter Stack V1 :

- déclaration/réconciliation : commit `4dbbf98568fe5ba0d4d1fb18f2de89d212a7df6b` ;
- CI déclaration : run `36318967381` — SUCCESS ;
- test RED : commit `cd4238b4d5b28c19ebee09ca47285c13c3a93291` ;
- CI RED : run `36319009481` — FAILURE attendue ;
- cause RED confirmée : `ERR_MODULE_NOT_FOUND` sur le nouveau point d'entrée ;
- implémentation minimale : commit `53b70c3c75a09e7456e907113a58db4de0741ca9` ;
- CI fonctionnelle : run `36319046243` — SUCCESS.

Propriétaire créé :

- `src/adapters/input/capture/capture-export-adapter-stack-v1.js`.

Sortie composée :

- BattleFormat natif ;
- RosterDefinition natif ;
- FighterConfig par créature ;
- fighters actifs par actorId ;
- SkillDefinition par compétence ;
- SkillPresentationBindingV1 par compétence ou `null`.

Vrai chemin couvert :

`CaptureCombatExportV1 -> adapters GREEN -> CombatSession + RosterSession`.

Invariants :

- aucun `is2v2` ;
- même chemin 1v1 / 2v2 ;
- aucune formule ou validation métier dupliquée dans la composition ;
- aucune inférence par nom/label ;
- aucune résolution d'asset ;
- aucun DOM, storage, réseau, renderer ou dépendance GenSrpG ;
- les branches parallèles recensées restent hors pile autoritaire et ne sont pas mergées.

Checkpoint GREEN prévu après CI documentaire :

`checkpoint/lab-capture-adapter-stack-v1-green-2026-09-27`.

Étape suivante seulement après fermeture GREEN :

pré-audit du raccord de cette pile avec la **branche 2v2 visuelle réellement validée**, sans réutiliser directement les anciennes branches `capture-package-preview-ui` qui divergent du 2v2 courant.


## Micro-lot — loadouts de compétences par acteur V1 — 2026-09-27

Base :

- checkpoint GREEN précédent : `checkpoint/lab-capture-adapter-stack-v1-green-2026-09-27` ;
- SHA : `1d79dcc3c29e7b51f6834affec9e38bcbcf9afd8` ;
- checkpoint départ : `checkpoint/lab-start-capture-actor-skill-loadouts-v1-2026-09-27` ;
- branche : `work/lab-capture-actor-skill-loadouts-v1-2026-09-27`.

Cause démontrée pendant le pré-audit UI :

- le format 2v2 est data-driven pour acteurs/équipes ;
- mais la barre locale rend actuellement toutes les skills chargées ;
- les trois IA utilisent encore des listes de skill IDs codées en dur ;
- un raccord éditeur ne doit pas dépendre de ces listes de démo.

Objectif :

Étendre uniquement la sortie de composition Capture avec :

`skillIdsByActor: { [actorId]: string[] }`

Dérivation autorisée :

`actor.creatureId -> exported creature -> creature.skillIds`

Aucune autre règle.

Propriétaire :

- `src/adapters/input/capture/capture-export-adapter-stack-v1.js`.

Protégé :

- UI 2v2 ;
- Combat Rules / Runtime ;
- BattleFormatDefinition ;
- SkillDefinition ;
- IA ;
- présentation / assets ;
- dépôt GenSrpG.

Tests :

1. 1v1 : loadout joueur/adversaire explicite ;
2. 2v2 : quatre acteurs utilisent la même dérivation ;
3. arrays gelés ;
4. aucune inférence par controller/name/team ;
5. aucun changement des sorties existantes.

Critère GREEN :

- test RED ciblé ;
- implémentation dérivée uniquement des données normalisées ;
- CI SUCCESS ;
- documentation ;
- checkpoint exact.


Résultat — loadouts de compétences par acteur V1 :

- déclaration : commit `eb398923ab51dd69fd6bdec1eff6c28d0f9d9fc7`, CI `36319258151` — SUCCESS ;
- test RED : commit `6c3edbff535e4ef43eab82d15e40264c291d36fd`, CI `36319275549` — FAILURE attendue ;
- implémentation : commit `7c66b380dfb359080b2d99b376f48c65671f4d40` ;
- CI fonctionnelle : run `36319300384` — SUCCESS.

Sortie ajoutée à la pile :

`skillIdsByActor`

Dérivation unique :

`actor.creatureId -> creature.skillIds`.

Aucune logique controller/team/nom/IA n'est utilisée.

Le même chemin couvre 1v1 et 2v2 ; les tableaux proviennent du contrat export normalisé et restent immuables.

Checkpoint final prévu après CI documentaire :

`checkpoint/lab-capture-actor-skill-loadouts-v1-green-2026-09-27`.

Prochaine étape :

micro-lot UI séparé : permettre à `mountCoop2v2Test` de recevoir une source de données native optionnelle (format/fighters/skills/loadouts) tout en conservant exactement le chargement JSON historique lorsque cette source est absente.


## Pré-audit — source éditeur Capture -> laboratoire V1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-capture-actor-skill-loadouts-v1-green-2026-09-27` ;
- SHA `8f86595d30337aaf4ebb42b694ca892093f03f2c`.

Checkpoint de départ :

`checkpoint/lab-start-capture-editor-source-preaudit-v1-2026-09-27`.

Branche :

`work/lab-capture-editor-source-preaudit-v1-2026-09-27`.

Source GenSrpG lue uniquement :

- checkpoint `checkpoint/gensrpg-phase7-dungeon-generated-branch-plan-green-2026-09-27` ;
- SHA `49289784ee92a47fd51089815ca25954cdba4493` ;
- `index.html` taille `8170062` ;
- blob `74e223b2c9877e6a88b6ad6726290d230f1f616e` ;
- fichier fourni `labo1.zip/indexLabo.txt` vérifié byte-identique par blob Git.

Résultat :

- propriétaire créature historique identifié : chaîne `SharedEntity` ;
- propriétaire capacités Capture identifié : `Ability Library` ;
- `openSkillEditor/saveSkillToLibrary` exclus : ancien chemin Survie/héros, pas l'éditeur Capture actuel ;
- `captureFix132/133/137/144/139` et seed `builtinMonsterCapture162` classés runtime/legacy, non copiables comme fondation ;
- écarts explicites cartographiés vers FighterConfig, SkillDefinition et SkillPresentationBindingV1 ;
- aucun code GenSrpG copié ;
- aucun runtime du laboratoire modifié.

Document :

`docs/LAB_CAPTURE_EDITOR_SOURCE_PREAUDIT_V1.md`.

Prochaine étape après CI documentaire GREEN :

- micro-lot pur `CaptureCreatureEditorDraftV1` ;
- contrat/test uniquement ;
- aucune UI, aucun DOM, aucun storage ;
- conversion vers le fragment créature de `CaptureCombatExportV1` seulement après GREEN du contrat.


### Résultat CI du pré-audit éditeur Capture

SHA documentaire pré-audit :

`65c669c81061f8a67c00334ca555d480d2476b66`.

CI :

- Laboratory CI run `36334136254` — SUCCESS.

Aucun runtime du laboratoire n'a été modifié.
Aucun fichier du dépôt `Zombicide-40k` n'a été modifié.

Checkpoint GREEN final à créer après CI du présent SHA documentaire :

`checkpoint/lab-capture-editor-source-preaudit-v1-green-2026-09-27`.

Étape suivante autorisée :

- micro-lot `CaptureCreatureEditorDraftV1` ;
- contrat pur + tests RED/GREEN ;
- pas d'UI, pas de DOM, pas de storage, pas de formule RPG ;
- champs combat nécessaires au laboratoire explicitement éditables, jamais dérivés depuis les stats historiques.


## Micro-lot — CaptureCreatureEditorDraftV1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-capture-editor-source-preaudit-v1-green-2026-09-27` ;
- SHA `cab1917b203c651054c6ef8e572b030cfd64217f` ;
- CI pré-audit : run `36334164734` — SUCCESS.

Checkpoint de départ :

`checkpoint/lab-start-capture-creature-editor-draft-v1-2026-09-27`.

Branche :

`work/lab-capture-creature-editor-draft-v1-2026-09-27`.

Objectif :

Créer un contrat pur représentant le brouillon de créature que le futur éditeur Capture pourra produire, sans reprendre le DOM, le localStorage ou les fonctions historiques de GenSrpG.

Propriétaire :

- `src/contracts/capture-creature-editor-draft-v1.js`.

Données éditables V1 retenues :

- identité : id / displayName / description ;
- niveau ;
- statistiques source éditoriales normalisées : force, agility, intelligence, spirit, endurance, initiative ;
- éléments et résistances ;
- paramètres Capture : capturable, captureRate, spawnChance, spawnTags, évolution ;
- `skillIds` ;
- `presentationId` logique optionnel ;
- bloc `combat` explicite compatible avec la future frontière export.

Règle critique :

les stats éditoriales ne déterminent jamais implicitement `maxHp`, `maxEnergy`, recharge, mouvement ou vitesse de charge.

Les champs combat doivent être fournis explicitement.

Protégé / interdit :

- aucun DOM ;
- aucun storage ;
- aucun import GenSrpG ;
- aucun asset binaire ou URL ;
- aucune formule Force/Agilité/Esprit -> combat ;
- aucune modification Combat Rules / Runtime / UI ;
- aucune conversion vers `CaptureCombatExportV1` dans ce lot.

Tests RED prévus :

1. brouillon complet valide ;
2. combat explicite obligatoire ;
3. stats élevées ne compensent jamais un champ combat absent ;
4. taux Capture/spawn bornés ;
5. skillIds uniques ;
6. évolution structurée ;
7. champs inconnus refusés ;
8. sortie profondément gelée ;
9. sentinelle sans DOM/storage/network/GenSrpG.

Critère GREEN :

- RED observé avant implémentation ;
- contrat minimal ;
- CI globale SUCCESS ;
- documentation synchronisée ;
- checkpoint GREEN exact avant tout exporter.


### Résultat technique — CaptureCreatureEditorDraftV1

RED contractuel :

- test : `tests/unit/capture-creature-editor-draft-v1.test.mjs` ;
- commit RED : `2ec2fb089139f6e68c2b649af4b64bc7d91cb812` ;
- CI : run `36334274999` — FAILURE attendue ;
- cause isolée : `ERR_MODULE_NOT_FOUND` sur `src/contracts/capture-creature-editor-draft-v1.js` ;
- un seul test de fichier en échec, reste de la suite intact.

Implémentation minimale :

- contrat : `src/contracts/capture-creature-editor-draft-v1.js` ;
- commit : `01e0bf690bb85956ff2f343fd992a3db4f40f347` ;
- CI : run `36334393543` — SUCCESS.

Garanties validées :

- schéma exact `capture-creature-editor-draft-v1` ;
- identité, description, niveau, stats source, éléments, résistances, Capture, combat, skills et presentationId normalisés ;
- combat explicitement requis : `maxHp` et `maxEnergy` ne sont jamais dérivés ;
- stats source même extrêmes ne compensent jamais un champ combat absent ;
- pourcentages Capture/spawn bornés 0..100 ;
- identifiants d'éléments et skillIds uniques ;
- évolution structurée `level` ou `manual` ;
- champs sémantiques inconnus refusés ;
- structure profondément gelée ;
- aucune autorité DOM/storage/network/GenSrpG/captureFix.

Aucune UI ni runtime n'a été modifié ; validation smartphone non requise pour ce lot.

Checkpoint GREEN prévu après CI du présent SHA documentaire :

`checkpoint/lab-capture-creature-editor-draft-v1-green-2026-09-27`.

Prochaine étape après fermeture GREEN :

- micro-lot `CaptureSkillEditorDraftV1` ;
- contrat pur uniquement ;
- sémantique native SkillDefinition explicite ;
- présentation séparée via SkillPresentationBindingV1 ;
- aucune inférence depuis les noms/IDs/texte legacy.


## Micro-lot — CaptureSkillEditorDraftV1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-capture-creature-editor-draft-v1-green-2026-09-27` ;
- SHA `bb9477565530d1a06b6441120e5c9120c89712e6` ;
- CI documentaire : run `36334424208` — SUCCESS.

Checkpoint de départ :

`checkpoint/lab-start-capture-skill-editor-draft-v1-2026-09-27`.

Branche :

`work/lab-capture-skill-editor-draft-v1-2026-09-27`.

Objectif :

Créer un contrat pur représentant le brouillon d'une capacité Capture éditable, en réutilisant les autorités natives du laboratoire au lieu de recréer leurs règles.

Propriétaire :

- `src/contracts/capture-skill-editor-draft-v1.js`.

Composition retenue :

- identité et description éditoriale ;
- niveau requis et scopes d'usage conservés comme métadonnées d'éditeur ;
- `definition` explicitement validée par le vrai `normalizeSkillDefinition` ;
- `presentation` optionnelle explicitement validée par `normalizeSkillPresentationBindingV1`.

Règles critiques :

- `draft.id === definition.id` ;
- si une présentation existe, `presentation.subjectType === "skill"` et `presentation.subjectId === draft.id` ;
- aucune catégorie, forme, approche, timing, cible, effet ou cooldown futur n'est inféré depuis le nom, le texte, l'élément ou un ID legacy ;
- aucune règle de gameplay n'est dupliquée hors `SkillDefinition` ;
- aucune résolution physique d'asset.

Protégé / interdit :

- aucun DOM/storage/network ;
- aucun import GenSrpG ;
- aucune Ability Library historique au runtime ;
- aucun `captureFix*` ;
- aucun changement SkillDefinition / PresentationBinding ;
- aucune UI ;
- aucun exporter vers CaptureCombatExportV1 dans ce lot.

Tests RED prévus :

1. brouillon complet valide ;
2. délégation réelle au normalizer SkillDefinition ;
3. absence de forme/catégorie explicite refusée même si le nom semble l'indiquer ;
4. mismatch id/definition.id refusé ;
5. présentation optionnelle et subjectId cohérent ;
6. niveau requis / scopes normalisés et gelés ;
7. champs inconnus refusés ;
8. sentinelle sans DOM/storage/network/GenSrpG/captureFix.

Critère GREEN :

- RED observé avant implémentation ;
- composition minimale des contrats existants ;
- CI globale SUCCESS ;
- documentation synchronisée ;
- checkpoint GREEN exact avant exporter éditeur.


### Résultat technique — CaptureSkillEditorDraftV1

RED contractuel :

- test : `tests/unit/capture-skill-editor-draft-v1.test.mjs` ;
- commit RED : `bca8559da99bd5703aba366adfb29e0d176db5e7` ;
- CI : run `36334513587` — FAILURE attendue ;
- cause isolée : `ERR_MODULE_NOT_FOUND` sur `src/contracts/capture-skill-editor-draft-v1.js` ;
- un seul fichier de test en échec.

Implémentation minimale :

- contrat : `src/contracts/capture-skill-editor-draft-v1.js` ;
- commit : `79908e8f93b14d677d449edbfe6127f74f5c196d` ;
- CI : run `36334562506` — SUCCESS.

Garanties :

- schéma exact `capture-skill-editor-draft-v1` ;
- `definition` déléguée au vrai `normalizeSkillDefinition` ;
- aucune inférence de form/category depuis nom/description/élément ;
- id du draft et id de SkillDefinition obligatoirement cohérents ;
- présentation optionnelle déléguée à `normalizeSkillPresentationBindingV1` ;
- subjectId de présentation obligatoirement cohérent avec la skill ;
- requiredLevel et usageScopes restent métadonnées d'éditeur séparées ;
- champs inconnus refusés ;
- aucune UI/storage/network/GenSrpG/Ability Library/captureFix.

Aucune UI ni runtime modifié ; validation smartphone non requise.

Checkpoint GREEN prévu après CI du présent SHA documentaire :

`checkpoint/lab-capture-skill-editor-draft-v1-green-2026-09-27`.

Prochaine étape :

- exporter pur des brouillons éditeur vers les fragments `CaptureCombatExportV1` ;
- aucune création de CombatSession ;
- aucune formule ou inférence ;
- la frontière export existante reste l'autorité de validation finale.


## Micro-lot — Capture Editor Exporter V1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-capture-skill-editor-draft-v1-green-2026-09-27` ;
- SHA `4adca5d00c06a935c4bebb7d17d021dac659f831` ;
- CI documentaire : run `36334590255` — SUCCESS.

Checkpoint de départ :

`checkpoint/lab-start-capture-editor-exporter-v1-2026-09-27`.

Branche :

`work/lab-capture-editor-exporter-v1-2026-09-27`.

Objectif :

Composer des `CaptureCreatureEditorDraftV1` et `CaptureSkillEditorDraftV1` validés vers le vrai contrat frontière `CaptureCombatExportV1`, sans modifier le moteur et sans inventer de données.

Propriétaire :

- `src/adapters/input/capture/capture-editor-exporter-v1.js`.

Entrée :

- battle / teams / actors / rosters fournis explicitement par l'appelant ;
- `creatureDrafts` ;
- `skillDrafts` ;
- metadata export optionnelle JSON-compatible.

Sortie :

- un `CaptureCombatExportV1` déjà normalisé.

Mapping autorisé :

- créature : id/displayName/combat/skillIds/presentationId ;
- données éditoriales historiques (description, level, sourceStats, elements, resistances, capture) conservées sous `creature.metadata.editor` ;
- skill : id/definition ;
- requiredLevel/description/usageScopes conservés sous `skill.metadata.editor` ;
- si le draft skill possède une présentation : `skill.presentationId = presentation.id` et binding copié sous `presentation.skills[presentation.id]`.

Règles critiques :

- aucun calcul depuis sourceStats ;
- aucun mapping par nom/label/élément ;
- aucun default gameplay propre à l'exporter ;
- les deux contrats Draft restent propriétaires de leurs entrées ;
- `normalizeCaptureCombatExportV1` reste l'autorité finale de la frontière ;
- IDs dupliqués de drafts ou bindings refusés avant toute perte silencieuse.

Protégé / interdit :

- aucun CombatSession/Runtime/UI/Renderer ;
- aucun DOM/storage/network ;
- aucun import GenSrpG ;
- aucune résolution d'asset ;
- aucune modification des contrats déjà GREEN.

Tests RED prévus :

1. export 1v1 complet depuis brouillons ;
2. metadata éditeur conservée ;
3. combat explicite conservé byte-sémantiquement, sans dérivation stats ;
4. présentation skill placée et référencée correctement ;
5. vrai `adaptCaptureCombatExportStackV1` consomme la sortie ;
6. références actor/skill invalides refusées par la frontière finale ;
7. doublons créature/skill/presentation refusés ;
8. sentinelle d'indépendance.

Critère GREEN :

- RED observé ;
- exporter minimal ;
- vrai chemin Drafts -> CaptureCombatExportV1 -> Adapter Stack testé ;
- CI globale SUCCESS ;
- documentation ;
- checkpoint GREEN avant toute UI éditeur.


### Résultat technique — Capture Editor Exporter V1

RED contractuel :

- test : `tests/unit/capture-editor-exporter-v1.test.mjs` ;
- commit RED : `d07a6d70ebfde3eb325f8c48bb17baa51525d4de` ;
- CI : run `36334703520` — FAILURE attendue ;
- cause isolée : `ERR_MODULE_NOT_FOUND` sur `src/adapters/input/capture/capture-editor-exporter-v1.js` ;
- un seul fichier de test en échec.

Implémentation minimale :

- exporter : `src/adapters/input/capture/capture-editor-exporter-v1.js` ;
- commit : `de97c32a3c6a7dc4dd3d3c81782835e82c4f7d1d` ;
- CI : run `36334755085` — SUCCESS.

Vrai chemin validé :

`CaptureCreatureEditorDraftV1 + CaptureSkillEditorDraftV1`
-> `Capture Editor Exporter V1`
-> `CaptureCombatExportV1`
-> `Capture Adapter Stack V1`.

Garanties :

- combat copié uniquement depuis le bloc explicite du brouillon créature ;
- sourceStats, level, description, éléments, résistances et paramètres Capture conservés sous `metadata.editor`, sans devenir gameplay ;
- SkillDefinition copiée sans remapping ;
- présentation skill référencée par `presentationId` et transportée sous `presentation.skills` ;
- requiredLevel / usageScopes conservés uniquement comme metadata éditeur ;
- références actor/creature/skill validées par le vrai `CaptureCombatExportV1` ;
- doublons de draft et de binding refusés avant toute perte silencieuse ;
- sortie consommée directement par la pile d'adaptateurs autoritaire ;
- aucune UI, aucun Runtime, aucun DOM/storage/network/GenSrpG.

Aucune validation smartphone requise pour ce lot purement contractuel.

Checkpoint GREEN prévu après CI du présent SHA documentaire :

`checkpoint/lab-capture-editor-exporter-v1-green-2026-09-27`.

Prochaine étape autorisée :

- pré-audit UI uniquement pour une démo d'éditeur Capture du laboratoire ;
- l'UI devra modifier des brouillons puis appeler les contrats/exporter ;
- aucun calcul gameplay, aucune sauvegarde GenSrpG, aucun raccord production.


## Pré-audit — éditeur Capture humain V1 — 2026-09-27

Base GREEN volontaire :

- `checkpoint/lab-capture-editor-exporter-v1-green-2026-09-27` ;
- SHA `41c05bd0fa2e7029e3bdaae8174fe584a055f802`.

La branche UI technique précédente n'est pas patchée et n'est pas utilisée comme nouvelle fondation fonctionnelle.

Checkpoint départ :

`checkpoint/lab-start-capture-editor-human-preaudit-v1-2026-09-27`.

Branche :

`work/lab-capture-editor-human-preaudit-v1-2026-09-27`.

Retour utilisateur pris comme exigence produit :

- éditeur commun et lisible ;
- séparation Créature / Combat / Capacités ;
- face / dos / icône ;
- profil morphologique ;
- sockets projectiles positionnables ;
- 4 slots de capacités ;
- sons créature ;
- énergie / récupération / format de bataille ;
- capacité : type, dégâts/soin, élément, effet, coût, forme, mouvement, préparation, cooldown futur, trajet, audio, FX.

Résultat d'architecture :

- nouveaux champs non représentés = nouveaux contrats avant UI ;
- aucun champ factice ou masqué ;
- aucun raccord Runtime depuis l'UI ;
- aucun patch de l'UI V1 technique ;
- premier lot recommandé : `CreaturePresentationBindingV1`.

Document :

`docs/LAB_CAPTURE_EDITOR_HUMAN_PREAUDIT_V1.md`.

Critère de fermeture :

- CI documentaire GREEN ;
- checkpoint pré-audit GREEN ;
- ouverture ensuite du lot contractuel `CreaturePresentationBindingV1`.


## Micro-lot — CreaturePresentationBindingV1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-capture-editor-human-preaudit-v1-green-2026-09-27` ;
- SHA `d4ee61cd325d630d940a72c58d197309f03c37ac` ;
- CI pré-audit : run `36338214151` — SUCCESS.

Checkpoint de départ :

`checkpoint/lab-start-creature-presentation-binding-v1-2026-09-27`.

Branche :

`work/lab-creature-presentation-binding-v1-2026-09-27`.

Objectif :

Créer le propriétaire pur des données de présentation d'une créature nécessaires au futur éditeur humain Capture, sans toucher au renderer ni au runtime.

Propriétaire :

- `src/contracts/creature-presentation-binding-v1.js`.

Données V1 :

- id du binding ;
- version ;
- subjectType = creature ;
- subjectId ;
- profileId ;
- visuel : front obligatoire, back optionnel, icon optionnel ;
- sockets de projectile/FX positionnés en coordonnées normalisées 0..1 ;
- chaque socket possède un point front obligatoire et un point back optionnel ;
- audio générique : attack / hit / ko.

Règle fallback mono-image :

- seule l'image `front` est requise ;
- back/icon restent optionnels afin de conserver le cas minimal mono-image imposé par la charte ;
- aucun fallback runtime n'est implémenté dans ce lot.

Règle sockets :

- IDs libres et uniques ;
- l'UI pourra proposer tête/main/patte/queue/bouche, mais le contrat n'en déduit aucun ;
- aucune position n'est calculée depuis la morphologie ;
- une capacité pourra plus tard référencer le socket par son `anchor` de PresentationBinding.

Règle assets :

- uniquement `assetId` logique stable ;
- aucune URL/chemin physique.

Protégé / interdit :

- aucun Renderer ;
- aucun Combat Runtime ;
- aucun Asset Catalog lookup ;
- aucune UI ;
- aucun GenSrpG ;
- aucun DOM/storage/network ;
- aucune modification de SkillPresentationBindingV1 ;
- aucun mapping automatique front/back vers player/opponent dans ce lot.

Tests RED :

1. binding complet valide ;
2. cas mono-image front seulement valide ;
3. front obligatoire ;
4. asset IDs physiques/URL refusés ;
5. sockets uniques ;
6. coordonnées bornées 0..1 ;
7. back de socket optionnel ;
8. audio slots attack/hit/ko seulement ;
9. sortie profondément gelée ;
10. sentinelle indépendance.

Critère GREEN :

- RED isolé ;
- contrat minimal ;
- CI globale SUCCESS ;
- documentation ;
- checkpoint GREEN exact avant composition dans le brouillon créature.


### Résultat technique — CreaturePresentationBindingV1

RED :

- test : `tests/unit/creature-presentation-binding-v1.test.mjs` ;
- commit RED : `7fa88250e16bd2791ee9f554e17e8654cc78c1ac` ;
- CI : run `36338306545` — FAILURE attendue ;
- cause isolée : `ERR_MODULE_NOT_FOUND` sur le nouveau contrat ;
- un seul fichier de test en échec.

Implémentation minimale :

- contrat : `src/contracts/creature-presentation-binding-v1.js` ;
- commit : `afe6f508a1b38725f44ddf5797b9d68bbb330fba` ;
- CI : run `36338356018` — SUCCESS.

Garanties validées :

- `subjectType = creature` ;
- `profileId` explicite ;
- image front obligatoire ;
- image back optionnelle ;
- icône optionnelle ;
- fallback mono-image possible sans inventer de ressource ;
- asset IDs logiques uniquement ;
- sockets libres, uniques et indépendants du DOM ;
- coordonnées front/back bornées 0..1 ;
- point back de socket optionnel ;
- aucun auto-détecteur de socket ;
- sons génériques limités à attack / hit / ko ;
- volume audio borné ;
- sortie profondément gelée ;
- aucune dépendance Renderer / UI / Runtime / Storage / GenSrpG.

Aucun raccord renderer ou éditeur n'a été réalisé.

Checkpoint GREEN final :

`checkpoint/lab-creature-presentation-binding-v1-green-2026-09-27`.

Prochaine étape sûre :

- ne pas connecter encore ce binding à l'UI ;
- auditer la future responsabilité des 4 slots de capacité afin d'éviter une double autorité avec `CaptureCreatureEditorDraftV1.skillIds`.


## Micro-lot — CaptureCreatureEditorDraftV2 — 2026-09-27

Base GREEN :

- `checkpoint/lab-creature-presentation-binding-v1-green-2026-09-27` ;
- SHA `4a77410ab3aab2f0fd930cb2d5b1d105693ff964`.

Checkpoint de départ :

`checkpoint/lab-start-capture-creature-editor-draft-v2-2026-09-27`.

Branche :

`work/lab-capture-creature-editor-draft-v2-2026-09-27`.

Objectif :

Composer les données éditoriales Capture existantes avec `CreaturePresentationBindingV1` sans modifier le contrat V1 ni dupliquer les assets dans le gameplay.

Propriétaire :

- `src/contracts/capture-creature-editor-draft-v2.js`.

Décision de modèle :

- le brouillon V2 conserve les champs métier de `CaptureCreatureEditorDraftV1` ;
- la présentation devient une propriété `presentation` optionnelle ;
- si présente, elle est validée par `normalizeCreaturePresentationBindingV1` ;
- `presentation.subjectId` doit correspondre à l'id de la créature ;
- `presentationId` est dérivé du binding normalisé, jamais saisi comme deuxième source de vérité ;
- aucune image, aucun son, aucun socket n'entre dans `combat`.

Protégé / interdit :

- aucune modification du V1 ;
- aucun renderer ;
- aucune UI ;
- aucun storage/network ;
- aucune résolution physique d'asset ;
- aucune dépendance GenSrpG ;
- aucun mapping par nom/profil ;
- aucun loadout 4 slots dans ce lot.

Tests RED :

1. composition complète V2 ;
2. délégation réelle au V1 pour le métier ;
3. délégation réelle à CreaturePresentationBindingV1 ;
4. mismatch subjectId refusé ;
5. presentationId dérivé ;
6. présentation absente autorisée ;
7. champs inconnus refusés ;
8. profonde immutabilité ;
9. sentinelle d'indépendance.

Critère GREEN :

- RED isolé avant implémentation ;
- contrat minimal de composition ;
- CI globale SUCCESS ;
- documentation ;
- checkpoint GREEN avant le lot loadout.


### Résultat — CaptureCreatureEditorDraftV2

RED :

- commit : `c80e5b5626b5986f30e7c971b0b992063f9d1aa4` ;
- CI : run `36340737207` — FAILURE attendue ;
- cause isolée : `ERR_MODULE_NOT_FOUND` sur le contrat V2 ;
- un seul fichier de test en échec.

Implémentation :

- `src/contracts/capture-creature-editor-draft-v2.js` ;
- commit : `6d6f1b874422348e081ca5b00c09ed9d1cd71b06` ;
- CI : run `36340783409` — SUCCESS.

Garanties :

- V1 inchangé et réutilisé comme propriétaire des données métier ;
- CreaturePresentationBindingV1 réutilisé comme propriétaire face/dos/icône/profil/sockets/audio ;
- subjectId présentation = id créature obligatoire ;
- presentationId dérivé du binding, jamais saisi séparément ;
- présentation absente autorisée ;
- aucun asset dans combat ;
- aucun renderer/UI/storage/network/GenSrpG.

Aucune validation smartphone nécessaire : contrat pur.

Checkpoint GREEN final :

`checkpoint/lab-capture-creature-editor-draft-v2-green-2026-09-27`.

Prochaine étape :

- contrat de loadout Capture actif 4 slots ;
- pas de trim silencieux ;
- pas de duplication de SkillDefinition ;
- le catalogue de compétences peut rester supérieur à quatre ;
- seules les compétences équipées alimenteront le combat.


## Micro-lot — CaptureActiveSkillLoadoutV1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-capture-creature-editor-draft-v2-green-2026-09-27` ;
- SHA `1b298994f3be347f3959358ab6e18e41c283a472`.

Checkpoint de départ :

`checkpoint/lab-start-capture-skill-loadout-v1-2026-09-27`.

Branche :

`work/lab-capture-skill-loadout-v1-2026-09-27`.

Objectif :

Définir les quatre emplacements actifs de capacités d'une créature sans transformer l'UI ou l'ancien tableau `skillIds` en propriétaire implicite.

Propriétaire :

- `src/contracts/capture-active-skill-loadout-v1.js`.

Modèle :

- un `creatureId` ;
- exactement quatre slots explicites `slot-1..slot-4` ;
- chaque slot contient un `skillId` ou `null` ;
- `equippedSkillIds` est dérivé du contenu des slots et n'est jamais une entrée.

Règles :

- quatre slots exactement ;
- ordre et IDs des slots explicites ;
- slots vides autorisés ;
- même capacité interdite dans deux slots ;
- cinquième slot refusé, jamais tronqué ;
- aucune SkillDefinition dupliquée ;
- aucune vérification du catalogue dans ce contrat : la cohérence référentielle appartiendra au futur composeur/exporter ;
- ce lot ne modifie pas encore `CaptureCombatExportV1` ni `skillIdsByActor`.

Interdit :

- aucun UI/runtime/renderer ;
- aucune dépendance GenSrpG ;
- aucune inférence depuis nom/catégorie ;
- aucun trim silencieux ;
- aucun fallback automatique vers les quatre premières capacités.

Tests RED :

1. quatre slots valides ;
2. slots partiellement vides ;
3. nombre différent de quatre refusé ;
4. IDs de slots incorrects/refusés ;
5. doublons de capacité refusés ;
6. equippedSkillIds dérivé ;
7. champ source concurrent `equippedSkillIds` refusé ;
8. profonde immutabilité ;
9. sentinelle indépendance.

Critère GREEN :

- RED isolé ;
- contrat minimal ;
- CI globale SUCCESS ;
- documentation ;
- checkpoint GREEN avant le composeur/exporter loadout.


### Résultat — CaptureActiveSkillLoadoutV1

RED :

- commit : `92d66f812d1c058b49cd032b8b01f1adc3596a62` ;
- CI : run `36340901006` — FAILURE attendue ;
- cause isolée : `ERR_MODULE_NOT_FOUND` ;
- un seul fichier de test en échec.

Implémentation :

- `src/contracts/capture-active-skill-loadout-v1.js` ;
- commit : `2bdff0cf321b0403bd53bb3fd70bb9c2be4fc839` ;
- CI : run `36340942065` — SUCCESS.

Garanties :

- exactement 4 slots canoniques ;
- slot vide autorisé ;
- duplicate skillId interdit ;
- 5e slot refusé explicitement ;
- `equippedSkillIds` dérivé et immutable ;
- aucune SkillDefinition embarquée ;
- aucune UI/runtime/storage/GenSrpG ;
- aucune coupe automatique des capacités disponibles.

Aucune validation smartphone requise : contrat pur.

Checkpoint GREEN final :

`checkpoint/lab-capture-active-skill-loadout-v1-green-2026-09-27`.

Prochaine étape :

- `CaptureBattleSetupEditorDraftV1` ;
- format et rosters décrits par données ;
- aucune branche `is2v2` ;
- sortie future vers BattleFormatDefinition / RosterDefinition via composeur dédié.


## Micro-lot — CaptureBattleSetupEditorDraftV1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-capture-active-skill-loadout-v1-green-2026-09-27` ;
- SHA `87dcf12213d7b1f6f62216ce1a4a249be289f358`.

Checkpoint de départ :

`checkpoint/lab-start-capture-battle-setup-editor-draft-v1-2026-09-27`.

Branche :

`work/lab-capture-battle-setup-editor-draft-v1-2026-09-27`.

Objectif :

Décrire le futur onglet « Combat / équipes » avec un brouillon data-driven capable de représenter 1v1, 2v2 et futur NxN sans switch global de mode.

Propriétaire :

- `src/contracts/capture-battle-setup-editor-draft-v1.js`.

Modèle :

- id de bataille ;
- acteur local ;
- équipes ;
- chaque équipe contient un ou plusieurs slots engagés ;
- chaque slot porte actorId / creatureId / displayName / controllerId ;
- roster optionnel par slot avec membre actif et réserve.

Décision importante :

- aucun champ `is2v2` ;
- aucun enum de format obligatoire ;
- le format est la conséquence du nombre de slots déclarés par équipe ;
- l'énergie reste propriété des créatures, pas de ce contrat.

Validation structurelle :

- au moins deux équipes ;
- team IDs uniques ;
- au moins un slot par équipe ;
- actor IDs uniques globalement ;
- localActorId doit référencer un slot ;
- roster members uniques ;
- activeMemberId doit référencer un membre ;
- si un roster actif existe, sa créature doit correspondre à la créature engagée du slot.

Interdit :

- aucune règle d'énergie dupliquée ;
- aucune SkillDefinition ;
- aucun CombatSession/Runtime ;
- aucune UI/renderer/storage ;
- aucune dépendance GenSrpG ;
- aucune déduction depuis un nom ou un nombre de slots.

Tests RED :

1. brouillon 1v1 valide ;
2. même contrat pour 2v2 ;
3. équipes/acteurs uniques ;
4. local actor référentiel ;
5. roster/réserve cohérents ;
6. mismatch actif/slot refusé ;
7. champ de mode artificiel refusé ;
8. profonde immutabilité ;
9. sentinelle sans is2v2/runtime/UI/GenSrpG.

Critère GREEN :

- RED isolé ;
- contrat minimal ;
- CI globale SUCCESS ;
- documentation ;
- checkpoint GREEN avant composeur/exporter V2.


### Résultat — CaptureBattleSetupEditorDraftV1

RED :

- commit : `a00cd1aa0f825b9da685d20be223726832a85e5e` ;
- CI : run `36341071183` — FAILURE attendue ;
- cause isolée : `ERR_MODULE_NOT_FOUND` ;
- un seul fichier de test en échec.

Implémentation :

- `src/contracts/capture-battle-setup-editor-draft-v1.js` ;
- commit : `702a9fb7520cb51cd61930127504a25e3385362c` ;
- CI : run `36341118625` — SUCCESS.

Garanties :

- même modèle pour 1v1 / 2v2 / futur NxN ;
- aucun mode global ou enum de format requis ;
- équipes et acteurs uniques ;
- acteur local référentiel ;
- roster optionnel ;
- membre actif référentiel et cohérent avec la créature engagée ;
- aucune énergie / SkillDefinition / Runtime / UI dupliquée ;
- aucune dépendance GenSrpG.

Aucune validation smartphone requise : contrat pur.

Checkpoint GREEN final :

`checkpoint/lab-capture-battle-setup-editor-draft-v1-green-2026-09-27`.

Prochaine étape :

- composeur/exporter éditeur V2 ;
- entrées : créatures V2, capacités, loadouts 4 slots, battle setup ;
- sortie : vrai CaptureCombatExportV1 ;
- présentations créatures transportées séparément du gameplay ;
- les skillIds exportés proviennent uniquement du loadout actif ;
- aucun raccord direct au Combat Runtime.


## Micro-lot — Capture Editor Exporter V2 — 2026-09-27

Base GREEN :

- `checkpoint/lab-capture-battle-setup-editor-draft-v1-green-2026-09-27` ;
- SHA `eaf30f603b6281cb5fb69f80c9a6affdbed7994a`.

Checkpoint de départ :

`checkpoint/lab-start-capture-editor-exporter-v2-2026-09-27`.

Branche :

`work/lab-capture-editor-exporter-v2-2026-09-27`.

Objectif :

Composer les contrats du futur éditeur humain vers la frontière existante `CaptureCombatExportV1`, sans créer de second runtime ou de second calcul métier.

Entrées :

- `CaptureBattleSetupEditorDraftV1` ;
- `CaptureCreatureEditorDraftV2[]` ;
- `CaptureSkillEditorDraftV1[]` ;
- `CaptureActiveSkillLoadoutV1[]` ;
- metadata optionnelle.

Propriétaire :

- `src/adapters/input/capture/capture-editor-exporter-v2.js`.

Stratégie :

1. normaliser les nouveaux drafts ;
2. convertir le battle setup en battle / teams / actors / rosters ;
3. appliquer le loadout actif :
   - `creatures[].skillIds` exportés = uniquement `equippedSkillIds` ;
   - les capacités liées mais non équipées restent sous metadata éditeur ;
4. déléguer les créatures/skills au vrai `Capture Editor Exporter V1` ;
5. transporter les `CreaturePresentationBindingV1` sous `presentation.creatures` ;
6. repasser la sortie enrichie dans `normalizeCaptureCombatExportV1`.

Règles critiques :

- exactement un loadout par créature exportée ;
- chaque loadout doit cibler la même creatureId ;
- une capacité équipée doit appartenir aux skillIds liés de cette créature ;
- une capacité équipée doit exister dans les skill drafts ;
- aucune sélection automatique des quatre premières compétences ;
- aucune mutation du V1 ;
- présentation créature séparée du combat ;
- aucun champ asset dans FighterConfig / SkillDefinition.

Interdit :

- aucun CombatSession/Runtime ;
- aucune UI ;
- aucun renderer ;
- aucun storage/network ;
- aucune dépendance GenSrpG ;
- aucun `is2v2` ;
- aucun mapping par nom/élément.

Tests RED :

1. export 1v1 complet ;
2. skillIds combat = loadout actif seulement ;
3. linkedSkillIds conservés en metadata ;
4. présentation créature transportée séparément ;
5. battle setup -> teams/actors/rosters ;
6. vrai Adapter Stack consomme la sortie ;
7. loadout manquant/dupliqué/mismatch refusé ;
8. skill équipée non liée ou absente refusée ;
9. même chemin 2v2 ;
10. sentinelle d'indépendance.

Critère GREEN :

- RED isolé ;
- réutilisation du V1 prouvée ;
- vrai chemin Editor V2 -> CaptureCombatExportV1 -> Adapter Stack ;
- CI globale SUCCESS ;
- documentation ;
- checkpoint GREEN avant retour à l'UI humaine.


### Résultat — Capture Editor Exporter V2

RED :

- commit : `1533707304c88d0a2a4bccd8d03aa346b0b226a1` ;
- CI : run `36341276086` — FAILURE attendue ;
- cause isolée : `ERR_MODULE_NOT_FOUND` ;
- un seul fichier de test en échec.

Implémentation :

- `src/adapters/input/capture/capture-editor-exporter-v2.js` ;
- commit : `ae47d4d87b14d7e44f12921b410dbd58d4908502` ;
- CI : run `36341334997` — SUCCESS.

Vrai chemin validé :

`BattleSetupDraft + CreatureDraftV2 + SkillDraftV1 + ActiveSkillLoadoutV1`
-> `Capture Editor Exporter V2`
-> `Capture Editor Exporter V1`
-> `CaptureCombatExportV1`
-> `Capture Adapter Stack V1`.

Garanties :

- battle/teams/actors/rosters dérivés du Battle Setup Draft ;
- aucune branche spéciale 1v1/2v2 ;
- skillIds de combat = uniquement capacités équipées ;
- capacités liées non équipées conservées sous `metadata.editor.linkedSkillIds` ;
- une capacité équipée doit être liée et exister dans les skill drafts ;
- exactement un loadout par créature exportée ;
- présentation créature sous `presentation.creatures` ;
- présentation jamais injectée dans `combat` ;
- V1 réutilisé, non modifié ;
- sortie consommée par l'Adapter Stack autoritaire ;
- aucun Runtime/UI/renderer/storage/GenSrpG.

Aucune validation smartphone requise : exporter pur.

Checkpoint GREEN final :

`checkpoint/lab-capture-editor-exporter-v2-green-2026-09-27`.

Prochaine étape avant l'UI humaine :

- pré-audit cooldown réel ;
- ajouter le cooldown seulement si un propriétaire Runtime propre peut être identifié ;
- aucun champ UI cooldown avant le GREEN contractuel/runtime.


## Pré-audit — cooldown réel des compétences V1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-capture-editor-exporter-v2-green-2026-09-27` ;
- SHA `e8962df53e2f1cd1230877f2836d0098174ed43b`.

Checkpoint départ :

`checkpoint/lab-start-skill-cooldown-preaudit-v1-2026-09-27`.

Branche :

`work/lab-skill-cooldown-preaudit-v1-2026-09-27`.

Décision :

- configuration : `SkillDefinition.cooldownMs` ;
- état : `Combat State.fighters[*].skillCooldowns` ;
- horloge : `state.elapsedMs` déjà avancée par Combat Runtime ;
- règle : Action Resolver ;
- start accepté = cooldown démarré immédiatement ;
- interruptions / contres / clash ne rendent pas la capacité immédiatement réutilisable ;
- réactions utilisent la même mécanique ;
- aucune horloge/timer cooldown dans Runtime ou UI ;
- cooldown par défaut 0 pour compatibilité.

Document :

`docs/LAB_SKILL_COOLDOWN_PREAUDIT_V1.md`.

Prochaine étape après CI documentaire GREEN :

- micro-lot cooldown réel ;
- contrats/Core seulement ;
- RED avant implémentation ;
- aucun changement UI.


## Micro-lot — Skill Cooldown V1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-skill-cooldown-preaudit-v1-green-2026-09-27` ;
- SHA `fb349255032397ebe0b13d7f01cc3f72e4233446`.

Checkpoint de départ :

`checkpoint/lab-start-skill-cooldown-v1-2026-09-27`.

Branche :

`work/lab-skill-cooldown-v1-2026-09-27`.

Objectif :

Implémenter un vrai cooldown de compétence sans timer UI ni seconde horloge.

Propriétaires :

- configuration : `SkillDefinition.cooldownMs` ;
- état : `Combat State.fighters[*].skillCooldowns` ;
- règle start / réaction : `Action Resolver` ;
- temps : `state.elapsedMs`, déjà avancé par `Combat Runtime` ;
- persistance changement de membre : `Roster Session` transporte le snapshot, sans calculer le cooldown.

Règle V1 :

- cooldown démarre dès qu'une utilisation/reaction est acceptée ;
- refus cooldown n'engage ni énergie ni état ;
- action contrée/interrompue conserve le cooldown ;
- cooldown 0 = comportement historique ;
- autre compétence reste indépendante ;
- rappel/invocation ne réinitialise pas le cooldown.

Fichiers autorisés :

- `src/contracts/skill-definition.js` ;
- `src/core/combat/combat-state.js` ;
- `src/core/combat/action-resolver.js` ;
- `src/core/combat/roster-session.js` ;
- tests cooldown ;
- documentation.

Protégé :

- `combat-runtime.js` ne reçoit aucun état/timer cooldown ;
- aucune UI/renderer ;
- aucune donnée Capture spécifique ;
- aucune dépendance GenSrpG.

RED :

1. cooldownMs normalisé, défaut 0 ;
2. map cooldown immutable ;
3. start accepté enregistre readyAt ;
4. second start refusé sans dépense ;
5. autre skill utilisable ;
6. expiration via advanceMs ;
7. cooldown 0 historique ;
8. contre/interruption conserve cooldown ;
9. réaction soumise au même cooldown ;
10. reset efface cooldowns ;
11. roster rappel/invocation préserve cooldown ;
12. Runtime source sans owner cooldown.

Critère GREEN :

- RED isolé ;
- changements minimaux aux propriétaires existants ;
- CI globale SUCCESS ;
- tests IA / runtime existants GREEN ;
- documentation ;
- checkpoint GREEN avant retour à l'éditeur humain.


### Résultat — Skill Cooldown V1

RED :

- commit : `3ed2705d1bd5aa13ec963ec43391910689608924` ;
- CI : run `36341730287` — FAILURE attendue ;
- cause isolée : export cooldown absent dans Combat State ;
- un seul fichier de test en échec.

Implémentation :

- commit : `01ab822f50b3cf6dc2e551a36df3327dade47572` ;
- CI : run `36341823953` — SUCCESS.

Fichiers modifiés :

- `src/contracts/skill-definition.js` ;
- `src/core/combat/combat-state.js` ;
- `src/core/combat/action-resolver.js` ;
- `src/core/combat/roster-session.js`.

Garanties :

- `cooldownMs` data-driven dans SkillDefinition, défaut 0 ;
- cooldowns autoritaires dans Combat State via `skillCooldowns` ;
- échéances basées uniquement sur `state.elapsedMs` ;
- start accepté démarre le cooldown avec la dépense énergie ;
- refus cooldown ne dépense rien ;
- cooldown spécifique par capacité ;
- expiration via `advanceCombatTime()` ;
- réaction soumise au même mécanisme ;
- interruption conserve le cooldown ;
- reset nettoie naturellement l'état ;
- rappel/invocation préserve les cooldowns ;
- Combat Runtime inchangé et ne possède aucun timer/tableau cooldown ;
- tests existants Runtime/IA restent GREEN.

Aucune validation smartphone requise : lot Core/contrat sans UI.

Checkpoint GREEN final :

`checkpoint/lab-skill-cooldown-v1-green-2026-09-27`.

Prochaine étape :

- éditeur humain V2 ;
- 3 surfaces : Créature / Combat / Capacités ;
- aucun JSON visible en usage normal ;
- chaque contrôle doit écrire dans un contrat déjà GREEN ;
- preview smartphone obligatoire avant GREEN final.


## Micro-lot — profils morphologiques génériques V1 — 2026-09-27

Base GREEN :

- `checkpoint/lab-skill-cooldown-v1-green-2026-09-27` ;
- SHA `390e83f413065496802e070b9a4ae82e74146a66`.

Checkpoint départ :

`checkpoint/lab-start-generic-creature-profiles-v1-2026-09-27`.

Branche :

`work/lab-generic-creature-profiles-v1-2026-09-27`.

Objectif :

Compléter les profils réellement disponibles pour que le futur éditeur puisse proposer des choix morphologiques compréhensibles sans option factice.

Déjà existants :

- `serpentine` ;
- `drake` (ailé / dragon trapu).

Ajouts :

- `biped` ;
- `quadruped`.

Propriétaire :

- `data/profiles/*.profile.json` validés par `profile-registry.js`.

Interdit :

- aucune sélection automatique par nom de créature ;
- aucune UI dans ce lot ;
- aucun patch renderer ;
- aucun profil caché simulé par CSS ;
- aucune dépendance GenSrpG.

Critère GREEN :

- tests RED sur fichiers absents ;
- profils complets idle/attack/hit/ko + specialMoves ;
- validation par le vrai Profile Registry ;
- CI globale SUCCESS ;
- checkpoint GREEN avant UI.


### Résultat — profils morphologiques génériques V1

RED :

- commit `c9ee2e2506174c3922997d816ca5a38bccb10748` ;
- CI `36342088085` — FAILURE attendue ;
- seuls les fichiers `biped.profile.json` et `quadruped.profile.json` étaient absents.

Implémentation :

- `data/profiles/biped.profile.json` ;
- `data/profiles/quadruped.profile.json` ;
- commit `96d0bb496c3a204e6a3379193830abc4b5499e9f` ;
- CI `36342146735` — SUCCESS.

Profils disponibles pour le futur éditeur :

- Bipède ;
- Quadrupède ;
- Serpentine ;
- Drake / ailé.

Aucun profil n'est sélectionné automatiquement par nom de créature.

Checkpoint GREEN :

`checkpoint/lab-generic-creature-profiles-v1-green-2026-09-27`.

Prochaine étape :

- éditeur humain Capture V2 ;
- onglets Créature / Combat / Capacités ;
- zéro JSON à saisir ;
- sélection de vrais assets visuels depuis le catalogue global ;
- placement tactile des sockets face/dos ;
- cooldown réel éditable ;
- limites audio affichées explicitement si aucun catalogue audio autoritaire n'est disponible ;
- validation smartphone obligatoire avant GREEN final.


## Micro-lot — Capture Editor Humain V2 — 2026-09-27

Base GREEN :

- `checkpoint/lab-generic-creature-profiles-v1-green-2026-09-27` ;
- SHA `bc58f0b3d506df9e78779fe6a524838b6c03dcd0`.

Checkpoint départ :

`checkpoint/lab-start-capture-editor-human-v2-2026-09-27`.

Branche :

`work/lab-capture-editor-human-v2-2026-09-27`.

Objectif :

Remplacer la preview technique JSON par un éditeur de jeu compréhensible, sans changer les propriétaires métier.

Nouvelle page autonome :

- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- `examples/dom-demo/capture-editor-v2.js` ;
- `examples/dom-demo/capture-editor-v2.css`.

L'ancienne UI V1 reste historique et n'est pas modifiée.

### Navigation

Trois onglets :

1. Créature ;
2. Combat ;
3. Capacités.

### Créature

Contrôles :

- identité / description ;
- face / dos / icône depuis Asset Catalog ;
- morphologie : Bipède / Quadrupède / Serpentine / Drake-ailé ;
- placement tactile des sockets face/dos ;
- éléments / résistances ;
- capture / évolution ;
- quatre slots actifs de capacité ;
- sons créature uniquement si un catalogue audio réel est fourni.

### Combat

Contrôles :

- PV ;
- énergie max / initiale ;
- récupération périodique : quantité + intervalle ;
- coût déplacement ;
- modificateur de préparation ;
- nombre de créatures actives par camp déduit en Battle Setup Draft, sans `is2v2`.

Aucun second propriétaire global d'énergie.

### Capacités

Aucun JSON.

Contrôles :

- nom / catégorie / forme / élément ;
- dégâts / soin / stun ;
- énergie ;
- approche ;
- préparation ;
- trajet ;
- récupération ;
- cooldown réel ;
- distances ;
- cibles ;
- icône ;
- FX cast / projectile-travel / impact ;
- sons cast / impact seulement si catalogue audio réel disponible.

### Assets

La preview charge le vrai catalogue visuel global depuis la branche `global-assets`.

Le contrat reçoit uniquement les `assetId`.

Les URLs servent uniquement à la preview visuelle de l'éditeur.

### Limite audio explicite

Le catalogue global actuel est visuel.

Si aucun catalogue audio autoritaire n'est fourni :

- les menus audio sont visibles mais désactivés ;
- message explicite « bibliothèque audio non connectée » ;
- aucun faux assetId audio inventé.

### Export

Le bouton principal :

`Valider la configuration`

produit en mémoire :

`CreatureDraftV2 + SkillDrafts + ActiveSkillLoadout + BattleSetup`
-> `Capture Editor Exporter V2`
-> `CaptureCombatExportV1`.

Le JSON n'est pas affiché comme interface normale.

Un résumé humain affiche seulement :

- configuration valide / erreur ;
- nombre de capacités liées / équipées ;
- nombre d'acteurs ;
- profil ;
- énergie / cooldown de la capacité sélectionnée.

### Tests RED

1. module/page V2 absents ;
2. helpers humains -> vrais contrats ;
3. aucun champ JSON de capacité/presentation ;
4. quatre slots explicites ;
5. cooldown UI -> SkillDefinition réel ;
6. socket touch/click -> coordonnées 0..1 ;
7. même builder Battle Setup pour 1/2/3/4 acteurs par camp ;
8. catalogue visuel transmis par assetId ;
9. audio vide = aucun asset fictif ;
10. exporter V2 réellement appelé ;
11. aucune importation Combat Runtime/Renderer/GenSrpG/storage ;
12. dispose des listeners.

Critère technique GREEN :

- RED isolé ;
- CI globale SUCCESS ;
- preview dédiée.

Critère GREEN final :

- validation smartphone par Sylvain ;
- checkpoint final seulement après retour utilisateur.


## Résultat technique — Capture Editor Human V2 — 2026-09-27

Base du lot :

- `checkpoint/lab-start-capture-editor-human-v2-2026-09-27` ;
- SHA initial `bc58f0b3d506df9e78779fe6a524838b6c03dcd0`.

Branche :

`work/lab-capture-editor-human-v2-2026-09-27`.

### RED initial

- test : `tests/unit/capture-editor-human-v2.test.mjs` ;
- commit RED : `2e7d60af2ac92aa353f815b1267327fefb44c0a8` ;
- CI : run `36342373351` — FAILURE attendue ;
- cause isolée : module `src/ui/capture-editor-human-v2.js` absent.

### Première implémentation

Commit :

`4c6f0be41ff9462039e88f183ade5dd88a5215ea`.

Fichiers principaux :

- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- `examples/dom-demo/capture-editor-v2.css` ;
- `examples/dom-demo/capture-editor-v2.js`.

L'UI sépare :

- Créature ;
- Combat ;
- Capacités.

Elle ne présente aucun éditeur JSON comme voie normale.

### Régression contractuelle découverte n°1 — Draft créature V2

CI de l'implémentation : run `36345042678` — FAILURE.

Cause réelle :

- `CaptureCreatureEditorDraftV2` produisait `presentationId` ;
- le même normalizer refusait ce champ lors d'une renormalisation par l'Exporter V2.

Aucun contournement UI appliqué.

Correctif racine dédié :

- checkpoint GREEN : `checkpoint/lab-capture-creature-draft-v2-idempotence-fix-green-2026-09-27` ;
- SHA `7d0b49e54f115e0d3dde69d9e4901f1aedb6ab85` ;
- `presentation` reste l'unique source de vérité ;
- l'Exporter V2 dérive le `presentationId` V1 au moment de la conversion.

Report exact sur la branche UI :

`9eeb2836505488240de6472a4c1c0e304afe5306`.

### Régression contractuelle découverte n°2 — Loadout

CI après premier correctif : run `36345322311` — FAILURE.

Cause réelle :

- `CaptureActiveSkillLoadoutV1` produisait `equippedSkillIds` ;
- le normalizer refusait ensuite cette projection lors de la renormalisation par l'Exporter V2.

Aucun champ supprimé artificiellement dans l'UI.

Correctif racine dédié :

- checkpoint GREEN : `checkpoint/lab-capture-loadout-v1-idempotence-fix-green-2026-09-27` ;
- SHA `79cc686960b29c664c61325078211c113fbb4a79` ;
- les quatre `slots` restent l'unique source autoritaire ;
- helper pur `captureActiveSkillIdsV1()` pour la projection ;
- Exporter V2 utilise le helper.

Report exact sur la branche UI :

`39b595d1a45ff9bd65730438ad4f66269a4e226d`.

CI :

- run `36345675425` — SUCCESS.

### Prévalidation ergonomique — placement des sockets

Un défaut de lisibilité a été détecté avant preview :

- les surfaces tactiles de placement de socket existaient ;
- elles ne montraient pas encore les images face/dos sélectionnées.

RED :

- commit `671627fe9ff5bc0815bef9dbd4bee6db4c8f1877` ;
- CI run `36345747782` — FAILURE attendue ;
- un seul test en échec.

Correctif :

- commit `afa636b9630038cc5579c9e09b1c4c59244511e4` ;
- images face/dos synchronisées dans les surfaces socket ;
- marqueur de socket superposé sur la vraie image ;
- CI run `36345805236` — SUCCESS.

### Prévalidation cycle de vie

Dernière revue :

- les listeners des sélecteurs d'assets devaient eux aussi appartenir au `dispose()` de l'éditeur.

RED :

- commit `d5b5b1e524b0fb11355fa023ddbd3cb61ac4e9cb` ;
- CI run `36345849367` — FAILURE attendue.

Correctif :

- commit `06fc9b35e4a77e942244e3193747b5daff024323` ;
- hydration du catalogue via le propriétaire `listen()` du mount ;
- aucun listener ajouté après `dispose()` ;
- CI run `36345881501` — SUCCESS.

### État fonctionnel de la prévalidation

Créature :

- identité / niveau / description ;
- face / dos / icône depuis le catalogue logique ;
- profil morphologique ;
- placement tactile de sockets sur face/dos ;
- sons attack / hit / KO lorsqu'un catalogue audio compatible est disponible ;
- éléments / résistances / Capture ;
- stats avancées ;
- quatre slots actifs explicites.

Combat :

- PV ;
- énergie max / initiale ;
- quantité et intervalle de récupération ;
- coût de déplacement ;
- modificateur de temps de charge ;
- format actif 1v1 / 2v2 / 3v3 / 4v4 par un même chemin Battle Setup.

Capacités :

- type ;
- forme ;
- élément ;
- dégâts / soin ;
- coût énergie ;
- approche none / sol / aérien / téléportation ;
- distances ;
- cibles ;
- préparation ;
- trajet ;
- récupération ;
- cooldown réel ;
- stun / interruption ;
- clash projectile ;
- icône ;
- socket source ;
- FX cast / travel / impact ;
- audio cast / impact lorsqu'il existe dans le catalogue.

Invariants :

- aucun Combat Runtime ou Combat Session dans l'éditeur ;
- aucun renderer propriétaire de règles ;
- aucun storage ;
- aucun `captureFix*` ;
- aucune dépendance `Zombicide-40k` ;
- aucun `is2v2` ;
- aucune structure JSON technique exposée comme interface normale ;
- aucun chemin physique enregistré comme donnée métier ;
- export final par le vrai `exportCaptureEditorDraftsToCombatExportV2()`.

État :

**GREEN technique / PREVALIDATION UI seulement.**

La charte interdit le checkpoint GREEN final avant validation smartphone utilisateur.

Checkpoint de prévalidation prévu après CI documentaire :

`checkpoint/lab-capture-editor-human-v2-prevalidation-green-2026-09-27`.

Preview prévue :

`preview/lab-capture-editor-human-v2-2026-09-27`.

Test mobile demandé :

1. navigation Créature / Combat / Capacités ;
2. lisibilité portrait smartphone ;
3. changement image face/dos/icône ;
4. placement d'un socket sur face et dos ;
5. réglages énergie / format ;
6. réglages capacité et cooldown ;
7. bouton de validation ;
8. vérifier absence de débordement ou contrôle inaccessible.

Aucun GREEN final avant ce retour.


## Audit — retour utilisateur Capture Editor Round 1 — 2026-09-27

Base :

- `checkpoint/lab-capture-editor-human-v2-prevalidation-green-2026-09-27`;
- SHA `227901c1e3ed9f2472a642d54af8dca786b743bf`;
- CI preview / work / checkpoint : SUCCESS.

Checkpoint départ :

`checkpoint/lab-start-capture-editor-feedback-round1-2026-09-27`.

Branche :

`work/lab-capture-editor-feedback-round1-2026-09-27`.

Document autoritaire du retour :

`docs/LAB_CAPTURE_EDITOR_FEEDBACK_ROUND1_AUDIT.md`.

Constats :

- audio : archive privée retrouvée, aucun catalogue/assetId encore raccordé ;
- sockets : coordonnées créature déjà propriétaires, la capacité ne doit que référencer un socket existant ;
- PV : déplacer l'édition dans Créature, pas de deuxième input Combat ;
- skills : neuf définitions de laboratoire existent déjà, l'éditeur ne doit plus coder uniquement Fireball ;
- scale : VisualActor sait le rendre mais aucun contrat créature persistant ne le possède encore ;
- stats : futur CombatStatRulesV1 requis, aucune formule dans l'UI ;
- buff/debuff : pas de StatusEffect générique, ne pas vendre une fausse fonctionnalité ;
- test combat : futur bridge de démo séparé.

Ordre :

A. ownership cleanup UI ;
B. skill catalog ;
C. scale contract ;
D. private audio catalog ;
E. combat stat rules ;
F. status effect si retenu ;
G. editor -> combat preview bridge.

Aucune fonctionnalité nouvelle n'est implémentée dans ce lot d'audit.


## Micro-lot — Capture Legacy Skill Catalog V1 — 2026-09-28

Base GREEN :

- `checkpoint/lab-capture-editor-feedback-round1-audit-green-2026-09-27` ;
- SHA `32f6a129e55c4e7667214c8051875bf4a59c24c0`.

Source historique vérifiée :

- dépôt : `slyen4425-cloud/Zombicide-40k` ;
- checkpoint source : `checkpoint/gensrpg-phase7-dungeon-generated-branch-plan-green-2026-09-27` ;
- commit : `49289784ee92a47fd51089815ca25954cdba4493` ;
- `index.html` blob : `74e223b2c9877e6a88b6ad6726290d230f1f616e` ;
- fonction source : `gensCaptureExpandedAbilityRoster()` ;
- nombre d'entrées : 84.

Répartition historique vérifiée :

- Feu : 9 ;
- Eau : 9 ;
- Terre : 9 ;
- Air : 9 ;
- Électricité : 9 ;
- Lumière : 9 ;
- Ombre : 9 ;
- Poison : 9 ;
- neutre : 12.

Effets historiques :

- damage : 73 occurrences ;
- heal : 4 ;
- buff : 8 ;
- debuff : 9 ;
- dot : 1.

Décision :

- ne pas copier la fonction historique monolithique ;
- extraire les 84 définitions comme données JSON fidèles ;
- conserver les champs legacy nécessaires à la traçabilité ;
- fournir un normalizer/catalogue pur ;
- fournir un template d'édition basé uniquement sur les champs explicites legacy ;
- aucune inférence depuis le nom/description/id ;
- aucune forme/timing/cooldown inventé ;
- les entrées contenant `buff`, `debuff` ou `dot` sont classées `requires-status-effect-v1` ;
- les autres sont classées `portable-basic-effects`.

Checkpoint départ :

`checkpoint/lab-start-capture-legacy-skill-catalog-v1-2026-09-28`.

Branche :

`work/lab-capture-legacy-skill-catalog-v1-2026-09-28`.

Fichiers prévus :

- `data/capture/legacy/capture-expanded-ability-roster.v1.json` ;
- `src/catalogs/capture-legacy-ability-catalog-v1.js` ;
- `tests/unit/capture-legacy-ability-catalog-v1.test.mjs`.

RED prévu :

1. module absent ;
2. catalogue exact 84 entrées ;
3. IDs uniques ;
4. comptage éléments exact ;
5. classification 66 basic / 18 status ;
6. Étincelle et Dernier recours conservés fidèlement ;
7. aucune inférence depuis name/desc/id ;
8. aucun runtime/UI/storage/network/GenSrpG import.


### Résultat — Capture Legacy Skill Catalog V1

RED :

- test : `tests/unit/capture-legacy-ability-catalog-v1.test.mjs` ;
- commit RED : `3af91ac3d6c439b286356e099255e369e56a8235` ;
- CI run `36360661810` — FAILURE attendue ;
- cause isolée : module catalogue absent.

Implémentation :

- `src/catalogs/capture-legacy-ability-catalog-v1.js` ;
- commit initial : `cff86bff51d22275ab2002954915c7d8daffa8ad`.

La CI a ensuite détecté que la provenance contenait le nom du dépôt production dans `src/`, interdit par la sentinelle d'indépendance.

Correctif :

- commit `4d743fcf4987ef8b9f211c11338a7a5c435efa81` ;
- CI run `36361088662` — SUCCESS ;
- provenance runtime réduite à `sourceId + commit + indexBlob + functionName` ;
- provenance complète production conservée uniquement dans la documentation du chantier.

Garanties :

- 84 capacités historiques reproduites ;
- 84 IDs uniques ;
- 9 Feu / 9 Eau / 9 Terre / 9 Air / 9 Électricité / 9 Lumière / 9 Ombre / 9 Poison / 12 neutres ;
- 66 classées `portable-basic-effects` ;
- 18 classées `requires-status-effect-v1` ;
- aucune forme, approche, énergie, timing ou cooldown moderne inventé ;
- aucune inférence depuis nom/description/id ;
- aucune dépendance runtime vers GenSrpG ;
- aucun `captureFix*`.

Checkpoint GREEN :

`checkpoint/lab-capture-legacy-skill-catalog-v1-green-2026-09-28`.

Étape suivante :

- raccord UI du catalogue ;
- choix d'un template historique -> préremplissage uniquement des champs explicitement portables ;
- 4 slots alimentés par catalogue ;
- les 18 capacités status-dependent restent visibles avec état explicite, sans prétendre fonctionner complètement.


## Micro-lot — Capture Skill Catalog Editor V1 — 2026-09-28

Base GREEN :

- `checkpoint/lab-capture-legacy-skill-catalog-v1-green-2026-09-28` ;
- SHA `9d3be6444619e18ee9ab98a512c8b50bf9a5e52e`.

Checkpoint départ :

`checkpoint/lab-start-capture-skill-catalog-editor-v1-2026-09-28`.

Branche :

`work/lab-capture-skill-catalog-editor-v1-2026-09-28`.

Objectif :

Raccorder les 84 modèles historiques Capture à l'éditeur humain sans transformer des données partielles en fausses SkillDefinition complètes.

Décision UX / ownership :

- le catalogue historique est une bibliothèque de **modèles** ;
- choisir un modèle préremplit uniquement les champs explicitement connus :
  - id ;
  - nom ;
  - description ;
  - catégorie mappée depuis la catégorie legacy ;
  - élément ;
  - niveau requis ;
  - dégâts ;
  - soin ;
- le choix ne modifie jamais :
  - forme ;
  - approche ;
  - coût énergie ;
  - préparation ;
  - trajet ;
  - récupération ;
  - cooldown ;
  - FX / audio / socket ;
- l'utilisateur doit ensuite enregistrer la capacité configurée ;
- les 4 slots actifs référencent uniquement les capacités réellement configurées dans la session éditeur ;
- aucune capacité historique non complétée n'est exportée silencieusement.

Status effects :

- les 18 modèles contenant buff/debuff/dot restent consultables ;
- leurs effets legacy sont affichés ;
- ils sont marqués `StatusEffectV1 requis` ;
- ils ne peuvent pas être validés comme équivalent complet tant que le propriétaire StatusEffect n'existe pas ;
- aucune suppression/masquage de leur effet historique.

Propriétaires prévus :

- catalogue historique : `src/catalogs/capture-legacy-ability-catalog-v1.js` ;
- adaptation UI pure : `src/ui/capture-editor-skill-catalog-v1.js` ;
- orchestration DOM : `src/ui/capture-editor-human-v2.js`.

RED :

1. 84 options exposées ;
2. template basic préremplit seulement les champs connus ;
3. forme/timings/coût/présentation existants sont conservés ;
4. status template reste explicitement bloqué comme équivalence complète ;
5. aucun nom de capacité métier codé dans le HTML pour la bibliothèque ;
6. loadout ne référence que des drafts configurés ;
7. aucune dépendance runtime/storage/GenSrpG.


### Résultat — Capture Skill Catalog Editor V1

RED :

- `tests/unit/capture-editor-skill-catalog-v1.test.mjs` ;
- commit `8305f1298023006becb22a5c153a3834c159f350` ;
- CI run `36361331142` — FAILURE attendue ;
- cause isolée : adaptateur UI catalogue absent.

Implémentation :

- `src/ui/capture-editor-skill-catalog-v1.js` ;
- raccord `capture-editor-human-v2.js` ;
- surface bibliothèque dans `capture-editor-v2.html` ;
- commit fonctionnel `1341829a584d31f556fb4b3a686b384fd567abed` ;
- CI run `36361495142` — SUCCESS.

Comportement :

- 84 modèles historiques consultables ;
- un modèle ne préremplit que les champs historiques explicites ;
- forme / approche / énergie / timing / cooldown / FX ne sont jamais inventés ;
- 18 modèles status-dependent affichent explicitement `StatusEffectV1 requis` ;
- une capacité doit être enregistrée comme vraie SkillDefinition avant équipement ;
- les quatre slots actifs ne proposent que les capacités réellement configurées dans la session éditeur ;
- aucune capacité legacy partielle n'est exportée silencieusement.

Checkpoint GREEN prévu après CI documentaire :

`checkpoint/lab-capture-skill-catalog-editor-v1-green-2026-09-28`.

Suite Round 1 :

- Lot A ownership cleanup UI ;
- Lot C scale contract ;
- audio laissé de côté à la demande utilisateur.


## Micro-lot — Capture Editor Ownership Cleanup V1 — 2026-09-28

Base GREEN :

- `checkpoint/lab-capture-skill-catalog-editor-v1-green-2026-09-28` ;
- SHA `b91f1f3a9e78079adf418eaef8669ce5b067e05a`.

Checkpoint départ :

`checkpoint/lab-start-capture-editor-ownership-cleanup-v1-2026-09-28`.

Branche :

`work/lab-capture-editor-ownership-cleanup-v1-2026-09-28`.

Objectif :

Corriger les trois ambiguïtés d'ownership relevées au Round 1 sans ajouter de nouvelle règle gameplay.

Corrections :

1. PV :
   - `maxHp` / `initialHp` restent des données créature ;
   - leurs inputs quittent l'onglet Combat ;
   - un seul input DOM par valeur ;
   - aucune copie cachée.

2. Socket capacité :
   - coordonnées créées uniquement dans Créature ;
   - la capacité ne place rien ;
   - son champ devient explicitement `Point de sortie` ;
   - options dérivées des sockets réellement placés ;
   - aucun socket codé en dur dans le sélecteur capacité ;
   - aucun socket inexistant sélectionnable.

3. Buff / Debuff :
   - catégorie contractuelle conservée ;
   - création générique désactivée dans l'UI tant que StatusEffectV1 n'existe pas ;
   - les modèles historiques concernés restent visibles dans la bibliothèque avec l'état explicite `StatusEffectV1 requis`.

Interdit :

- hidden input de substitution ;
- duplication de PV ;
- tableau de sockets parallèle ;
- fallback silencieux sur `mouth`/head/etc. ;
- faux éditeur buff/debuff ;
- modification Runtime/Rules/Renderer.

RED prévu :

- un seul input PV max / initial ;
- PV situés dans le panneau Créature ;
- sélecteur capacité vide par défaut hors centre ;
- sync depuis sockets placés ;
- option Buff/Debuff explicitement disabled ;
- aucune régression export/catalogue.


### Résultat — Capture Editor Ownership Cleanup V1

RED :

- test : `tests/unit/capture-editor-ownership-cleanup-v1.test.mjs` ;
- commit `7ac0cc3280f8d71939079602bf84c6be25aeadae` ;
- CI run `36361623771` — FAILURE attendue ;
- cause isolée : helper de synchronisation socket absent.

Implémentation :

- commit `ba92b666214b4bec7d77b068407db676cbdb4913` ;
- CI run `36361702522` — SUCCESS.

Résultat :

- PV max / initiaux édités une seule fois dans l'onglet Créature ;
- aucun input caché ni copie dans Combat ;
- le sélecteur `Point de sortie de cette capacité` ne contient plus de socket métier codé en dur ;
- les options proviennent uniquement des sockets réellement placés sur la créature ;
- une référence devenue inexistante revient explicitement à `Centre par défaut` ;
- Buff/Debuff générique est affiché `StatusEffectV1 requis` et désactivé à la création ;
- les modèles historiques status-dependent restent consultables via la bibliothèque.

Aucun Runtime/Rules/Renderer modifié.

Checkpoint GREEN prévu :

`checkpoint/lab-capture-editor-ownership-cleanup-v1-green-2026-09-28`.

Étape suivante :

- Creature Scale Contract V1/V2 ;
- persistance d'une taille de présentation explicite ;
- adaptation vers `VisualActor.scale` avant d'ajouter le contrôle UI.


## Micro-lot — CreaturePresentationBindingV2 / displayScale — 2026-09-28

Base GREEN :

- `checkpoint/lab-capture-editor-ownership-cleanup-v1-green-2026-09-28` ;
- SHA `72b1055eccf12f16d9672099196e86bdab1f55b3`.

Checkpoint départ :

`checkpoint/lab-start-creature-presentation-binding-v2-2026-09-28`.

Branche :

`work/lab-creature-presentation-binding-v2-2026-09-28`.

Objectif :

Donner à la taille de créature un propriétaire persistant dans la présentation, puis l'adapter explicitement vers `VisualActor.scale`.

Contrat :

- `CreaturePresentationBindingV2` reprend les données V1 ;
- ajoute `displayScale` ;
- `displayScale` est un nombre fini strictement > 0 ;
- V1 reste inchangé ;
- un helper d'upgrade V1 -> V2 utilise explicitement `displayScale: 1`.

Adaptateur :

`src/adapters/input/capture/creature-presentation-to-visual-actor-v2.js`

- valide le binding V2 ;
- exige que le creatureId du VisualActor corresponde au subjectId ;
- impose `profile = binding.profileId` ;
- impose `scale = binding.displayScale` ;
- ne résout pas assetId en URL ;
- ne choisit pas position/facing ;
- délègue la validation finale à `normalizeVisualActor`.

Interdit :

- scale dans les stats ;
- scale dans l'UI sans persistance ;
- scale dupliqué dans FighterConfig ;
- résolution physique d'asset dans cet adaptateur ;
- mutation du Binding V1.

RED prévu :

1. V2 complet valide ;
2. displayScale requis et > 0 ;
3. V1 n'accepte toujours pas displayScale ;
4. upgrade V1 -> V2 explicite à 1 ;
5. adaptateur transmet exactement displayScale au VisualActor ;
6. mismatch subjectId / creatureId refusé ;
7. asset fourni par l'appelant, jamais dérivé du binding.


### Résultat — CreaturePresentationBindingV2 / displayScale

RED :

- test `tests/unit/creature-presentation-binding-v2.test.mjs` ;
- commit `104945568572a38229c38e13ea860a3fb6e1bc99` ;
- CI run `36361868128` — FAILURE attendue ;
- cause isolée : contrat V2 absent.

Implémentation :

- `src/contracts/creature-presentation-binding-v2.js` ;
- `src/adapters/input/capture/creature-presentation-to-visual-actor-v2.js` ;
- commit final fonctionnel `093f281cd78f1d741f902233b8b7bd21a6209d26` ;
- CI run `36361917425` — SUCCESS.

Garanties :

- V1 inchangé et continue de refuser `displayScale` ;
- V2 exige `displayScale > 0` ;
- upgrade V1 -> V2 explicite avec défaut 1 ;
- adaptateur refuse une incohérence creatureId/subjectId ;
- profile et scale viennent du binding ;
- asset, position et facing restent fournis par leurs propriétaires ;
- aucune résolution d'asset physique ;
- aucun renderer modifié.

Checkpoint GREEN prévu :

`checkpoint/lab-creature-presentation-binding-v2-green-2026-09-28`.

Étape suivante :

- CaptureCreatureEditorDraftV3 composé avec CreaturePresentationBindingV2 ;
- Exporter V3 préservant la présentation V2 dans CaptureCombatExportV1 ;
- seulement ensuite champ `Taille en combat` dans l'éditeur.


## Micro-lot — CaptureCreatureEditorDraftV3 + Exporter V3 — 2026-09-28

Base GREEN :

- `checkpoint/lab-creature-presentation-binding-v2-green-2026-09-28` ;
- SHA `710601e457d214fb7e33a3e2ddf895a3b33d2349`.

Checkpoint départ :

`checkpoint/lab-start-capture-creature-editor-draft-v3-2026-09-28`.

Branche :

`work/lab-capture-creature-editor-draft-v3-2026-09-28`.

Objectif :

Porter `CreaturePresentationBindingV2` dans le brouillon de créature et dans l'export portable sans dupliquer l'Exporter V2.

Décision :

- nouveau `CaptureCreatureEditorDraftV3` ;
- même métier créature que V2 ;
- `presentation` validée par `CreaturePresentationBindingV2` ;
- nouveau `Capture Editor Exporter V3` ;
- V3 convertit temporairement la présentation V2 en V1 uniquement pour déléguer les validations structurelles à l'Exporter V2 ;
- après cette délégation, le `CaptureCombatExportV1.presentation.creatures` final reçoit les bindings V2 complets ;
- aucune autre règle d'export n'est recopiée.

Critère :

- `displayScale` présent dans l'export final ;
- FighterConfig et gameplay restent exempts de scale ;
- output toujours accepté par `normalizeCaptureCombatExportV1` et par la stack Capture autoritaire.


### Résultat — CaptureCreatureEditorDraftV3 + Exporter V3

RED :

- test `tests/unit/capture-creature-editor-draft-v3.test.mjs` ;
- commit `3bbd07ad64014d0b6e06f50546fbbedac4ee1719` ;
- CI run `36362072310` — FAILURE attendue ;
- cause isolée : Draft V3 absent.

Implémentation :

- `src/contracts/capture-creature-editor-draft-v3.js` ;
- `src/adapters/input/capture/capture-editor-exporter-v3.js` ;
- commit `ca06cfc76e2d8e33772b24f05eedef74690157b6` ;
- CI run `36362307199` — SUCCESS.

Garanties :

- le métier créature est délégué au Draft V2 ;
- la présentation est validée en V2 ;
- l'Exporter V3 délègue la topologie/loadout/skills à l'Exporter V2 ;
- `displayScale` est conservé dans `presentation.creatures` ;
- aucun `displayScale` dans `combat` ;
- l'export reste consommable par la stack Capture autoritaire ;
- aucun Runtime/Renderer/UI modifié.

Checkpoint GREEN prévu :

`checkpoint/lab-capture-creature-editor-draft-v3-green-2026-09-28`.

Étape suivante :

- UI `Taille en combat` ;
- Human Editor passe de Draft/Exporter V2 à V3 ;
- validation mobile avant GREEN final UI.


## Micro-lot — catalogue Capture réellement utilisé V2 — 2026-09-28

Base intégrée :

- checkpoint : `checkpoint/lab-capture-creature-editor-draft-v3-green-2026-09-28` ;
- SHA : `589a1f72b7d6f7032ad0937094abcf624e2e0cd9`.

Source historique vérifiée par blob exact :

- commit source : `49289784ee92a47fd51089815ca25954cdba4493` ;
- blob `index.html` : `74e223b2c9877e6a88b6ad6726290d230f1f616e` ;
- `MC162_ABILITIES` : 173 entrées ;
- `MC162_ENTITIES` : 110 créatures ;
- 103 IDs de capacité sont réellement référencés par `abilityIds` des créatures ;
- ces 103 = 72 capacités `cap_*` élémentaires + 31 capacités `lib_*` historiques encore assignées ;
- les 12 `cap_neutral_*` du catalogue Expanded 84 ne sont assignées à aucune créature du seed courant.

Checkpoint départ :

`checkpoint/lab-start-capture-used-skill-catalog-v2-2026-09-28`.

Branche :

`work/lab-capture-used-skill-catalog-v2-2026-09-28`.

Objectif :

1. conserver le catalogue V1 de 84 comme archive de `gensCaptureExpandedAbilityRoster()` ;
2. ajouter un catalogue V2 distinct représentant exactement les 103 capacités réellement utilisées par les créatures du seed courant ;
3. faire consommer ce catalogue V2 par la bibliothèque de modèles de l'éditeur ;
4. ne supprimer ni fusionner les collisions de noms : les IDs restent l'autorité ;
5. conserver intégralement les effets legacy, y compris buff/debuff/dot/hot ;
6. ne pas inventer forme, timing, énergie, cooldown ou FX moderne.

RED :

- catalogue V2 absent ;
- 103 entrées / 103 IDs uniques ;
- exactement 72 `cap_*` + 31 `lib_*` ;
- aucun `cap_neutral_*` ;
- présence de capacités représentatives `lib_fireball`, `lib_regen`, `cap_fire_atk_1`, `cap_poison_special_1` ;
- l'éditeur expose 103 modèles ;
- provenance explicite et aucune dépendance runtime production.

Critère GREEN : CI complète verte, documentation à jour.


### Résultat — catalogue Capture réellement utilisé V2

RED :

- test : `tests/unit/capture-used-ability-catalog-v2.test.mjs` ;
- SHA RED : `30bc122078ecd103d42a09a3467d0fbf90478365` ;
- CI `36424897516` — FAILURE attendue ;
- cause isolée : module V2 absent.

Implémentation :

- module : `src/catalogs/capture-used-ability-catalog-v2.js` ;
- source de génération : archive fidèle des 173 entrées déjà auditée depuis le blob exact ;
- filtre autoritaire : 72 `cap_*` élémentaires réellement assignées + 31 `lib_*` réellement assignées ;
- aucune capacité `cap_neutral_*` non utilisée dans le seed courant ;
- 103 IDs uniques ;
- collisions de noms conservées par ID, aucune fusion silencieuse ;
- `buff / debuff / dot / hot` conservés intégralement comme effets legacy ;
- aucune forme, timing, énergie, cooldown ou présentation moderne inventée ;
- la bibliothèque de modèles de l'éditeur consomme maintenant ce catalogue V2 ;
- le catalogue V1 de 84 reste inchangé comme archive historique de `gensCaptureExpandedAbilityRoster()`.

CI finale :

- SHA : `411aa7a61c032645571ccc62bb9ebe13bf6272c8` ;
- run `36425671520` — SUCCESS.

État : **GREEN technique**.

Checkpoint final :

`checkpoint/lab-capture-used-skill-catalog-v2-green-2026-09-28`.


## Micro-lot — format actif Capture 1v1 / 2v2 V2 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-used-skill-catalog-v2-green-2026-09-28` ;
- SHA : `76e08be883f7db7d545317f665a2dd3d45867343`.

Checkpoint départ :

`checkpoint/lab-start-capture-active-format-v2-2026-09-28`.

Branche :

`work/lab-capture-active-format-v2-2026-09-28`.

Clarification autoritaire :

- combat simultané : uniquement `1v1` ou `2v2` ;
- roster / réserve : indépendant et potentiellement supérieur à deux membres ;
- aucun `3v3` / `4v4` simultané.

Objectif :

1. imposer exactement deux équipes ;
2. imposer 1 ou 2 slots actifs par équipe ;
3. imposer la symétrie des slots actifs ;
4. ne jamais limiter `roster.members` à 2 ;
5. retirer 3v3/4v4 de l'éditeur.

RED avant implémentation.


### Résultat — format actif Capture 1v1 / 2v2 V2

RED :

- test : `tests/unit/capture-battle-active-format-v2.test.mjs` ;
- SHA RED : `7a95e5e5a07a7cd58f123861993731f46d03e4be` ;
- CI `36425884911` — FAILURE attendue ;
- trois défauts ciblés : 3 actifs acceptés, troisième équipe acceptée, 3v3/4v4 visibles.

Correction :

- exactement deux équipes ;
- exactement 1 ou 2 slots actifs par équipe ;
- symétrie des slots actifs ;
- `roster.members` non limité à 2 ;
- builder humain limité à 1v1 / 2v2 ;
- UI limitée à 1v1 / 2v2.

CI :

- SHA : `90217cc8d504a2fb51de0a93ede20ee739a25566` ;
- run `36426064648` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI** pour le contrôle visible.

Checkpoint technique :

`checkpoint/lab-capture-active-format-v2-green-2026-09-28`.


## Micro-lot — consolidation bootstrap Combat Test natif — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-active-format-v2-green-2026-09-28` ;
- SHA : `b7d37e2efadbf712e798ec7f9a77d814b4d7b7ee`.

Checkpoint départ :

`checkpoint/lab-start-combat-bootstrap-consolidation-v1-2026-09-28`.

Branche :

`work/lab-combat-bootstrap-consolidation-v1-2026-09-28`.

But :

Rapatrier sur la lignée intégrée deux comportements déjà validés sur la branche parallèle Combat Test :

1. source native injectable dans `mountCoop2v2Test()` ;
2. contrôleurs IA data-driven par `BattleFormatDefinition.controllerId` + `skillIdsByActor`.

Invariants :

- aucun actorId métier codé comme autorité ;
- aucun loadout IA métier codé dans le contrôleur ;
- aucune dépendance éditeur ;
- aucune dépendance production ;
- fallback démo conservé ;
- localActorId jamais piloté par IA ;
- Combat Core inchangé.

RED : réexécuter les sentinelles source native + contrôleurs data-driven sur cette branche avant de rapatrier l'implémentation.


### Résultat — consolidation bootstrap Combat Test natif

RED :

- sentinelles : `combat-2v2-native-source-v1.test.mjs` + `combat-2v2-data-driven-controllers-v1.test.mjs` ;
- SHA RED : `305efe5993c6b1d2d1c133e52a50b2b380837ebf` ;
- CI `36426334472` — FAILURE attendue ;
- exports manquants : `loadCoop2v2CombatSource` et `buildCoop2v2AiControllerSpecs`.

Consolidation :

- `src/ui/combat-2v2-test-ui.js` repris depuis le checkpoint technique GREEN parallèle ;
- `data/combat/ai/demo-coop-2v2-skill-loadouts.json` ajouté comme donnée ;
- sentinelle `coop-2v2.test.mjs` réalignée sur l'invariant data-driven ;
- aucune modification Combat Core ;
- aucune modification éditeur ;
- source native injectable et contrôleurs par `controllerId` disponibles sur la lignée intégrée.

CI :

- SHA : `35890efb02402b797ab6c2c27f1d36ca9e8efa50` ;
- run `36426485820` — SUCCESS.

État : **GREEN technique**.

Checkpoint final :

`checkpoint/lab-combat-bootstrap-consolidation-v1-green-2026-09-28`.


## Micro-lot — preuve Capture Export -> Combat Runtime V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-combat-bootstrap-consolidation-v1-green-2026-09-28` ;
- SHA : `b52ee22c0d12ab30bb0c386fb6fc739254143115`.

Checkpoint départ :

`checkpoint/lab-start-capture-export-runtime-bridge-v1-2026-09-28`.

Branche :

`work/lab-capture-export-runtime-bridge-v1-2026-09-28`.

Objectif :

Prouver le vrai chemin sans wrapper métier supplémentaire :

`drafts éditeur -> exportCaptureEditorDraftsToCombatExportV2 -> CaptureCombatExportV1 -> adaptCaptureCombatExportStackV1 -> loadCoop2v2CombatSource(native) -> CombatSession -> CombatRuntime -> résolution`.

RED :

1. le même export passe dans l'Adapter Stack ;
2. la source native n'effectue aucun fetch ;
3. le local démarre réellement une capacité dans CombatRuntime ;
4. la résolution modifie les PV de la cible selon la SkillDefinition exportée ;
5. même chaîne pour 1v1 et 2v2 ;
6. aucun DOM/storage/global/production runtime.

Si le test passe avec le code existant, aucune couche intermédiaire n'est ajoutée.


### Résultat — preuve Capture Export -> Combat Runtime V1

Preuve réalisée sans nouvelle couche métier :

- test : `tests/integration/capture-export-runtime-bridge-v1.test.mjs` ;
- le même `CaptureCombatExportV1` passe directement dans `adaptCaptureCombatExportStackV1()` ;
- `loadCoop2v2CombatSource({ nativeCombatSource })` ne déclenche aucun fetch de fixture ;
- `CombatSession` est créé depuis les fighters adaptés ;
- `CombatRuntime.startSkill()` démarre réellement la capacité exportée ;
- la résolution applique les dégâts de la `SkillDefinition` exportée à la cible ;
- le même chemin est exercé en 1v1 et 2v2 ;
- aucun DOM éditeur, storage, global ou runtime production n'est impliqué ;
- aucune implémentation supplémentaire n'a été ajoutée : le raccord existant était suffisant.

SHA de preuve :

`2edecb7ec52f741ffb3a768118b942a2b5927f67`.

CI :

- run `36427298066` — SUCCESS.

État : **GREEN technique**.

Checkpoint final visé :

`checkpoint/lab-capture-export-runtime-bridge-v1-green-2026-09-28`.

Étape suivante :

créer un propriétaire explicite de session Editor / Combat Preview avant d'ajouter le bouton visible.


## Micro-lot — propriétaire session Capture Editor / Combat Preview V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-export-runtime-bridge-v1-green-2026-09-28` ;
- SHA : `b40cf5d39d21ea43ddf5087738855f4db3aadc1c`.

Checkpoint départ :

`checkpoint/lab-start-capture-editor-preview-session-v1-2026-09-28`.

Branche :

`work/lab-capture-editor-preview-session-v1-2026-09-28`.

Objectif :

créer un propriétaire explicite de transition entre l'éditeur humain et la preview combat, sans encore ajouter le bouton visible.

Responsabilité unique :

`CaptureEditorPreviewSessionV1` possède :

- le contrôleur d'éditeur ;
- le dernier `CaptureCombatExportV1` validé ;
- l'instance de combat preview montée ;
- la transition editor -> preview -> editor ;
- le dispose des ressources qu'elle a créées.

Chaîne autorisée :

`editor.validate() -> CaptureCombatExportV1 -> adaptCaptureCombatExportStackV1() -> mountCoop2v2Test(nativeCombatSource)`.

Interdits :

- lecture directe des champs DOM métier par la preview ;
- `window.currentCaptureExport` ;
- localStorage/sessionStorage ;
- deuxième structure métier mutable ;
- dépendance runtime à `Zombicide-40k` ;
- bouton fictif avant que ce propriétaire soit testé.

RED :

1. lancement refuse un export invalide ;
2. export valide est donné directement à l'Adapter Stack ;
3. la source native adaptée est donnée au combat mount ;
4. une seule preview active à la fois ;
5. retour preview -> editor dispose le combat ;
6. dispose final nettoie editor + combat ;
7. aucun global/storage/production runtime.

Critère GREEN technique :

- RED prouvé ;
- implémentation minimale ;
- CI complète verte ;
- aucun changement visuel dans ce lot.


### Résultat — propriétaire session Capture Editor / Combat Preview V1

RED :

- test : `tests/unit/capture-editor-preview-session-v1.test.mjs` ;
- SHA RED : `a16312260eb25914423f32acc5309d4dc5575efd` ;
- CI `36429938757` — FAILURE attendue ;
- échec unique : module de session absent.

Implémentation :

- fichier : `src/ui/capture-editor-preview-session-v1.js` ;
- `editor.validate()` reste l'unique source de l'export ;
- l'objet validé est donné directement à `adaptCaptureCombatExportStackV1()` ;
- le résultat natif est donné directement au mount de preview ;
- une seule preview est possédée à la fois ;
- relancer une preview dispose d'abord l'ancienne ;
- retour à l'éditeur dispose la preview ;
- dispose final nettoie preview + contrôleur éditeur ;
- aucun DOM métier lu par la session ;
- aucun storage/global ;
- aucun runtime production.

SHA technique :

`0d06b575929bc7a99087fe32361db76b8cef112d`.

CI :

- run `36430068487` — SUCCESS.

État : **GREEN technique**.

Checkpoint final visé :

`checkpoint/lab-capture-editor-preview-session-v1-green-2026-09-28`.

Étape suivante :

raccorder cette session à la page de démonstration avec un vrai bouton `Tester en combat` et un bouton de retour, dans un lot UI séparé nécessitant validation smartphone.


## Micro-lot — bootstrap preview format générique 1v1 / 2v2 V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-editor-preview-session-v1-green-2026-09-28` ;
- SHA : `63e3c940aa15e2243c2eea9db085e956eb59af70`.

Checkpoint départ :

`checkpoint/lab-start-combat-preview-format-generic-v1-2026-09-28`.

Branche :

`work/lab-combat-preview-format-generic-v1-2026-09-28`.

Objectif :

retirer du bootstrap combat preview les dernières hypothèses de noms d'équipes et l'obligation d'un allié.

Règles :

- exactement les formats autorisés 1v1 ou 2v2 ;
- équipe locale dérivée de `format.teamOf(format.localActorId)` ;
- équipe adverse dérivée de l'autre équipe déclarée ;
- allié local nullable en 1v1 ;
- aucune dépendance à des clés `players` / `enemies` ;
- aucun `is2v2`.

RED :

1. layout 1v1 avec équipes `local-team/enemy-team` ;
2. layout 2v2 avec les mêmes équipes ;
3. rejet de plus de deux équipes ;
4. rejet de plus de deux actifs par équipe ;
5. l'allié est nullable en 1v1 et unique en 2v2.

Aucun changement visuel attendu dans ce micro-lot.


### Résultat — bootstrap preview format générique 1v1 / 2v2 V1

RED :

- test : `tests/unit/combat-preview-format-generic-v1.test.mjs` ;
- SHA RED : `cefd811564b59b2f9172610a5ce1ea9c48f19cdf` ;
- CI `36430883616` — FAILURE attendue ;
- cause : helper de format générique absent.

Implémentation :

- `resolveCombatPreviewFormatV1(format)` dérive l'équipe locale depuis `localActorId` ;
- l'équipe adverse est l'autre équipe déclarée ;
- noms d'équipes arbitraires supportés ;
- 1v1 : allié `null` ;
- 2v2 : un allié local ;
- formats asymétriques / >2 actifs / >2 équipes refusés ;
- `mountCoop2v2Test()` n'utilise plus `format.teams.players` / `format.teams.enemies` ;
- aucun `is2v2`.

SHA technique :

`c5f2620a2d7402215e5f841ad128414bdfb45d95`.

CI :

- run `36431009245` — SUCCESS.

État : **GREEN technique**.

Checkpoint final visé :

`checkpoint/lab-combat-preview-format-generic-v1-green-2026-09-28`.


## Micro-lot — source visuelle native injectable Combat Demo V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-combat-preview-format-generic-v1-green-2026-09-28` ;
- SHA : `7e16fd312a2b58a223e276e539c2660088afe9e4`.

Checkpoint départ :

`checkpoint/lab-start-combat-demo-native-visual-source-v1-2026-09-28`.

Branche :

`work/lab-combat-demo-native-visual-source-v1-2026-09-28`.

Objectif :

permettre au Visual Controller existant `mountCombatDemo()` de recevoir des profils et métadonnées créature déjà résolus, sans recopier son moteur d'animation.

Règles :

- source injectée = profils + creatureMetas ;
- aucune lecture GenSrpG ;
- aucune logique de combat ;
- aucun nouveau renderer parallèle ;
- fallback de démo historique conservé ;
- une source injectée ne fetch pas les profils/créatures de démo.

RED :

1. source injectée évite tout fetch des fixtures visuelles ;
2. profils injectés conservés ;
3. creatureMetas injectées conservées ;
4. fallback historique reste disponible sans injection.


### Résultat — source visuelle native injectable Combat Demo V1

RED :

- test : `tests/unit/combat-demo-native-visual-source-v1.test.mjs` ;
- SHA RED : `d555ff65405b8f1e5d8cb7ae40494d9002bd9a8b` ;
- CI `36431403189` — FAILURE attendue ;
- cause : loader de source visuelle native absent.

Implémentation :

- `loadCombatDemoVisualSource()` accepte `nativeVisualSource.profiles` + `nativeVisualSource.creatureMetas` ;
- aucune fixture visuelle de démo n'est fetchée lorsqu'une source native est fournie ;
- `mountCombatDemo()` réutilise exactement le même Animation Core / Render Adapter avec la source injectée ;
- fallback historique conservé ;
- aucun renderer parallèle ajouté ;
- aucune logique gameplay ajoutée.

SHA technique :

`766f54ef00f34926e866e49769a217ce4cf7c9d2`.

CI :

- run `36431545937` — SUCCESS.

État : **GREEN technique**.

Checkpoint final visé :

`checkpoint/lab-combat-demo-native-visual-source-v1-green-2026-09-28`.


## Micro-lot — adaptateur Capture -> source visuelle native V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-combat-demo-native-visual-source-v1-green-2026-09-28` ;
- SHA : `75062b41db01565002c3f5b0b5209caffc80c83f`.

Checkpoint départ :

`checkpoint/lab-start-capture-native-visual-source-adapter-v1-2026-09-28`.

Branche :

`work/lab-capture-native-visual-source-adapter-v1-2026-09-28`.

Objectif :

adapter les présentations créature déjà présentes dans `CaptureCombatExportV1` vers la source injectée de `mountCombatDemo()`, sans second moteur visuel.

Entrées :

- `CaptureCombatExportV1` ;
- catalogue global d'assets ;
- profils Animation Core explicitement fournis.

Sortie :

- `profiles` ;
- `creatureMetas` pour les créatures réellement utilisées par les acteurs.

Invariants :

- les bindings utilisent toujours `assetId` ;
- les URLs sont résolues uniquement à la frontière Asset Input ;
- vue player = dos si disponible, sinon face ;
- vue opponent = face ;
- icône = icon si disponible, sinon face ;
- sockets front/back conservés comme anchors FX ;
- binding V1 -> scale 1 ;
- binding V2 -> `displayScale` conservé ;
- présentation absente = erreur explicite, aucun visuel inventé.

RED avant implémentation.


### Résultat — adaptateur Capture -> source visuelle native V1

RED :

- test : `tests/unit/capture-native-visual-source-adapter-v1.test.mjs` ;
- SHA RED corrigé : `a45731423c5f91cf6076719e5935f932502d6fd4` ;
- CI `36432036653` — FAILURE attendue ;
- cause : adaptateur absent.

Implémentation :

- fichier : `src/adapters/input/capture/capture-export-to-native-visual-source-v1.js` ;
- seules les créatures réellement référencées par les acteurs sont adaptées ;
- `presentationId` reste la liaison autoritaire ;
- asset face/dos/icône résolu depuis le catalogue global par `assetId` ;
- vue player utilise le dos, avec fallback face ;
- vue opponent utilise la face ;
- icône utilise l'icône, avec fallback face ;
- sockets front/back deviennent les anchors FX du renderer ;
- binding V1 garde scale 1 ;
- binding V2 conserve `displayScale` ;
- présentation, asset ou profil manquant = erreur explicite ;
- aucun visuel métier inventé.

SHA technique :

`8b226ad367b292d671ba6bb4c6a27cf9631904c6`.

CI :

- run `36432265587` — SUCCESS.

État : **GREEN technique**.

Checkpoint final visé :

`checkpoint/lab-capture-native-visual-source-adapter-v1-green-2026-09-28`.


## Micro-lot — session Preview avec sources natives gameplay + visuel V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-native-visual-source-adapter-v1-green-2026-09-28` ;
- SHA : `c0ebd248703955784277686ae360efb9a47e2e89`.

Checkpoint départ :

`checkpoint/lab-start-capture-editor-preview-native-sources-v1-2026-09-28`.

Branche :

`work/lab-capture-editor-preview-native-sources-v1-2026-09-28`.

Objectif :

faire évoluer le propriétaire de preview pour transporter **deux sources natives issues du même export validé** :

1. source gameplay via `adaptCaptureCombatExportStackV1()` ;
2. source visuelle via `adaptCaptureExportToNativeVisualSourceV1()`.

Responsabilité :

- l'éditeur reste propriétaire de la validation ;
- le même `CaptureCombatExportV1` validé est remis aux deux adaptateurs ;
- la session ne remappe aucune donnée gameplay ou présentation ;
- le mount de preview reçoit explicitement `nativeCombatSource` + `nativeVisualSource`;
- une seule preview active ;
- retour/dispose inchangés.

Interdits :

- second renderer ;
- lecture métier du DOM ;
- fallback visuel inventé ;
- storage/global ;
- dépendance runtime production.

RED :

1. le même export validé est remis aux deux adaptateurs ;
2. les deux sources natives sont remises ensemble au mount ;
3. si l'adaptation visuelle échoue, aucun combat n'est monté ;
4. relance dispose la preview précédente avant le nouveau mount ;
5. retour/dispose nettoient exactement les ressources possédées.

Aucun changement visuel utilisateur dans ce lot.

État initial : **RED à poser**.


### Résultat — session Preview avec sources natives gameplay + visuel V1

RED :

- test : `tests/unit/capture-editor-preview-session-v2.test.mjs` ;
- SHA RED : `91f5b590f3434e165f9c8c6eed6fbc3f454218ca` ;
- CI `36433129201` — FAILURE attendue ;
- cause isolée : module Session V2 absent.

Implémentation :

- fichier : `src/ui/capture-editor-preview-session-v2.js` ;
- la Session V1 reste inchangée et protégée ;
- le même `CaptureCombatExportV1` validé est remis sans copie métier à :
  - `adaptCombatExport` ;
  - `adaptVisualExport` ;
- le mount reçoit explicitement `nativeCombatSource` + `nativeVisualSource` ;
- une erreur d'adaptation visuelle empêche tout mount de combat ;
- une seule preview est possédée à la fois ;
- relance, retour et dispose conservent les invariants de nettoyage de V1 ;
- aucun DOM métier, storage, global, Combat Core ou renderer ajouté.

SHA technique :

`a3cb6d978467f2dd8051e5fd13f5f4d073e4e12a`.

CI :

- run `36433253628` — SUCCESS.

État : **GREEN technique**.

Checkpoint final visé :

`checkpoint/lab-capture-editor-preview-native-sources-v1-green-2026-09-28`.

Étape suivante :

composer le Visual Controller natif et le Combat Test natif dans un mount de preview unique, avant le lot UI qui ajoutera les boutons visibles.


## Micro-lot — mount natif unique Capture Combat Preview V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-editor-preview-native-sources-v1-green-2026-09-28` ;
- SHA : `3a9dd71fdcc3c732cb0cb42f92331e48e2e0cb4a`.

Checkpoint départ :

`checkpoint/lab-start-capture-native-preview-mount-v1-2026-09-28`.

Branche :

`work/lab-capture-native-preview-mount-v1-2026-09-28`.

Objectif :

composer sans duplication les deux propriétaires déjà GREEN :

1. `mountCombatDemo({ nativeVisualSource })` pour Animation/Renderer ;
2. `mountCoop2v2Test({ nativeCombatSource, visuals })` pour Combat Rules/Runtime/UI.

Invariants :

- le Visual Controller est monté une seule fois ;
- le Combat Test reçoit exactement ce Visual Controller ;
- les sources natives ne sont ni copiées ni remappées ;
- si le montage combat échoue, le Visual Controller déjà monté est disposé ;
- dispose final nettoie d'abord le combat puis les visuels ;
- aucun second renderer, storage, global ou dépendance production ;
- `presentationAssets` reste une dépendance optionnelle explicitement transmise, sans devenir autorité gameplay.

RED :

1. même `nativeVisualSource` vers le mount visuel ;
2. même `nativeCombatSource` vers le mount combat ;
3. même instance `visuals` remise au combat ;
4. rollback visuel si le combat échoue ;
5. dispose idempotent et ordre combat -> visuals.

Aucun changement visuel utilisateur dans ce lot.

État initial : **RED à poser**.


### Résultat — mount natif unique Capture Combat Preview V1

RED :

- test : `tests/unit/capture-combat-preview-v1.test.mjs` ;
- SHA RED : `65c5ff413451dc29e0a39e9e58139e78203b8dd4` ;
- CI `36433608464` — FAILURE attendue ;
- cause isolée : module de composition absent.

Implémentation :

- fichier : `src/ui/capture-combat-preview-v1.js` ;
- `mountCombatDemo()` reste l'unique propriétaire Animation/Renderer ;
- `mountCoop2v2Test()` reste l'unique propriétaire Combat Runtime/UI ;
- le même `nativeVisualSource` est remis au Visual Controller ;
- le même `nativeCombatSource` est remis au Combat Test ;
- le Combat Test reçoit exactement l'instance `visuals` montée ;
- rollback des visuels si le montage combat échoue ;
- dispose idempotent dans l'ordre combat -> visuals ;
- aucun second renderer, mapping métier ou dépendance production.

SHA technique :

`ca33dcd0499d91bd962e8ba5c81fb8b46d424c63`.

CI :

- run `36433703578` — SUCCESS.

État : **GREEN technique**.

Checkpoint final visé :

`checkpoint/lab-capture-native-preview-mount-v1-green-2026-09-28`.

Étape suivante :

lot UI séparé : raccorder la page Capture Editor à la Session V2 + mount natif, avec un adversaire de preview doté d'une présentation explicite, puis ajouter `Tester en combat` / `Retour à l'éditeur`.


## Micro-lot UI — bouton Tester en combat + retour éditeur V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-native-preview-mount-v1-green-2026-09-28` ;
- SHA : `13c4afc069a2f5ad8d449cf42db70ec98bac11af`.

Checkpoint départ :

`checkpoint/lab-start-capture-editor-combat-preview-ui-v1-2026-09-28`.

Branche :

`work/lab-capture-editor-combat-preview-ui-v1-2026-09-28`.

Objectif :

raccorder la page `capture-editor-v2.html` au chemin technique GREEN :

`Editor -> Session V2 -> nativeCombatSource + nativeVisualSource -> mountCaptureCombatPreviewV1()`.

UI prévue :

- bouton `Tester en combat` dans le footer éditeur ;
- vue combat dédiée dans la même page ;
- bouton `Retour à l'éditeur` ;
- nouvelle instance DOM de preview créée depuis un template à chaque lancement ;
- éditeur conservé en mémoire pendant la preview, sans storage.

Contexte visuel :

- catalogue global chargé explicitement ;
- profils Animation Core chargés explicitement ;
- adversaire de preview = Braisombre avec présentation `drake` et assetIds existants de la bibliothèque globale ;
- aucun visuel inventé / aucun fallback de production.

Invariants :

- le bouton appelle la Session V2, pas le Combat Runtime directement ;
- la page ne lit jamais les champs métier pour construire le combat ;
- retour = `session.returnToEditor()` ;
- un nouveau template DOM évite tout résidu d'une preview précédente ;
- aucun global métier, localStorage ou sessionStorage ;
- aucun changement Combat Core ;
- aucun import depuis `Zombicide-40k`.

RED :

1. boutons test/retour absents avant implémentation ;
2. page ne possède pas encore de host/template combat ;
3. composition Session V2 / adaptateur visuel / mount natif absente ;
4. adversaire de preview ne possède pas encore de présentation ;
5. sentinelle d'absence storage/global.

Critère technique :

- CI complète verte ;
- preview publiée ;
- état final **PREVALIDATION UI** jusqu'à validation smartphone utilisateur.

État initial : **RED à poser**.


### Résultat — bouton Tester en combat + retour éditeur V1

RED :

- test : `tests/unit/capture-editor-combat-preview-ui-v1.test.mjs` ;
- SHA RED : `a573631ccdf2638360bb4b3f2fe13e6dd4988cab` ;
- CI `36434591586` — FAILURE attendue ;
- deux manques ciblés : contrôles/template preview absents et composition Session V2 absente.

Implémentation :

- `capture-editor-v2.html` expose maintenant :
  - `Tester en combat` ;
  - `Retour à l'éditeur` ;
  - host + template de preview ;
  - slots DOM `local-1/local-2/opponent-1/opponent-2` compatibles 1v1/2v2 ;
- chaque lancement clone un nouveau template DOM, donc aucun bouton/cible d'une ancienne preview ne survit ;
- `capture-editor-v2.js` utilise uniquement :
  - `createCaptureEditorPreviewSessionV2` ;
  - `adaptCaptureExportToNativeVisualSourceV1` ;
  - `mountCaptureCombatPreviewV1` ;
- le même export validé reste l'autorité gameplay + présentation ;
- catalogue global et profils Animation Core sont chargés explicitement pour la preview ;
- adversaire de preview : Braisombre, présentation explicite `drake`, assetIds existants de la bibliothèque globale ;
- le format actif masque simplement les UI d'acteurs absents à partir de `battleFormat.actors`, sans `is2v2` ;
- retour = `session.returnToEditor()`, sans reconstruction de l'éditeur ni storage ;
- aucun Combat Core modifié ;
- aucun global métier / localStorage / sessionStorage / import production.

Commits principaux :

- raccord page/session : `f8ad7b44b9cd30c52583c70effec407f10f3d74b` ;
- shell/template combat : `64c33b73eebe76ccdcf89a8dac7b983b06afde69` ;
- styles preview : `d23d4a1962101dfef1a6ac05e6bb2280f40f14e5`.

CI :

- run `36435241852` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI smartphone**.

Checkpoint de prévalidation visé :

`checkpoint/lab-capture-editor-combat-preview-ui-v1-prevalidation-green-2026-09-28`.

Branche de preview visée :

`preview/lab-capture-editor-combat-preview-ui-v1-2026-09-28`.

GREEN final interdit avant validation smartphone utilisateur.


## Réparation de régression — Preview éditeur Capture V1 — 2026-09-28

Base reproduisant la régression utilisateur :

- preview : `preview/lab-capture-editor-combat-preview-ui-v1-2026-09-28` ;
- SHA : `25cab5c14b8f4e008b9843879e9b8fc487e92deb`.

Checkpoint départ :

`checkpoint/lab-start-capture-editor-preview-regression-repair-v1-2026-09-28`.

Branche :

`work/lab-capture-editor-preview-regression-repair-v1-2026-09-28`.

Régressions utilisateur confirmées et causes démontrées :

1. **audio vide**
   - le catalogue privé de 173 métadonnées n'est plus présent sur la lignée preview ;
   - l'éditeur cherche les sons dans le catalogue visuel global, qui n'en est pas propriétaire.

2. **une seule capacité active visible**
   - les 103 modèles historiques sont bien présents dans la bibliothèque ;
   - le loadout actif n'est initialisé qu'avec la capacité courante `fireball` ;
   - les 9 SkillDefinition natives précédemment validées ne sont plus hydratées dans la bibliothèque active.

3. **scale disparu**
   - la page n'expose plus `data-creature-display-scale` ;
   - le Human Editor courant utilise encore Draft/Exporter V2 au lieu du chemin V3 déjà GREEN pour `displayScale`.

4. **arène sans fond**
   - le DOM/CSS d'arène existe ;
   - la preview ne réapplique jamais le binding `presentationForArena()` utilisé par la démo 2v2.

Règle de réparation :

- aucune rustine parallèle ;
- restaurer les propriétaires déjà validés ;
- conserver le bridge Editor -> Preview actuel ;
- ne modifier ni Combat Core ni production.

RED requis avant implémentation :

- catalogue audio privé 173 présent et raccord dédié ;
- 9 capacités natives immédiatement disponibles + 103 modèles historiques conservés ;
- contrôle scale + chemin Draft/Exporter V3 ;
- binding d'arène appliqué à la preview.


### Résultat — réparation régressions Preview éditeur Capture V1

RED :

- test : `tests/unit/capture-editor-preview-regression-repair-v1.test.mjs` ;
- SHA RED : `72f930fa1489ffba8abe003256c8d5dd18aa0b14` ;
- CI `36443481322` — FAILURE attendue ;
- exactement 4 échecs :
  1. catalogue audio privé absent ;
  2. catalogue natif 9 capacités absent ;
  3. scale / chemin V3 absent ;
  4. binding d'arène absent.

Réparation à la cause :

1. **Audio**
   - restauration de `data/presentation/audio/private-audio-catalog.v1.json` ;
   - 173 métadonnées ;
   - l'éditeur recharge ce catalogue par `hydratePrivateAudioCatalog()` ;
   - les listes créature / cast / impact ne dépendent plus du catalogue visuel.

2. **Capacités**
   - restauration de `data/combat/skills/catalog.v1.json` ;
   - 9 SkillDefinition natives immédiatement configurables dans les slots actifs ;
   - les 103 modèles historiques Capture restent présents dans la bibliothèque legacy ;
   - aucune conversion destructive des capacités complexes.

3. **Scale**
   - contrôle `data-creature-display-scale` restauré ;
   - preview locale du scale restaurée ;
   - le Human Editor construit désormais un `CaptureCreatureEditorDraftV3` pour le chemin de validation ;
   - export final via `Capture Editor Exporter V3` ;
   - `displayScale` reste présentation-only.

4. **Arène**
   - la preview réutilise `demoPresentationAssets.presentationForArena()` ;
   - fond `city` restauré comme dans la démo 2v2 validée ;
   - le même `presentationAssets` est remis au mount de combat pour FX/audio de démonstration ;
   - aucun second renderer.

SHA technique réparé :

`1dc827c0f03ae9a1f97001ce2b11d74e6eb7b96f`.

CI complète :

- run `36443925354` — SUCCESS.

État :

**GREEN technique / PREVALIDATION UI smartphone**.

Aucun GREEN final UI avant validation utilisateur.


## Micro-lot — capacités Capture portables -> catalogue natif V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-editor-preview-regression-repair-v1-prevalidation-green-2026-09-28` ;
- SHA : `babc3ee9d89c2b28a25b3b8fece77054b0cff1b8`.

Checkpoint départ :

`checkpoint/lab-start-capture-portable-native-skills-v1-2026-09-28`.

Branche :

`work/lab-capture-portable-native-skills-v1-2026-09-28`.

Constat :

- 103 capacités historiques réellement utilisées ;
- 70 sont réellement équivalentes au Runtime actuel : dégâts simples vers une cible ennemie ;
- 7 autres nécessitent d'abord le support natif soin / zone / vol de vie ;
- 26 nécessitent encore `StatusEffectV1` ;
- l'éditeur n'hydrate actuellement que 9 SkillDefinition natives du laboratoire dans les slots actifs.

Objectif :

1. produire un catalogue natif dérivé des 70 capacités réellement compatibles, sans recopier leurs données ;
2. préserver ID, nom, élément, niveau, dégâts/soins et provenance historique ;
3. convertir uniquement les champs pouvant être dérivés sans ambiguïté ;
4. utiliser des timings/énergie neutres explicites lorsqu'aucune donnée historique de temps dynamique n'existe ;
5. hydrater ces 70 capacités dans les slots actifs en plus des 9 natives existantes ;
6. conserver les 33 capacités non équivalentes comme modèles historiques jusqu'aux contrats requis (7 soin/zone/vol de vie + 26 statuts).

Propriétaire :

- source historique : `CaptureUsedAbilityCatalogV2` ;
- définition runtime : `SkillDefinition` ;
- composition éditeur : `Capture Editor Human V2`.

Interdits :

- aucun copier-coller manuel de 70 objets ;
- aucune perte des 26 capacités complexes ;
- aucun changement Combat Core ;
- aucun runtime GenSrpG ;
- aucun global/storage ;
- aucune logique de migration dans le HTML.

RED :

- module natif portable absent ;
- 70 drafts runtime-ready attendus ;
- 56 `cap_*` + 14 `lib_*` ;
- uniquement des effets `damage` vers `enemy` ou cible historique implicite ;
- IDs uniques ;
- l'éditeur doit hydrater les 77 en plus des 9 natives.


### Résultat — capacités Capture portables -> catalogue natif V1

RED :

- test : `tests/unit/capture-portable-native-skill-catalog-v1.test.mjs` ;
- premier RED : `a3c2ca5af954226e09a15ce33500f267e35225d3`, CI `36445937356` — FAILURE attendue ;
- audit affiné avant implémentation : 70 capacités seulement sont réellement équivalentes au Runtime courant.

Implémentation :

- module : `src/catalogs/capture-portable-native-skill-catalog-v1.js` ;
- 70 capacités dérivées dynamiquement de `CaptureUsedAbilityCatalogV2` ;
- 56 IDs `cap_*` + 14 IDs `lib_*` ;
- uniquement des effets `damage` vers ennemi / cible implicite ennemie ;
- aucune duplication manuelle des objets historiques ;
- ID, nom, élément, niveau requis et dégâts conservés ;
- timings dynamiques absents de la source historique représentés par valeurs neutres explicites (0 ms) ;
- énergie historique conservée depuis `activeMeta.manaCost` ;
- aucune présentation FX inventée ;
- l'éditeur hydrate maintenant ces 70 drafts en plus des 9 SkillDefinition natives existantes ;
- les 33 autres capacités restent modèles historiques :
  - 7 soin / zone / vol de vie ;
  - 26 buff / debuff / DoT / HoT.

SHA technique :

`98dfc8e66e504e5cdf184843e752b1554f32879d`.

CI :

- run `36446398346` — SUCCESS.

État : **GREEN technique**.

Checkpoint final :

`checkpoint/lab-capture-portable-native-skills-v1-green-2026-09-28`.


## Micro-lot UI — classification audio par rôle dans l'éditeur Capture V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-portable-native-skills-v1-green-2026-09-28` ;
- SHA : `165fe02781a7fd3ff58b267f904f7b6c6efabfd1`.

Checkpoint départ :

`checkpoint/lab-start-capture-audio-role-taxonomy-ui-v1-2026-09-28`.

Branche :

`work/lab-capture-audio-role-taxonomy-ui-v1-2026-09-28`.

Source autoritaire existante :

- catalogue : `data/presentation/audio/private-audio-catalog.v1.json` ;
- 173 métadonnées ;
- dépôt source privé : `slyen4425-cloud/GenSrpG_audio_prive` ;
- ref : `work/audio-catalog-classification-2026-09-26` ;
- révision : `01ffe9c8c6ec73d974f572f7e648461a48470e8a` ;
- rôles déjà validés : voice, impact, release, movement, cast, travel, death, ui, heal, equip, loot, item, other, preparation.

Cause de la régression UX :

- l'éditeur filtre bien par `roles`, mais regroupe visuellement les options par `category` (dossier source : academie, inferno, etc.) ;
- la taxonomie métier issue de l'audit audio n'est donc pas visible dans les sélecteurs.

Objectif :

1. conserver le catalogue existant inchangé comme source de vérité ;
2. construire un modèle d'options UI groupé par rôle métier ;
3. respecter l'ordre des rôles accepté par chaque sélecteur ;
4. afficher la catégorie/source comme information secondaire dans le libellé, pas comme groupe principal ;
5. ne jamais recopier ni reclasser les 173 entrées.

Propriétaires :

- classification : catalogue audio privé ;
- présentation des groupes : UI model dédié ;
- DOM : Human Editor.

Interdits :

- aucune nouvelle classification heuristique ;
- aucun renommage d'assetId ;
- aucune URL privée ;
- aucun binaire audio dans le labo ;
- aucun global/storage ;
- aucun changement Combat Core.

RED :

- modèle UI de groupes par rôle absent ;
- un sélecteur attaque `release,voice` doit produire les groupes métier dans cet ordre ;
- impact / death / cast / preparation doivent rester distingués ;
- l'éditeur doit utiliser ce modèle au lieu du regroupement par dossier source.

Critère final :

- CI complète verte ;
- preview publiée ;
- **PREVALIDATION UI smartphone** jusqu'au retour utilisateur.


### Résultat — classification audio par rôle dans l'éditeur Capture V1

RED :

- test : `tests/unit/capture-audio-role-taxonomy-ui-v1.test.mjs` ;
- SHA RED : `444e30760bc1ee7f6897eb0a9ed7dc7d67e3d0e0` ;
- CI `36446726893` — FAILURE attendue ;
- cause : modèle de regroupement métier absent.

Implémentation :

- module UI : `src/ui/private-audio-role-groups-v1.js` ;
- aucune modification du catalogue audio de 173 entrées ;
- les rôles existants restent l'unique classification autoritaire ;
- un sélecteur utilise l'ordre de `data-audio-roles` comme ordre d'affichage ;
- un son multi-rôle est affecté au premier rôle accepté, sans duplication dans le même sélecteur ;
- les groupes visibles sont des rôles métier (`Attaque / déclenchement`, `Voix créature`, `Impact / coup`, `KO / mort`, etc.) ;
- la catégorie source (academie, inferno, xel...) reste visible dans le libellé d'option comme information secondaire ;
- aucune nouvelle heuristique de classement.

SHA technique :

`0e6c58c6ed0c29a949c6ced3f979e346581b8f12`.

CI :

- run `36446830849` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI smartphone**.

Checkpoint de prévalidation :

`checkpoint/lab-capture-audio-role-taxonomy-ui-v1-prevalidation-green-2026-09-28`.

Preview :

`preview/lab-capture-audio-role-taxonomy-ui-v1-2026-09-28`.


## Micro-lot — présentation native de capacité + couche projectile V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-audio-role-taxonomy-ui-v1-prevalidation-green-2026-09-28` ;
- SHA : `4e98b0e6c8a0f715b5353d1eb43358bc65c11aa2`.

Checkpoint départ :

`checkpoint/lab-start-capture-skill-presentation-layer-v1-2026-09-28`.

Branche :

`work/lab-capture-skill-presentation-layer-v1-2026-09-28`.

Cause démontrée :

- `SkillPresentationBindingV1` possède déjà `visual.<slot>.layer = front|behind` ;
- l'Adapter Stack exporte déjà `skillPresentations` ;
- la preview Capture continue pourtant à utiliser `demoPresentationAssets.presentationForSkill()` comme binding de capacité ;
- le renderer respecte `castLayer`, mais pas encore la couche du projectile `travel`.

Objectif :

1. faire de `skillPresentations` exporté la source de vérité des FX de capacité dans la preview Capture ;
2. créer un adaptateur renderer qui résout les assetIds du binding sans recréer un catalogue métier ;
3. propager `visual.travel.layer` comme couche du projectile ;
4. faire respecter cette couche par `dom-skill-fx` avec la classe existante `skill-fx--layer-behind` ;
5. exposer dans l'éditeur le choix `Devant / Derrière les créatures` pour le projectile ;
6. conserver `front` comme défaut du contrat.

Propriétaires :

- choix de couche : `SkillPresentationBindingV1` ;
- résolution asset -> objet renderer : adaptateur renderer dédié ;
- application DOM de la couche : `dom-skill-fx` ;
- contrôle utilisateur : Human Editor.

Interdits :

- aucun second champ de profondeur concurrent ;
- aucun z-index spécifique à fireball ;
- aucun test sur le nom de capacité ;
- aucun renderer parallèle ;
- aucun global/storage ;
- aucun changement Combat Core ;
- aucune dépendance runtime à GenSrpG.

RED :

- adaptateur de présentation native absent ;
- projectile `behind` non appliqué par le renderer ;
- contrôle éditeur de couche travel absent ;
- preview encore branchée sur les bindings de capacité de démonstration.

Critère final :

- CI complète verte ;
- preview publiée ;
- **PREVALIDATION UI smartphone**.


### Résultat — présentation native de capacité + couche projectile V1

RED :

- test : `tests/unit/capture-skill-presentation-layer-v1.test.mjs` ;
- SHA RED : `8dedd8ebefa53013fe179fc023fa45ca9a717698` ;
- CI `36452221572` — FAILURE attendue ;
- défauts couverts : couche travel non conservée par l'éditeur, projectile non rendu derrière, contrôle UI absent, adaptateur renderer natif absent.

Implémentation :

- nouvel adaptateur : `src/adapters/renderer/capture-skill-presentation-assets-v1.js` ;
- il consomme directement les `skillPresentations` déjà produits par l'Adapter Stack ;
- aucun nouveau catalogue métier : les assetIds sont résolus par une fonction injectée ;
- `visual.travel.layer` devient `travelLayer` côté renderer ;
- `dom-skill-fx` applique la classe existante `skill-fx--layer-behind` au projectile lorsque demandé ;
- `buildHumanSkillDraftV1()` conserve désormais la couche du projectile ;
- l'éditeur expose `Devant les créatures / Derrière les créatures` au niveau de la capacité ;
- la preview Capture préfère la présentation exportée de la capacité au binding de démonstration ;
- le binding de démonstration reste uniquement un fallback lorsqu'une capacité n'a aucune présentation exportée ;
- aucun z-index spécifique à Fireball, aucun test sur le nom de capacité, aucun changement Combat Core.

SHA technique final :

`b458e54c6064f9796a6cb04845b252a5818359fa`.

CI :

- run `36452475880` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI smartphone**.

La lignée inclut également les deux lots précédents validés :

- 70 capacités Capture portables + 9 capacités natives du laboratoire ;
- classification audio par rôle métier depuis le catalogue privé de 173 métadonnées.

Checkpoint de prévalidation :

`checkpoint/lab-capture-skill-presentation-layer-v1-prevalidation-green-2026-09-28`.

Preview :

`preview/lab-capture-skill-presentation-layer-v1-2026-09-28`.

GREEN UI final interdit avant validation smartphone utilisateur.


## Micro-lot — UX capacité + 1v1 + projectile Fireball V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-skill-presentation-layer-v1-prevalidation-green-2026-09-28` ;
- SHA : `9fb52c5449e265a0b8cefcce66b32388ac39a7b3`.

Checkpoint départ :

`checkpoint/lab-start-capture-editor-skill-ux-preview-repair-v1-2026-09-28`.

Branche :

`work/lab-capture-editor-skill-ux-preview-repair-v1-2026-09-28`.

Retours utilisateur reproduits :

1. la commande `Enregistrer cette capacité` masque le fait qu'un ID existant est modifié alors qu'un ID nouveau crée ;
2. en 1v1, les cartes UI des acteurs `local-2/opponent-2` restent visibles car `.squad-card { display:grid }` neutralise visuellement l'attribut `hidden` ;
3. Boule de feu pointe par défaut vers `pack:capture:sprite-projectile-fire-01`, asset à `resource.manifest`, alors que le résolveur preview courant ne résout que `resource.file` ;
4. la profondeur joueur/ennemi est volontairement exclue de ce lot : elle fera l'objet d'un contrat versionné séparé.

Objectif :

- rendre explicites les actions `Créer une nouvelle capacité` et `Mettre à jour la capacité sélectionnée` ;
- interdire la modification silencieuse d'un ID existant depuis l'action Créer ;
- masquer réellement toute UI d'acteur absent en 1v1 ;
- donner à Boule de feu son asset projectile Fireball direct déjà présent dans la bibliothèque globale ;
- ne modifier ni Combat Core ni le contrat de profondeur V1.

Fichiers autorisés :

- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- `examples/dom-demo/capture-editor-v2.css` ;
- tests dédiés ;
- documentation.

RED :

1. deux actions création / mise à jour explicitement distinctes absentes ;
2. création avec ID déjà configuré doit être refusée ;
3. `.squad-card[hidden]` doit rester masqué ;
4. Fireball doit utiliser `pack:capture:sprite-fireball-travel-01` comme projectile initial.

Critère final :

- RED prouvé ;
- correction à la cause ;
- CI complète verte ;
- preview publiée ;
- PREVALIDATION UI smartphone.


### Résultat — UX capacité + 1v1 + projectile Fireball V1

RED :

- test : `tests/unit/capture-editor-skill-ux-preview-repair-v1.test.mjs` ;
- SHA RED : `307207fac7e0d9e6a3666ced57eb9183d5fcce93` ;
- CI `36454069810` — FAILURE attendue ;
- quatre défauts ciblés : création/mise à jour ambiguë, UI 2v2 visible en 1v1, projectile Fireball direct absent, propriétaire d'action explicite absent.

Correction :

- nouveau propriétaire UI pur : `src/ui/capture-editor-skill-save-mode-v1.js` ;
- `Créer comme nouvelle capacité` refuse désormais un ID déjà configuré ;
- `Mettre à jour cet identifiant` refuse un ID inexistant ;
- le modèle historique ne sauvegarde rien implicitement ;
- `.capture-preview-shell [data-preview-actor-ui][hidden]` reste réellement masqué, y compris pour les `.squad-card` de la démo ;
- le projectile initial de Boule de feu référence `pack:capture:sprite-fireball-travel-01`, asset direct déjà présent dans la bibliothèque globale ;
- aucune modification Combat Core ;
- aucune évolution de `SkillPresentationBindingV1` dans ce lot.

Une sentinelle historique exigeait encore l'ancien bouton ambigu `data-skill-save`. Elle a été réalignée sur les deux invariants explicites `data-skill-create` + `data-skill-update`, sans retirer les autres assertions du catalogue.

SHA technique final :

`20e4f3c8e61a4705f29fc659fcb52732517a3169`.

CI :

- run `36454635053` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI smartphone**.

Checkpoint de prévalidation visé :

`checkpoint/lab-capture-editor-skill-ux-preview-repair-v1-prevalidation-green-2026-09-28`.

Preview visée :

`preview/lab-capture-editor-skill-ux-preview-repair-v1-2026-09-28`.

Étape suivante :

faire évoluer la présentation de capacité dans un contrat versionné pour porter des couches distinctes par vue `player/opponent`, sans règle cachée dans le renderer.


## Micro-lot — SkillPresentation profondeur par vue V2 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-capture-editor-skill-ux-preview-repair-v1-prevalidation-green-2026-09-28` ;
- SHA : `c24b2fc55025b8804bb7f6cb21b32d92050a7fdd`.

Checkpoint départ :

`checkpoint/lab-start-skill-presentation-view-layer-v2-2026-09-28`.

Branche :

`work/lab-skill-presentation-view-layer-v2-2026-09-28`.

Constat :

`SkillPresentationBindingV1` ne possède qu'un `layer` global par slot visuel. Il ne peut donc pas représenter proprement une profondeur différente selon que la capacité est jouée depuis la vue joueur ou la vue ennemie.

Objectif :

1. ajouter un `SkillPresentationBindingV2` versionné ;
2. pour les slots `cast` et `travel`, porter explicitement `layerByView.player` et `layerByView.opponent` ;
3. préserver la lecture des bindings V1 ;
4. faire résoudre la vue sémantique depuis l'appartenance d'équipe du `BattleFormatDefinition`, jamais depuis un actorId codé en dur ;
5. exposer dans l'éditeur quatre réglages distincts :
   - charge vue joueur ;
   - charge vue ennemi ;
   - projectile vue joueur ;
   - projectile vue ennemi ;
6. aucune inversion implicite dans le renderer : les deux valeurs sont des données explicites.

Frontières :

- `SkillPresentationBindingV1` reste inchangé ;
- Combat Core inchangé ;
- aucune règle spéciale Fireball dans le renderer ;
- aucun actorId `local-1/opponent-1` utilisé comme autorité de vue ;
- aucun storage/global.

RED :

- contrat V2 absent ;
- adaptateur de présentation V2 absent ;
- V1 doit rester compatible ;
- joueur/ennemi doivent produire deux couches différentes pour un même skill ;
- l'éditeur doit exporter les quatre réglages ;
- le combat preview doit dériver `player/opponent` depuis les équipes.

Critère final :

- RED prouvé ;
- CI complète verte ;
- preview publiée ;
- PREVALIDATION UI smartphone.


### Résultat — SkillPresentation profondeur par vue V2

RED :

- test : `tests/unit/skill-presentation-view-layer-v2.test.mjs` ;
- SHA RED : `f12810169759f6207cb66a6d0ca97d7c9d4d4cb1` ;
- CI `36455199494` — FAILURE attendue ;
- 471 sentinelles historiques vertes ; échec isolé sur l'absence de la vue sémantique V2.

Implémentation :

- nouveau contrat `SkillPresentationBindingV2` ;
- `cast` et `travel` portent `layerByView.player` + `layerByView.opponent` ;
- dispatcher de bindings V1/V2 ajouté, V1 reste accepté sans modification ;
- `CaptureSkillEditorDraftV1` accepte le binding de présentation indépendamment versionné V1/V2 ;
- l'adaptateur Capture de présentation accepte V1/V2 ;
- nouvel adaptateur renderer `createCaptureSkillPresentationAssetsV2()` :
  - V1 conserve son `layer` historique ;
  - V2 résout la couche depuis la vue sémantique ;
- `resolveCombatPresentationViewV1()` dérive `player/opponent` depuis l'équipe du `localActorId` et l'équipe de l'acteur source ;
- aucun actorId codé en dur ne décide de la profondeur ;
- l'éditeur exporte quatre réglages distincts :
  - charge vue joueur ;
  - charge vue ennemi ;
  - projectile vue joueur ;
  - projectile vue ennemi ;
- aucun retournement implicite dans le renderer ;
- le Combat Core reste inchangé.

Deux sentinelles V1 d'UI exigeaient encore l'ancien champ unique. Elles ont été réalignées sur le contrat V2 tout en conservant les tests de compatibilité du renderer et de l'adaptateur V1.

SHA technique final :

`05460e7e6d1aa3d4dfb85005a74f1c34f404b791`.

CI :

- run `36455740918` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI smartphone**.

Checkpoint visé :

`checkpoint/lab-skill-presentation-view-layer-v2-prevalidation-green-2026-09-28`.

Preview visée :

`preview/lab-skill-presentation-view-layer-v2-2026-09-28`.


## Micro-lot — livraison audio privée vers preview runtime V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-skill-presentation-view-layer-v2-prevalidation-green-2026-09-28` ;
- SHA : `ac4e7b79d38dd32f6c826be50dacfe44f1ceaac3`.

Checkpoint départ :

`checkpoint/lab-start-private-audio-preview-runtime-v1-2026-09-28`.

Branche :

`work/lab-private-audio-preview-runtime-v1-2026-09-28`.

Retour utilisateur reproduit :

- un son choisi dans l'éditeur pour une capacité est bien exporté comme `assetId`, mais la preview ne sait résoudre que les sons de démonstration ;
- le catalogue privé expose 173 métadonnées, alors que le laboratoire public ne possède que trois binaires de test explicitement préparés ;
- publier les 173 binaires ou des URLs privées est interdit.

Objectif :

1. créer un registre Asset Input de preview pour les trois binaires de test déjà présents dans `assets/runtime/audio-test/` ;
2. indexer ce registre avec les mêmes `assetId` stables du catalogue privé ;
3. faire résoudre ces IDs par la preview avant le fallback audio de démonstration ;
4. ne jamais exposer sourcePath privé, URL GitHub privée, token ou binaire supplémentaire ;
5. rendre explicite qu'un asset non livré retourne `null`.

Mappings autorisés depuis le pack privé de test déjà audité :

- `gensrpg:sound:effect-135ee2ed` -> `fire_cast.mp3` ;
- `gensrpg:sound:effect-df32b429` -> `melee_impact.mp3` ;
- `gensrpg:sound:effect-0221d6ed` -> `teleport.mp3`.

Propriétaires :

- classification et IDs : catalogue privé ;
- livraison preview : Asset Input dédié ;
- lecture : `dom-combat-audio` inchangé ;
- binding capacité : `SkillPresentationBindingV2` inchangé.

Interdits :

- aucune publication des 173 binaires ;
- aucun accès runtime au dépôt privé ;
- aucun token ;
- aucun changement Combat Core ;
- aucun global/storage ;
- aucun mapping par nom de capacité.

RED :

1. module de livraison preview absent ;
2. les trois IDs test doivent produire des URLs locales ;
3. un autre ID privé doit produire `null` ;
4. la page Capture doit utiliser ce resolver pour `audioAssetForId`.

Critère final :

- RED prouvé ;
- CI complète verte ;
- preview publiée ;
- PREVALIDATION audio smartphone.
