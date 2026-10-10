# Labo Combat — Verrou de rappel volontaire configurable V1 (2026-10-10)

## Intention produit
- **45 secondes par défaut** entre deux changements *volontaires* de créature (rappel simple ou rappel + invocation).
- L’auteur de la partie peut saisir **0 seconde** (restriction désactivée), **60 secondes**, ou une autre durée finie non négative.
- Le délai démarre **à la fin du changement volontaire**, pas au clic de préparation. L’invocation d’une réserve sélectionnée après un rappel déjà réalisé reste immédiatement possible ; le délai empêche ensuite de rappeler à nouveau.
- **KO** : la relève native `replaceKnockedOut()` demeure immédiate et ignore le verrou, sans le réinitialiser.
- La préparation de rappel existante (2 s par défaut) et le coût nul restent inchangés.

## Propriétaires (charte)
- `src/contracts/roster-switch-policy-v1.js` : valeur et validation commune de délai.
- `CaptureGameOptionsV1` : configuration exportable `recallCooldownMs`, anciens exports sans champ préservés avec valeur de défaut.
- `Roster Session` : prochain instant `nextVoluntarySwitchAtMs` par équipe/slot sur `Combat Session.snapshot().elapsedMs`. Vérification serveur local (core) dans `previewRecall/recall` et `previewSwitch/switchMember` : aucun bypass en déclenchant directement la commande.
- `CaptureCombatRosterControllerV1` : projection de la disponibilité native dans les commandes.
- HUD et Human Editor : données lues/affichées, **aucun timer / aucun calcul de cooldown autonome**.

## Parcours réel
`Game Options -> Battle Setup/Export -> loadCoop2v2CombatSource -> Roster Controller -> Roster Session -> preview native Runtime -> command-complete -> changement autoritaire`.
La disponibilité en UI et le compte à rebours viennent du snapshot du même `Roster Session`. Le HUD affiche une note explicative et le bouton désactivé tant que le délai existe. La mise à jour suit le `onClock` existant.

## Validation
- Départ GREEN connu : `c65b5d370815c3ab5744f121729bdad89d9d7da2` (`gh-pages`).
- TDD RED : `c50bc2118a93e5090201dbb58d507d013bafabda` / CI `38045491255`, échec ciblé (fonction attendue absente).
- Tests ciblés : default 45s, 0s, 60s, validation entrées, blocage direct et preview, reprise sur horloge de session, KO, temporisation indépendante par équipe, nouvelle session, options dans le vrai Human Editor, vrai contrôleur de roster.
- Suites de statut/zone testant spécifiquement les échanges instantanés conservent leur périmètre en configurant explicitement `recallCooldownMs:0`.
- CI Foundation / navigateurs Chromium (bibliothèque 103 créatures + Firestorm) à confirmer **sur le SHA final**.
- Validation smartphone physique par l’utilisateur distincte de la CI.

## Domaine strictement protégé
Aucune modification du moteur Combat Runtime, Action Resolver, Combat State, données auteurs, assets, fichiers GenSrpG/Exploration, ni `main`. Prévisualisation et publication seulement avec CI SHA exact et lease public inchangé.
