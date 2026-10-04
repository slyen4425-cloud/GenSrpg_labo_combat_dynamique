# Combat de test durable de l’éditeur — V1

Date : 2026-10-04. Branche : `work/lab-editor-combat-test-v1-2026-10-04`.

## Résultat et périmètre

Le bouton « Tester en combat » utilise la bibliothèque de créatures configurées, applique les modifications valides de la créature et de la capacité en cours, puis ouvre la chaîne de combat native. Une même fiche peut participer dans les deux camps ou plusieurs fois dans une équipe, avec des PV, énergie, cooldowns et snapshots de membres distincts.

Chaque camp contient de **1 à 6 monstres**. Le format simultané reste **1 ou 2 actifs par camp** : les autres membres sont des réserves. Cette interprétation a été annoncée après la précision optionnelle restée sans réponse. Le lot ne crée pas de format simultané 3v3–6v6. Les camps peuvent avoir des effectifs différents ; deux actifs nécessitent au moins deux membres dans chaque camp. En 2v2, les réserves sont réparties alternativement entre le joueur local et son allié, ou entre les deux adversaires. L’allié et les adversaires restent contrôlés par l’IA native.

Les choix lisent la bibliothèque active (103 fiches constatées au démarrage), sans liste fermée de créatures de démo. Ajouts, imports et renommages actualisent les options en préservant les IDs encore valides. Le premier monstre local suit la créature en cours d’édition.

Rappel et Invocation emploient les définitions de commande existantes : coûts, préparation et récupération restent calculés par Combat Runtime/Session. Le menu Équipe affiche les membres et leurs PV. Un changement d’actif actualise son image, son nom, son profil et ses capacités ; un KO entraîne un remplacement natif si une réserve vivante est disponible.

La barre Vérifier / Tester est fixe aussi sur smartphone. L’espace de défilement et le scroll-padding protègent les derniers champs, et la barre disparaît pendant le combat.

## Base et causes vérifiées

- Base Git exacte : `ce652d406e711ec38fb54ff5f490a4a91b4ab6b4`, branche des réglages de sprites.
- Checkpoint de départ : `checkpoint/lab-start-editor-combat-test-v1-2026-10-04`.
- Dernier GREEN utilisateur relu : `checkpoint/lab-fire-zone-contact-sync-v1-green-2026-10-03` / `f7364b8ce1dbc285a151ac64ddeadc7c6b611c2d`.
- La liste adverse était codée dans la page de démonstration au lieu de lire configuredCreatures.
- Le rechargement des presets remplaçait une capacité dans configuredSkills sans recharger les champs propres à cette capacité. Un éditeur non modifié apparaissait alors comme un brouillon modifié et refusait le test jusqu’à une sauvegarde manuelle. Le champ est maintenant rechargé depuis son owner après l’hydratation ; les modifications réellement en cours restent conservées.
- Le Native Visual Adapter ne résolvait que les créatures actives, et le client Capture générique ne montait pas Roster Session. Exporter les réserves ne suffisait donc pas à les rendre jouables.
- Le CSS mobile remplaçait la position fixe de la barre par une position statique.

## Propriétaires et changements

`capture-editor-combat-test-v1.js` assemble le scénario via les contrats et exporters Capture existants. Les IDs de définition restent canoniques ; chaque occurrence reçoit un actor/member ID distinct. Le partage de définitions identiques ne partage jamais les états de combat.

configuredSkills et configuredCreatures demeurent les seules bibliothèques modifiables. La préparation du test est une transaction synchrone dans ces maps : validation de la capacité, validation de la créature, validation/export du scénario complet, puis mise à jour de l’affichage. Une erreur rétablit les objets précédents ou supprime uniquement les nouvelles entrées staged. Les réglages valides ne sont donc pas partiellement enregistrés si la composition ou l’autre fiche est invalide. Une mise à jour de capacité ne déplace pas les slots et ne l’équipe pas automatiquement.

`capture-combat-roster-controller-v1.js` projette les snapshots de createRosterSession et les commandes résolues par Runtime. Il ne remplace pas lui-même les fighters et ne calcule pas les coûts/timings. La projection readonly skillIdsByCreature vient de l’adaptateur Capture autoritaire ; la barre locale et les contrôleurs IA relisent les capacités de l’actif après rappel/invocation/KO.

Le Native Visual Adapter résout les références des membres de réserve en plus de celles des acteurs. La preview attend la fin de l’hydratation de l’éditeur, puis garde ses owners et son nettoyage existants. Les transitions KO, listeners des boutons, contrôleurs et lecteurs visuels sont nettoyés au retour/dispose. Aucun nouveau moteur, timer ou observateur permanent.

La page `editor-mobile-review.html` est une fixture de contrôle : elle embarque le **même éditeur natif** dans une iframe de taille sélectionnable. Elle ne possède pas de bibliothèque ou moteur de combat.

## Fiches sans illustration : placeholder explicitement déclaré

Des fiches historiques n’ont aucune présentation configurée. Pour ces seules fiches (`presentationId: null`), le Native Visual Adapter affiche un repère SVG « SANS IMAGE », sans modifier configuredCreatures ni global-assets. Une référence explicite de présentation, de profil ou d’asset introuvable reste une erreur.

Ce repère est un **PLACEHOLDER de rendu**, pas une illustration ou un sprite livré. Ce lot ajoute **zéro média final** et ne remplace aucune planche. Les images de créatures existantes continuent à venir du catalogue autoritaire. Aquafin sans présentation a été lancé en preview native : le repère et les images réelles de capacités se décodent correctement. Une vraie illustration peut ensuite être configurée dans l’éditeur.

## Validation

Code final vérifié : `0ec42fd2d2b006c939c29a8bdb61e11a26ec97d7`. Les parcours réserves/KO/présentations et la revue responsive ont été effectués sur `6e0ef50c68b161a9367663cfffdb68653689df44` ; leurs sources restent identiques dans le code final, qui ajoute seulement la reprise du bouton après refus. Cette reprise et un nouveau lancement miroir avec six membres par camp ont été vérifiés dans le navigateur sur le SHA final.

- GitHub Actions, run **37197128053**, job **111421216146** : **989/989 tests, 0 échec**, gardes de structure/frontières/indépendance OK. Le dépôt complet sert de référence ; les contrôles ciblés antérieurs passent 152/152 et le correctif de reprise passe 28/28, tandis que son exécution complète ne possède pas les deux documents de fondation et les 173 fichiers audio du dépôt. Aucun faux média n’a été créé pour compenser ce miroir incomplet.
- RED avant implémentation : réserves absentes du visuel, fiche sans présentation, hydratation non attendue, composition et transaction de pending edits. Sentinelles natives pour taille 1–6, duplications, 2v2, rappel/invocation, remplacement KO, per-creature loadouts, rollback et cleanup.
- Parcours navigateur natif : Loup contre Loup lancé sans sauvegarde préalable ; PV indépendants (132/150 contre 150/150).
- Deux équipes distinctes de six : quatre actifs visibles, douze membres dans le menu, répartition des réserves vérifiée.
- Duel avec six membres locaux : Rappel exécuté ; Maraileron invoqué avec Goutte vive / Morsure de marée / Jet pressurisé. Après son KO, Loup restauré depuis la réserve avec ses capacités et ses propres PV ; Maraileron reste KO dans le snapshot affiché.
- Modifications non enregistrées manuellement : scale Loup 1,35 et trajet Fireball 1800 ms pris en compte par Tester, puis conservés après sélection d’une autre fiche et retour. Les cinq IDs de loadout restent inchangés. Essai invalide scale 0 + trajet 1900 ms refusé ; rechargement depuis les bibliothèques confirme scale 1,35 et trajet 1800 ms, sans sauvegarde partielle.
- Refus corrigé : la QA native a révélé le bouton verrouillé après validation invalide. RED par exécution des vrais handlers de page avec Preview Session ; `finally` relit `session.previewActive` pour autoriser un nouvel essai sans owner supplémentaire. Refus scale 0 → bouton encore disponible → correction 1,2 → lancement six Loup par camp / quatre actifs confirmé.
- Contrôle responsive natif via iframe : 360/390/430 × 740 et 740 × 390 ; footer fixed, aucun débordement horizontal, dernier slot au-dessus de la barre après défilement. La hauteur et le bas de la barre suivent la fenêtre. La capture de preuve montre 390 px, six monstres et les deux actions visibles pendant le défilement. Le bouton mobile a également lancé le combat 2v2 de deux équipes de six, avec quatre actifs aux PV distincts.

## Preview et statut

Lien natif ouvert et vérifié :

https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/0ec42fd2d2b006c939c29a8bdb61e11a26ec97d7/examples/dom-demo/capture-editor-v2.html

Dans l’onglet Combat, choisir les effectifs, les créatures et le nombre d’actifs, puis Tester en combat. Le menu Équipe permet de consulter les réserves et de lancer Rappel / Invocation.

État : **implémentation technique et CI vérifiées, prêt pour validation smartphone de Sylvain**. La revue responsive ne remplace pas un appareil physique : clavier virtuel, barre du navigateur, confort tactile et lisibilité en situation réelle restent à valider. Aucun GREEN utilisateur annoncé.

Protégés : main, global-assets, Zombicide-40k, médias, trajectoires/contact/perspective/ombre et règles métier des dégâts/coûts/progression. Aucun merge main ou intégration GenSrpG dans ce lot.
