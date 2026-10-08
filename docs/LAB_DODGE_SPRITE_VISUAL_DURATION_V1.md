# Dodge Sprite Visual Duration V1 — 2026-10-08

## Demande / audit
Le sprite d'esquive existant était étiré sur la fenêtre Runtime de 250 ms, trop brève pour lire les frames. L'apparence de la créature gardait assetId, scale, offsets mais pas de durée visuelle propre.

## Changements sans nouvelle autorité
- Contrat existant `CreaturePresentationBindingV3.visual.dodge.durationMs` optionnel, strictement positif ; anciens exports V2/V3 compatibles sans migration forcée.
- En édition d'Apparence, « Durée du sprite d'esquive (ms) », défaut 700, pas 50, min 50, max 10000 (borne UI).
- `Human Editor -> CreaturePresentationBindingV3 -> Native Visual Source -> DOM Dodge FX`, avec transport exact de la durée.
- DOM Dodge FX réutilise `applySpriteVisual(... playbackMode: "stretch")` ; la durée du FX est visuelle uniquement, par défaut 700 ms ou valeur de la créature. Aucun second timer de combat ; le Runtime reste propriétaire de la vraie fenêtre d'esquive (défaut 250 ms).
- Annulation/nettoyage des animations inchangés ; absence de sprite garde l'absence d'effet visuel.

## Vérification
- TDD RED : tests des nouveaux champs (ancien code refuse durée ou étire en 250 ms) ; corrections minimales.
- GREEN initial : `58a1940d2a5bf21a6841893d9bae322d6d4db145`, CI https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37777472068 : foundation + vrai Chromium, SUCCESS.
- Test complet réel : Creature Editor -> export V3 -> Native Visual Source, durée auteur 1000 ms ; DOM applique 1000 ms malgré une fenêtre gameplay 250 ms ; fallback FX 700 ms.
- Anti-régression navigateur : 103 créatures actives, démarrage optionnel non bloquant.

## Protection
Ne touche pas aux données créatures, assets, compétences, défense/dégâts, Combat Runtime, main, Zombicide-40k ou Exploration.

## Suite
Checkpoint technique et preview après CI documentaire finale ; validation artistique/tactile Android utilisateur nécessaire avant GREEN utilisateur.
