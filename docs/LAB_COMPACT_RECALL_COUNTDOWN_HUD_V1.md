# Labo Combat — Compte à rebours compact dans le HUD de rappel V1

## Retour utilisateur
- Rappel volontaire 45 s **approuvé en combat**.
- Problème ergonomique : grand texte de décompte dans la zone déroulante des réserves, nécessitant scroll.
- Souhait : petit nombre de secondes directement à côté du rappel, visible pendant le combat sans ouverture ni défilement.

## Diagnostic
La source était `src/ui/capture-combat-roster-controller-v1.js`, qui réécrivait le long paragraphe `[data-combat-recall-note]` dans `.combat-test-team-menu__body`. Cette zone est une popup absolue `max-height: min(24rem, 66svh); overflow:auto`. Le bouton interne `Rappel et invocation` est caché quand `details` est fermé. L'en-tête `summary` reste en revanche visible dans le HUD de combat.

## Correction limitée au propriétaire UI
- L'en-tête `summary` contient un libellé **Rappel · N monstres** et un unique badge `[data-combat-recall-countdown]`, à côté du titre.
- **45 s / 12 s / 1 s** sont affichés en chiffres tabulaires, sans phrase intrusive et sans ajouter de seconde horloge.
- Le badge est **masqué** quand le rappel est disponible : l'en-tête conserve sa largeur et reste cliquable.
- La note détaillée existante du menu est **statique** (gratuite, durée de préparation, ciblabilité). Aucun décompte au fond de la popup.
- En smartphone paysage, l'en-tête garde un minimum de 2rem et une pastille compacte. `hidden` masque réellement le badge, `focus-visible` assure la navigation clavier.
- L'UI lit exclusivement `controller.snapshot()[localActorId].voluntarySwitchCooldownRemainingMs` depuis le `Roster Session` : aucune modification des règles, de la durée de 45 s, du KO ou de la disponibilité des commandes.

## Tests et protocole
- Base : `gh-pages` `f08f2cea84ac309ee6245c424dbfa4217d895c6a`.
- Départ : `checkpoint/lab-start-compact-recall-countdown-hud-v1-2026-10-10`.
- RED : test `tests/unit/compact-recall-countdown-hud-v1.test.mjs` sur branche de travail, avant HTML/CSS/UI.
- Sentinelles : badge hors popup, en-tête toujours rendu, plein/décompte/zero caché/aucun doublon DOM, message statique, bouton toujours bloqué par le vrai roster, CSS mobile/paysage.
- Suites CI Node et navigateur Chromium : Foundation, bibliothèque 103 créatures, Firestorm 1v1/2v2.
- SHA GREEN exact, rapports CI, preview `gh-pages` sous lease : consignés via publication.
- Validation esthétique sur smartphone physique distincte des tests automatiques.

## Frontières protégées
Aucun changement dans `Combat State`, `Combat Session`, `Combat Runtime`, `Roster Session`, `CaptureGameOptionsV1`, les sprites/assets, données auteurs, `main`, GenSrpG et Exploration.
