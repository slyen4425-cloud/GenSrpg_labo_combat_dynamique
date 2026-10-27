# Soin — ciblage lisible et résolution du champ historique V1

Date : 2026-10-09. Laboratoire autonome `GenSrpg_labo_combat_dynamique`.

## Incident observé

Lors du premier essai d'une capacité de soin, son icône apparaît grisée parce que le combat sélectionne un ennemi par défaut. Cliquer sur sa propre créature donne l'impression de déverrouiller l'icône, mais cette dépendance aux cibles possibles n'est pas indiquée.

Le moteur de soin moderne `effects[{kind:"heal"}]` applique le soin. En revanche, le champ historique du même éditeur `effect.heal` était accepté dans le contrat mais **ignoré par la résolution**. Dans les deux cas le client de combat ignorait les événements `health-delta.kind="heal"`, et le presenter lançait parfois l'animation de coup reçu sur une cible soignée.

## Base et propriétaires

- Base fonctionnelle publiée : `b13aeb6616bc94f9b01c4b4ef8551debc4c7a9f6`.
- Checkpoint départ : `checkpoint/lab-start-heal-target-clarity-v1-2026-10-09`.
- Branche : `work/lab-heal-target-clarity-v1-2026-10-09`.
- Contrat de ciblage et prévisualisation : `isSkillTargetAllowed` et `CombatSession.previewSkill` (inchangés).
- Droit de présentation du HUD et sélection en 1v1/2v2 : `src/ui/combat-2v2-test-ui.js`.
- Propriétaire unique des soins : `applyImmediateTacticalEffectsV1`. Le champ legacy `effect.heal` est converti en effet `heal, targetScope:"target"` seulement à l'entrée du même résolveur ; pas de 2e calcul ou temps.
- Projection santé : `CombatRuntime.onHealthDelta` pour quantités réelles uniquement ; `DomSkillFxRenderer` affiche `+X` via le même cycle FX que `-X`.
- Presenter : pour une résolution avec événement `heal` et aucun dégât appliqué, conserve les FX d'impact existants sans animation `hit` sur le bénéficiaire.

## Fonctionnement après correctif

1. Une compétence active reste disponible dans la barre **si au moins une cible vivante autorisée peut l'utiliser**, même si la cible précédemment sélectionnée est incompatible.
2. En cliquant dessus dans ce cas, le statut invite à **toucher une cible mise en évidence**; les cibles réellement autorisées et actionnables sont soulignées par le HUD. Le clic sur la cible exécute la capacité directement.
3. Une compétence déjà actionnable sur la cible sélectionnée garde le déclenchement en un clic.
4. Les refus d'énergie, cooldown, KO, contrôle occupé restent déterminés par la `CombatSession` et le runtime, sans valeur de disponibilité recalculée localement.
5. Chaque variation positive de PV constatée par le Runtime génère `+X` en vert sur la créature concernée, sans flasher les dégâts, et le panneau de statut annonce le soin.
6. Si l'action de soin réussit sur une cible déjà à PV maximum, le statut affiche `Soin appliqué : PV déjà au maximum.` au lieu d'un silence trompeur.
7. Les visuels du soin ne dépendent pas de médias importés ; aucun média nouveau ou placeholder n'est ajouté.

## Tests et preuves

- RED 1 : nouvelle sentinelle d'ergonomie/cible/FX sur commit `7211f8057ccd66cb3e824ac7bed49e9d9e462191`.
- RED 2 : vraie `CombatSession.useSkill` démontrant **40 PV conservés** malgré `effect.heal=25`, contre **65 PV attendus** — CI `37911752242`.
- RED 3 : faux `hit` visuel pendant un soin pur — CI `37911881310`.
- GREEN code : CI `37911958753` SUCCESS — 1304 / 1304 tests Node, zéro échec ; navigateur Chromium réel SUCCESS (bibliothèque de 103 créatures).
- Les anciennes sentinelles dommage continuent de passer, actualisées pour accepter `type: feedback.kind` sans affaiblir leurs vérifications de quantité et du flash ciblé.
- Test visuel et tactile d'une capacité auteur réelle sur Android encore nécessaire avant GREEN utilisateur.

## Sécurité du périmètre

Aucun changement sur le contrat/export des capacités, IDs, `configuredSkills`, roster, loadouts, 103 créatures, FX/sons importés, moteur de dégâts, `main`, `Zombicide-40k` ou labo Exploration.

## Recommandation de test utilisateur

En combat Capture, sélectionner une capacité de soin tandis que l'ennemi est ciblé : son bouton ne doit plus être grisé si un allié/soi-même peut la recevoir. Toucher la capacité, repérer les créatures mises en évidence, puis toucher la créature à soigner. Vérifier le nombre vert `+PV`, l'augmentation de la barre et le message si PV déjà au maximum.

CI du commit documentaire final et publication Pages sous protection du SHA sont suivies dans `LAB_CURRENT_WORK.md`.
