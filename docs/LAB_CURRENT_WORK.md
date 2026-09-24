# Laboratoire Combat Dynamique — Current Work

Ce fichier est le point de reprise opérationnel du laboratoire.

## État global

Date : 2026-09-24

Phase active : Phase 2B/V2 — Timing temps réel, énergie à ticks et UI combat persistante.

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

## Dernier checkpoint GREEN

`checkpoint/lab-mono-image-animation-core-green-2026-09-24`

## Règle de reprise

Ne jamais reprendre uniquement depuis un résumé de conversation.

GitHub + ce fichier + les checkpoints sont la source de vérité.
