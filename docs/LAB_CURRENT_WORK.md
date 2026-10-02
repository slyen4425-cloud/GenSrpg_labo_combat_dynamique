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


### Résultat — livraison audio privée vers preview runtime V1

RED :

- test : `tests/unit/private-audio-preview-runtime-v1.test.mjs` ;
- SHA RED : `590bc54c29c9d52a2aa38a6587f6f7aaa40c4654` ;
- CI `36459316812` — FAILURE attendue ;
- cause isolée : resolver Asset Input absent.

Correction :

- module : `src/assets/private-audio-preview-assets-v1.js` ;
- trois IDs privés autorisés sont reliés aux trois binaires de test déjà présents dans le laboratoire ;
- aucun sourcePath privé, URL privée, token ou binaire supplémentaire n'est exposé ;
- un assetId privé non livré retourne explicitement `null` ;
- la preview Capture résout d'abord ce registre puis conserve le fallback audio de démonstration ;
- `dom-combat-audio`, SkillPresentation et Combat Core restent inchangés.

SHA technique :

`53176449a3b430c640907b20ce1605f4c4f23aa8`.

CI :

- run `36459445176` — SUCCESS.

État : **GREEN technique / PREVALIDATION audio smartphone**.

Checkpoint de prévalidation visé :

`checkpoint/lab-private-audio-preview-runtime-v1-prevalidation-green-2026-09-28`.

Preview visée :

`preview/lab-private-audio-preview-runtime-v1-2026-09-28`.


## Micro-lot UI — scale FX Cast / Projectile / Impact V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-private-audio-preview-runtime-v1-prevalidation-green-2026-09-28` ;
- SHA : `ba0d38c038eae92a00bcc6604a01d7ec93b166d5`.

Checkpoint départ :

`checkpoint/lab-start-skill-fx-scale-controls-v1-2026-09-28`.

Branche :

`work/lab-skill-fx-scale-controls-v1-2026-09-28`.

Retour utilisateur :

- les FX de Boule de feu sont trop petits ;
- l'utilisateur veut un réglage séparé pour Cast, Projectile et Impact.

Diagnostic :

- `SkillPresentationBindingV2` possède déjà `visual.<slot>.displayScale` via le contrat V1 compatible ;
- `dom-skill-fx` applique déjà ce scale aux trois familles ;
- le Human Editor force actuellement `displayScale: 1` pour tous les slots.

Objectif :

1. rendre `visualSlot()` pilotable par `displayScale` ;
2. exposer trois contrôles séparés Cast / Projectile / Impact ;
3. conserver la plage contractuelle 0.25..4 du renderer ;
4. initialiser la Boule de feu avec des valeurs de preview plus lisibles, sans règle spéciale dans le renderer ;
5. ne toucher ni au Combat Core ni aux timings.

Propriétaires :

- valeur : Skill Presentation ;
- saisie : Human Editor ;
- rendu : renderer existant inchangé.

RED :

- les trois scales ne sont pas exportés depuis l'éditeur ;
- les trois contrôles UI sont absents ;
- Fireball reste à scale 1 pour ses trois FX.

Critère final :

- RED prouvé ;
- CI complète verte ;
- preview publiée ;
- PREVALIDATION UI smartphone.


### Résultat — scale FX Cast / Projectile / Impact V1

RED :

- test : `tests/unit/skill-fx-scale-controls-v1.test.mjs` ;
- SHA RED : `40c174db732515d5b3b4654c71e4a6ffb6f0af8c` ;
- CI `36459847451` — FAILURE attendue.

Correction :

- `visualSlot()` accepte désormais un `displayScale` explicite ;
- validation 0.25..4 ;
- l'éditeur expose :
  - `data-skill-cast-scale` ;
  - `data-skill-travel-scale` ;
  - `data-skill-impact-scale` ;
- ces trois valeurs sont exportées dans `SkillPresentationBindingV2` ;
- le renderer existant applique déjà ces valeurs, donc aucun changement Render Adapter / Combat Core ;
- valeurs initiales Fireball de preview :
  - cast 1.60 ;
  - projectile 1.90 ;
  - impact 1.70.

SHA technique :

`fb4e35eb2d7c07e7fe4a56699a1899765f85696b`.

CI :

- run `36459975160` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI smartphone**.

Checkpoint de prévalidation visé :

`checkpoint/lab-skill-fx-scale-controls-v1-prevalidation-green-2026-09-28`.

Preview visée :

`preview/lab-skill-fx-scale-controls-v1-2026-09-28`.


## Micro-lot — variété déterministe des capacités IA V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-skill-fx-scale-controls-v1-prevalidation-green-2026-09-28` ;
- SHA : `855597c9c4a40b04aa6a05b20a0dd5313fe909d4`.

Checkpoint départ :

`checkpoint/lab-start-combat-ai-skill-variety-v1-2026-09-28`.

Branche :

`work/lab-combat-ai-skill-variety-v1-2026-09-28`.

Retour utilisateur :

- l'IA semble spammer la même capacité.

Causes démontrées :

1. la preview Capture ne donne à Braisombre qu'une seule capacité `enemy-hit` ;
2. le contrôleur `BattleActorAiController` ne teste que la prochaine capacité de sa rotation ; si elle est temporairement indisponible, il ne cherche pas une autre capacité utilisable.

Objectif :

1. garder une politique déterministe, sans random implicite ;
2. à chaque tour, parcourir la rotation à partir de l'index courant et choisir la première capacité réellement utilisable ;
3. après un succès, reprendre la rotation après la capacité réellement choisie ;
4. si aucune capacité n'est utilisable, conserver un statut `saving` lorsque l'énergie est le blocage pertinent, sinon `waiting` ;
5. donner à l'adversaire de preview au moins trois capacités de test distinctes afin que la variété soit observable ;
6. ne changer ni les dégâts Core, ni cooldown, ni vitesse.

Propriétaires :

- choix IA : `BattleActorAiController` ;
- disponibilité : `CombatSession.previewSkill()` ;
- cooldown : Combat State / Action Resolver déjà existants ;
- loadout de preview : données de démonstration uniquement.

Interdits :

- aucun Math.random ;
- aucun cooldown UI ;
- aucune règle par nom de capacité ;
- aucun second contrôleur ;
- aucun global/storage.

RED :

1. avec A indisponible et B disponible, l'IA doit choisir B ;
2. avec trois capacités disponibles, trois succès consécutifs doivent suivre la rotation ;
3. la preview adverse doit exposer au moins trois IDs distincts.

Critère final :

- RED prouvé ;
- CI complète verte ;
- aucun changement visuel structurel attendu.


### Résultat — variété déterministe des capacités IA V1

RED :

- test : `tests/unit/combat-ai-skill-variety-v1.test.mjs` ;
- SHA RED : `61c645bd73a84d40c78b491df844472fb6d1d0b8` ;
- CI `36460506674` — FAILURE attendue.

Première correction :

- le contrôleur parcourait les capacités suivantes lorsqu'une capacité n'était pas utilisable ;
- la CI a protégé une règle métier antérieure : lorsqu'une technique planifiée est seulement trop chère en énergie, l'IA doit économiser au lieu de prendre une attaque moins chère.

Correction finale :

- une capacité bloquée par cooldown / indisponibilité temporaire peut être sautée au profit de la suivante ;
- `insufficient_energy` conserve immédiatement le comportement `saving` existant ;
- après une capacité réellement lancée, la rotation reprend après celle-ci ;
- aucune randomisation ;
- la preview Braisombre dispose maintenant de trois compétences de démonstration :
  - `enemy-hit` ;
  - `enemy-burst` ;
  - `enemy-heavy-hit` ;
- coûts, timings et cooldowns différents rendent la rotation observable ;
- aucun changement du système de cooldown, des dégâts Core ou du Runtime.

SHA technique final :

`86211324422bd6c7a7ebbaf9b13e7e3dc29432f0`.

CI :

- run `36460899651` — SUCCESS.

État : **GREEN technique**.

Checkpoint final visé :

`checkpoint/lab-combat-ai-skill-variety-v1-green-2026-09-28`.


## Micro-lot — vitesse globale des compétences V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-combat-ai-skill-variety-v1-green-2026-09-28` ;
- SHA : `5df3ac1583207ca24ef5a30a6a2b5d85bea807ea`.

Checkpoint départ :

`checkpoint/lab-start-combat-global-skill-speed-v1-2026-09-28`.

Branche :

`work/lab-combat-global-skill-speed-v1-2026-09-28`.

Retour utilisateur :

- ajouter un réglage global de vitesse du combat / vitesse des attaques ;
- conserver ensuite la personnalisation propre à chaque capacité.

Décision d'architecture :

- le réglage global agit sur les timings effectifs des compétences, jamais sur les dégâts ;
- les valeurs `preparationMs`, `travelMs`, `recoveryMs` et `cooldownMs` restent les données propres de chaque `SkillDefinition` ;
- le multiplicateur global ajuste les timings d'exécution de préparation / trajet / réaction, sans réécrire la SkillDefinition ;
- recharge d'énergie et cooldown restent sur l'horloge Combat State existante et ne sont pas accélérés silencieusement ;
- aucun timing CSS / UI ne devient autoritaire.

Propriétaires :

- normalisation du multiplicateur et calcul pur : `combat-timing.js` ;
- réglage courant du combat : `CombatSession` ;
- Action Resolver consomme le multiplicateur transmis par la session ;
- UI viendra dans un lot séparé après GREEN Core.

Fichiers autorisés :

- `src/core/combat/combat-timing.js` ;
- `src/core/combat/action-resolver.js` ;
- `src/core/combat/combat-session.js` ;
- tests dédiés ;
- documentation.

Protégé :

- `SkillDefinition` inchangé ;
- Combat Runtime inchangé dans ce lot ;
- Animation / Renderer inchangés ;
- aucune UI dans ce lot ;
- aucun global/storage ;
- aucune dépendance GenSrpG.

RED :

1. multiplicateur 1 conserve exactement les timings historiques ;
2. multiplicateur 2 divise par deux préparation + trajet + réaction ;
3. multiplicateur 0.5 double ces timings ;
4. valeurs non finies / <= 0 refusées ;
5. les SkillDefinition originales restent inchangées ;
6. cooldown et recharge d'énergie ne sont pas accélérés implicitement.

Critère GREEN :

- RED prouvé ;
- implémentation minimale dans les propriétaires déclarés ;
- sentinelles complètes vertes ;
- documentation synchronisée ;
- checkpoint GREEN technique.


### Résultat — vitesse globale des compétences V1

RED :

- test : `tests/unit/combat-global-skill-speed-v1.test.mjs` ;
- SHA RED : `c857734707eb736cce35073b78145736e05fd21e` ;
- CI `36462428767` — FAILURE attendue ;
- 483 sentinelles historiques vertes, échec isolé : export `effectiveSkillTimingMs` absent.

Implémentation :

- `combat-timing.js` possède désormais :
  - `normalizeSkillSpeedMultiplier()` ;
  - `effectiveSkillTimingMs()` ;
- `CombatSession` possède le multiplicateur global `skillSpeedMultiplier` ;
- `Action Resolver` applique ce multiplicateur aux timings effectifs :
  - préparation ;
  - trajet ;
  - récupération ;
  - préparation des réactions ;
- formule : durée effective = durée configurée / multiplicateur ;
- ×1 conserve exactement le comportement historique ;
- ×2 rend les timings de compétence deux fois plus rapides ;
- ×0,5 les rend deux fois plus lents ;
- les `SkillDefinition` ne sont jamais mutées ;
- cooldown et recharge d'énergie restent sur l'horloge Combat State existante.

La première CI d'implémentation a signalé une erreur du nouveau test : `Riposte` avait été utilisée contre un projectile alors qu'elle ne couvre que `contact`. Le test a été corrigé vers `Bouclier miroir`, réaction projectile compatible, sans modification Core.

SHA technique final :

`27e65a06c3b6bdd0aa0e784b75fb394366bf61c1`.

CI :

- run `36462831044` — SUCCESS.

État : **GREEN technique**.

Checkpoint final :

`checkpoint/lab-combat-global-skill-speed-v1-green-2026-09-28`.

Étape suivante :

lot séparé pour exposer ce multiplicateur dans la configuration Combat de l'éditeur et le transmettre explicitement à la preview, sans lecture DOM par le Combat Core.


## Micro-lot UI — réglage vitesse globale du combat V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-combat-global-skill-speed-v1-green-2026-09-28` ;
- SHA : `4e6c8d0457de1fa691e85121c7ec8039910f74d4`.

Checkpoint départ :

`checkpoint/lab-start-capture-combat-speed-ui-v1-2026-09-28`.

Branche :

`work/lab-capture-combat-speed-ui-v1-2026-09-28`.

Objectif :

exposer dans l'éditeur Capture un réglage global de vitesse des attaques, puis transmettre cette valeur explicitement jusqu'à `CombatSession`, sans lecture DOM par le Core.

Décision :

- donnée de combat au niveau du battle setup : `skillSpeedMultiplier` ;
- valeur par défaut : 1 ;
- UI de test : réglage 0,5x à 2x ;
- le réglage global ne remplace pas les timings par capacité ;
- `preparationMs / travelMs / recoveryMs / cooldownMs` restent éditables individuellement par SkillDefinition ;
- cooldown et recharge énergie ne sont pas accélérés par ce réglage.

Chaîne autorisée :

`Human Editor -> CaptureBattleSetupEditorDraftV1 -> CaptureCombatExportV1.battle.skillSpeedMultiplier -> Adapter Stack -> nativeCombatSource.skillSpeedMultiplier -> mountCoop2v2Test -> CombatSession`.

Propriétaires :

- saisie : Human Editor ;
- validation setup : CaptureBattleSetupEditorDraftV1 ;
- transport export : CaptureCombatExportV1 ;
- adaptation : Capture Export Adapter Stack ;
- consommation : Combat Test bootstrap -> CombatSession ;
- calcul : Combat Rules déjà GREEN.

Fichiers autorisés :

- contrats Capture battle/export ;
- exporters/adapters Capture ;
- Human Editor + page demo ;
- Combat Test bootstrap ;
- tests dédiés ;
- documentation.

Protégé :

- `SkillDefinition` inchangé ;
- calcul Core du multiplicateur inchangé ;
- aucun timing CSS ;
- aucun global/storage ;
- aucune dépendance GenSrpG.

RED :

1. le battle setup accepte et normalise `skillSpeedMultiplier` ;
2. l'export le conserve ;
3. l'Adapter Stack le transmet ;
4. la source native Combat Test le conserve ;
5. `CombatSession` reçoit réellement cette valeur ;
6. l'éditeur expose un contrôle visible et l'utilise dans son battle setup ;
7. défaut 1 pour tous les chemins historiques.

Critère final :

- RED prouvé ;
- CI complète verte ;
- preview publiée ;
- **PREVALIDATION UI smartphone** avant GREEN UI final.


### Résultat — réglage vitesse globale du combat V1

RED :

- test : `tests/unit/capture-combat-speed-ui-v1.test.mjs` ;
- SHA RED : `e1a0349124621f2905351754b17dd5f0b091b09d` ;
- CI `36463333788` — FAILURE attendue ;
- quatre échecs ciblés uniquement :
  1. battle setup sans multiplicateur ;
  2. export / Adapter Stack sans transport ;
  3. bootstrap Combat Test sans transmission ;
  4. contrôle éditeur absent.

Implémentation :

- `CaptureBattleSetupEditorDraftV1.skillSpeedMultiplier` :
  - défaut 1 ;
  - valeur finie strictement positive ;
- `CaptureCombatExportV1.battle.skillSpeedMultiplier` conserve la donnée ;
- Capture Editor Exporter V2/V3 transporte la valeur depuis le setup ;
- Adapter Stack expose `nativeCombatSource.skillSpeedMultiplier` ;
- le loader Combat Test conserve la valeur native et utilise 1 pour le fallback démo historique ;
- `mountCoop2v2Test()` transmet explicitement la valeur à `createCombatSession()` ;
- l'éditeur Capture expose `Vitesse globale des attaques` :
  - plage de preview 0,5× à 2× ;
  - valeur initiale 1× ;
- aucun calcul de timing n'est déplacé dans l'UI ;
- les timings propres des SkillDefinition restent inchangés ;
- cooldown et recharge d'énergie ne sont pas accélérés implicitement.

SHA technique final :

`7012e6e004da3fb142b797022b44e90d9bfe36df`.

CI :

- run `36463895146` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI smartphone**.

Checkpoint de prévalidation :

`checkpoint/lab-capture-combat-speed-ui-v1-prevalidation-green-2026-09-28`.

Preview :

`preview/lab-capture-combat-speed-ui-v1-2026-09-28`.

GREEN UI final interdit avant validation smartphone utilisateur.


## Micro-lot UI — création explicite d'une nouvelle capacité V1 — 2026-09-28

Base :

- SHA : `5f0a3741abc9c56e8535d2b50b4efabceff0ea9d` ;
- checkpoint : `checkpoint/lab-start-capture-skill-new-ux-v1-2026-09-28`.

Branche :

`work/lab-capture-skill-new-ux-v1-2026-09-28`.

Retour utilisateur :

- la distinction créer / modifier reste ambiguë ;
- l'utilisateur ne doit pas avoir à remplacer manuellement l'ID d'une capacité existante pour en créer une nouvelle.

Objectif :

1. ajouter une action explicite `Nouvelle capacité` ;
2. cette action prépare un brouillon neuf sans modifier la bibliothèque ;
3. attribuer un identifiant libre déterministe, sans hasard ;
4. conserver séparément :
   - `Enregistrer comme nouvelle` ;
   - `Mettre à jour la capacité existante` ;
5. charger un modèle historique reste une simple préconfiguration, jamais une sauvegarde implicite.

Propriétaire :

- état/formulaire : Human Editor ;
- décision create/update : `capture-editor-skill-save-mode-v1.js`.

Fichiers autorisés :

- `src/ui/capture-editor-human-v2.js` ;
- éventuel helper UI pur dédié ;
- `examples/dom-demo/capture-editor-v2.html` ;
- tests dédiés ;
- documentation.

Protégé :

- SkillDefinition ;
- Combat Core ;
- catalogues 9 + 70 + 103 ;
- export runtime ;
- aucun storage/global.

RED :

1. contrôle `Nouvelle capacité` absent ;
2. helper d'ID libre absent ;
3. un ID existant ne doit jamais être écrasé par une création ;
4. deux créations successives doivent produire deux IDs distincts.

Critère final :

- RED prouvé ;
- implémentation minimale ;
- CI complète verte ;
- PREVALIDATION UI smartphone.


### Résultat — création explicite d'une nouvelle capacité V1

RED :

- test : `tests/unit/capture-editor-skill-new-ux-v1.test.mjs` ;
- SHA RED : `6d9ca8d380628190edf70a078455c28ef9a8ff57` ;
- CI `36471126214` — FAILURE attendue.

Correction :

- action visible `Nouvelle capacité` distincte de l'enregistrement ;
- génération déterministe d'un ID libre :
  - `nouvelle-capacite` ;
  - puis `nouvelle-capacite-2`, `-3`, etc. ;
- un nouveau brouillon repart sur des valeurs neutres ;
- aucun FX, son ou timing de la capacité précédente n'est hérité silencieusement ;
- `Enregistrer comme nouvelle` refuse toujours un ID existant ;
- `Mettre à jour la capacité existante` refuse toujours un ID inconnu ;
- charger un modèle historique ne sauvegarde rien implicitement ;
- aucun catalogue, export, Combat Core, global ou storage modifié.

SHA technique :

`a7b02d1a91deb488b247548c15207f18c7b96796`.

CI :

- run `36471304727` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI smartphone**.

Checkpoint visé :

`checkpoint/lab-capture-skill-new-ux-v1-prevalidation-green-2026-09-28`.


## Micro-lot UI — suppression du plafond artificiel de scale V1 — 2026-09-28

Base :

- SHA : `21be0cb8e586a0405af8a8d5857080d094b2d2b0` ;
- checkpoint : `checkpoint/lab-start-presentation-scale-range-ui-v1-2026-09-28`.

Branche :

`work/lab-presentation-scale-range-ui-v1-2026-09-28`.

Retour utilisateur :

- les réglages de scale sont bloqués à 4× sans raison métier.

Diagnostic :

- `CreaturePresentationBindingV2.displayScale` accepte tout nombre fini > 0 ;
- `SkillPresentationBindingV1/V2.visual.*.displayScale` accepte tout nombre fini > 0 ;
- le plafond 4× existe uniquement dans la Demo UI HTML.

Objectif :

1. supprimer le plafond 4× des scales Cast / Projectile / Impact ;
2. supprimer le plafond artificiel de taille de créature ;
3. conserver une validation positive côté contrat ;
4. ne modifier ni renderer ni Combat Core.

Fichiers autorisés :

- `examples/dom-demo/capture-editor-v2.html` ;
- tests dédiés ;
- documentation.

Protégé :

- CreaturePresentationBindingV2 ;
- SkillPresentationBindingV1/V2 ;
- renderer ;
- Combat Core ;
- aucun storage/global.

RED :

- les quatre contrôles concernés exposent encore `max="4"`.

Critère final :

- RED prouvé ;
- UI alignée sur les contrats ;
- CI complète verte ;
- PREVALIDATION UI smartphone.


### Résultat — suppression du plafond artificiel de scale V1

RED :

- test : `tests/unit/presentation-scale-range-ui-v1.test.mjs` ;
- SHA RED : `87c9b3ac26ef4699700171080a1dd6ffbb9ef9b0` ;
- CI `36471516223` — FAILURE attendue.

Correction :

- suppression de `max="4"` pour :
  - Cast ;
  - Projectile ;
  - Impact ;
- la taille de créature n'utilise plus un slider plafonné à 4× mais une saisie numérique positive ;
- les contrats restent inchangés et continuent d'accepter tout nombre fini > 0 ;
- aucun renderer ni Combat Core modifié.

SHA technique :

`b4a4de4335f62d792d6e98d1f7fc2aed5ea6e8c4`.

CI :

- run `36471581633` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI smartphone**.

Checkpoint visé :

`checkpoint/lab-presentation-scale-range-ui-v1-prevalidation-green-2026-09-28`.


## Micro-lot UI/Asset Input — audio privé runtime complet + pré-écoute V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-presentation-scale-range-ui-v1-prevalidation-green-2026-09-28` ;
- SHA : `7788f945b055298258d3ce484de73bb951ab08b5`.

Source audio privée autoritaire :

- dépôt : `slyen4425-cloud/GenSrpG_audio_prive` ;
- catalogue classé : `work/audio-catalog-classification-2026-09-26` ;
- révision catalogue : `01ffe9c8c6ec73d974f572f7e648461a48470e8a` ;
- pack runtime généré : `work/runtime-audio-pack-v1-2026-09-28` ;
- SHA pack : `4f429ee41bdcf6a33d7839ca11bb087039a99df9` ;
- 173 assetIds / 173 MP3 runtime opaques ;
- masters WAV/MP3 source non copiés.

Checkpoint départ :

`checkpoint/lab-start-private-audio-full-preview-v1-2026-09-28`.

Branche :

`work/lab-private-audio-full-preview-v1-2026-09-28`.

Objectif :

1. livrer au laboratoire uniquement les copies runtime compressées et opaques des 173 sons classés ;
2. conserver les mêmes `assetId` stables que le catalogue privé ;
3. faire utiliser un unique resolver Asset Input par le combat et la pré-écoute éditeur ;
4. ajouter une action `Écouter` à chaque sélecteur audio avant attachement ;
5. arrêter proprement une écoute précédente et libérer les ressources au dispose.

Propriétaires :

- classification / IDs : catalogue audio privé existant ;
- fichiers runtime distribués : `assets/runtime/audio/private-v1/` ;
- manifeste runtime public sans sourcePath : `data/presentation/audio/private-audio-runtime.v1.json` ;
- résolution assetId -> URL : Asset Input dédié ;
- pré-écoute : contrôleur UI dédié ;
- lecture combat : `dom-combat-audio` inchangé.

Interdits :

- aucun master source dans le laboratoire ;
- aucun `sourcePath` privé, URL GitHub privée ou token ;
- aucun nom de fichier source maître ;
- aucun mapping par nom de capacité ;
- aucun global / localStorage / sessionStorage ;
- aucun changement Combat Core ;
- aucune dépendance runtime vers le dépôt privé.

RED :

1. manifeste runtime complet absent du laboratoire ;
2. resolver complet absent ;
3. contrôleur de pré-écoute absent ;
4. chaque sélecteur `data-private-audio` doit posséder une action d'écoute ;
5. un assetId inconnu doit rester indisponible explicitement ;
6. aucune chaîne privée/sourcePath ne doit apparaître dans le pack labo.

Critère final :

- RED prouvé ;
- 173 fichiers runtime transférés et vérifiés ;
- même resolver utilisé par éditeur + combat ;
- CI complète verte ;
- preview publiée ;
- **PREVALIDATION audio/UI smartphone** avant GREEN final.


### Résultat — audio privé runtime complet + pré-écoute V1

RED et intégration :

- manifeste runtime public : `data/presentation/audio/private-audio-runtime.v1.json` ;
- 173 assetIds / 173 fichiers MP3 runtime opaques ;
- resolver unique : `privateAudioRuntimeAssetV1()` ;
- contrôleur dédié de pré-écoute : `createPrivateAudioPreviewControllerV1()` ;
- chaque sélecteur audio privé possède une action `Écouter` ;
- aucun master, `sourcePath`, URL privée GitHub, token ou nom de fichier maître exposé ;
- le combat et l'éditeur utilisent le même resolver Asset Input.

Une sentinelle historique imposait encore littéralement le resolver limité à trois sons de test `privateAudioPreviewAssetV1`.
Elle a été réalignée sur l'invariant actuel, sans modifier le runtime :
`privateAudioRuntimeAssetV1(assetId) ?? demoPresentationAssets.audioAsset(assetId)`.

SHA final technique :

`ffeac94052a8c00b4a714dfc5e5bacdf283bd3e8`.

CI :

- run `36482922832` — SUCCESS ;
- 498 tests, 498 pass.

État : **GREEN technique / PREVALIDATION audio/UI smartphone**.

Checkpoint final :

`checkpoint/lab-private-audio-full-preview-v1-green-2026-09-28`.

Preview finale :

`preview/lab-private-audio-full-preview-v1-2026-09-28`.

GREEN audio/UI final interdit avant validation utilisateur.


## Micro-lot — consolidation preview Capture post-feedback V1 — 2026-09-28

Base :

- checkpoint : `checkpoint/lab-private-audio-full-preview-v1-green-2026-09-28` ;
- SHA : `070fc5086965b61ba9ddc2596ac37bbfb24ad5b7`.

Checkpoint départ :

`checkpoint/lab-start-capture-preview-consolidation-v1-2026-09-28`.

Branche :

`work/lab-capture-preview-consolidation-v1-2026-09-28`.

Cause :

le lot audio privé complet et le lot sélection des créatures de test ont divergé depuis le même checkpoint `7788f945...`.
Les deux sont techniquement GREEN séparément mais aucune preview unique ne possède encore les deux fonctionnalités.

Objectif :

1. conserver intégralement le runtime audio privé complet 173 sons + pré-écoute ;
2. rapatrier la sélection explicite des créatures de test ;
3. préserver tous les lots déjà hérités de la base : création de capacité, scales sans plafond, vitesse globale, variété IA, 1v1/2v2, bridge preview ;
4. ne créer aucune nouvelle règle métier ;
5. publier ensuite une seule lignée de preview autoritaire.

Invariants :

- pas de merge sur `main` ;
- aucune dépendance runtime production ;
- aucun storage/global ;
- aucun master audio exposé ;
- pas de copie parallèle du renderer ou Combat Core.

RED :

- sur la base audio actuelle, la sélection des créatures de test est absente ;
- les sentinelles audio complet et sélection test doivent ensuite être vertes ensemble.

Critère GREEN :

- CI complète verte sur la lignée consolidée ;
- checkpoint dédié ;
- preview unique publiée ;
- PREVALIDATION UI/audio smartphone.


### Résultat — consolidation preview Capture post-feedback V1

RED :

- sentinelle : `tests/unit/capture-test-creature-selection-v1.test.mjs` ;
- SHA RED : `42d99d0b51941c3ae7c12fb073c4ed114176e7b5` ;
- CI `36483271991` — FAILURE attendue ;
- cause : sélection des créatures de test absente de la lignée audio.

Consolidation :

- catalogue `capture-test-creature-options-v1.js` rapatrié ;
- Human Editor résout l'adversaire sélectionné au moment de `validate()` ;
- page de preview conserve le resolver audio privé complet 173 sons et la pré-écoute ;
- sélecteur de créature adverse ajouté sans écraser les contrôles audio ;
- labels de preview dérivés de `BattleFormat.actor.displayName`, aucun `Braisombre` métier codé en dur ;
- aucun Combat Core, renderer parallèle, storage/global ou dépendance production ajouté.

Correction finale :

- SHA : `158a6c0fc1b0a09b0eb1c12fdd6dc63926fc69c9` ;
- CI `36483549292` — SUCCESS.

État : **GREEN technique / PREVALIDATION UI+audio smartphone**.

Checkpoint final :

`checkpoint/lab-capture-preview-consolidation-v1-prevalidation-green-2026-09-28`.

Preview finale :

`preview/lab-capture-preview-consolidation-v1-2026-09-28`.

Cette preview devient la lignée autoritaire de test pour les derniers retours consolidés.


## Réparation bloquante — livraison physique audio runtime privé V1 — 2026-09-29

Base :

- checkpoint : `checkpoint/lab-capture-preview-consolidation-v1-prevalidation-green-2026-09-28` ;
- SHA : `9fd83dba00c04fa149d679f90aed5757dfe8c042`.

Checkpoint départ :

`checkpoint/lab-start-private-audio-runtime-delivery-repair-v1-2026-09-29`.

Branche :

`work/lab-private-audio-runtime-delivery-repair-v1-2026-09-29`.

Régression utilisateur :

- les sélecteurs audio sont présents mais aucun son ne se lit.

Cause démontrée :

- le manifeste `private-audio-runtime.v1.json` expose 173 entrées ;
- le resolver construit bien des URLs sous `assets/runtime/audio/private-v1/` ;
- les 173 fichiers MP3 runtime correspondants sont physiquement absents du dépôt laboratoire ;
- la sentinelle historique ne vérifiait que manifeste + URL générée, donc pouvait passer GREEN sans binaire livré.

Source autoritaire :

- dépôt privé : `slyen4425-cloud/GenSrpG_audio_prive` ;
- branche : `work/runtime-audio-pack-v1-2026-09-28` ;
- SHA : `4f429ee41bdcf6a33d7839ca11bb087039a99df9` ;
- dossier source : `runtime-audio-v1/` ;
- 173 MP3 runtime opaques, masters non exposés.

Objectif :

1. ajouter une sentinelle vérifiant l'existence physique des 173 fichiers ;
2. livrer exactement les 173 copies runtime opaques dans `assets/runtime/audio/private-v1/` ;
3. conserver les assetIds, le manifeste et le resolver existants ;
4. ne copier aucun master, sourcePath, token ou URL privée ;
5. ne modifier ni Combat Core ni la taxonomie audio.

RED attendu :

- manifeste 173 OK ;
- 173 fichiers runtime manquants.

Critère GREEN :

- les 173 fichiers existent physiquement ;
- chaque `runtimeFile` du manifeste correspond à un fichier livré ;
- CI complète verte ;
- checkpoint GREEN technique avant toute nouvelle UI.


## Résultat — réparation livraison physique audio runtime privé V1 — 2026-09-29

Autorisation de publication :

- publication des copies audio runtime opaques vers le dépôt public du laboratoire explicitement autorisée par Sylvain le 2026-09-29 ;
- seuls les fichiers runtime déjà destinés à la distribution sont concernés ;
- aucun master, `sourcePath`, token, URL privée ou nom de fichier maître n'est publié.

Livraison finale :

- commit binaire : `f791422db645f954cc1af28f095c3cea6d38e488` ;
- commit : `assets: complete private runtime audio delivery 149-173` ;
- les 25 MP3 Xel manquants ont été ajoutés sous `assets/runtime/audio/private-v1/` ;
- total manifeste : 173 ;
- total fichiers runtime physiquement livrés : 173 ;
- assetIds, manifeste, resolver et taxonomie existants inchangés ;
- aucun changement Combat Core, renderer métier, storage/global ou dépendance runtime vers le dépôt privé.

Validation CI du commit binaire :

- workflow : `Laboratory CI` ;
- run : `36560857785` ;
- conclusion : SUCCESS ;
- sentinelle `private-audio-runtime-delivery-v1.test.mjs` : PASS ;
- 502 tests, 502 pass, 0 fail.

État :

**GREEN technique de livraison audio runtime**.

Ce GREEN prouve la livraison physique complète et le vrai raccord manifeste -> fichiers.
Aucune nouvelle UI n'a été ajoutée dans ce lot.


## Micro-lot — réparation régression scale créature V1 — 2026-09-29

Base :

- checkpoint : `checkpoint/lab-private-audio-runtime-delivery-repair-v1-green-2026-09-29` ;
- SHA : `105c44720b3f7b5f20c02b93f061a92e6ef9bc3e`.

Checkpoint départ :

`checkpoint/lab-start-creature-scale-regression-repair-v1-2026-09-29`.

Branche :

`work/lab-creature-scale-regression-repair-v1-2026-09-29`.

Retour utilisateur :

- « Régression : plus de scale créature ».

Références GREEN à comparer :

- `checkpoint/lab-creature-scale-v1-green-2026-09-28` ;
- `checkpoint/lab-capture-creature-scale-export-v1-green-2026-09-28` ;
- `checkpoint/lab-presentation-scale-range-ui-v1-prevalidation-green-2026-09-28`.

Objectif :

1. reproduire la disparition du contrôle / raccord de scale sur la lignée actuelle ;
2. identifier le premier changement responsable ;
3. reconnecter le propriétaire de scale existant ;
4. conserver le contrat : nombre fini strictement positif, sans plafond métier artificiel à 4× ;
5. ne créer aucun second système de scale.

Propriétaires à préserver :

- donnée de présentation créature : `CreaturePresentationBindingV2.displayScale` ;
- export Capture : raccord existant vers la présentation ;
- renderer : consommateur uniquement ;
- Human Editor : saisie / projection UI uniquement.

Fichiers autorisés après diagnostic :

- uniquement le ou les fichiers du raccord fautif démontré ;
- tests dédiés ;
- `docs/LAB_CURRENT_WORK.md`.

Protégé :

- Combat Core ;
- Animation Core ;
- SkillDefinition ;
- renderer si aucune faute n'y est démontrée ;
- aucune nouvelle source de vérité ;
- aucun storage/global ;
- aucun système parallèle de scale.

RED prévu :

- sentinelle reproduisant la disparition sur la lignée actuelle ;
- preuve que la donnée `displayScale` existe mais n'atteint plus correctement le chemin éditeur -> export -> source visuelle -> rendu, ou preuve équivalente du raccord réellement cassé.

Critère de fin :

- cause démontrée ;
- correction minimale de la cause ;
- CI complète verte ;
- PREVALIDATION UI smartphone avant GREEN UI final.


### Résultat — réparation régression scale créature V1

Diagnostic démontré :

- le contrôle `data-creature-display-scale` existe toujours dans l'éditeur ;
- `Human Editor` lit toujours `displayScale` ;
- l'export Capture V3 et l'adaptateur visuel savent toujours transporter et consommer un scale V2 ;
- le renderer applique toujours `actor.scale` dans son transform de base ;
- la régression est apparue dans le nouveau sélecteur de créature adverse de test.

Premier commit responsable :

`a7d749460af09a4e5d8a6bf4e71d29853e816d3f` — `feat: add Capture test creature options to consolidated preview`.

Cause exacte :

- `buildCaptureTestOpponentDraftV1()` reconstruisait une présentation V2 pour la créature sélectionnée ;
- cette présentation imposait `displayScale: 1` ;
- les métadonnées visuelles autoritaires déjà présentes dans `global-assets` étaient ignorées ;
- exemples autoritaires : Braisombre `displayScale.opponent = 0.88`, Maraileron `0.92`.

RED :

- test : `tests/unit/capture-test-creature-scale-regression-v1.test.mjs` ;
- SHA RED : `d476b7699c1305ca9115f2fdfb94811c76e5ff70` ;
- CI : `36561671942` — FAILURE attendue ;
- 504 tests, 502 pass, 2 fail ;
- échecs ciblés :
  1. le builder renvoyait 1 au lieu du scale autoritaire ;
  2. le builder acceptait l'absence de metadata et inventait silencieusement 1.

Correction :

- aucun tableau parallèle de scales ajouté ;
- chaque option de test référence uniquement son fichier `.meta.json` existant dans `global-assets` ;
- la preview charge ces metadata depuis la bibliothèque visuelle autoritaire ;
- le builder exige la metadata correspondant à l'option ;
- `displayScale.opponent` devient la source du scale du draft adverse ;
- une metadata absente, incohérente ou un scale non positif provoque une erreur explicite ;
- aucun changement Combat Core, Animation Core ou renderer.

Commits de correction :

- `40821cc7ffb60b39658a686c7815f60cd6371750` — source scale depuis metadata ;
- `ef5c7a86bf874bdefee5d79526ee6b900e90eda1` — chargement metadata dans la preview ;
- `ae67602abcc7bc69133f24db66b20bb928f1b7cc` — sentinelle sélection réalignée ;
- `47957d30a54f094c1a55a4e56b1777698c33b894` — vrai chemin preview protégé.

CI finale technique :

- run : `36561906849` ;
- conclusion : SUCCESS ;
- 505 tests, 505 pass, 0 fail ;
- les trois sentinelles de la régression sont PASS.

État :

**GREEN technique / PREVALIDATION UI smartphone**.

Le GREEN UI final reste interdit avant validation smartphone utilisateur du scale dans la preview.


## Micro-lot UI — créer / choisir / modifier une créature V1 — 2026-09-29

Base :

- checkpoint technique précédent : `checkpoint/lab-creature-scale-regression-repair-v1-prevalidation-green-2026-09-29` ;
- SHA : `ef0a68df628cbdbe2fdf63e44e375f15b3c0b108`.

Checkpoint départ :

`checkpoint/lab-start-capture-creature-crud-v1-2026-09-29`.

Branche :

`work/lab-capture-creature-crud-v1-2026-09-29`.

Retour utilisateur :

- « Il faut à présent pouvoir créer / modifier les créature. »
- l'éditeur laboratoire doit devenir plus tard l'éditeur du mode Monster Capture.

Diagnostic initial :

- `CaptureCreatureEditorDraftV3` est déjà le contrat de draft autoritaire ;
- l'éditeur possède actuellement un seul formulaire créature sans bibliothèque active ;
- les capacités possèdent déjà une bibliothèque de session et un save-mode create/update ;
- aucune bibliothèque CRUD créature ni branche create-creature dédiée n'existe.

Objectif :

1. ajouter une action explicite `Nouvelle créature` ;
2. ajouter un sélecteur des créatures configurées dans la session ;
3. ajouter `Enregistrer comme nouvelle` et `Mettre à jour la créature existante` ;
4. une création doit générer une nouvelle identité déterministe et refuser tout ID existant ;
5. une mise à jour doit cibler explicitement l'identité sélectionnée, sans duplication silencieuse ;
6. charger une créature doit restaurer son draft complet :
   - identité ;
   - stats ;
   - éléments/résistances/Capture ;
   - PV/énergie ;
   - face/dos/icône ;
   - profil ;
   - scale ;
   - sockets ;
   - sons ;
   - loadout actif ;
7. le draft + son loadout doivent rester rattachés au même propriétaire ;
8. aucune persistance navigateur bricolée : bibliothèque de session seulement dans ce lot.

Propriétaires :

- draft créature : `CaptureCreatureEditorDraftV3` ;
- loadout : `CaptureActiveSkillLoadoutV1` ;
- bibliothèque de session / UX : Human Editor ;
- définition des capacités : bibliothèque de capacités existante.

Interdits :

- aucun localStorage/sessionStorage ;
- aucun global ;
- aucun tableau parallèle de créatures dans la page HTML ;
- aucune copie du Combat Core ou renderer ;
- aucun changement de format gameplay sans nécessité démontrée ;
- aucune sauvegarde implicite lors du simple chargement d'une créature.

RED prévu :

- contrôles CRUD créature absents ;
- save-mode create/update créature absent ;
- deux créations successives doivent avoir deux IDs distincts ;
- create refuse un ID existant ;
- update refuse un ID inconnu ou différent de l'identité sélectionnée ;
- changement de créature doit restaurer le draft + loadout du bon propriétaire.

Critère final :

- RED prouvé ;
- correction minimale ;
- CI complète verte ;
- preview dédiée ;
- PREVALIDATION UI smartphone avant GREEN UI final.


### Résultat — créer / choisir / modifier une créature V1

RED :

- test : `tests/unit/capture-editor-creature-crud-v1.test.mjs` ;
- SHA RED : `e3b3849491d2d43e98a617875177be69ddc80b30` ;
- CI : `36566879659` — FAILURE attendue ;
- 508 tests, 505 pass, 3 fail ;
- causes ciblées :
  1. save-mode créature absent ;
  2. contrôles choisir / nouvelle / créer / mettre à jour absents ;
  3. aucun propriétaire de bibliothèque créature dans le Human Editor.

Implémentation :

- helper dédié : `capture-editor-creature-save-mode-v1.js` ;
- génération déterministe d'identités :
  - `nouvelle-creature` ;
  - puis `nouvelle-creature-2`, `-3`, etc. ;
- create refuse tout ID déjà existant ;
- update refuse :
  - un ID inconnu ;
  - un ID différent de la créature explicitement sélectionnée ;
- bibliothèque de session propriétaire unique : `configuredCreatures` ;
- chaque entrée possède ensemble :
  - `record.draft` = `CaptureCreatureEditorDraftV3` ;
  - `record.loadout` = `CaptureActiveSkillLoadoutV1` ;
- le formulaire sait restaurer :
  - identité ;
  - stats ;
  - éléments/résistances/Capture ;
  - PV/énergie ;
  - visuels face/dos/icône ;
  - profil ;
  - displayScale ;
  - sockets ;
  - sons ;
  - quatre slots du loadout ;
- une nouvelle créature repart d'un brouillon neutre et n'hérite pas silencieusement de la précédente ;
- l'identité d'une créature chargée est verrouillée pendant la mise à jour ;
- la validation combat exige désormais une créature explicitement enregistrée ; un formulaire modifié mais non sauvegardé est refusé ;
- la création d'une nouvelle capacité ne marque la créature comme modifiée que si le loadout a réellement changé ;
- aucun localStorage, sessionStorage ou global ajouté ;
- aucune copie Combat Core / renderer ;
- aucune sauvegarde implicite au simple chargement.

Limite volontaire de ce V1 :

- la bibliothèque est une bibliothèque de session du laboratoire ;
- elle contient la créature initiale du formulaire puis toutes les créatures créées pendant la session ;
- la persistance durable / injection du futur catalogue Monster Capture reste un lot séparé afin de ne pas introduire une seconde source de vérité avant l'intégration du vrai propriétaire du mode.

CI finale technique :

- SHA : `1522cba4ab248878f9e6fdadf75b41d53f949b9b` ;
- run : `36567460358` ;
- conclusion : SUCCESS ;
- 508 tests, 508 pass, 0 fail.

État :

**GREEN technique / PREVALIDATION UI smartphone**.

Le GREEN UI final reste interdit avant validation utilisateur des actions :
- choisir une créature ;
- nouvelle créature ;
- enregistrer comme nouvelle ;
- mettre à jour l'existante ;
- basculer entre deux créatures sans mélange de données.


## Micro-lot — import catalogue créatures Monster Capture V1 — 2026-09-29

Base :

- checkpoint CRUD créature PREVALIDATION : `checkpoint/lab-capture-creature-crud-v1-prevalidation-green-2026-09-29` ;
- SHA : `afd7148ffe539b7c08dfb2f4c45dbb8befefdf0f`.

Checkpoint départ :

`checkpoint/lab-start-capture-creature-catalog-import-v1-2026-09-29`.

Branche :

`work/lab-capture-creature-catalog-import-v1-2026-09-29`.

Retour utilisateur :

- la liste historique des créatures Monster Capture doit être visible dans « Créature à modifier » ;
- si elle n'existe pas dans le labo, récupérer les données du mode Monster Capture historique ;
- l'éditeur laboratoire deviendra ensuite l'éditeur Monster Capture.

Constat avant lot :

- le labo ne contient pas de catalogue complet de créatures ;
- il contient seulement 9 options de créatures de test visuel/combat ;
- l'historique GenSrpG documente les familles :
  - `gensrpg_shared_entities_v1__<profileId>` ;
  - `gensrpg_shared_entities_v1__family__creature` ;
  - `starter_capture` ;
- la note `notes/capture-recovery-2026-09-08.md` interdit de réinventer le système avant recherche de l'implémentation historique.

Mission :

1. retrouver le propriétaire historique réel des données de créatures Monster Capture ;
2. caractériser son format et les créatures builtin/starter réellement présentes ;
3. produire un import explicite vers `CaptureCreatureEditorDraftV3` ;
4. ne pas remplacer les données historiques par les 9 créatures de preview ;
5. raccorder le catalogue importé à la bibliothèque CRUD du Human Editor ;
6. aucune persistance navigateur nouvelle dans le laboratoire ;
7. aucune dépendance runtime vers `Zombicide-40k` : les données nécessaires doivent être exportées dans le labo ;
8. conserver les identités historiques quand elles sont sûres et explicites.

Interdits :

- aucune liste inventée ;
- aucun parsing runtime du dépôt principal ;
- aucun second contrat créature ;
- aucun localStorage/sessionStorage ;
- aucune modification Combat Core/renderer ;
- aucun merge sur `main`.

RED attendu :

- catalogue Monster Capture absent du laboratoire ;
- la bibliothèque CRUD ne sait charger que sa créature initiale et les créations de session.

Critère de fin :

- provenance documentée ;
- format historique caractérisé ;
- import déterministe testé ;
- CI complète verte ;
- preview dédiée ;
- PREVALIDATION smartphone avant GREEN UI final.


### Résultat — import catalogue créatures Monster Capture V1

Source historique démontrée :

- fichier utilisateur vérifié : `lab5.zip -> lab5.txt` ;
- taille du fichier historique : `8 172 204` octets ;
- dépôt de provenance : `slyen4425-cloud/Zombicide-40k` ;
- checkpoint : `checkpoint/gensrpg-phase5-module-launch-s3-capture-provider-green-2026-09-24` ;
- SHA : `e8fd85ab68df818a138ed7949c411005ad622457` ;
- blob exact `index.html` : `6c95e3f6ca4bf8e34003776e7e43e44192aafb16`.

Propriétaires historiques retrouvés :

- `gensStarterCreatures()` définit le pool builtin de 100 starters ;
- `MC162_ENTITIES` contient le roster runtime V16.162 réellement seedé ;
- `ensureBuiltinMonsterCapture162()` fusionne `MC162_ENTITIES` par ID dans :
  - `gensrpg_shared_entities_v1__family__creature` ;
  - `gensrpg_shared_entities_v1__gp_mt7ker7t_m2iw9` ;
- la fusion n'écrase jamais une entrée utilisateur existante.

Roster runtime retenu pour le laboratoire :

- `MC162_ENTITIES` : **110 entrées** ;
- **110 IDs uniques** ;
- **102 noms uniques** ;
- le roster contient le pool starter canonique plus des entrées historiques de démonstration encore réellement seedées dans le runtime ;
- 8 paires partagent le même nom mais possèdent des IDs distincts ;
- aucun alias n'est fusionné ou supprimé arbitrairement ;
- décision : l'éditeur du laboratoire doit afficher la liste réellement existante dans Monster Capture, donc les **110 IDs runtime**.

RED corrigé après audit du fichier utilisateur :

- test : `tests/unit/monster-capture-creature-catalog-import-v1.test.mjs` ;
- SHA : `3d0902acf541e3fc11d116c12a11b2d4a15de00c` ;
- CI : `36596897409` — FAILURE attendue ;
- 513 tests, 511 pass, 2 fail ;
- causes :
  1. ancien export limité à 100 starters ;
  2. Aquafin ne provenait pas de l'entrée runtime réellement seedée.

Export final :

- fichier unique : `data/capture/monster-capture-creatures.v1.json` ;
- commit : `09198be428bf7f70bcccdd3d270f2f7c0bef8a59` ;
- 110 objets copiés depuis `MC162_ENTITIES` du blob historique vérifié ;
- IDs, noms, descriptions, niveaux, HP, stats legacy, éléments, résistances, `abilityIds`, capture, évolutions, spawn, univers et icônes texte conservés ;
- aucune dépendance runtime vers le dépôt principal.

Adaptateur :

- `src/adapters/input/capture/monster-capture-creature-import-v1.js` ;
- projection explicite vers `CaptureCreatureEditorDraftV3` ;
- la projection des anciennes stats est uniquement une couche de compatibilité temporaire :
  - `force <- force/power` ;
  - `agility <- agility/agilite` ;
  - `intelligence <- intelligence`, sinon 0 ;
  - `spirit <- spirit/esprit` ;
  - `endurance <- endurance/defense` ;
  - `initiative <- initiative/speed` ;
- cette projection n'est **pas** le futur modèle de stats Monster Capture ;
- HP historique conservé ;
- énergie absente de la source : valeurs neutres 0 ;
- les `abilityIds` historiques restent attachés à la créature ;
- aucun choix arbitraire de quatre capacités : loadout actif importé vide ;
- présentation `null` si aucun asset visuel exploitable n'existe.

Raccord Human Editor :

- les 110 créatures sont ajoutées au même `configuredCreatures` que le CRUD existant ;
- aucune seconde bibliothèque UI ;
- aucune persistance navigateur ajoutée ;
- une créature historique sans art reste éditable ;
- les éléments, résistances, capacités et évolutions non encore représentés par l'UI actuelle sont préservés lors d'une mise à jour ;
- la validation combat peut rester plus stricte que l'enregistrement d'une créature : aucune image inventée pour rendre artificiellement une entrée jouable.

Nettoyage source de vérité :

- une copie temporaire 110 entrées existait encore sous `data/capture/creatures/monster-capture-legacy.v1.json` ;
- aucune référence runtime ne l'utilisait ;
- suppression : `8c5a1c70d28ca8455d830a3c2b08190296e0a070` ;
- il ne reste qu'un seul catalogue importé autoritaire :
  `data/capture/monster-capture-creatures.v1.json`.

Validation :

- après import 110 : CI `36596995960` — SUCCESS ;
- 513 tests, 513 pass, 0 fail ;
- après suppression du doublon : CI `36597061489` — SUCCESS.

État :

**GREEN technique / PREVALIDATION UI smartphone**.

Validation utilisateur attendue avant GREEN UI final :

1. la liste « Créature à modifier » expose bien les créatures historiques ;
2. plusieurs entrées peuvent être chargées sans mélange de données ;
3. une créature historique peut être modifiée puis mise à jour ;
4. les doublons de nom restent distinguables grâce à leur ID ;
5. l'absence d'art sur certaines entrées ne bloque pas leur édition.

Lot suivant explicitement séparé :

**Refonte stats / progression Monster Capture** :
- HP ;
- Vitesse ;
- Puissance physique ;
- stats élémentaires configurables (Feu, Eau, etc.) servant aux dégâts et résistances ;
- stats personnalisées créables par les joueurs ;
- règles configurables de nombre de compétences disponibles et déverrouillage par niveau.

Aucune partie de cette refonte n'est intégrée dans le présent lot d'import.


#### Régression smartphone — garde runtime restée à 100

Retour utilisateur :

- message rouge : « Le catalogue Monster Capture doit contenir exactement 100 créatures builtin. »
- aucune créature historique visible dans « Créature à modifier ».

Cause démontrée :

- le catalogue final contient bien 110 entrées historiques ;
- la sentinelle de données protège déjà 110 IDs ;
- le chargeur runtime `hydrateMonsterCaptureCreatureCatalog()` conservait encore une ancienne garde locale `entries.length !== 100` ;
- cette garde rejetait le catalogue avant hydratation de `configuredCreatures`.

RED dédié :

- SHA : `257c9fa924980903079f19b30629638ac94dcbc0` ;
- CI : `36601572271` — FAILURE attendue ;
- la sentinelle interdit désormais tout retour d'une garde littérale 100 dans le chargeur.

Correction :

- commit runtime : `3f105d4eb0c196ecbf180dce67b6ce7d7420afe5` ;
- le nombre attendu vient désormais de `catalog.provenance.sourceCount` ;
- le loader vérifie également que tous les IDs sont uniques ;
- aucune donnée créature, adaptateur, CRUD, Combat Core ou renderer modifié.

Ajustement de sentinelle :

- `a7e780ea4af229ee7d9801a07efbf62e2455a470` ;
- regex de test rendue indépendante du formatage multiligne ;
- aucun changement métier.

CI correction :

- run : `36601718375` ;
- conclusion : SUCCESS ;
- 514 tests, 514 pass, 0 fail.

État :

**GREEN technique / PREVALIDATION smartphone à refaire sur la liste des 110 créatures.**


#### Validation smartphone utilisateur — catalogue 110

Retour Sylvain :

- la liste des créatures est maintenant visible ;
- le message rouge de garde 100 a disparu ;
- le chargement du catalogue fonctionne sur smartphone.

Validation :

- lot catalogue 110 validé UI par l'utilisateur ;
- aucune régression catalogue signalée sur ce test.

État :

**GREEN UI utilisateur pour l'import du catalogue Monster Capture 110.**


## Micro-lot — propriété Combat + auto-raccord visuel créatures V1 — 2026-09-29

Base :

- checkpoint catalogue Monster Capture GREEN utilisateur : `checkpoint/lab-capture-creature-catalog-import-v1-green-2026-09-29` ;
- SHA : `5d7a36d5d65958504524cbb63ac59ed76da1d2a2`.

Checkpoint départ :

`checkpoint/lab-start-creature-ownership-visual-autolink-v1-2026-09-29`.

Branche :

`work/lab-creature-ownership-visual-autolink-v1-2026-09-29`.

Retour utilisateur :

- changer de créature semble remettre les réglages de combat à zéro ;
- modifier les réglages de combat oblige ensuite à réenregistrer la créature ;
- les créatures déjà illustrées doivent arriver avec leurs images / icônes pré-raccordées dans la version vitrine ;
- plus tard les joueurs pourront importer leurs propres images et créer leurs propres créatures.

Diagnostic architecture :

- la charte attribue distance et énergie de combat au domaine Combat Rules Lab ;
- le Human Editor range actuellement plusieurs réglages d'énergie dans `CaptureCreatureEditorDraftV3.combat` et les marque comme données créature ;
- cette représentation UI mélange donc fiche créature et règles de combat ;
- la bibliothèque visuelle autoritaire existe sur la branche `global-assets` avec métadonnées par créature.

Objectifs V1 :

1. séparer dans l'éditeur les réglages réellement propres à la créature des règles de combat/scénario ;
2. changer de créature ne doit jamais réinitialiser ni salir les réglages de combat globaux ;
3. les règles de combat ne doivent pas nécessiter « Mettre à jour la créature » ;
4. préserver la compatibilité des contrats/export existants jusqu'à un lot de migration de données si nécessaire, sans créer de second moteur ;
5. auto-raccorder les visuels existants par identité explicite / metadata autoritaire ;
6. aucune correspondance par nom ambiguë ou heuristique silencieuse ;
7. une créature sans art reste éditable ;
8. aucun asset dupliqué dans la branche de travail : les IDs stables de la bibliothèque visuelle restent la référence.

Protégé :

- Combat Runtime ;
- Animation Core ;
- renderer ;
- catalogue 110 Monster Capture ;
- aucun localStorage/sessionStorage/global ;
- aucun merge sur main.

RED prévu :

- modification d'un réglage global Combat ne doit pas rendre la créature dirty ;
- chargement d'une autre créature conserve ces réglages Combat ;
- une créature connue disposant de metadata visuelle reçoit automatiquement face/dos/icône/profile/scale ;
- absence ou ambiguïté de metadata ne doit jamais inventer un raccord.

Critère final :

- cause prouvée ;
- propriétaire UI clarifié ;
- auto-raccord visuel déterministe ;
- CI complète verte ;
- preview dédiée ;
- PREVALIDATION smartphone.


### Résultat — propriété Combat + auto-raccord visuel créatures V1

Retour utilisateur :

- changement de créature réinitialisait visuellement les réglages de l'onglet Combat ;
- modifier ces réglages imposait ensuite de « Mettre à jour la créature » ;
- les créatures déjà illustrées doivent charger automatiquement leurs arts dans la version vitrine.

Cause de propriété :

- les six réglages énergie étaient affichés dans l'onglet Combat mais lus / écrits dans `CaptureCreatureEditorDraftV3.combat` ;
- `writeCreatureRecordFields()` les remplaçait à chaque changement de créature ;
- `prepareNewCreatureDraftFields()` les réinitialisait ;
- le dirty-owner créature écoutait aussi directement ces six contrôles ;
- cette UI contredisait la frontière de la charte : énergie / distance appartiennent au domaine Combat Rules.

RED :

- test : `tests/unit/capture-editor-combat-ownership-visual-autolink-v1.test.mjs` ;
- SHA RED : `b421d37e9e6c8c524504470afd05aff936948b5b` ;
- CI : `36606050499` — FAILURE attendue ;
- 521 tests, 514 pass, 7 fail ;
- échecs ciblés : contrat Combat Rules absent, overlay absent, mapping visuel absent, adaptateur visuel absent, ownership UI encore incorrect.

Correction Combat Rules :

- nouveau contrat : `CaptureCombatRulesEditorDraftV1` ;
- propriétaire unique des réglages communs de la preview :
  - énergie max ;
  - énergie initiale ;
  - récupération ;
  - intervalle de récupération ;
  - coût de déplacement ;
  - modificateur de charge ;
- ces six valeurs ne sont plus écrites lors du chargement d'une créature ;
- une nouvelle créature ne les réinitialise plus ;
- elles ne déclenchent plus `creatureDirty` ;
- le transport legacy présent dans `CaptureCreatureEditorDraftV3.combat` est conservé uniquement pour compatibilité ;
- au lancement du combat, `applyCaptureCombatRulesToCreatureDraftV1()` applique explicitement la règle commune au draft local et au draft adverse ;
- HP / HP initiaux restent propriété de la fiche créature.

Correction UI :

- « Énergie de la créature » devient « Règles d'énergie du combat » ;
- le texte précise que ces valeurs s'appliquent à la session et ne changent pas avec la créature ;
- l'identifiant de profil HTML `serpent` a été réaligné sur le profil canonique `serpentine`.

Auto-raccord visuel :

- bibliothèque autoritaire : branche `global-assets`, metadata créature ;
- aucun asset copié dans la branche de travail ;
- aucun matching par nom ;
- mapping explicite par ID historique :
  - `crea_maraileron -> maraileron` ;
  - `crea_voltik -> voltige` ;
  - `crea_ailevent -> ailevent` ;
  - `crea_galewing -> ailevent` (alias historique explicite) ;
- raccord automatique :
  - face = asset opponent ;
  - dos = asset player ;
  - icône ;
  - profil ;
  - `displayScale.player` ;
  - sockets bouche / tête / mains-pattes / queue depuis `fxAnchors` ;
- le catalogue global est vérifié avant binding : un asset absent provoque une erreur explicite ;
- une metadata ne correspondant pas au `metaId` attendu est refusée ;
- une créature sans mapping visuel reste éditable sans art inventé.

Audit assets :

- Maraileron, Voltige et Ailevent disposent de metadata correspondant réellement au roster historique ;
- Ailevent possède deux IDs runtime historiques et les deux mappings sont explicitement déclarés ;
- les autres packs visuels de vitrine (Loup volcanique, Golem moussu, Chat mystique, Guêpe cybernétique, Renard magique doré, Braisombre) ne sont pas collés arbitrairement sur une autre fiche des 110 ;
- Aquafin et Braiseau n'ont actuellement aucun pack présent sur la branche `global-assets` auditée.

Validation technique :

- commit UI fonctionnel : `8ceb245f1f8d184545ea31e097e9b37b0bff86f7` ;
- CI : `36606451762` — SUCCESS ;
- 521 tests, 521 pass, 0 fail.

État :

**GREEN technique / PREVALIDATION smartphone**.

À vérifier sur téléphone :

1. modifier les règles d'énergie, changer de créature, vérifier qu'elles restent inchangées ;
2. modifier uniquement les règles Combat puis lancer la preview sans devoir mettre à jour la créature ;
3. charger Maraileron, Voltige puis Ailevent et vérifier face/dos/icône/scale/sockets ;
4. charger une créature sans art et vérifier qu'elle reste éditable.


## Micro-lot — defaults vitrine créatures : positions + compétences V1 — 2026-09-29

Base :

- checkpoint PREVALIDATION précédent : `checkpoint/lab-creature-ownership-visual-autolink-v1-prevalidation-green-2026-09-29` ;
- SHA : `d02ada41b94c6b8b0bf1107f31380084e16c83d9`.

Checkpoint départ :

`checkpoint/lab-start-creature-showcase-defaults-v1-2026-09-29`.

Branche :

`work/lab-creature-showcase-defaults-v1-2026-09-29`.

Retour utilisateur :

- les créatures déjà liées à des visuels doivent aussi disposer d'une position de présentation ;
- leurs compétences historiques GenSrpG doivent être pré-associées ;
- ces valeurs constituent les defaults de la version vitrine ; les joueurs pourront ensuite personnaliser leurs propres créatures.

Source historique compétences démontrée dans le fichier GenSrpG fourni :

- chaque espèce possède `abilityIds` ;
- `captureCreatureAvailableMoves()` filtre les capacités par niveau requis ;
- `captureOpenCreatureDetail()` initialise `activeAbilityIds` avec les capacités dont le niveau requis est inférieur ou égal au niveau courant, puis applique `slice(0, maxMoves)` ;
- `captureCreatureProgressRules()` définit `maxMoves: 4` par défaut ;
- aucune sélection arbitraire nouvelle ne doit remplacer cette règle.

Position / présentation :

- `VisualActor` possède déjà `position {x,y}` ;
- le Demo Visual Source historique sait déjà lire `meta.offset` ;
- les metadata global-assets possèdent déjà `offset` et `transformOrigin` ;
- le chemin Capture Editor -> native visual source ne transporte actuellement pas ces données ;
- la correction doit donc transporter les données de présentation existantes au lieu d'ajouter une correction CSS locale.

Objectifs :

1. initialiser le loadout actif d'une créature historique avec les capacités historiques autorisées à son niveau, maximum 4 ;
2. ne jamais inventer une capacité absente de son `abilityIds` / catalogue Capture autorisé ;
3. si une capacité historique ne possède pas d'équivalent runtime sûr, la conserver comme connaissance mais ne pas rendre le combat invalide silencieusement ;
4. transporter position / transformOrigin depuis la metadata visuelle jusqu'au VisualActor ;
5. le propriétaire de la position reste la metadata de présentation, pas la page HTML ni le renderer ;
6. une créature sans position explicite garde `{x:0,y:0}`.

Protégé :

- Combat Runtime ;
- Animation Core ;
- renderer ;
- catalogue 110 ;
- aucun localStorage/sessionStorage ;
- aucune heuristique par nom ;
- aucun merge sur main.

Critère final :

- RED ciblé ;
- règle historique de loadout testée ;
- position transportée de façon data-driven ;
- CI complète verte ;
- preview PREVALIDATION smartphone.


### Résultat — defaults vitrine créatures : positions + compétences V1

Règle historique des compétences confirmée depuis le fichier GenSrpG fourni :

- les espèces conservent leur ordre `abilityIds` ;
- seules les capacités dont `requiredLevel <= creature.level` sont candidates ;
- maximum historique : `maxMoves = 4` ;
- l'ordre historique est conservé ;
- aucune capacité plus tardive ne remplace silencieusement une capacité historique active indisponible au runtime.

Implémentation :

- nouveau propriétaire : `src/catalogs/capture-creature-historical-loadout-v1.js` ;
- le Human Editor dérive le loadout après chargement des catalogues de capacités runtime ;
- les slots actifs sont préremplis automatiquement quand l'équivalent runtime existe ;
- une capacité historique sans équivalent runtime sûr reste connue dans `historicalActiveIds` mais son slot runtime reste vide ;
- aucune capacité étrangère au `abilityIds` de la créature n'est inventée.

Position / présentation :

- `CreaturePresentationBindingV2` transporte désormais explicitement :
  - `displayScale` ;
  - `position {x,y}` ;
  - `transformOrigin` ;
- `applyCaptureCreatureVisualBindingV1()` prend ces valeurs depuis la metadata autoritaire `global-assets` ;
- `capture-export-to-native-visual-source-v1` les transmet jusqu'au Visual Source ;
- `creature-presentation-to-visual-actor-v2` les transmet au `VisualActor` ;
- le renderer et le Combat Core restent inchangés ;
- une créature sans offset explicite utilise `{x:0,y:0}`.

Audit des offsets existants :

- les metadata global-assets actuelles de Maraileron, Voltige et Ailevent déclarent encore `offset {x:0,y:0}` ;
- les anciennes metadata de test auditées pour Maraileron/Braisombre déclarent elles aussi `{x:0,y:0}` ;
- aucun ancien offset non nul validé n'a été retrouvé ;
- aucune valeur arbitraire n'a donc été inventée dans ce lot.

RED / tests :

- `tests/unit/capture-creature-showcase-defaults-v1.test.mjs` ;
- loadout historique déterministe ;
- niveau requis ;
- plafond 4 capacités ;
- absence d'invention de capacité ;
- transport position / transformOrigin ;
- préservation de la position lors de la mise à jour d'une créature liée.

CI finale :

- SHA : `0f348615b9ba8e5546aee703dc9ffb48131c3efb` ;
- run : `36610888560` ;
- 529 tests, 529 pass, 0 fail.

État :

**GREEN technique / PREVALIDATION smartphone.**

À vérifier :

1. charger Maraileron, Voltige et Ailevent et vérifier que leurs slots de capacités se préremplissent ;
2. vérifier que les capacités non disponibles au runtime ne sont pas remplacées par une autre capacité arbitraire ;
3. lancer la preview et vérifier le placement de chaque créature ;
4. si une créature doit être décalée, définir son offset dans la metadata autoritaire plutôt que via CSS/UI locale.


## Micro-lot — liaisons vitrine créatures + styles de position V1 — 2026-09-29

Base :

- checkpoint PREVALIDATION précédent : `checkpoint/lab-creature-showcase-defaults-v1-prevalidation-green-2026-09-29` ;
- SHA : `9299eb03172b97833c3c2795915c9f0e90cf2958`.

Checkpoint départ :

`checkpoint/lab-start-showcase-creature-style-bindings-v1-2026-09-29`.

Branche :

`work/lab-showcase-creature-style-bindings-v1-2026-09-29`.

Validation utilisateur explicite des associations vitrine :

- `crea_voltik` / Voltige -> pack `voltige` -> profil `biped` ;
- `crea_ailevent` et alias historique `crea_galewing` / Ailevent -> pack `ailevent` -> profil `biped` ;
- `crea_maraileron` / Maraileron -> pack `maraileron` -> profil `serpentine` ;
- `crea_mossback` / Moussados (nom historique correspondant au retour « Moussadon ») -> pack `golem_moussu` -> profil `massive` ;
- `crea_lumipup` et `crea_lumilo` / Lumilo -> pack `renard_magique_dore` -> profil `biped` ;
- `crea_sparkmoth` et `crea_lucieclair` / Luciéclair -> pack `guepe_cybernetique` -> profil `serpentine`.

Diagnostic :

- les packs `global-assets` existent déjà et sont valides ;
- leur metadata `profile` actuelle est un default du pack et ne correspond pas toujours au style de position validé par l'utilisateur ;
- le binding explicite créature -> pack est donc le bon endroit pour porter le `profileId` de la créature ;
- l'éditeur expose déjà `massive` sous le libellé « Massif / golem », mais `data/profiles/massive.profile.json` n'existe pas encore dans le runtime ;
- la preview ne charge actuellement que `biped`, `quadruped`, `serpentine`, `drake`.

Objectifs :

1. rendre le profil de position explicite dans chaque binding vitrine ;
2. ne plus dériver le profil créature depuis `creatureMeta.profile` quand un binding explicite existe ;
3. ajouter le profil runtime canonique `massive` pour le style « Massif / golem » déjà exposé par l'éditeur ;
4. charger `massive` dans la preview ;
5. étendre les bindings uniquement aux IDs validés ci-dessus ;
6. conserver assets, scale, sockets, offset et transformOrigin depuis les metadata autoritaires des packs ;
7. aucune heuristique par nom.

Protégé :

- Combat Runtime ;
- Action Resolver ;
- renderer ;
- catalogue 110 ;
- compétences/loadouts historiques ;
- branche `global-assets` inchangée ;
- aucun localStorage/sessionStorage/global ;
- aucun merge sur main.

RED attendu :

- chaque ID validé retourne exactement le pack + profil attendu ;
- les deux aliases Ailevent/Lumilo/Luciéclair sont couverts explicitement ;
- Moussados retourne `golem_moussu + massive` ;
- l'adaptateur applique le `profileId` du binding plutôt que le default du pack ;
- `massive.profile.json` doit être un profil runtime valide et chargé par la preview.

Critère final :

- RED ciblé ;
- correction minimale ;
- CI complète verte ;
- checkpoint + preview PREVALIDATION smartphone.


### Résultat — liaisons vitrine créatures + styles de position V1

Associations utilisateur appliquées explicitement :

- Voltige `crea_voltik` -> pack `voltige` ;
- Ailevent `crea_ailevent` + alias `crea_galewing` -> pack `ailevent` ;
- Maraileron `crea_maraileron` -> pack `maraileron` ;
- Moussados `crea_mossback` -> pack `golem_moussu` ;
- Lumilo `crea_lumipup` + `crea_lumilo` -> pack `renard_magique_dore` ;
- Luciéclair `crea_sparkmoth` + `crea_lucieclair` -> pack `guepe_cybernetique`.

Correction d'architecture après audit charte :

- une première implémentation faisait porter un `profileId` au binding créature tout en conservant `creatureMeta.profile` dans `global-assets` ;
- cette structure créait deux sources possibles pour la même responsabilité ;
- elle a été retirée avant checkpoint ;
- `CAPTURE_CREATURE_VISUAL_BINDINGS_V1` ne porte désormais que la liaison explicite `creatureId -> metaId/metaFile` ;
- `applyCaptureCreatureVisualBindingV1()` lit uniquement `creatureMeta.profile` ;
- la metadata du pack visuel est donc l'unique autorité active du style de position ;
- une sentinelle interdit le retour de `profileId` dans les bindings créature.

Sous-lot `global-assets` séparé :

- base stable : `1d53c854f9dc78904ddf67b75cfd7290d3702193` ;
- checkpoint départ : `checkpoint/global-assets-before-showcase-profile-fix-2026-09-29` ;
- branche : `work/global-assets-showcase-profile-fix-2026-09-29` ;
- checkpoint GREEN : `checkpoint/global-assets-showcase-profile-fix-green-2026-09-29` ;
- SHA publié sur `global-assets` : `570b37edb26156a3e84256ef1be18eb07d697eca`.

Metadata autoritaires publiées :

- `voltige.profile = biped` ;
- `ailevent.profile = biped` ;
- `maraileron.profile = serpentine` (déjà correct) ;
- `golem_moussu.profile = massive` ;
- `renard_magique_dore.profile = biped` ;
- `guepe_cybernetique.profile = serpentine`.

Profil Massif / golem :

- ajout de `data/profiles/massive.profile.json` dans le lot fonctionnel ;
- l'éditeur exposait déjà la valeur `massive` mais le runtime ne possédait aucun profil correspondant ;
- `massive` est désormais un vrai `Creature Profile` enregistré et chargé par la preview ;
- son comportement d'animation initial reste volontairement conservateur ; aucun réglage gameplay n'y est placé.

RED fonctionnel :

- SHA : `51270401df70bbc1882cd82b973ac064375681bd` ;
- run : `36619179079` ;
- 533 tests, 529 pass, 4 fail attendus.

Validation finale après suppression de la double autorité :

- fonctionnel SHA : `5bc9911a4da40ebaa92ba5f3aabd1f050afa8a5c` ;
- CI fonctionnelle : `36620130434` ;
- 533 tests, 533 pass, 0 fail ;
- CI `global-assets` : `36620006556` ;
- 197 tests, 197 pass, 0 fail ;
- vérification directe de la branche stable `global-assets` : 6/6 metadata correspondent aux profils validés.

Invariants finaux :

- un seul propriétaire du style de position : metadata `global-assets` ;
- un seul propriétaire du preset morphologique : `Creature Profile` ;
- binding créature = liaison explicite vers un pack, sans profil concurrent ;
- aucun CSS spécial par créature ;
- aucun masquage ;
- aucun fallback qui écrase silencieusement un profil ;
- Combat Runtime, Action Resolver et renderer inchangés ;
- catalogue 110 et loadouts historiques inchangés.

État :

**GREEN technique / PREVALIDATION smartphone.**



## Micro-lot — Capture Stats / Progression Architecture V1 — 2026-09-29

Base :

- checkpoint PREVALIDATION styles vitrine : `checkpoint/lab-showcase-creature-style-bindings-v1-prevalidation-green-2026-09-29` ;
- SHA : `6765ae6f0cae4d2b654494ab89c34ebc55b12b96` ;
- CI base : `36620295008` — SUCCESS ;
- 533 tests, 533 pass, 0 fail.

Checkpoint départ :

`checkpoint/lab-start-capture-stats-progression-architecture-v1-2026-09-29`.

Branche :

`work/lab-capture-stats-progression-architecture-v1-2026-09-29`.

### Préaudit propriétaire

Dungeon / GenSrpG historique audité :

- `DUNGEON_DEFAULT_ATTRIBUTES` reste une liste codée en dur ;
- les labels/statuts Dungeon sont rendus depuis des tables fixes ;
- les formules `Force / Agilité / Intelligence / Esprit / Endurance / Initiative` sont implémentées par fonctions dédiées ;
- aucun registre générique extensible de statistiques réutilisable n'a été démontré ;
- ce système historique ne sera donc ni copié ni utilisé comme seconde autorité.

Labo audité :

- `CaptureCreatureEditorDraftV3.sourceStats` hérite encore du bloc rigide V1 à six stats ;
- `CaptureSkillEditorDraftV1.requiredLevel` est déjà le propriétaire du niveau requis d'une capacité ;
- `CaptureActiveSkillLoadoutV1` possède quatre slots fixes historiques ;
- `capture.evolution { condition, level, targetId }` existe déjà dans le contrat créature et reste l'unique mécanisme d'évolution ;
- `CaptureCombatRulesEditorDraftV1` reste propriétaire des règles communes énergie/déplacement/charge ;
- l'export V3 compose déjà les contrats créature/compétence/loadout mais ne possède pas encore de registre de stats ni de politique générale de déblocage.

### Objectif V1

Créer les propriétaires de données génériques nécessaires avant tout raccord UI massif :

1. registre de stats Capture extensible, avec stats standard et stats personnalisées ;
2. liens optionnels d'une stat vers un canal de dégâts et/ou de résistance ;
3. paramètres d'influence configurables, sans formule codée dans l'UI ;
4. valeurs de stats d'une créature séparées de la définition du registre ;
5. politique générale de déblocage des slots actifs selon le niveau ;
6. conserver `requiredLevel` sur la capacité ;
7. conserver l'évolution existante `targetId + level` sans second mécanisme ;
8. fournir une projection de compatibilité depuis les stats historiques Monster Capture.

### Propriétaires prévus

- définition/registre des stats : nouveau contrat Capture dédié sous `src/contracts/` ;
- valeurs de stats d'une créature : contrat dédié, référencé par l'adaptateur Capture ;
- politique de progression des slots : nouveau contrat Capture Progression Rules sous `src/contracts/` ;
- calcul gameplay dégâts/résistances : hors scope de ce premier jalon tant que les coefficients finaux ne sont pas validés ;
- UI : hors scope du premier RED contractuel, raccord séparé après validation des propriétaires.

### Fichiers autorisés V1

- `src/contracts/capture-stat-registry-v1.js` ;
- `src/contracts/capture-creature-stat-values-v1.js` ;
- `src/contracts/capture-progression-rules-v1.js` ;
- `src/adapters/input/capture/monster-capture-stat-values-v1.js` ;
- `data/capture/monster-capture-stat-registry.v1.json` ;
- `data/capture/monster-capture-progression-rules.v1.json` ;
- tests unitaires dédiés ;
- documentation du présent lot.

Protégé :

- Combat Runtime ;
- Action Resolver ;
- Animation Core / FX / renderer ;
- Human Editor existant dans ce premier jalon contractuel ;
- catalogue 110 original ;
- mécanisme d'évolution existant ;
- `requiredLevel` des capacités ;
- aucun localStorage/sessionStorage/global ;
- aucun merge sur `main`.

### RED prévu

- absence de registre stat extensible ;
- absence de contrat valeurs de stats indépendant des définitions ;
- absence de politique générale de slots par niveau ;
- aucune projection standard des données historiques vers `hp/speed/physical/elements` ;
- validation des IDs, doublons, canaux et schedule non disponible.

### Risques

- ne pas faire du registre une seconde source de vérité des HP ; HP reste propriété de la créature/Combat State ;
- ne pas dupliquer résistances historiques et stat-derived resistance sans règle explicite ultérieure ;
- ne pas déplacer `requiredLevel` depuis le contrat capacité ;
- ne pas imposer aujourd'hui une formule de dégâts/résistance non validée ;
- préserver la compatibilité du catalogue historique pendant la migration future.

### Critère de fin du jalon contractuel

- RED ciblé ;
- propriétaires uniques documentés ;
- stats standard configurées par données, plus support custom ;
- politique de slots configurable et déterministe ;
- compatibilité historique testée ;
- CI complète verte ;
- aucun changement UI/runtime visuel.


### Résultat — Capture Stats / Progression Architecture V1

Préaudit confirmé :

- aucun registre extensible de statistiques réutilisable n'a été démontré dans Dungeon ;
- `CaptureCreatureEditorDraftV3.sourceStats` reste l'ancien bloc rigide de compatibilité ;
- `CaptureSkillEditorDraftV1.requiredLevel` reste propriétaire du niveau requis d'une capacité ;
- `capture.evolution` reste le mécanisme unique d'évolution ;
- `CaptureCombatRulesEditorDraftV1` reste propriétaire des règles communes énergie/déplacement/charge.

RED :

- SHA : `1106f5c420ee48d34557ada27ff4b43f28ea9a72` ;
- run : `36623531698` ;
- 538 tests, 533 pass, 5 fail ciblés ;
- causes : registres/contrats/adaptateur de stats et politique de progression volontairement absents.

Implémentation minimale :

- `src/contracts/capture-stat-registry-v1.js` ;
- `src/contracts/capture-creature-stat-values-v1.js` ;
- `src/contracts/capture-progression-rules-v1.js` ;
- `src/adapters/input/capture/monster-capture-stat-values-v1.js` ;
- `data/capture/monster-capture-stat-registry.v1.json` ;
- `data/capture/monster-capture-progression-rules.v1.json`.

Propriétés démontrées :

- registre de stats extensible, sans liste de stats custom codée dans le moteur ;
- mapping optionnel vers canal de dégâts et canal de résistance ;
- coefficients `damagePerPoint` / `resistancePerPoint` configurables par données ;
- valeurs de stats de créature séparées du registre ;
- HP volontairement exclu du registre pour conserver l'autorité créature/Combat State ;
- politique générale de slots actifs séparée de `requiredLevel` ;
- compatibilité historique déterministe vers `speed`, `physical` et statistiques élémentaires ;
- aucune déduction de résistance depuis un type/DOM/UI.

Premier GREEN :

- SHA : `396480f3c228ea7d02172a566e3bac05ff83a438` ;
- run : `36623949475` ;
- 538 tests, 538 pass, 0 fail.

Sentinelles renforcées :

- SHA : `de7fb90b1a0bf3ec2a4ce6d4be61bf4fb619261a` ;
- run : `36624084734` ;
- 542 tests, 542 pass, 0 fail ;
- doublons de stats refusés ;
- HP absent du registre ;
- coefficients custom testés ;
- schedules invalides refusés ;
- preset 2/3/4 slots aux niveaux 1/10/20 validé.

Aucun changement dans :

- Human Editor ;
- Combat Runtime ;
- Action Resolver ;
- Animation Core / FX / renderer ;
- catalogue historique 110 ;
- mécanisme d'évolution existant.

État :

**GREEN contractuel / architecture.**

Lot suivant séparé : **Capture Stats / Progression Editor UI V1** pour raccorder le Human Editor aux propriétaires validés, exposer les stats standard/custom, la politique de slots et l'évolution existante, puis produire une preview PREVALIDATION smartphone.


## Micro-lot — Capture Stats / Progression Editor UI V1 — 2026-09-29

Base :

- checkpoint GREEN architecture : `checkpoint/lab-capture-stats-progression-architecture-v1-green-2026-09-29` ;
- SHA : `cd6d8ceab41785fb915c4f790022fb439c9063d8` ;
- CI : `36624384434` — SUCCESS ;
- 542 tests, 542 pass, 0 fail.

Checkpoint départ :

`checkpoint/lab-start-capture-stats-progression-editor-ui-v1-2026-09-29`.

Branche :

`work/lab-capture-stats-progression-editor-ui-v1-2026-09-29`.

### Objectif

Raccorder le Human Editor aux propriétaires Stats / Progression validés, sans déplacer les règles métier dans le DOM :

1. afficher les stats standard Monster Capture depuis le registre data-driven ;
2. permettre l'ajout/suppression de stats personnalisées dans le draft de registre de la session ;
3. éditer les valeurs de stats de la créature via `CaptureCreatureStatValuesV1` ;
4. exposer la politique générale `maxActiveSkills + slotUnlockSchedule` depuis `CaptureProgressionRulesV1` ;
5. rendre les slots actifs lisibles selon le niveau de la créature, sans déplacer `requiredLevel` hors du contrat capacité ;
6. exposer le mécanisme d'évolution déjà existant : activée/non, cible par ID explicite, niveau ;
7. ne créer aucun second mécanisme de stats, progression ou évolution ;
8. préserver les anciennes données `sourceStats` uniquement comme compatibilité tant que la migration du contrat créature n'est pas un lot séparé.

### Propriétaires

- définitions stats : `CaptureStatRegistryV1` ;
- valeurs stats : `CaptureCreatureStatValuesV1` ;
- politique slots : `CaptureProgressionRulesV1` ;
- niveau requis capacité : `CaptureSkillEditorDraftV1.requiredLevel` ;
- évolution : `CaptureCreatureEditorDraftV3.capture.evolution` ;
- Human Editor : saisie/présentation et draft de session seulement.

### Fichiers autorisés

- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- `examples/dom-demo/capture-editor-v2.css` si nécessaire uniquement pour la lisibilité ;
- tests unitaires/intégration dédiés ;
- `docs/LAB_CURRENT_WORK.md` ;
- `docs/LAB_ARCHITECTURE.md` uniquement si une frontière nouvelle est démontrée.

Protégé :

- contrats Stats / Progression validés au lot précédent, sauf bug démontré par RED ;
- Combat Runtime ;
- Action Resolver ;
- Animation Core / FX / renderer ;
- catalogue historique 110 ;
- global-assets ;
- aucun localStorage/sessionStorage ;
- aucun MutationObserver/timer/retry/monkey patch ;
- aucun merge sur `main`.

### Préaudit attendu avant RED

- localiser les champs stats rigides actuels ;
- localiser la collecte `capture.evolution` actuellement absente/neutralisée dans l'UI ;
- localiser les quatre slots fixes du Human Editor ;
- vérifier comment le mount conserve les données de session sans persistance navigateur ;
- définir le vrai chemin : data JSON -> contrats -> Human Editor -> draft validé.

### Critère de fin

- RED ciblé ;
- correction minimale ;
- CI complète verte ;
- preview dédiée ;
- PREVALIDATION smartphone sur stats, custom stat, progression et évolution ;
- pas de GREEN UI final sans retour utilisateur.


### Résultat — Capture Stats / Progression Editor UI V1

Préaudit UI démontré :

- stats visibles encore codées en dur : Force / Agilité / Intelligence / Esprit / Endurance / Initiative ;
- `readCreatureFields()` imposait `capture.evolution: null` ;
- quatre slots existaient sans consommation de la politique générale de progression ;
- `requiredLevel` existait bien sur les capacités mais n'était pas composé avec le déblocage des slots dans le Human Editor ;
- l'état d'édition reste en mémoire de session dans les Maps du mount, sans persistance navigateur.

RED :

- SHA : `5dccb2638d758c271cd985799e2e236852c145bf` ;
- run : `36624892297` ;
- 548 tests, 542 pass, 6 fail ciblés ;
- causes : surfaces stats/progression/évolution absentes et ancienne priorité de préservation de l'évolution.

Implémentation UI :

- SHA : `72489e970d4d955fb76d4259d532202d516d9235` ;
- stats affichées depuis le registre data-driven ;
- ajout d'une stat personnalisée par ID explicite ;
- libellé, canaux dégâts/résistance et coefficients éditables dans le draft de registre de session ;
- valeurs de stats de créature validées par `CaptureCreatureStatValuesV1` ;
- HP reste dans sa carte dédiée et n'est pas dupliqué dans le registre ;
- anciennes résistances déplacées sous une zone « compatibilité » distincte ;
- évolution activable avec cible catalogue par ID et niveau ;
- progression globale affichée depuis `CaptureProgressionRulesV1` ;
- slots verrouillés selon le niveau ;
- capacités au-dessus de `requiredLevel` signalées et refusées ;
- aucune recherche heuristique par nom ;
- aucun localStorage/sessionStorage/MutationObserver/timer/retry/monkey patch ajouté.

Régression CI détectée puis corrigée :

- la première correction faisait perdre une évolution historique dans un appel où le champ restait volontairement non représenté ;
- cause : absence de distinction entre « évolution explicitement éditée » et « champ non représenté » ;
- correction minimale : `evolutionRepresented` vaut false par défaut pour préserver la compatibilité, et vaut true uniquement sur le vrai chemin du nouvel éditeur ;
- SHA correction : `d9c4fe3b38661d7fd5a17a1e4f9370c89ba089fd` ;
- run : `36625737885` ;
- 548 tests, 548 pass, 0 fail.

Durcissement progression :

- SHA : `33eadc300c2318bf3645e9cbd7ef46b5380824f3` ;
- run : `36625982026` ;
- 549 tests, 549 pass, 0 fail ;
- la politique de slots est vérifiée aussi sur le vrai chemin « Tester/Valider le combat », pas seulement lors d'une sauvegarde ;
- `requiredLevel` est vérifié séparément ;
- un slot historique devenu verrouillé reste éditable uniquement pour pouvoir être vidé, sans remplacement automatique de capacité.

Sentinelles de charte sur le Human Editor modifié :

- `localStorage` : 0 ;
- `sessionStorage` : 0 ;
- `MutationObserver` : 0 ;
- `setTimeout` / `setInterval` : 0 ;
- aucun nouveau fichier Combat Runtime / Action Resolver / Animation / FX / renderer modifié.

État :

**GREEN technique — PREVALIDATION smartphone requise.**

À valider sur smartphone :

1. changement de créature : valeurs de stats cohérentes et pas de reset des règles globales ;
2. ajout d'une stat personnalisée puis saisie d'une valeur ;
3. modification d'un libellé/canal/coefficient ;
4. évolution ON/OFF, choix cible et niveau ;
5. niveaux 1 / 10 / 20 : 2 / 3 / 4 slots selon le preset ;
6. capacité dont `requiredLevel` est supérieur au niveau : refus lisible ;
7. lisibilité mobile des nouvelles cartes et formulaires.

Aucun GREEN UI final avant retour smartphone de Sylvain.


## Micro-lot — Capture Stat Effects V1 — 2026-09-29

Base :

- PREVALIDATION Editor UI V1 : `a10ff7ea776f6e05e39e4aaa35bd3dc69dce5ba2` ;
- CI base : SUCCESS ;
- retour smartphone : stats présentes mais réglage des effets incompréhensible ; le reste du lot UI est jugé globalement correct.

Checkpoint départ :

`checkpoint/lab-start-capture-stat-effects-v1-2026-09-29`.

Branche :

`work/lab-capture-stat-effects-v1-2026-09-29`.

### Problème démontré

Le registre expose actuellement `damagePerPoint` et `resistancePerPoint` sans unité explicite dans le contrat ni dans l'éditeur. Le joueur ne peut donc pas savoir si « 1 » signifie +1 dégât, +1 %, un multiplicateur ou autre chose. La stat `speed` n'a par ailleurs aucun effet contractuel défini sur le temps de préparation des capacités.

### Objectif

1. rendre l'unité des effets explicite : **1 point = X % dégâts / Y % résistance** ;
2. introduire un effet Vitesse explicite : **1 point = -Z % temps de préparation/charge** ;
3. garder les effets pilotés par données et non codés dans le Human Editor ;
4. fournir un calcul pur/testable des modificateurs issus d'une valeur de stat ;
5. afficher dans le Human Editor une phrase compréhensible et le résultat effectif pour la valeur courante ;
6. ne pas encore modifier Combat Runtime / Action Resolver dans ce micro-lot ; le raccord gameplay réel fera l'objet d'un RED séparé après validation des unités.

### Propriétaires

- définition d'effet par point : `CaptureStatRegistryV1` ;
- valeur d'une stat de créature : `CaptureCreatureStatValuesV1` ;
- calcul de projection stat -> pourcentages : module pur dédié sous `src/core/capture/` ou `src/contracts/` selon préaudit ;
- Human Editor : présentation/saisie seulement ;
- Combat Runtime / Action Resolver : protégés dans ce lot.

### Préaudit / décision attendue avant RED

- vérifier toutes les consommations de `damagePerPoint` / `resistancePerPoint` ;
- vérifier si un renommage vers des champs explicitement en pourcentage peut être fait sans double autorité ;
- vérifier la stat `speed` et les anciens champs vitesse/initiative ;
- vérifier le meilleur propriétaire du calcul pur ;
- conserver HP hors registre.

### Protégé

- Combat Runtime ;
- Action Resolver ;
- Animation Core / FX / renderer ;
- catalogue historique 110 ;
- mécanisme d'évolution ;
- progression des slots ;
- `requiredLevel` ;
- aucun localStorage/sessionStorage ;
- aucun MutationObserver/timer/retry/monkey patch ;
- aucun merge sur `main`.

### Critère de fin

- RED ciblé ;
- unité % explicite dans le contrat et les données ;
- effet Vitesse explicite et calcul pur ;
- Human Editor lisible sur smartphone ;
- CI complète verte ;
- checkpoint PREVALIDATION + preview ;
- pas de GREEN UI final avant retour smartphone.


### Résultat — Capture Stat Effects V1

Retour smartphone traité :

- les stats étaient présentes mais les coefficients n'avaient aucune unité compréhensible ;
- le reste du lot Stats / Progression Editor UI V1 reste en PREVALIDATION.

RED :

- SHA : `828de8fe6180d82d194b1da28ed5e470ad439b90` ;
- run : `36633998421` ;
- 553 tests, 549 pass, 4 fail ciblés ;
- causes : unités % absentes, stat Vitesse sans effet contractuel, projection pure absente, résumé Human Editor absent.

Correction :

- `damagePerPoint` et `resistancePerPoint` sont supprimés du contrat actif ;
- propriétaires explicites : `damagePctPerPoint`, `resistancePctPerPoint`, `chargeTimeReductionPctPerPoint` ;
- les anciens noms ambigus sont refusés par le contrat au lieu de devenir une seconde autorité ;
- preset Monster Capture : 1 point = +1 % dégâts / +1 % résistance pour les canaux standards ;
- Vitesse : 1 point = -1 % temps de charge dans le preset, valeur data-driven donc configurable ;
- nouveau calcul pur : `src/core/combat/capture-stat-effects-v1.js` ;
- résultat du calcul : bonus dégâts % par canal, résistance % par canal, réduction % du temps de charge ;
- aucun effet n'est encore appliqué au Combat Runtime / Action Resolver dans ce lot.

Human Editor :

- affiche « 1 point = X % … » ;
- affiche également le résultat total pour la valeur courante ;
- le résumé se met à jour pendant la saisie ;
- les réglages système ont des libellés visibles : Dégâts % / point, Résistance % / point, Réduction charge % / point ;
- les stats personnalisées peuvent aussi définir ces trois coefficients.

GREEN technique :

- SHA fonctionnel avant documentation : `364c22d8bdc42da9ba16026cfd3f2af6e0f72c4a` ;
- run : `36634464820` ;
- 554 tests, 554 pass, 0 fail.

Revue charte :

- fichiers modifiés limités au contrat/données stats, calcul pur, Human Editor, démo, tests et documentation ;
- `localStorage` : 0 ;
- `sessionStorage` : 0 ;
- `MutationObserver` : 0 ;
- `setTimeout` / `setInterval` : 0 dans le Human Editor modifié ;
- Action Resolver, Combat Runtime, Animation Core, FX et renderer inchangés.

État :

**GREEN technique — PREVALIDATION smartphone.**

Lot suivant séparé : raccord gameplay réel des effets Stats (dégâts/résistances et Vitesse -> temps de charge), avec RED dédié avant toute modification du Combat Runtime / Action Resolver.


## Micro-lot — Capture Stat Runtime Effects V1 — 2026-09-29

Base :

- checkpoint PREVALIDATION Stats Effects V1 : `checkpoint/lab-capture-stat-effects-v1-prevalidation-green-2026-09-29` ;
- SHA : `29d7d9db1cd6cc0b3506d4398ea0196fbe951184` ;
- CI : `36634576773` — SUCCESS ;
- 554 tests, 554 pass, 0 fail.

Checkpoint départ :

`checkpoint/lab-start-capture-stat-runtime-effects-v1-2026-09-29`.

Branche :

`work/lab-capture-stat-runtime-effects-v1-2026-09-29`.

### Objectif

Brancher les modificateurs Stats validés sur le gameplay réel, sans recopier les formules dans l'UI :

1. bonus de dégâts % du canal de l'attaque ;
2. bonus de résistance % du canal reçu ;
3. réduction du temps de préparation/charge issue de la Vitesse ;
4. conserver le calcul des modificateurs dans `capture-stat-effects-v1.js` comme source unique ;
5. raccorder ces modificateurs par données explicites d'acteur, jamais par DOM/nom/type déduit ;
6. ne pas modifier Animation/FX/renderer.

### Préaudit obligatoire avant RED

- localiser le propriétaire actuel des dégâts dans Action Resolver ;
- localiser le propriétaire actuel du temps de préparation dans Combat Runtime / Combat Timing ;
- tracer le vrai chemin Editor/Export -> Battle actor -> CombatSession/Runtime ;
- vérifier l'ancien `skillSpeedMultiplier` afin d'éviter deux sources de vérité avec la Vitesse ;
- définir où les `statEffects` calculés doivent être attachés au snapshot d'acteur ;
- identifier la règle de combinaison avec résistances historiques si celles-ci sont encore actives.

### Contraintes

- aucun calcul stat dans le Human Editor ;
- aucun scan DOM ;
- aucune heuristique par nom de créature ;
- aucune seconde horloge ;
- aucune seconde formule dégâts/résistance ;
- pas de suppression silencieuse de `skillSpeedMultiplier` sans migration démontrée ;
- aucune modification de `main`.

### RED attendu

- dégâts d'une capacité physique/élémentaire inchangés malgré bonus de stat ;
- résistance de stat non appliquée au canal reçu ;
- temps de préparation inchangé malgré réduction de charge issue de Vitesse ;
- sentinelle de composition avec les règles existantes.

### Critère de fin

- cause démontrée ;
- correction minimale ;
- tests unitaires + intégration du vrai chemin ;
- CI complète verte ;
- documentation synchronisée ;
- checkpoint technique avant lot Prérequis/Ultimes.


### Résultat — Capture Stat Runtime Effects V1

Préaudit confirmé :

- dégâts autoritaires appliqués dans `Action Resolver` ;
- temps de préparation autoritaire calculé par `effectivePreparationMs()`, puis vitesse globale appliquée séparément par `effectiveSkillTimingMs()` ;
- `skillSpeedMultiplier` reste une règle globale du combat de test et n'est pas remplacé par la stat Vitesse ;
- l'export V3 ne transportait pas encore les nouvelles valeurs de stats : aucun raccord runtime propre n'existait ;
- les résistances historiques restent metadata de compatibilité et ne sont pas appliquées au runtime actuel.

RED :

- SHA : `8d4590067af2e0472756604e0d7934a5cc9ee8a5` ;
- run : `36635155420` ;
- 557 tests, 554 pass, 3 fail ciblés ;
- les trois échecs étaient causés par l'absence de `statRegistry/statValues` dans la frontière Export V3.

Raccord réalisé :

- `Capture Editor Exporter V3` accepte ensemble `statRegistry + statValues` ;
- les valeurs sont validées par leurs propriétaires existants ;
- le calcul pur `projectCaptureStatEffectsV1()` reste l'unique formule stat -> modificateurs ;
- l'export écrit un snapshot dérivé dans `creature.combat.statEffects` ;
- ce snapshot contient uniquement : bonus dégâts % par canal, résistance % par canal et réduction de charge % ;
- `capture-creature-to-fighter-config` valide et transporte ce snapshot ;
- la réduction issue de Vitesse est composée une seule fois dans le propriétaire existant `chargeTimeModifierPct` ;
- le `skillSpeedMultiplier` global reste séparé et s'applique ensuite ;
- `CombatState` conserve les maps de canaux ;
- `Action Resolver` applique le canal `skill.element`, ou `physical` lorsque l'élément est nul ;
- formule : dégâts de base -> bonus dégâts % attaquant -> résistance % cible ;
- résistance >= 100 % donne 0 dégât, jamais une valeur négative ;
- dégâts calculés stabilisés à 2 décimales pour éviter les résidus flottants ;
- événement `hit` expose `baseDamage`, `damageChannel`, `damageBonusPct`, `resistancePct`, `damage`.

Vrai chemin démontré :

`Human Editor -> Export V3 -> Capture adapter stack -> Fighter -> CombatSession -> Action Resolver`.

Exemple sentinelle :

- capacité Feu : 100 dégâts de base ;
- attaquant : +20 % Feu ;
- cible : +25 % résistance Feu ;
- résultat : 90 dégâts ;
- Vitesse : -10 % préparation ;
- vitesse globale de test x2 ;
- préparation 1000 ms -> 900 ms -> 450 ms.

Premier GREEN :

- SHA : `478951eb2afafd2ccb3a10f45c616dfc4ddedd44` ;
- run : `36635362031` ;
- 557 tests, 557 pass, 0 fail.

Durcissement :

- canal physique sans élément ;
- résistance >= 100 % ;
- vrai builder `buildHumanEditorExportV3()` ;
- une sentinelle a détecté `88.00000000000001` au lieu de `88` ;
- correction à la source par stabilisation des dégâts à 2 décimales.

GREEN final :

- SHA fonctionnel : `8479249a5019e9ad3c2df373df6b6dbf291b60f8` ;
- run : `36635506934` ;
- 560 tests, 560 pass, 0 fail.

Fichiers métier modifiés limités à :

- frontière Export V3 ;
- adapter créature -> fighter ;
- Combat State ;
- Action Resolver ;
- raccord Human Editor vers l'export ;
- tests dédiés.

Invariants :

- aucune formule de stats dans l'UI ;
- aucune heuristique par nom de créature ;
- aucun scan DOM métier ;
- aucune seconde horloge ;
- aucun second propriétaire du multiplicateur global ;
- Animation Core / FX / renderer inchangés ;
- anciennes résistances historiques non fusionnées implicitement avec le nouveau système.

État :

**GREEN technique.**

Lot suivant séparé : **Capture Skill Activation Requirements V1** pour les capacités ultimes/conditionnelles, en conservant `requiredLevel` comme propriétaire du niveau requis.


## Micro-lot — Capture Skill Activation Requirements V1 — 2026-09-29

Base :

- checkpoint GREEN Stats Runtime Effects V1 : `checkpoint/lab-capture-stat-runtime-effects-v1-green-2026-09-29` ;
- SHA : `18f0effddc3f032b3dcfa140668ffff399c64a16` ;
- CI : `36635649684` — SUCCESS ;
- 560 tests, 560 pass, 0 fail.

Checkpoint départ :

`checkpoint/lab-start-capture-skill-activation-requirements-v1-2026-09-29`.

Branche :

`work/lab-capture-skill-activation-requirements-v1-2026-09-29`.

### Besoin utilisateur

Permettre des capacités spéciales / ultimes qui ne deviennent activables qu'une fois des conditions de combat remplies, par exemple :

- après un certain temps de combat ;
- après avoir subi un certain total de dégâts ;
- après avoir infligé un certain total de dégâts ;
- selon un seuil de PV.

Le `requiredLevel` existant reste exclusivement le niveau requis pour apprendre/équiper la capacité et ne doit pas devenir une condition dynamique de combat.

### Objectif V1

1. définir un contrat data-driven de conditions d'activation ;
2. supporter une combinaison `all` ou `any` ;
3. fournir au minimum les conditions temps écoulé, dégâts infligés, dégâts subis et seuil de PV ;
4. conserver les compteurs nécessaires dans Combat State, pas dans l'UI ;
5. refuser le démarrage d'une compétence dont les conditions ne sont pas encore satisfaites, avant dépense d'énergie/cooldown ;
6. exposer une raison déterministe permettant ensuite à l'UI d'afficher pourquoi l'ultime est verrouillé ;
7. ne pas ajouter de timer parallèle : le temps utilisé est `CombatState.elapsedMs` ;
8. ne pas modifier Animation/FX/renderer.

### Préaudit obligatoire

- vérifier si un contrat de prérequis/activation existe déjà ;
- vérifier les métriques déjà possédées par Combat State ;
- tracer les points d'application des dégâts afin de compter dégâts infligés/subis une seule fois ;
- vérifier le flux `SkillDefinition -> Action Resolver -> Combat Runtime` ;
- vérifier où le Human Editor pourra ensuite saisir ces données sans devenir propriétaire ;
- définir la frontière avec `requiredLevel`, cooldown, énergie et réactions.

### Protégé

- `CaptureSkillEditorDraftV1.requiredLevel` ;
- politique de slots actifs ;
- stats/résistances/Vitesse validées ;
- Combat Runtime comme unique horloge ;
- Animation Core / FX / renderer ;
- aucun localStorage/sessionStorage ;
- aucun MutationObserver/timer/retry/monkey patch ;
- aucun merge sur `main`.

### Critère de fin contractuel/runtime

- RED ciblé ;
- contrat propriétaire unique ;
- métriques déterministes ;
- refus/acceptation d'activation testés ;
- aucune dépense sur refus ;
- CI complète verte ;
- documentation synchronisée ;
- checkpoint GREEN avant raccord UI dédié.


### Préaudit confirmé — Capture Skill Activation Requirements V1

État réel :

- aucun contrat d'activation dynamique n'existe dans `SkillDefinition` ;
- `requiredLevel` appartient à `CaptureSkillEditorDraftV1` et reste un verrou d'apprentissage/équipement, pas un état de combat ;
- `CombatState.elapsedMs` est déjà l'horloge unique du combat ;
- aucun compteur `damageDealtTotal` / `damageTakenTotal` n'existe encore ;
- les dégâts effectifs sont appliqués une seule fois dans `Action Resolver`, au moment de l'impact ;
- `resolveSkillStart()` est la frontière correcte pour refuser une activation avant dépense énergie/cooldown ;
- les réactions utilisent leur propre chemin `resolveReaction()` et devront consommer le même évaluateur si elles portent des conditions.

Décision de propriété :

- définition des conditions : `SkillDefinition.activationRequirements` ;
- types V1 : `combat_elapsed_ms`, `damage_dealt`, `damage_taken`, `hp_at_or_below_pct` ;
- combinaison : `all` ou `any` ;
- seuil : champ unique `threshold`, interprété selon le type ;
- métriques : `Combat State`, par combattant ;
- évaluation : module pur dédié sous `src/core/combat/` ;
- refus : `Action Resolver`, avant énergie/cooldown ;
- aucune donnée d'activation n'est dérivée du DOM, du nom d'une créature ou de `requiredLevel`.

Sémantique dégâts :

- dégâts infligés/subis = perte de PV réellement appliquée, donc l'overkill ne gonfle pas les compteurs ;
- un renvoi crédite le combattant qui a renvoyé comme source des dégâts ;
- les compteurs repartent avec le fighter lors d'un remplacement/reset, cohérent avec une condition portée par la créature active.


### Résultat — Capture Skill Activation Requirements V1

RED :

- SHA : `47f1b4e264c24b5e211dffc96805d0e2319310be` ;
- run : `36636195543` ;
- 566 tests, 560 pass, 6 fail ciblés ;
- causes démontrées : contrat absent, métriques dégâts absentes, évaluateur absent, verrouillage runtime absent.

Implémentation :

- `SkillDefinition.activationRequirements` devient le propriétaire des conditions dynamiques de combat ;
- modes : `all` / `any` ;
- conditions V1 :
  - `combat_elapsed_ms` ;
  - `damage_dealt` ;
  - `damage_taken` ;
  - `hp_at_or_below_pct` ;
- chaque condition possède un `threshold` explicite ;
- `requiredLevel` n'est pas déplacé et ne fait pas partie du runtime d'activation ;
- nouvel évaluateur pur : `src/core/combat/skill-activation-requirements-v1.js` ;
- l'évaluation expose pour chaque condition `type / threshold / current / satisfied` ;
- `resolveSkillStart()` refuse une compétence verrouillée avant énergie et cooldown avec `outcome: activation_requirements` ;
- les réactions consomment le même évaluateur ;
- le refus expose une raison déterministe réutilisable plus tard par l'UI.

Métriques Combat State :

- `damageDealtTotal` ;
- `damageTakenTotal` ;
- initialisées à 0 par combattant ;
- dégâts comptabilisés uniquement à l'impact réel ;
- l'overkill compte uniquement la perte de PV réellement subie ;
- un renvoi crédite le combattant qui renvoie comme source des dégâts ;
- reset du CombatSession réinitialise les métriques avec le fighter.

Temps :

- aucune nouvelle horloge ;
- `combat_elapsed_ms` lit exclusivement `CombatState.elapsedMs`.

GREEN fonctionnel :

- SHA : `ce29516103fa53365666b787913edddb400f59c2` ;
- run : `36636369652` ;
- 566 tests, 566 pass, 0 fail.

Durcissement :

- raison de verrouillage déterministe ;
- dégâts réfléchis ;
- conditions sur capacités de réaction ;
- reset des métriques ;
- vérification qu'aucun coût/cooldown n'est consommé lors d'un refus.

GREEN durci :

- SHA : `ec2f3c6188ae1b700605cda245b9a382744627ac` ;
- run : `36636460864` ;
- 570 tests, 570 pass, 0 fail.

Revue charte :

- aucun localStorage/sessionStorage ;
- aucun MutationObserver ;
- aucun timer parallèle ;
- aucun accès DOM dans contrat/Core ;
- aucun changement Animation Core / FX / renderer ;
- aucune heuristique par nom ;
- CombatState reste propriétaire des métriques ;
- Action Resolver reste propriétaire du refus de résolution ;
- SkillDefinition reste propriétaire de la définition de la condition.

État :

**GREEN technique runtime/contrat.**

Lot suivant séparé : **Capture Skill Activation Requirements Editor UI V1** pour rendre ces conditions configurables et compréhensibles dans le Human Editor, sans déplacer l'autorité métier dans l'UI.


## Micro-lot — Capture Skill Activation Editor UI V1 — 2026-09-29

Base :

- checkpoint GREEN runtime/contrat : `checkpoint/lab-capture-skill-activation-requirements-v1-green-2026-09-29` ;
- SHA : `c442568f7d38a8f8bd77e0b2412743fd2085083c` ;
- CI : `36636560118` — SUCCESS ;
- 570 tests, 570 pass, 0 fail.

Checkpoint départ :

`checkpoint/lab-start-capture-skill-activation-editor-ui-v1-2026-09-29`.

Branche :

`work/lab-capture-skill-activation-editor-ui-v1-2026-09-29`.

### Objectif

Rendre `SkillDefinition.activationRequirements` éditable et compréhensible dans le Human Editor sans créer une seconde logique métier.

UI V1 :

- activation des conditions ON/OFF ;
- mode « toutes les conditions » / « au moins une condition » ;
- ajout/suppression de lignes de condition ;
- types proposés :
  - temps de combat écoulé ;
  - dégâts infligés ;
  - dégâts subis ;
  - PV inférieurs ou égaux à X % ;
- seuil avec unité lisible ;
- les conditions sont enregistrées dans le contrat `SkillDefinition` existant ;
- les capacités sans condition restent inchangées ;
- `requiredLevel` reste affiché séparément et ne change pas de rôle.

### Préaudit obligatoire

- tracer `readSkillFields -> buildHumanSkillDraftV1 -> normalizeSkillDefinition` ;
- tracer le chargement d'une capacité existante vers les champs du formulaire ;
- vérifier les chemins « Nouvelle capacité », « Créer », « Modifier » ;
- vérifier le catalogue historique/natif et la préservation des champs non représentés ;
- vérifier la mise en page smartphone ;
- aucune évaluation des conditions dans l'UI.

### Protégé

- évaluateur runtime des conditions ;
- Combat State / Action Resolver ;
- stats / progression / évolution ;
- Animation Core / FX / renderer ;
- aucun stockage parallèle ;
- aucun timer/retry/MutationObserver/monkey patch ;
- aucun merge sur `main`.

### Critère de fin

- RED UI ciblé ;
- édition round-trip des conditions ;
- aucun effacement lors du chargement/modification d'une capacité ;
- libellés/units compréhensibles sur smartphone ;
- CI complète verte ;
- checkpoint PREVALIDATION + preview smartphone.


### Préaudit confirmé — Capture Skill Activation Editor UI V1

Chemin réel :

`readSkillFields() -> buildHumanSkillDraftV1() -> normalizeCaptureSkillEditorDraftV1() -> normalizeSkillDefinition()`.

Constats :

- `buildHumanSkillDraftV1()` ne transporte pas encore `activationRequirements` ;
- le formulaire Skills ne possède aucun contrôle pour les conditions runtime ;
- `requiredLevel` est déjà un champ séparé et restera inchangé ;
- « Nouvelle capacité » passe par `prepareNewSkillDraftFields()` ;
- « Créer / Mettre à jour » passent tous deux par `persistCurrentSkill()`, donc un seul raccord suffit ;
- les champs dynamiques ajoutés après montage ne sont pas couverts par la boucle initiale de listeners : le bloc conditions aura une délégation locale explicite ;
- aucun calcul d'état runtime n'est requis dans l'éditeur.

Décision UI :

- checkbox ON/OFF « Conditions d'activation / Ultime » ;
- mode `all` = toutes les conditions, `any` = au moins une ;
- liste de lignes ajoutables/supprimables ;
- libellés humains :
  - Temps de combat écoulé ;
  - Dégâts infligés ;
  - Dégâts subis ;
  - PV ≤ X % ;
- le contrat conserve `combat_elapsed_ms` en millisecondes, mais l'UI affiche le temps en **secondes** avec conversion explicite présentation -> contrat ;
- dégâts et pourcentage restent dans leur unité naturelle ;
- aucune condition activée = `activationRequirements.conditions = []`.

Fichiers autorisés :

- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- `examples/dom-demo/capture-editor-v2.css` ;
- tests UI dédiés ;
- documentation.

Runtime/Combat State/Action Resolver restent protégés dans ce lot.


### Résultat — Capture Skill Activation Editor UI V1

RED :

- SHA : `c19ce55d63e83d0fc0fae90b00850ee8194f5a5e` ;
- run : `36636841216` ;
- 575 tests, 570 pass, 5 fail ciblés ;
- surfaces absentes : conversion secondes/ms, builder UI, round-trip SkillDraft, contrôles HTML.

Raccord UI :

- bloc « Conditions d’activation / Ultime » dans l’onglet Capacités ;
- ON/OFF explicite ;
- mode :
  - « Toutes les conditions » = `all` ;
  - « Au moins une condition » = `any` ;
- ajout/suppression dynamique de conditions ;
- types lisibles :
  - Temps de combat écoulé ;
  - Dégâts infligés ;
  - Dégâts subis ;
  - PV ≤ X % ;
- seuil temporel affiché en secondes puis converti explicitement vers `combat_elapsed_ms` ;
- unités dégâts / % PV affichées à côté du seuil ;
- sur smartphone, chaque condition passe sur une colonne unique ;
- suppression de la dernière condition désactive automatiquement le bloc ;
- une activation ON sans condition est refusée par le builder UI.

Progression séparée :

- le champ est désormais libellé « Niveau requis pour apprendre / équiper » ;
- `requiredLevel` reste distinct des conditions dynamiques ;
- aucun niveau n'est évalué dans le runtime d'activation.

Vrai chemin UI :

`formulaire -> readSkillFields() -> buildHumanSkillDraftV1() -> CaptureSkillEditorDraftV1 -> SkillDefinition.activationRequirements`.

Préservation :

- « Nouvelle capacité » réinitialise les conditions ;
- « Créer / Mettre à jour » utilisent le même builder ;
- le chargement d'un modèle historique conserve les conditions déjà présentes dans les champs courants ;
- les capacités sans condition conservent `conditions: []`.

GREEN initial :

- SHA : `851955008c250a777639887950f6613c9dc14636` ;
- run : `36637200957` ;
- 575 tests, 575 pass, 0 fail.

Durcissement :

- test de préservation lors du merge d'un modèle historique ;
- sentinelle empêchant le Human Editor d'importer l'évaluateur runtime ou de lire `damageDealtTotal/damageTakenTotal` ;
- fixture historique corrigée pour utiliser un ID réellement présent dans le catalogue.

GREEN durci :

- SHA fonctionnel : `ac2be1decfd71d22caa05083acd6bb182bdfa7e6` ;
- run : `36637320755` ;
- 577 tests, 577 pass, 0 fail.

Revue charte :

- fichiers métier modifiés : Human Editor uniquement ;
- HTML/CSS démo + tests dédiés ;
- Combat State / Action Resolver / évaluateur runtime inchangés ;
- aucun localStorage/sessionStorage ;
- aucun MutationObserver ;
- aucun setTimeout/setInterval ;
- aucun monkey patch ;
- aucune formule runtime copiée dans l'UI.

État :

**GREEN technique — PREVALIDATION smartphone.**

Validation smartphone attendue :

1. créer une nouvelle capacité ;
2. activer « Conditions d’activation / Ultime » ;
3. ajouter une ou plusieurs conditions ;
4. vérifier `Toutes` / `Au moins une` ;
5. vérifier la lisibilité des unités secondes / dégâts / % PV ;
6. enregistrer puis tester la configuration.


## Micro-lot — Capture Tactical Skill Effects Architecture V1 — 2026-09-30

Base :

- checkpoint PREVALIDATION Activation Editor UI V1 : `checkpoint/lab-capture-skill-activation-editor-ui-v1-prevalidation-green-2026-09-29` ;
- SHA : `5810d532e2c4931c3bca251f0a98881f962bdfae` ;
- CI base : SUCCESS, 577/577 ;
- retour smartphone utilisateur : bloc Ultime/conditions lisible et jugé bon ; combat réel non encore testé, donc validation UI seulement partielle.

Checkpoint départ :

`checkpoint/lab-start-capture-tactical-skill-effects-architecture-v1-2026-09-30`.

Branche :

`work/lab-capture-tactical-skill-effects-architecture-v1-2026-09-30`.

### Besoin utilisateur

Les capacités doivent maintenant supporter de vrais effets tactiques actifs en combat, pas seulement des champs d'éditeur :

- buff / debuff ;
- dégâts de zone ;
- soin ;
- immobilisation ;
- effets périodiques ;
- boucliers et contrôles ;
- effets courants d'un jeu de combat tactique ;
- puis migration des capacités Capture historiques et Export/Import pour constituer la vraie base de données du jeu vitrine Monster Capture.

### Audit historique déjà démontré

Catalogue réellement utilisé : 103 capacités.

- 70 capacités simples déjà équivalentes au Runtime actuel ;
- 7 capacités attendent soin / zone / vol de vie ;
- 26 capacités attendent `StatusEffectV1` ;
- effets historiques exacts présents : damage, heal, buff, debuff, dot, hot ;
- ne pas inventer de migration silencieuse des anciens `duration` en durée temps réel.

### Découpage obligatoire

Ce chantier global est découpé en micro-lots indépendants :

1. **Tactical Skill Effects Architecture V1** : contrats et ownership uniquement ;
2. **Immediate Tactical Effects Runtime V1** : soin, auto-soin/vol de vie, gain/drain énergie ;
3. **Area Targeting Runtime V1** : multi-cibles data-driven ;
4. **StatusEffect Runtime V1** : buff/debuff, DoT/HoT, shield, immobilize, silence, stun, taunt + cleanse/dispel ;
5. **Tactical Effects Editor UI V1** ;
6. **Capture Complex Skills Migration V1** : conversion explicite des 33 historiques ;
7. **Capture Database Export/Import V1**.

Aucun lot ne doit prétendre que les effets sont jouables avant son raccord Runtime GREEN.

### Objectif du micro-lot actuel

Définir deux contrats purs et extensibles :

- `SkillEffectV1` : effet déclenché par une capacité ;
- `StatusEffectV1` : effet persistant porté par un combattant.

Le contrat doit couvrir les familles tactiques prévues sans les exécuter encore.

### Familles prévues

SkillEffectV1 :

- damage ;
- heal ;
- energy_restore ;
- energy_drain ;
- apply_status ;
- cleanse ;
- dispel.

StatusEffectV1 :

- stat_modifier ;
- damage_over_time ;
- heal_over_time ;
- shield ;
- immobilize ;
- silence ;
- stun ;
- taunt.

Ciblage explicite :

- target ;
- self ;
- all_enemies ;
- all_allies ;
- all_except_self.

Durées temps réel : `durationMs` uniquement pour les nouveaux contrats.

### Propriétaires

- définition immédiate/persistante : contrats sous `src/contracts/` ;
- état persistant futur : Combat State ;
- résolution future : Action Resolver / modules Core dédiés ;
- sélection multi-cible future : Battle/Targeting ;
- Human Editor futur : saisie seulement ;
- migration historique : adaptateur séparé, jamais le contrat lui-même.

### Protégé dans ce lot

- Action Resolver ;
- Combat State ;
- Combat Runtime ;
- targeting actuel ;
- Human Editor ;
- Animation/FX/renderer ;
- catalogues historiques ;
- aucun stockage/global/DOM/network.

### RED attendu

- contrats absents ;
- validation type/cible/durée/payload ;
- incompatibilités de payload refusées ;
- données immuables ;
- aucune dépendance runtime/UI.

### Critère de fin

- tests contractuels GREEN ;
- documentation architecture synchronisée ;
- checkpoint GREEN ;
- aucun effet annoncé comme actif en combat avant les micro-lots Runtime suivants.


### Résultat — Tactical Skill Effects Architecture V1

RED :

- SHA : `f66d0ce8736bf0e7a274a79a7bef9330c6fc3317` ;
- run : `36639109829` ;
- 582 tests, 577 pass, 5 fail ciblés ;
- causes : contrats `SkillEffectV1` et `StatusEffectV1` absents.

Contrats créés :

- `src/contracts/skill-effect-v1.js` ;
- `src/contracts/status-effect-v1.js`.

`SkillEffectV1` couvre :

- damage ;
- heal ;
- energy_restore ;
- energy_drain ;
- apply_status ;
- cleanse ;
- dispel.

Scopes explicites :

- target ;
- self ;
- all_enemies ;
- all_allies ;
- all_except_self.

`StatusEffectV1` couvre :

- stat_modifier ;
- damage_over_time ;
- heal_over_time ;
- shield ;
- immobilize ;
- silence ;
- stun ;
- taunt.

Règles :

- durée temps réel explicite via `durationMs` ;
- tick explicite via `tickIntervalMs` pour DoT/HoT ;
- stacking : replace / refresh / stack ;
- polarité : beneficial / detrimental / neutral ;
- tags disponibles pour cleanse/dispel ;
- aucun mapping historique de durée inventé dans ces contrats.

Première implémentation :

- deux fixtures de validation étaient mal ciblées et ont été corrigées sans assouplir les contrats.

GREEN :

- SHA : `64915108e935835a6180ffe251c483b5f92c9022` ;
- run : `36639270009` ;
- 582 tests, 582 pass, 0 fail.

Revue charte :

- aucun Runtime modifié ;
- aucune UI modifiée ;
- aucun DOM/storage/network/global ;
- aucun timer ;
- aucune dépendance GenSrpG ;
- contrats purs uniquement.

État :

**GREEN architecture/contrat.**

Étape suivante : **Immediate Tactical Effects Runtime V1**.


## Micro-lot — Immediate Tactical Effects Runtime V1 — 2026-09-30

Base :

- checkpoint GREEN Tactical Skill Effects Architecture V1 : `checkpoint/lab-capture-tactical-skill-effects-architecture-v1-green-2026-09-30` ;
- SHA : `54cfea209b32c4181c1f8ff275f36d8651bd8d77` ;
- CI : SUCCESS, 582/582.

Checkpoint départ :

`checkpoint/lab-start-immediate-tactical-effects-runtime-v1-2026-09-30`.

Branche :

`work/lab-immediate-tactical-effects-runtime-v1-2026-09-30`.

### Objectif

Rendre réellement actifs en combat les effets instantanés qui ne nécessitent ni multi-cible ni statut persistant :

- soin de la cible ;
- auto-soin / composant de vol de vie explicite ;
- restauration d'énergie ;
- drain d'énergie.

### Compatibilité SkillDefinition

Le `SkillDefinition.effect` historique reste une vue de compatibilité nécessaire aux capacités existantes.

Nouveau champ autorisé : `effects`, tableau de `SkillEffectV1`.

Règle anti-double-autorité :

- un type déjà porté avec une valeur non nulle dans `effect` ne peut pas être redéfini comme effet tactique du même type ;
- les nouveaux effets supplémentaires restent dans `effects` ;
- le Runtime ne doit jamais additionner silencieusement deux propriétaires du même effet.

### Scope V1 actif

Scopes exécutables ici :

- `target` ;
- `self`.

Scopes multi-cibles :

- `all_enemies` ;
- `all_allies` ;
- `all_except_self` ;

restent explicitement non supportés jusqu'au lot Area Targeting Runtime V1.

Effets persistants `apply_status/cleanse/dispel` restent non supportés jusqu'au lot StatusEffect Runtime V1.

### Propriétaires

- définition : SkillDefinition + SkillEffectV1 ;
- exécution instantanée : module Core dédié ;
- PV / énergie : Combat State ;
- Action Resolver orchestre à l'impact réel ;
- aucune logique d'effet dans UI/renderer.

### RED

1. SkillDefinition transporte les effets tactiques ;
2. heal cible réellement les PV et respecte maxHp ;
3. auto-soin après impact réel ;
4. energy_restore et energy_drain respectent bornes ;
5. effets non supportés refusés explicitement, jamais ignorés ;
6. refus/réaction évitée n'applique aucun effet ;
7. vrai chemin CombatSession.

### Protégé

- multi-cible / Battle Targeting ;
- StatusEffect runtime ;
- Animation/FX/renderer ;
- Human Editor ;
- catalogues historiques ;
- aucun timer/global/storage/DOM.

### Critère de fin

- vrai chemin Runtime GREEN ;
- événements sémantiques d'effets ;
- aucune régression dégâts/stats/activation/cooldown ;
- checkpoint GREEN avant Area Targeting.


### Résultat — Immediate Tactical Effects Runtime V1

RED :

- SHA : `7b5c0e7900cecc73fc1bdd3cb29148e67adbe51b` ;
- run : `36639597303` ;
- 589 tests, 583 pass, 6 fail ciblés ;
- absence du transport SkillEffectV1 et de l'exécution heal/énergie.

Implémentation :

- `SkillDefinition.effects` transporte un tableau normalisé de `SkillEffectV1` ;
- `effect` historique reste la compatibilité existante ;
- double autorité refusée pour damage/heal lorsque les deux couches tentent de porter le même effet ;
- module Core : `immediate-tactical-effects-v1.js` ;
- effets actifs :
  - heal ;
  - energy_restore ;
  - energy_drain ;
- scopes actifs :
  - target ;
  - self ;
- application uniquement à l'impact réel d'un outcome `hit` ;
- une attaque esquivée/bloquée/etc. ne déclenche pas les effets instantanés ;
- soin borné par maxHp ;
- énergie bornée par 0/maxEnergy ;
- événements sémantiques : `heal`, `energy-restored`, `energy-drained`.

Protection contre fausse fonctionnalité :

- scope multi-cible -> `unsupported_tactical_effect` avant coût/cooldown ;
- apply_status/cleanse/dispel -> même refus jusqu'au lot StatusEffect Runtime ;
- aucun effet non supporté n'est ignoré silencieusement.

GREEN :

- SHA : `9da6e0c7a37ed50e7592b15b6ba4f9040ecce314` ;
- run : `36639766985` ;
- 589 tests, 589 pass, 0 fail.

État :

**GREEN runtime — effets instantanés ciblés.**

Étape suivante : **Area Targeting Runtime V1**.


## Micro-lot — Area Targeting Runtime V1 — 2026-09-30

Base :

- checkpoint GREEN Immediate Tactical Effects Runtime V1 : `checkpoint/lab-immediate-tactical-effects-runtime-v1-green-2026-09-30` ;
- SHA : `34608df20ac21d394faf62e07257a40acbb09195` ;
- CI : SUCCESS, 589/589.

Checkpoint départ :

`checkpoint/lab-start-area-targeting-runtime-v1-2026-09-30`.

Branche :

`work/lab-area-targeting-runtime-v1-2026-09-30`.

### Objectif

Activer réellement les scopes multi-cibles `SkillEffectV1` en utilisant `BattleFormatDefinition` comme source unique des relations d'équipe.

Scopes V1 :

- target ;
- self ;
- all_enemies ;
- all_allies ;
- all_except_self.

Effets actifs dans ce lot :

- damage ;
- heal ;
- energy_restore ;
- energy_drain.

### Ownership

- équipes / relation ally-enemy : BattleFormatDefinition ;
- choix du scope d'un effet : SkillEffectV1 ;
- sélection concrète des actorIds : module Core pur dédié ;
- calcul dégâts : formule Combat Rules unique, factorisée pour legacy + tactical ;
- PV/énergie : Combat State ;
- orchestration impact : Action Resolver.

### Préaudit confirmé

- Combat State contient tous les fighters mais ne possède pas les équipes ;
- `targeting.js` dépend déjà du BattleFormat normalisé ;
- l'adapter Capture produit déjà `battleFormat` ;
- `combat-2v2-test-ui.js` crée actuellement CombatSession sans lui transmettre le format ;
- aucun nouveau team map ne doit être ajouté dans Combat State.

### Règles

- les cibles KO ne reçoivent pas d'effet de zone ordinaire ;
- `all_allies` inclut le lanceur ;
- `all_enemies` cible tous les combattants vivants de l'équipe adverse ;
- `all_except_self` cible tous les autres combattants vivants ;
- sans BattleFormat, un scope multi-cible reste refusé explicitement ;
- aucun statut persistant dans ce lot.

### RED

1. dégâts de zone sur tous les ennemis en vrai 2v2 ;
2. résistances individuelles conservées par cible ;
3. soin de groupe allié ;
4. énergie multi-cible ;
5. exclusion des KO ;
6. absence de BattleFormat -> refus avant coût/cooldown ;
7. vrai chemin Capture/2v2 transmet le format à CombatSession.

### Protégé

- StatusEffect runtime ;
- Human Editor ;
- FX/Animation/renderer ;
- catalogues historiques ;
- aucun calcul d'équipe dans l'UI.

### Critère de fin

- CI complète GREEN ;
- un seul propriétaire de l'équipe ;
- Area damage réellement actif ;
- checkpoint GREEN avant StatusEffect Runtime.


### Résultat — Area Targeting Runtime V1

RED :

- SHA : `8db86732bda6e670149410be129ed767e726af48` ;
- run : `36640087101` ;
- 595 tests, 590 pass, 5 fail ciblés.

Implémentation :

- BattleFormat reste l'unique propriétaire des équipes ;
- CombatSession accepte optionnellement `battleFormat` et le transmet aux résolveurs ;
- la démo 2v2 transmet le format normalisé à la session ;
- module `tactical-effect-targeting-v1.js` résout les cibles ;
- module `combat-damage-v1.js` devient la formule canonique de dégâts pour legacy + tactical ;
- `all_enemies` : tous les ennemis vivants ;
- `all_allies` : tous les alliés vivants, lanceur inclus ;
- `all_except_self` : tous les autres combattants vivants ;
- les KO sont exclus des effets ordinaires ;
- damage/heal/energy_restore/energy_drain fonctionnent sur scopes multi-cibles ;
- chaque cible conserve ses propres bonus/résistances.

GREEN :

- SHA : `581058fe323eb8fbf84925afa6862a6bf79f8676` ;
- run : `36640321553` ;
- 595 tests, 595 pass, 0 fail.

État :

**GREEN runtime multi-cible / AoE.**

Étape suivante : **StatusEffect Runtime V1**.


## Micro-lot — StatusEffect Runtime V1 — 2026-09-30

Base :

- checkpoint GREEN Area Targeting Runtime V1 : `checkpoint/lab-area-targeting-runtime-v1-green-2026-09-30` ;
- SHA : `6ecb96615cf0375fe75a6e355e567c8bedbb4176` ;
- CI : SUCCESS, 595/595.

Checkpoint départ :

`checkpoint/lab-start-status-effect-runtime-v1-2026-09-30`.

Branche :

`work/lab-status-effect-runtime-v1-2026-09-30`.

### Objectif

Rendre réellement actifs en combat les statuts persistants définis par `StatusEffectV1` :

- stat_modifier ;
- damage_over_time ;
- heal_over_time ;
- shield ;
- immobilize ;
- silence ;
- stun ;
- taunt ;
- cleanse ;
- dispel.

### Ownership

- définition : StatusEffectV1 ;
- instance runtime / stacks / échéance / shield restant : Status Effect Runtime ;
- snapshot des statuts : Combat State ;
- horloge : CombatState.elapsedMs uniquement ;
- application d'un statut : SkillEffectV1.apply_status ;
- sélection des cibles : Tactical Effect Targeting V1 ;
- dégâts : formule canonique Combat Damage V1 ;
- coefficients de stat : CaptureStatRegistryV1, transportés comme snapshot dérivé de règles, jamais recodés dans Status Runtime.

### Préaudit / décisions

1. Combat State ne possède encore aucun `statusEffects`.
2. Les stats runtime portent seulement leurs bonus dérivés ; pour `stat_modifier`, le fighter doit aussi recevoir les coefficients data-driven du registre de stats.
3. Les anciens IDs legacy `defense/armor/agility/initiative/force/power` ne seront PAS mappés automatiquement.
4. Un status `stat_modifier` est actif seulement si `statId` existe dans le snapshot de règles de stats du fighter.
5. DoT/HoT utilisent la même horloge que cooldown/énergie, sans timer parallèle.
6. Shield doit être absorbé dans une fonction unique d'application des dégâts afin d'affecter dégâts directs et DoT.
7. `immobilize` bloque uniquement le déplacement.
8. `silence` bloque le démarrage d'une compétence ; les commandes restent possibles.
9. `stun` bloque déplacement, compétence et commande pendant sa durée.
10. `taunt` force les compétences offensives ciblant un ennemi vers la source du taunt tant que cette source est vivante.
11. cleanse enlève les statuts detrimental ; dispel enlève les beneficial ; tags vides = tous de la polarité demandée.
12. stacking :
    - replace : nouvelle instance remplace l'ancienne ;
    - refresh : même magnitude/stacks, durée renouvelée ;
    - stack : stacks +1 jusqu'à maxStacks et durée renouvelée.

### Fichiers potentiellement autorisés

- src/core/combat/status-effect-runtime-v1.js ;
- src/core/combat/status-effect-projection-v1.js ;
- src/core/combat/combat-state.js ;
- src/core/combat/combat-session.js ;
- src/core/combat/action-resolver.js ;
- src/core/combat/command-resolver.js ;
- src/core/combat/immediate-tactical-effects-v1.js ;
- src/core/combat/combat-damage-v1.js ;
- src/adapters/input/capture/capture-editor-exporter-v3.js ;
- src/adapters/input/capture/capture-creature-to-fighter-config.js ;
- tests ;
- documentation.

### Protégé

- Animation/FX/renderer ;
- Human Editor ;
- catalogues historiques ;
- aucune conversion implicite des durations legacy ;
- aucun timer parallèle ;
- aucune formule stat hardcodée dans Status Runtime.

### RED

1. apply_status réel + expiry ;
2. DoT/HoT ticks déterministes ;
3. shield absorbe dégâts directs et périodiques ;
4. stat_modifier change damage/resistance/vitesse via règles du registre ;
5. immobilize/silence/stun bloquent les actions prévues ;
6. taunt contraint la cible ;
7. cleanse/dispel ;
8. stacking replace/refresh/stack ;
9. aucun coût/cooldown dépensé quand stun/silence bloque ;
10. vraie chaîne export stats -> fighter -> status runtime.

### Critère de fin

- tous les statuts V1 actifs réellement ;
- CI complète GREEN ;
- aucun ancien StatusEffect fake dans l'UI ;
- checkpoint GREEN avant Tactical Effects Editor UI / migration historique.


### Résultat — StatusEffect Runtime V1

RED :

- SHA : `2a03dd365e0cb4d99dcb84fe4608c9a100c7ff3c` ;
- run : `36641200436` ;
- 606 tests au total ; 595 pass / 11 fail ciblés ;
- causes : lifecycle status absent du vrai chemin, ticks/expiry non raccordés, shield/stat/control/taunt/cleanse/stacking non exécutés.

Implémentation :

- runtime instance dédiée : `StatusEffectRuntimeInstanceV1` ;
- état de fighter : `statusEffects` + `statEffectRulesById` ;
- lifecycle : apply / replace / refresh / stack / expiry ;
- horloge unique : `CombatState.elapsedMs`, aucun timer secondaire ;
- DoT / HoT : ticks déterministes sur la même horloge ;
- dégâts périodiques passent par le même calcul dégâts/résistances puis la même application de dégâts ;
- shield : absorption avant HP pour dégâts directs et DoT, capacité restante persistée ;
- `stat_modifier` : projection via les coefficients data-driven réellement transportés depuis le registre de stats ;
- aucun mapping automatique des anciens IDs legacy inconnus ;
- stat inconnue -> `unsupported_status_stat` avant coût/cooldown ;
- `immobilize` bloque le mouvement ;
- `silence` bloque le démarrage d'une compétence ;
- `stun` bloque mouvement / compétence / commande ;
- `taunt` force les compétences offensives vers la source vivante du taunt ;
- `cleanse` supprime les statuts detrimental ciblés par tags (ou tous si tags vides) ;
- `dispel` supprime les beneficial selon la même règle ;
- application d'un stun émet l'événement sémantique `charge-interrupt` existant.

Transport stats :

- `CaptureStatRegistryV1` -> snapshot `statEffectRulesById` dans l'export V3 ;
- adapter Capture -> FighterConfig ;
- Combat State conserve cette autorité data-driven ;
- aucun coefficient stat n'est recodé dans le Status Runtime.

Évolution de sentinelle :

- l'ancien test qui exigeait le refus de `apply_status` a été retiré comme obsolète ;
- le refus multi-cible sans BattleFormat reste testé et inchangé.

GREEN :

- SHA fonctionnel : `1f33f318ec227545fe5655c9344f0f6b3e964e21` ;
- run : `36642004408` ;
- **606 tests, 606 pass, 0 fail**.

Revue charte :

- aucun localStorage/sessionStorage/indexedDB ;
- aucun MutationObserver ;
- aucun setTimeout/setInterval ajouté ;
- aucun DOM/window/fetch dans les fichiers Core/contrats/adapters du lot ;
- aucun changement Animation/FX/renderer ;
- aucune conversion implicite des anciennes durées legacy ;
- une seule horloge et une seule chaîne d'application des dégâts.

État :

**GREEN runtime — StatusEffectV1 entièrement actif.**

Étape suivante :

**Tactical Effects Editor UI V1**, puis migration explicite des 33 capacités complexes historiques, puis Export/Import base de données.


## Micro-lot — Tactical Effects Editor UI V1 — 2026-09-30

Base :

- checkpoint GREEN StatusEffect Runtime V1 : `checkpoint/lab-status-effect-runtime-v1-green-2026-09-30` ;
- SHA : `c260af69d5cb7b247cd5e69c7e0341fbfb7bb33e` ;
- CI : SUCCESS, 606/606.

Checkpoint départ :

`checkpoint/lab-start-tactical-effects-editor-ui-v1-2026-09-30`.

Branche :

`work/lab-tactical-effects-editor-ui-v1-2026-09-30`.

### Objectif

Rendre éditables dans le Human Editor les effets tactiques qui sont désormais réellement supportés par le Runtime, sans dupliquer leur logique métier.

Effets SkillEffectV1 à exposer :

- damage ;
- heal ;
- energy_restore ;
- energy_drain ;
- apply_status ;
- cleanse ;
- dispel.

Scopes :

- target ;
- self ;
- all_enemies ;
- all_allies ;
- all_except_self.

StatusEffectV1 à exposer :

- stat_modifier ;
- damage_over_time ;
- heal_over_time ;
- shield ;
- immobilize ;
- silence ;
- stun ;
- taunt.

Réglages :

- durée en secondes dans l'UI, conversion explicite vers durationMs ;
- tick en secondes pour DoT/HoT ;
- stacking replace / refresh / stack ;
- maxStacks si stack ;
- polarité ;
- tags ;
- statId choisi depuis le registre de stats actif, jamais saisi comme formule libre si le registre est disponible ;
- amount/channel/deltaPoints selon le type ;
- targetScope explicite.

### Compatibilité

- `SkillDefinition.effect` historique reste visible uniquement pour les champs legacy existants (damage/heal/stun) jusqu'à migration ;
- le nouveau tableau `SkillDefinition.effects` est édité séparément ;
- aucune double autorité damage/heal ne doit être créée par l'UI ;
- les anciennes capacités simples continuent de fonctionner inchangées.

### Préaudit obligatoire

- chemin readSkillFields -> buildHumanSkillDraftV1 -> SkillDefinition ;
- hydratation d'une capacité existante dans les champs ;
- Nouvelle / Créer / Modifier ;
- bibliothèque historique status-dependent ;
- préservation des champs non représentés ;
- source du registre de stats actif ;
- mise en page smartphone.

### Protégé

- Combat Core / StatusEffect Runtime ;
- Action Resolver ;
- Animation/FX/renderer ;
- catalogues historiques ;
- aucun stockage parallèle ;
- aucun timer/retry/MutationObserver/monkey patch ;
- aucun merge main.

### RED prévu

1. helpers UI de conversion secondes/ms ;
2. build/read round-trip SkillEffectV1 ;
3. round-trip StatusEffectV1 ;
4. UI contient tous les types/scopes ;
5. stat_modifier consomme les IDs du registre ;
6. aucune double autorité damage/heal ;
7. aucun effet supprimé lors du chargement/modification ;
8. lisibilité mobile.

### Critère de fin

- CI complète GREEN ;
- checkpoint PREVALIDATION + preview ;
- test smartphone requis avant GREEN UI final ;
- ensuite migration explicite des 33 capacités historiques complexes.


### Préaudit confirmé — Tactical Effects Editor UI V1

Chemin unique :

`readSkillFields() -> buildHumanSkillDraftV1() -> normalizeCaptureSkillEditorDraftV1() -> normalizeSkillDefinition()`.

Constats :

- le builder ne transporte actuellement que le bloc legacy `definition.effect` ;
- aucun champ DOM ne représente `definition.effects` ;
- les conditions d'activation ont déjà un pattern de liste dynamique réutilisable proprement ;
- le registre `statRegistry` est déjà chargé et disponible dans le mount ;
- les champs dynamiques nécessitent une délégation d'événements locale, comme le bloc Ultime ;
- l'option `buff_debuff` est encore désactivée avec le texte « StatusEffectV1 requis », devenu obsolète puisque le Runtime StatusEffect est GREEN ;
- les modèles historiques complexes restent volontairement bloqués jusqu'au lot de migration dédié.

Décision :

- ajouter un bloc dynamique « Effets tactiques » ;
- chaque ligne possède `kind + targetScope` ;
- le sous-formulaire est dérivé du type choisi ;
- les durées/ticks sont affichés en secondes et convertis vers ms ;
- `stat_modifier.statId` choisit un ID du registre courant ;
- le Human Editor ne calcule ni dégâts, ni ticks, ni stacking : il ne fait que construire les contrats existants ;
- aucun effet historique complexe n'est automatiquement converti dans ce lot.


### Résultat — Tactical Effects Editor UI V1

RED :

- SHA : `5dd87dd12f1283036dc33d00ad1442f4a457f4a4` ;
- run : `36642420896` ;
- 613 tests, 607 pass, 6 fail ciblés ;
- causes : helpers tactiques, round-trip `definition.effects`, surface HTML et activation Buff/Debuff absents.

Implémentation :

- `buildHumanSkillDraftV1()` transporte désormais `definition.effects` via les contrats existants ;
- conversion explicite présentation :
  - durée statut en secondes -> `durationMs` ;
  - intervalle DoT/HoT en secondes -> `tickIntervalMs` ;
- éditeur dynamique de liste d'effets :
  - damage ;
  - heal ;
  - energy_restore ;
  - energy_drain ;
  - apply_status ;
  - cleanse ;
  - dispel ;
- scopes :
  - target ;
  - self ;
  - all_enemies ;
  - all_allies ;
  - all_except_self ;
- sous-éditeur StatusEffectV1 :
  - stat_modifier ;
  - damage_over_time ;
  - heal_over_time ;
  - shield ;
  - immobilize ;
  - silence ;
  - stun ;
  - taunt ;
- réglages :
  - polarité ;
  - durée ;
  - stacking ;
  - maxStacks ;
  - tags ;
  - amount / channel / tick ;
  - statId / deltaPoints selon le type ;
- `stat_modifier.statId` est alimenté depuis le registre de stats actif ;
- les sélecteurs de stats tactiques se resynchronisent si le registre de session est modifié ;
- Buff / Debuff générique est désormais activé dans l'éditeur puisque StatusEffectV1 Runtime est GREEN ;
- l'ancienne sentinelle imposant Buff/Debuff disabled a été retirée causalement.

Compatibilité :

- le bloc legacy `definition.effect` reste présent pour les capacités existantes ;
- le tableau moderne `definition.effects` est édité séparément ;
- le contrat refuse toujours une double autorité damage/heal ;
- appliquer un modèle historique préserve les effets tactiques déjà configurés ;
- description vide corrigée comme champ contractuellement optionnel (`null` au lieu de chaîne vide invalide) ;
- les modèles historiques complexes restent encore explicitement bloqués comme équivalence runtime complète jusqu'au lot de migration dédié.

UX mobile :

- carte dédiée « Effets tactiques » ;
- lignes dynamiques ;
- sous-formulaires contextuels ;
- layout mono-colonne <= 520 px ;
- aide visible pour zone, soin, énergie, buff/debuff, DoT/HoT, bouclier, immobilisation, silence, stun, provocation, nettoyage et dissipation.

Premier GREEN :

- SHA : `9e57cc30a5d9cf057199177e1a8b63606f48258c` ;
- run : `36643181000` ;
- 613/613.

Durcissement :

- préservation des effets lors du merge d'un modèle historique ;
- sentinelle layout mobile.

GREEN durci :

- SHA fonctionnel : `22342996d1c4e6a327b36165db792b5c19b6b182` ;
- run : `36643244569` ;
- **615 tests, 615 pass, 0 fail**.

Revue charte :

- aucun localStorage/sessionStorage/indexedDB ;
- aucun MutationObserver ;
- aucun setTimeout/setInterval ;
- aucune importation/exécution de StatusEffect Runtime ou Damage Runtime dans le Human Editor ;
- Combat Core / Action Resolver / FX / renderer inchangés dans ce lot ;
- Human Editor = saisie / présentation / construction des contrats uniquement.

État :

**GREEN technique — PREVALIDATION smartphone requise.**

Aucun GREEN UI final avant retour smartphone.

Étape suivante non-UI et séparée :

**Capture Complex Skills Migration V1** pour convertir explicitement les 33 capacités historiques complexes vers les contrats désormais actifs, sans inventer silencieusement la durée temps réel.


## Micro-lot — Capture Complex Skills Migration V1 — 2026-09-30

Base :

- checkpoint PREVALIDATION Tactical Effects Editor UI V1 : `checkpoint/lab-tactical-effects-editor-ui-v1-prevalidation-green-2026-09-30` ;
- SHA : `28ada349053ef2e935048d1fee6ca5039236ab85` ;
- CI : SUCCESS, 615/615 ;
- UI final GREEN reste soumis au retour smartphone.

Checkpoint départ :

`checkpoint/lab-start-capture-complex-skills-migration-v1-2026-09-30`.

Branche :

`work/lab-capture-complex-skills-migration-v1-2026-09-30`.

### Objectif

Convertir explicitement les 33 capacités historiques Capture réellement utilisées mais non portables auparavant vers les contrats tactiques désormais actifs.

Base historique auditée :

- 103 capacités réellement utilisées ;
- 70 déjà natives simples ;
- 33 complexes :
  - soin / zone / auto-soin ;
  - buff / debuff ;
  - DoT / HoT.

### Règles absolues

- aucune inférence depuis nom/description ;
- IDs historiques conservés ;
- ordre/effects historiques conservés ;
- aucune perte d'effet lors de la conversion ;
- aucun mapping de stat legacy inventé ;
- aucune conversion silencieuse de `duration` historique en `durationMs` ;
- si la sémantique temps réelle historique ne peut pas être démontrée, le migrateur doit exiger une politique explicite plutôt que choisir une valeur arbitraire ;
- aucune modification Runtime dans ce lot ;
- catalogue historique reste source, catalogue natif dérivé reste une projection.

### Préaudit obligatoire

1. recompter les 33 capacités complexes à partir de `CaptureUsedAbilityCatalogV2` ;
2. classifier exactement leurs effets ;
3. retrouver dans la source historique le propriétaire et la sémantique de `duration` ;
4. retrouver les anciennes stats `defense/armor/agilite/agility/initiative/force/power/speed` et vérifier si un mapping explicite vers le registre moderne existe déjà ;
5. distinguer les migrations déterministes des migrations nécessitant une politique/configuration ;
6. vérifier comment le catalogue natif portable actuel est hydraté dans le Human Editor.

### Sortie attendue

- adaptateur de migration pur ;
- état de migration explicite par capacité ;
- capacités déterministes deviennent runtime-ready sans saisie manuelle ;
- capacités nécessitant une politique restent identifiées précisément, jamais aplaties ;
- tests exacts sur les 33 entrées ;
- aucune modification UI dans ce lot sauf consommation éventuelle d'un nouveau catalogue GREEN dans un lot séparé si nécessaire.

### Protégé

- Combat Runtime ;
- Action Resolver ;
- StatusEffect Runtime ;
- Human Editor ;
- Animation/FX/renderer ;
- production GenSrpG ;
- aucun storage/network/global/DOM.

### Critère de fin

- RED ciblé ;
- migration prouvée pour chaque capacité ;
- aucun champ inventé ;
- CI complète GREEN ;
- checkpoint GREEN avant Export/Import Database V1.


### Préaudit confirmé — Capture Complex Skills Migration V1

État réel audité avant RED :

- `CaptureUsedAbilityCatalogV2` contient toujours 103 capacités / 103 IDs uniques ;
- le catalogue portable dérivé contient 70 capacités simples ;
- le complément exact contient donc 33 capacités complexes, sans doublon avec les 70 ;
- occurrences historiques sur les 103 : damage 84, heal 6, buff 10, debuff 14, DoT 1, HoT 1.

Classification du complément exact :

- 7 migrations immédiates sans statut persistant :
  - `lib_aqua_heal` ;
  - `lib_quake` ;
  - `lib_heal_5` ;
  - `lib_lifesteal_strike` ;
  - `cap_water_special_1` ;
  - `cap_light_special_1` ;
  - `cap_shadow_special_1` ;
- 26 capacités contiennent au moins un buff/debuff/DoT/HoT avec `duration`.

Sémantique historique de `duration` démontrée depuis la source exacte :

- dépôt source audité précédemment, commit `49289784ee92a47fd51089815ca25954cdba4493` ;
- blob `index.html` `74e223b2c9877e6a88b6ad6726290d230f1f616e` ;
- les statuts Capture sont enregistrés avec `phase:"turn_end"` ;
- DoT / HoT sont appliqués lors de `gensCaptureTickStatuses(..., "turn_end")` ;
- `duration` est ensuite décrémentée de 1 et le statut est supprimé à 0 ;
- les textes canoniques historiques parlent explicitement de « par tour » et « pendant N tours ».

Conclusion : `duration` est une durée en tours / fins de tour. Elle ne peut PAS être convertie silencieusement vers `durationMs`. Le nouveau Runtime étant basé sur `CombatState.elapsedMs`, une politique explicite de migration du temps est obligatoire. Pour DoT/HoT, cette politique doit également fournir une cadence compatible avec `tickIntervalMs`.

Audit des identifiants de stats legacy :

- le raccord Monster Capture existant possède déjà des alias explicites :
  - `speed / initiative / agility / agilite -> speed` ;
  - `physical / power / force -> physical` ;
- aucun mapping moderne explicite n'existe pour `defense` ni `armor` ;
- aucune équivalence `defense = physical` ou `armor = physical` ne sera inventée.

Audit supplémentaire obligatoire des valeurs buff/debuff :

- le moteur historique réel normalise les petites valeurs legacy vers des modificateurs en pourcentage via `cap142EffectPct` ;
- il applique ensuite ces modificateurs en pourcentage aux stats historiques ;
- `StatusEffectV1.stat_modifier` moderne exprime au contraire un `deltaPoints` ;
- une valeur legacy ne peut donc PAS être recopiée telle quelle dans `deltaPoints` sans politique sémantique explicite ;
- les alias d'identifiant de stat ne suffisent pas à eux seuls pour rendre un buff/debuff runtime-ready.

Ciblage historique démontré :

- cible explicite `self` reste soi-même ;
- cible explicite `enemy` reste la cible ennemie ;
- absence de cible sur heal/HoT est historiquement routée vers `self` ;
- absence de cible offensive est historiquement routée vers l'ennemi ;
- `target:"zone"` est une donnée historique explicite de zone ; aucune inférence depuis le nom ou la description n'est requise.

Hydratation Human Editor :

- les 9 SkillDefinition natives sont chargées dans `configuredSkills` ;
- les 70 capacités Capture portables sont ajoutées ensuite dans la MÊME Map via `capturePortableNativeSkillDraftsV1()` ;
- le lot courant ne créera donc pas une seconde bibliothèque concurrente et ne modifiera pas le Human Editor.

Décision pour le RED :

- la projection complexe sera un adaptateur pur dérivé de `CaptureUsedAbilityCatalogV2` moins les IDs du catalogue portable ;
- une entrée ne sera `runtime-ready` que si 100 % de ses effets sont traduisibles ;
- sinon aucun effet tactique partiel ne sera publié comme vrai ;
- blockers explicites prévus :
  - `requires-duration-policy` ;
  - `requires-stat-mapping` ;
  - `requires-stat-effect-policy` pour préserver correctement l'unité historique en pourcentage face à `deltaPoints`.
- Runtime, Action Resolver, Status Runtime, Human Editor, DOM, storage et network restent hors périmètre.


### RED démontré — Capture Complex Skills Migration V1

Commit RED :

- `efa0ce59da6bb3e37905dbd7828276999013ea81`
- test ajouté : `tests/unit/capture-complex-skill-migration-v1.test.mjs`

CI RED :

- run `36645752138`
- job `foundation` : FAILURE
- 616 tests ;
- 615 PASS ;
- 1 FAIL.

Cause RED prouvée :

- `ERR_MODULE_NOT_FOUND` sur `src/adapters/input/capture/capture-complex-skill-migration-v1.js` ;
- aucun échec Runtime/UI préexistant ;
- la correction minimale peut donc être limitée à l'adaptateur pur de migration et à l'exposition du resolver d'alias legacy déjà propriétaire du mapping Monster Capture.


### Implémentation GREEN technique — Capture Complex Skills Migration V1

Correction minimale :

- `src/adapters/input/capture/capture-complex-skill-migration-v1.js`
  - dérive les 33 par différence entre les 103 utilisées et les 70 portables ;
  - conserve ID, index source et ordre exact de `legacyEffects` ;
  - produit des `SkillEffectV1` uniquement pour une capacité entièrement démontrable ;
  - publie `tacticalEffects: null` dès qu'un blocker existe ;
  - ne dépend ni du Runtime, ni de l'UI, ni du DOM, ni du storage, ni du network.
- `src/adapters/input/capture/monster-capture-stat-values-v1.js`
  - expose le resolver pur des alias déjà propriétaires de ce module ;
  - aucun second mapping parallèle n'a été créé.

Répartition exacte des 33 :

**Runtime-ready — 7**

- `lib_aqua_heal` ;
- `lib_quake` ;
- `lib_heal_5` ;
- `lib_lifesteal_strike` ;
- `cap_water_special_1` ;
- `cap_light_special_1` ;
- `cap_shadow_special_1`.

**Durée + politique de valeur stat requises, ID de stat explicitement résolu — 15**

- `lib_root_snare` ;
- `lib_paralyze` ;
- `lib_tailwind` ;
- `lib_flash` ;
- `lib_drain` ;
- `lib_night_veil` ;
- `lib_stunning_blow` ;
- `cap_fire_special_1` ;
- `cap_earth_special_2` ;
- `cap_air_special_1` ;
- `cap_air_special_2` ;
- `cap_electric_special_1` ;
- `cap_light_special_2` ;
- `cap_shadow_special_2` ;
- `cap_poison_special_2`.

**Durée + politique de valeur stat + mapping de stat requis — 9**

- `lib_heat_wave` — defense ;
- `lib_mist_guard` — defense ;
- `lib_earth_guard` — armor ;
- `lib_magic_barrier` — defense ;
- `lib_guard_break` — defense ;
- `cap_fire_special_2` — defense ;
- `cap_water_special_2` — defense ;
- `cap_earth_special_1` — defense ;
- `cap_electric_special_2` — defense.

**Durée/tick explicite requis — 2**

- `lib_regen` — HoT ;
- `cap_poison_special_1` — DoT.

Aucune de ces 26 capacités bloquées n'est partiellement présentée comme runtime-ready.

Validation après implémentation :

- commit implémentation : `5ad068cd8861bc09482d6f85dcc78854381db2df` ;
- CI : run `36645936390` ;
- résultat : SUCCESS ;
- 624 tests ;
- 624 PASS ;
- 0 FAIL ;
- 9 tests dédiés au lot passent.

État du lot :

- GREEN technique pour la responsabilité du migrateur : les 33 capacités ont désormais un état explicite et vérifié ;
- 7 capacités sont directement traduites ;
- 26 conservent leurs blockers réels au lieu d'inventer une sémantique ;
- aucun Runtime/UI n'a été modifié.

Blockers fonctionnels volontairement non masqués pour une future décision contractuelle :

1. politique explicite tours/fins de tour -> `durationMs` / `tickIntervalMs` ;
2. politique explicite de conservation des buffs/debuffs historiques en pourcentage face au `deltaPoints` moderne ;
3. mapping moderne explicite pour `defense` et `armor`, s'il doit exister.

Le lot peut être checkpointé GREEN dès que la CI finale de documentation est SUCCESS.


## Micro-lot — Capture Legacy Status Semantics V1 — 2026-09-30

Base :

- checkpoint GREEN migration complexe : `checkpoint/lab-capture-complex-skills-migration-v1-green-2026-09-30` ;
- SHA : `02bf1b6002150b84077c8137230624d53770b35e` ;
- CI : SUCCESS, 624/624.

Checkpoint départ :

`checkpoint/lab-start-capture-legacy-status-semantics-v1-2026-09-30`.

Branche :

`work/lab-capture-legacy-status-semantics-v1-2026-09-30`.

### Cause démontrée depuis la source historique exacte

Source : commit `49289784ee92a47fd51089815ca25954cdba4493`, blob `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

1. `gensCaptureBattleEndTurn()` appelle `gensCaptureTickStatuses(..., "turn_end")` uniquement sur la créature dont le tour se termine.
2. DoT/HoT tickent à cette fin de tour, puis `duration` est décrémentée de 1.
3. Donc une durée legacy N signifie exactement **N fins d'action du porteur**, pas N secondes et pas N rounds globaux.
4. `cap142EffectPct` démontre que les petites valeurs legacy sont converties en pourcentages :
   - |v| <= 2 -> 30 % ;
   - |v| <= 5 -> 40 % ;
   - 6..19 -> 50 % ;
   - >= 20 -> valeur déjà en %.
5. Les buffs/debuffs modifient la stat de base en pourcentage.
6. `cap142NormStat` démontre explicitement `armor/armure/def/defense -> defense`.
7. Les alias historiques déjà possédés par le raccord Capture restent utilisés pour speed/initiative/agility/agilite et physical/power/force.

### Objectif

Supprimer les blockers de migration sans conversion arbitraire :

- étendre `StatusEffectV1` avec durée `owner_action_end` en plus de `time_ms` ;
- DoT/HoT legacy tickent à chaque fin d'action du porteur ;
- étendre `stat_modifier` avec mode `percent` en plus de `points` ;
- transporter les valeurs de stats de base vers le fighter pour calculer le pourcentage ;
- ajouter la stat moderne `defense` au registre standard ;
- `defense` produit une réduction globale de dégâts configurable par point ;
- ajouter `defense/armor/armure/def` au resolver d'alias propriétaire ;
- rendre le migrateur des 26 statuts runtime-ready quand toutes les données sont désormais démontrées.

### Règles de compatibilité

- les statuts modernes existants sans nouveau champ restent `time_ms` + mode `points` ;
- aucune rupture des 624 tests existants ;
- aucune seconde horloge ;
- les statuts `owner_action_end` ne décrémentent PAS sur réaction adverse ni simple avance du temps ;
- une action du porteur réussie (mouvement, compétence terminée, commande terminée) déclenche son tick/decrement ;
- `defense` réduit tous les canaux après résistances de canal ;
- réduction totale bornée à 100 % ;
- Human Editor hors périmètre de ce lot.

### RED

1. contrat accepte `durationModel:"owner_action_end"` + `durationActions` sans `durationMs` ;
2. DoT/HoT legacy tickent exactement à la fin d'action du porteur ;
3. stat_modifier percent applique le pourcentage aux points de base ;
4. defense standard existe et projette une réduction globale ;
5. combat damage consomme la réduction globale ;
6. resolver legacy maps defense/armor vers defense ;
7. migrateur convertit les 26 statuts sans blocker restant ;
8. aucun timer/DOM/storage/renderer.

### Critère de fin

- 33/33 capacités complexes runtime-ready ;
- CI complète GREEN ;
- checkpoint GREEN ;
- seulement ensuite Capture Database Export/Import V1.


### Résultat — Capture Legacy Status Semantics V1

Source historique exacte ré-auditée :

- commit : `49289784ee92a47fd51089815ca25954cdba4493` ;
- blob : `74e223b2c9877e6a88b6ad6726290d230f1f616e` ;
- `gensCaptureBattleEndTurn()` ticke uniquement les statuts de la créature dont l'action se termine ;
- `gensCaptureTickStatuses(..., "turn_end")` applique DoT/HoT puis décrémente `duration` ;
- `cap142EffectPct` convertit les anciennes petites valeurs en 30/40/50 % ;
- `cap142NormStat` démontre explicitement `def/armor/armure/défense -> defense`.

RED :

- commit : `e046e9876def0fcdc9a326088eee60df75bf0bd9` ;
- run : `36647273257` ;
- 633 tests, 624 PASS, 9 FAIL ciblés.

Implémentation :

1. `StatusEffectV1`
   - durée `time_ms` conservée par défaut ;
   - nouvelle durée `owner_action_end` + `durationActions` ;
   - `stat_modifier` : modes `points` et `percent` ;
   - DoT : modes `combat` et `fixed`.

2. Runtime statut
   - les statuts `owner_action_end` n'utilisent aucune seconde horloge ;
   - ils tickent/décrémentent uniquement à la fin d'une action réussie du porteur ;
   - déplacement, compétence terminée et commande terminée comptent comme action ;
   - réaction et simple avance du temps ne décrémentent pas ces statuts ;
   - un HoT posé sur soi pendant sa propre compétence ticke à la fin de cette même action, comme dans le Capture historique ;
   - DoT legacy `fixed` conserve son ancienne perte de PV brute au lieu d'inventer une résistance élémentaire.

3. Stats
   - ajout standard `defense / Défense` ;
   - `1 point = 1 %` de réduction globale des dégâts dans le preset ;
   - coefficient propriétaire : `damageReductionPctPerPoint` ;
   - réduction appliquée après résistance de canal, bornée à 0..100 % ;
   - `statValuesById` transporté au Fighter pour les modificateurs en pourcentage ;
   - alias explicites ajoutés : `defense / def / armor / armure / défense -> defense`.

4. Buff/Debuff legacy
   - règle exacte V16.142 centralisée dans `capture-legacy-status-semantics-v1.js` ;
   - |v| <= 2 -> 30 % ;
   - |v| <= 5 -> 40 % ;
   - 6..19 -> 50 % ;
   - >=20 -> valeur déjà en % ;
   - buff positif / debuff négatif ;
   - aucune recopie de pourcentage dans `deltaPoints`.

5. Migration complexe
   - 33/33 capacités complexes : `runtime-ready` ;
   - 0 blocker ;
   - soin, zone, auto-soin, buff, debuff, DoT et HoT traduits ;
   - IDs historiques et ordre des effets conservés ;
   - statuts persistants utilisent `owner_action_end` ;
   - `lib_regen` conserve 3 fins d'action ;
   - `cap_poison_special_1` conserve son DoT fixe sur 3 fins d'action ;
   - `lib_heat_wave` devient un debuff Défense -30 % pendant 2 fins d'action.

GREEN fonctionnel :

- SHA : `f3666f2b8de8403ae9d3d9d55a45d02d3386b6ba` ;
- run : `36648255521` ;
- **633 tests, 633 PASS, 0 FAIL**.

Revue charte :

- aucun mapping par nom/description de capacité ;
- aucun timer parallèle ;
- aucun DOM/storage/network dans les contrats/adaptateurs Core ;
- aucune logique métier ajoutée au renderer/FX ;
- les anciennes formes JSON sans Défense restent compatibles : les nouveaux champs à zéro sont omis des projections exportées ;
- aucune modification de production GenSrpG.

État :

**GREEN technique — sémantique legacy réellement préservée.**

Avant Export/Import Database V1, vérification obligatoire restante :

- démontrer que les 33 capacités complexes sont hydratées comme vraies `SkillDefinition` jouables dans la bibliothèque native Capture, et pas seulement disponibles comme projections de migration ;
- corriger ensuite la présentation Human Editor de la nouvelle stat Défense si nécessaire.


## Micro-lot — Capture Complex Native Skills V1 — 2026-09-30

Base :

- checkpoint GREEN legacy status semantics : `checkpoint/lab-capture-legacy-status-semantics-v1-green-2026-09-30` ;
- SHA : `77875449190d2dce16f5ef96d7a3f72b019f5523` ;
- CI : SUCCESS, 633/633.

Checkpoint départ :

`checkpoint/lab-start-capture-complex-native-skills-v1-2026-09-30`.

Branche :

`work/lab-capture-complex-native-skills-v1-2026-09-30`.

### Cause démontrée

- 103 capacités historiques sont réellement utilisées par les créatures Capture ;
- 70 sont déjà hydratées comme `CaptureSkillEditorDraftV1` natives via `CapturePortableNativeSkillCatalogV1` ;
- les 33 complexes sont désormais `runtime-ready` dans `CaptureComplexSkillMigrationV1`, mais ne sont pas encore transformées en drafts natifs complets ;
- `capture-editor-human-v2.js` hydrate actuellement 9 capacités laboratoire + 70 capacités Capture natives ;
- les 33 complexes restent donc absentes de `configuredSkills` et ne peuvent pas encore constituer la base native complète du jeu vitrine.

### Objectif

Créer `CaptureComplexNativeSkillCatalogV1` :

1. exactement 33 `CaptureSkillEditorDraftV1` ;
2. effets = `tacticalEffects` autoritaires issus du migrateur GREEN ;
3. aucun double propriétaire legacy `effect.damage/heal` ;
4. ID / nom / description / élément / requiredLevel / manaCost historiques conservés ;
5. timings dynamiques absents de la source représentés par 0 ms comme dans le catalogue portable déjà validé ;
6. cooldown historique actuellement 0 pour les 33, donc 0 ms sans conversion de tours ;
7. présentation laissée `null` ;
8. aucune déduction par nom/description.

### Politique de forme explicite

La forme n'est dérivée que de tokens structurels historiques :

- effet explicite zone / scope multi-cible -> `area` ;
- tous les effets sur soi -> `self` ;
- catégorie historique `melee` -> `contact` + `ground` ;
- cible externe non-zone sans forme historique -> `projectile` + `none`, même politique neutre déjà utilisée pour les sorts/ranged du catalogue portable.

Cette politique est une adaptation de transport vers le Runtime, pas une reconstruction d'animation. Aucun FX/audio/socket n'est inventé.

### Catégorie moderne

- heal -> `heal` ;
- defense -> `defensive` ;
- control / utility -> `buff_debuff` ;
- melee / spell / ranged -> `offensive`.

### Raccord Human Editor

Après GREEN du catalogue :

- hydrater les 33 drafts en plus des 70 ;
- obtenir **103/103 capacités Capture natives** ;
- conserver les 9 capacités laboratoire séparées ;
- mettre à jour le message de chargement ;
- ne plus afficher les 33 modèles historiques comme « StatusEffectV1 requis ».

### RED

1. module natif complexe absent ;
2. 33 drafts / 33 IDs uniques ;
3. zéro chevauchement avec les 70 ;
4. union Capture native = 103 IDs exacts ;
5. effets tactiques identiques au migrateur ;
6. formes structurelles testées sur mêlée / zone / self / contrôle cible ;
7. vrai Runtime accepte au moins une capacité status complexe native ;
8. Human Editor hydrate 103 natives Capture.

### Protégé

- aucune nouvelle règle Combat Runtime ;
- aucun changement StatusEffect Runtime ;
- aucun stockage/global/network ;
- aucune présentation/FX inventée ;
- aucun Export/Import encore.

### Critère de fin

- CI complète GREEN ;
- 103/103 capacités Capture disponibles comme drafts natifs ;
- checkpoint PREVALIDATION si UI modifiée ;
- puis correction lisibilité Défense dans Human Editor avant le lot Database Export/Import.


### Résultat — Capture Complex Native Skills V1

RED :

- commit : `2ef6eb64ec34e5d3c713cc390932cb383bf643f6` ;
- run : `36648666446` ;
- 640 tests, 633 PASS, 7 FAIL ciblés ;
- cause : catalogue natif complexe absent + Human Editor non raccordé.

Implémentation :

- nouveau `src/catalogs/capture-complex-native-skill-catalog-v1.js` ;
- exactement 33 `CaptureSkillEditorDraftV1` validés ;
- zéro chevauchement avec les 70 portables ;
- union native Capture : **103 IDs uniques / 103 capacités réellement utilisées** ;
- effets des 33 = `tacticalEffects` du migrateur autoritaire ;
- couche historique `effect.damage/heal` remise à 0 pour éviter toute double autorité ;
- identité / description / élément / requiredLevel / manaCost historiques conservés ;
- tous les manaCost et cooldown historiques des 33 sont explicitement 0 ;
- timings dynamiques absents restent à 0 ms, même politique neutre que le catalogue portable ;
- présentation reste `null`.

Politique de forme :

- scope multi-cible -> `area` ;
- tous effets sur soi -> `self` ;
- catégorie historique melee -> `contact/ground` ;
- cible externe sans forme historique -> `projectile/none`, politique neutre explicite déjà utilisée pour les capacités portables.

Human Editor :

- hydrate les 33 complexes après les 70 portables ;
- `configuredSkills` contient désormais 103 capacités Capture natives ;
- message de chargement : 9 capacités laboratoire + 103 Capture natives ;
- les anciens modèles complexes ne disent plus « StatusEffectV1 requis » ;
- ils sont indiqués `runtime-ready-complex`, la version native complète restant propriétaire dans `configuredSkills`.

Preuve runtime :

- une capacité historique complexe native `lib_heat_wave` a été exécutée via le vrai `CombatSession` ;
- son debuff Défense -30 % est bien attaché comme StatusEffect.

GREEN :

- SHA : `24b448994a7f2b6c67ec657d20e1c55fce04744a` ;
- run : `36648921041` ;
- **640 tests, 640 PASS, 0 FAIL**.

État :

**GREEN technique — 103/103 capacités Capture natives jouables.**

Étape suivante avant Database Export/Import :

- micro-lot Human Editor Défense : rendre explicite « 1 point = X % réduction globale des dégâts » et permettre de régler ce coefficient ;
- ne pas modifier le Runtime dans ce lot.


## Micro-lot — Capture Defense Stat Editor UI V1 — 2026-09-30

Base :

- checkpoint GREEN 103 capacités natives : `checkpoint/lab-capture-complex-native-skills-v1-green-2026-09-30` ;
- SHA : `6a2392f00fa5129f2e25647464d4613da86582e1` ;
- CI : SUCCESS, 640/640.

Checkpoint départ :

`checkpoint/lab-start-capture-defense-stat-editor-ui-v1-2026-09-30`.

Branche :

`work/lab-capture-defense-stat-editor-ui-v1-2026-09-30`.

### Cause démontrée

Le Runtime possède maintenant `damageReductionPctPerPoint` et la stat standard `defense`, mais le Human Editor ne connaît encore que :

- dégâts % / point ;
- résistance % / point ;
- réduction temps de charge % / point.

Conséquence : Défense apparaîtrait comme une stat sans effet compréhensible et son coefficient ne serait pas éditable.

### Objectif

- afficher : **1 point = -X % dégâts reçus** ;
- afficher le total courant ;
- ajouter le champ **Réduction globale dégâts reçus % / point** dans le registre système ;
- ajouter le même coefficient aux stats personnalisées ;
- round-trip via `CaptureStatRegistryV1` ;
- aucune modification Runtime/Combat.

### RED

1. résumé Défense lisible ;
2. champ système présent ;
3. champ custom présent ;
4. lecture/écriture du coefficient ;
5. mobile layout reste empilé.

### Critère de fin

- CI complète GREEN ;
- checkpoint PREVALIDATION + preview ;
- test smartphone groupé ensuite avec Tactical Effects UI.

### Résultat — Capture Defense Stat Editor UI V1

RED :

- commit RED : `e3d2411f1ba2cc2ee2133e131dee046a52fda539` ;
- 3 sentinelles dédiées ajoutées ;
- cause : `damageReductionPctPerPoint` existait déjà dans le contrat/Runtime mais n'était pas exposé par le Human Editor.

Correction minimale :

- `humanStatEffectSummaryV1()` explique désormais la réduction globale des dégâts reçus ;
- le registre système expose `damageReductionPctPerPoint` ;
- le builder de stat personnalisée expose le même coefficient ;
- lecture/écriture restent déléguées à `CaptureStatRegistryV1` ;
- aucune formule métier n'a été ajoutée à l'UI ;
- le bloc de définition des stats passe en une colonne sous 760 px.

Validation technique :

- PR technique #4, aucun merge prévu ;
- run `36663950342` ;
- structure / frontières / indépendance : OK ;
- **643 tests / 643 PASS / 0 FAIL**.

État :

**GREEN technique — PREVALIDATION smartphone requise**.

Important pour la suite :

- ce lot est issu de la ligne `Capture Complex Native Skills V1` ;
- le correctif `Tactical Effects UI Feedback Repair V1` existe sur une branche PREVALIDATION divergente ;
- aucun nouveau travail UI/Projectile ne doit repartir d'une seule de ces lignes en ignorant l'autre ;
- le prochain lot doit d'abord établir une base de réconciliation explicite, testée, sans écraser les 103 capacités natives ni réintroduire les contrôles legacy supprimés.

## Micro-lot — Capture UI Authority Reconciliation V1 — 2026-09-30

Base :

- checkpoint PREVALIDATION Défense UI : `checkpoint/lab-capture-defense-stat-editor-ui-v1-prevalidation-green-2026-09-30` ;
- SHA : `b6649fc7ed0085a1c8eff04783b75742e60ae5b3` ;
- CI : SUCCESS, 643/643.

Checkpoint départ :

`checkpoint/lab-start-capture-ui-authority-reconciliation-v1-2026-09-30`.

Branche :

`work/lab-capture-ui-authority-reconciliation-v1-2026-09-30`.

### Cause

Deux lignes UI ont divergé :

- la ligne canonique récente contient Défense + 103 capacités Capture natives ;
- la PREVALIDATION `Tactical Effects UI Feedback Repair V1` contient le nettoyage des anciennes autorités éditables.

La ligne canonique récente possède donc encore des contrôles legacy concurrents dans le Human Editor.

Le retour utilisateur confirme en plus que le contrôle `interruptsPreparation` visible près du projectile est perçu comme un second réglage de stun. Le propriétaire moderne du stun est `StatusEffectV1.stun`.

### Objectif

Réconcilier le nettoyage UI sur la ligne canonique récente sans perdre :

- les 103 capacités Capture natives ;
- la stat Défense et son coefficient ;
- les conditions Ultime ;
- Tactical Effects / StatusEffect V1.

Supprimer de la surface éditable les autorités legacy concurrentes :

- damage ;
- heal ;
- stunMs ;
- targetRelations ;
- allowedDistances ;
- interruptsPreparation.

Les champs de compatibilité du contrat peuvent rester transportés à zéro/faux si requis par les anciennes données, mais ne sont plus éditables.

### Propriétaires

- dégâts/soins/scope : `SkillDefinition.effects / SkillEffectV1` ;
- stun : `StatusEffectV1.stun` ;
- Ultime : `SkillDefinition.activationRequirements` ;
- compatibilité legacy : projection interne non éditable du Human Editor.

### Fichiers autorisés

- `src/ui/capture-editor-human-v2.js` ;
- `src/ui/capture-editor-skill-catalog-v1.js` si nécessaire pour la projection des modèles ;
- `examples/dom-demo/capture-editor-v2.html` ;
- tests unitaires dédiés ;
- `docs/LAB_CURRENT_WORK.md` ;
- `docs/LAB_ARCHITECTURE.md` à la clôture.

### Protégé

- Combat Runtime ;
- Action Resolver ;
- StatusEffect Runtime ;
- SkillEffectV1 / StatusEffectV1 contracts ;
- Projectile Clash Runtime ;
- FX / Renderer ;
- Database Export/Import ;
- production GenSrpG ;
- aucun storage/network/global/MutationObserver/timer de réparation.

### RED attendu

1. aucun contrôle DOM legacy damage/heal/stun/target/distance/interrupt n'est éditable ;
2. le Human Editor ne lit plus ces sélecteurs ;
3. `effect.damage/heal/stunMs` et `effect.interruptsPreparation` sont neutralisés lorsque l'autorité moderne est utilisée ;
4. targetRelations devient une projection dérivée des scopes tactiques ;
5. allowedDistances devient une compatibilité complète non éditable ;
6. Ultime round-trip intact ;
7. hydratation 103 capacités natives intacte ;
8. Défense UI intacte.

### Critère de fin

- RED ciblé ;
- correction soustractive ;
- CI complète GREEN ;
- checkpoint PREVALIDATION + preview ;
- seulement ensuite ouverture de Projectile Clash Rules V2.

### Résultat — Capture UI Authority Reconciliation V1

RED :

- commit : `c26f2a36a838bf98207efabf959ac17e60e5d041` ;
- run : `36664348233` ;
- 648 tests, 645 PASS, 3 FAIL ciblés ;
- causes : anciennes autorités `damage/heal/stun/target/distance/interruptsPreparation` encore exposées sur la ligne canonique.

Correction :

- `SkillDefinition.effects / SkillEffectV1` est désormais l'unique autorité éditable de dégâts, soins et scopes ;
- `StatusEffectV1.stun` est l'unique autorité éditable du stun ;
- le contrôle legacy `interruptsPreparation` est supprimé de l'éditeur et neutralisé à `false` quand les effets tactiques modernes sont présents ;
- les tests Runtime déjà existants démontrent que l'application réelle de `StatusEffectV1.stun` émet l'interruption sémantique de charge sans dépendre de ce contrôle UI ;
- les anciennes portées courte/moyenne/longue deviennent une projection de compatibilité complète non éditable ;
- `targetRelations` est dérivé des `targetScope` et polarités des effets tactiques ;
- la déclaration « Ultime / conditionnelle » reste propriétaire de `activationRequirements` ;
- les modèles historiques projettent leurs effets vers la même autorité tactique sans écraser des effets modernes déjà configurés.

Réconciliation de lignes :

- les 70 capacités Capture portables restent hydratées ;
- les 33 capacités Capture complexes restent hydratées ;
- total Capture natif : 103/103 ;
- la stat Défense et `damageReductionPctPerPoint` restent exposées ;
- aucune régression Runtime/Renderer.

Validation GREEN technique :

- run : `36664744563` ;
- structure / frontières / indépendance : OK ;
- **648 / 648 PASS / 0 FAIL**.

État :

**GREEN technique — PREVALIDATION smartphone requise**.

Le prochain lot peut partir de cette ligne réconciliée et traiter séparément Projectile Clash Rules V2.

## Micro-lot — Projectile Clash Rules V2 — 2026-09-30

Base :

- checkpoint PREVALIDATION UI réconciliée : `checkpoint/lab-capture-ui-authority-reconciliation-v1-prevalidation-green-2026-09-30` ;
- SHA : `ca68771349f6c4bd2b716834c32aa2f69bee3f32` ;
- CI finale : run `36664817191` — SUCCESS ;
- autorité Capture : 103/103 capacités natives + Défense + effets tactiques réconciliés.

Checkpoint départ :

`checkpoint/lab-start-projectile-clash-rules-v2-2026-09-30`.

Branche :

`work/lab-projectile-clash-rules-v2-2026-09-30`.

### Retour utilisateur / cause fonctionnelle

Le système V1 `projectileClash { mode, group, interactsWith }` ne sait produire qu'une annulation mutuelle. Le Human Editor n'expose en plus qu'un seul groupe, ce qui rend les interactions difficiles à comprendre et empêche d'exprimer qu'un projectile domine un autre puis continue sa trajectoire.

Exemple cible explicite :

- projectile glace : tag `ice`, puissance 2 contre `fire` ;
- projectile feu : tag `fire`, puissance 1 contre `ice` ;
- collision : le feu est annulé, la glace continue jusqu'à sa cible.

Aucune règle ne doit être déduite de l'élément, du nom, de la description ou de la créature.

### Autorité cible unique

Créer un contrat dédié Projectile Clash V2, consommé par `SkillDefinition` et le Combat Runtime.

Forme canonique cible :

```js
projectileClash: {
  tag: "ice",
  rules: [
    {
      againstTag: "fire",
      strength: 2
    }
  ]
}
```

Sémantique :

- `tag:null + rules:[]` = aucune collision configurée ;
- si aucune règle ne vise le tag adverse des deux côtés : aucune interaction ;
- une règle trouvée fournit la puissance de collision de son projectile contre le tag adverse ;
- absence de règle du côté opposé = puissance 0 si l'autre côté déclare explicitement une interaction ;
- puissance égale = annulation des deux ;
- puissance supérieure = le projectile supérieur survit et poursuit l'action déjà active ;
- le projectile perdant est annulé ;
- les règles sont orientées et permettent plusieurs tags adverses ;
- doublon `againstTag` interdit.

### Migration V1

Le lot remplace l'autorité V1 active ; il n'ajoute pas un second système.

- supprimer `mode/group/interactsWith` de la forme canonique éditée ;
- migrer les fixtures/tests du dépôt qui utilisent encore V1 ;
- aucune conversion heuristique de données utilisateur externe ;
- aucune coexistence de deux moteurs de clash actifs.

### UI

Le Human Editor doit exposer seulement :

- « Tag du projectile » ;
- liste de règles :
  - « Contre le tag » ;
  - « Puissance de collision » ;
  - retirer ;
- « Ajouter une règle » ;
- aide lisible : puissance la plus forte continue, égalité annule les deux.

Le réglage legacy `interruptsPreparation` / stun reste absent : le stun appartient uniquement à `StatusEffectV1.stun`.

### Fichiers autorisés

- nouveau contrat `src/contracts/projectile-clash-v2.js` ;
- `src/contracts/skill-definition.js` ;
- `src/core/combat/projectile-clash.js` ;
- `src/core/combat/combat-runtime.js` ;
- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- `examples/dom-demo/capture-editor-v2.css` seulement si nécessaire pour mobile ;
- `data/combat/skills/catalog.v1.json` pour migrer les fixtures natives ;
- tests unitaires dédiés / sentinelles existantes directement concernées ;
- `docs/LAB_CURRENT_WORK.md` ;
- `docs/LAB_ARCHITECTURE.md` à la clôture.

### Protégé

- SkillEffectV1 / StatusEffectV1 ;
- Status Effect Runtime ;
- dégâts / soins / area targeting ;
- Capture 103-skill catalogs et migrations ;
- stat registry / Défense ;
- FX / Renderer / Presenter ;
- Database Export/Import ;
- production GenSrpG ;
- aucun storage/network/global/MutationObserver/timer de réparation.

### RED obligatoire

1. contrat V2 absent ;
2. plusieurs règles par projectile ;
3. doublons de tag adverse refusés ;
4. règle de clash interdite sur une forme non projectile ;
5. aucune inférence depuis `element` / nom / description ;
6. égalité -> deux projectiles annulés ;
7. puissance supérieure -> perdant annulé, gagnant reste actif ;
8. vrai `CombatRuntime` : le gagnant continue et impacte réellement sa cible ensuite ;
9. aucune règle des deux côtés -> aucune collision ;
10. Human Editor n'expose plus `mode/group/interactsWith`, mais tag + règles multiples ;
11. aucun retour de `data-skill-interrupts` ;
12. Core/contrat sans DOM/storage/network/renderer.

### Critère de fin

- RED ciblé démontré ;
- correction minimale avec autorité V2 unique ;
- CI complète GREEN ;
- documentation architecture ;
- checkpoint PREVALIDATION si UI modifiée ;
- lien smartphone ;
- le micro-lot Renderer d'impact visuel multi-cible reste séparé.

### Résultat — Projectile Clash Rules V2

Pr éaudit :

- V1 possédait uniquement `mode:"mutual_cancel"` + `group/interactsWith` ;
- le Core supprimait systématiquement les deux actions lors d'un clash ;
- le Human Editor n'exposait qu'un groupe unique ;
- aucune dominance / continuation d'un projectile n'était représentable.

RED :

- commit : `c866513b355d34e4b14ea9750bed039de4d50c29` ;
- run : `36665402126` ;
- **654 tests, 648 PASS, 6 FAIL ciblés** ;
- les six échecs correspondaient exactement au contrat V2 absent, à la dominance non supportée et à l'UI V1.

Autorité V2 :

```js
projectileClash: {
  tag: "ice",
  rules: [
    {
      againstTag: "fire",
      strength: 2
    }
  ]
}
```

Sémantique :

- aucune configuration -> `tag:null, rules:[]` ;
- aucune règle des deux côtés -> aucun clash ;
- une règle orientée suffit à déclarer une interaction ;
- le côté sans règle correspondante a une puissance 0 ;
- puissance égale -> annulation des deux ;
- puissance supérieure -> seul le projectile perdant est annulé ;
- le projectile gagnant conserve la même action active et poursuit sa trajectoire jusqu'à l'impact initial ;
- aucune inférence depuis élément, nom, description ou créature.

Implémentation :

- nouveau propriétaire contractuel : `src/contracts/projectile-clash-v2.js` ;
- `SkillDefinition` délègue entièrement la normalisation au contrat V2 ;
- suppression de l'autorité V1 `PROJECTILE_CLASH_MODES / mode / group / interactsWith` dans `SkillDefinition` ;
- `projectile-clash.js` calcule les puissances et le résultat sémantique ;
- `CombatRuntime` ne retire de `activeByActor` que les actions réellement annulées ;
- aucune modification FX/Renderer/Presenter ;
- fixtures Fireball du laboratoire migrées explicitement vers V2.

Human Editor :

- un champ **Tag du projectile** ;
- plusieurs lignes **Contre le tag + Puissance de collision** ;
- ajout/suppression de règles ;
- explication : puissance supérieure continue, égalité annule les deux ;
- aucun retour de la case legacy `interruptsPreparation` ;
- aucun champ `mode/group/interactsWith` éditable.

Preuve vrai Runtime :

- test `real CombatRuntime keeps the stronger projectile active until its later target impact` ;
- glace puissance 2 contre feu puissance 1 ;
- feu annulé au point de collision ;
- glace reste active ;
- PV de la cible inchangés au moment du clash ;
- à l'impact final, la glace applique réellement ses dégâts.

Migration des sentinelles V1 :

- `data/combat/skills/fireball.skill.json` ;
- `data/combat/skills/catalog.v1.json` ;
- tests Capture skill adapter / editor draft ;
- intégration projectile clash ;
- sentinelles projectile clash Core.

Validation technique avant documentation finale :

- run `36665942566` ;
- structure / frontières / indépendance : OK ;
- **654 / 654 PASS / 0 FAIL**.

Des sentinelles supplémentaires protègent désormais :

- absence de dépendance UI/renderer/storage/network dans le contrat/Core ;
- absence de l'ancienne autorité V1 dans `SkillDefinition`.

État :

**GREEN technique — PREVALIDATION smartphone requise**, car le Human Editor a changé.

Le défaut visuel d'impact des dégâts multi-cibles reste un micro-lot Renderer séparé et n'a pas été masqué dans ce chantier.

### Clôture PREVALIDATION — Projectile Clash Rules V2

CI documentaire complète :

- run `36666051167` ;
- structure / frontières / indépendance : OK ;
- **656 / 656 PASS / 0 FAIL**.

Checkpoint à créer sur le SHA exact de cette clôture après validation CI :

- `checkpoint/lab-projectile-clash-rules-v2-prevalidation-green-2026-09-30` ;
- preview : `preview/lab-projectile-clash-rules-v2-2026-09-30`.

Validation smartphone attendue :

1. le champ « Tag du projectile » est compréhensible ;
2. plusieurs règles « Contre le tag / Puissance de collision » peuvent être ajoutées/supprimées ;
3. aucune ancienne case Stun / interruption n'est revenue ;
4. aucune ancienne configuration groupe/interactsWith n'est visible ;
5. en combat, une égalité annule les deux projectiles ;
6. un projectile plus puissant annule le plus faible et poursuit visuellement sa trajectoire jusqu'à la cible.

## Micro-lot — Projectile Power V1 — 2026-09-30

Base :

- checkpoint PREVALIDATION Projectile Clash V2 : `checkpoint/lab-projectile-clash-rules-v2-prevalidation-green-2026-09-30` ;
- SHA : `9ea744d43f5ce3df6a30476b42cda30444c6d7dc` ;
- CI : 656/656 PASS.

Checkpoint départ :

`checkpoint/lab-start-projectile-power-v1-2026-09-30`.

Branche :

`work/lab-projectile-power-v1-2026-09-30`.

### Retour utilisateur / simplification

Le système V2 `tag + rules[againstTag,strength]` est jugé trop complexe pour l'éditeur si tous les projectiles doivent simplement être comparés par puissance.

Décision :

- supprimer les tags de projectile ;
- supprimer les règles par tag adverse ;
- supprimer la liste de règles de l'éditeur ;
- conserver une seule autorité : **puissance du projectile**.

### Autorité cible

Forme canonique :

```js
projectileClash: {
  power: 0
}
```

Sémantique :

- `power = 0` : le projectile ne participe pas aux collisions ;
- `power > 0` : le projectile peut entrer en collision avec tout autre projectile participant ;
- puissance gauche > droite : gauche continue, droite annulée ;
- puissance droite > gauche : droite continue, gauche annulée ;
- égalité positive : les deux sont annulés ;
- aucun tag, aucune famille, aucune règle directionnelle ;
- aucune inférence depuis l'élément, le nom ou la description.

### UI

Le Human Editor expose uniquement :

- **Puissance du projectile** ;
- aide courte : `0 = aucune collision ; plus puissant = continue ; égalité = annulation mutuelle`.

### Propriétaires

- contrat : `ProjectileClashV2` simplifié ;
- comparaison : `projectile-clash.js` ;
- continuité de l'action gagnante : `CombatRuntime` ;
- UI : saisie seulement.

### Fichiers autorisés

- `src/contracts/projectile-clash-v2.js` ;
- `src/core/combat/projectile-clash.js` ;
- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- `examples/dom-demo/capture-editor-v2.css` ;
- fixtures/tests directement concernés ;
- `docs/LAB_CURRENT_WORK.md` ;
- `docs/LAB_ARCHITECTURE.md`.

### Protégé

- SkillEffectV1 / StatusEffectV1 ;
- Combat damage / area targeting ;
- Capture 103-skill catalogs hors migration de la propriété projectile ;
- Défense/stat registry ;
- FX / Renderer / Presenter ;
- Database Export/Import ;
- production GenSrpG.

### RED obligatoire

1. forme canonique attendue `{ power }` ;
2. aucun `tag`, `rules`, `againstTag`, `strength` dans le contrat canonique ;
3. `power=0` -> aucune collision ;
4. puissance supérieure -> gagnant continue ;
5. égalité positive -> annulation mutuelle ;
6. Human Editor n'expose qu'un champ puissance ;
7. aucun tag/règle visible ou lu par l'UI ;
8. vrai Runtime : gagnant toujours actif après clash et impacte ensuite sa cible ;
9. frontières/indépendance intactes.

### Critère de fin

- RED ciblé ;
- suppression soustractive des tags/règles ;
- CI complète GREEN ;
- documentation mise à jour ;
- checkpoint PREVALIDATION + preview smartphone.

### Résultat — Projectile Power V1

Décision utilisateur :

- les tags de projectile n'apportent pas assez de valeur si tous les projectiles se comparent uniquement par puissance ;
- ils sont donc supprimés pour réduire la complexité de l'éditeur.

RED :

- commit : `0d185121f645dc682ee7c44d5fdd216c6cbb6fcb` ;
- run : `36675963243` ;
- **661 tests, 656 PASS, 5 FAIL ciblés** ;
- les cinq échecs correspondaient exactement au passage attendu vers une puissance unique.

Autorité finale :

```js
projectileClash: {
  power: 0
}
```

Sémantique :

- `power = 0` : ne participe pas aux collisions ;
- `power > 0` : collision possible avec tout autre projectile dont la puissance est > 0 ;
- puissance supérieure : le gagnant continue son action existante ;
- puissance égale : annulation mutuelle ;
- aucun tag ;
- aucune famille ;
- aucune règle par adversaire ;
- aucune inférence depuis élément / nom / description.

Nettoyage effectué :

- nouveau propriétaire : `src/contracts/projectile-power-v1.js` ;
- suppression de `src/contracts/projectile-clash-v2.js` ;
- suppression des sentinelles tag/rules V2 obsolètes ;
- `SkillDefinition` délègue à `ProjectilePowerV1` ;
- Core de clash compare uniquement `leftPower/rightPower` ;
- Human Editor expose uniquement **Puissance du projectile** ;
- suppression du DOM/CSS des listes de règles ;
- Fireball et fixtures Capture migrées vers `{ power: 1 }`.

Vrai chemin Runtime :

- le projectile plus puissant reste dans `activeByActor` ;
- le projectile faible seul est annulé ;
- le gagnant atteint ensuite normalement sa cible et applique son impact.

Validation technique :

- run `36676426223` ;
- structure / frontières / indépendance : OK ;
- **655 / 655 PASS / 0 FAIL**.

État :

**GREEN technique — PREVALIDATION smartphone requise**.

Validation UI attendue :

1. un seul champ « Puissance du projectile » ;
2. aucun tag / règle / « contre le tag » visible ;
3. aide claire : `0 = aucune collision` ;
4. égalité = les deux annulés ;
5. plus puissant = continue.

### Clôture finale — Projectile Power V1

CI après synchronisation documentaire :

- run `36676553178` ;
- structure / frontières / indépendance : OK ;
- **655 / 655 PASS / 0 FAIL**.

Checkpoint PREVALIDATION à figer sur le SHA final :

- `checkpoint/lab-projectile-power-v1-prevalidation-green-2026-09-30` ;
- preview : `preview/lab-projectile-power-v1-2026-09-30`.

## Micro-lot — Capture Creature Catalog Canonicalization V1 — 2026-09-30

Base :

- checkpoint PREVALIDATION Projectile Power V1 : `checkpoint/lab-projectile-power-v1-prevalidation-green-2026-09-30` ;
- SHA : `4831eb2b7576a89dd4d7485a96b785be776a47af` ;
- CI : 655/655 PASS.

Checkpoint départ :

`checkpoint/lab-start-capture-creature-catalog-canonicalization-v1-2026-09-30`.

Branche :

`work/lab-capture-creature-catalog-canonicalization-v1-2026-09-30`.

### Régression observée

La bibliothèque de créatures affiche plusieurs noms deux fois, dont Ailevent.

Audit exact du catalogue historique `data/capture/monster-capture-creatures.v1.json` :

- 110 entrées historiques ;
- IDs uniques ;
- 8 noms présents deux fois avec deux IDs différents.

Paires démontrées :

- `crea_embercub -> crea_braiseau` ;
- `crea_galewing -> crea_ailevent` ;
- `crea_lumipup -> crea_lumilo` ;
- `crea_nightfang -> crea_noctecroc` ;
- `crea_rockhorn -> crea_rocorne` ;
- `crea_sparkmoth -> crea_lucieclair` ;
- `crea_miragecat -> crea_mirachat` ;
- `crea_ashdrake -> crea_dracendre`.

Les IDs à gauche sont les anciennes entrées `game_profile_dungeon_demo` à 4 capacités `lib_*`.
Les IDs à droite sont les entrées Capture modernes avec capacités `cap_*`, stats/résistances Capture et, lorsque défini, évolution.

### Autorité

Le JSON historique reste une **source de provenance** et n'est pas réécrit silencieusement.

Une projection canonique dédiée devient l'unique source consommable par le Human Editor.

Aucune détection par nom n'est utilisée pour choisir un gagnant.

Les huit alias sont déclarés explicitement par ID.

### Objectif

- exposer une liste canonique sans doublons de créatures ;
- conserver les 110 entrées historiques comme source ;
- produire 102 créatures canoniques ;
- permettre la résolution explicite d'un ancien ID vers le nouvel ID ;
- faire consommer cette projection par le Human Editor ;
- empêcher tout futur doublon de nom non déclaré.

### Fichiers autorisés

- nouveau `src/catalogs/capture-canonical-creature-catalog-v1.js` ;
- `src/ui/capture-editor-human-v2.js` ;
- `src/catalogs/capture-creature-visual-bindings-v1.js` uniquement si nécessaire pour supprimer une autorité alias dupliquée ;
- tests unitaires dédiés ;
- `docs/LAB_CURRENT_WORK.md` ;
- `docs/LAB_ARCHITECTURE.md`.

### Protégé

- source historique `data/capture/monster-capture-creatures.v1.json` ;
- Skill catalogs ;
- Combat Runtime ;
- FX / Renderer ;
- Stat registry ;
- Export / Import database (lot suivant) ;
- production GenSrpG.

### RED attendu

1. source historique = 110 entrées ;
2. exactement 8 aliases explicites ;
3. projection canonique = 102 entrées ;
4. IDs canoniques uniques ;
5. noms canoniques uniques ;
6. les 8 anciens IDs sont absents de la projection ;
7. les 8 IDs modernes sont présents ;
8. résolution d'alias déterministe ;
9. aucun choix basé sur le nom ;
10. Human Editor hydrate la projection canonique, pas les 110 sources brutes.

### Critère de fin

- RED ciblé ;
- projection pure ;
- Human Editor sans doublon ;
- CI complète GREEN ;
- documentation ;
- checkpoint GREEN/PREVALIDATION selon impact UI.

### Résultat — Capture Creature Catalog Canonicalization V1

RED :

- commit : `4559f457324fe3dddfe85b71b18b8236785b5eee` ;
- run : `36677547482` ;
- 656 tests, 655 PASS, 1 FAIL attendu : projection canonique absente.

Audit confirmé :

- source historique : 110 entrées / 110 IDs uniques ;
- 8 doublons de nom démontrés ;
- 8 anciennes entrées `game_profile_dungeon_demo` ;
- 8 cibles Capture modernes explicites.

Implémentation :

- `capture-canonical-creature-catalog-v1.js` possède les 8 alias ID -> ID ;
- aucune inférence par nom ;
- projection canonique : **102 créatures** ;
- noms et IDs canoniques uniques ;
- le Human Editor hydrate la projection canonique avant import ;
- les bindings visuels ne dupliquent plus les anciens IDs ;
- un ancien ID visuel passe par le même resolver canonique.

Validation :

- run `36677757264` ;
- structure / frontières / indépendance : OK ;
- **662 / 662 PASS / 0 FAIL**.

État :

**GREEN technique**.

Le JSON historique reste intact comme provenance. L'éditeur et les futurs exports doivent consommer uniquement la projection canonique.

## Chantier — Capture Database Export / Import V1 R2 — 2026-09-30

Base actuelle obligatoire :

- `checkpoint/lab-capture-creature-catalog-canonicalization-v1-green-2026-09-30` ;
- SHA : `ebf1134e070458e225cc05d7d17fb07b74779d7c` ;
- CI : 662/662 PASS ;
- catalogue créatures jouable : 102 IDs canoniques ;
- catalogue capacités Capture : 103 drafts natifs ;
- projectile collision : `projectileClash.power` uniquement.

Une ancienne branche `work/lab-capture-database-export-import-v1-2026-09-30` existe mais est 104 commits derrière et diverge de l'autorité actuelle. Elle est abandonnée comme ligne de code. Son préaudit de propriété a été relu et reste valable sur les principes de composition.

Checkpoint départ R2 :

`checkpoint/lab-start-capture-database-export-import-v1-r2-2026-09-30`.

Branche :

`work/lab-capture-database-export-import-v1-r2-2026-09-30`.

### Besoin utilisateur

Pouvoir :

1. configurer une créature puis exporter **cette créature** ;
2. configurer une capacité puis exporter **cette capacité** ;
3. exporter **toute la base** ;
4. réimporter ces fichiers dans le Human Editor ;
5. envoyer ensuite ces JSON pour intégration dans le dépôt ;
6. créer plus tard les assets visuels/sprites/sons manquants sans dupliquer les données métier.

### Principe d'ownership

Le format Database ne redéfinit aucun propriétaire.

Il compose :

- `CaptureCreatureEditorDraftV3` ;
- `CaptureCreatureStatValuesV1` ;
- `CaptureActiveSkillLoadoutV1` ;
- `CaptureSkillEditorDraftV1` ;
- `CaptureStatRegistryV1` ;
- `CaptureProgressionRulesV1`.

Ne jamais persister comme source éditable :

- `CaptureCombatExportV1` ;
- battle/teams/actors/rosters ;
- `combat.statEffects` dérivé ;
- `statEffectRulesById` dérivé ;
- une copie aplatie des champs des contrats.

Les références visuelles/audio restent dans les Presentation Bindings par `assetId`. Les binaires d'assets ne sont pas embarqués dans le JSON.

### Types d'export V1

**Créature**

- 1 draft créature ;
- ses valeurs de stats ;
- son loadout ;
- références de capacités par ID seulement ;
- pas de copie des définitions de capacités ;
- pas de copie du registre global.

**Capacité**

- 1 `CaptureSkillEditorDraftV1` complet.

**Base complète**

- registre de stats ;
- règles de progression ;
- toutes les créatures canoniques configurées ;
- tous les statValues/loadouts ;
- toutes les capacités configurées.

### Import

Un import est explicite :

- mode `reject` par défaut : refuse un ID déjà présent avec contenu différent ;
- mode `replace` optionnel : remplace explicitement le même ID ;
- un ancien ID de créature connu passe par le resolver canonique avant conflit ;
- aucune fusion champ-par-champ heuristique ;
- aucune persistance navigateur implicite.

### Découpage

#### Micro-lot A — Database Bundle Core

Fichiers autorisés :

- nouveau `src/contracts/capture-database-v1.js` ;
- nouveau `src/adapters/input/capture/capture-database-transfer-v1.js` ;
- nouveau `tests/unit/capture-database-v1.test.mjs` ;
- docs.

Objectif :

- bundle canonique complet ;
- JSON stringify/parse pur ;
- validation cross-références ;
- aucun DOM/UI/storage/network/Runtime.

RED :

1. format absent ;
2. round-trip exact ;
3. créature V3 + présentation/sockets/audio conservés ;
4. statValues/loadout conservés ;
5. SkillDefinition complet conservé, y compris `effects`, StatusEffect, Ultime, timings, projectile power et présentation ;
6. pas de battle/teams/actors/rosters ;
7. IDs/cross-références invalides refusés ;
8. JSON invalide refusé ;
9. aucune dépendance interdite.

#### Micro-lot B — Entity Transfer Packages

Objectif :

- package `creature` ;
- package `skill` ;
- package `database` ;
- import plan `reject|replace` pur.

Les exports unitaires référencent les autres propriétaires par ID au lieu de les recopier.

#### Micro-lot C — Human Editor Files UI

Objectif smartphone :

- bouton **Exporter cette créature** ;
- bouton **Exporter cette capacité** ;
- bouton **Exporter toute la base** ;
- sélecteur fichier **Importer JSON** ;
- case explicite **Remplacer les IDs existants** ;
- messages lisibles de résultat/conflit ;
- aucun stockage navigateur ;
- les Maps actuelles restent la seule session active.

### Risques

- export d'un snapshot Runtime au lieu des drafts ;
- perte de Presentation Binding ;
- export créature qui duplique les skills ;
- import silencieux qui écrase un ID ;
- ancienne créature alias réintroduite comme deuxième ID ;
- DOM comme source de vérité ;
- Blob/FileReader dans le contrat pur.

### Critère de fin

- micro-lot A GREEN ;
- micro-lot B GREEN ;
- micro-lot C GREEN technique ;
- CI complète ;
- checkpoint PREVALIDATION ;
- lien smartphone permettant le workflow réel config -> export -> import.

### Micro-lot A — Database Bundle Core — GREEN technique

RED :

- commit : `8ba4ad3cf39e177d0b93ca7b249ddb3fa86b31dc` ;
- run : `36678289321` ;
- 663 tests, 662 PASS, 1 FAIL attendu : contrat Database absent.

Implémentation :

- `src/contracts/capture-database-v1.js` ;
- `src/adapters/input/capture/capture-database-transfer-v1.js`.

Le bundle compose directement :

- `CaptureStatRegistryV1` ;
- `CaptureProgressionRulesV1` ;
- `CaptureCreatureEditorDraftV3` ;
- `CaptureCreatureStatValuesV1` ;
- `CaptureActiveSkillLoadoutV1` ;
- `CaptureSkillEditorDraftV1`.

Validation cross-références :

- IDs de créatures uniques ;
- IDs de capacités uniques ;
- statValues/loadout rattachés au même creatureId ;
- toutes les capacités liées existent ;
- toutes les capacités équipées existent et sont liées ;
- cible d'évolution déclarée dans le bundle ;
- metadata strictement JSON-compatible.

Le format ne contient aucun battle/teams/actors/rosters ni snapshot `statEffects` dérivé.

Le transfert JSON :

- normalise avant sérialisation ;
- JSON formaté ;
- parse puis normalise à l'import ;
- JSON invalide refusé explicitement ;
- aucun DOM/FileReader/Blob/storage/network/Runtime.

GREEN :

- run `36678658071` ;
- structure / frontières / indépendance : OK ;
- **670 / 670 PASS / 0 FAIL**.

Étape suivante : micro-lot B Entity Transfer Packages.

## Micro-lot — Capture Entity Transfer Packages V1 — 2026-09-30

Base :

- checkpoint GREEN Database Bundle Core :
  `checkpoint/lab-capture-database-bundle-core-v1-green-2026-09-30` ;
- SHA : `e7d462ca3e75b0aa53e46fc89d86f7ff933d7fe1` ;
- CI : run `36678738311`, 670/670 PASS.

Checkpoint départ :

`checkpoint/lab-start-capture-entity-transfer-packages-v1-2026-09-30`.

Branche :

`work/lab-capture-entity-transfer-packages-v1-2026-09-30`.

### Objectif

Ajouter les formats de fichier unitaires sans dupliquer les propriétaires :

1. export/import **créature seule** ;
2. export/import **capacité seule** ;
3. détection d'un fichier **base complète** existant ;
4. plan d'application pur avec politique `reject|replace`.

### Formats

Créature :

```js
{
  schema: "capture-creature-transfer-v1",
  version: 1,
  draft: CaptureCreatureEditorDraftV3,
  statValues: CaptureCreatureStatValuesV1,
  loadout: CaptureActiveSkillLoadoutV1
}
```

Le registre de stats n'est pas recopié dans le fichier créature. Il est fourni comme contexte au normalizer/import depuis l'éditeur cible.

Capacité :

```js
{
  schema: "capture-skill-transfer-v1",
  version: 1,
  draft: CaptureSkillEditorDraftV1
}
```

Base complète :

- reste `CaptureDatabaseV1` ;
- aucun wrapper concurrent.

### Import / conflits

- `reject` par défaut ;
- même ID + contenu identique = no-op ;
- même ID + contenu différent = conflit en mode reject ;
- `replace` autorise explicitement le remplacement ;
- aucun merge champ par champ ;
- les anciens IDs créature déclarés par `CaptureCanonicalCreatureCatalogV1` sont canonicalisés AVANT le conflit ;
- évolution legacy targetId connue est canonicalisée avec le même resolver ;
- un fichier inconnu est refusé.

### Fichiers autorisés

- nouveau `src/contracts/capture-creature-transfer-v1.js` ;
- nouveau `src/contracts/capture-skill-transfer-v1.js` ;
- nouveau `src/adapters/input/capture/capture-entity-transfer-v1.js` ;
- tests dédiés ;
- docs.

### Protégé

- Human Editor ;
- Runtime / FX / Renderer ;
- Database bundle contract ;
- catalogues historiques ;
- aucune persistance navigateur ;
- aucune Blob/FileReader/DOM/network.

### RED attendu

1. package créature pur ;
2. package capacité pur ;
3. JSON round-trip exact pour chacun ;
4. auto-détection des trois schemas ;
5. ancien ID créature canonicalisé explicitement ;
6. reject sur conflit différent ;
7. no-op sur contenu identique ;
8. replace explicite ;
9. aucune copie de skills dans package créature ;
10. aucune dépendance interdite.

### Critère de fin

- RED ;
- contrats/adaptateur pur ;
- CI complète GREEN ;
- checkpoint GREEN ;
- seulement ensuite Human Editor Files UI.

### Résultat — Capture Entity Transfer Packages V1

RED :

- commit : `764fadde04dbd3165d294eeeed63b04d29eb7905` ;
- run : `36679017939` ;
- 671 tests, 670 PASS, 1 FAIL attendu : contrats unitaires absents.

Implémentation :

- `CaptureCreatureTransferV1` ;
- `CaptureSkillTransferV1` ;
- `capture-entity-transfer-v1.js`.

Exports unitaires :

- créature = draft + statValues + loadout, aucune copie de SkillDefinition ;
- capacité = CaptureSkillEditorDraftV1 complet ;
- base complète = CaptureDatabaseV1 existant.

Import :

- auto-détection par schema ;
- ancien ID créature explicitement connu canonicalisé avant validation/conflit ;
- évolution targetId canonicalisée avec le même resolver ;
- `reject` par défaut ;
- contenu identique = no-op ;
- contenu différent + reject = conflit ;
- contenu différent + replace = remplacement entier ;
- aucun patch/merge champ par champ.

GREEN :

- run `36679162092` ;
- structure / frontières / indépendance : OK ;
- **679 / 679 PASS / 0 FAIL**.

Étape suivante : Human Editor Files UI.

## Micro-lot — Capture Human Editor Files UI V1 — 2026-09-30

Base :

- checkpoint GREEN Entity Transfer Packages :
  `checkpoint/lab-capture-entity-transfer-packages-v1-green-2026-09-30` ;
- SHA : `5bc2da5fa6595ece89ed527ba6e55f0446f12c34` ;
- CI : run `36679237801`, 679/679 PASS.

Checkpoint départ :

`checkpoint/lab-start-capture-human-editor-files-ui-v1-2026-09-30`.

Branche :

`work/lab-capture-human-editor-files-ui-v1-2026-09-30`.

### Objectif

Raccorder les contrats/transferts GREEN au Human Editor sans créer de deuxième état.

Workflow utilisateur :

1. **Exporter cette créature** ;
2. **Exporter cette capacité** ;
3. **Exporter toute la base** ;
4. **Importer JSON** ;
5. option explicite **Remplacer les IDs existants**.

### Source de vérité

La session active existante reste propriétaire :

- `configuredCreatures` ;
- `configuredSkills` ;
- `statRegistry` ;
- `progressionRules`.

Aucune nouvelle Map de données métier.

Les fichiers sont seulement un transport.

### Export

- créature : le record courant normalisé `{draft,statValues,loadout}` ;
- capacité : le draft courant normalisé ;
- base complète : composition des Maps + registre + progression via `CaptureDatabaseV1`.

Avant export de l'entité courante, l'UI construit l'état courant depuis les contrôles via les builders existants. Elle ne lit pas un snapshot Combat.

### Import

Chaîne obligatoire :

`File.text() -> importCaptureTransferJsonV1 -> planCaptureTransferImportV1 -> application du plan aux Maps`.

Mode :

- case décochée -> `reject` ;
- case cochée -> `replace`.

Application :

- insert/replace skill -> `configuredSkills` ;
- insert/replace creature -> `configuredCreatures` ;
- replace-database -> remplace explicitement le contenu des deux Maps + registre + progression ;
- noop -> aucun changement.

Après application :

- listes UI rafraîchies ;
- registre/progression rerendus si base complète ;
- aucune fusion champ-par-champ ;
- aucun stockage navigateur.

### Fichiers autorisés

- nouveau `src/ui/capture-editor-file-transfer-v1.js` pour composer/appliquer l'état de session sans DOM ;
- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- `examples/dom-demo/capture-editor-v2.css` si nécessaire ;
- tests dédiés ;
- docs.

### Protégé

- contrats Database / Creature Transfer / Skill Transfer ;
- Entity Transfer adapter ;
- Combat Runtime ;
- FX / Renderer ;
- catalogues Capture ;
- aucun localStorage/sessionStorage/IndexedDB ;
- aucune logique de validation recopiée dans l'UI.

### RED attendu

1. contrôles export créature/capacité/base présents ;
2. input fichier JSON présent ;
3. case replace explicite présente ;
4. export session compose Database V1, sans battle/runtime snapshot ;
5. application insert/noop/replace sur les Maps ;
6. replace-database remplace les Maps et les propriétaires globaux ;
7. ancien ID reste canonicalisé par l'adaptateur, pas par l'UI ;
8. Human Editor appelle les adapters propriétaires ;
9. aucun storage/network ;
10. Blob/ObjectURL/File.text limités au raccord navigateur ;
11. erreurs/conflits affichés sans mutation partielle.

### Critère de fin

- RED ciblé ;
- raccord browser minimal ;
- tests purs d'application des plans ;
- CI complète GREEN ;
- checkpoint PREVALIDATION ;
- lien smartphone ;
- validation utilisateur export -> import réel.

### Résultat — Capture Human Editor Files UI V1

RED :

- commit : `1f790231ec3cc74c80f26479864b966fc03c1896` ;
- run : `36682512412` ;
- 680 tests, 679 PASS, 1 FAIL attendu ;
- cause : helper de session fichiers absent.

Implémentation :

- nouveau `src/ui/capture-editor-file-transfer-v1.js` ;
- le helper compose une `CaptureDatabaseV1` directement depuis :
  - `configuredCreatures` ;
  - `configuredSkills` ;
  - `statRegistry` ;
  - `progressionRules` ;
- le helper applique les plans `insert/replace/noop/replace-database` aux mêmes Maps existantes ;
- aucune seconde bibliothèque ou Map métier.

Human Editor :

- bouton **Exporter cette créature** ;
- bouton **Exporter cette capacité** ;
- bouton **Exporter toute la base** ;
- input **Importer un fichier JSON** ;
- case **Remplacer explicitement les IDs existants**.

Exports :

- créature courante : construit le record normalisé actuel puis appelle `exportCaptureCreatureTransferJsonV1()` ;
- capacité courante : construit le draft normalisé actuel puis appelle `exportCaptureSkillTransferJsonV1()` ;
- base complète : compose la session via `buildCaptureEditorDatabaseV1()` puis sérialise avec `exportCaptureDatabaseJsonV1()` ;
- la base complète refuse un export si une créature/capacité possède des changements non enregistrés, afin de ne pas exporter une Map obsolète.

Import :

`File.text() -> importCaptureTransferJsonV1() -> planCaptureTransferImportV1() -> applyCaptureTransferPlanToEditorStateV1()`.

- mode par défaut : `reject` ;
- case cochée : `replace` ;
- conflits calculés avant mutation ;
- `replace-database` remplace explicitement Maps + registre + progression ;
- listes, évolution, loadout, registre et progression sont rerendus après application ;
- les alias historiques restent canonicalisés uniquement par l'adaptateur propriétaire.

Browser I/O :

- `Blob` / `URL.createObjectURL` uniquement dans le Human Editor pour déclencher le téléchargement ;
- `File.text()` uniquement dans le Human Editor ;
- aucun FileReader dans les contrats/adaptateurs purs ;
- aucun localStorage/sessionStorage/IndexedDB ;
- aucun réseau.

Assets :

- les JSON transportent les `assetId` des Presentation Bindings ;
- les PNG/sprites/sons eux-mêmes ne sont pas embarqués ;
- cela permet de créer ensuite les assets manquants et de les raccorder sans modifier les données métier.

GREEN technique :

- run `36682988707` ;
- structure / frontières / indépendance : OK ;
- **685 / 685 PASS / 0 FAIL**.

État :

**GREEN technique — PREVALIDATION smartphone requise**.

Validation utilisateur attendue :

1. exporter une créature ;
2. exporter une capacité ;
3. exporter toute la base ;
4. réimporter un export identique -> no-op ;
5. importer une version différente sans replace -> conflit visible ;
6. cocher replace -> remplacement explicite ;
7. vérifier que les listes restent sans doublon Ailevent ;
8. vérifier qu'aucune configuration Ultime / effets tactiques / projectile power / assets n'est perdue.


## Micro-lot correctif — Capture Planned Loadout / Mobile Footer V1 — 2026-09-30

Base :
- checkpoint PREVALIDATION Human Editor Files UI :
  `checkpoint/lab-capture-human-editor-files-ui-v1-prevalidation-green-2026-09-30` ;
- SHA de base : `f73943094e7c79131e80a5ea725b5c838e56242e` ;
- CI de base vérifiée : run `36683108237`, job `foundation` SUCCESS, 685/685 PASS selon le dernier état documenté.

Checkpoint de départ :
`checkpoint/lab-start-capture-planned-loadout-mobile-fix-v1-2026-09-30`.

Branche :
`work/lab-capture-planned-loadout-mobile-fix-v1-2026-09-30`.

### Retour utilisateur reproduit / périmètre

1. Sur smartphone, le footer fixe « Validation » peut recouvrir le bas de la carte « Capacités équipées », notamment le Slot 4.
2. L'éditeur empêche actuellement de préparer un loadout futur :
   - les options dont `requiredLevel` dépasse le niveau courant sont désactivées ;
   - les slots non encore débloqués sont désactivés/refusés ;
   - la validation rejette un loadout contenant une capacité future.

### Cause prouvée avant correction

- présentation : `.editor-footer` est `position: fixed` et devient vertical sur mobile alors que le shell ne réserve qu'un espace fixe insuffisant ;
- progression : le Human Editor confond la configuration persistée du loadout avec sa projection active au niveau courant.

### Objectif

Permettre d'enregistrer les quatre slots comme plan de progression, y compris des capacités de niveau futur, tout en n'exposant au combat que les slots et capacités réellement débloqués au niveau courant.

### Propriétaires / frontières

- `CaptureActiveSkillLoadoutV1` reste le propriétaire des quatre affectations enregistrées ;
- `CaptureProgressionRulesV1` reste propriétaire du nombre de slots actifs par niveau ;
- `CaptureSkillEditorDraftV1.requiredLevel` reste propriétaire du niveau requis d'une capacité ;
- la projection vers le snapshot Combat appartient à l'adaptateur d'export, pas au DOM ;
- le CSS ne modifie aucune règle métier.

### Fichiers autorisés

- `src/ui/capture-editor-human-v2.js` ;
- `src/adapters/input/capture/capture-editor-exporter-v3.js` ;
- nouveau helper pur d'adaptation si nécessaire sous `src/adapters/input/capture/` ;
- `examples/dom-demo/capture-editor-v2.html` pour libellés uniquement si nécessaire ;
- `examples/dom-demo/capture-editor-v2.css` ;
- tests progression/export/UI ciblés ;
- `docs/LAB_ARCHITECTURE.md` ;
- `docs/LAB_CURRENT_WORK.md`.

### Protégé

- contrats de transfert Database/Entity ;
- import/export JSON et politique reject/replace ;
- Runtime / Action Resolver / FX / Renderer ;
- catalogues Capture ;
- aucune persistance navigateur ;
- aucune modification de `Zombicide-40k`.

### RED attendu

- un loadout peut conserver une capacité future dans un slot futur sans erreur de configuration ;
- les quatre selects restent configurables quel que soit le niveau courant ;
- l'export Combat filtre les slots non débloqués et les capacités dont `requiredLevel` n'est pas atteint ;
- la même configuration devient disponible automatiquement quand le niveau atteint les seuils ;
- le footer mobile ne reste pas fixe au-dessus du contenu.

### Critère de fin

RED démontré -> cause confirmée -> correction minimale -> CI complète verte -> documentation -> checkpoint PREVALIDATION smartphone.


### Résultat — Capture Planned Loadout / Mobile Footer V1

RED démontré :

- commit : `2cf431184fe0dbee006fd55bd0bda6cef5b26d53` ;
- CI : run `36686191711` ;
- 689 tests, 685 PASS, 4 FAIL ciblés ;
- défauts reproduits :
  - capacité de niveau futur refusée par la validation UI ;
  - export Combat sans propriétaire de projection progression ;
  - options/slots désactivés selon le niveau courant ;
  - footer mobile fixe recouvrant le contenu bas.

Cause :

- le Human Editor mélangeait configuration persistée et disponibilité de combat ;
- `CaptureEditorExportV3` recevait le loadout complet sans projection des règles de progression ;
- le footer `position: fixed` devenait vertical sur smartphone tout en conservant une réserve basse fixe insuffisante.

Correction minimale :

- nouveau pur adapter `src/adapters/input/capture/capture-planned-loadout-to-combat-v1.js` ;
- `CaptureActiveSkillLoadoutV1` conserve les quatre affectations configurées ;
- l'export Combat applique `CaptureProgressionRulesV1` + `requiredLevel` uniquement à une copie de projection runtime ;
- le Human Editor n'interdit plus de préparer un slot ou une capacité future ;
- les libellés indiquent le niveau de déverrouillage sans rendre l'option inaccessible ;
- sur smartphone <= 520 px, le footer Validation revient dans le flux normal et ne peut plus masquer le Slot 4 ;
- Database / Entity Transfer / import-export JSON inchangés ;
- aucun Runtime, FX, Renderer, storage ou `Zombicide-40k` modifié.

Sentinelle historique réconciliée :

- l'ancienne sentinelle qui exigeait le rejet des capacités futures a été remplacée par la règle validée : la configuration future est autorisée, la disponibilité de combat reste projetée par ses propriétaires.

GREEN technique code/tests :

- commit : `f20d875bf5cf1ec8aed6bd1bf628c7a1b881e9ba` ;
- CI : run `36686829937` ;
- structure / frontières / indépendance : OK ;
- **689 / 689 PASS / 0 FAIL**.

État :

**GREEN technique — documentation synchronisée puis PREVALIDATION smartphone requise.**

Validation utilisateur attendue :

1. sur smartphone, vérifier que Slot 4 reste visible et touchable jusqu'en bas de la page ;
2. avec une créature niveau 1/5, affecter une capacité niveau 10 ou 20 à un slot et enregistrer la créature ;
3. réouvrir/sélectionner la créature : l'affectation future doit être conservée ;
4. vérifier le combat au niveau bas : les slots/capacités encore verrouillés ne doivent pas apparaître comme actifs ;
5. monter le niveau de la créature aux seuils configurés puis retester : les affectations préparées doivent devenir actives sans les reconfigurer ;
6. revalider le workflow Export/Import du chantier parent (créature/capacité/base/noop/conflit/replace).


## Micro-lot — Capture Arena Scale Perception V1 — 2026-09-30

Base :
- SHA PREVALIDATION précédent : `19c679adac6f33208392d2dc2c4e9d41df68eaf2` ;
- CI vérifiée sur ce SHA : SUCCESS, 689/689 PASS ;
- aucun merge `main`.

Checkpoint de départ :
`checkpoint/lab-start-capture-arena-scale-perception-v1-2026-09-30`.

Branche :
`work/lab-capture-arena-scale-perception-v1-2026-09-30`.

### Retour utilisateur

Les créatures peuvent être réglées grandes mais ne donnent pas une impression de masse/grandeur en combat. L'arène paraît trop dominante et trop vue en plongée ; les éléments de décor semblent grands par rapport aux combattants.

### Diagnostic initial prouvé

- la preview Capture force actuellement l'arène `city` ;
- son binding utilise `backgroundSize: "auto 112%"`, donc le décor est volontairement zoomé ;
- la composition 2v2 place les adversaires vers 31–32 % de hauteur et les alliés vers 66–70 %, ce qui accentue fortement la profondeur diagonale ;
- le `displayScale` de la créature est déjà une donnée propriétaire : il ne doit pas être détourné pour compenser la caméra.

### Objectif

Améliorer la perception de taille sans modifier la taille enregistrée des créatures :
1. décor Ville moins zoomé ;
2. composition plus frontale / moins plongeante ;
3. repère de contact au sol renforçant la masse visuelle ;
4. conserver les mouvements, FX, ciblage et gameplay inchangés.

### Propriétaires / frontières

- Arena Presentation : cadrage du fond ;
- Demo/Renderer CSS : composition de scène et contact visuel au sol ;
- Creature Presentation Binding : `displayScale` protégé et inchangé ;
- Animation Core perspective dynamique protégée ;
- Combat Runtime / règles protégés.

### Fichiers autorisés

- `examples/dom-demo/demo-assets.js` ;
- `examples/dom-demo/demo.css` ;
- tests UI/presentation ciblés ;
- `docs/LAB_ARCHITECTURE.md` ;
- `docs/LAB_CURRENT_WORK.md`.

### Interdit dans ce lot

- modifier les valeurs `displayScale` des créatures ;
- modifier positions de gameplay, dégâts, portée ou ciblage ;
- modifier Animation Core / FX Core ;
- remplacer les assets binaires d'arène ;
- toucher `Zombicide-40k`.

### RED attendu

- la Ville ne doit plus être agrandie au-delà de 100 % de hauteur dans la preview ;
- les positions statiques doivent utiliser une composition frontale centralisée, avec profondeur verticale réduite ;
- les combattants doivent disposer d'une ombre/contact au sol purement visuelle ;
- aucun changement du contrat `displayScale`.

### Critère de fin

RED ciblé -> correction présentation minimale -> CI complète -> documentation -> checkpoint PREVALIDATION smartphone.


### Résultat — Capture Arena Scale Perception V1

RED :
- commit `db6603a5f1472f8eac41e922e2f57fabf30d12e3` ;
- CI run `36688294973` ;
- 693 tests, 690 PASS, 3 FAIL ciblés.

Cause prouvée :
- arène Ville zoomée à `auto 112%` ;
- profondeur statique très marquée : adversaires ~31–32 %, proches ~66–70 % ;
- aucune ombre de contact dédiée pour ancrer visuellement les combattants ;
- `displayScale` lui-même n'était pas la cause et reste protégé.

Correction :
- Ville : `backgroundSize: "auto 100%"` ;
- ancres de scène centralisées :
  - 1v1 : proche 62 %, éloigné 38 % ;
  - 2v2 : proches 67/64 %, éloignés 36/37 % ;
- anciens overrides smartphone utilisent les mêmes ancres au lieu de réintroduire la plongée ;
- paysage compact utilise également les ancres 1v1 ;
- ombre elliptique de contact purement visuelle sous chaque fighter ;
- tailles/left/FX/mouvements/Runtime inchangés ;
- aucun asset binaire remplacé.

Sentinelles historiques :
- les deux tests qui figeaient l'ancien `112%` et les anciennes positions absolues ont été réconciliés avec le nouveau propriétaire visuel.

GREEN technique :
- commit `2a46b17b1fe8cced954b599426d53edd66a6b43f` ;
- CI run `36688554335` ;
- structure / frontières / indépendance : OK ;
- **693 / 693 PASS / 0 FAIL**.

État :
**GREEN technique — PREVALIDATION visuelle smartphone requise.**

Test utilisateur :
1. comparer la sensation de taille avec une créature scale 1 puis une grande créature ;
2. vérifier que le décor semble moins dominant ;
3. vérifier que le combat paraît moins vu de haut / plus frontal ;
4. vérifier 1v1 et 2v2 ;
5. vérifier que projectiles, attaques au sol/aériennes/téléportation restent visuellement cohérents.


## Micro-lot — Creature Motion Profiles V1 — 2026-09-30

Base :
- checkpoint PREVALIDATION Arena Scale Perception :
  `checkpoint/lab-capture-arena-scale-perception-v1-prevalidation-green-2026-09-30` ;
- SHA de base : `ed52f1b8516414c712b3f6c2c302dfcf1a6a0600` ;
- CI de base vérifiée : SUCCESS, 693/693 PASS ;
- aucun merge `main`.

Checkpoint de départ :
`checkpoint/lab-start-creature-motion-profiles-v1-2026-09-30`.

Branche :
`work/lab-creature-motion-profiles-v1-2026-09-30`.

### Retour utilisateur / objectif

Améliorer la sensation de morphologie et de masse sans modifier les règles de combat :

1. ombre de contact plus prononcée, dont la taille suit le `displayScale` de la créature ;
2. rampant/serpentin : idle très discret au ras du sol et déplacement très linéaire ;
3. bipède : idle avec pieds visuellement ancrés, mouvement concentré vers le haut du corps ; déplacement par petits bonds ;
4. quadrupède : idle avec appuis visuellement ancrés ; déplacement par bonds plus longs que le bipède ;
5. volant : idle avec oscillation verticale lisible ;
6. massif/golem : locomotion lourde ; chaque retombée/contact au sol peut produire un micro-shake caméra via FX Core.

### Propriétaires / frontières

- Creature Profile : paramètres morphologiques `idle`, locomotion et impulsions de contact ;
- Animation Core : séquencement/timing des transformations et contacts de locomotion ;
- FX Core : planification du shake caméra uniquement ;
- Render Adapter : application des plans Animation/FX ;
- `CreaturePresentationBindingV2.displayScale` reste l'unique taille configurée de la créature ;
- Combat Rules / Runtime / distance restent propriétaires du résultat métier `moved`.

### Diagnostic initial

- l'idle actuel translate l'image complète via `bobY/swayX`, ce qui déplace mécaniquement les pieds/appuis ;
- les profils bipède/quadrupède/massif n'ont pas de contrat de locomotion explicite ;
- `dom-distance-presenter` applique actuellement directement les nouvelles ancres de distance, sans animation morphologique ;
- FX Core ne possède encore aucun plan caméra générique ;
- l'ombre de contact actuelle est portée par le fighter et ne reçoit pas explicitement le `displayScale`.

### Fichiers autorisés

- `data/profiles/*.profile.json` ;
- `src/core/profiles/profile-registry.js` si validation du nouveau contrat nécessaire ;
- `src/core/animation/*` ;
- nouveau module ciblé sous `src/core/fx/` pour les FX de locomotion/caméra ;
- `src/adapters/renderer/dom-actor-renderer.js` / `dom-keyframes.js` si le pivot d'animation doit être appliqué proprement ;
- `src/adapters/renderer/dom-distance-presenter.js` ;
- nouveau renderer caméra ciblé si nécessaire ;
- `src/ui/demo-app.js` uniquement pour le raccord des propriétaires ;
- `examples/dom-demo/demo.css` pour l'ombre de contact et variables de présentation ;
- tests ciblés ;
- `docs/LAB_ARCHITECTURE.md` ;
- `docs/LAB_CURRENT_WORK.md`.

### Protégé / hors périmètre

- Combat Runtime / Action Resolver / coût de déplacement ;
- dégâts, portée, ciblage, énergie ;
- SkillDefinition / FX de compétences ;
- valeurs `displayScale` enregistrées ;
- assets binaires de créatures et d'arènes ;
- cadrage/background des arènes ;
- `Zombicide-40k`.

Les nouvelles arènes plus profondes / moins vues du dessus seront produites dans un autre chantier puis raccordées par un lot séparé.

### RED attendu

- bipède/quadrupède/massif : idle sans translation X/Y du socle, avec pivot bas explicite ;
- serpentin/rampant : translation verticale idle fortement réduite et locomotion linéaire ;
- volant/drake : vraie oscillation verticale conservée/dédiée ;
- locomotion bipède : arc court ;
- locomotion quadrupède : arc plus ample/long que bipède ;
- locomotion massif : contacts de pas explicites produisant des demandes `camera-shake` au FX Core ;
- aucun shake caméra décidé par l'UI ou Combat Rules ;
- ombre : scale dérivé du scale visuel de l'acteur, sans deuxième source de taille.

### Critère de fin

RED ciblé -> cause démontrée -> contrats data-driven -> implémentation minimale -> vrai chemin déplacement -> CI complète -> documentation -> checkpoint PREVALIDATION smartphone.


### Résultat — Creature Motion Profiles V1

RED démontré :

- commit : `84014c22c58457f0659112400970dccba816cef0` ;
- CI : run `36692032218` ;
- **700 tests, 693 PASS, 7 FAIL ciblés** ;
- aucune sentinelle historique étrangère au périmètre n'était rouge à ce stade.

Les 7 défauts reproduits étaient exactement :

1. absence de preset `locomotion` sur les profils ;
2. idle bipède/quadrupède/massif sans pivot bas et avec glissement des appuis ;
3. rampant trop mobile verticalement / volant trop statique ;
4. absence d'événement/plan `move` morphologique ;
5. absence de cues `footfall` pour le massif ;
6. absence de propriétaire FX caméra pour ces contacts ;
7. ombre sans projection explicite du `displayScale`.

Implémentation :

- ajout de `locomotion` data-driven aux cinq profils live ;
- bipède : petit bond ;
- quadrupède : bond plus ample ;
- serpentin/rampant : glissement linéaire au sol ;
- drake/volant : oscillation verticale lisible ;
- massif : deux contacts de pas par déplacement lourd ;
- `CombatVisualEvent.move` ;
- `AnimationPlan` supporte un pivot d'animation optionnel et des cues temporels ;
- les idle ancrés utilisent un pivot bas sans translation X/Y ;
- `locomotion-fx-plan.js` traduit seulement les contacts configurés en `camera-shake` ;
- `dom-camera-fx.js` applique le shake et en reste l'unique renderer ;
- le vrai déplacement adverse `moved` déclenche la locomotion visuelle ;
- `dom-distance-presenter` reçoit la durée du plan pour synchroniser la transition ;
- ombre de contact renforcée et dimensionnée depuis `VisualActor.scale`.

Réconciliation de sentinelles historiques :

- l'ancienne comparaison « serpentin très flottant / drake presque immobile » a été remplacée par la règle utilisateur actuelle : rampant au sol, volant vertical ;
- la valeur de déformation idle du drake a été conservée à l'identique hors `bobY` afin d'éviter une modification non demandée ;
- la transition spatiale historique figée à 260 ms accepte désormais la durée du profil ;
- un `-0` détecté sur les idle totalement ancrés a été normalisé en vrai `0` ;
- la garde d'architecture interdisant à Demo UI de posséder des durées reste verte.

GREEN intermédiaire :

- CI run `36692956717` ;
- **700/700 PASS / 0 FAIL**.

Vrai chemin ajouté :

- profil Massif -> `move` -> AnimationPlan -> DOM timeline ;
- cue `footfall` -> FX Core -> plan `camera-shake` -> DOM Camera FX Renderer ;
- durée locomotion -> DOM Distance Presenter ;
- Combat UI ne contient ni amplitude ni règle caméra.

GREEN technique final avant documentation :

- commit : `c4f3eef51d8c17311ead970dd8dd3c53644a2c37` ;
- CI : run `36693062137` ;
- structure / frontières / indépendance : OK ;
- **703 / 703 PASS / 0 FAIL**.

Protégé / inchangé :

- coûts et résultat gameplay du déplacement ;
- Combat Runtime / Action Resolver ;
- dégâts, portée, ciblage et énergie ;
- Skill FX existants ;
- valeurs enregistrées `displayScale` ;
- assets binaires de créatures ;
- assets/cadrage d'arènes ;
- `Zombicide-40k`.

État :

**GREEN technique — documentation synchronisée ; PREVALIDATION smartphone requise avant GREEN utilisateur.**

Validation smartphone attendue :

1. bipède : vérifier qu'en idle les pieds restent visuellement fixes et que seul le haut du corps respire/balance ;
2. quadrupède : mêmes appuis stables, puis bond plus ample que le bipède lors d'un déplacement ;
3. rampant/serpentin : très peu de mouvement idle et déplacement au ras du sol ;
4. volant/drake : oscillation verticale naturelle ;
5. massif/golem : déplacement lourd avec micro-shake à chaque contact de pas, sans secousse continue ;
6. comparer une petite et une grande créature : l'ombre doit être plus présente et suivre le `displayScale` ;
7. vérifier qu'attaques, projectiles, téléportation et FX existants restent cohérents.

Les nouvelles arènes plus profondes / moins vues du dessus restent réservées au chantier séparé prévu par Sylvain.


### Retour PREVALIDATION smartphone — locomotion non visible en combat

Retour Sylvain :
- idle visiblement amélioré ;
- aucun changement perceptible sur les déplacements pendant le combat.

Diagnostic :
- le premier raccord appliquait `profile.locomotion` au résultat métier rare `moved` / repositionnement de distance ;
- le chemin réellement observé pendant une attaque de contact, `approachMode:"ground" -> ground-attack`, conservait un segment unique rectiligne et ignorait donc totalement la morphologie ;
- la compétence de test `Griffe` utilise bien `approachMode:"ground"`, ce qui reproduisait directement le défaut utilisateur.

RED correctif :
- commit : `8feb653e3ee2948cee52a9306c698e3a052c48e3` ;
- CI run : `36695801043` ;
- **704 tests, 703 PASS, 1 FAIL ciblé** ;
- seul le nouveau vrai chemin `ground-attack -> locomotion morphologique` était rouge.

Correction :
- `ground-attack` consomme désormais `profile.locomotion` ;
- rampant : trajet linéaire sans hop ;
- bipède : petit bond pendant l'approche ;
- quadrupède : bond plus ample ;
- massif : phases lourdes + deux `footfall` sur l'approche ;
- la durée totale avant impact reste exactement `travelMs` ;
- le dernier segment reste `ground-approach-impact` et atteint exactement la cible ;
- le scale de perspective existant est conservé et interpolé ;
- les cues de l'approche sont routés vers le même `planLocomotionCueFx -> dom-camera-fx` ;
- téléportation et aérien restent inchangés.

Réconciliation :
- les anciennes sentinelles qui imposaient un seul segment `ground-approach-impact` ont été remplacées par des invariants plus forts :
  - somme des phases = `travelMs` ;
  - dernier segment = impact exact ;
  - perspective conservée ;
  - retour maison conservé ;
  - morphologie réellement différente selon le profil.

GREEN correctif :
- CI run : `36696218946` ;
- structure / frontières / indépendance : OK ;
- **704 / 704 PASS / 0 FAIL**.

État :
**GREEN technique correctif — nouvelle PREVALIDATION smartphone requise.**

Test utilisateur attendu :
1. utiliser une capacité de contact au sol telle que `Griffe` ;
2. comparer rampant / bipède / quadrupède / massif ;
3. vérifier que le rampant glisse, le bipède fait un petit bond, le quadrupède un bond plus ample ;
4. vérifier que le Massif avance lourdement et déclenche ses micro-shakes aux contacts ;
5. vérifier que l'impact arrive toujours au bon moment et à la bonne cible.


## Micro-lot — Creature Motion Tuning V2 — 2026-09-30

Base :
- SHA : `d5b1a7d1c2278a68ad95f31421be6a8f2c927570` ;
- checkpoint : `checkpoint/lab-start-creature-motion-tuning-v2-2026-09-30` ;
- branche : `work/lab-creature-motion-tuning-v2-2026-09-30` ;
- CI de base : GREEN, 704/704 PASS.

### Retour smartphone utilisateur

- idle : amélioration visible et validée directionnellement ;
- locomotion : mouvement désormais visible ;
- quadrupède : demande de **deux bonds distincts** avant l'arrivée à la cible ;
- bipède : petit bond à rendre **un peu plus marqué**.

### Propriétaires

- Creature Profile : amplitudes et nombre de phases ;
- Animation Core : consomme ces phases sans règle spécifique par nom de créature.

### Fichiers autorisés

- `data/profiles/biped.profile.json` ;
- `data/profiles/quadruped.profile.json` ;
- tests ciblés locomotion ;
- documentation du lot.

### Protégé

- Runtime combat ;
- énergie/cooldowns ;
- timing d'impact `travelMs` ;
- règles de dégâts/portée/ciblage ;
- FX et caméra ;
- autres profils ;
- assets/arènes ;
- `Zombicide-40k`.

### RED attendu

- quadrupède : le plan `ground-attack` doit exposer deux phases de montée et deux retombées avant impact ;
- bipède : amplitude verticale supérieure à la V1 tout en restant inférieure au quadrupède ;
- arrivée exacte à la cible et somme d'approche = `travelMs`.

### Critère de fin

RED ciblé -> réglage data-driven minimal -> CI complète -> preview smartphone.


### Résultat — Creature Motion Tuning V2

RED :
- commit `c433ea244c0e8b25dfcb853550d7c9c18f063752` ;
- CI `36697903903` ;
- **705 tests, 704 PASS, 1 FAIL ciblé**.

Correction data-driven uniquement :
- bipède : amplitude du bond portée de 6 px à 9 px ;
- quadrupède : deux bonds distincts avant impact (deux montées + deux retombées) ;
- aucun changement Animation Core ;
- `travelMs`, arrivée exacte, dégâts et règles combat inchangés.

GREEN :
- commit profils : `61b8baab37da3d4cde368f15b3b72f7f6d4d0bf0` ;
- CI `36698133611` ;
- structure / frontières / indépendance : OK ;
- **705/705 PASS / 0 FAIL**.

État :
**GREEN technique — PREVALIDATION smartphone.**


## Micro-lot — Skill Availability Refresh V1 — 2026-09-30

Base :
- SHA : `e236dd454690a75095754e830e6e0c9ff9b81dc8` ;
- checkpoint : `checkpoint/lab-start-skill-availability-refresh-v1-2026-09-30` ;
- branche : `work/lab-skill-availability-refresh-v1-2026-09-30`.

### Retour smartphone utilisateur

Dans le preview Capture, après environ deux utilisations de capacités, les capacités peuvent rester indisponibles alors que la jauge d'énergie est suffisante.

### Diagnostic initial

Le vrai preview Capture 1v1/2v2 utilise `combat-2v2-test-ui.js`.
La disponibilité d'un bouton dépend de `session.previewSkill()`.
Le Core peut refuser notamment pour cooldown, énergie, portée, statut ou cible.
Le `CombatRuntime.stateSignal()` ne transporte actuellement pas `fighter.skillCooldowns`. Une expiration de cooldown peut donc modifier l'autorité Combat State sans déclencher `onState` si aucun autre champ signalé ne change, laissant l'UI avec un état de disponibilité obsolète.

### Propriétaires

- Combat State / Action Resolver : restent propriétaires des cooldowns et de l'autorisation réelle ;
- Combat Runtime : propriétaire de la notification d'un changement d'état runtime ;
- Demo UI : affiche seulement `previewSkill()`, aucune règle dupliquée.

### Fichiers autorisés

- `src/core/combat/combat-runtime.js` ;
- tests Combat Runtime / vrai preview ciblés ;
- documentation.

### Protégé

- coût énergie ;
- durée de cooldown configurée ;
- calcul portée/ciblage ;
- SkillDefinition ;
- effets tactiques ;
- Animation / FX / renderer ;
- profils de créature ;
- assets/arènes ;
- `Zombicide-40k`.

### RED attendu

Démontrer qu'une expiration de cooldown, à énergie/HP constants et sans action active, doit provoquer un `onState` permettant à l'UI de recalculer `previewSkill()`.

### Critère de fin

RED ciblé -> correction de la cause dans le signal Runtime -> CI complète -> preview smartphone.


### Résultat — Skill Availability Refresh V1

RED :
- commit `172fbae71503725f587648876f244f245feb45b6` ;
- CI `36698518135` ;
- **706 tests, 705 PASS, 1 FAIL ciblé** ;
- le Combat State avait bien expiré le cooldown et `previewSkill()` retournait `ok:true`, mais aucun nouvel `onState` n'était émis lorsque PV/énergie restaient constants.

Cause :
- `CombatRuntime.stateSignal()` ne signalait qu'une projection trop étroite du fighter ;
- les changements sémantiques non inclus dans cette projection pouvaient donc ne pas réveiller les consommateurs.

Correction :
- le Runtime compare désormais l'état sémantique observable du fighter ;
- seul `energyChargeProgressMs`, progression interne de recharge sans changement visible, est exclu du signal ;
- Combat State / Action Resolver restent propriétaires des cooldowns ;
- aucune durée, coût ou règle de disponibilité n'est recodée dans Runtime ou UI.

GREEN :
- commit `36d1e212c889b355792c712dd781260da02b7350` ;
- CI `36698619772` ;
- structure / frontières / indépendance : OK ;
- **706/706 PASS / 0 FAIL**.

État :
**GREEN technique — PREVALIDATION smartphone requise.**


## Micro-lot — Creature Hop Fluidity V3 — 2026-09-30

Base :
- SHA : `75c39a9ea89ff60888476e545623923bc03da76c` ;
- checkpoint : `checkpoint/lab-start-creature-hop-fluidity-v3-2026-09-30` ;
- branche : `work/lab-creature-hop-fluidity-v3-2026-09-30`.

### Retour smartphone utilisateur

- bipède : encore trop peu de bonds ;
- bonds : rendu trop sec / pas assez fluide ;
- chaque pas doit couvrir une distance horizontale approximativement identique ;
- lecture recherchée : petits arcs réguliers avec montée puis descente visible.

### Propriétaires

- Creature Profile : nombre de bonds, amplitude verticale, rythme relatif des phases ;
- Animation Core : consomme uniquement les phases et interpole vers la cible ;
- aucun calcul de locomotion n'est ajouté dans l'UI.

### Fichiers autorisés

- `data/profiles/biped.profile.json` ;
- `data/profiles/quadruped.profile.json` ;
- tests ciblés de locomotion ;
- documentation.

### Protégé

- Combat Runtime / Combat State / disponibilité des compétences ;
- coûts énergie et cooldowns ;
- dégâts / portée / ciblage ;
- Animation Core ;
- FX / caméra ;
- autres morphologies ;
- assets / arènes ;
- `Zombicide-40k`.

### RED attendu

- bipède : 3 arcs complets avant impact, avec intervalles horizontaux réguliers ;
- quadrupède : 2 arcs complets avant impact, avec intervalles horizontaux réguliers ;
- chaque arc alterne montée puis retour au sol ;
- amplitude verticale bipède supérieure à V2 mais inférieure au quadrupède ;
- somme des segments = `travelMs` et impact final exactement sur la cible.

### Critère de fin

RED ciblé -> réglage data-driven uniquement -> CI complète -> preview smartphone.


### Résultat — Creature Hop Fluidity V3

RED :
- commit `a5c4e719fac1c34f7764ea341c4e4fc7c551da5f` ;
- CI `36700164711` ;
- **707 tests, 706 PASS, 1 FAIL ciblé**.

Correction data-driven uniquement :
- bipède : 3 arcs complets et réguliers avant impact ;
- quadrupède : 2 arcs complets, plus longs et plus hauts ;
- points d'atterrissage répartis uniformément sur la trajectoire ;
- montée/descente rendue plus lisible ;
- easing harmonisé en `cubic-bezier(0.45,0,0.55,1)` pour éviter les cassures visuelles ;
- durée locomotion générique : bipède 540 ms, quadrupède 480 ms ;
- aucune modification de l'Animation Core.

GREEN :
- commit profils : `b6422b25a52cd7c6f71bcc63bcbaae2f52471211` ;
- CI `36700267658` ;
- structure / frontières / indépendance : OK ;
- **707/707 PASS / 0 FAIL**.

Protégé / inchangé :
- Combat Runtime / Combat State ;
- correctif disponibilité des compétences conservé ;
- dégâts / énergie / cooldown / portée / ciblage ;
- FX / caméra ;
- assets / arènes ;
- `Zombicide-40k`.

État :
**GREEN technique — PREVALIDATION smartphone requise.**


### Validation utilisateur — Creature Hop Fluidity V3

Validation smartphone reçue le 2026-09-30 :
- bipède : **validé** ;
- quadrupède : **validé**.

Le profil massif/golem n'est pas inclus dans cette validation et fera l'objet d'un micro-lot séparé.

État du lot bipède/quadrupède :
**GREEN utilisateur.**


## Micro-lot — Massive Four-Step Gait V1 — 2026-09-30

Base :
- SHA : `86b84b7021e5a775816b24131708cec8dbb80e4b` ;
- checkpoint : `checkpoint/lab-start-massive-four-step-gait-v1-2026-09-30` ;
- branche : `work/lab-massive-four-step-gait-v1-2026-09-30`.

### Retour smartphone utilisateur

Bipède et quadrupède validés. Pour le profil massif/golem :
- 4 pas complets avant l'arrivée à la cible ;
- chaque pas doit couvrir une distance horizontale comparable ;
- chaque pas doit former un arc montée/descente plus prononcé que le quadrupède ;
- chaque retombée doit produire une secousse caméra distincte ;
- aucune secousse continue.

### Propriétaires

- Creature Profile : nombre de pas, amplitude verticale, rythme et contacts ;
- Animation Core : projection des phases sur le trajet existant, inchangé ;
- FX Core : transforme chaque cue `footfall` en secousse caméra, inchangé.

### Fichiers autorisés

- `data/profiles/massive.profile.json` ;
- tests ciblés locomotion/FX existants ;
- documentation.

### Protégé

- profils bipède/quadrupède validés ;
- Combat Runtime / Combat State ;
- disponibilité compétences / cooldowns / énergie ;
- dégâts / portée / ciblage ;
- Animation Core ;
- FX Core / renderer ;
- assets / arènes ;
- `Zombicide-40k`.

### RED attendu

- massif : 4 arcs complets ;
- 4 atterrissages à 25 %, 50 %, 75 %, 100 % de la distance ;
- 4 cues `footfall`, un par atterrissage ;
- amplitude verticale strictement supérieure au quadrupède ;
- somme approche = `travelMs` et impact final exactement sur la cible.

### Critère de fin

RED ciblé -> réglage du profil massif uniquement -> CI complète -> preview smartphone.


### Résultat — Massive Four-Step Gait V1

RED :
- commit `8d0dde73f72642da2e9924ffb662af5e061bdf9e` ;
- CI `36700941986` ;
- **708 tests, 707 PASS, 1 FAIL ciblé**.

Correction data-driven uniquement :
- massif/golem : 4 arcs complets avant impact ;
- 4 atterrissages à 25 %, 50 %, 75 %, 100 % du trajet ;
- amplitude verticale : 26 px, supérieure au quadrupède validé ;
- 4 cues `footfall`, exactement un par atterrissage ;
- chaque cue emprunte la chaîne existante Animation Core -> FX Core -> caméra ;
- aucune secousse continue ;
- compression légère aux contacts pour renforcer le poids ;
- aucune modification de l'Animation Core, du FX Core ou du renderer.

GREEN :
- commit profil : `a4fccf1fbc1ce16e451068e551f877899279dac4` ;
- CI `36701039455` ;
- structure / frontières / indépendance : OK ;
- **708/708 PASS / 0 FAIL**.

Protégé / inchangé :
- bipède et quadrupède validés ;
- Combat Runtime / disponibilité compétences ;
- énergie / cooldown / dégâts / portée / ciblage ;
- assets / arènes ;
- `Zombicide-40k`.

État :
**GREEN technique — PREVALIDATION smartphone requise.**


## Micro-lot — Flying Profile Canonical V1 — 2026-09-30

Base :
- SHA : `3fe49790c1f6686425c7a24c59cb5fe4f6a9724f` ;
- checkpoint : `checkpoint/lab-start-flying-profile-canonical-v1-2026-09-30` ;
- branche : `work/lab-flying-profile-canonical-v1-2026-09-30`.

### Régression utilisateur

Dans l'éditeur Capture, le style `flying` est sélectionnable mais le preview le refuse comme profil inconnu.

### Cause démontrée avant codage

- l'éditeur expose `flying` dans `capture-editor-v2.html` ;
- le contexte visuel de preview charge encore `drake.profile.json` dont l'ID est `drake` ;
- plusieurs métadonnées de créatures volantes utilisent encore `drake` ;
- l'adaptateur visuel valide strictement que `presentation.profileId` existe dans le registre, donc `flying` est rejeté.

### Décision d'autorité

`flying` devient l'identifiant canonique du profil morphologique volant.

Aucun alias par nom de créature et aucune rustine UI.
Les anciennes références `drake` de la preview sont migrées vers `flying`.

### Fichiers autorisés

- profil volant canonique sous `data/profiles/` ;
- chargeurs de profils de preview ;
- métadonnées / catalogues de créatures de test qui déclarent encore `drake` ;
- tests ciblés profil / export visuel / preview ;
- documentation.

### Protégé

- profils bipède, quadrupède, serpentine et massif ;
- Combat Runtime / Combat State ;
- énergie / cooldown / dégâts / ciblage ;
- Animation Core et FX Core, sauf aucun changement nécessaire ;
- assets binaires ;
- `Zombicide-40k`.

### RED attendu

Un export créature avec `profileId:"flying"` doit être accepté par le vrai adaptateur visuel et le registre de preview doit exposer `flying`, pas seulement `drake`.

### Critère de fin

RED ciblé -> migration canonique `drake -> flying` -> CI complète -> preview smartphone.


### Résultat — Flying Profile Canonical V1

RED :
- commit `527776df2bced07804f200b7e8a2edf1b4f14a79` ;
- CI `36706283024` ;
- **709 tests, 707 PASS, 2 FAIL ciblés** ;
- échecs : profil `flying` absent du contexte de preview et métadonnées historiques `drake` non normalisées.

Correction :
- `data/profiles/flying.profile.json` devient la source canonique du profil volant ;
- `drake.profile.json` supprimé pour éviter une deuxième autorité ;
- preview éditeur et démo générique chargent désormais `flying` ;
- catalogue des créatures de test utilise `profileId:"flying"` ;
- fixture Braisombre migrée vers `flying` ;
- les métadonnées historiques venant de `global-assets` qui exposent encore `drake` sont normalisées explicitement en `flying` dans l'adaptateur d'entrée Capture ;
- aucune détection par nom de créature ;
- sentinelles planner / renderer / structure migrées vers l'ID canonique.

GREEN :
- commit fonctionnel/sentinelles : `6c6ec50d6961da6a7d5165514408012b77da339b` ;
- CI `36706702602` ;
- structure / frontières / indépendance : OK ;
- **709/709 PASS / 0 FAIL**.

État :
**GREEN technique — PREVALIDATION smartphone requise.**
## Micro-lot — Flying Single-Arc Reconciliation V1 — 2026-09-30

Base autoritaire retenue après comparaison réelle des branches :
- SHA : `a93258401c7480e17ea4391a2a1137724b64adcd` ;
- branche source : `work/lab-flying-profile-canonical-v1-2026-09-30` ;
- checkpoint de départ : `checkpoint/lab-start-flying-single-arc-reconciliation-v1-2026-09-30` ;
- branche de travail : `work/lab-flying-single-arc-reconciliation-v1-2026-09-30`.

### Pré-audit de réconciliation

Les branches :
- `work/lab-serpentine-flight-profile-refinement-v1-2026-09-30` ;
- `work/lab-serpentine-flight-motion-v1-2026-09-30`

divergent réellement de la branche canonique depuis le merge-base
`3fe49790c1f6686425c7a24c59cb5fe4f6a9724f`.

Aucun merge aveugle n'est autorisé.

Décisions de conservation :
- `flying` reste l'unique identifiant canonique du profil volant ;
- `drake.profile.json` ne doit pas être recréé ;
- le déplacement `serpentine.locomotion` validé reste strictement inchangé ;
- l'idle serpentin alterné du lot refinement est conservé : base ancrée, aucune translation X/Y, pivot bas, légère oscillation du haut du corps ;
- la locomotion générique volante à apex unique du lot motion est conservée comme donnée du profil canonique `flying` ;
- la présentation d'ombre canonique retenue est la forme imbriquée `presentation.shadow.bottomPct / opacity` ;
- la forme historique plate `presentation.shadowBottomPct` ne doit pas être maintenue en parallèle.

### Cause prouvée du double arc en combat

Le vrai chemin observé est :

`Combat Resolution Presenter -> Visual Controller.playApproachFor() -> CombatVisualEvent("aerial-attack") -> planAnimation() -> Render Adapter`.

Une compétence avec `approachMode:"aerial"` ne consomme donc pas la locomotion générique `profile.locomotion` pour son trajet d'attaque.

Le plan `aerial-attack` actuel génère :
1. `aerial-rise` sans progression horizontale ;
2. `aerial-reposition` qui déplace horizontalement vers la cible pendant une phase invisible ;
3. `aerial-dive-impact` ;
4. retour après impact.

Cette séquence brise la continuité visuelle départ -> apex -> cible et explique le rendu perçu comme deux ponts/arcs.

### Objectif

Réconcilier les données serpent/vol utiles sans perdre la migration canonique `flying`, puis faire de l'approche aérienne un trajet continu à **un seul apex** :

`départ -> montée/progression -> apex unique -> descente/progression -> cible`.

L'impact doit rester exactement à `travelMs` et exactement aux coordonnées de la cible.

### Propriétaires

- Creature Profile : idle, locomotion générique, présentation d'ombre ;
- Animation Core : séquence et timing du plan `aerial-attack` ;
- Visual Controller : projection de géométrie et présentation du profil vers le renderer ;
- Render Adapter : application du plan uniquement.

### Fichiers autorisés

- `data/profiles/flying.profile.json` ;
- `data/profiles/serpentine.profile.json` ;
- `src/core/animation/plan-animation.js` ;
- `src/ui/demo-app.js` ;
- `examples/dom-demo/demo.css` ;
- tests ciblés profils / planner / attaque spéciale ;
- `docs/LAB_CURRENT_WORK.md` ;
- `docs/LAB_ARCHITECTURE.md`.

### Protégé

- profils bipède et quadrupède validés utilisateur ;
- déplacement rampant / serpentin validé ;
- profil massif / ses quatre footfalls ;
- `CombatRuntime.stateSignal()` et le correctif de disponibilité des compétences ;
- dégâts, énergie, cooldowns, portée, ciblage et impact gameplay ;
- migration canonique `drake -> flying` à la frontière Capture ;
- assets binaires et arènes ;
- dépôt `Zombicide-40k`.

### RED obligatoire

Ajouter un test du plan réellement joué par l'approche aérienne qui démontre que :
- il n'existe qu'un apex avant impact ;
- il n'existe aucune phase de repositionnement intermédiaire créant une seconde montée/descente ;
- la progression horizontale est continue vers la cible ;
- toutes les phases d'approche restent visibles ;
- somme des phases jusqu'à impact = `travelMs` ;
- coordonnées d'impact = coordonnées exactes de la cible.

Le test doit être RED sur la base de départ avant correction.

### Critère de fin

Réconciliation ciblée -> RED prouvé -> correction minimale dans Animation Core -> tests ciblés -> CI complète -> documentation -> checkpoint PREVALIDATION -> branche preview smartphone.

Aucun rendu visuel ne sera déclaré GREEN utilisateur avant validation smartphone de Sylvain.


### Résultat — Flying Single-Arc Reconciliation V1

Réconciliation effectuée sans merge aveugle :
- base canonique `flying` conservée ;
- aucun `drake.profile.json` recréé ;
- déplacement `serpentine.locomotion` inchangé ;
- idle serpentin alterné repris du lot refinement ;
- locomotion générique volante à montée/apex/descente reprise du lot motion sous l'ID canonique `flying` ;
- une seule représentation d'ombre conservée : `presentation.shadow.bottomPct / opacity`.

Cause du double arc confirmée sur le vrai chemin :
- Presenter reçoit `approachMode:"aerial"` ;
- Visual Controller crée `aerial-attack` ;
- Animation Core produisait `aerial-rise -> aerial-reposition -> aerial-dive-impact` ;
- la phase de repositionnement intermédiaire rompait la continuité départ -> cible.

RED :
- commit : `b585198f5e6be12dbc1fea1a81aa329941457224` ;
- CI : `36717578082` ;
- conclusion : FAILURE attendue sur la nouvelle sentinelle d'arc aérien continu.

Correction :
- suppression de la phase de repositionnement du plan aérien ;
- approche : `aerial-arc-apex -> aerial-arc-impact` ;
- progression horizontale présente dès la montée ;
- un seul apex ;
- aucune invisibilité avant impact ;
- somme des phases d'approche = `travelMs` ;
- coordonnées d'impact inchangées et exactes ;
- récupération `aerial-home` conservée après impact.

GREEN fonctionnel avant documentation finale :
- HEAD : `532c15c0d3d06749af3f90a88dd69e531ba96299` ;
- CI : `36718057109` ;
- conclusion : SUCCESS sur la suite complète.

Audit de protection :
- blobs `biped.profile.json`, `quadruped.profile.json`, `massive.profile.json` identiques à la base ;
- `src/core/combat/combat-runtime.js` identique à la base, blob `f31d3eea632262fd3155eabcdd93b84230359301` ;
- aucun fichier hors périmètre dans le diff contre `a93258401c7480e17ea4391a2a1137724b64adcd` ;
- dépôt `Zombicide-40k` non touché.

État :
**GREEN technique — PREVALIDATION smartphone requise.**

Validation smartphone demandée :
1. dans l'éditeur, vérifier que le profil `flying` est reconnu ;
2. vérifier l'idle serpent : base au sol, haut du corps légèrement droite/gauche ;
3. vérifier l'idle volant : suspension verticale et ombre éloignée ;
4. lancer une attaque aérienne et vérifier qu'elle rejoint l'ennemi en un seul pont continu, avec un seul sommet ;
5. vérifier l'impact sur la cible et le retour post-impact ;
6. vérifier qu'aucune régression n'est visible sur bipède, quadrupède et massif.


### Publication PREVALIDATION — Flying Single-Arc Reconciliation V1

- HEAD fonctionnel documenté : `77b8d7a767740974888c71deb0d57e5cba80c327` ;
- CI branche work : `36718431750` — SUCCESS ;
- checkpoint PREVALIDATION : `checkpoint/lab-flying-single-arc-reconciliation-v1-prevalidation-green-2026-09-30` ;
- preview smartphone : `preview/lab-flying-single-arc-reconciliation-v1-2026-09-30` ;
- CI preview avant clôture documentaire : `36718493115` — SUCCESS ;
- work / checkpoint / preview étaient identiques sur le HEAD fonctionnel avant cette clôture documentaire.

La clôture documentaire ne modifie aucun fichier fonctionnel. Après ce commit, le checkpoint PREVALIDATION et la preview doivent être avancés en fast-forward sur le nouveau HEAD documentaire, puis leur identité et la CI preview doivent être revérifiées.


## Micro-lot — Flying Contact Arc Fluidity V1 — 2026-09-30

Origine : validation smartphone refusée du lot `Flying Single-Arc Reconciliation V1`.

Base exacte :
- checkpoint : `checkpoint/lab-flying-single-arc-reconciliation-v1-prevalidation-green-2026-09-30` ;
- SHA : `6ec3141c9bc3a2eb021eed8f767c601223ba8f3b` ;
- checkpoint de départ : `checkpoint/lab-start-flying-contact-arc-fluidity-v1-2026-09-30` ;
- branche : `work/lab-flying-contact-arc-fluidity-v1-2026-09-30`.

Retour utilisateur reproduit conceptuellement : avec un acteur profil `flying` utilisant la capacité `Griffe` (`approachMode:"ground"`), le déplacement comporte plusieurs ralentissements/arrêts visuels. Le même skill avec `serpentine` reste fluide.

Cause ciblée : `ground-attack` consomme la locomotion du profil. `serpentine.locomotion` utilise des segments `linear`, tandis que `flying.locomotion` utilise plusieurs segments `ease-in-out`, ce qui impose une décélération/réaccélération à chaque frontière de phase.

Décision d'architecture :
- aucune capacité individuelle ne sera modifiée ;
- `Griffe` conserve `approachMode:"ground"` ;
- Creature Profile reste propriétaire de la morphologie de déplacement ;
- Animation Core reste générique ;
- corriger le comportement une seule fois dans `flying.locomotion` ;
- conserver une seule arche monotone départ -> apex -> cible, sans freinage intermédiaire ;
- ne pas modifier serpentine, biped, quadruped, massive, gameplay, dégâts, énergie, cooldowns ou ciblage.

RED obligatoire : protéger le vrai plan `ground-attack` du profil `flying` et démontrer que toutes les portions d'approche sont temporellement continues, sans easing de décélération aux frontières, avec progression X monotone, un seul apex et impact exact à `travelMs`.

Critère de fin : RED -> correction data-driven minimale -> CI complète -> checkpoint PREVALIDATION -> preview smartphone -> validation utilisateur.


### Résultat — Flying Contact Arc Fluidity V1

Retour smartphone ayant rouvert le lot : profil `flying` + capacité `Griffe` présentait plusieurs ralentissements/arrêts, alors que le même skill avec `serpentine` restait fluide.

Diagnostic du vrai chemin :
- `Griffe` conserve `approachMode:"ground"` ;
- `ground-attack` consomme `profile.locomotion` ;
- `serpentine.locomotion` utilise des segments `linear` ;
- `flying.locomotion` utilisait quatre segments `ease-in-out`, imposant une décélération/réaccélération à chaque frontière de phase.

RED :
- commit `29e6c5af0459a446b05df762aca6db90a5d3db2d` ;
- CI `36722711846` — FAILURE attendue ;
- sentinelle : vrai plan `ground-attack` du profil `flying`, progression X monotone, apex unique, impact exact à `travelMs`, et absence de freinage aux frontières.

Correction :
- commit fonctionnel `403901bbff83d57e476d808267aee91ffc81de3e` ;
- seul `data/profiles/flying.profile.json` est modifié côté fonctionnel ;
- les quatre points de l'arche restent data-driven pour dessiner la courbe ;
- leurs easings deviennent `linear`, supprimant le freinage/réaccélération intermédiaire ;
- aucune capacité individuelle n'est modifiée ;
- `Griffe` reste inchangée ;
- aucune règle de combat n'est déplacée.

GREEN fonctionnel :
- CI `36722781019` — SUCCESS.

État : **GREEN technique — PREVALIDATION smartphone requise.**


### Publication PREVALIDATION — Flying Contact Arc Fluidity V1

- HEAD GREEN avant clôture documentaire : `258a9905af3c9cc4aec8f5c5f21241495b81af2e` ;
- CI : `36722925234` — SUCCESS ;
- checkpoint : `checkpoint/lab-flying-contact-arc-fluidity-v1-prevalidation-green-2026-09-30` ;
- preview : `preview/lab-flying-contact-arc-fluidity-v1-2026-09-30`.

La validation utilisateur reste requise sur smartphone pour confirmer qu'un profil `flying` utilisant `Griffe` rejoint la cible en un seul mouvement continu, sans ralentissement/arrêt intermédiaire.


### Validation utilisateur — Flying Contact Arc Fluidity V1

Validation smartphone reçue le 2026-09-30 : **OK utilisateur** sur le test `flying -> Loup -> Griffe`.

Le mouvement volant de contact est désormais considéré validé : un seul déplacement continu vers la cible, sans ralentissements/arrêts intermédiaires perceptibles.


## Micro-lot — Arena Refresh V1 — 2026-09-30

Base fonctionnelle validée :
- SHA : `5e2f56b99b76acf10fd47e4c884bb7e9966bfbb4` ;
- checkpoint utilisateur GREEN : `checkpoint/lab-flying-contact-arc-fluidity-v1-user-green-2026-09-30` ;
- checkpoint de départ : `checkpoint/lab-start-arena-refresh-v1-2026-09-30` ;
- branche de travail : `work/lab-arena-refresh-v1-2026-09-30`.

Objectif : remplacer proprement les cinq fonds d'arène canoniques par les nouvelles images fournies par l'utilisateur, mapping validé :
- `city` -> cité fantasy ;
- `cave` -> grotte cristalline ;
- `snow` -> plaine enneigée / lac gelé ;
- `forest` -> forêt / cascade ;
- `lava` -> volcan / lave.

Autorité asset réelle : branche `global-assets`, chemins canoniques sous `assets/library/core/arenas/<biome>/`. Les IDs stables du catalogue sont conservés : `core:arena-forest-01`, `core:arena-cave-01`, `core:arena-snow-01`, `core:arena-city-01`, `core:arena-lava-01`.

Décision : remplacement 1 pour 1 des binaires aux chemins existants ; aucun nouvel ID d'arène ; aucun gameplay dérivé des images. Les anciens fallbacks locaux de test `city/lava` doivent être retirés des bindings de preview afin que la bibliothèque Core redevienne l'unique autorité runtime pour ces arènes.

Branches assets prévues depuis `global-assets` HEAD `570b37edb26156a3e84256ef1be18eb07d697eca` :
- checkpoint : `checkpoint/lab-start-arena-refresh-assets-v1-2026-09-30` ;
- work : `work/lab-arena-refresh-assets-v1-2026-09-30`.

Fichiers autorisés :
- cinq binaires d'arène canoniques dans `assets/library/core/arenas/` sur la branche asset ;
- `src/assets/global-visual-library.js` pour révision cache ;
- `examples/dom-demo/demo-assets.js` pour bindings Core ;
- tests ciblés assets/arènes ;
- documentation du lot.

Protégé : combat, règles, profils morphologiques, mouvements, compétences, sons, créatures, arènes hors de ces cinq fichiers, dépôt `Zombicide-40k`.

Tests prévus : chemins/IDs catalogue inchangés, cinq bindings Core résolvables, absence des fallbacks locaux city/lava dans la preview, CI complète, preview smartphone.


### Pré-audit raccord runtime — Arena Refresh V1

Vérification réelle du runtime de preview :
- `examples/dom-demo/demo-assets.js` expose déjà les cinq assets Core canoniques :
  - `core:arena-forest-01` ;
  - `core:arena-cave-01` ;
  - `core:arena-snow-01` ;
  - `core:arena-city-01` ;
  - `core:arena-lava-01` ;
- `ARENA_BINDINGS` contient déjà `forest/cave/snow/city/lava` vers ces IDs Core ;
- les anciens fallbacks locaux `test:arena-city-local-01` / `test:arena-lava-local-01` ne sont plus présents sur cette lignée ;
- aucun changement de code runtime n'est donc requis pour le remplacement visuel.

Branche asset dédiée créée depuis `global-assets` HEAD `570b37edb26156a3e84256ef1be18eb07d697eca` :
- `checkpoint/lab-start-arena-refresh-assets-v1-2026-09-30` ;
- `work/lab-arena-refresh-assets-v1-2026-09-30`.

Les cinq sources utilisateur sont toutes en 1536x864 (16:9), sans recadrage requis.

État : remplacement binaire non encore commité. Aucun asset canonique n'a été écrasé partiellement. La prochaine opération autorisée est exclusivement le remplacement 1 pour 1 des cinq binaires, suivi de la vérification catalogue/cache, CI et preview smartphone.


### Résultat — Arena Refresh V1

Assets :
- source `global-assets` initiale : `570b37edb26156a3e84256ef1be18eb07d697eca` ;
- branche asset : `work/lab-arena-refresh-assets-v1-2026-09-30` ;
- commit de remplacement canonique : `ec938dfd8aab08ca43dd87e75e002f5852813cef` ;
- checkpoint asset GREEN : `checkpoint/lab-arena-refresh-assets-v1-green-2026-09-30` ;
- `global-assets` avancée en fast-forward sur ce commit ;
- diff global-assets contre la base : exactement cinq binaires modifiés, aucun autre fichier ;
- staging temporaire supprimé.

Blobs canoniques publiés :
- city : `046d816ca856a026d4b7fae10b9abc40378aeb97` ;
- cave : `703718f34f616ab6664f258eb7dd3ff84a6cb044` ;
- snow : `39cffccfb055428a85d64dd2a2def00194fe3aaf` ;
- forest : `22448fb83a17fdd16e2e9b74827913496589a43e` ;
- lava : `3e677ac440699b431405f7c33345f319c55bd863`.

Runtime :
- migration vers les cinq bindings Core : `b0dbd723d993` ;
- RED historique confirmé : anciens tests city/lava attendaient encore les fallbacks locaux ;
- sentinelle canonique cinq arènes : `4655a28b819cd139337e82daf9ef17e8465c805f`, CI `36734143772` FAILURE attendue avant cache-bust ;
- cache-bust bibliothèque : `e45bc039e00f`, révision `2026-09-30-v5-arena-refresh` ;
- retrait des copies locales city/lava : `461d9baf7bc9` ;
- CI complète : `36734489613` SUCCESS ;
- suite : **711/711 PASS, 0 FAIL**.

Audit de protection :
- aucune modification Combat Rules ;
- aucun profil de créature modifié ;
- aucune compétence modifiée ;
- aucun son modifié ;
- aucun dépôt `Zombicide-40k` touché ;
- diff runtime limité aux bindings arène, révision cache, tests, documentation et suppression des deux copies locales devenues inutiles.

État : **GREEN technique — PREVALIDATION smartphone requise pour le rendu des nouvelles arènes.**


### Publication PREVALIDATION — Arena Refresh V1

- HEAD GREEN documenté : `f7b003675fba50b129c8bdc4e35ea5f92fe5c231` ;
- CI work : `36735088869` — SUCCESS ;
- checkpoint PREVALIDATION : `checkpoint/lab-arena-refresh-v1-prevalidation-green-2026-09-30` ;
- preview : `preview/lab-arena-refresh-v1-2026-09-30` ;
- les cinq images canoniques sont publiées sur `global-assets` ;
- validation visuelle smartphone encore requise avant GREEN utilisateur.


### Validation utilisateur — Arena Refresh V1

Validation smartphone reçue le 2026-09-30 : **OK utilisateur** sur les cinq nouvelles arènes (city, cave, snow, forest, lava).

Le lot Arena Refresh V1 est désormais **GREEN utilisateur**. Aucun ajustement visuel supplémentaire n'est demandé sur ce lot.


## Micro-lot — Combat Test Default 1v1 V1 — 2026-09-30

Base : `ca5e55490852e797fdbaa1ebede074a5d53e7adf` (Arena Refresh V1 validé utilisateur).

- checkpoint de départ : `checkpoint/lab-start-combat-test-default-1v1-v1-2026-09-30` ;
- branche : `work/lab-combat-test-default-1v1-v1-2026-09-30`.

Objectif : conserver le test combat dans l'éditeur Capture, avec **1v1 comme valeur par défaut**, tout en laissant 2v2 sélectionnable et en conservant le même chemin de données générique.

Propriétaire : Demo UI / Battle Setup Editor Draft. Aucun changement Combat Rules.

Fichiers autorisés :
- `examples/dom-demo/capture-editor-v2.html` ;
- tests de format/preview Capture ;
- documentation du lot.

Protégé : moteur combat, BattleFormatDefinition, capacités, cooldowns, dégâts, éléments, profils, assets, sons.

RED : prouver que le contrôle HTML sélectionne encore 2v2 par défaut alors que le contrat demandé est 1v1.


### Résultat — Combat Test Default 1v1 V1

RED :
- commit `157e3b4e994aa690d2409221108d9beb1f112ed9` ;
- CI `36740774997` — FAILURE attendue ;
- le test exigeait que le sélecteur `data-active-per-team` démarre sur 1v1.

Correction :
- commit `65ef59107ccd4ee8667581417eca14ef3968c70c` ;
- seule la valeur `selected` du sélecteur de format a été déplacée de 2v2 vers 1v1 ;
- 2v2 reste disponible ;
- aucun contrat ni moteur de combat modifié.

GREEN fonctionnel :
- CI `36740838430` — SUCCESS.

État : **GREEN technique — PREVALIDATION smartphone**. Le test combat doit s'ouvrir sur 1 contre 1, avec 2 contre 2 toujours sélectionnable.


## Micro-lot — Cooldown Completion V1 — 2026-09-30

Base technique : `f614f56646b065dc62966ffe48441b50f9a8da2f` (Combat Test Default 1v1 V1 — GREEN technique/PREVALIDATION).

- checkpoint de départ : `checkpoint/lab-start-cooldown-completion-v1-2026-09-30` ;
- branche : `work/lab-cooldown-completion-v1-2026-09-30`.

Objectif : terminer le raccord cooldown déjà présent dans le moteur, sans créer de seconde horloge ni de règle UI parallèle.

État pré-audité :
- `SkillDefinition.cooldownMs` existe et vaut 0 par défaut ;
- `Combat State.skillCooldowns` possède l'état autoritaire ;
- Action Resolver refuse une compétence en cooldown sans dépenser d'énergie ;
- Combat Runtime ne possède pas de timer cooldown ;
- l'éditeur expose déjà `Recharge / cooldown (ms)` ;
- les compétences de démonstration `fireball/claw/aerial-dive/teleport-strike` n'ont actuellement pas de `cooldownMs`, donc 0 ms ;
- l'UI de combat ne présente pas encore clairement le temps restant.

Périmètre autorisé :
- données des capacités de démonstration pour valeurs cooldown explicites ;
- raccord export/adapter seulement si le champ est perdu sur le chemin réel ;
- UI combat en lecture de l'état autoritaire pour disponibilité/temps restant ;
- tests ciblés ;
- documentation.

Interdits :
- `setTimeout`/timer cooldown dans l'UI ;
- `Date.now()` comme seconde horloge ;
- table cooldown parallèle ;
- modification des dégâts, énergie, ciblage, timing d'impact, mouvement, FX ou audio pour simuler une recharge.

RED obligatoire : prouver sur le vrai chemin de preview qu'une capacité configurée avec cooldown est exportée jusqu'au moteur et que l'UI reflète le cooldown restant depuis Combat State.


### Résultat — Cooldown Completion V1

Diagnostic confirmé :
- le cooldown saisi dans l'éditeur traverse déjà intact jusqu'à `SkillDefinition` ;
- aucune réparation d'export n'était nécessaire ;
- les quatre skills de démo utilisaient le fallback historique `cooldownMs: 0` faute de valeur explicite ;
- la preview savait déjà désactiver une compétence via `session.previewSkill()`, mais n'affichait pas le temps restant.

RED :
- commit initial `bc7cd17cbde1dd1dbe3bfa14ca13e1bf6c8f162a` ;
- fixture de contrat corrigée par `34ebff970744289155e61e6896d85da089eac9ee` ;
- RED propre confirmé : capacités de démo sans cooldown explicite + absence d'affichage du temps restant.

Correction :
- les quatre capacités de démonstration `fireball`, `claw`, `aerial-dive`, `teleport-strike` déclarent désormais `cooldownMs: 2800` ;
- cette valeur est uniquement une valeur de démo explicite et reste entièrement éditable/data-driven ;
- `Combat Runtime` expose un callback générique `onClock(state)` depuis son tick existant, sans logique cooldown ;
- la preview lit `remainingCooldownMs` via `session.previewSkill()` et affiche `Recharge X.X s` sur le bouton ;
- aucun timer UI, aucun `Date.now()` UI, aucune table parallèle de cooldown.

GREEN fonctionnel :
- HEAD fonctionnel/test : `1ee2592a3b7f5603b71d4ebb999ba34b9b189f4a` ;
- CI `36743954786` — SUCCESS ;
- suite complète : **714/714 PASS, 0 FAIL**.

Protection : dégâts, énergie, ciblage, mouvement, FX, audio et règles d'impact inchangés.

État : **GREEN technique — PREVALIDATION smartphone requise** pour vérifier l'affichage du cooldown et le retour à disponibilité.


### Publication PREVALIDATION — Cooldown Completion V1

- HEAD GREEN documenté avant publication : `a1ebcc31d14ac001de0a66c28ccf98ed426cc325` ;
- CI : `36744092552` — SUCCESS ;
- checkpoint PREVALIDATION : `checkpoint/lab-cooldown-completion-v1-prevalidation-green-2026-09-30` ;
- preview : `preview/lab-cooldown-completion-v1-2026-09-30` ;
- validation smartphone requise : lancer une compétence, vérifier le texte `Recharge X.X s`, le bouton indisponible pendant la recharge, puis son retour automatique à disponibilité.


### Validation utilisateur — Cooldown Completion V1

Validation smartphone reçue le 2026-09-30 : le fonctionnement du cooldown est jugé **OK** par l'utilisateur (blocage pendant la recharge et retour à disponibilité). Une amélioration purement visuelle est demandée séparément : indicateur circulaire dans l'icône, aiguille de progression et recoloration progressive.

Le comportement métier Cooldown Completion V1 est considéré **GREEN utilisateur**. Le raffinement visuel sera traité dans un micro-lot UI distinct, sans modifier l'autorité du cooldown.


## Micro-lot — Cooldown Visual Overlay V1 — 2026-09-30

Base utilisateur GREEN : `cbd065b54ff68047807c34a13ad3fd5d914c155a`.

- checkpoint comportement cooldown GREEN : `checkpoint/lab-cooldown-completion-v1-green-2026-09-30` ;
- checkpoint de départ : `checkpoint/lab-start-cooldown-visual-overlay-v1-2026-09-30` ;
- branche : `work/lab-cooldown-visual-overlay-v1-2026-09-30`.

Objectif UI : rendre la recharge lisible directement **dans l'icône de compétence** sans modifier la règle de cooldown :
- icône désaturée pendant la recharge ;
- recoloration progressive selon la portion de cooldown déjà écoulée ;
- indicateur circulaire/radial ;
- aiguille tournante liée à la même progression ;
- retour visuel immédiat à l'état normal lorsque la compétence est disponible.

Autorité :
- `Combat State.skillCooldowns` et `session.previewSkill().remainingCooldownMs` restent l'unique source métier ;
- le tick existant `Combat Runtime.onClock` reste l'unique source de rafraîchissement temporel ;
- l'UI calcule uniquement un ratio de présentation `1 - remainingCooldownMs / skill.cooldownMs`.

Fichiers autorisés :
- `src/ui/combat-2v2-test-ui.js` pour le DOM de présentation de l'icône et la projection du ratio ;
- `examples/dom-demo/demo.css` pour l'overlay visuel ;
- tests UI ciblés ;
- documentation.

Interdits :
- nouveau timer, `setTimeout`, `setInterval` ou `Date.now()` dans l'UI ;
- modification Combat State / Action Resolver / cooldownMs ;
- modification des dégâts, énergie, ciblage, mouvements, FX, audio ou IA ;
- canvas/second renderer ou observer masquant un défaut.

RED obligatoire : la preview actuelle ne possède ni shell d'icône cooldown, ni couche de recoloration progressive, ni aiguille radiale pilotée par le ratio autoritaire.


### Résultat — Cooldown Visual Overlay V1

RED :
- commit `b2519dc7abfcb831b30dfe554c0e13213180c600` ;
- CI `36747698174` — FAILURE attendue ;
- la preview ne possédait ni shell d'icône dédié, ni recoloration progressive, ni cadran radial, ni aiguille liée à la progression.

Correction :
- `src/ui/combat-2v2-test-ui.js` projette `cooldownProgress = 1 - remainingCooldownMs / totalCooldownMs` ;
- le bouton expose `data-cooldown-active` et `--cooldown-progress` ;
- l'icône possède une base désaturée et une couche couleur révélée progressivement par masque conique ;
- un cadran radial assombrit la portion restante ;
- une aiguille tourne avec le même ratio ;
- le texte `Recharge X.X s` reste issu de `remainingCooldownMs` ;
- aucun timer UI ni nouvelle horloge n'a été ajouté.

Régression détectée puis corrigée :
- premier CSS fonctionnel cassait le contrat historique d'icône mobile `82% x 82%` ;
- correction commit `879758af9686a617e9403c4241e4efc5ad32bfd5` ;
- le shell radial porte la composition tandis que l'image conserve exactement sa taille protégée.

GREEN fonctionnel :
- HEAD : `879758af9686a617e9403c4241e4efc5ad32bfd5` ;
- CI `36748054094` — SUCCESS ;
- suite complète : **717/717 PASS, 0 FAIL**.

Audit de protection :
- aucun changement Combat State ;
- aucun changement Action Resolver ;
- aucun changement de `cooldownMs` ;
- aucun changement dégâts, énergie, ciblage, mouvements, FX, audio ou IA ;
- diff limité à UI/CSS, test ciblé et documentation.

État : **GREEN technique — PREVALIDATION smartphone requise** pour vérifier lisibilité de l'aiguille, progression radiale et recoloration sur petit écran.


### Publication PREVALIDATION — Cooldown Visual Overlay V1

- HEAD GREEN documenté : `57122dfa5d42632b4b6b859f7cb388c32d4dac05` ;
- CI work : `36748193764` — SUCCESS ;
- checkpoint PREVALIDATION : `checkpoint/lab-cooldown-visual-overlay-v1-prevalidation-green-2026-09-30` ;
- preview : `preview/lab-cooldown-visual-overlay-v1-2026-09-30` ;
- validation smartphone requise : lancer une compétence et vérifier que l'icône se désature, que la couleur revient progressivement, que l'aiguille tourne avec la recharge et que l'icône revient immédiatement à l'état normal à disponibilité.


## Micro-lot — Cooldown Icon Visibility Regression V1 — 2026-09-30

Base PREVALIDATION : `b575e45c0553c5e81310ef6e92723a65f1fd64ec` (`Cooldown Visual Overlay V1`).

- checkpoint de départ : `checkpoint/lab-start-cooldown-icon-visibility-regression-v1-2026-09-30` ;
- branche : `work/lab-cooldown-icon-visibility-regression-v1-2026-09-30`.

Retour utilisateur smartphone : l'icône de Boule de feu a disparu dans le combat après l'ajout du visuel radial de cooldown.

Diagnostic : le nouveau conteneur `<span class="action-option__icon-shell">` est masqué par l'ancienne règle CSS générique `.action-option--skill span { display: none; }`. Le binding et l'asset `pack:capture:icon-skill-fireball-01` sont toujours présents.

Propriétaire : UI présentation/CSS uniquement.

Périmètre autorisé :
- règle CSS des boutons de compétence ;
- test de régression ciblé ;
- documentation.

Protégé : asset feu, bindings d'assets, SkillDefinition, cooldown métier, Combat State, Runtime, dégâts, énergie, ciblage, mouvement, FX, audio.

RED : prouver que la règle de masquage générique cache actuellement `.action-option__icon-shell`.

Correction cible : restreindre le masquage aux métadonnées textuelles sans masquer le conteneur d'icône ni le visuel cooldown.


### Résultat — Cooldown Icon Visibility Regression V1

Retour smartphone : disparition de l'icône Boule de feu après le lot `Cooldown Visual Overlay V1`.

Cause racine :
- le nouveau conteneur d'icône est `<span class="action-option__icon-shell">` ;
- l'ancienne règle compacte `.action-option--skill span { display:none; }` masquait donc le conteneur entier ;
- le binding `pack:capture:icon-skill-fireball-01` et son asset sont restés intacts.

RED :
- commit `77f26f6423b64ed79fb0934f90b2e6ce919e9d26` ;
- CI `36751304503` — FAILURE attendue ;
- la sentinelle prouve que le masquage générique de tous les `span` cache l'icon-shell.

Correction :
- commit CSS `c7346a08d1ce68395717bb0b0456b7e2a63aae9b` ;
- le masquage est restreint aux enfants textuels directs : `> span:not(.action-option__icon-shell)` et `> small` ;
- le conteneur d'icône et ses calques cooldown restent visibles ;
- aucun asset, binding, cooldown métier ou moteur combat modifié.

Ancienne sentinelle V8 réconciliée :
- commit `3af78511fd14020f21363e12fbca94c80996a7ac` ;
- elle protège maintenant l'intention réelle « dock compact et icon-ready » sans exiger l'ancien sélecteur fautif.

GREEN :
- CI `36751533082` — SUCCESS.

État : **GREEN technique — PREVALIDATION smartphone requise** sur l'icône Boule de feu et le visuel radial de cooldown.


### Publication PREVALIDATION — Cooldown Icon Visibility Regression V1

- HEAD GREEN documenté avant publication : `06a9833da2a289c115f74ab92f0c0cdf756b2101` ;
- CI : `36751617836` — SUCCESS ;
- checkpoint PREVALIDATION : `checkpoint/lab-cooldown-icon-visibility-regression-v1-prevalidation-green-2026-09-30` ;
- preview : `preview/lab-cooldown-icon-visibility-regression-v1-2026-09-30` ;
- validation smartphone requise : vérifier que l'icône Boule de feu est visible au repos et reste visible pendant le cooldown avec son overlay radial/aiguille.


### Validation utilisateur — Cooldown Icon Visibility Regression V1

Validation smartphone reçue le 2026-09-30 : **OK utilisateur** sur le retour de l'icône Boule de feu et le visuel cooldown.

Le lot est considéré GREEN utilisateur. Un défaut séparé a ensuite été signalé : la Boule de feu visible s'exécute mais n'inflige aucun dégât. Ce défaut est traité dans un micro-lot distinct afin de ne pas mélanger présentation cooldown et règles d'effet.


## Micro-lot — Fireball Damage Regression V1 — 2026-09-30

Base utilisateur GREEN : `beea3769759fba03df48dca50cfe221288d1fda4`.

- checkpoint de départ : `checkpoint/lab-start-fireball-damage-regression-v1-2026-09-30` ;
- branche : `work/lab-fireball-damage-regression-v1-2026-09-30`.

Retour smartphone : la Boule de feu est visible et se lance, mais l'adversaire ne perd aucun PV.

Diagnostic initial : le formulaire HTML démarre sur l'ID `fireball` avec une zone `Effets tactiques` vide. `readSkillFields()` produit alors `effects: []`, et `buildHumanSkillDraftV1()` traite cette zone comme l'autorité, ce qui force le legacy `effect.damage` à 0. Ce brouillon initial est immédiatement placé dans `configuredSkills` avant le chargement asynchrone des compétences runtime ; l'ID `fireball` déjà présent empêche ensuite la définition native correcte de le remplacer.

Objectif : empêcher qu'un brouillon initial sans effet tactique masque une définition runtime canonique portant le même ID. Aucun cas spécial basé sur le nom `fireball` dans Combat Rules.

Périmètre autorisé : initialisation de l'éditeur Capture, tests ciblés, documentation.

Protégé : Combat State, Action Resolver, calcul de dégâts, cooldowns, projectile/FX, audio, profils, assets.

RED : reproduire le démarrage éditeur et prouver que la compétence `fireball` obtenue pour la preview contient actuellement zéro effet de dégâts alors qu'une définition native runtime du même ID existe.


### Résultat — Fireball Damage Regression V1

Cause racine confirmée :
- le formulaire initial utilisait l'ID `fireball` ;
- sa zone `Effets tactiques` était vide ;
- `readSkillFields()` produisait donc `effects: []` ;
- ce brouillon initial était enregistré avant le chargement du catalogue natif ;
- la définition native portant le même ID, avec `effect.damage: 30`, ne pouvait ensuite plus remplacer l'entrée existante ;
- résultat : projectile/impact visuel correct, mais compétence métier sans effet de dégâts.

RED :
- commit `0263606a8cfbc47ac3f1859af98a0aafa545bc7c` ;
- CI `36754306436` — FAILURE attendue ;
- le test reproduit un skill initial sans effets tactiques qui masque une définition native avec dégâts.

Correction :
- commit `b253600ee8d13b21e5c8f74a562bec2bf5874610` ;
- ajout de `hydrateInitialSkillEffectsFromNativeV1()` ;
- si le brouillon initial n'a aucun effet, n'a pas été modifié par l'utilisateur et possède le même ID qu'une définition native, les effets représentables sont hydratés depuis la source native ;
- pour Boule de feu, `effect.damage: 30` + élément `fire` devient un unique effet tactique `damage / target / 30 / fire` ;
- aucun cas spécial sur le nom ou l'ID de Boule de feu dans Combat Rules ;
- le cooldown, les timings et la présentation du formulaire restent ceux éditables dans l'éditeur.

GREEN :
- CI `36754412374` — SUCCESS ;
- suite complète : **720/720 PASS, 0 FAIL** ;
- test combat réel : cible 100 PV -> 70 PV.

Protection : Combat State, Action Resolver, moteur de dégâts, cooldown, FX, audio, profils et assets inchangés.

État : **GREEN technique — PREVALIDATION smartphone requise** pour confirmer que la Boule de feu retire bien des PV dans la preview réelle.


## Micro-lot — Creature Natural Elements Reconciliation V1 — 2026-09-30

Base actuelle : `ac8148ca8718928900c00c1da3be37373205b073` (Fireball Damage Regression V1 — GREEN technique).

- checkpoint de départ : `checkpoint/lab-start-creature-natural-elements-reconcile-v1-2026-09-30` ;
- branche : `work/lab-creature-natural-elements-reconcile-v1-2026-09-30`.

Cette branche réconcilie uniquement le périmètre éléments/résistances de l'ancien lot `work/lab-creature-natural-elements-v1-2026-09-30`, qui diverge d'une lignée antérieure de cooldown. Aucun commit de cette ancienne branche n'est fusionné en bloc.

Objectifs :
1. conserver `elements` et `resistances[{kind,value}]` comme données sémantiques portables d'une créature dans `CaptureCombatExportV1` ;
2. projeter les résistances/faiblesses naturelles `element:<channel>` vers `FighterConfig.resistancePctByChannel` ;
3. additionner une seule fois résistance naturelle + résistance issue des stats ;
4. autoriser les résistances signées dans Combat State pour représenter les faiblesses (ex. `-50`), sans autoriser de bonus de dégâts négatif ;
5. exposer dans l'éditeur les canaux historiques Capture : fire, water, earth, air, electric, light, shadow, nature, ice, poison, steel, psy, spirit ;
6. conserver les valeurs propres aux créatures/imports comme autorité : aucune nouvelle table automatique de matchup n'est inventée.

Propriétaires :
- Creature Editor Draft / CaptureCombatExport : données ;
- Capture input adapter : projection vers FighterConfig ;
- Combat Damage : consommateur générique inchangé.

Périmètre autorisé :
- `src/contracts/capture-combat-export-v1.js` ;
- `src/adapters/input/capture/capture-editor-exporter-v1.js` ;
- `src/adapters/input/capture/capture-creature-to-fighter-config.js` ;
- `src/core/combat/combat-state.js` uniquement pour signed resistance ;
- `examples/dom-demo/capture-editor-v2.html` ;
- tests ciblés ;
- documentation.

Protégé : formule `computeCombatDamageV1`, capacités, cooldowns, énergie, ciblage, mouvements, FX, audio, profils, assets, correctif Boule de feu.

RED : prouver sur le vrai chemin éditeur -> export -> adapter -> Combat State -> damage que `fire +35` et `water -50` sont actuellement perdus/refusés, et que les 13 canaux ne sont pas tous visibles.


### Résultat — Creature Natural Elements Reconciliation V1

Reprise : l'ancien lot `work/lab-creature-natural-elements-v1-2026-09-30` était techniquement avancé mais divergeait de la lignée actuelle à partir de `f614f566...`. Ses changements éléments/résistances ont été rejoués manuellement sur le HEAD actuel sans importer son ancien chemin cooldown.

RED :
- commit `32eb0c81ffda1abc4a8dde69878e41d5fe75cd2c` ;
- le vrai chemin devait conserver `fire +35 / water -50`, accepter une résistance négative et exposer les 13 canaux historiques.

Corrections réconciliées :
- `4a41fe9db178259953dd837269a0d93adb1c3238` : projection des résistances naturelles vers FighterConfig et somme avec les résistances de stats ;
- `3f30675ee55563faaf0fbba5d0c302edc822c7ba` : export canonique des `elements` et `resistances` ;
- `4b30f6aed347127a6359c775e9b703b1c861cd4e` : contrat portable CaptureCombatExport enrichi ;
- `f9ee1b47d8dcc89cee6cba3ad14e8e14dd7ef102` : Combat State accepte les résistances signées, sans autoriser les bonus de dégâts négatifs ;
- `6874bf401037ed9e38e4df6a9b45077fd43e0fa3` : éditeur étendu aux 13 canaux historiques ;
- `b00243218553d0a4fe6faacf69804eda0f9dee1e` : correction de fixture de garde, sans modification produit.

Comportement vérifié :
- résistance Feu +35 => 100 dégâts Feu deviennent 65 ;
- faiblesse Eau -50 => 100 dégâts Eau deviennent 150 ;
- résistance naturelle + résistance de stat sont additionnées une seule fois ;
- le chemin éditeur -> export -> adaptateur -> Combat State -> damage conserve les valeurs signées ;
- les 13 canaux sont disponibles pour type créature, résistance/faiblesse et élément de capacité.

GREEN :
- CI `36755279285` — SUCCESS ;
- suite complète : **724/724 PASS, 0 FAIL**.

Protections :
- formule `computeCombatDamageV1` inchangée ;
- cooldown visuel et autorité cooldown inchangés ;
- correctif Boule de feu conservé ;
- mouvements, FX, audio, profils et assets inchangés ;
- aucune table de matchup codée dans Combat Rules.

État : **GREEN technique — PREVALIDATION smartphone**. À vérifier : Boule de feu retire des PV, 1v1 par défaut, cooldown visuel, et affichage/édition des types et résistances/faiblesses naturelles.


### Publication PREVALIDATION — Creature Natural Elements Reconciliation V1

- HEAD GREEN documenté avant publication : `c66d57761ffad2e38157831045dd2df657b5c92a` ;
- CI work : `36755450704` — SUCCESS ;
- checkpoint PREVALIDATION : `checkpoint/lab-creature-natural-elements-reconcile-v1-prevalidation-green-2026-09-30` ;
- preview : `preview/lab-creature-natural-elements-reconcile-v1-2026-09-30` ;
- cette preview inclut également le correctif Boule de feu, le 1v1 par défaut et le visuel cooldown validés techniquement sur la lignée actuelle.

Validation smartphone demandée :
1. lancer Boule de feu et vérifier que les PV adverses baissent ;
2. vérifier le cooldown visuel et le retour à disponibilité ;
3. vérifier que le test démarre en 1v1 ;
4. dans l'éditeur créature, vérifier les 13 types et les champs de résistance/faiblesse ;
5. tester au moins une résistance positive et une faiblesse négative si souhaité.


## Micro-lot — Capture Test Arena Selector V1 — 2026-09-30

Base : `54f38051f4aab7593f233a30f26d9f608e00ad08` (Creature Natural Elements Reconciliation V1 — GREEN technique/PREVALIDATION).

- checkpoint de départ : `checkpoint/lab-start-capture-test-arena-selector-v1-2026-09-30` ;
- branche : `work/lab-capture-test-arena-selector-v1-2026-09-30`.

Objectif : permettre, dans l'onglet Combat de l'éditeur Capture, de choisir l'arène de la preview parmi les cinq arènes Core canoniques déjà publiées.

Architecture imposée :
- une seule valeur de contexte de présentation `arenaId` dans le Battle Setup/export de preview ;
- aucune URL d'image stockée dans l'éditeur ;
- aucune copie locale d'arène ;
- résolution exclusivement par `demoPresentationAssets.presentationForArena(arenaId)` ;
- aucun fallback parallèle ajouté ;
- aucun changement Combat Rules, dégâts, ciblage ou mouvement.

Périmètre autorisé : Battle Setup Editor Draft / export de preview / UI onglet Combat / tests / documentation.

Interdits : masquage CSS de régression, table d'URLs d'arènes dans l'UI, second catalogue, condition spéciale par biome, modification gameplay.

RED : prouver que le Battle Setup ne transporte pas encore `arenaId` et que l'onglet Combat ne possède aucun sélecteur d'arène.


### Résultat — Capture Test Arena Selector V1

RED :
- commit `71302a6bbaf58c72b7021fdf51e43bdb8459ffd5` ;
- CI `36760928773` — FAILURE attendue ;
- absence du sélecteur et du chemin `arenaId` confirmée.

Réconciliation architecture :
- un premier essai plaçait `arenaId` dans le contrat combat portable et a volontairement été abandonné après RED large ;
- cause : couplage de présentation à des tests/contrats combat sans rapport ;
- correction : `arenaId` reste hors BattleFormat et hors Combat Adapter Stack ;
- il voyage uniquement dans `presentation.arenaId` puis `nativeVisualSource.arenaId`.

Correction :
- sélecteur d'arène ajouté dans l'onglet Combat ;
- options générées depuis `ARENA_BINDINGS` via `demoPresentationAssets.arenaOptions()` ;
- arènes disponibles : forest, cave, snow, city, lava ;
- `buildHumanBattleSetupV1()` transporte la sélection explicite ;
- l'export place cette donnée dans la section présentation ;
- la preview appelle `presentationForArena(nativeVisualSource.arenaId)` ;
- suppression du fallback implicite `arenaId = "city"` dans l'application visuelle.

GREEN :
- HEAD fonctionnel : `d66b7ffe05dd0568a7015dd61aa9b27d179384fd` ;
- CI `36761598340` — SUCCESS ;
- suite complète : **727/727 PASS, 0 FAIL**.

Protections :
- aucun changement Combat Rules ;
- aucun changement BattleFormatDefinition ;
- aucune URL d'arène dupliquée dans l'UI ;
- aucun fallback local ;
- aucune logique spéciale par biome ;
- aucune modification dégâts, ciblage, mouvement, cooldown, FX ou audio.

État : **GREEN technique — PREVALIDATION smartphone requise** pour vérifier que le choix de l'arène dans l'onglet Combat change bien uniquement le décor de la preview.


## Micro-lot — Capture Health Stat V1 — 2026-09-30

Base : `fd99f76a9bddc91a58c6830eec35a53305f1fb1d` (Capture Test Arena Selector V1 — GREEN technique/PREVALIDATION).

- checkpoint de départ : `checkpoint/lab-start-capture-health-stat-v1-2026-09-30` ;
- branche : `work/lab-capture-health-stat-v1-2026-09-30`.

Retour utilisateur : les champs historiques `PV max` / `PV au départ` dans l'éditeur sont des réglages de test et doivent disparaître. Les PV doivent devenir une vraie stat `Santé / PV`, au même niveau que les autres stats, afin de pouvoir plus tard être augmentés via les points gagnés par niveau.

Décision d'architecture :
- le registre de stats devient propriétaire de la règle `PV par point` via `maxHpPerPoint` ;
- les valeurs de stat de la créature deviennent l'unique autorité utilisateur pour la Santé ;
- `combat.maxHp` reste uniquement une projection technique dérivée nécessaire au runtime/export ;
- `initialHp` n'est plus éditable et ne doit pas constituer une seconde autorité ;
- l'import Monster Capture doit mapper le `hp` historique vers la stat Santé ;
- aucune formule cachée basée sur Endurance, nom de créature ou niveau.

Périmètre autorisé : registre de stats, projection des stats, import des valeurs historiques, export dérivé, UI de stats, tests, documentation.

Interdits : masquer simplement les champs sans supprimer leur lecture/écriture, conserver une valeur PV parallèle dans l'UI, déduire les PV d'Endurance par rustine, modifier le moteur de dégâts ou les règles de KO.

RED obligatoire : prouver que le registre n'a pas encore de Santé/PV, que le moteur de projection ne produit pas de maxHp et que l'éditeur expose encore `PV max / PV au départ`.


### Résultat — Capture Health Stat V1

RED :
- commit `2e4efd622d7f1522e6166c55810e4d262acb5688` ;
- CI `36762257911` — FAILURE attendue ;
- quatre manques confirmés : absence de stat Santé, absence de projection PV, import historique `hp` non raccordé à une stat et anciens contrôles `PV max / PV au départ` encore visibles.

Correction du modèle :
- `3f7a827c867aeffd9d34d4a63d7debf5b6f08622` : ajout générique de `maxHpPerPoint` au registre ;
- `d9b1e8c31dac852afbfa600383951fb1d8f3c83d` : ajout de la stat canonique `health / Santé / PV` avec `1 point = 1 PV max` ;
- `da608638dd0171540f1e04a85a843c58b2c241cb` : projection générique des PV depuis les stats ;
- `2e7e85a95aba7b7b0665cb7ae5760e95911fec38` : import du `hp` historique vers `health` ;
- `1eeeee4a91aa8640df3ed70614cd24f266bf4488` : retrait réel des deux contrôles PV historiques de l'HTML ;
- `17db5b1936b9f7563d844540fd9192f438bf9fc8` : Santé/PV intégrée au même éditeur de stats et règle `PV max / point` configurable ;
- `05008ca52fd62a9abde064101373b309e22e404c` : l'éditeur dérive le maxHp technique depuis les valeurs de stat ;
- `9e84e581dc4dd45dbfa67747dc7600cf06255f5e` : retrait de l'autorité `initialHp` de l'import ;
- `49cd12a9f4fe0273946066e41e3d431a44011350` : export V3 dérive maxHp et retire initialHp ;
- `5ed39144b164ff7c7b3f85ba9c7c2d7ad9a9c3f9`, `cc1a5c934a9be35f565902b1a17b6a3cc3247f22`, `2e8cc33cbcf9dad35206ce8177bb9c47c866bf06` : compatibilité explicite des anciens registres sans règle Santé ;
- `0df9a0be23325643764695263a9b401179e3f328` : retrait final de `initialHp` de l'owner Human Editor.

Sentinelles historiques réconciliées :
- `b5fc530a090aeb52ad19a205bba044ff44922b76` protège l'absence de contrôles PV dupliqués et la présence de la surface de stats ;
- `46979c1426b2e4226318671a461764841890d760` protège une seule stat canonique `health` et interdit un alias concurrent `hp`.

Comportement vérifié :
- 73 points de Santé -> 73 PV max ;
- un Monster Capture historique avec `hp: 42` importe `health: 42` ;
- aucun champ `data-max-hp` / `data-initial-hp` ne subsiste dans l'éditeur ;
- aucun registre ancien sans règle Santé ne voit ses PV forcés à zéro ;
- Combat State, dégâts, soins et KO continuent d'utiliser le `maxHp` technique dérivé sans changer leurs règles.

GREEN fonctionnel :
- HEAD : `0df9a0be23325643764695263a9b401179e3f328` ;
- CI `36763632710` — SUCCESS ;
- suite complète : **731/731 PASS, 0 FAIL**.

Protections :
- aucune formule Santé basée sur Endurance, niveau ou nom de créature ;
- aucun champ PV caché ;
- aucune seconde valeur PV éditable ;
- aucun changement au moteur de dégâts, soins ou KO ;
- aucun changement cooldown, mouvement, FX, audio ou assets.

État : **GREEN technique — PREVALIDATION smartphone requise**. À vérifier dans l'éditeur : la stat `Santé / PV` apparaît avec sa valeur, les anciens champs PV ont disparu et le combat utilise bien cette valeur comme PV max.


### Validation utilisateur — Capture Health Stat V1 + Arena Selector — 2026-09-30

Validation smartphone explicite reçue :
- la nouvelle stat `Santé / PV` est fonctionnelle ;
- les anciens réglages utilisateur `PV max / PV au départ` ne sont plus requis ;
- la sélection d'arène dans l'onglet Combat est fonctionnelle.

Statut : **GREEN utilisateur** pour ces deux comportements. Les protections d'architecture restent inchangées : `health` demeure l'unique autorité utilisateur des PV et l'arène demeure une donnée de présentation sans effet sur les règles de combat.


## Micro-lot — Capture Showcase Creature Presets V1 — 2026-09-30

Base validée : `783c824625f1785e86cabffe9eec8f09ba2b2aa0` (Capture Health Stat V1 + Arena Selector validés utilisateur ; CI `36769990012` SUCCESS).

- checkpoint GREEN précédent : `checkpoint/lab-capture-health-stat-v1-green-2026-09-30` ;
- checkpoint de départ : `checkpoint/lab-start-capture-showcase-presets-v1-2026-09-30` ;
- branche : `work/lab-capture-showcase-presets-v1-2026-09-30`.

### Entrées utilisateur

Deux exports éditeur complets `capture-creature-transfer-v1` :
- `crea_mossback` / Moussados ;
- `crea-loup` / Loup volcanique.

### Objectif

Intégrer ces deux exports comme modèles de vitrine réellement éditables, sans mock ni copie de gameplay :
- les réglages saisis dans l'éditeur (stats, Santé, éléments, résistances/faiblesses, présentation, profil, scale, sockets, compétences et loadout planifié) restent configurés ;
- un joueur peut conserver le modèle tel quel ou le modifier puis le réexporter ;
- le combat continue de projeter les contraintes de progression sans effacer le loadout planifié du modèle ;
- les assets existants de `global-assets` sont réutilisés par ID, sans copie locale concurrente.

### Autorité / réconciliation

- les fichiers preset sont des entrées `CaptureCreatureTransferV1` et passent par l'importeur/planificateur existant ;
- `configuredCreatures` reste l'unique état actif dans l'éditeur ;
- `crea_mossback` existe déjà dans le catalogue historique : le preset doit produire un `replace-creature`, jamais une seconde entrée ;
- `crea-loup` n'existe pas dans le roster historique canonique : le preset doit produire un `insert-creature` ;
- aucune seconde validation, aucun second importeur, aucune détection par nom ;
- `health` reste l'unique autorité utilisateur des PV ; `combat.maxHp` n'est qu'une projection technique ;
- les règles de progression ne modifient pas le preset enregistré : elles projettent seulement les slots/capacités actives au combat.

### Pré-audit confirmé

- les deux fichiers sont bien `capture-creature-transfer-v1` / draft V3 ;
- Moussados : élément Terre, Santé 200, profil `massive`, scale 1.7, assets Golem moussu existants ;
- Loup volcanique : élément Feu, Santé 150, résistance Feu +35 %, faiblesse Eau -50 %, profil `quadruped`, scale 1.2, assets Loup volcanique existants ;
- les capacités `lib_*` référencées existent dans les catalogues Capture migrés portable/complex ;
- `fireball` et `claw` existent dans le catalogue natif ;
- les packs `golem_moussu` et `loup_volcanique` existent déjà dans `global-assets` avec player/opponent/icon ;
- aucun nouvel asset ni nouveau moteur de compétences n'est requis.

### Périmètre autorisé

- données presets Capture ;
- catalogue/manifest de presets si nécessaire ;
- raccord d'hydratation de l'éditeur utilisant les adaptateurs Transfer existants ;
- tests ciblés ;
- documentation ;
- preview de la branche après GREEN technique.

### Protégé

- `main` ;
- dépôt `Zombicide-40k` ;
- Combat Runtime / Action Resolver ;
- FX / renderer / audio ;
- cooldown ;
- dégâts / résistances ;
- profils de mouvement ;
- arènes ;
- contrats Transfer/Database existants sauf preuve de défaut ;
- aucune copie des assets `global-assets`.

### RED obligatoire

Prouver avant correction que :
1. aucun catalogue de presets vitrine ne référence encore ces deux exports ;
2. Moussados hydraté depuis le roster historique ne conserve pas les valeurs du preset (niveau 1, Santé 200, résistances et loadout planifié) ;
3. `crea-loup` n'est pas encore présent comme vraie fiche éditable dans `configuredCreatures` ;
4. le chemin futur doit passer par `importCaptureTransferJsonV1 -> planCaptureTransferImportV1 -> applyCaptureTransferPlanToEditorStateV1`, sans importeur parallèle.

### Critère de fin

- les deux presets sont chargés par le pipeline Transfer existant ;
- aucun doublon d'ID ;
- les réglages exportés sont conservés ;
- Santé reste propriétaire des PV ;
- les capacités référencées sont résolues depuis les catalogues existants ;
- tests ciblés + CI complète verts ;
- preview smartphone publiée pour validation utilisateur.


### Résultat — Capture Showcase Creature Presets V1

RED :
- commit : `9c07f44bd8bff903bb5b9cc4bfcc228c8eca8e11` ;
- CI : `36770251851` — FAILURE attendue ;
- cause reproduite : absence du catalogue de presets vitrine (`ERR_MODULE_NOT_FOUND`) ;
- les sentinelles historiques continuaient de passer, un seul nouveau test était rouge.

Correction :
- `data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json` : preset Moussados issu de l'export utilisateur ;
- `data/capture/showcase/crea-loup.capture-creature-transfer-v1.json` : preset Loup volcanique issu de l'export utilisateur ;
- `src/catalogs/capture-showcase-creature-presets-v1.js` : manifest de découverte limité aux chemins de fichiers, sans répéter les IDs des créatures ;
- `src/ui/capture-editor-human-v2.js` : hydratation des presets via le pipeline existant `importCaptureTransferJsonV1 -> planCaptureTransferImportV1 -> applyCaptureTransferPlanToEditorStateV1` ;
- aucun importeur parallèle ; aucun merge champ-par-champ ; aucun traitement par nom.

Réconciliation :
- `crea_mossback` existe déjà dans le roster historique : le plan produit un remplacement explicite de l'entrée active, jamais un doublon ;
- `crea-loup` est ajouté comme nouvelle fiche active ;
- `configuredCreatures` reste l'unique état actif de l'éditeur ;
- les IDs sont lus uniquement depuis les Transfer eux-mêmes ; le manifest ne possède que les chemins et vérifie l'absence de doublons après import.

Réglages préservés :
- Moussados : niveau 1, Santé 200, Terre, résistance Feu +50 %, faiblesse Air -50 %, profil `massive`, scale 1.7, sockets exportés, loadout planifié `lib_earth_guard / claw / lib_quake / lib_rock_slam` ;
- Loup volcanique : niveau 10, Santé 150, Feu, résistance Feu +35 %, faiblesse Eau -50 %, profil `quadruped`, scale 1.2, socket bouche exporté, loadout planifié `fireball / claw / lib_flame_bite / lib_fireball` ;
- les visuels référencent les asset IDs existants de `global-assets` ; aucune copie locale n'est créée ;
- les capacités `lib_*` restent propriétaires dans les catalogues Capture natifs migrés ; `fireball` et `claw` restent propriétaires dans le catalogue natif existant.

Progression :
- le loadout du modèle reste enregistré tel que configuré ;
- `CapturePlannedLoadoutToCombatV1` continue seul à projeter au runtime les slots et capacités réellement débloqués selon le niveau ;
- aucune compétence configurée n'est effacée du preset pour satisfaire le niveau courant.

Santé :
- `statValues.values.health` reste l'autorité utilisateur ;
- les presets ont un `combat.maxHp` technique cohérent avec Santé, mais l'éditeur ne réintroduit aucun champ PV parallèle ;
- lors des sauvegardes/exports V3, le maxHp runtime reste dérivé de la projection de stats.

Revue de fichiers :
- données Capture presets ;
- manifest de presets ;
- Human Editor ;
- test ciblé ;
- documentation ;
- aucun fichier Combat Runtime, Action Resolver, FX, renderer, audio, mouvement ou arène modifié.

Validation technique finale :
- HEAD fonctionnel : `1c2a52f34b6d3a0ba6e030a3e01cebb86748561a` ;
- CI : `36770634118` — SUCCESS ;
- suite complète : **735/735 PASS, 0 FAIL**.

État : **GREEN technique — PREVALIDATION smartphone**. La validation utilisateur doit vérifier dans l'éditeur que les deux modèles apparaissent avec leurs réglages, qu'ils peuvent être modifiés sans perte de configuration et qu'un combat test peut être lancé avec le modèle sélectionné.


### Régression utilisateur — bibliothèque créatures absente — 2026-09-30

Retour smartphone après PREVALIDATION :
- plus aucune créature réellement chargée dans la bibliothèque ;
- seul le Loup volcanique statique du HTML restait visible dans les champs de formulaire ;
- le lot Showcase Presets n'est donc **pas GREEN utilisateur**.

Diagnostic :
- les 102 créatures canoniques historiques et leurs références de capacités/évolutions sont cohérentes ;
- un test d'intégration reconstruit bien 102 créatures avant presets puis 103 après remplacement de `crea_mossback` et insertion de `crea-loup` ;
- la régression est spécifique à l'orchestration navigateur ;
- cause de conception identifiée : `hydrateCaptureShowcaseCreaturePresetsV1()` a été ajouté comme dépendance bloquante du même `Promise.all` que le roster historique ;
- toute exception de lecture/import d'un preset rejette donc l'initialisation complète avant `refreshCreatureLibraryOptions()`, ce qui supprime de fait la bibliothèque stable de l'UI.

Décision corrective conforme charte :
1. le chargement du roster historique stable doit terminer et publier la bibliothèque indépendamment des presets ;
2. les presets sont ensuite appliqués transactionnellement via le même pipeline Transfer existant ;
3. une erreur preset doit être explicitement signalée, jamais masquée, mais ne doit pas retirer le roster historique déjà chargé ;
4. aucune seconde autorité, aucun fallback de données, aucun importeur parallèle ;
5. ajouter une sentinelle qui interdit qu'une erreur de preset fasse disparaître la bibliothèque historique.

État : **REGRESSION CONFIRMÉE — GREEN RETIRÉ POUR CE LOT**.


### Correction de régression — démarrage bibliothèque + presets vitrine

RED de protection :
- commit `ee0d7f3772971103da419f9891a8aff9e54a8da0` ;
- CI `36771882684` — FAILURE attendue ;
- sentinelle : un batch de presets doit être atomique et ne jamais muter le roster stable si un des transferts échoue.

Cause d'architecture corrigée :
- les presets vitrine ne sont plus une dépendance bloquante du `Promise.all` qui hydrate le roster historique ;
- la bibliothèque Monster Capture stable est maintenant publiée dans l'UI avant l'attente des presets ;
- l'erreur d'un preset reste affichée explicitement, mais elle ne peut plus faire disparaître le roster historique ;
- aucune donnée de secours n'est inventée et aucun échec n'est masqué.

Transaction :
- nouveau propriétaire générique dans `capture-editor-file-transfer-v1.js` : `applyCaptureTransferBatchToEditorStateV1` ;
- les maps créatures/capacités sont clonées pour staging ;
- chaque Transfer passe toujours par `buildCaptureEditorDatabaseV1 -> planCaptureTransferImportV1 -> applyCaptureTransferPlanToEditorStateV1` ;
- les maps actives ne sont remplacées qu'après validation complète de tout le batch ;
- en cas d'erreur, le roster stable reste strictement inchangé.

Sentinelles ajoutées :
- reconstruction réelle du roster : 102 créatures canoniques avant presets, 103 après remplacement de `crea_mossback` + insertion de `crea-loup` ;
- batch invalide : aucune mutation du roster stable ;
- ordre navigateur protégé : publication du roster stable avant `await hydrateCaptureShowcaseCreaturePresetsV1` ;
- erreur preset explicitement visible sans rejet du roster stable.

Corrections :
- `f265f6d71e0fa3467fc096734792e1e21dd6934a` : batch Transfer atomique ;
- `7e2aa4592343a3653006c52f76a878ef6028cd47` : isolation du chargement presets / roster stable ;
- `354bcbe71b8c189f963fd7a0803f9ab0d25246c4` : réconciliation des sentinelles de statut 103 capacités ;
- `ed576eff77c7c96221d7e77a69e65a854e2ed692` : sentinelle finale d'ordre de démarrage.

Validation technique :
- CI `36772287519` — SUCCESS ;
- suite complète : **738/738 PASS, 0 FAIL**.

Le checkpoint/preview précédent `c9f89c54e05f6a1696cd797830914fe1a6dd5192` est **supersédé** pour ce lot et ne doit plus servir de preview utilisateur.

État : **GREEN technique après correction de régression — PREVALIDATION smartphone requise**.


### PREVALIDATION smartphone — ÉCHEC / régression — 2026-10-01

Retour utilisateur : après intégration des deux presets vitrine, la bibliothèque de créatures n'est plus disponible dans l'éditeur ; seul le Loup présent comme contenu initial/de test reste visible.

Conséquence immédiate :
- le lot `Capture Showcase Creature Presets V1` n'est **pas GREEN utilisateur** ;
- la preview `preview/lab-capture-showcase-presets-v1-2026-09-30` est invalide pour validation ;
- aucun merge vers `main` ;
- aucune rustine/fallback/masquage autorisé.

Diagnostic déjà établi :
- le symptôme correspond à un arrêt de l'hydratation globale avant `refreshCreatureLibraryOptions()` ;
- le Loup encore visible vient du formulaire HTML initial et ne prouve pas que `configuredCreatures` est chargé ;
- la CI unitaire précédente (735/735) n'exerçait pas suffisamment le chemin réel de bootstrap navigateur après ajout des presets ; cette couverture est donc insuffisante et doit être complétée par un RED de bootstrap/hydratation réelle ;
- la cause exacte de l'exception qui interrompt le chargement reste à démontrer avant modification.

Procédure de reprise :
1. reproduire l'échec de bootstrap avec un test RED qui exerce réellement l'hydratation catalogue + presets ;
2. capturer l'exception exacte ;
3. corriger uniquement au propriétaire fautif ;
4. vérifier que le roster historique complet reste présent, que Moussados est remplacé sans doublon et que Loup volcanique est ajouté ;
5. CI complète + nouvelle preview ;
6. nouvelle validation smartphone utilisateur obligatoire.


## Micro-lot — Showcase Creature Configuration Corrections V1 — 2026-10-01

Base : `04381fee5713f72ad3c6be80f5143f501f680bef` (lot vitrine toujours non GREEN utilisateur).

- checkpoint de départ : `checkpoint/lab-start-showcase-config-corrections-v1-2026-10-01` ;
- branche : `work/lab-showcase-config-corrections-v1-2026-10-01`.

### Retours utilisateur à corriger

1. Le Loup visible dans le test Combat n'utilise pas la vraie configuration du modèle vitrine ; l'ancien chemin `CAPTURE_TEST_CREATURE_OPTIONS_V1 -> buildCaptureTestOpponentDraftV1` construit encore un mock `crea-enemy` générique. Le vrai preset vitrine est `crea-loup` et contient Santé 150, Feu +10, résistance Feu +35 %, faiblesse Eau -50 %, profil quadruped, scale 1.2 et loadout planifié `fireball / claw / lib_flame_bite / lib_fireball`.
2. Le socket `mouth` de Moussados (`crea_mossback`) a été enregistré avec les coordonnées front/back inversées dans le preset vitrine. La correction doit être faite dans le preset propriétaire et protégée par test.

### Règles de correction

- aucune seconde autorité créature ;
- aucun fallback qui masque l'erreur ;
- aucun traitement par nom ;
- le test Combat doit consommer la vraie fiche configurée lorsqu'un modèle vitrine est sélectionné ;
- le mock historique peut rester uniquement pour les créatures de preview qui ne sont pas encore de vraies fiches configurées, mais il ne doit jamais prendre autorité sur `crea-loup` ou `crea_mossback` ;
- les coordonnées socket sont corrigées dans `data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json`, pas compensées dans le renderer/UI ;
- RED ciblé obligatoire avant correction fonctionnelle ;
- CI complète et nouvelle preview avant validation smartphone.

### Périmètre autorisé

- données presets vitrine ;
- raccord sélecteur de test Combat vers les fiches configurées ;
- tests ciblés ;
- documentation ;
- preview.

### Protégé

- Combat Runtime / Action Resolver ;
- règles dégâts, résistances, cooldown ;
- mouvement ;
- FX / renderer / audio ;
- arènes ;
- dépôt `Zombicide-40k` ;
- `main`.

État : **LOT OUVERT — diagnostic confirmé, RED à écrire**.


### Résultat — Showcase Creature Configuration Corrections V1

RED :
- test ciblé : `tests/unit/capture-showcase-config-corrections-v1.test.mjs` ;
- commit : `27707bd1d3be7f47c1062207e85ab2f5d8977af5` ;
- CI : `36830209857` — FAILURE attendue.

Cause confirmée :
- l'option de test `loup-volcanique` utilisait encore `buildCaptureTestOpponentDraftV1`, qui construit le mock générique `crea-enemy` et ignore la vraie fiche `crea-loup` ;
- même risque pour `golem-moussu` / `crea_mossback` ;
- le socket bouche de Moussados était enregistré dans le preset avec les coordonnées front/back inversées.

Corrections :
- `17e31e4303851602e1c9cec242a7aa5bec9fbb70` : les options de test Loup volcanique et Golem moussu déclarent explicitement leur `configuredCreatureId` (`crea-loup` / `crea_mossback`) ;
- `30b2276d8b6ef41fd6c04128f34b463f6c3e18c4` : correction persistante du socket `mouth` de Moussados directement dans le preset propriétaire ;
- `f4bd05db0795ea9ec280e286d326d16090025c7f` : le Human Editor accepte un `getOpponentCreatureId` ; lorsqu'un modèle configuré est choisi, il récupère directement la fiche depuis `configuredCreatures` et réutilise son draft, son loadout, ses stats et les compétences déjà présentes dans `configuredSkills` ; le mock `crea-enemy` n'est plus autorité pour ces modèles ;
- `e3c62036be55a6ed66f6a0be9cd264c011bfe494` : le DOM demo transmet l'ID configuré et marque visuellement les options comme `modèle configuré`.

Autorités préservées :
- `configuredCreatures` reste l'unique état actif des vraies fiches ;
- aucun duplicata de Loup n'est créé ; l'option de test Loup pointe vers `crea-loup` ;
- aucune donnée de secours n'est inventée ; si un `configuredCreatureId` annoncé est absent, le test échoue explicitement ;
- les créatures qui n'ont pas encore de vraie fiche configurée continuent d'utiliser le mock de preview historique, sans prendre autorité sur les modèles vitrine ;
- le socket Moussados est corrigé dans la donnée source, aucune inversion UI/renderer n'a été ajoutée.

Coordonnées bouche Moussados enregistrées :
- front : `x=0.9318691325306842`, `y=0.5627603530883789` ;
- back : `x=0.10053788768847613`, `y=0.6934029261271158`.

Validation technique :
- HEAD fonctionnel : `e3c62036be55a6ed66f6a0be9cd264c011bfe494` ;
- CI : `36830383242` — SUCCESS ;
- suite complète verte.

État : **GREEN technique — PREVALIDATION smartphone requise**. Vérifier :
1. Loup volcanique dans le test Combat est indiqué comme modèle configuré et utilise Santé 150 / Feu +10 / résistance Feu +35 % / faiblesse Eau -50 % / profil quadruped / scale 1.2 / loadout configuré ;
2. Moussados utilise la bouche corrigée dans les deux vues ;
3. la bibliothèque historique reste complète.


### PREVALIDATION smartphone — ÉCHEC 2 — 2026-10-01

Retour utilisateur :
- les créatures sont bien revenues dans la bibliothèque ;
- Moussados : socket bouche toujours mal placé ;
- Loup volcanique : aucun socket visible et compétences équipées non placées.

Le GREEN utilisateur reste refusé. Aucun merge vers `main`.

Diagnostic racine corrigé :
1. `capture-editor-v2.html` démarre avec un formulaire statique `crea-loup` sans sockets ni loadout. Le vrai preset `crea-loup` remplace ensuite correctement l'enregistrement dans `configuredCreatures`, mais après le batch showcase le code ne rappelle pas `loadCreatureRecord()` pour la créature déjà sélectionnée : seuls les stats sont rerendus. Le formulaire visible conserve donc les sockets/slots vides de l'état statique malgré une fiche mémoire correcte.
2. `replaceCreatureSockets()` parcourt tous les sockets et appelle `updateSocketMarker()`, mais `updateSocketMarker()` ne gère qu'un marqueur unique par vue. Chaque socket écrase donc visuellement le précédent ; sur Moussados, le dernier socket (`tail`) remplace le marqueur de bouche. Le sélecteur `data-socket-kind` ne resynchronise pas le marqueur avec le socket sélectionné.
3. L'inversion front/back appliquée précédemment au socket bouche Moussados reposait sur cette lecture visuelle faussée. Les coordonnées du fichier export utilisateur d'origine doivent être restaurées : front `0.10053788768847613 / 0.6934029261271158`, back `0.9318691325306842 / 0.5627603530883789`.

Plan de correction propriétaire :
- RED : exiger le rechargement complet de la fiche sélectionnée après application des presets showcase ;
- RED : exiger que le marqueur de socket affiché soit celui du socket actuellement sélectionné, par vue ;
- restaurer les coordonnées bouche Moussados issues de l'export original ;
- ne toucher ni Combat Runtime, ni mouvement, ni FX, ni règles de dégâts ;
- CI complète + nouvelle preview + nouvelle validation smartphone.

État : **LOT OUVERT — GREEN technique précédent invalidé par PREVALIDATION utilisateur**.


### Correction après PREVALIDATION smartphone ÉCHEC 2

RED ciblé :
- commit test : `c9c9f45243a45917dd3d026b6a2c729b1f994c45` ;
- CI : `36841141531` — FAILURE attendue ;
- les sentinelles exigent :
  - rechargement complet de la fiche sélectionnée après remplacement par le preset vitrine ;
  - résolution du marqueur par `socketId + view` ;
  - conservation des coordonnées originales exportées par l'utilisateur pour la bouche de Moussados ;
  - présence du socket bouche et des 4 compétences planifiées du Loup vitrine.

Corrections :
- `eb8cbcd897401cfec1329b34034a452be0b59987` : restauration des coordonnées bouche Moussados issues du fichier export original ;
- `1405b91102d81005ebda9a53312b610da01cb695` :
  - après application du batch showcase, la créature déjà sélectionnée est rechargée via `loadCreatureRecord()` ; sockets, loadout, stats, visuels et profil visibles proviennent donc tous du même enregistrement `configuredCreatures` ;
  - ajout de l'autorité pure `captureSelectedSocketPointV1()` pour résoudre un point par socket sélectionné et par vue ;
  - `replaceCreatureSockets()` ne superpose plus tous les sockets sur un marqueur unique ;
  - changement de `data-socket-kind` resynchronise le marqueur avec le socket demandé ;
  - un placement manuel resynchronise également le marqueur sélectionné.

Validation technique :
- CI `36841253515` — SUCCESS ;
- suite complète : **745/745 PASS, 0 FAIL** ;
- Combat Runtime / Action Resolver / mouvement / FX / dégâts / arènes inchangés.

État : **GREEN technique après correction ÉCHEC 2 — nouvelle PREVALIDATION smartphone requise**.


### Décision de gouvernance — méthode d’intégration des presets — 2026-10-01

À la demande de Sylvain, la méthode validée lors de l’intégration de Moussados et du Loup volcanique devient une règle permanente du laboratoire.

- ajout dans `docs/LAB_CHARTE.md` du §33 « Intégration durable des presets créatures et capacités exportés par l’éditeur » ;
- commit : `21b086d41ff0c5b016e60c0a876acd8b76459f57` ;
- la procédure impose notamment : export éditeur comme donnée de référence, autorité unique `configuredCreatures/configuredSkills`, remplacement par ID sans doublon, conservation intégrale sockets/loadout/stats/visuels/audio, aucun correctif UI compensatoire des données, rechargement complet après remplacement, vraie fiche configurée dans le test Combat, RED + CI + preview + validation smartphone.

Cette règle doit être appliquée aux prochains exports de créatures et capacités transmis pour la vitrine Capture.


### VALIDATION UTILISATEUR — Showcase Configuration Corrections V1 — 2026-10-01

Retour utilisateur après la preview corrigée : « Ha parfait ».

Validation confirmée sur le chemin smartphone :
- créatures présentes ;
- Loup volcanique correctement hydraté avec sa configuration ;
- sockets visibles ;
- compétences/loadout restaurés ;
- sélection des sockets Moussados corrigée.

Le lot est **GREEN utilisateur**.

Cette validation clôt le micro-lot de correction showcase. Aucun merge vers `main` n'est effectué automatiquement.


## Micro-lot — Capture Ultimate Slot V1 — 2026-10-01

Base exacte : `dcbee6056883dce593cb4420837f58bd3eb89449` (Showcase Configuration Corrections V1 validé utilisateur).

- checkpoint GREEN précédent : `checkpoint/lab-showcase-config-corrections-v1-user-green-2026-10-01` ;
- checkpoint de départ : `checkpoint/lab-start-capture-ultimate-slot-v1-2026-10-01` ;
- branche : `work/lab-capture-ultimate-slot-v1-2026-10-01`.

### Objectif

Ajouter un cinquième emplacement de capacité réservé aux capacités ultimes, sans modifier l'autorité ni la progression des quatre slots actifs standards.

### Contrat cible

- slots standards : `slot-1` à `slot-4` ;
- slot ultime : `slot-ultimate` ;
- `CaptureProgressionRulesV1.maxActiveSkills` continue de concerner exclusivement les quatre slots standards ;
- une compétence déclare explicitement sa classe d'équipement : standard ou ultime ;
- une capacité ultime ne peut pas être placée dans un slot standard ;
- une capacité standard ne peut pas être placée dans `slot-ultimate` ;
- le niveau requis d'une capacité reste applicable au runtime ;
- les anciens loadouts quatre slots restent importables et sont normalisés avec un slot ultime vide ;
- aucune capacité existante ne devient ultime implicitement.

### Propriétaires concernés

- Skill Definition : classe d'équipement de la compétence ;
- Capture Active Skill Loadout : structure des 4 slots standards + slot ultime ;
- adaptateur Planned Loadout -> Combat : projection progression/niveau ;
- Human Editor : choix et affichage des slots uniquement ;
- Combat Runtime / Action Resolver : inchangés sauf si le vrai chemin démontre un raccord nécessaire.

### Périmètre autorisé

- `src/contracts/skill-definition.js` ;
- `src/contracts/capture-active-skill-loadout-v1.js` ;
- adaptateurs Capture loadout/export/import concernés ;
- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- tests ciblés ;
- documentation ;
- presets uniquement si une migration vide du cinquième slot est nécessaire.

### Protégé

- règles dégâts/résistances ;
- cooldown ;
- énergie ;
- Animation Core ;
- FX Core ;
- profils de mouvement ;
- arènes ;
- sockets ;
- assets ;
- dépôt `Zombicide-40k` ;
- `main`.

### TDD

1. RED contrat : ancien loadout 4 slots -> canonique 5 slots avec `slot-ultimate:null` ;
2. RED : validation standard/ultime ;
3. RED runtime : progression filtre seulement les 4 standards, niveau requis filtre aussi l'ultime ;
4. RED UI : cinquième sélecteur Ultime distinct et filtrage des options ;
5. correction minimale aux propriétaires ;
6. CI complète ;
7. preview smartphone ;
8. GREEN utilisateur requis.

État : **LOT OUVERT — RED à écrire**.


### Résultat technique — Capture Ultimate Slot V1 — 2026-10-01

RED initial :
- test : `tests/unit/capture-ultimate-slot-v1.test.mjs` ;
- commit : `1805b040d7d34a92ae2b335275296184ed366880` ;
- CI : `36845251618` — FAILURE attendue ;
- les échecs concernaient exclusivement les nouvelles exigences 4+1 / standard / ultimate / UI.

Implémentation :
- `3024db21d98dc08189006a3d87fe1411743c234e` : `SkillDefinition.loadoutSlot = standard|ultimate`, défaut `standard` ;
- `b97f530523740b9b4fd12ba274f856ad3103d3da` : loadout canonique `slot-1..4 + slot-ultimate`, migration automatique des anciens quatre slots ;
- `22d48eeda10d03bf755034f39e5cc09f861a6c48` puis `b3e0917596cea2c0dbcb253567bed038cf707dea` : validation centralisée du type de slot ;
- `51fc7c5a6b17b7160b320c196bad1c58fc4320ac` : la progression ne filtre que les quatre slots standards ; l'Ultime reste soumis à son `requiredLevel` ;
- `b7a416aed34cad6ac235bed1ade2f9c81b622868` : validation du type de slot dans l'export direct ;
- `d30de3db321f6523e9d1975d04c14dfadddc74c9` et `780c42d7153d950231f6f559c7ba4d7e66d1837a` : raccord Human Editor ;
- `548e243201ab4bbfbb5ab1b1c9996d05bcf3a8c6` : UI 4 slots standards + 1 slot Ultime et séparation Ultime / conditions d'activation ;
- sentinelles historiques migrées vers le contrat 4+1 sans modifier les quatre capacités historiques standards ;
- `2a4dbc06c16fb026d96b36789fd7e6ed904cbfc7` : sentinelle du vrai chemin Capture Editor Export V3.

Invariants :
- `maxActiveSkills` reste à 4 et ne compte jamais l'Ultime ;
- aucune ancienne capacité ne devient Ultime automatiquement ;
- ancien loadout 4 slots -> 5e slot Ultime vide ;
- capacité standard interdite dans Ultime ;
- capacité Ultime interdite dans slot standard ;
- conditions d'activation indépendantes du statut Ultime ;
- Combat Runtime / Action Resolver / dégâts / résistances / énergie / cooldown / Animation / FX / mouvement / arènes / sockets inchangés.

Validation technique :
- CI fonctionnelle finale : `36846307663` — SUCCESS ;
- suite complète : **752/752 PASS, 0 FAIL**.

État : **GREEN technique — PREVALIDATION smartphone requise avant GREEN utilisateur**.


## Micro-lot — Skill Editor Expressive Conditions & Persistent Zones V1 — 2026-10-01

Base exacte : `18188cf56298d9675d513e94646e06ff5980f531` (Capture Ultimate Slot V1 — GREEN technique).

- checkpoint de départ : `checkpoint/lab-start-skill-editor-expressive-effects-v1-2026-10-01` ;
- branche : `work/lab-skill-editor-expressive-effects-v1-2026-10-01`.

### Décision utilisateur

Avant de créer/configurer les premières capacités Ultimes, enrichir l'éditeur de capacités.

Besoins explicites :
1. Conditions d'activation moins restrictives :
   - nombre d'alliés tués / KO ;
   - nombre d'ennemis tués / KO ;
   - temps de combat écoulé ;
   - conserver les conditions existantes.
2. Effets de zone persistants :
   - exemple cible : aura / zone de feu ;
   - persiste dans l'arène ;
   - applique des dégâts à intervalle régulier tant qu'une cible est dans la zone ;
   - une réactivation peut augmenter le rayon ;
   - nombre maximal d'activations/renforcements configurable, exemple 3.
3. Le modèle doit être générique et réutilisable pour d'autres éléments/effets, pas codé sur le nom « Aura de feu ».

### Contrat cible — activation

Étendre `SkillDefinition.activationRequirements` sans seconde autorité.

Types minimaux à supporter dans ce lot :
- `combat_elapsed_ms` (existant) ;
- `damage_dealt` (existant) ;
- `damage_taken` (existant) ;
- `hp_at_or_below_pct` (existant) ;
- `allies_defeated` ;
- `enemies_defeated` ;
- `kills_by_self`.

Les conditions restent combinables avec `mode: all|any`.

Le propriétaire des compteurs de combat doit être Combat State / Combat Session, jamais l'UI.

### Contrat cible — zone persistante

Ajouter un effet tactique générique de type zone persistante, data-driven, contenant au minimum :
- portée de cible / relation ;
- rayon initial ;
- durée ;
- intervalle de tick ;
- effet appliqué à chaque tick ;
- nombre maximal de renforcements ;
- croissance de rayon par renforcement ;
- règle de réactivation explicite (ex. refresh / reinforce) ;
- élément / canal transmis aux dégâts lorsque pertinent.

La zone doit être un état gameplay appartenant à Combat State / Combat Session.
L'UI ne doit posséder ni timer de tick, ni durée, ni compteur de renforcements actif.

### Extensions prévues sans les imposer dans le premier raccord

Le contrat doit rester extensible pour des conditions futures comme :
- énergie au-dessus / en dessous d'un seuil ;
- nombre d'alliés ou ennemis encore vivants ;
- nombre d'utilisations d'une capacité ;
- nombre de buffs/debuffs actifs ;
- distance / proximité ;
- état particulier de la cible.

Ces extensions ne doivent pas être simulées par des champs libres ou des noms spéciaux.

### Propriétaires concernés

- Skill Definition : types de conditions d'activation ;
- Skill Effect V1 : définition de la zone persistante ;
- Combat State / Combat Session : compteurs de KO et instances de zones actives ;
- Action Resolver / résolution d'effets : lecture des conditions et création/renforcement de zone ;
- Human Editor : saisie/affichage seulement ;
- Runtime clock existante : progression temporelle des zones, sans second timer UI.

### Protégé

- 4 slots standards + `slot-ultimate` déjà GREEN technique ;
- cooldown et son horloge autoritaire ;
- énergie ;
- résistances ;
- Animation Core ;
- FX Core ;
- profils de mouvement ;
- arènes ;
- sockets ;
- presets vitrine existants ;
- dépôt `Zombicide-40k` ;
- `main`.

### TDD

1. RED contrat des nouveaux types de conditions ;
2. RED compteurs KO dans le vrai état de combat ;
3. RED résolution `allies_defeated / enemies_defeated / kills_by_self` ;
4. RED contrat zone persistante ;
5. RED création / tick / expiration / renforcement de zone ;
6. RED UI Human Editor ;
7. correction minimale aux propriétaires ;
8. CI complète ;
9. preview smartphone ;
10. GREEN utilisateur requis.

État : **LOT OUVERT — audit des propriétaires et RED à écrire**.


### Résultat technique — Skill Editor Expressive Conditions & Persistent Zones V1

#### Conditions d’activation

RED :
- test `tests/unit/skill-editor-expressive-effects-v1.test.mjs` ;
- commit `6436c14cd2cc1bbb182aadba24e22b95c1de31b5` ;
- CI `36859393163` — FAILURE attendue.

Implémentation :
- `5d318514051455428216ce7df0151662de3a4869` : nouveaux types `allies_defeated / enemies_defeated / kills_by_self` ;
- `ca636c071bdb9711b4d5b59b43d0464606453e6f` : `knockoutsTotal` dans Combat State ;
- `bde055c2352a14c74ce94c6ca7914b4d78a4f7c7` : crédit KO uniquement sur transition vivante -> 0 PV ;
- `6ddb0240cc2f280aefe9513f0d492dcaeceda879` : évaluation des compteurs d’équipe via BattleFormat + Combat State ;
- `4c93ef324f2c242f175a931ab338e006f4d0394f` / `1b6c38dec53066275f658bab93c1d456bf35f242` : raccord du BattleFormat jusqu’à l’évaluateur ;
- `b2206e5a8b3e12f63386faf78e073d493df017fa` / `ce53fa98eaa9f3875eb3a57d0b509ebff0da7e11` : saisie et libellés Human Editor.

Le temps écoulé `combat_elapsed_ms` existait déjà et reste conservé.

#### Zones persistantes

RED runtime :
- test `tests/unit/persistent-zone-runtime-v1.test.mjs` ;
- commit `e903099fcdd24a59d09dbd61cac6c186c081af9a`.

Contrat/runtime :
- `4a646ae4a751be727dcc967972a07e099e4d4811` : `SkillEffectV1.persistent_zone` ;
- `b3909e29834db37acc44a8a3b93f42a6e12c2ee7` : `CombatState.persistentZones` ;
- `d0edd9b1e712136039837fd14041d4d5c4b6dcfb` : propriétaire runtime des zones ;
- `848a725431945ca18f9d28169f55a6c408532dc6` : séparation du propriétaire immédiat et persistant ;
- `60340b8aaf6bec948400e96e9a209a9a23238c61` / `b95117f023a125c203130c5e54612dbc0830ce72` : création à l’impact et progression sur le clock de combat.

Régression TDD détectée :
- lors d’une réactivation après avancement du combat, `impactAtMs` relatif était utilisé comme temps absolu, pouvant produire un tick supplémentaire ;
- `a4347c7863a31b9df2acc50dfe12229177366e5f` ancre désormais la création/réactivation sur `CombatState.elapsedMs + impactAtMs` ;
- CI `36860112833` — SUCCESS.

RED UI :
- commit `00ad28011a76092c913a3388cc446e5fc7aea993` ;
- CI `36860434629` — FAILURE attendue.

Human Editor :
- `48282cde98bca043d507e5e81263a4d4c45798b9` : construction de contrat zone depuis les champs lisibles ;
- `d30b22a6c367730c61523532e645ba190f8fa2d9` : contrôles ID, rayon, durée, tick, réactivation, activations max, croissance, dégâts et canal ;
- `f3aed3bc11729501d37e8ecbb8226626817c7b1a` : aide utilisateur dans l’éditeur.

Sémantique V1 :
- rayon réel = bandes de distance gameplay `short / medium / long`, jamais pixels UI ;
- `reinforce` augmente le rayon selon `radiusGrowthSteps`, plafonné par `maxActivations` et `long` ;
- `refresh` rafraîchit la durée sans augmenter l’autorité de rayon ;
- le tick V1 est un effet de dégâts et passe par les calculs de dégâts/résistances/boucliers existants ;
- aucun second timer n’est créé.

Validation technique :
- HEAD fonctionnel avant documentation : `f3aed3bc11729501d37e8ecbb8226626817c7b1a` ;
- CI `36860527361` — SUCCESS ;
- suite complète : **762/762 PASS, 0 FAIL**.

Limites assumées V1 :
- pas encore de coordonnées spatiales individuelles : rayon = distances Proche/Moyen/Loin ;
- le tick de zone est dégâts uniquement ;
- soin de zone, énergie, statuts, entrée/sortie, zone mobile, explosion à expiration et interactions entre zones restent des extensions futures du même propriétaire.

État : **GREEN technique fonctionnel — documentation/checkpoint/preview à finaliser, puis PREVALIDATION smartphone**.


### Publication de PREVALIDATION — Expressive Skills V1

Noms réservés :
- checkpoint GREEN technique : `checkpoint/lab-skill-editor-expressive-effects-v1-green-2026-10-01` ;
- preview smartphone : `preview/lab-skill-editor-expressive-effects-v1-2026-10-01`.

Les deux références doivent pointer sur le même HEAD documenté et ne pourront devenir GREEN utilisateur qu’après validation smartphone explicite.

Aucun merge vers `main`.


## Micro-lot — Persistent Zone Editor Clarity & Visual V1 — 2026-10-01

Base exacte : `89eedf2fb696a28cd554a8c2f1e0696891e3b950` (Skill Editor Expressive Conditions & Persistent Zones V1 — GREEN technique / PREVALIDATION smartphone).

- checkpoint de départ : `checkpoint/lab-start-persistent-zone-editor-clarity-visual-v1-2026-10-01` ;
- branche : `work/lab-persistent-zone-editor-clarity-visual-v1-2026-10-01`.

### Retour smartphone utilisateur

L'UI de zone persistante est fonctionnelle mais plusieurs champs sont trop techniques ou ambigus :
- `Dégâts toutes les (secondes)` décrit en réalité l'intervalle entre deux ticks ;
- `Dégâts par tick` doit être expliqué comme la valeur appliquée à chaque intervalle ;
- `Canal / élément` est un champ texte alors que l'intention est d'utiliser l'élément de la capacité par défaut ou de choisir explicitement un élément ;
- aucun réglage de présentation ne permet encore d'associer un sprite/FX persistant à la zone pendant toute sa durée.

### Objectif

1. Renommer et documenter les champs de zone persistante avec des libellés non techniques.
2. Remplacer le champ texte de canal par un sélecteur data-driven :
   - `Même élément que la capacité` par défaut ;
   - éléments Capture explicites disponibles en surcharge.
3. Ajouter une présentation persistante de zone, distincte de Cast / Trajet / Impact :
   - asset visuel de zone ;
   - scale de base ;
   - rendu présent tant que l'instance `CombatState.persistentZones` existe ;
   - mise à jour de scale quand le rayon gameplay évolue ;
   - suppression à l'expiration ;
   - aucune seconde horloge UI.
4. Conserver intégralement les règles gameplay V1 existantes.

### Propriétaires concernés

- Human Editor : saisie et libellés uniquement ;
- Skill Presentation : référence d'asset et paramètres visuels de zone ;
- adaptateur de présentation / FX : projection de l'état `persistentZones` vers un visuel ;
- Combat State / persistent-zone-runtime : autorité gameplay inchangée.

### Fichiers autorisés

- `src/ui/capture-editor-human-v2.js` ;
- contrat / adaptateur de présentation de compétence concerné après audit exact ;
- adaptateur FX/renderer de preview concerné après audit exact ;
- `examples/dom-demo/capture-editor-v2.html` si une aide textuelle statique est nécessaire ;
- tests unitaires ciblés du nouveau lot ;
- documentation d'architecture/current work strictement nécessaire.

### Protégé

- `persistent-zone-runtime-v1.js` et ses règles de tick/rayon/réactivation, sauf démonstration TDD d'une incohérence ;
- calculs de dégâts, résistances, boucliers et KO ;
- Action Resolver / Combat Runtime ;
- 4 slots standards + slot Ultime ;
- cooldown/énergie ;
- Animation Core et profils de mouvement ;
- Projectile Clash et trajectoires de projectiles ;
- presets créatures ;
- `main` ;
- dépôt `Zombicide-40k`.

### TDD

1. RED UI : libellés clairs et sélecteur d'élément avec héritage explicite ;
2. RED présentation : définition d'un visuel persistant de zone sans modifier le contrat gameplay ;
3. RED vrai chemin : création / renforcement / expiration d'une zone pilote l'apparition / scale / suppression du visuel sans timer secondaire ;
4. correction minimale aux propriétaires ;
5. tests ciblés ;
6. CI complète ;
7. documentation ;
8. checkpoint/preview ;
9. PREVALIDATION smartphone utilisateur avant GREEN utilisateur.

État : **LOT OUVERT — audit des propriétaires puis RED obligatoire avant correction fonctionnelle**.


### Résultat technique — Persistent Zone Editor Clarity & Visual V1

RED :
- test : `tests/unit/persistent-zone-editor-clarity-visual-v1.test.mjs` ;
- commit : `9cc32ad9cab05762a9ad38279221c5c9d7034d6a` ;
- CI : `36866428100` — FAILURE attendue ;
- les 5 nouvelles exigences étaient RED : libellés/élément, donnée de présentation persistante, résolution d'asset, renderer persistant et raccord runtime.

Cause démontrée :
- le champ `Dégâts toutes les (secondes)` nommait un intervalle avec un libellé ambigu ;
- `Canal / élément` était un champ texte libre ;
- le Human Editor ne produisait aucun slot visuel persistant ;
- l'adaptateur de présentation ne résolvait que Cast / Trajet / Impact ;
- le renderer ne possédait aucun raccord à `CombatState.persistentZones`.

Corrections :
- `defa67a2a29ef9e19abc543bf7e6e88a29bc9914` : libellés clairs, sélecteur `Même élément que la capacité` + éléments Capture, donnée `zoneAssetId/zoneDisplayScale` projetée vers `visual.aura` en boucle ;
- `d3936ce32c1397130d71ee401ca1e4ee234462ac` : contrôles Human Editor `Visuel persistant de zone` + scale ;
- `62b628f9211de41038d091a41ba1543ad624c200` : adaptateur présentation expose `persistentZone` ;
- `7a8ab199a76b046b8fc393c9419c87617cf5915c` puis `65cca3ad064ee21d31030b887a0963cc41b1f5bc` : renderer persistant, croissance visuelle Proche/Moyen/Loin et ancrage au slot stable ;
- `bfcc70d804f6ff09145a48d9e670fc8753084b9d` / `628c519003cb6897ba5f1e10fd6dab7e22bb4072` : raccord au `Combat Runtime.onClock(state)` existant, sans second timer ;
- `afbec9074a6a1bc2a3e7ca4dce321e923926f11b` : couche CSS de zone persistante.

Validation :
- CI fonctionnelle : `36866991180` — SUCCESS ;
- suite complète : **767/767 PASS, 0 FAIL** ;
- le runtime gameplay des zones, les dégâts, résistances, boucliers, KO, projectile clash et profils de mouvement n'ont pas été modifiés.

État : **GREEN technique fonctionnel — documentation finale/checkpoint/preview à publier, puis PREVALIDATION smartphone utilisateur**.


### Publication de PREVALIDATION — Persistent Zone Clarity & Visual V1

Noms réservés :
- checkpoint GREEN technique : `checkpoint/lab-persistent-zone-editor-clarity-visual-v1-green-2026-10-01` ;
- preview smartphone : `preview/lab-persistent-zone-editor-clarity-visual-v1-2026-10-01`.

Les deux références doivent pointer sur le même HEAD documenté que la branche work.
La validation smartphone reste obligatoire avant GREEN utilisateur.

Aucun merge vers `main`.


## Micro-lot — Skill Save/Test Dirty State & Persistent Zone Asset Filter V1 — 2026-10-01

Base exacte : `6a9632588b634aa6bdf9d6c5768ac58c0d69bb14` (Persistent Zone Editor Clarity & Visual V1 — GREEN technique / PREVALIDATION smartphone).

- checkpoint de départ : `checkpoint/lab-start-skill-save-zone-asset-filter-v1-2026-10-01` ;
- branche : `work/lab-skill-save-zone-asset-filter-v1-2026-10-01`.

### Retour smartphone utilisateur

Deux régressions bloquent la validation de la capacité Ultime créée dans l'éditeur :
1. après « Enregistrer comme nouvelle » ou « Mettre à jour », le test Combat refuse encore le lancement avec le message indiquant que la capacité est modifiée et doit être enregistrée ;
2. le sélecteur « Visuel persistant de zone » propose des assets de créatures en plus des FX/sprites de compétence.

### Objectif

1. Reproduire le vrai chemin `édition capacité -> enregistrement -> validation/test combat` et supprimer le faux état dirty après un enregistrement réussi.
2. Conserver **une seule autorité** : `configuredSkills` contient les capacités enregistrées ; l'état « modifié » est dérivé par comparaison du brouillon courant avec cette autorité, sans booléen parallèle à maintenir.
3. Filtrer le sélecteur de visuel persistant pour qu'il n'accepte jamais les assets de catégorie `creature` / portraits de créatures.
4. Conserver les sprites/FX de compétence compatibles avec l'éditeur, sans logique fondée sur un nom d'asset.
5. Audit adjacent découvert avant codage : les libellés spécifiques de la zone affichent encore `Dégâts par tick` et `Canal / élément` malgré la PREVALIDATION précédente. Le test antérieur était insuffisamment ciblé car il trouvait les mêmes mots ailleurs dans le fichier. Le RED de ce lot doit vérifier **le bloc persistent_zone exact** avant correction.

### Propriétaires concernés

- Human Editor : état dirty et cycle d'enregistrement ;
- Asset Catalog / Human Editor : filtrage sémantique des rôles d'assets ;
- Preview Session : protégée sauf preuve TDD que la faute lui appartient.

### Protégé

- Combat State / persistent-zone-runtime ;
- dégâts, résistances, boucliers, KO ;
- progression et contrat 4+1 Ultime ;
- Skill Presentation et renderer persistent-zone déjà GREEN technique, sauf preuve directe ;
- Projectile Clash, trajectoires, profils de mouvement ;
- `main` ;
- dépôt `Zombicide-40k`.

### TDD

1. RED du vrai cycle save -> validate/test : un brouillon identique à l'entrée enregistrée dans `configuredSkills` doit être considéré propre immédiatement ;
2. RED d'architecture : aucun `skillDirty` mutable ne doit rester comme seconde autorité parallèle ;
3. RED catalogue : le rôle `zone` exclut les créatures même si leur `assetType` est `sprite` ou `fx` ;
4. RED UI ciblé : le bloc `persistent_zone` doit afficher `Dégâts à chaque intervalle` et `Élément des dégâts` ;
5. démontrer la cause au propriétaire ;
6. correction minimale/soustractive ;
7. tests ciblés + CI complète ;
8. documentation ;
9. checkpoint + preview ;
10. PREVALIDATION smartphone obligatoire avant GREEN utilisateur.

État : **LOT OUVERT — RED obligatoire avant correction fonctionnelle**.


### Résultat technique — Skill Save/Test Dirty State & Persistent Zone Asset Filter V1

RED :
- test : `tests/unit/skill-save-zone-asset-filter-v1.test.mjs` ;
- commit RED initial : `0aba7d92dc6f609a9f781a0c9bc9de328858167d` ;
- RED renforcé : `cc0787378ee4946becaec00de3aef65f98dd0a7a` ;
- CI RED : `36870282399`, `36871641321`, `36872304323` — FAILURE attendue ;
- cause visible : les propriétaires attendus `captureSkillDraftHasUnsavedChangesV1` / `captureEditorAssetMatchesRoleV1` n’existaient pas encore et l’ancien Human Editor conservait `skillDirty`.

Cause démontrée :
1. `configuredSkills` contenait déjà la capacité enregistrée mais un booléen mutable `skillDirty`, mis à jour par de multiples listeners UI, constituait une seconde autorité susceptible de rester/stagner à `true` après le vrai enregistrement ;
2. le rôle `zone` acceptait tout asset image `sprite/fx`, donc aussi les sprites de catégorie/tag `creature` ;
3. le test de libellé précédent n’était pas borné au bloc `persistent_zone`, ce qui permettait un faux GREEN grâce aux mêmes mots présents dans d’autres effets.

Correction propriétaire :
- commit fonctionnel : `b5853c4abc4477d59c1eab2f3e5fdf7c2225be04` ;
- suppression complète de `skillDirty` et des listeners qui ne servaient qu’à le maintenir ;
- `configuredSkills` reste l’unique autorité ; `captureSkillDraftHasUnsavedChangesV1()` dérive l’état courant par comparaison du brouillon normalisé ;
- les gardes validation/test, export, import et hydratation utilisent cette dérivation ;
- aucune logique ajoutée dans la preview, aucun second listener, aucun observer, aucun timer, aucun fallback ;
- `captureEditorAssetMatchesRoleV1()` exclut catégorie `creature`, portraits et tag `creature` du rôle `zone` sans filtrage par nom ;
- libellés du bloc zone réellement corrigés vers `Dégâts à chaque intervalle` et `Élément des dégâts`.

Validation fonctionnelle :
- CI : `36873004711` — SUCCESS ;
- suite complète : **773/773 PASS, 0 FAIL** ;
- tests spécifiques GREEN : capacité Ultime enregistrée immédiatement propre, modification réelle détectée, absence de `skillDirty`, exclusion des créatures du sélecteur zone, conservation des sprites/FX de compétence, vérification ciblée des libellés du bloc `persistent_zone`.

État : **GREEN technique fonctionnel — documentation/checkpoint/preview à finaliser puis PREVALIDATION smartphone obligatoire**.


### Publication de PREVALIDATION — Skill Save/Test & Zone Asset Filter V1

Noms réservés :
- checkpoint GREEN technique : `checkpoint/lab-skill-save-zone-asset-filter-v1-green-2026-10-01` ;
- preview smartphone : `preview/lab-skill-save-zone-asset-filter-v1-2026-10-01`.

Les deux références doivent pointer sur le même HEAD documenté que la branche work.

La validation smartphone doit vérifier au minimum :
1. créer une capacité Ultime ;
2. l’enregistrer ;
3. lancer immédiatement « Tester en combat » sans faux message « capacité modifiée » ;
4. modifier ensuite réellement un champ et vérifier que le blocage revient tant que cette modification n’est pas enregistrée ;
5. ouvrir « Visuel persistant de zone » et vérifier qu’aucune créature / vue player / opponent / portrait n’est proposée ;
6. vérifier les libellés `Dégâts à chaque intervalle` et `Élément des dégâts`.

Aucun merge vers `main`.


## Micro-lot — Combat 5-Slot Row & Persistent Zone Animated Loop V1 — 2026-10-01

Base exacte : `7d0148855ea5597d2d4712ac1674e480fba829d0` (Skill Save/Test Dirty State & Persistent Zone Asset Filter V1 — GREEN technique / PREVALIDATION smartphone).

- checkpoint de départ : `checkpoint/lab-start-combat-5slot-zone-loop-v1-2026-10-01` ;
- branche : `work/lab-combat-5slot-zone-loop-v1-2026-10-01`.

### Retour smartphone utilisateur

1. La cinquième capacité (Ultime) passe à la ligne suivante dans le HUD combat et crée un bloc inutilement haut.
2. Après activation/réactivation d'une zone persistante, le visuel de flamme paraît figé sur une seule image/étape ; l'utilisateur veut un sprite animé qui reste actif pendant toute la durée de la zone.
3. Vérification demandée : confirmer que les dégâts et le rayon renforcé restent pilotés par le gameplay réel lors des réactivations.
4. L'export de la capacité Ultime a été conservé par l'utilisateur pour un futur raccord, mais aucun fichier d'export n'est joint à ce tour ; ce lot ne doit donc pas inventer sa donnée.

### Objectif

1. Afficher les 5 capacités du loadout Capture (4 standards + 1 Ultime) sur **une seule ligne** dans le HUD combat mobile, avec des cases légèrement plus compactes.
2. Conserver le contrat de loadout existant ; aucune logique de compétence ne doit dépendre du CSS.
3. Vérifier par TDD le vrai chemin de renforcement `persistent_zone` : activation 1 -> rayon initial, activation 2/3 -> rayon renforcé jusqu'au maximum configuré ; dégâts toujours appliqués par le runtime propriétaire.
4. Corriger la présentation persistante afin que les assets multi-frame/atlas puissent boucler pendant toute la vie de la zone.
5. Réutiliser `SkillPresentationBinding.visual.aura`, `CombatState.persistentZones` et le renderer existants : aucun second système de zone, aucune seconde horloge.

### Propriétaires concernés

- HUD combat / CSS : disposition des 5 boutons uniquement ;
- `persistent-zone-runtime-v1.js` : autorité gameplay à tester, modification interdite sauf RED prouvant une faute ;
- `dom-skill-fx.js` : lecture/animation du visuel persistant ;
- Asset/Presentation adapters existants uniquement si le RED démontre un défaut de résolution.

### Protégé

- `configuredSkills` et le cycle save/test GREEN précédent ;
- progression 4 + 1 Ultime ;
- Combat State comme seule autorité de zone ;
- dégâts/résistances/boucliers/KO ;
- Projectile Clash et trajectoires ;
- profils de mouvement ;
- aucun `setInterval` / `Date.now` / observer ajouté pour la zone ;
- `main` ;
- dépôt `Zombicide-40k`.

### TDD

1. RED HUD : la grille combat doit posséder 5 colonnes et conserver une seule rangée pour 5 compétences.
2. Test gameplay : réactivations de zone renforcent réellement `radius` et conservent le tick damage via le runtime existant.
3. RED FX : un visuel de zone sur atlas/multi-frame avec `playbackMode:"loop"` doit réellement boucler, pas jouer une fois puis se figer.
4. correction minimale au propriétaire ;
5. tests ciblés + CI complète ;
6. documentation ;
7. checkpoint + preview ;
8. PREVALIDATION smartphone utilisateur avant GREEN utilisateur.

État : **LOT OUVERT — audit terminé, RED obligatoire avant correction fonctionnelle**.


### Résultat technique — Combat 5-Slot Row & Persistent Zone Animated Loop V1

RED :
- test : `tests/unit/combat-5slot-zone-loop-v1.test.mjs` ;
- commit : `da9f9a1b5063d09e1470ba11d61e974f408968ae` ;
- CI : `36879826275` — FAILURE attendue ;
- échecs attendus : HUD encore à 4 colonnes et atlas persistant joué une seule fois.

Constat gameplay :
- le test réel `CombatSession` est GREEN dès le RED initial ;
- activation 1 = `short`, activation 2 = `medium`, activation 3 = `long` ;
- à distance `long`, le tick de dégâts configuré reste appliqué après le troisième renforcement ;
- le même nœud visuel de zone reçoit bien un nouveau scale lorsque `zone.radius` change ;
- donc aucune modification de `persistent-zone-runtime-v1.js` n'était justifiée.

Correction propriétaire :
- `7b32e46136fe42354b06ff0dcb0819ca498f112b` : grille HUD à 5 colonnes + cases de capacité légèrement moins hautes ;
- `8f5d01315cb1c2bb50cc7ca0b6fd73b42647b976` : `dom-skill-fx.js` respecte `playbackMode:"loop"` pour les atlas `url + frameCount` ;
- `0154a95aa38a10c9d9deea72b2c50a7296116b76` : aide Human Editor précisant sprite multi-image/atlas en boucle et image statique statique ;
- `cb87d359707336f028d03944259f966eb342538b` : sentinelles UI historiques alignées avec le nouveau contrat à cinq colonnes.

Contraintes respectées :
- aucune seconde autorité pour la zone ;
- aucune modification du runtime gameplay de zone ;
- aucun timer/observer/listener compensatoire ajouté ;
- aucun comportement fondé sur le nom d'une capacité ou d'une créature ;
- aucun merge vers `main`.

Validation :
- CI fonctionnelle : `36880164462` — SUCCESS ;
- suite complète : **777/777 PASS, 0 FAIL** ;
- tests ciblés GREEN : 5 capacités sur une ligne, renforcement gameplay + dégâts, boucle atlas persistante, scale visuel mis à jour sur le même nœud.

État : **GREEN technique fonctionnel — publication checkpoint/preview à finaliser puis PREVALIDATION smartphone utilisateur**.

### Publication de PREVALIDATION — Combat 5-Slot & Zone Loop V1

Noms réservés :
- checkpoint GREEN technique : `checkpoint/lab-combat-5slot-zone-loop-v1-green-2026-10-01` ;
- preview smartphone : `preview/lab-combat-5slot-zone-loop-v1-2026-10-01`.

La validation smartphone doit vérifier :
1. 5 capacités visibles sur une seule ligne ;
2. la zone persistante reste visible pendant sa durée ;
3. un asset atlas/multi-frame sélectionné comme visuel de zone reste animé en boucle ;
4. les réactivations renforcent visuellement la zone sans recréer un deuxième système ;
5. la zone disparaît à expiration.

Aucun merge vers `main`.


## Micro-lot — Persistent Zone Reinforcement Visual Sync V1 — 2026-10-01

Base exacte : `fdbec5304e670cd996244fdb0a1fe44d151373de` (Combat 5-Slot Row & Persistent Zone Animated Loop V1 — GREEN technique / PREVALIDATION smartphone).

- checkpoint de départ : `checkpoint/lab-start-zone-reinforcement-visual-sync-v1-2026-10-01` ;
- branche : `work/lab-zone-reinforcement-visual-sync-v1-2026-10-01`.

### Retour smartphone utilisateur

Le gameplay de zone a déjà été vérifié Proche -> Moyen -> Loin, mais en combat réel le sprite persistant reste visuellement à son premier rayon malgré plusieurs réactivations.

### Cause d'architecture visée

Le renderer sait déjà mettre à jour le scale d'un nœud existant à partir de `zone.radius`.

En revanche, dans le chemin UI réel :
- `onState(state)` possède le rendu de l'état Combat ;
- `fx.syncPersistentZones(...)` est actuellement branché sur `onClock(state)` ;
- `CombatRuntime.stateSignal()` n'inclut pas `persistentZones`.

Cette séparation peut retarder ou manquer la projection d'un changement de zone lorsque la modification d'état pertinente n'est pas accompagnée d'un changement de fighter/distance. Elle crée surtout deux chemins de projection temporelle différents pour un même état.

### Objectif

1. Faire de `onState(state) -> renderState(state)` l'unique chemin de projection de `CombatState.persistentZones` vers le renderer.
2. Étendre le signal d'état du Runtime pour que toute modification de `persistentZones` soit émise par `onState` :
   - création ;
   - renforcement Proche/Moyen/Loin ;
   - expiration ;
   - progression de tick si l'état de zone change.
3. Retirer le raccord zone de `onClock` afin d'éviter une double autorité de synchronisation.
4. Conserver le même nœud DOM de zone et seulement mettre à jour son scale depuis le rayon autoritaire.

### Protégé

- `persistent-zone-runtime-v1.js` et ses règles de rayon/dégâts ;
- `SkillPresentationBinding.visual.aura` ;
- aucun timer supplémentaire ;
- aucun observer ;
- aucun listener compensatoire ;
- aucun marqueur parallèle de rayon ;
- aucun comportement par nom ;
- `main` ;
- dépôt `Zombicide-40k`.

### TDD

1. RED Runtime : un changement uniquement dans `persistentZones` doit déclencher `onState`.
2. RED UI : `renderState(state)` doit synchroniser la zone et `onClock` ne doit plus être propriétaire de ce raccord.
3. vérifier le vrai chemin renforcement -> `onState` -> même nœud -> nouveau scale ;
4. correction minimale aux propriétaires Runtime/UI ;
5. tests ciblés + CI complète ;
6. documentation ;
7. checkpoint + preview ;
8. PREVALIDATION smartphone obligatoire avant GREEN utilisateur.

État : **LOT OUVERT — RED obligatoire avant correction fonctionnelle**.


### Résultat technique — Persistent Zone Reinforcement Visual Sync V1

RED :
- test : `tests/unit/persistent-zone-visual-sync-v1.test.mjs` ;
- commit : `ba9c72173ab9460dd84ca0d0ed2d24abd78551bc` ;
- CI : `36882030135` — FAILURE attendue ;
- le Runtime n'émettait pas `onState` lorsqu'une modification ne concernait que `persistentZones` ;
- la UI synchronisait les zones depuis `onClock`, séparément du propriétaire général de rendu d'état.

Cause démontrée :
- `CombatRuntime.stateSignal()` ne contenait que `distance` et `fighters` ;
- le renderer savait déjà changer le scale du même nœud pour `short / medium / long` ;
- le défaut était donc le raccord de propagation de l'état, pas le calcul du rayon ni le renderer de scale.

Correction propriétaire :
- `34122f7524febebf639cfde2441f652d911b5016` : ajout de `persistentZones` au signal observable du Runtime ;
- `7c3de04b47d63fc631cbc2481a940ff654f9af1f` : `renderState(state)` devient l'unique projection UI des zones persistantes ; suppression du raccord zone dans `onClock` ;
- `15a3e15fbf173b0f3659c94839bea3c51ffab2a7` et `5c735f26955b0a6c9fcc50101b8781126876aff9` : sentinelles adaptées au chemin propriétaire et à son format source.

Validation :
- CI fonctionnelle : `36882296638` — SUCCESS ;
- suite complète : **779/779 PASS, 0 FAIL** ;
- test Runtime : renforcement de rayon et disparition de zone déclenchent bien `onState` même sans changement fighter/distance ;
- test UI : la synchronisation zone appartient uniquement à `renderState/onState`, pas à `onClock`.

Contraintes respectées :
- aucune modification des règles `persistent-zone-runtime-v1.js` ;
- aucun état parallèle de rayon ;
- aucun timer supplémentaire ;
- aucun observer/listener compensatoire ;
- aucun merge vers `main`.

État : **GREEN technique fonctionnel — publication checkpoint/preview puis PREVALIDATION smartphone obligatoire**.

### Publication de PREVALIDATION — Persistent Zone Reinforcement Visual Sync V1

Noms réservés :
- checkpoint GREEN technique : `checkpoint/lab-zone-reinforcement-visual-sync-v1-green-2026-10-01` ;
- preview smartphone : `preview/lab-zone-reinforcement-visual-sync-v1-2026-10-01`.

La validation smartphone doit vérifier :
1. activation 1 : visuel au rayon Proche ;
2. activation 2 : le même visuel grandit vers Moyen ;
3. activation 3 : le même visuel grandit vers Loin ;
4. aucune duplication de zone ;
5. disparition correcte à expiration.

Aucun merge vers `main`.


## Micro-lot — Fire Zone Animated Sprite V1 — 2026-10-01

Base code exacte : `037288b0a29060e498cae948a30ee7a8e8dfc19e` (Persistent Zone Reinforcement Visual Sync V1 — GREEN technique / PREVALIDATION smartphone).

Base bibliothèque visuelle exacte : `global-assets@ec938dfd8aab08ca43dd87e75e002f5852813cef`.

- checkpoint code de départ : `checkpoint/lab-start-fire-zone-sprite-v1-2026-10-01` ;
- branche code : `work/lab-fire-zone-sprite-v1-2026-10-01` ;
- checkpoint assets : `checkpoint/global-assets-before-fire-zone-loop-01-2026-10-01` ;
- branche assets : `work/global-assets-fire-zone-loop-01-2026-10-01`.

### Demande utilisateur

Découper le sprite sheet de zone de feu généré précédemment, nommer les frames proprement, le ranger dans la bibliothèque Capture / sprites et le rendre réellement sélectionnable et utilisable comme visuel persistant de zone dans le jeu de test.

### Source visuelle

Source retenue : le **premier sprite sheet 8 frames** généré à la demande « il faudrait ce style de sprite… animé », avant la régénération accidentelle ultérieure.

Découpe :
- grille 4 × 2 ;
- 8 frames RGBA transparentes ;
- taille normalisée : 444 × 444 px ;
- ordre de lecture : gauche -> droite, ligne haute puis ligne basse.

### Identité canonique

- assetId : `pack:capture:sprite-fire-zone-loop-01` ;
- label : `Zone de feu animée` ;
- dossier : `assets/library/capture/sprites/skills/fire_zone_loop/` ;
- frames :
  - `frames/sprite_skill_fire_zone_loop_01_01.png`
  - …
  - `frames/sprite_skill_fire_zone_loop_01_08.png`
- manifest : `sprite_skill_fire_zone_loop_01_sequence.json` ;
- playback : boucle ;
- frameMs cible : 80 ms.

### Objectif

1. Déposer les 8 frames + manifest dans la bibliothèque Capture dédiée aux sprites.
2. Ajouter une entrée catalogue stable pour que le sprite apparaisse dans le sélecteur de visuel persistant.
3. Réutiliser le propriétaire de présentation existant `demoPresentationAssets` / `SkillPresentationBinding.visual.aura` pour résoudre la séquence multi-frame.
4. Aucun comportement gameplay ne dépend de cet assetId.
5. Aucune nouvelle autorité, aucun timer, aucun observer, aucun chemin vers `Zombicide-40k`.

### TDD

1. RED : l'asset `pack:capture:sprite-fire-zone-loop-01` n'existe pas encore dans le resolver de présentation du labo.
2. Intégration minimale par le propriétaire de présentation existant.
3. Vérifier 8 frames, ordre, `frameMs`, `playbackMode:"loop"`.
4. Vérifier catalogue / filtrage rôle `zone`.
5. CI complète.
6. Publication de la branche `global-assets` uniquement après validation structurelle et CI du raccord code.
7. Preview smartphone pour sélection et test réel.

État : **LOT OUVERT — découpe locale effectuée, RED/raccord GitHub à réaliser**.


### Résultat technique — Fire Zone Animated Sprite V1

RED :
- test : `tests/unit/fire-zone-animated-sprite-v1.test.mjs` ;
- commit RED initial : `745c2ef82aea19a5be57ab220e7f6f709961a1ad` ;
- CI RED : `36891541678` — FAILURE attendue : asset absent du resolver.

Découpe / optimisation :
- source : sprite sheet 4 × 2 généré et validé visuellement dans ce fil ;
- 8 frames extraites dans l'ordre de lecture ;
- version runtime optimisée : WebP transparent 224 × 224 ;
- noms : `sprite_skill_fire_zone_loop_01_01.webp` -> `..._08.webp`.

Bibliothèque assets :
- branche de travail : `work/global-assets-fire-zone-loop-01-2026-10-01` ;
- commit frames + manifest : `b50c5404fcee5e6bc581d54af407107003d478ad` ;
- commit catalogue : `e59169f21877294f79ca579d4e3b9a241043d780` ;
- assetId : `pack:capture:sprite-fire-zone-loop-01` ;
- label éditeur : `Zone de feu animée` ;
- manifest vérifié : 8 frames, `frame_ms:80`, `loop:true` ;
- catalogue : 88 assets / 41 sprites ;
- checkpoint assets : `checkpoint/global-assets-fire-zone-loop-01-green-2026-10-01` ;
- `global-assets` publié en fast-forward vers `e59169f21877294f79ca579d4e3b9a241043d780`, sans force.

Raccord code :
- `c0ed31db5b163abcadec8ebe0c2583da896b70c2` : resolver existant `captureSequenceAsset` étendu avec `playbackMode` et ajout du nouvel asset ;
- `027e34d6cdea36fcd8c67b4e2a1d49e1cfb85b91` : révision globale visuelle `2026-10-01-v6-fire-zone-loop` + cache-bust du catalogue ;
- `c150043eac65fc0715f291084c35f4671edf256e` / `0d6de46e919f920429b76d01e6a25a2c0ea5495c` : correction des sentinelles de test, sans modification fonctionnelle.

Validation :
- les 8 blobs sont présents et lisibles sur la branche assets publiée ;
- l'entrée catalogue est compatible `combat / capture / editor` et classée `category:"skill"`, donc sélectionnable par le rôle `zone` sans réintroduire les créatures ;
- le resolver retourne bien 8 URLs de frames, `frameMs:80`, `playbackMode:"loop"` ;
- CI fonctionnelle : `36895289008` — SUCCESS ;
- suite complète : **780/780 PASS, 0 FAIL** ;
- aucun changement du gameplay de zone ;
- aucune seconde autorité, aucun timer, observer, listener compensatoire ou logique par nom ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

État : **GREEN technique — publication checkpoint/preview code à finaliser puis validation smartphone utilisateur**.

### Publication de PREVALIDATION — Fire Zone Animated Sprite V1

Noms réservés :
- checkpoint code : `checkpoint/lab-fire-zone-sprite-v1-green-2026-10-01` ;
- preview : `preview/lab-fire-zone-sprite-v1-2026-10-01`.

La validation smartphone doit vérifier :
1. `Zone de feu animée` apparaît dans le sélecteur de visuel persistant de zone ;
2. la sélection est conservée après sauvegarde de la capacité ;
3. le combat affiche la boucle animée ;
4. le même visuel grandit avec Proche -> Moyen -> Loin ;
5. aucune créature n'apparaît dans ce sélecteur.

Aucun merge vers `main`.


### Publication effective — Fire Zone Animated Sprite V1

Avant scellement documentaire final :
- code work/checkpoint/preview : `4b6ee257a48047a63a18f336069078847c62d668` ;
- CI checkpoint : `36895614034` — SUCCESS ;
- CI preview : `36895617059` — SUCCESS ;
- `global-assets` : `e59169f21877294f79ca579d4e3b9a241043d780` ;
- CI `global-assets` : `36895390406` — SUCCESS ;
- work ↔ checkpoint ↔ preview : identiques avant ce scellement documentaire.

Le présent commit ne modifie que la traçabilité du lot. Après ce commit, les refs checkpoint/preview sont avancées en fast-forward vers le même HEAD documentaire puis revérifiées.

Statut : **GREEN technique publié — PREVALIDATION smartphone utilisateur en attente**.


## Micro-lot — Persistent Zone Visual UX V2 — 2026-10-01

Base code exacte : `6ffaf1fa01d9336922651ca7808ac7c8f7d3d12a`.
Base bibliothèque visuelle exacte : `global-assets@e59169f21877294f79ca579d4e3b9a241043d780`.

- checkpoint code : `checkpoint/lab-start-zone-visual-ux-v2-2026-10-01` ;
- work code : `work/lab-zone-visual-ux-v2-2026-10-01` ;
- checkpoint assets : `checkpoint/global-assets-before-fire-zone-atlas-v2-2026-10-01` ;
- work assets : `work/global-assets-fire-zone-atlas-v2-2026-10-01`.

### Retour smartphone utilisateur

1. Le visuel `Zone de feu animée` apparaît comme une image fixe malgré 8 frames.
2. Le scale de zone est trop petit et ne permet pas de régler largeur/hauteur séparément.
3. Le choix `Rafraîchir la durée` est ambigu/inutile côté Human Editor car toute réactivation renouvelle déjà la durée.
4. `Renforcer la zone` doit être renommé `Agrandir la zone`.

### Cause visuelle visée

Le visuel de zone est actuellement résolu comme une liste de 8 URL et animé par changement de `backgroundImage` via Web Animations API.
Sur Chrome mobile, l'interpolation/changement de ressources `background-image` n'est pas un mécanisme d'animation fiable et peut rester sur la première frame.

L'audit confirme que le défaut vient du changement animé de `backgroundImage` entre plusieurs URL via Web Animations API, non fiable sur Chrome mobile. Le correctif retenu reste dans le renderer existant : pour une séquence `frames[]` en boucle, empiler les frames dans le même nœud FX et les faire alterner par animation CSS d'opacité, sans timer JavaScript et sans nouvelle autorité.

### Objectif

1. Conserver les 8 frames existantes comme séquence canonique, sans régénération artistique.
2. Pour `playbackMode:"loop"`, remplacer l'animation de `backgroundImage` par une alternance CSS de 8 calques image dans le même nœud FX :
   - aucune horloge JS ;
   - aucun changement de source par timer ;
   - boucle pilotée par CSS ;
   - suppression avec le nœud de zone autoritaire.
3. Conserver le manifest et l'assetId existants.
4. Ajouter pour la zone persistante :
   - scale horizontal ;
   - scale vertical ;
   - plage plus large ;
   - conservation d'un scale global existant pour rétrocompatibilité.
5. Simplifier le wording Human Editor :
   - `refresh` affiché comme `Garder la même taille` ;
   - `reinforce` affiché comme `Agrandir la zone` ;
   - aide explicite : toute réactivation renouvelle déjà la durée.
6. Aucun changement aux règles gameplay de rayon/durée.

### Propriétaires

- bibliothèque `global-assets` : atlas + métadonnées ;
- `demoPresentationAssets` : résolution asset ;
- `SkillPresentationBinding` : paramètres visuels normalisés ;
- Human Editor : champs et wording uniquement ;
- DOM Skill FX : projection scale X/Y uniquement.

### Protégé

- `persistent-zone-runtime-v1.js` ;
- calculs de dégâts/ticks/réactivations ;
- `CombatState.persistentZones` ;
- aucune seconde horloge ;
- aucun timer/observer/listener compensatoire ;
- aucun comportement fondé sur un nom ;
- `main` ;
- dépôt `Zombicide-40k`.

### TDD

1. RED animation mobile : une séquence `frames[]` en boucle doit créer des calques frame dédiés et ne doit pas dépendre d'une animation WAAPI de `backgroundImage`.
2. RED contrat : scale X/Y de zone doivent survivre normalisation/export/rechargement.
3. RED renderer : rayon × scale global × scaleX/scaleY doit produire un transform bi-axe.
4. RED Human Editor : labels `Garder la même taille` / `Agrandir la zone`, durée expliquée sans option trompeuse.
5. correction minimale ;
6. CI complète ;
7. publication assets puis preview smartphone.

État : **LOT OUVERT — RED obligatoire avant correction**.


### Résultat technique — Persistent Zone Visual UX V2

RED :
- `tests/unit/persistent-zone-visual-ux-v2.test.mjs` ;
- RED initial : `41dc8c73c3f921c27bb8350b00d7afce5aea9b18` ;
- RED affiné mobile : `8a057c4e6d0d2c876e3d3f584139f618db1e7749` ;
- CI RED : `36901189449` — FAILURE attendue.

Cause confirmée :
- les 8 frames existent réellement et sont différentes ;
- le défaut venait du changement animé de `backgroundImage` entre URL par WAAPI, non fiable en pratique sur Chrome mobile ;
- aucune régénération d'asset ni modification gameplay n'était nécessaire.

Corrections :
- `05ed8ae58f3edaf1404cc111547aaf0074dffff9` / `d84801345faf75f5bae6a2cd006f23d09435475a` : contrat de présentation étendu avec scales X/Y sans casser la forme historique ;
- `e228b24d1b0a0035f9b4e70931293a6cb017f2af` : Human Editor scale jusqu'à 8, scale X/Y, wording `Garder la même taille` / `Agrandir la zone` ;
- `cbb6a4222de84f9fbb5b1d99b229adc8b7ff89d5` : contrôles largeur/hauteur dans l'éditeur ;
- `1467e10f0f492c32bb41cb76297fff3e54a38be6` / `1f0d7c563675982a642542a189b059395f080abe` : boucle multi-frame mobile-safe par calques d'opacité et scale bi-axe ;
- `39e449dfba598b4450b0f4f6738b78996bfc630e` : style des calques de frame ;
- `b1459ebfda6b11752fd0352e8e53e3f2f3f72817` : adaptateur de présentation transporte scale X/Y ;
- `06057beb5a8e6250d62a3c3b5a32cd1caa8cc79a` : tests alignés sur le vrai chemin propriétaire.

Validation :
- CI : `36901845266` — SUCCESS ;
- suite complète : **786 tests / 786 PASS / 0 FAIL** ;
- aucun changement de `persistent-zone-runtime-v1.js` ;
- aucun timer/observer/listener compensatoire ;
- aucune nouvelle autorité ;
- aucune mutation supplémentaire de `global-assets` nécessaire : les 8 frames canoniques déjà publiées restent utilisées.

État : **GREEN technique — checkpoint/preview à publier, PREVALIDATION smartphone requise**.

### Publication de PREVALIDATION — Persistent Zone Visual UX V2

Noms :
- checkpoint : `checkpoint/lab-zone-visual-ux-v2-green-2026-10-01` ;
- preview : `preview/lab-zone-visual-ux-v2-2026-10-01`.

Validation smartphone attendue :
1. les flammes changent réellement de frame en boucle ;
2. largeur et hauteur sont réglables séparément ;
3. scale global peut dépasser 4 jusqu'à 8 ;
4. wording `Garder la même taille` / `Agrandir la zone` ;
5. Proche/Moyen/Loin reste gouverné par le gameplay existant.

Aucun merge vers `main`.


## Micro-lot — Fire Zone Sprite V2 Replacement — 2026-10-01

Base code exacte : `50de483fd5dedd72e0d7ecabb498ee7496794040` (Persistent Zone Visual UX V2 — GREEN technique / PREVALIDATION smartphone).

Base assets exacte : `global-assets@e59169f21877294f79ca579d4e3b9a241043d780`.

- checkpoint code : `checkpoint/lab-start-fire-zone-sprite-v2-replacement-2026-10-01` ;
- work code : `work/lab-fire-zone-sprite-v2-replacement-2026-10-01` ;
- checkpoint assets : `checkpoint/global-assets-before-fire-zone-v2-replacement-2026-10-01` ;
- work assets : `work/global-assets-fire-zone-v2-replacement-2026-10-01`.

### Retour utilisateur

Le sprite actuel fonctionne techniquement mais reste trop peu fluide et trop vu du dessus. L'utilisateur valide le principe mais demande :
- davantage de frames ;
- une vue plus inclinée / plus oblique ;
- remplacement de l'ancien sprite par le nouveau sans changer l'asset sélectionné dans les capacités existantes.

### Source visuelle validée

Sprite sheet généré dans ce chat :
- grille 4 × 4 ;
- 16 frames ;
- zone de feu au sol avec perspective plus oblique ;
- fond transparent ;
- source locale : `sprite_sheet_d_arène_de_feu_magique.png`.

### Règle de compatibilité

L'identifiant stable **reste inchangé** :
`pack:capture:sprite-fire-zone-loop-01`.

Ainsi les capacités déjà sauvegardées continuent de référencer le même asset sans migration ni duplication.

### Objectif

1. Découper les 16 frames dans l'ordre gauche -> droite, haut -> bas.
2. Remplacer les anciennes 8 frames de la bibliothèque par 16 nouvelles frames.
3. Mettre à jour le manifest existant :
   - 16 frames ;
   - boucle ;
   - même assetId logique ;
   - même cadence de base, sauf nécessité démontrée.
4. Mettre à jour le resolver de présentation existant de 8 à 16 frames.
5. Conserver le chemin mobile-safe à calques CSS déjà GREEN.
6. Ne créer ni nouvel assetId, ni seconde entrée parallèle, ni fallback cachant une erreur.

### Propriétaires

- `global-assets` : frames et manifest ;
- catalogue global : identité stable inchangée, métadonnées seulement si nécessaire ;
- `demoPresentationAssets` : nombre de frames du resolver ;
- renderer : protégé sauf RED démontrant un besoin.

### Protégé

- gameplay `persistent_zone` ;
- `CombatState.persistentZones` ;
- scale X/Y ;
- réactivation Proche/Moyen/Loin ;
- aucun timer/observer/listener compensatoire ;
- aucun comportement fondé sur un nom ;
- `main` ;
- dépôt `Zombicide-40k`.

### TDD

1. RED : l'asset canonique doit résoudre 16 frames au lieu de 8.
2. Vérifier première et dernière frame attendues.
3. Remplacer les binaires et manifest sur la branche assets dédiée.
4. Corriger uniquement le resolver existant.
5. CI complète.
6. Publier `global-assets` puis checkpoint/preview code.
7. Validation smartphone obligatoire avant GREEN utilisateur.

État : **LOT OUVERT — RED obligatoire avant remplacement**.


### Résultat technique — Fire Zone Sprite V2 Replacement

RED / évolution :
- le lot est parti du GREEN `50de483fd5dedd72e0d7ecabb498ee7496794040` ;
- les tests ont d'abord exigé 16 frames au lieu de 8 ;
- le resolver a ensuite été resserré vers **un seul atlas canonique** plutôt que 16 URL séparées : même image source, mais moins de requêtes et aucune duplication d'asset runtime.

Asset canonique final :
- assetId inchangé : `pack:capture:sprite-fire-zone-loop-01` ;
- 16 poses issues de la grille 4 × 4 validée ;
- vue plus inclinée ;
- atlas horizontal WebP : `assets/library/capture/sprites/skills/fire_zone_loop/atlases/sprite_skill_fire_zone_loop_01_atlas.webp` ;
- frame runtime : 96 × 96 ;
- `frame_count: 16` ;
- `frame_ms: 80` ;
- `loop: true` ;
- anciennes 8 frames individuelles supprimées ;
- catalogue : `resource.format = "sprite-atlas"`.

Publication assets :
- work assets : `d73ad04dbc6c3f8de492b9a503653c4c6f2e753c` ;
- CI work assets : `36912132079` — SUCCESS ;
- `global-assets` avancé en fast-forward sur le même SHA ;
- atlas réellement relu sur `global-assets`, blob `db00395681a75c89a7416dd9da25127d3803c5c1`.

Code :
- resolver `demoPresentationAssets` : `url + frameCount:16 + frameMs:80 + playbackMode:"loop"` ;
- cache revision : `2026-10-01-v7-fire-zone-v2` ;
- sentinelle des arènes alignée sur cette révision ;
- aucun changement du gameplay de zone ni du renderer de rayon.

Validation code avant scellement documentaire :
- SHA : `fd4ca0aeed158e84ac76b45b6c85755ac9300e9b` ;
- CI : `36911651701` — SUCCESS.

Contraintes respectées :
- une seule identité d'asset ;
- une seule ressource runtime canonique ;
- aucune migration des capacités sauvegardées ;
- aucun timer/observer/listener compensatoire ;
- aucune modification de `persistent-zone-runtime-v1.js` ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

État : **GREEN technique fonctionnel — scellement documentaire, checkpoint et preview à publier puis PREVALIDATION smartphone**.


### Publication de PREVALIDATION — Fire Zone Sprite V2 Replacement

Validation complète avant publication :
- work code : `f4a15992946a24771ab0be48e6eec175030388ac` ;
- CI code : `36912326585` — SUCCESS ;
- suite complète : **787/787 PASS, 0 FAIL** ;
- `global-assets` : `d73ad04dbc6c3f8de492b9a503653c4c6f2e753c` ;
- CI `global-assets` : `36912197861` — SUCCESS ;
- manifest et atlas relus réellement depuis `global-assets`.

Noms de publication :
- checkpoint GREEN technique : `checkpoint/lab-fire-zone-sprite-v2-replacement-green-2026-10-01` ;
- preview smartphone : `preview/lab-fire-zone-sprite-v2-replacement-2026-10-01`.

La PREVALIDATION smartphone doit vérifier :
1. le sprite est bien le nouveau visuel plus incliné ;
2. le mouvement utilise réellement 16 frames ;
3. la boucle reste fluide pendant toute la durée de la zone ;
4. largeur / hauteur / scale global restent fonctionnels ;
5. le visuel continue de grandir avec Proche -> Moyen -> Loin ;
6. aucune ancienne frame de zone ne réapparaît depuis le cache.

Aucun merge vers `main`.

Statut : **GREEN technique — publication checkpoint/preview après CI de ce scellement documentaire ; GREEN utilisateur en attente**.


### Publication effective — Fire Zone Sprite V2 Replacement

Avant ce scellement documentaire final :
- work code : `fbb6e68553614ad60655473d8538ee59026111bf` ;
- CI work : `36912430059` — SUCCESS ;
- checkpoint : `checkpoint/lab-fire-zone-sprite-v2-replacement-green-2026-10-01` ;
- CI checkpoint : `36912483181` — SUCCESS ;
- preview : `preview/lab-fire-zone-sprite-v2-replacement-2026-10-01` ;
- CI preview : `36912486863` — SUCCESS ;
- suite complète : **787/787 PASS, 0 FAIL** ;
- `global-assets` : `d73ad04dbc6c3f8de492b9a503653c4c6f2e753c` ;
- CI `global-assets` : `36912197861` — SUCCESS.

Work / checkpoint / preview étaient identiques sur `fbb6e68553614ad60655473d8538ee59026111bf` avant ce commit documentaire.

Le présent commit ne modifie que la traçabilité. Après sa CI, checkpoint et preview sont avancés en fast-forward vers le même HEAD puis revérifiés.

Statut : **GREEN technique publié — PREVALIDATION smartphone utilisateur en attente ; aucun merge vers main**.


## Micro-lot — Persistent Zone Offset Controls V1 — 2026-10-01

Base exacte : `f4906c63740afa4483353e447a2b0f64d9c13fb0` (Fire Zone Sprite V2 Replacement — GREEN technique / PREVALIDATION smartphone).

- checkpoint départ : `checkpoint/lab-start-persistent-zone-offset-controls-v1-2026-10-01` ;
- branche work : `work/lab-persistent-zone-offset-controls-v1-2026-10-01`.

### Retour smartphone utilisateur

Le nouveau sprite de zone est meilleur, mais son ancrage visuel ne peut pas être centré précisément avec le seul scale global + largeur + hauteur.

### Cause d'UX

Le contrat `SkillPresentationBinding` possède déjà `offsetX` et `offsetY`, mais le Human Editor force actuellement ces valeurs à 0 pour la zone persistante et le renderer de zone ne les applique pas.

### Objectif

1. Réutiliser les champs propriétaires existants `offsetX` / `offsetY`.
2. Ajouter dans l'éditeur de capacité :
   - `Décalage horizontal de la zone (px)` ;
   - `Décalage vertical de la zone (px)`.
3. Plage simple : -300 à +300 px, pas 5 px, défaut 0.
4. Sauvegarder/recharger les valeurs dans la présentation de la capacité.
5. Appliquer ces offsets uniquement à la projection visuelle de la zone persistante :
   - position finale = ancre autoritaire de la créature + offset visuel ;
   - aucun impact sur le rayon gameplay ;
   - aucun impact sur collisions/dégâts.
6. Conserver scale global + scale X/Y + animation 16 frames existants.

### Propriétaires

- `SkillPresentationBinding` : champs offset existants, inchangés ;
- Human Editor : saisie / rechargement ;
- adaptateur présentation : transport existant des offsets ;
- `dom-skill-fx.js` : projection visuelle de la position.

### Protégé

- `persistent-zone-runtime-v1.js` ;
- `CombatState.persistentZones` ;
- dégâts / durée / rayon ;
- aucun nouvel état parallèle ;
- aucun timer / observer / listener compensatoire ;
- aucun comportement par nom de capacité ou asset ;
- `main` ;
- dépôt `Zombicide-40k`.

### TDD

1. RED : l'export Human Editor doit conserver `zoneOffsetX` / `zoneOffsetY` dans `visual.aura.offsetX/Y`.
2. RED : rechargement éditeur doit remettre ces valeurs dans les champs.
3. RED : renderer persistant doit appliquer l'offset aux coordonnées de l'ancre sans modifier le scale.
4. correction minimale aux propriétaires existants ;
5. tests ciblés + CI complète ;
6. documentation ;
7. checkpoint + preview ;
8. PREVALIDATION smartphone utilisateur obligatoire.

État : **LOT OUVERT — RED obligatoire avant correction**.


### Résultat technique — Persistent Zone Offset Controls V1

RED :
- test : `tests/unit/persistent-zone-offset-controls-v1.test.mjs` ;
- commit RED : `850dd3c9f268b962764927ebe714c7eabbcdf5db` ;
- CI RED : `36914781419` — FAILURE attendue ;
- 3 échecs démontrés : offsets non exportés, renderer ignorant les offsets, contrôles UI absents.

Cause confirmée :
- `SkillPresentationBinding` et l'adaptateur possédaient déjà `offsetX/Y` ;
- le Human Editor forçait ces champs à 0 pour les visuels ;
- le renderer de zone persistante plaçait toujours le nœud exactement au centre de l'ancre source.

Correction propriétaire :
- `82478d8f516d27ae4c52fedfbba604e751da1046` : Human Editor transporte `zoneOffsetX/Y` dans le slot visuel existant et initialise les champs à 0 ;
- `d1747c06792ef9cec1aa721f17e601ce88611d5b` : deux contrôles UI -300/+300 px et aide explicite ;
- `57d0026ca2a2a9b2937da1f8eda9579a030776a9` : le renderer applique l'offset à l'ancre autoritaire de la créature, sans toucher au scale ni au gameplay.

Validation :
- CI fonctionnelle : `36914957388` — SUCCESS ;
- suite complète : **790/790 PASS, 0 FAIL** ;
- test export offset X/Y : PASS ;
- test position renderer : PASS ;
- test contrôles UI : PASS.

Contraintes respectées :
- aucune modification de `persistent-zone-runtime-v1.js` ;
- aucun nouvel état métier ;
- aucun timer/observer/listener compensatoire ;
- aucun comportement par nom ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

État : **GREEN technique fonctionnel — documentation/checkpoint/preview à publier puis PREVALIDATION smartphone**.

### Publication de PREVALIDATION — Persistent Zone Offset Controls V1

Noms réservés :
- checkpoint : `checkpoint/lab-persistent-zone-offset-controls-v1-green-2026-10-01` ;
- preview : `preview/lab-persistent-zone-offset-controls-v1-2026-10-01`.

Validation smartphone attendue :
1. horizontal négatif déplace le sprite vers la gauche, positif vers la droite ;
2. vertical négatif monte le sprite, positif le descend ;
3. largeur / hauteur / scale global continuent de fonctionner ;
4. l'animation 16 frames reste fluide ;
5. Proche/Moyen/Loin, durée et dégâts restent inchangés.

Aucun merge vers `main`.


### VALIDATION UTILISATEUR — Persistent Zone Offset Controls V1 — 2026-10-01

Retour utilisateur après test smartphone : « Ok c’est bon ».

Cette validation confirme le comportement attendu du lot Persistent Zone Offset Controls V1 sur la preview publiée, sans inventer de validation supplémentaire au-delà du retour explicite reçu.

Statut : **GREEN utilisateur**.

Cette validation clôt le micro-lot. Aucun merge vers `main` n’est effectué automatiquement.


## Micro-lot — Skill Combat Usage Limit V1 — 2026-10-02

Base exacte : `55e3790496055929b37ad0294ab06f50db4cf658` (Persistent Zone Offset Controls V1 — GREEN utilisateur).

- checkpoint GREEN précédent : `checkpoint/lab-persistent-zone-offset-controls-v1-user-green-2026-10-02` ;
- checkpoint de départ : `checkpoint/lab-start-skill-combat-usage-limit-v1-2026-10-02` ;
- branche : `work/lab-skill-combat-usage-limit-v1-2026-10-02`.

### Retour utilisateur

Une capacité doit pouvoir être limitée à un nombre maximal d'utilisations sur un combat complet, notamment pour les capacités Ultime : 1, 2, 3, etc., tout en permettant le mode illimité.

### Audit propriétaire

- `SkillDefinition` possède déjà les paramètres de coût, timing et cooldown mais aucune limite d'utilisations par combat ;
- `CombatState.fighters[*]` possède déjà l'état runtime autoritaire des cooldowns mais aucun compteur d'utilisation de capacité ;
- `resolveSkillStart()` est le point où une activation valide consomme déjà l'énergie et engage le cooldown ;
- `resolveReaction()` engage séparément énergie/cooldown pour une capacité de réaction ;
- le Human Editor lit/écrit déjà le cooldown dans le draft puis l'export Transfer ; ajouter le champ à la définition canonique permet donc sa conservation JSON sans second format ;
- aucun propriétaire parallèle n'est nécessaire.

### Contrat cible

1. Ajouter `SkillDefinition.maxUsesPerCombat` :
   - `null` = illimité ;
   - entier strictement positif = limite par combat ;
   - champ absent = `null` pour rétrocompatibilité.
2. Ajouter au fighter runtime un compteur propriétaire `skillUseCounts` indexé par `skillId`.
3. Une activation acceptée par `resolveSkillStart()` consomme immédiatement une utilisation, au même moment que l'énergie/cooldown ; une activation rejetée n'en consomme aucune.
4. `resolveReaction()` respecte et consomme la même limite.
5. Lorsque la limite est atteinte, le moteur refuse avec `outcome: "usage_limit"` sans consommer énergie ni cooldown.
6. Human Editor : champ simple `Utilisations max par combat`, valeur 0 affichée/saisie = `Illimité`, toute valeur >=1 = limite explicite.
7. Export/import JSON conserve la valeur dans `definition.maxUsesPerCombat`.

### Protégé

- aucune logique spéciale fondée sur le slot Ultime : la règle reste utilisable sur toute capacité ;
- aucun timer/observer/listener compensatoire ;
- aucun compteur UI parallèle ;
- dégâts, zones persistantes, statuts, mouvement et présentation protégés sauf RED démontrant un besoin ;
- `main` ;
- dépôt `Zombicide-40k`.

### TDD

1. RED contrat : `maxUsesPerCombat` doit survivre à la normalisation et au draft Human Editor.
2. RED runtime : une capacité limitée à 1 doit être acceptée une fois puis rejetée avec `usage_limit` au second démarrage valide.
3. RED : un rejet préalable (énergie/cooldown/condition) ne doit pas consommer d'utilisation.
4. RED réaction : la même limite doit s'appliquer à `resolveReaction()`.
5. RED Human Editor : contrôle présent et exportable ; 0 = illimité.
6. correction minimale sur les propriétaires existants ;
7. tests ciblés + CI complète ;
8. documentation ;
9. checkpoint GREEN + preview ;
10. PREVALIDATION smartphone utilisateur obligatoire.

État : **LOT OUVERT — RED obligatoire avant correction**.


### Résultat technique — Skill Combat Usage Limit V1

RED :
- test initial : `tests/unit/skill-combat-usage-limit-v1.test.mjs` ;
- commit RED initial : `4e89aaed84604f3930c97fdcc8c73326f53a8c14` ;
- RED renforcé pour le rappel/réinvocation roster : `95f69fcda5f33d582b33e6468e0fb67aa37aab87` ;
- CI RED renforcée : `36946445787` — FAILURE attendue ;
- suite : **796 tests / 790 PASS / 6 FAIL** ;
- les six échecs correspondent uniquement aux contrats manquants du lot : définition, état runtime, consommation/refus, réaction, Human Editor et conservation roster.

Correction propriétaire :
- `40a02c579d6d892b1eb60838fcad4d3197a38f81` : ajout canonique de `SkillDefinition.maxUsesPerCombat` avec `null` = illimité et entier positif = limite ;
- `c68e3105bf1e0ee88ea88e86d05991e944a754f3` : `CombatState` devient propriétaire de `skillUseCounts` et de son incrément immuable ;
- `c43b1f0640e66d375e718569fc2af630754ab1ba` : `resolveSkillStart()` et `resolveReaction()` refusent l’activation épuisée avec `usage_limit` et consomment une utilisation uniquement après acceptation ;
- `cd05886b257c932a08f49eb9c084bc1d7868d4a0` : snapshot roster conserve les compteurs pendant rappel/réinvocation ;
- `389522393dce8cce176784b28a62e99f0e8d33fd` : Human Editor transporte la valeur canonique et prépare `0` comme valeur UI illimitée ;
- `35b31b759b4b51a36b5dca61baaf7fcd02400f43` : contrôle visible `Utilisations max par combat` avec aide `0 = Illimité`.

Validation fonctionnelle :
- CI : `36946586799` — SUCCESS ;
- suite complète : **796/796 PASS, 0 FAIL** ;
- capacité limitée à 1 : première activation acceptée, seconde refusée `usage_limit` ;
- tentative rejetée avant activation : aucun compteur consommé ;
- capacité de réaction : même règle ;
- rappel/réinvocation : compteur conservé ;
- Human Editor / JSON : valeur exportée dans `definition.maxUsesPerCombat`.

Contraintes respectées :
- aucun comportement spécial par nom de capacité ;
- aucune règle spéciale obligatoire au slot Ultime : le mécanisme reste générique ;
- aucun timer, observer ou listener compensatoire ;
- aucun compteur parallèle dans l’UI ;
- aucune modification des dégâts, zones persistantes, statuts ou mouvement ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

État : **GREEN technique — documentation synchronisée ; checkpoint/preview et PREVALIDATION smartphone à publier**.


### Publication de PREVALIDATION — Skill Combat Usage Limit V1

Audit d’usage réel :
- l’IA appelle `session.previewSkill()` avant `runtime.startSkill()` ;
- `previewSkill()` passe par le même Action Resolver autoritaire ;
- une capacité épuisée retourne donc `usage_limit` avant sélection/démarrage et l’IA peut poursuivre vers une autre capacité ;
- aucun filtre IA parallèle n’est ajouté.

Noms réservés :
- checkpoint : `checkpoint/lab-skill-combat-usage-limit-v1-green-2026-10-02` ;
- preview : `preview/lab-skill-combat-usage-limit-v1-2026-10-02`.

Validation smartphone attendue :
1. le champ `Utilisations max par combat` apparaît dans l’onglet Capacités ;
2. `0 = Illimité` ;
3. saisir `1`, `2`, `3`, etc. est accepté ;
4. exporter la capacité conserve cette règle dans le JSON ;
5. en combat, une capacité à `1` ne peut être démarrée qu’une seule fois sur le combat ;
6. cooldown, énergie et conditions d’activation continuent de fonctionner normalement.

Aucun merge vers `main`.

État : **PREVALIDATION smartphone après publication du checkpoint/preview**.


## Micro-lot — Showcase Skill Tempête de flammes V1 — 2026-10-02

Base exacte : `51036a24f4a7773fd0a1fd6ff1af1656db55ef47` (Skill Combat Usage Limit V1 — GREEN technique).

- checkpoint de départ : `checkpoint/lab-start-showcase-skill-tempete-flammes-v1-2026-10-02` ;
- branche : `work/lab-showcase-skill-tempete-flammes-v1-2026-10-02`.

### Source utilisateur

Export éditeur fourni :
`gensrpg-capture-skill-cap_fire_atk_6.json`.

ID stable : `cap_fire_atk_6`.
Nom : `Tempête de flammes`.
Slot : `ultimate`.

Modification de donnée explicitement autorisée par l'utilisateur :
- ajouter `definition.maxUsesPerCombat = 1` ;
- aucune autre valeur du fichier source ne doit être modifiée ou « améliorée ».

### Audit obligatoire §33

Collision d'ID :
- `cap_fire_atk_6` existe déjà dans le catalogue Capture historique ;
- l'intégration doit donc **remplacer** cette capacité par le même identifiant stable dans `configuredSkills` ;
- aucun doublon ou nouvel ID de contournement n'est autorisé.

Assets référencés vérifiés :
- `core:icon-skill-fire-breath-01` : présent dans la bibliothèque visuelle globale ;
- `pack:capture:sprite-fire-zone-loop-01` : présent dans la bibliothèque visuelle globale ;
- `gensrpg:sound:effect-135ee2ed` : présent dans le catalogue audio privé, rôle cast.

### Propriétaire et méthode d'insertion

Conformément à `LAB_CHARTE.md §33` :
- le fichier de transfert de capacité reste la source de vérité ;
- `configuredSkills` reste l'unique propriétaire actif ;
- l'insertion passe par `importCaptureTransferJsonV1` puis le planner/batch Transfer existant en mode `replace` ;
- la capacité vitrine doit être chargée après les catalogues historiques/native et avant les presets créatures, afin qu'une créature puisse la référencer par ID sans seconde définition.

### Fichiers autorisés

- `data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json` ;
- nouveau catalogue déclaratif de presets de capacités vitrine sous `src/catalogs/` ;
- raccord de chargement dans `src/ui/capture-editor-human-v2.js` via les adaptateurs Transfer existants ;
- tests dédiés sous `tests/unit/` ;
- documentation du lot.

### Protégé

- aucune modification du catalogue historique source pour masquer le remplacement ;
- aucune duplication de `cap_fire_atk_6` ;
- aucun mock de capacité parallèle ;
- aucun comportement spécial par nom de capacité ;
- aucun changement des règles persistent zone, dégâts, cooldown, activation requirements ou présentation ;
- `main` ;
- dépôt `Zombicide-40k`.

### TDD

1. RED : le preset de capacité vitrine doit exister, s'importer comme `skill` et conserver exactement les valeurs exportées + `maxUsesPerCombat: 1`.
2. RED : le catalogue de presets de capacités doit exposer ce fichier sans duplication.
3. RED : l'application du preset sur une base contenant déjà `cap_fire_atk_6` doit produire `replace-skill`, conserver la taille de la Map et remplacer la définition historique.
4. RED : le Human Editor doit hydrater les presets capacités par le pipeline Transfer existant avant les presets créatures.
5. GREEN minimal : aucune nouvelle autorité, uniquement le raccord déclaratif + Transfer existant.
6. CI complète.
7. checkpoint GREEN + preview si le test UI est nécessaire.

État : **LOT OUVERT — RED obligatoire avant insertion**.


### Résultat technique — Showcase Skill Tempête de flammes V1

RED :
- test : `tests/unit/capture-showcase-skill-presets-v1.test.mjs` ;
- commit RED : `1a24728543e0c2c6f08aca41d733c0a8fe873339` ;
- CI RED : `36947539322` — FAILURE attendue ;
- **800 tests / 796 PASS / 4 FAIL** : fichier preset absent, catalogue absent, remplacement absent et hydratation Human Editor absente.

Insertion conforme §33 :
- `14b21a3b8ec4f82e36f5829a2948652c55761efd` : ajout du transfert `cap_fire_atk_6.capture-skill-transfer-v1.json` avec la seule modification utilisateur autorisée `maxUsesPerCombat: 1` ;
- `f5d6d330aa1e16d3a0d1e2dd03f6e37c0172e7f9` : catalogue déclaratif `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` ;
- `0d19628958acff2a673437dd80113b7f876528cd` : raccord Human Editor par le pipeline Transfer existant, capacités vitrine avant créatures vitrine ;
- `a7a7d26025f6ad2c419f8fb83914357bbc3a357d` : restauration des marqueurs de statut historiques protégés, sans élargir le périmètre ;
- `218f5c88381289f0498f38e94562f6d370a7c1d1` : test du vrai chemin Combat avec `BattleFormat` 1v1.

Collision traitée :
- la capacité historique `cap_fire_atk_6` existait déjà ;
- le planner produit `replace-skill` ;
- aucun doublon n’est créé ;
- le même identifiant continue d’être utilisé par les créatures historiques.

Assets vérifiés :
- `core:icon-skill-fire-breath-01` : présent ;
- `pack:capture:sprite-fire-zone-loop-01` : présent ;
- `gensrpg:sound:effect-135ee2ed` : présent.

Validation :
- CI finale fonctionnelle : `36947818741` — SUCCESS ;
- suite complète : **801/801 PASS, 0 FAIL** ;
- import Transfer : PASS ;
- valeurs du preset et `maxUsesPerCombat: 1` : PASS ;
- remplacement historique par ID stable : PASS ;
- ordre hydratation capacités vitrine -> créatures vitrine : PASS ;
- vrai Combat : première activation acceptée après les conditions configurées, puis deuxième activation refusée `usage_limit` une fois le cooldown expiré : PASS.

Contraintes respectées :
- aucune valeur de l’export utilisateur modifiée hors `maxUsesPerCombat: 1` explicitement demandé ;
- aucune seconde fiche ou mock ;
- aucun comportement par nom ;
- aucun changement du moteur de zone persistante ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

État : **GREEN technique — checkpoint et preview à publier ; validation smartphone utilisateur requise pour GREEN utilisateur**.


### Publication de PREVALIDATION — Showcase Skill Tempête de flammes V1

Noms réservés :
- checkpoint : `checkpoint/lab-showcase-skill-tempete-flammes-v1-green-2026-10-02` ;
- preview : `preview/lab-showcase-skill-tempete-flammes-v1-2026-10-02`.

Validation smartphone attendue :
1. ouvrir l’éditeur Capture et vérifier que `cap_fire_atk_6` correspond à **Tempête de flammes** et non à l’ancienne définition historique ;
2. vérifier le niveau requis 20 et le slot Ultime ;
3. vérifier `Utilisations max par combat = 1` ;
4. vérifier que la zone de feu, le visuel, l’offset vertical -50 et le son de cast sont conservés ;
5. lancer un combat répondant aux conditions d’activation : la capacité ne doit pouvoir être engagée qu’une seule fois sur le combat.

Aucun merge vers `main`.

État : **PREVALIDATION smartphone après publication du checkpoint/preview**.


## Micro-lot — Skill Editor Active Library V1 — 2026-10-02

Base exacte : `06c22014a93e6ed9e008d395b081d0663883bac8` (Showcase Skill Tempête de flammes V1 — GREEN technique).

- checkpoint de départ : `checkpoint/lab-start-skill-editor-active-library-v1-2026-10-02` ;
- branche : `work/lab-skill-editor-active-library-v1-2026-10-02`.

### Régression utilisateur

Retour smartphone :
- `Boule de feu` n'est plus accessible dans le sélecteur de capacités ;
- `Tempête de flammes` apparaît sous son ancienne configuration, antérieure au JSON utilisateur intégré.

### Cause démontrée

Le problème n'est pas dans `configuredSkills` :
- `fireball` est présent dans le catalogue natif et est hydraté dans `configuredSkills` ;
- le preset vitrine `cap_fire_atk_6` remplace correctement l'entrée historique dans `configuredSkills` ;
- le JSON vitrine actif contient bien la version utilisateur de `Tempête de flammes` avec `maxUsesPerCombat: 1`.

Le problème est dans le Human Editor :
- le sélecteur `[data-skill-library-select]` est encore peuplé depuis `captureLegacySkillLibraryEntriesV1()` ;
- son listener recharge `captureLegacyAbilityEditorStateV1()` puis `mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1()` ;
- il contourne donc l'autorité active `configuredSkills`.
Conséquences :
- les capacités laboratoire comme `fireball` ne sont pas listées ;
- une capacité historique remplacée comme `cap_fire_atk_6` recharge encore son ancien modèle.

### Contrat correctif

1. `configuredSkills` devient la seule source de la liste de capacités modifiables.
2. Le sélecteur doit être rafraîchi après chaque hydratation/import/remplacement de `configuredSkills`.
3. Sélectionner une capacité doit recharger la fiche complète depuis `configuredSkills` :
   - identité / description / niveau / slot Ultime ;
   - catégorie, forme, élément, déplacement ;
   - énergie / préparation / trajet / récupération / cooldown / limite d'utilisations ;
   - conditions d'activation ;
   - effets tactiques ;
   - projectile clash ;
   - présentation : icône, cast, travel, impact, zone, scales, offsets, layers, socket, audio.
4. Aucun merge avec l'ancien template historique.
5. Les helpers/catalogues legacy peuvent rester pour migration documentaire si nécessaires ailleurs, mais ils ne doivent plus prendre autorité sur la sélection de fiches actives dans l'éditeur.

### RED prévu

- `configuredSkills` doit alimenter le sélecteur actif ;
- `fireball` doit être visible ;
- `cap_fire_atk_6` doit recharger la fiche utilisateur vitrine avec niveau 20, Ultime, zone persistante, offset -50 et `maxUsesPerCombat: 1` ;
- l'éditeur ne doit plus utiliser `mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1` lors du changement de sélection ;
- la recharge doit être round-trip compatible avec `buildHumanSkillDraftV1`.

### Protégé

- aucune modification des données de capacité ;
- aucun changement Combat Runtime ;
- aucun changement persistent zone ;
- aucun changement du pipeline Transfer ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

État : **LOT OUVERT — RED avant correction**.


### Résultat technique — Skill Editor Active Library V1

Diagnostic confirmé :
- `configuredSkills` contenait bien les données correctes ;
- la Boule de feu initiale `fireball` était enregistrée dans cette Map puis enrichie par le catalogue natif ;
- le preset `cap_fire_atk_6` remplaçait bien l'entrée historique par la version utilisateur ;
- la régression venait exclusivement du sélecteur Human Editor encore relié au catalogue legacy.

RED :
- test : `tests/unit/capture-skill-editor-active-library-v1.test.mjs` ;
- commit RED : `4bdae8371d403a6b4dc923ca807e5a64eaf2d72c` ;
- CI RED : `36948963067` — FAILURE attendue ;
- **805 tests / 801 PASS / 4 FAIL** ;
- les 4 échecs correspondaient exactement à : source `configuredSkills`, présence Fireball/Tempête, rechargement complet de Tempête, retrait du merge legacy et rafraîchissement après hydratation.

Correction :
- `e42789c6cbe45fc5a8374996cb065d3fe6a2a519` : ajout du mapping complet `humanSkillEditorFieldsFromDraftV1()`, du writer `writeSkillDraftFields()` et du helper de liste active ;
- les commits intermédiaires `22ed2524c987bdfa573eedae2ba43449590fca05` et `942201df7bc16302786b652615e969e8a23b39c3` ont été rejetés : un remplacement automatique avait supprimé une fermeture de fonction et provoquait `Unexpected end of input` ; ils n'ont jamais été considérés GREEN ;
- `d1b9dca7982eb6c109abb2142918f4793ae14876` : reconstruction propre depuis le dernier commit sain, sélecteur alimenté par `configuredSkills`, sélection/rechargement complet, rafraîchissement après import et hydratation ;
- `a7e7bb60be8c62bf29df91f38f2a385df4aabdf6` : sentinelle supplémentaire de round-trip exact du preset Tempête de flammes.

Validation :
- CI après correction structurelle : `36949506411` — SUCCESS, **805/805 PASS** ;
- CI avec sentinelle round-trip : `36949587482` — SUCCESS, **806/806 PASS, 0 FAIL** ;
- `fireball` est exposé par la bibliothèque active ;
- `cap_fire_atk_6` est exposé sous **Tempête de flammes**, niveau 20, slot Ultime, `maxUsesPerCombat: 1`, zone persistante et présentation utilisateur ;
- la sélection ne contient plus `mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1` ;
- le round-trip Tempête actif est strictement identique à son draft configuré.

Contraintes respectées :
- aucune donnée de capacité modifiée dans ce lot ;
- aucun changement Combat Runtime ;
- aucun changement du moteur de zone persistante ;
- aucun changement du pipeline Transfer ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

État : **GREEN technique — documentation synchronisée ; checkpoint/preview et PREVALIDATION smartphone à publier**.

### Publication de PREVALIDATION — Skill Editor Active Library V1

Noms réservés :
- checkpoint : `checkpoint/lab-skill-editor-active-library-v1-green-2026-10-02` ;
- preview : `preview/lab-skill-editor-active-library-v1-2026-10-02`.

Validation smartphone attendue :
1. ouvrir l'onglet Capacités ;
2. vérifier que **Boule de feu** est de nouveau disponible dans la liste ;
3. sélectionner **Tempête de flammes** et vérifier que la fiche affichée est bien la version utilisateur : niveau 20, Ultime, limite 1 utilisation/combat, zone persistante et offset vertical -50 ;
4. passer de Boule de feu à Tempête puis revenir afin de vérifier que les fiches ne se contaminent pas ;
5. aucune ancienne version de Tempête ne doit reprendre autorité.

Aucun merge vers `main`.

État : **PREVALIDATION smartphone après publication du checkpoint/preview**.


### Durcissement de charte — Active Owner Selector Guard

À la suite de la régression confirmée sur Boule de feu / Tempête de flammes, `LAB_CHARTE.md` est complétée pour rendre ce défaut non reproductible par méthode :

- §33.9 : les sélecteurs de modification de l’éditeur doivent être dérivés de `configuredSkills` / `configuredCreatures`, jamais d’un catalogue legacy concurrent une fois le propriétaire actif hydraté ;
- §33.9 : une sélection recharge la fiche depuis le même propriétaire actif ;
- §33.9 : les catalogues legacy/native peuvent initialiser ou migrer, mais ne reprennent jamais autorité après remplacement ;
- §33.10 : sentinelles obligatoires sur unicité de l’ID, visibilité dans le sélecteur, rechargement complet, conservation de la nouvelle version, présence d’une autre fiche native connue, round-trip éditeur et rafraîchissement post-import ;
- si les données sont correctes dans le propriétaire actif mais fausses à l’écran, la correction doit viser la lecture/recharge UI et ne doit pas déformer les données.

Commit charte : `859f48586f0c88d3dd4759d2addb11c42b1c04fe`.

Aucun changement Runtime/UI/data dans ce durcissement documentaire.


## Micro-lot — Tempête de flammes Refresh V2 — 2026-10-02

Base exacte : `2c0556267ecda9091d40fb9f8a25c1118295ced7` (Active Owner Selector Guard — GREEN documentation + Skill Editor Active Library V1 GREEN technique).

- checkpoint charte : `checkpoint/lab-active-owner-selector-charter-guard-green-2026-10-02` ;
- checkpoint de départ : `checkpoint/lab-start-tempete-flammes-refresh-v2-2026-10-02` ;
- branche : `work/lab-tempete-flammes-refresh-v2-2026-10-02`.

### Source utilisateur

Nouveau fichier fourni : `gensrpg-capture-skill-cap_fire_atk_6(1).json`.

Identité stable :
- ID : `cap_fire_atk_6` ;
- nom : `Tempête de flammes` ;
- slot : `ultimate`.

Différence utilisateur à appliquer :
- `definition.maxUsesPerCombat` passe de `1` à `6`.

Les autres valeurs du preset doivent rester celles du fichier utilisateur fourni.

### Méthode d'insertion

Conformément à `LAB_CHARTE.md §33` :
- l'export utilisateur est la source de vérité ;
- remplacement par le même ID stable dans le preset vitrine existant ;
- aucune duplication ;
- aucun merge avec un template legacy ;
- `configuredSkills` reste propriétaire actif ;
- test round-trip du preset actif conservé.

### RED

1. adapter la sentinelle du preset pour exiger `maxUsesPerCombat: 6` ;
2. adapter le test Combat réel : six activations acceptées lorsque les autres contraintes sont satisfaites, septième refusée `usage_limit` ;
3. constater le RED sur le preset encore à 1 ;
4. remplacer uniquement le fichier preset par le JSON utilisateur ;
5. CI complète GREEN.

### Backlog séparé demandé par l'utilisateur

Après ce lot, concevoir un affichage de détails de capacité en combat au survol/clic/tap :
- description ;
- niveau de déblocage ;
- conditions d'activation traduites en texte lisible ;
- cible ;
- dégâts / soin ;
- cadence de tick ;
- durée ;
- cooldown ;
- énergie ;
- utilisations max par combat ;
- effets tactiques.

Principe architectural retenu pour la future conception : le texte détaillé doit être **généré depuis les données SkillDefinition / effets réels**, et non maintenu comme une seconde description manuelle susceptible de diverger.

État : **LOT OUVERT — RED avant remplacement du preset**.


### Résultat technique — Tempête de flammes Refresh V2

Source utilisateur :
- fichier : `gensrpg-capture-skill-cap_fire_atk_6(1).json` ;
- ID stable : `cap_fire_atk_6` ;
- modification confirmée : `maxUsesPerCombat = 6`.

RED :
- commit : `7f0da9ee6fcfa422988e939ea96603a16c924ac1` ;
- CI : `36977538487` — FAILURE attendue ;
- **806 tests / 803 PASS / 3 FAIL** ;
- les trois échecs correspondaient exactement au preset encore configuré à 1 utilisation : transfert, remplacement canonique et vrai chemin Combat.

Insertion :
- `939064e87426907d3deabfeb25f0947b59b0c7ed` : remplacement du preset vitrine par le nouveau JSON utilisateur, sans autre modification de donnée ;
- la CI a alors exposé une seule sentinelle historique encore figée à 1 dans `capture-skill-editor-active-library-v1.test.mjs` ;
- `e5a831a77c59ae40dab87f0322977853d353854e` : mise à jour de cette sentinelle vers 6, afin qu'elle protège la nouvelle fiche active.

Validation :
- CI : `36977678916` — SUCCESS ;
- suite complète : **806/806 PASS, 0 FAIL** ;
- Transfer : `maxUsesPerCombat = 6` ;
- remplacement par ID stable : PASS ;
- Human Editor actif : valeur 6 restituée ;
- round-trip fiche active -> champs -> draft : PASS ;
- vrai Combat : six démarrages valides lorsque les autres contraintes sont satisfaites, septième refusé avec `usage_limit`.

Aucune autre valeur du JSON utilisateur n'a été volontairement modifiée :
- niveau 20 ;
- slot Ultime ;
- énergie 5 ;
- préparation 2000 ms ;
- cooldown 3500 ms ;
- activation après 25000 ms ;
- zone persistante 7000 ms ;
- tick 1000 ms ;
- 5 dégâts/tick ;
- renforcement jusqu'à 3 activations ;
- visuel / offsets / audio inchangés.

### Publication de PREVALIDATION — Tempête de flammes Refresh V2

Noms réservés :
- checkpoint : `checkpoint/lab-tempete-flammes-refresh-v2-green-2026-10-02` ;
- preview : `preview/lab-tempete-flammes-refresh-v2-2026-10-02`.

Validation smartphone attendue :
1. sélectionner **Tempête de flammes** dans l'éditeur ;
2. vérifier `Utilisations max par combat = 6` ;
3. vérifier que le reste de la fiche est inchangé ;
4. vérifier que Boule de feu reste accessible ;
5. si test Combat effectué, la capacité doit pouvoir être engagée jusqu'à six fois au maximum sur le même combat.

Aucun merge vers `main`.

État : **GREEN technique — PREVALIDATION smartphone**.


## Micro-lot — Skill Required Level Update Retention V1 — 2026-10-02

Base exacte : `69e7c24fb1d735d3b23b842e91f10d3d6a00e4dc` (Tempête de flammes Refresh V2 — GREEN technique / PREVALIDATION).

- checkpoint de départ : `checkpoint/lab-start-skill-required-level-update-retention-v1-2026-10-02` ;
- branche : `work/lab-skill-required-level-update-retention-v1-2026-10-02`.

### Retour utilisateur

Dans le Human Editor :
1. Boule de feu est sélectionnée et déjà équipée sur une créature ;
2. seul son niveau de déverrouillage est modifié ;
3. l'utilisateur clique « Mettre à jour la capacité existante » ;
4. Boule de feu disparaît ensuite de la liste et du slot de la créature.

### Invariant attendu

Modifier `requiredLevel` d'une capacité existante :
- conserve exactement son ID stable ;
- conserve sa présence dans `configuredSkills` ;
- conserve son `loadoutSlot` si l'utilisateur ne l'a pas changé ;
- ne modifie aucun `configuredCreatures[*].loadout` ;
- ne doit jamais auto-équiper, déplacer ou retirer la capacité d'un slot ;
- recharge immédiatement la fiche active sauvegardée depuis `configuredSkills` ;
- laisse la progression décider uniquement de l'activité en combat, sans supprimer la configuration planifiée.

### Audit

Le moteur de progression n'est pas propriétaire de la configuration du loadout :
- `validateHumanLoadoutProgressionV1` accepte les capacités de niveau futur ;
- `syncLoadoutAvailability` marque seulement les slots/capacités actifs ou futurs ;
- `projectCapturePlannedLoadoutsToCombatV1` filtre uniquement la projection vers le combat.

Point fragile identifié dans le chemin de sauvegarde UI :
- `persistCurrentSkill()` appelle actuellement `refreshLoadoutOptions(draft.id)` aussi bien en création qu'en mise à jour ;
- le paramètre `preferredId` possède une logique d'auto-placement dans un slot vide ;
- une mise à jour de fiche ne doit jamais passer par une logique d'auto-placement de loadout ;
- après sauvegarde, la fiche active n'est pas explicitement rechargée depuis `configuredSkills`.

### RED

1. une mise à jour doit rafraîchir le loadout sans `preferredId` / auto-placement ;
2. la sélection active doit être rechargée depuis le draft sauvegardé après update ;
3. Boule de feu modifiée uniquement sur `requiredLevel` doit rester dans la bibliothèque active ;
4. le loadout planifié de la créature doit rester byte-sémantiquement identique ;
5. aucune modification de la projection Combat / progression.

### Protégé

- aucun changement de règle de progression ;
- aucun changement de `projectCapturePlannedLoadoutsToCombatV1` ;
- aucun changement Combat Runtime ;
- aucun changement de données Boule de feu ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

État : **LOT OUVERT — RED avant correction**.


### Résultat technique — Skill Required Level Update Retention V1

Cause / point fragile confirmé :
- une mise à jour de capacité utilisait encore `refreshLoadoutOptions(draft.id)` ;
- ce paramètre `preferredId` appartient à une logique d'auto-placement utile pour la création, pas pour la modification d'une fiche existante ;
- le niveau requis n'est pas censé filtrer ni supprimer la configuration du loadout ;
- après sauvegarde, la fiche active n'était pas explicitement rechargée depuis `configuredSkills`.

RED :
- commit : `180ee46dbf49499c7c452756a22cc4902d8575f0` ;
- CI : `36979511510` — FAILURE attendue ;
- **808 tests / 807 PASS / 1 FAIL** ;
- unique échec : le chemin update utilisait encore l'auto-placement et ne rechargeait pas explicitement la fiche active.

Correction :
- commit : `e0143495ef03ef177a1c6d9b753dc2b3ab7f2111` ;
- `create` conserve `refreshLoadoutOptions(draft.id)` ;
- `update` utilise désormais `refreshLoadoutOptions()` sans auto-placement ;
- après sauvegarde, `writeSkillDraftFields(root, draft, statRegistry)` recharge la fiche active ;
- `librarySelect.value = draft.id` maintient l'ID sélectionné ;
- l'ID technique redevient readonly ;
- `selectedLegacyState` est remis à `null`.

Validation :
- CI : `36979580666` — SUCCESS ;
- **808/808 PASS, 0 FAIL** ;
- modifier uniquement `requiredLevel` conserve `fireball` dans `configuredSkills` ;
- le type de slot reste `standard` ;
- le loadout planifié de la créature reste inchangé ;
- aucune règle de progression ou de projection Combat n'a été modifiée.

Durcissement de charte :
- §33.11 ajouté ;
- une mise à jour de capacité ne peut plus modifier le loadout par effet de bord ;
- l'auto-placement est réservé à la création ;
- la progression décide seulement de l'activité en combat et ne supprime pas la configuration planifiée.

État : **GREEN technique — checkpoint/preview à publier ; validation smartphone requise**.


## Micro-lot — Projectile Impact Sync V1 — 2026-10-02

Base exacte : `9d4c5cef80fd0d92d76e2d374c700b9397c8ac94` (Skill Required Level Update Retention V1 — GREEN technique).

- checkpoint de départ : `checkpoint/lab-start-projectile-impact-sync-v1-2026-10-02` ;
- branche : `work/lab-projectile-impact-sync-v1-2026-10-02`.

### Priorité utilisateur

Retour smartphone sur **Boule de feu** :
- le sprite du projectile disparaît quelques millisecondes avant l'impact réel ;
- ce trou visuel est jugé inacceptable pour le combat dynamique.

Le micro-lot `Combat Skill Details V1`, ouvert sur une autre branche, est **mis en pause** et n'est pas inclus dans cette base. Aucun de ses changements RED ne doit contaminer ce correctif.

### Cause démontrée par audit

Dans `dom-skill-fx.js` :
- le projectile possède déjà une animation dont la durée est exactement `action.travelMs` ;
- en parallèle, `watchProjectileContact()` surveille sa géométrie à chaque frame ;
- dès que le centre du projectile entre dans le rectangle visuel de la cible, le renderer annule l'animation et supprime le sprite ;
- l'impact réel, lui, n'est présenté qu'au signal autoritaire `onResolved` du Combat Runtime.

Conséquence : le renderer retire visuellement le projectile **avant** l'instant d'impact autoritaire, créant un trou de quelques millisecondes.

### Invariant cible

Pour un projectile normal non clashé :
1. le renderer ne décide jamais d'une arrivée anticipée à partir de la géométrie DOM ;
2. le projectile reste visible pendant toute sa durée de trajet autoritaire ;
3. à l'instant de résolution, le projectile est retiré puis l'impact est affiché dans le même chemin de présentation ;
4. aucun délai artificiel n'est ajouté au gameplay ;
5. aucun changement de dégâts, `travelMs`, cooldown, énergie ou Combat Runtime ;
6. les clashes conservent leur annulation explicite via `cancelProjectileFor()`.

### Propriétaire

- timing gameplay : Combat Runtime — inchangé ;
- plan du projectile : Skill FX Plan — inchangé si le test ne démontre pas de défaut ;
- durée / présence visuelle du projectile : DOM Skill FX Renderer ;
- transition projectile -> impact : Combat Resolution Presenter.

### Fichiers autorisés

- `src/adapters/renderer/dom-skill-fx.js` ;
- `src/adapters/renderer/combat-resolution-presenter.js` seulement si nécessaire pour assurer la transition atomique ;
- tests unitaires renderer/presenter dédiés ;
- `docs/LAB_CURRENT_WORK.md`.

### Protégé

- `src/core/combat/combat-runtime.js` ;
- `src/core/combat/action-resolver.js` ;
- `src/core/fx/skill-fx-plan.js` sauf RED démontrant un défaut réel ;
- données de Boule de feu ;
- aucune valeur de timing ajoutée en rustine ;
- aucun `setTimeout` compensatoire ;
- aucun traitement spécial par ID `fireball` ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

### TDD

1. RED : un projectile ne doit plus être supprimé sur simple entrée géométrique dans la cible.
2. RED : à la fin du trajet, le dernier état visuel doit rester présent jusqu'au signal de résolution ou à une annulation explicite.
3. RED : `presentOutcome()` doit retirer le projectile actif du lanceur avant/au même moment que l'impact.
4. RED : un clash doit continuer à supprimer immédiatement le projectile.
5. correction minimale ;
6. tests ciblés + suite complète ;
7. checkpoint GREEN + preview smartphone ;
8. validation utilisateur.

État : **LOT OUVERT — RED avant correction**.


### RED confirmé et recadrage interruption

RED :
- commit : `10efef9c941486e950506d2ed407f1551a044f1f` ;
- CI : `36990376128` — **FAILURE attendue** ;
- les nouvelles sentinelles exigent que la géométrie DOM ne supprime plus le projectile, que la dernière frame reste jusqu'au résultat sémantique et que le presenter effectue la transition projectile -> impact.

Audit d'annulation :
- le Runtime peut annuler une action déjà relâchée si son acteur ou sa cible est mis KO par une autre action ;
- dans ce cas `onInterrupted` doit demander au propriétaire de présentation de nettoyer le projectile ;
- conserver le projectile jusqu'à l'impact sans traiter cette annulation créerait une fuite visuelle.

Périmètre ajouté **avant correction** :
- `src/ui/combat-2v2-test-ui.js` ;
- `src/ui/combat-test-ui.js`.

Le rôle de ces deux fichiers reste limité au raccord du signal `onInterrupted` vers le presenter ; aucune règle de combat n'y est ajoutée.


### Résultat technique — Projectile Impact Sync V1

Cause confirmée :
- `watchProjectileContact()` supprimait le projectile à partir de la géométrie DOM avant le résultat sémantique ;
- la promesse `animation.finished` supprimait également le nœud immédiatement à la fin de `travelMs`, alors que `onResolved` peut être traité au tick suivant ;
- ces deux chemins pouvaient produire le trou visuel observé entre la disparition de Boule de feu et son impact.

Correction propriétaire :
- `ac5189f13e6c28ff8458272cc03f743d133e23fd` : retrait de l'autorité géométrique et conservation de la dernière frame du projectile après son trajet ;
- `18b907dda261cd6ee446666f5f60334a9d22c952` : le presenter retire désormais un projectile normal au signal sémantique d'arrivée, immédiatement avant la présentation de l'impact ; ajout de `cancelActionPresentation()` pour le cycle de vie d'une action interrompue ;
- `cc321385a2c7895b72a326e6f4a4b9928473aab8` et `5a2e19a986fa7bd0c1a61c557c2ad2519e2962a3` : les deux UI de combat routent `onInterrupted` vers ce nettoyage propriétaire ;
- `6b2c77b111258b70abc12d6f1909a43b4f78e533` : anciennes sentinelles FX alignées sur le nouvel invariant de présence jusqu'à l'impact ;
- `32079ac69cbdf7a706c8cd6a7647903b7081473a` : correction d'une faute de syntaxe située uniquement dans le nouveau fichier de test.

Validation :
- RED initial : `10efef9c941486e950506d2ed407f1551a044f1f`, CI `36990376128` — FAILURE attendue ;
- une CI intermédiaire `36990705491` a échoué uniquement à cause du `\\n` littéral dans l'import de la nouvelle sentinelle ; les 808 tests historiques passaient ;
- CI finale : `36990795260` — **SUCCESS** ;
- suite complète : **813/813 PASS, 0 FAIL**.

Invariants vérifiés :
- aucune collision DOM ne décide de l'arrivée du projectile ;
- la dernière frame reste affichée après la fin du trajet jusqu'au signal sémantique ;
- projectile -> impact est effectué dans le même appel `presentOutcome()` ;
- un clash conserve son annulation immédiate ;
- une interruption nettoie le projectile via le presenter ;
- aucun changement de `travelMs`, dégâts, énergie, cooldown ou Combat Runtime ;
- aucune logique spéciale par ID `fireball` ;
- aucun timer compensatoire ;
- aucun merge vers `main` ;
- aucun changement dans `Zombicide-40k`.

Noms de publication :
- checkpoint GREEN : `checkpoint/lab-projectile-impact-sync-v1-green-2026-10-02` ;
- preview smartphone : `preview/lab-projectile-impact-sync-v1-2026-10-02`.

PREVALIDATION smartphone attendue :
1. lancer **Boule de feu** ;
2. vérifier que son sprite reste visible jusqu'au contact/impact, sans trou de quelques millisecondes ;
3. vérifier que l'impact apparaît immédiatement lors de la disparition du projectile ;
4. vérifier que le trajet conserve la même vitesse ;
5. vérifier qu'un projectile clashé disparaît toujours au point de clash.

État : **GREEN technique — publication checkpoint/preview puis validation smartphone**.


### Publication effective — Projectile Impact Sync V1

État de publication avant ce scellement :
- work/documentation : `cf5ff2c9e2dd16dee4721094a95ce62a6e5eaea4` ;
- CI work : `36990955530` — SUCCESS ;
- checkpoint : `checkpoint/lab-projectile-impact-sync-v1-green-2026-10-02` ;
- CI checkpoint : `36990994749` — SUCCESS ;
- preview : `preview/lab-projectile-impact-sync-v1-2026-10-02` ;
- CI preview : `36990999409` — SUCCESS ;
- suite complète : **813/813 PASS, 0 FAIL**.

Après la CI du présent scellement documentaire, checkpoint et preview doivent être avancés en fast-forward vers le même HEAD, puis revérifiés.

Statut : **GREEN technique publié — PREVALIDATION smartphone utilisateur en attente ; aucun merge vers main**.


## Micro-lot — Projectile Model Contact V1 — 2026-10-02

Base exacte : `71454cee18eec875b83eb8ddd362f67b6eeed699` (Projectile Impact Sync V1 — GREEN technique publié).

- checkpoint de départ : `checkpoint/lab-start-projectile-model-contact-v1-2026-10-02` ;
- branche : `work/lab-projectile-model-contact-v1-2026-10-02`.

### Retour utilisateur

En combat réel concurrent :
- si la cible se déplace vers le lanceur pendant le trajet d'un projectile, le sprite peut traverser visuellement son modèle ;
- attendu : **le modèle courant de la cible constitue la zone de contact du projectile** ;
- dès que le projectile touche cette zone, il doit disparaître et l'impact doit être présenté immédiatement, sans trou visuel.

### Recadrage architecture / autorité unique

L'ancien mécanisme `watchProjectileContact()` supprimait directement le projectile dans le renderer, sans faire avancer la résolution sémantique. Il a donc été retiré dans le lot précédent car il créait une autorité concurrente et un décalage projectile/impact.

Le présent lot ne réintroduit pas cette autorité.

Chaîne cible :

`DOM Skill FX (capteur géométrique) -> signal de contact -> Combat Runtime (validation + résolution unique) -> onResolved -> Presenter -> suppression projectile -> impact`.

Invariants :
1. le renderer ne décide jamais du résultat, des dégâts, de l'esquive, du clash ou de la cible ;
2. le renderer émet au plus un signal de contact pour un projectile actif ;
3. `Combat Runtime` vérifie que l'action existe encore, est relâchée, est bien un projectile et vise la cible signalée ;
4. seul le Runtime peut déclencher la complétion anticipée au contact ;
5. le timestamp d'impact utilisé par Action Resolver doit être celui du contact accepté par le Runtime, sans conserver un faux `impactAtMs` futur ;
6. `onResolved` reste l'unique chemin vers le Presenter ;
7. le Presenter conserve la transition atomique : suppression projectile puis impact immédiat ;
8. aucun timer, observer, listener global ou boucle permanente supplémentaire ;
9. le suivi géométrique n'existe que pendant la vie du projectile FX et est nettoyé à l'annulation/dispose.

### Propriétaires

- observation de géométrie DOM : Render Adapter uniquement ;
- acceptation du contact et horloge d'impact : Combat Runtime ;
- application dégâts/résultat : Action Resolver / Combat Session ;
- transition visuelle projectile -> impact : Combat Resolution Presenter.

### Fichiers autorisés

- `src/adapters/renderer/dom-skill-fx.js` ;
- `src/core/combat/combat-runtime.js` ;
- `src/core/combat/combat-session.js` seulement pour transporter un impact effectif validé ;
- `src/core/combat/action-resolver.js` seulement pour consommer ce timestamp effectif sans dupliquer une règle ;
- `src/ui/combat-test-ui.js` et `src/ui/combat-2v2-test-ui.js` uniquement comme composition root pour relier le signal renderer au Runtime ;
- tests unitaires / intégration dédiés ;
- `docs/LAB_ARCHITECTURE.md` ;
- `docs/LAB_CURRENT_WORK.md`.

### Protégé

- aucune logique spéciale par ID de compétence ;
- aucune collision décidée par l'UI ;
- aucune application de dégâts dans le renderer/presenter ;
- aucune seconde horloge ;
- aucun `setTimeout` compensatoire ;
- aucun `MutationObserver` / listener global ;
- aucune modification de `Zombicide-40k` ;
- aucun merge vers `main`.

### TDD prévu

1. RED renderer : une entrée du centre du projectile dans le rectangle live de la cible émet un contact une seule fois et ne nettoie pas elle-même le projectile ;
2. RED Runtime : un contact accepté sur projectile relâché résout l'action immédiatement à l'elapsed courant ;
3. RED Runtime : contact faux acteur / fausse cible / avant release / non-projectile est refusé sans résolution ;
4. RED Resolver : les événements `skill-arrive`, `hit`, effets tactiques et recovery utilisent l'impact effectif accepté, pas l'ancien timestamp nominal ;
5. RED vrai chemin : contact renderer -> Runtime -> `onResolved` -> Presenter entraîne disparition projectile puis impact dans le même flux ;
6. sentinelles clash / interruption / mobilité conservées ;
7. suite complète GREEN ;
8. checkpoint + preview smartphone ;
9. validation utilisateur.

État : **LOT OUVERT — RED avant correction**.


### Résultat technique — Projectile Model Contact V1

RED confirmé :
- commit : `e2d28d5436361ae0a5f5bb89fb77d8d422235ddc` ;
- CI : `37001680941` — FAILURE attendue ;
- 3 échecs nouveaux exactement sur le contrat manquant :
  1. le renderer n'émettait aucun contact modèle ;
  2. `CombatRuntime.reportProjectileContact()` n'existait pas ;
  3. les contacts invalides ne pouvaient donc pas être refusés par le Runtime.

Correction propriétaire :
- `d03e25efce3e8a28ed563f1b288664a2703b074d` : le DOM Skill FX redevient capteur géométrique uniquement ; il émet au plus un signal de contact par projectile actif, sans supprimer le projectile ni résoudre l'action ;
- `2b2cde6201483a3d3a1c794b78177f5cc5bdb342` : `Combat Runtime` ajoute l'unique API `reportProjectileContact()` ; elle traite d'abord les événements déjà dus, valide action/forme/release/cible, calcule l'impact effectif puis passe par `Combat Session.completeAction()` ;
- `867d84fdc1bbfba8930a33e147d34e558fa66a84` : composition 2v2 raccordée au Runtime ;
- `8687aaa0df2a2b89110168fd5c16c550b3c3a8d4` : composition 1v1 raccordée au Runtime ;
- `8dfe5dedc0c5bdee08d8a00d76c42e172cd68b62` : architecture mise à jour avec la chaîne d'autorité unique ;
- `388bee0aad020d129d59973d0831f5a26116fd5a` : sentinelle permanente des deux composition roots.

Invariants obtenus :
1. le modèle mobile de la cible est observé comme zone de contact du projectile ;
2. le renderer ne fait que constater la géométrie et émettre un signal immuable ;
3. aucun dégât, aucun résultat, aucun changement de cible n'est décidé dans le renderer ou l'UI ;
4. le Runtime reste l'unique horloge et l'unique autorité qui accepte le contact ;
5. un clash/release/impact nominal déjà dû est traité avant un contact visuel plus tardif ;
6. l'action effective reçoit `impactAtMs` et `travelMs` correspondant au contact accepté, sans modifier la définition source de la compétence ;
7. `onResolved` reste l'unique chemin de résolution vers le Presenter ;
8. le Presenter conserve l'ordre : **suppression projectile -> impact immédiat** ;
9. aucune seconde boucle permanente : uniquement le `requestAnimationFrame` déjà borné à la vie du projectile, annulé au nettoyage ;
10. aucune logique spéciale `fireball`, aucun timer compensatoire, aucun observer global.

Validation :
- CI fonctionnelle avant scellement : `37002036474` — SUCCESS ;
- suite complète : **817/817 PASS, 0 FAIL** ;
- anciennes sentinelles Projectile Impact Sync / Clash / interruption restent GREEN ;
- les deux interfaces 1v1 et 2v2 sont explicitement verrouillées vers `CombatRuntime.reportProjectileContact()`.

Publication prévue :
- checkpoint GREEN : `checkpoint/lab-projectile-model-contact-v1-green-2026-10-02` ;
- preview smartphone : `preview/lab-projectile-model-contact-v1-2026-10-02`.

PREVALIDATION smartphone :
1. lancer Boule de feu pendant que la cible avance vers le lanceur ;
2. vérifier que la boule ne traverse plus le modèle ;
3. vérifier qu'au premier contact accepté elle disparaît ;
4. vérifier que l'impact démarre immédiatement après cette disparition ;
5. vérifier que les dégâts/Hit correspondent au même contact ;
6. vérifier un clash projectile pour confirmer qu'il reste prioritaire lorsqu'il arrive avant le contact cible.

État : **GREEN technique — publication checkpoint/preview puis validation utilisateur**.


### Durcissement final — vrai chemin dégâts

Sentinelle ajoutée :
- commit : `971f629199436a49b7d8c07ca9fdf8134bc959c3` ;
- le test utilise la vraie Boule de feu normalisée, le vrai `Combat Session`, le vrai `Combat Runtime` et le vrai `Action Resolver` ;
- aucun dégât n'est appliqué au release ni pendant le trajet avant contact ;
- au contact modèle accepté avant l'impact nominal, les dégâts sont appliqués immédiatement ;
- les événements `skill-arrive` et `hit` portent exactement le timestamp d'impact effectif accepté par le Runtime.

CI : `37002196425` — SUCCESS.
Suite complète : **818/818 PASS, 0 FAIL**.

Statut final du lot : **GREEN technique — prêt pour checkpoint/preview et PREVALIDATION smartphone ; aucun merge vers main**.


## Micro-lot — Projectile Contact Precision V2 — 2026-10-02

Base exacte : `4b6f33a88ecaf40db105262c67ee6cbd45ac1e11` (Projectile Model Contact V1 — GREEN technique publié).

- checkpoint de départ : `checkpoint/lab-start-projectile-contact-precision-v2-2026-10-02` ;
- branche : `work/lab-projectile-contact-precision-v2-2026-10-02`.

### Retour utilisateur

La prévalidation smartphone montre encore des traversées occasionnelles de Boule de feu lorsque la cible se déplace. Le mode doit être strictement lisible et déterministe : aucun contact visuellement évident ne doit être raté.

### Cause suspectée à verrouiller par RED

Le capteur actuel teste uniquement le centre instantané du rectangle projectile à chaque `requestAnimationFrame`. Deux contacts peuvent donc être manqués :
1. **tunneling inter-frame** : le projectile passe d'un côté à l'autre du modèle entre deux observations sans que son centre ne soit jamais échantillonné à l'intérieur ;
2. **chevauchement de surface** : le bord du projectile touche le modèle alors que son centre est encore hors du rectangle cible.

### Autorité unique conservée

Chaîne inchangée :

`DOM Skill FX (mesure géométrique uniquement) -> signal de contact -> Combat Runtime (validation/horloge unique) -> Combat Session / Action Resolver -> onResolved -> Presenter -> disparition projectile -> impact`.

Le renderer reste un **capteur**, jamais une autorité gameplay.

### Fichiers autorisés

- `src/adapters/renderer/dom-skill-fx.js` ;
- tests unitaires dédiés au contact projectile ;
- `docs/LAB_ARCHITECTURE.md` si le contrat de détection continue doit être précisé ;
- `docs/LAB_CURRENT_WORK.md`.

### Protégé

- `Combat Runtime`, `Combat Session`, `Action Resolver` : aucune modification prévue sauf preuve RED d'un défaut d'autorité ;
- dégâts, énergie, cooldown, clash, esquive et `impactAtMs` sémantique ;
- aucune logique par ID de compétence ;
- aucun timer supplémentaire ;
- aucun observer/listener global ;
- aucun second moteur de collision ;
- aucun changement dans `Zombicide-40k` ;
- aucun merge vers `main`.

### TDD prévu

1. RED : un projectile traversant entièrement la cible entre deux frames doit produire exactement un signal de contact ;
2. RED : un chevauchement projectile/cible doit compter comme contact même si le centre du projectile est encore hors du modèle ;
3. RED : déplacement simultané de la cible et du projectile ne doit pas créer de faux négatif ;
4. le capteur doit rester borné à la vie du projectile et émettre au plus une fois ;
5. les tests Runtime/Presenter existants doivent rester GREEN sans changement ;
6. suite complète GREEN puis checkpoint/preview smartphone.

État : **LOT OUVERT — RED avant correction**.


### Résultat technique — Projectile Contact Precision V2

RED confirmé :
- commit : `6aeb1a6d03e4c0a9e0eef2b2566f0a0c91f934ff` ;
- CI : `37004600908` — FAILURE attendue ;
- **818 anciens tests PASS**, 3 nouveaux échecs exactement sur les défauts recherchés :
  1. tunneling d'un projectile à travers une cible stationnaire entre deux frames ;
  2. chevauchement du bord du projectile avec le modèle alors que son centre reste hors cible ;
  3. croisement entre deux objets mobiles entre deux observations.

Correction :
- `d9528f992a6cefd8220ab04aa2f59b610709c60b` : remplacement du test ponctuel `centre projectile ∈ rectangle cible` par une détection continue fondée sur les rectangles réellement rendus ;
- le capteur conserve les rectangles projectile/cible de l'observation précédente ;
- à chaque frame, il vérifie :
  - chevauchement de surface courant ;
  - balayage continu en mouvement relatif entre les deux observations ;
  - variation de taille entre les observations ;
- aucune suppression projectile, aucun dégât, aucune résolution n'est effectué dans le renderer ;
- après le premier signal, le capteur cesse immédiatement de programmer des frames.

Durcissement :
- `d86eb71c8a4432243cb441d29d780cae771020ca` : test de non-faux-positif ajouté pour deux trajectoires mobiles qui restent séparées ;
- CI complète : `37004829844` — SUCCESS ;
- suite : **822/822 PASS, 0 FAIL**.

Autorité inchangée :
`DOM Skill FX capteur -> Combat Runtime.reportProjectileContact() -> Combat Session / Action Resolver -> onResolved -> Presenter`.

Aucun changement dans :
- Combat Runtime ;
- Combat Session ;
- Action Resolver ;
- dégâts / énergie / cooldown ;
- projectile clash ;
- esquive ;
- définition de Boule de feu ;
- `Zombicide-40k`.

Aucun timer supplémentaire, aucun observer global, aucune logique spéciale par ID de compétence, aucun second moteur de collision.

PREVALIDATION smartphone requise :
1. faire avancer l'ennemi vers Boule de feu à plusieurs vitesses ;
2. tester également un croisement rapide projectile/cible ;
3. vérifier qu'aucune boule ne traverse le modèle ;
4. vérifier que l'impact apparaît immédiatement après disparition ;
5. vérifier qu'un passage réellement à côté ne provoque pas d'impact fantôme.

État : **GREEN technique — scellement puis checkpoint/preview**.


### Recadrage vrai chemin — raccord contact FX -> Runtime

Retour smartphone après la première correction géométrique : le projectile traverse encore la cible.

Diagnostic sur le HEAD réel :
- `createDomSkillFxRenderer()` calcule bien le contact et expose `onProjectileContact` ;
- dans **les deux composition roots réelles** (`combat-test-ui.js` et `combat-2v2-test-ui.js`), le callback `onProjectileContact(contact) { runtime?.reportProjectileContact(contact); }` est actuellement passé par erreur à `createDomCombatAudio()` ;
- le renderer FX n'obtient donc **aucun callback de contact en jeu réel** ;
- les tests précédents validaient seulement la présence textuelle du callback près de l'appel Runtime et n'ont pas verrouillé qu'il appartenait au constructeur FX.

Conséquence : le capteur géométrique fonctionne isolément, mais son signal n'atteint jamais l'autorité `Combat Runtime` dans la preview réelle.

Périmètre étendu avant correction :
- `src/ui/combat-test-ui.js` ;
- `src/ui/combat-2v2-test-ui.js` ;
- test de composition dédié ;
- documentation uniquement si nécessaire.

Autorité inchangée :
`DOM Skill FX -> Combat Runtime.reportProjectileContact() -> Combat Session / Action Resolver -> Presenter`.

Interdictions maintenues :
- aucune résolution/dégât dans l'UI ;
- aucune nouvelle API Runtime ;
- aucune seconde autorité ;
- aucun timer/observer/listener compensatoire ;
- aucune logique spéciale Boule de feu.

TDD : ajouter d'abord une sentinelle RED qui démontre que le callback est absent de `createDomSkillFxRenderer()` et présent à tort dans `createDomCombatAudio()`.


### Résultat vrai chemin — raccord FX contact vers Runtime

RED dédié :
- commit : `ad517b6825bda848ccd376ee65d1c673abde3638` ;
- CI : `37005789169` — FAILURE attendue ;
- **822 tests historiques PASS**, 1 nouvel échec :
  - le callback `onProjectileContact` n'était pas fourni à `createDomSkillFxRenderer()` dans le vrai chemin UI.

Cause confirmée :
- dans `combat-test-ui.js` et `combat-2v2-test-ui.js`, le callback
  `onProjectileContact(contact) { runtime?.reportProjectileContact(contact); }`
  était passé par erreur à `createDomCombatAudio()` ;
- `createDomSkillFxRenderer()` ne recevait donc aucun callback ;
- le capteur géométrique pouvait détecter un contact en interne sans que ce signal atteigne jamais le propriétaire sémantique `Combat Runtime` ;
- cela explique la traversée observée en preview malgré les tests unitaires géométriques GREEN.

Correction minimale :
- `3c782456d30d836e9814fc80d42d761e314ef28b` : raccord 1v1 déplacé de l'adaptateur audio vers le renderer FX ;
- `1bf16dce617997ac1eb1fd58e5c7ecfc7957bbae` : même correction pour le 2v2 ;
- aucune API Runtime ajoutée ;
- aucune nouvelle autorité ;
- aucune résolution, aucun dégât et aucune collision métier dans l'UI ;
- l'audio ne reçoit plus de callback de contact projectile.

Sentinelle permanente :
- `tests/unit/projectile-contact-wiring-v2.test.mjs` inspecte séparément la configuration de `createDomSkillFxRenderer()` et celle de `createDomCombatAudio()` ;
- elle exige le routage `FX -> runtime.reportProjectileContact()` ;
- elle interdit explicitement ce routage dans l'audio.

Validation :
- CI : `37005862900` — SUCCESS ;
- suite complète : **823/823 PASS, 0 FAIL**.

Chaîne réelle désormais raccordée :
`DOM Skill FX continuous sensor -> onProjectileContact -> Combat Runtime.reportProjectileContact() -> Combat Session / Action Resolver -> onResolved -> Presenter -> suppression projectile -> impact immédiat`.

État : **GREEN technique corrigé sur vrai chemin — checkpoint/preview à avancer sur le HEAD final, PREVALIDATION smartphone requise**.


## Micro-lot — Visible Model Contact V3 — 2026-10-02

Base exacte : `731c32c01dd834493055efad42fa49bec198736a` (Projectile Contact Precision V2 — vrai chemin raccordé, GREEN technique publié).

- checkpoint de départ : `checkpoint/lab-start-visible-model-contact-v3-2026-10-02` ;
- branche : `work/lab-visible-model-contact-v3-2026-10-02`.

### Retour utilisateur

Après raccord du vrai chemin, Boule de feu peut maintenant disparaître avant le contact visuellement perçu.

Hypothèse utilisateur confirmée par audit :
- le capteur mesure actuellement `.fighter__motion`, un conteneur carré `aspect-ratio:1` ;
- ce conteneur reçoit bien les vrais `displayScale`, position, transform-origin et animations ;
- mais les sprites réels contiennent des marges transparentes importantes ;
- le rectangle DOM du conteneur n'est donc pas la silhouette réellement visible ;
- le projectile lui-même est rendu dans un shell carré alors que son noyau visuel suit déjà `coreAnchor`.

### Objectif

Aligner le contact sur **ce que le joueur voit**, sans hitbox manuelle et sans nouvelle autorité gameplay.

Chaîne cible inchangée :

`visual sprite -> visual collision sensor -> Combat Runtime.reportProjectileContact() -> Combat Session / Action Resolver -> Presenter`.

### Géométrie canonique prévue

1. **Cible**
   - dériver automatiquement un masque opaque depuis l'image de créature réellement chargée ;
   - aucune valeur métier/manuelle par créature ;
   - le masque appartient à la présentation ;
   - trois repères DOM enfants du même `data-demo-motion` permettent de relire la transformation écran réelle (translation, scale, rotation, transform-origin, distance) ;
   - le capteur projette le trajet du projectile dans l'espace local du sprite et teste les pixels opaques.

2. **Projectile**
   - le point de collision canonique est le noyau de trajectoire déjà défini par `coreAnchor` ;
   - le shell carré et la traînée transparente ne deviennent pas une hitbox ;
   - balayage continu frame précédente -> frame courante conservé pour éviter le tunneling.

### Autorités

- pixels/transform visuels : Visual Controller / Render Adapter ;
- détection géométrique : unique capteur visuel ;
- acceptation temporelle du contact : Combat Runtime ;
- résultat/dégâts : Combat Session / Action Resolver ;
- disparition/impact : Presenter.

### Interdictions

- aucune hitbox codée en dur par ID de créature ou compétence ;
- aucun offset compensatoire ;
- aucune seconde horloge ;
- aucun timer/observer global ;
- aucun calcul de dégâts dans le renderer/UI ;
- aucun changement de `Zombicide-40k` ;
- aucun merge vers `main`.

### TDD

1. RED : un point projectile situé dans la marge transparente du sprite ne doit pas déclencher de contact ;
2. RED : le même point sur un pixel opaque doit déclencher ;
3. RED : translation/scale/rotation de la cible doivent être pris via la même géométrie transformée ;
4. RED : un balayage rapide du noyau projectile à travers une zone opaque doit être détecté même entre deux frames ;
5. RED composition : les deux clients combat doivent fournir au FX renderer le même fournisseur de géométrie visible du Visual Controller ;
6. anciennes sentinelles Runtime/wiring/clash/impact restent GREEN.

État : **LOT OUVERT — RED avant correction**.


### Résultat technique — Visible Model Contact V3

Cause réelle confirmée :
- le vrai raccord FX -> Runtime était corrigé, mais le capteur utilisait encore une géométrie différente de celle perçue par le joueur ;
- `.fighter__motion` est un carré de présentation ; les sprites Capture contiennent des marges transparentes parfois importantes ;
- le shell projectile est également carré alors que le noyau visuel de trajectoire est déjà défini par `coreAnchor` ;
- une collision de rectangles pouvait donc résoudre l'action dans une zone transparente et faire disparaître Boule de feu avant le contact visible.

RED :
- commit : `13ef4a466931cc5a8260e51c14c5d6cdadfe9fae` ;
- CI : `37007930279` — FAILURE attendue ;
- **823 anciens tests PASS**, 1 nouveau fichier RED absent au départ.

Correction :
- `a257aafd6ffd030c6ed4cd5be35c710b40ba4220` : nouveau module `dom-visible-model-contact.js` ;
- `e0dbe0fc0fbd486b1936d76ee3f868bb49fb5241` : Visual Controller raccordé au masque opaque réel du sprite chargé ;
- `f824cf5a33962bdec0cf8e377a2d2440e6b382dd` : FX projectile basculé du rectangle DOM vers noyau projectile + masque sprite ;
- `f55b93d01eaec796e24b1b1f9cd7159ba115550a` et `9ce4aa5b926bfeb474b15725302595fcf8dfa9f2` : clients 1v1/2v2 raccordés au modèle unique `visuals.getCollisionModelFor()` ;
- `2801229e7d6f71fc4e208a52d05357eca25a56ba` et `615389186214532dfcbe7fc8ae9d0434788861c3` : anciennes sentinelles alignées sur le nouveau contrat, notamment retrait de l'ancien invariant faux « overlap shell = contact ».

Géométrie obtenue :
1. le masque opaque est calculé automatiquement depuis l'image réellement chargée ;
2. les marges transparentes ne participent plus au contact ;
3. aucun réglage de hitbox manuel n'est ajouté à la créature ;
4. trois repères enfants du même `data-demo-motion` suivent les vraies translation / scale / rotation / transform-origin / distance ;
5. le noyau projectile déjà aligné sur `coreAnchor` est le point projectile canonique ;
6. le balayage continu dans l'espace local du sprite empêche le tunneling entre deux frames ;
7. le shell, la traînée et les pixels transparents du projectile ne provoquent plus une disparition anticipée.

Autorité inchangée :
`sprite visible / Visual Controller -> capteur FX -> Combat Runtime.reportProjectileContact() -> Combat Session / Action Resolver -> Presenter`.

Le Render Adapter ne décide toujours ni dégâts, ni résultat, ni cible, ni ordre temporel.

Validation fonctionnelle :
- CI : `37008481970` — **SUCCESS** ;
- suite complète : **827/827 PASS, 0 FAIL** ;
- tests dédiés GREEN :
  - marge transparente = pas de collision ;
  - pixel opaque = collision ;
  - mapping écran/sprite sous translation + scale + rotation ;
  - balayage du noyau sans tunneling ;
  - deux clients utilisent le modèle du Visual Controller comme seule géométrie cible ;
  - overlap du shell sans noyau dans le modèle = pas de contact.

Aucune modification de :
- Combat Runtime ;
- Combat Session ;
- Action Resolver ;
- dégâts / énergie / cooldown ;
- projectile clash ;
- définition Boule de feu ;
- `Zombicide-40k`.

Aucun timer supplémentaire, aucun observer global, aucune hitbox par ID, aucune seconde autorité.

État : **GREEN technique — scellement documentaire puis checkpoint/preview et PREVALIDATION smartphone**.


## Micro-lot — Universal Visible Contact V1 — 2026-10-02

Base exacte : `f7bd044c10445923c7b7f215f538f4959a3004e2` (Visible Model Contact V3 — GREEN technique publié et prévalidé utilisateur).

- checkpoint de départ : `checkpoint/lab-start-universal-visible-contact-v1-2026-10-02` ;
- branche : `work/lab-universal-visible-contact-v1-2026-10-02`.

### Demande utilisateur

Le même défaut de synchronisation doit être corrigé pour **toutes les capacités où la créature se déplace vers sa cible** :
- Griffe ;
- attaques de contact au sol ;
- approches aériennes ;
- téléportations ;
- futures capacités `form:"contact"` utilisant une approche mobile.

Aucune règle spéciale par compétence n'est autorisée.

### Diagnostic architecture

Le système projectile possède maintenant :
`modèle visible cible -> capteur de contact -> Runtime -> résolution -> Presenter`.

Les attaques de contact utilisent encore :
`release -> playApproachFor(travelMs) -> impactAtMs nominal`.

Le mouvement visuel atteint une destination calculée, mais **aucun contact modèle-à-modèle n'est remonté au Runtime**. Le résultat peut donc diverger de ce que le joueur voit si scale, position, rotation, profil de locomotion ou mouvement adverse modifient le premier contact réel.

### Objectif

Créer **une seule autorité de contact d'action côté Combat Runtime**, consommable par les sources visuelles de contact :
- projectile : noyau projectile -> masque opaque cible ;
- contact mobile : masque opaque attaquant -> masque opaque cible.

Le renderer / Visual Controller restent des capteurs géométriques et n'appliquent jamais dégâts ni résultat.

### Refactor moteur prévu

Remplacer la spécialisation `reportProjectileContact()` par une API générique du Runtime, par exemple `reportActionContact()`, qui :
1. traite d'abord tous les événements Runtime déjà dus ;
2. vérifie l'action active, sa cible et son état released ;
3. n'accepte que les formes dont le contact visuel est autoritaire :
   - `form:"projectile"` ;
   - `form:"contact"` avec `approachMode` mobile `ground|aerial|teleport` ;
4. dérive l'impact effectif de l'horloge Runtime exactement comme aujourd'hui ;
5. appelle l'unique `processResolution()`.

Aucune seconde API concurrente ne doit rester propriétaire du même résultat.

### Géométrie contact mobile

Réutiliser `dom-visible-model-contact.js` et les `collisionModel` déjà produits par le Visual Controller.

Le contact modèle-à-modèle doit :
- ignorer les marges transparentes ;
- utiliser les mêmes transformations réellement affichées ;
- fonctionner si la cible bouge en même temps ;
- ne pas tunneler entre deux frames ;
- être indépendant des IDs/noms de compétences et créatures.

### Fichiers autorisés

- `src/core/combat/combat-runtime.js` ;
- `src/adapters/renderer/dom-visible-model-contact.js` ;
- `src/ui/demo-app.js` ;
- `src/adapters/renderer/combat-resolution-presenter.js` si nécessaire pour le raccord présentation ;
- `src/ui/combat-test-ui.js` ;
- `src/ui/combat-2v2-test-ui.js` ;
- tests unitaires dédiés ;
- `docs/LAB_ARCHITECTURE.md` ;
- `docs/LAB_CURRENT_WORK.md`.

### Protégé

- `Combat Session` / `Action Resolver` sauf preuve RED explicite ;
- dégâts / énergie / cooldown / réactions / clash ;
- SkillDefinition source ;
- aucun timer global ;
- aucun observer global ;
- aucune hitbox manuelle par créature ;
- aucune logique `if skillId === "claw"` ou équivalente ;
- aucun changement dans `Zombicide-40k` ;
- aucun merge vers `main`.

### TDD prévu

1. RED Runtime : contact `form:"contact" + ground` doit pouvoir avancer l'impact effectif avant `impactAtMs` nominal ;
2. RED Runtime : `contact + aerial` et `contact + teleport` utilisent la même API ;
3. RED Runtime : `contact + none` ou forme non éligible est refusée ;
4. RED géométrie : deux masques opaques mobiles se touchant entre deux frames sont détectés ;
5. RED géométrie : marges transparentes qui se chevauchent ne déclenchent rien ;
6. RED composition : `playApproachFor()` utilise les deux `collisionModel` du Visual Controller et émet un seul signal ;
7. RED composition : projectile et contact mobile convergent vers la même API Runtime ;
8. suite complète GREEN puis checkpoint/preview smartphone.

État : **LOT OUVERT — RED avant correction**.


### Résultat technique — Universal Visible Contact V1

Base :
- `f7bd044c10445923c7b7f215f538f4959a3004e2` ;
- Visible Model Contact V3 déjà GREEN et prévalidé utilisateur.

#### RED moteur

Commit :
- `2330a8e1a1d9a1e9fb9efeb1a168cfe31510eb82`.

CI :
- `37030356273` — FAILURE attendue ;
- **827 tests historiques PASS** ;
- 6 nouveaux échecs démontrant que l'ancienne autorité était encore `reportProjectileContact()` et qu'aucune API générique n'existait.

#### Refactor autorité Runtime

Commit principal :
- `3e56e96bb45feac6568e4786812a4c499c6e74b6`.

Résultat :
- `Combat Runtime` expose désormais **une seule** API de contact visuel : `reportActionContact()` ;
- l'ancienne `reportProjectileContact()` n'est plus exposée ;
- sont autorisés par contrat :
  - `form:"projectile"` ;
  - `form:"contact" + approachMode:"ground|aerial|teleport"` ;
- `contact + none` et autres formes non autoritaires sont refusées ;
- un `skillId` optionnel protège contre les signaux retardés d'une ancienne animation ;
- la résolution continue de passer exclusivement par `processResolution() -> Combat Session -> Action Resolver`.

Migration du raccord projectile vers l'autorité générique :
- `483c53382b0b6b2059197183376c09df6e061b0f` — 1v1 ;
- `817648a119a6cc25aff2fc8a630485d129306fa8` — 2v2 ;
- `d8715440964ad9590083744047f56af048784eec` — sentinelles Runtime existantes ;
- `cf1c8c7924faa98fdd87275902fd57cb5bf6e08c` — sentinelle wiring.

CI après migration :
- `37030692092` — SUCCESS.

#### RED géométrie modèle↔modèle

Commit :
- `3b390ed540eae5cb6eed03a49e25ec90ce57c525`.

CI :
- `37030879685` — FAILURE attendue ;
- **833 tests PASS**, seul le nouveau fichier géométrique échoue faute d'API modèle↔modèle.

Correction :
- `6cba342e055e9669200db07dadd950cb130ad006`.

Le module canonique `dom-visible-model-contact.js` sait désormais :
- tester deux silhouettes opaques transformées ;
- ignorer les marges transparentes ;
- utiliser les transforms écran réelles ;
- balayer les contours opaques entre deux frames ;
- prendre en compte le mouvement relatif des deux créatures ;
- éviter le tunneling.

CI :
- `37031056574` — SUCCESS.

#### RED watcher / vrai raccord approche

Commit :
- `4d64d967ba94b222ac799679926ff781a563f88c`.

CI :
- `37031376724` — FAILURE attendue ;
- **838 tests PASS**, seul le watcher d'approche manque.

Correction :
- `305c492e4e29f7447b00071b2e5f0034ec061ed6` — watcher modèle↔modèle borné à l'approche ;
- `44072d38cec82e84f920aa966fa79be2ee7e0e2f` — `playApproachFor()` consomme les deux `collisionModel` ;
- `512ef84e55d0cf95237253136f7b1af700bb50af` — Presenter transmet le contact mobile ;
- `ef96df5d2dd680c4cf9a388543f442804a70fe73` — 1v1 vers `runtime.reportActionContact()` ;
- `f46b9dc3d8ff614f424a12ce2d1610ac07dbc5ba` — 2v2 vers la même API ;
- `3593c8bbd030fbf8d7109d0ed016f2de0ff11315` — ancienne sentinelle 2v2 alignée sans perte de couverture.

Politique par approche :
- `ground` : balayage continu modèle↔modèle ;
- `aerial` : balayage continu modèle↔modèle ;
- `teleport` : même géométrie mais **sans balayage du saut invisible** ; seul le chevauchement réellement affiché compte.

CI :
- `37031850425` — SUCCESS ;
- **841/841 PASS**.

#### Durcissement vrai moteur / vraies compétences

Commit :
- `511eb9be88433f729658d17e6a1b34766b1be149`.

Validation avec les vraies données :
- `claw.skill.json` / Griffe / ground ;
- `aerial-dive.skill.json` / Plongeon aérien ;
- `teleport-strike.skill.json` / Frappe téléportée.

Pour les trois :
- aucun dégât avant contact ;
- contact visible accepté -> impact effectif avancé ;
- vrais dégâts appliqués immédiatement par `Combat Session / Action Resolver` ;
- `skill-arrive` et `hit` portent le même timestamp effectif ;
- un contact retardé portant le `skillId` d'une ancienne capacité est refusé (`skill_mismatch`).

CI :
- `37032119977` — SUCCESS ;
- **845/845 PASS, 0 FAIL**.

### Autorité finale

`sprite/projectile visible -> capteur géométrique -> Combat Runtime.reportActionContact() -> Combat Session / Action Resolver -> onResolved -> Presenter`.

Il n'existe plus deux propriétaires de l'impact entre projectile et contact mobile.

### Invariants conservés

Aucun changement dans :
- `Combat Session` ;
- `Action Resolver` ;
- valeurs de dégâts ;
- énergie ;
- cooldown ;
- règles d'esquive/blocage/réflexion ;
- Projectile Power / clash ;
- données de Griffe, Plongeon ou Frappe téléportée ;
- `Zombicide-40k`.

Aucun :
- timer global ajouté ;
- observer global ajouté ;
- hitbox manuelle par compétence/créature ;
- branchement par ID de compétence ;
- second moteur de collision ;
- merge vers `main`.

État : **GREEN technique — scellement documentaire, checkpoint/preview puis PREVALIDATION smartphone**.


## Micro-lot — Skill Selector Grouping V1 — 2026-10-02

Base exacte : `5aed8b3c9a7963edb06b5cca17fa676c924451c6` (Universal Visible Contact V1 — checkpoint/preview GREEN).

- checkpoint de départ : `checkpoint/lab-start-skill-selector-grouping-v1-2026-10-02` ;
- branche : `work/lab-skill-selector-grouping-v1-2026-10-02`.

### Retour utilisateur

Dans l'éditeur Capture, les capacités sont difficiles à parcourir lorsqu'il faut soit modifier une capacité existante, soit lier une capacité à une créature.

### Objectif

Rendre ces sélecteurs lisibles sans modifier les données ni la logique métier :
1. regrouper visuellement les capacités par élément ;
2. dans chaque élément, trier par niveau requis croissant ;
3. à niveau égal, trier par nom ;
4. appliquer la même règle à la bibliothèque de modification et aux sélecteurs de loadout créature.

### Autorité

- les capacités configurées restent l'unique source de vérité ;
- le classement est une projection UI pure ;
- aucun duplicat de catalogue ni cache métier n'est créé.

### Fichiers autorisés

- `src/ui/capture-editor-human-v2.js` ;
- tests unitaires dédiés ;
- `docs/LAB_CURRENT_WORK.md`.

### Protégé

- définitions de capacités ;
- Combat Runtime / Session / Action Resolver ;
- règles de progression et de déverrouillage ;
- données créatures ;
- autres dépôts, notamment `Zombicide-40k` ;
- aucun merge vers `main`.

### TDD prévu

1. RED : ordre élément -> niveau -> nom pour les entrées de bibliothèque ;
2. RED : génération de groupes visuels par élément ;
3. RED : même classement pour les capacités équipables standard et ultime ;
4. suite complète GREEN ;
5. checkpoint GREEN + preview pour validation utilisateur.

État : **LOT OUVERT — TDD avant correction**.


### Résultat technique — Skill Selector Grouping V1

TDD RED :
- commit : `8696c14108dde74e8f3dce1335915e0313e46953` ;
- CI : `37040238067` — FAILURE attendue ;
- la nouvelle sentinelle exigeait le regroupement élémentaire et l'ordre niveau -> nom avant que l'API de projection n'existe.

Implémentation :
- `humanSkillSelectorGroupsV1()` est une projection UI pure des capacités configurées ;
- ordre des groupes : Feu, Eau, Terre, Air, Électricité, Lumière, Ombre, Nature, Glace, Poison, Acier, Psy, Esprit, puis Neutre ;
- dans chaque groupe : niveau requis croissant, puis nom ;
- la bibliothèque « capacité à modifier » utilise des `optgroup` par élément ;
- les sélecteurs de capacités équipées de la créature utilisent exactement la même projection ;
- les capacités Ultimes restent dans leur slot Ultime et sont seulement classées à l'intérieur de ce sélecteur.

Revue de non-régression :
- une suppression accidentelle des appels de peuplement des slots a été détectée avant preview ;
- sentinelle ajoutée au commit `692618b850c0b43e10d9255e5fc877bba0c7d531` ;
- correction : `cfffc5349de12999bf4e3b6f112b3c0ee29f60a1` ;
- les quatre slots standards et le slot Ultime sont explicitement repeuplés après regroupement.

Validation :
- CI : `37040450384` — SUCCESS ;
- suite complète : **848/848 PASS, 0 FAIL**.

Invariants :
- aucune définition de capacité modifiée ;
- aucun niveau requis modifié ;
- aucun loadout métier modifié par le tri ;
- aucune nouvelle source de vérité ;
- aucun changement Combat Runtime / Session / Action Resolver ;
- aucun changement dans `Zombicide-40k` ;
- aucun merge vers `main`.

État : **GREEN technique — scellement documentaire puis checkpoint/preview utilisateur**.


## Chantier — Combat Feedback Readability V1 — 2026-10-02

Base exacte : `39920ab16462510cb04bf2e1d2dd5b75380a8734` (Skill Selector Grouping V1 — checkpoint/preview GREEN).

- checkpoint de départ : `checkpoint/lab-start-combat-feedback-readability-v1-2026-10-02` ;
- branche : `work/lab-combat-feedback-readability-v1-2026-10-02`.

### Retour utilisateur

Trois besoins de lisibilité combat :
1. afficher visuellement les dégâts réellement infligés par toute source de dégâts ;
2. pouvoir configurer un son de trajet pour les projectiles ;
3. rendre les debuffs/statuts visibles sur le modèle via coloration, sprite ou combinaison des deux.

### Sous-lot A — Dégâts visuels génériques

Principe : le visuel ne recalcule jamais les dégâts. Le Runtime compare les snapshots avant/après mutation et publie uniquement le delta PV réellement appliqué. L'UI/renderer affiche ce delta.

Chaîne cible :
`Combat Session / effets / DoT -> état HP -> Combat Runtime health-delta -> FX renderer -> nombre flottant`.

Doit couvrir : dégâts directs, zones, DoT/statuts et toute future source modifiant les PV.

### Sous-lot B — Son trajet projectile

Le contrat de présentation supporte déjà le slot audio `travel`, mais l'éditeur et le lecteur runtime ne le raccordent pas complètement.

Objectif :
- choix audio trajet dans l'éditeur ;
- persistance dans SkillPresentationBinding ;
- lecture au release/travel ;
- arrêt avec l'action/projectile si nécessaire ;
- aucune logique de combat dans l'audio.

### Sous-lot C — Visuel de statut/debuff

Le statut gameplay reste strictement `StatusEffectV1`.
Son apparence est portée par une nouvelle version de SkillPresentationBinding, sans champ visuel dans le contrat métier.

Modes prévus par statut :
- Aucun ;
- Coloration ;
- Sprite ;
- Sprite + coloration.

Paramètres présentation :
- couleur ;
- opacité coloration ;
- asset sprite ;
- échelle sprite ;
- opacité sprite.

Le renderer doit synchroniser l'apparence avec les statuts actifs du snapshot : apparition à l'application, maintien pendant la durée, retrait automatique à expiration/cleanse/dispel.

### Autorités

- dégâts / PV / statuts : Combat Session + moteurs métier existants ;
- détection du delta PV : Combat Runtime, projection uniquement ;
- audio : Audio Adapter ;
- apparence statut : Render Adapter ;
- éditeur : configuration seulement.

### Fichiers autorisés

- `src/core/combat/combat-runtime.js` ;
- nouveau helper de projection santé dans `src/core/combat/` ;
- `src/adapters/renderer/dom-skill-fx.js` ;
- nouveau renderer de statut si nécessaire ;
- `src/adapters/audio/dom-combat-audio.js` ;
- `src/adapters/renderer/capture-skill-presentation-assets-v2.js` ;
- `src/contracts/skill-presentation-binding*.js` ;
- `src/ui/demo-app.js` ;
- `src/ui/combat-test-ui.js` ;
- `src/ui/combat-2v2-test-ui.js` ;
- `src/ui/capture-editor-human-v2.js` ;
- `examples/dom-demo/capture-editor-v2.html` ;
- `examples/dom-demo/demo.css` ;
- tests dédiés ;
- documentation architecture/current work.

### Protégé

- Action Resolver et règles de dégâts sauf preuve RED explicite ;
- définition métier de StatusEffectV1 ;
- valeurs dégâts/résistances ;
- logique énergie/cooldown/clash ;
- aucune seconde boucle/timer global ;
- aucun observer global ;
- aucun branchement par skillId/statusId en dur ;
- aucun changement dans `Zombicide-40k` ;
- aucun merge vers `main`.

### TDD

A. dégâts : RED delta HP réel -> callback Runtime -> nombre flottant 1v1/2v2 ;
B. audio : RED champ éditeur -> binding travel -> lecture runtime ;
C. statut : RED binding présentation indépendant -> rendu tint/sprite -> retrait à expiration ;
D. suite complète GREEN puis checkpoint/preview utilisateur.

État : **CHANTIER OUVERT — TDD avant implémentation**.


### Résultat technique — Combat Feedback Readability V1

Base :
- `39920ab16462510cb04bf2e1d2dd5b75380a8734` ;
- Skill Selector Grouping V1 GREEN.

#### RED dédiés

- dégâts génériques : `0dddb9346d7b5b3825a0725036d6d6530a7b3edc` — CI `37042292961` FAILURE attendue ;
- son trajet projectile : `49d0f2bed5808389396fda501f9cec29c5dd14c9` — CI `37042297797` FAILURE attendue ;
- visuel statuts : `7cd99c2e62cf8b5eb2c5a40c01a4eaefb7ab23de` — CI `37042303719` FAILURE attendue.

#### A — Dégâts visuels génériques

Nouveau propriétaire de projection :
- `src/core/combat/combat-health-feedback-v1.js`.

Le Runtime publie `onHealthDelta` uniquement à partir du changement HP entre snapshots autoritaires.

Le renderer affiche un nombre flottant `-X` sur la vraie cible.

Aucune formule de dégâts n'est copiée dans l'UI.

Le système couvre automatiquement :
- dégâts directs ;
- dégâts de zone ;
- DoT/statuts ;
- toute future mutation négative des PV passant par la session.

#### B — Son de trajet projectile

Le slot existant `audio.travel` est maintenant raccordé complètement :
- choix dans l'éditeur ;
- catégorie audio `travel` ;
- sauvegarde/import/export dans la présentation ;
- lecture au trajet projectile ;
- boucle pendant le trajet pour les capacités éditées ;
- arrêt à l'impact, clash, interruption ou annulation.

Le Presenter reste propriétaire du cycle de présentation ; l'Audio Adapter reste lecteur.

#### C — Visuel persistant des statuts

Ajout de `SkillPresentationBindingV3` avec `statusVisuals`.

`StatusEffectV1` est resté strictement inchangé.

L'éditeur permet pour chaque effet `apply_status` :
- Aucun ;
- Coloration du modèle ;
- Sprite autour du modèle ;
- Sprite + coloration.

Paramètres :
- couleur et intensité ;
- sprite ;
- scale ;
- opacité.

Aides de couleur initiale :
- poison/toxique : vert ;
- brûlure/feu : rouge ;
- glace/gel : bleu ;
- électrique/choc : jaune ;
- autre : violet.

Le renderer `dom-status-fx.js` suit uniquement le snapshot de statuts réel ; aucun timer de durée supplémentaire n'est créé.

Les clients 1v1 et 2v2 utilisent le même renderer et le même registre de présentation.

#### Revue des anciennes sentinelles

Deux invariants historiques ont été recadrés car ils étaient devenus faux :
- la sentinelle « miss » interdisait le mot `damage` dans toute la CSS ; elle vérifie désormais uniquement le bloc CSS de `miss` ;
- la sentinelle audio imposait exactement 5 sélecteurs ; elle attend désormais les 6 sélecteurs voulus, dont le nouveau trajet projectile.

Aucune couverture métier n'a été retirée.

#### Validation

- CI technique : `37043728390` — SUCCESS ;
- sentinelle vrai chemin statut : `44643333851c8d5c99a80eb957bcb254502b84dd` ;
- CI vrai chemin : `37043873261` — SUCCESS ;
- suite complète : **860/860 PASS, 0 FAIL**.

#### Invariants

Aucun changement dans :
- Action Resolver ;
- règles de dégâts/résistances ;
- valeurs de capacités ;
- énergie/cooldown/clash ;
- contrat gameplay `StatusEffectV1` ;
- `Zombicide-40k`.

Aucun :
- second moteur de dégâts ;
- timer global ;
- observer global ;
- branchement par `skillId` ou `statusId` en dur ;
- merge vers `main`.

État : **GREEN technique — documentation finale puis checkpoint/preview utilisateur**.


## Chantier — DoT Editor Clarity V1 — 2026-10-02

Base exacte : `39ce78a21368394b1ea9933996a3ae4feeb33859` (Combat Feedback Readability V1 GREEN).

- checkpoint de départ : `checkpoint/lab-start-dot-editor-clarity-v1-2026-10-02` ;
- branche : `work/lab-dot-editor-clarity-v1-2026-10-02`.

### Retour utilisateur

Création d'une capacité de type debuff uniquement (« Morsure bourdon ») bloquée/complexifiée par :
1. le canal des dégâts périodiques saisi en texte libre au lieu du sélecteur d'élément déjà utilisé ailleurs ;
2. un champ de tags de statut exposé alors qu'il est optionnel et inutile dans ce cas simple.

### Objectif

- aligner le DoT sur la même UX que les dégâts de zone :
  - option « Même élément que la capacité » ;
  - liste des éléments connus ;
  - surcharge explicite possible ;
- si « Même élément » est choisi, le builder résout le canal depuis `SkillDefinition.element` sans seconde autorité ;
- retirer le champ tags du parcours normal `apply_status` ;
- préserver silencieusement les tags déjà présents lors de l'édition d'anciennes capacités ;
- conserver les tags ciblés pour `cleanse/dispel`, où ils ont une vraie fonction métier.

### Autorités

- élément principal : `SkillDefinition.element` ;
- surcharge DoT éventuelle : `StatusEffectV1.channel` ;
- résolution du fallback : Human Editor au moment de construire le draft ;
- runtime/status contracts inchangés.

### Protégé

- aucun changement aux formules de dégâts ;
- aucun changement au runtime des statuts ;
- aucun nouveau champ métier ;
- aucun second registre d'éléments ;
- aucun changement dans `Zombicide-40k` ;
- aucun merge vers `main`.

### TDD

- RED : DoT avec canal vide + élément de capacité => canal final hérité ;
- RED : UI DoT utilise le sélecteur d'élément commun ;
- RED : tags de statut non exposés dans `apply_status`, mais anciens tags préservés ;
- suite complète GREEN.

État : **CHANTIER OUVERT — TDD avant implémentation**.


### Résultat technique — DoT Editor Clarity V1

Correctif : `65449a862b1ea37843e95ec11eee8eef744060ef`.

#### Élément des dégâts périodiques

Le champ texte libre a été supprimé.

Le DoT utilise maintenant le sélecteur canonique déjà utilisé par les zones :
- « Même élément que la capacité » ;
- Feu ;
- Eau ;
- Terre ;
- Air ;
- Électricité ;
- Lumière ;
- Ombre ;
- Nature ;
- Glace ;
- Poison ;
- Acier ;
- Psy ;
- Esprit.

Quand « Même élément que la capacité » est choisi :
- aucune seconde valeur d'élément n'est créée ;
- le builder utilise directement `SkillDefinition.element` comme canal du DoT ;
- une surcharge reste possible en sélectionnant explicitement un autre élément.

Le cas de test `Morsure bourdon` (élément Poison, DoT sans override) produit donc un `StatusEffectV1.channel = "poison"`.

#### Tags de statut

Le champ « Tags » a été retiré du parcours normal `apply_status`.

Pour une nouvelle capacité :
- aucun tag n'est demandé ;
- le statut reçoit simplement `tags: []`.

Pour une ancienne capacité :
- les tags existants sont conservés silencieusement dans l'état de la ligne d'édition ;
- enregistrer la capacité ne les détruit pas.

Les tags « à cibler » restent visibles uniquement pour `cleanse/dispel`, où ils servent réellement à sélectionner les statuts à retirer.

#### Validation

- RED : `333a5bfedc4a7c749ab91fa6f5ce0fc54aec81a8` — échec attendu ;
- GREEN : `65449a862b1ea37843e95ec11eee8eef744060ef` ;
- CI : `37049757197` — SUCCESS ;
- suite complète : **864/864 PASS, 0 FAIL**.

#### Invariants

- aucun changement au runtime des statuts ;
- aucun changement aux formules de dégâts ;
- aucun nouveau registre d'éléments ;
- aucune nouvelle autorité ;
- `StatusEffectV1` inchangé ;
- `Zombicide-40k` inchangé ;
- aucun merge vers `main`.

État : **GREEN technique — prêt pour preview utilisateur**.


## Chantier — Status Readability V2 — 2026-10-02

Base exacte : `3414ad1e23a2204daf79f26cdd4e381982b713c6` (DoT Editor Clarity V1 GREEN).

- checkpoint de départ : `checkpoint/lab-start-status-readability-v2-2026-10-02` ;
- branche : `work/lab-status-readability-v2-2026-10-02`.

### Retour utilisateur

1. la coloration du modèle est trop faible ou semble inactive, y compris avec une intensité réglée à `1` ;
2. les buffs/debuffs doivent aussi être visibles par des icônes sous la barre de vie.

### Diagnostic

La teinte actuelle est une couche masquée qui utilise `mix-blend-mode: color`.
Ce mode conserve fortement la luminosité du sprite d'origine : `tintOpacity = 1` ne signifie donc pas visuellement « couleur maximale ».

Les statuts actifs existent déjà dans l'unique snapshot autoritaire `fighter.statusEffects`. Aucune nouvelle mémoire de statut ni minuterie ne doit être créée pour les icônes.

### Objectif

#### A — Coloration

- conserver le masque basé sur l'alpha du sprite ;
- supprimer la dépendance à `mix-blend-mode: color` ;
- utiliser une superposition normale dont l'opacité est directement `tintOpacity` ;
- garantir le sens utilisateur :
  - `0` = aucune teinte ;
  - `0.5` = coloration moyenne ;
  - `1` = silhouette fortement/reellement colorée avec la couleur choisie.

#### B — Icônes buff/debuff sous PV

Le même `dom-status-fx.js` devient l'unique renderer de présentation des statuts :
- modèle : teinte/sprite ;
- HUD : icônes des statuts actifs.

Source unique :
`Combat Session -> snapshot fighter.statusEffects -> dom-status-fx.sync(state)`.

Chaque icône :
- correspond à un statut réellement actif ;
- porte sa polarité `beneficial / detrimental / neutral` ;
- affiche son stack si > 1 ;
- disparaît automatiquement quand le statut disparaît du snapshot ;
- utilise une icône configurée si disponible, sinon le sprite de statut, sinon un badge générique de polarité.

### Présentation

`SkillPresentationBindingV3.statusVisuals[statusId]` peut recevoir un asset `icon` optionnel.
Ce champ est purement visuel et ne modifie jamais `StatusEffectV1`.

### Protégé

- `StatusEffectV1` inchangé ;
- runtime des statuts inchangé ;
- aucune horloge/timer supplémentaire ;
- aucune copie de durée de statut ;
- aucun cache métier de statuts ;
- aucun branchement en dur par `statusId` ;
- aucun changement dans `Zombicide-40k` ;
- aucun merge vers `main`.

### TDD prévu

1. RED : intensité `1` produit une couche normale à opacité `1`, sans blend `color` ;
2. RED : un statut actif produit exactement une icône sous les PV, retirée à expiration ;
3. RED : buff/debuff utilisent la polarité du statut réel ;
4. RED : stack > 1 visible sans seconde autorité ;
5. RED : 1v1 et 2v2 exposent les hosts HUD au renderer unique ;
6. suite complète GREEN puis checkpoint/preview.

État : **CHANTIER OUVERT — TDD avant implémentation**.


### Résultat technique — Status Readability V2

Base :
- `3414ad1e23a2204daf79f26cdd4e381982b713c6` ;
- DoT Editor Clarity V1 GREEN.

#### Coloration corrigée

Le problème venait du rendu `mix-blend-mode: color`, qui conservait trop la luminance du sprite et rendait l'intensité `1` peu perceptible.

Correction :
- masque alpha du modèle conservé ;
- blend `color` supprimé ;
- blend normal explicite ;
- `tintOpacity` est maintenant directement l'intensité de la couche ;
- l'éditeur accepte clairement la plage `0 à 1`.

À `1`, la silhouette reçoit donc réellement la couleur choisie à intensité maximale.

#### Icônes buffs/debuffs sous les PV

Le renderer existant `dom-status-fx.js` a été étendu ; aucun second renderer métier n'a été créé.

Les icônes HUD :
- sont alimentées par les mêmes `fighter.statusEffects` que la teinte/sprite ;
- apparaissent sous les PV en 1v1 et 2v2 ;
- utilisent la polarité réelle du statut ;
- affichent `+` pour un buff, `−` pour un debuff et `•` pour neutral lorsqu'aucun sprite de statut n'est disponible ;
- réutilisent le sprite de statut lorsqu'il existe ;
- affichent le nombre de stacks quand `stacks > 1` ;
- disparaissent automatiquement dès que le statut n'est plus présent dans le snapshot ;
- ne réservent aucun espace HUD lorsqu'il n'y a aucun statut actif.

#### TDD / validation

- RED : `b9921ad87cbfa224fde3c113fce37116834a460c` ;
- corrections renderer/HUD : `1aa0ccad3a33c09d8ae68cc7fc87a1cad3e2bc51` -> `a7871c4163fcd81ea4062b7025af6278d423bbae` ;
- durcissement tests/UX : `7b9506a3cfbe7c164f7efe009365a297cd7a4e69`, `84b6043a26e056c33955a05d30cbf894ac7a249f`, `191885a1b30c4bd59a97bf77a966628018545f65`, `8fdfd8640f3d5530195d2adfb9cc902a635ec442` ;
- CI : `37052531285` — SUCCESS ;
- suite complète : **870/870 PASS, 0 FAIL**.

#### Invariants

Aucun changement dans :
- `StatusEffectV1` ;
- Status Effect Runtime ;
- Action Resolver ;
- formules de dégâts ;
- énergie/cooldown/clash ;
- `Zombicide-40k`.

Aucun :
- timer global ;
- observer global ;
- copie locale de durée/statut ;
- seconde autorité pour les stacks ;
- branchement en dur par identifiant de statut ;
- merge vers `main`.

État : **GREEN technique — scellement documentaire puis checkpoint/preview utilisateur**.


## Micro-lot — Editor Preview Status Wiring V1 — 2026-10-02

Base exacte : `fd1b7d638acd5c4bd55d7dca3047a5f05e9bfa75` (Status Readability V2 GREEN).

- checkpoint départ : `checkpoint/lab-start-editor-preview-status-wiring-v1-2026-10-02` ;
- branche : `work/lab-editor-preview-status-wiring-v1-2026-10-02`.

### Régression utilisateur reproduite

Depuis l'éditeur Capture, « Tester en combat » échoue avec :
`2v2 element not found: [data-combat-status-icons="local-1"]`.

Cause :
- le template 2v2 intégré à `capture-editor-v2.html` utilise correctement les actor IDs natifs `local-1/local-2/opponent-1/opponent-2` ;
- les nouveaux hosts HUD `data-combat-status-icons` ont été ajoutés à la démo 2v2 autonome, mais pas au template intégré de l'éditeur.

Deuxième trou de câblage du même chemin :
- `buildPreviewPresentationAssets()` ne relayait pas `statusPresentationFor(statusId)` vers le combat preview ;
- le combat aurait donc pu démarrer après ajout des hosts, mais sans teinte/sprite/icône de statut configurés depuis l'éditeur.

### Correctif visé

1. ajouter exactement un host d'icônes sous les PV pour chacun des 4 actor IDs du template éditeur ;
2. relayer `native.statusPresentationFor(statusId)` dans l'adapter de présentation preview ;
3. ne modifier ni IDs, ni format de combat, ni runtime de statut.

### Autorité

`battleFormat actor IDs + fighter.statusEffects + SkillPresentationBinding.statusVisuals` restent les seules autorités.

### TDD

- RED : template éditeur doit fournir les 4 hosts natifs ;
- RED : presentation adapter de preview doit relayer `statusPresentationFor` ;
- suite complète GREEN ;
- checkpoint/preview.

État : **LOT OUVERT — TDD avant correction**.


### Résultat — Editor Preview Status Wiring V1

Régression reproduite depuis le screen utilisateur :
`Impossible de lancer le combat : 2v2 element not found: [data-combat-status-icons="local-1"]`.

#### Cause

Le template 2v2 intégré à l'éditeur utilisait déjà les bons actor IDs natifs :
- `local-1` ;
- `local-2` ;
- `opponent-1` ;
- `opponent-2`.

Le problème était uniquement que les quatre nouveaux hosts HUD de statut n'avaient pas été ajoutés à ce template.

Un second trou du même chemin a été corrigé :
`buildPreviewPresentationAssets()` ne relayait pas `statusPresentationFor(statusId)`.

#### Correctifs

- ajout d'un `data-combat-status-icons` sous les PV pour chacun des 4 actor IDs natifs du template éditeur ;
- relais direct de `native.statusPresentationFor(statusId)` vers le combat preview ;
- aucun alias d'actor ID ;
- aucun changement de format de combat ;
- aucun changement au runtime de statuts.

#### TDD

- RED : `154af04a0af95e1956b1005a703aa20281dc2b6d` — CI `37054845994` FAILURE attendue ;
- hosts template : `ce9a5c1bb06f7c08a5c1f512612a38e8a4d5d600` ;
- relais présentation : `a25f08cdca737600eab0c48db93040556029bb85` ;
- CI GREEN : `37054923508` — SUCCESS ;
- suite complète : **872/872 PASS, 0 FAIL**.

#### Invariants

- `battleFormat` reste propriétaire des actor IDs ;
- `fighter.statusEffects` reste l'unique état de statuts ;
- `SkillPresentationBinding.statusVisuals` reste l'unique présentation configurée ;
- aucune seconde autorité ;
- aucun timer/observer ajouté ;
- aucun changement dans `Zombicide-40k` ;
- aucun merge vers `main`.

État : **GREEN technique — checkpoint/preview utilisateur**.


## Micro-lot — Functional Recovery V1 — 2026-10-02

Base exacte : `f4b3a3f18507c9406953fb35ee82ef4a78e9e757` (Editor Preview Status Wiring V1 GREEN).

- checkpoint départ : `checkpoint/lab-start-functional-recovery-v1-2026-10-02` ;
- branche : `work/lab-functional-recovery-v1-2026-10-02`.

### Décision

Le champ `recoveryMs` est conservé car il a une fonction claire :
**verrouiller brièvement l'acteur après l'impact avant de pouvoir commencer une nouvelle action**.

Jusqu'ici :
- `recoveryMs` existait dans la définition/timeline ;
- `skill-recovery-complete` était produit par le resolver ;
- mais le Runtime supprimait l'action de `activeByActor` dès l'impact.

Le champ était donc visible mais non fonctionnel comme verrou d'action.

### Objectif

Faire de la récupération une phase réelle du **même cycle de vie d'action** :

`preparation -> travel/impact -> recovery -> idle`.

### Autorité unique

- `activeByActor` reste l'unique propriétaire du cycle de vie d'action ;
- aucune map `recoveryByActor` ;
- aucun timer spécifique de récupération ;
- le tick existant du Runtime traite aussi l'échéance de récupération ;
- les dégâts/effets sont toujours résolus à l'impact ;
- seule la possibilité de commencer une nouvelle action reste verrouillée.

### Règles

- `recoveryMs = 0` : libération immédiate après résolution ;
- `recoveryMs > 0` : `startSkill/startCommand` refusent l'acteur jusqu'à la fin ;
- la phase exposée par `onProgress` devient `recovery` après impact ;
- une action déjà résolue n'est plus éligible aux clashes, réactions ou contacts visibles ;
- un acteur KO/cancel/dispose quitte immédiatement la récupération ;
- aucun changement des cooldowns existants.

### TDD

- RED : dégâts appliqués à l'impact, mais acteur encore occupé pendant `recoveryMs` ;
- RED : nouvelle action refusée avec outcome `recovering` ;
- RED : fin de récupération libère l'acteur sans second timer ;
- RED : contact visible résout à l'heure observée puis conserve le verrou de récupération ;
- RED : `recoveryMs=0` conserve le comportement immédiat ;
- suite complète GREEN.

État : **LOT OUVERT — TDD avant implémentation**.


### Résultat — Functional Recovery V1

Décision : le champ `recoveryMs` est **conservé et rendu fonctionnel**.

#### Comportement final

Une capacité suit maintenant réellement :

`Préparation -> trajet/impact -> récupération -> disponible`.

- l'impact applique immédiatement les dégâts/effets ;
- pendant `recoveryMs`, la créature ne peut pas lancer une nouvelle action ;
- une tentative renvoie `recovering` ;
- à la fin exacte de la récupération, l'acteur redevient disponible ;
- `recoveryMs = 0` garde le comportement immédiat historique.

Le cooldown reste différent :
- recovery = verrou global de l'acteur après impact ;
- cooldown = délai avant réutilisation de cette capacité précise.

#### Autorité / architecture

- `activeByActor` reste l'unique lifecycle d'action ;
- aucun `recoveryByActor` ;
- aucun timer spécifique ;
- aucune seconde horloge ;
- le tick Runtime existant traite préparation, impact et recovery ;
- `activeAction/activeActions` continuent de représenter seulement les actions encore en exécution ;
- `hasActiveActionFor` reste vrai pendant la recovery afin de bloquer correctement l'acteur.

#### Cas durcis

- contact visible anticipé : recovery démarre au vrai timestamp de contact accepté ;
- clash projectile : recovery appliquée aux actions résolues ;
- projectile survivant : recovery après son impact réel ;
- KO de la cible : ne supprime pas la recovery de l'attaquant ;
- tick tardif : impact + recovery déjà écoulés sont traités sans tick supplémentaire ;
- réaction counter : recovery après la résolution du counter.

#### UX éditeur

Le champ est renommé :
`Récupération après impact (ms)`.

Une aide explicite distingue désormais :
- récupération ;
- cooldown.

#### TDD / validation

- RED : `3ebb5f3a58681d6157a48c6957251abea435548e` ;
- implémentation lifecycle : `fec001ec602f30b35da2d13295627911b885bd87` ;
- vues d'action corrigées : `2fe43e262041c74e87c9b45eb6d5a99b7535cf99` ;
- sentinelles historiques réalignées sur la nouvelle règle ;
- durcissement KO/tick tardif : `6b05368fc4f45feb15b66274e1954fc8ec3a5d32` ;
- UX : `2f572ee8ceccd868b355882556f39cdbe008b8a8` ;
- CI : `37056854165` — SUCCESS ;
- suite complète : **878/878 PASS, 0 FAIL**.

#### Invariants

Aucun changement dans :
- formules de dégâts ;
- ownership des cooldowns ;
- StatusEffect Runtime ;
- présentation projectile/contact ;
- `Zombicide-40k`.

Aucun :
- second moteur de lifecycle ;
- timer recovery dédié ;
- observer global ;
- duplication d'autorité ;
- merge vers `main`.

État : **GREEN technique — prêt pour checkpoint/preview**.


## Chantier — Flame Bite + Audio Sync V1 — 2026-10-02

Base exacte : `fd9751f16a93e15327c7a25bba613e3d494bfbbf` (Functional Recovery V1 GREEN).

- checkpoint départ : `checkpoint/lab-start-flame-bite-audio-sync-v1-2026-10-02` ;
- branche : `work/lab-flame-bite-audio-sync-v1-2026-10-02`.

### Entrée utilisateur

Export : `gensrpg-capture-skill-lib_flame_bite.json`.

Capacité :
- id : `lib_flame_bite` ;
- nom : `Morsure brûlante` ;
- niveau requis : 15 ;
- type : contact / approche ground ;
- élément : fire ;
- énergie : 5 ;
- préparation : 700 ms ;
- trajet : 700 ms ;
- récupération : 0 ms ;
- cooldown : 25 000 ms ;
- dégâts directs : 10 feu ;
- statut DoT : 5 feu toutes les 2 s pendant 10 s, stack jusqu'à 10 ;
- impact visuel : `pack:capture:sprite-impact-physical-01` ;
- impact audio : `gensrpg:sound:effect-ee93278c` ;
- statut : teinte rouge `#d73920`, opacité 0.8.

### Sous-lot A — intégration Showcase

Intégrer l'export comme preset Capture autonome :
- fichier transfer conservé comme source du preset ;
- déclaration unique dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` ;
- chargement par le pipeline existant `hydrateCaptureShowcaseSkillPresetsV1 -> importCaptureTransferJsonV1 -> applyCaptureTransferBatchToEditorStateV1` ;
- aucune seconde définition de capacité.

### Sous-lot B — synchronisation cast / impact audio

Diagnostic sur le chemin réel :
1. le cast one-shot est actuellement enregistré comme audio de préparation puis toujours stoppé au release ; avec une préparation courte, le son peut être tronqué ;
2. l'impact audio est actuellement joué uniquement dans le case `outcome === "hit"`, alors que le FX impact est planifié pour `hit / blocked / reflected / immune` ;
3. les médias sont créés seulement au moment exact du play, ce qui peut ajouter un retard de chargement/décodage avant un impact.

### Correction cible

- le même Presenter reste propriétaire du timing de présentation ;
- le même Audio Adapter reste propriétaire de lecture ;
- un cast one-shot lancé au début n'est plus coupé au release ; seuls les sons de préparation en boucle sont stoppés au release ;
- interruption/annulation continue de stopper la préparation ;
- l'impact audio est déclenché depuis le même plan sémantique que le FX `impact`, une seule fois ;
- préchargement opportuniste des sons de la capacité au début de la préparation via le même Audio Adapter, sans horloge ni scheduler parallèle ;
- aucun changement des timestamps du Combat Runtime.

### TDD

A. preset export présent et chargé une fois ;
B. cast one-shot survit au release, cast loop est stoppé ;
C. impact audio suit le plan `impact` y compris blocked/immune/reflected, sans doublon sur hit ;
D. prime/preload réutilise le média préparé pour diminuer la latence ;
E. suite complète GREEN.

### Protégé

- aucune modification de formule dégâts/DoT ;
- aucune modification de Combat Session/Resolver pour l'audio ;
- aucun timer audio sémantique supplémentaire ;
- aucune seconde autorité d'impact ;
- aucun changement dans `Zombicide-40k` ;
- aucun merge vers `main`.

État : **CHANTIER OUVERT — TDD avant implémentation**.


### Résultat — Flame Bite + Audio Sync V1

#### Morsure brûlante intégrée

Preset ajouté :
`data/capture/showcase/lib_flame_bite.capture-skill-transfer-v1.json`.

Déclaré une seule fois dans :
`src/catalogs/capture-showcase-skill-presets-v1.js`.

Le preset reste l'export Capture comme source de vérité et passe par le pipeline existant :
`hydrateCaptureShowcaseSkillPresetsV1 -> importCaptureTransferJsonV1 -> applyCaptureTransferBatchToEditorStateV1`.

Aucune copie de la définition dans `data/combat/skills`.

Données conservées :
- niveau 15 ;
- contact ground / feu ;
- coût 5 ;
- préparation 700 ms ;
- trajet 700 ms ;
- récupération 0 ;
- cooldown 25 000 ms ;
- 10 dégâts feu immédiats ;
- DoT feu 5 toutes les 2 s pendant 10 s ;
- stack max 10 ;
- impact physique scale 3 ;
- son impact `gensrpg:sound:effect-ee93278c` ;
- teinte statut rouge 0.8.

#### Audio cast

Ancien comportement :
- tout son de cast était considéré comme préparation annulable ;
- `presentRelease()` stoppait donc aussi les one-shots.

Nouveau comportement :
- cast one-shot : continue naturellement après release ;
- cast loop : stoppé au release ;
- interruption/cancel/dispose : stoppent toujours la préparation active.

Aucune durée sonore n'est recalculée dans le Presenter.

#### Audio impact

Le son impact n'est plus branché seulement sur `outcome === "hit"`.

Il suit désormais le même plan sémantique que le FX `impact` :
- hit ;
- blocked ;
- reflected ;
- immune.

Un seul appel audio par impact.

L'identité de capacité utilisée par `planSkillOutcomeFx` accepte :
1. `resolution.skillId` ;
2. sinon `skill-arrive.skillId` ;
3. sinon `skill-release.skillId`.

Ce sont uniquement des identités déjà présentes dans les événements sémantiques du Resolver.

#### Préchargement

`DomCombatAudio` expose `primeSkill()`.

Au début de la préparation :
- cast/release/travel/impact connus sont préparés avec `preload = "auto"` ;
- le média préparé est réutilisé lors du vrai `play()` ;
- aucune horloge, aucun scheduler, aucun timer sémantique n'est ajouté ;
- si le préchargement échoue ou n'existe pas, le fallback historique `createAudio(url)` reste utilisé.

Objectif : réduire le retard réseau/décodage entre impact visuel et son audible.

#### TDD / validation

- RED preset : `d78f46b083bcfa3779605af40b30cd37b17ffdbb` ;
- RED audio : `0573640f4c5deee9de48ae420544416792f7e757` ;
- preset : `6ae0899956c5f5ba537ee5e43b3d23842fb1ef6c` ;
- catalogue : `52d8bd5bf37dd4e4d4b969b18d3911c7993b7ec6` ;
- prime audio : `c38d312312d220013bb77258642610a99d6d0c05` ;
- sync Presenter : `8bc395f75a0d0268759b2eb9333ba5d90d2a9c2c` ;
- identité impact sémantique : `e5293f872c3648f76e9cea25a1d1163a5cf986ca` ;
- sentinelle cast réalignée : `7e0ce1caedd674e925f4cf9a770b44fe9cca3a2f` ;
- CI : `37062253596` — SUCCESS ;
- suite complète : **883/883 PASS, 0 FAIL**.

#### Invariants

Aucun changement dans :
- Combat Session ;
- Action Resolver ;
- formules dégâts/DoT ;
- cooldown/recovery ;
- StatusEffect Runtime ;
- actor IDs ;
- `Zombicide-40k`.

Aucun :
- second scheduler audio ;
- second propriétaire de l'impact ;
- timer global ;
- observer global ;
- duplication de capacité ;
- merge vers `main`.

État : **GREEN technique — prêt pour checkpoint/preview utilisateur**.
