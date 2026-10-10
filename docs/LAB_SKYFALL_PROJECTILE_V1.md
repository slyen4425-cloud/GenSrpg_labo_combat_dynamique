# Capture — Chute du ciel / projectile vertical V1

Date : 2026-10-10. Dépôt Laboratoire Combat Dynamique.

## Besoin et décision
L'auteur souhaite créer la compétence « Chute de pierre » : un projectile doit descendre du ciel sur la cible, et non être tiré depuis le lanceur. Cette nouvelle famille de trajectoire est un réglage de **présentation du projectile**, pas une nouvelle `SkillDefinition.form`, ni un second moteur d'impact.

## Auteur — éditeur Capture
Dans « Projectile / trajet », choisir un sprite personnel ou du catalogue et configurer :
- **Mode de déplacement** : « Lanceur → cible (classique) » ou **« Chute du ciel (vers la cible) »** ;
- **Hauteur de départ** : de 1 à 1400 pixels, 400 par défaut ;
- **Décalage horizontal du départ** : -700 à +700 pixels, 0 par défaut ;
- **Vers la cible (ms)** : conserve le temps de trajet natif de la compétence ;
- échelle, animation du sprite, impact, FX, audio et dégâts : réglages natifs existants.

Cette fonctionnalité est générique et ne crée pas automatiquement l'asset ou la capacité de l'auteur.

## Contrat et propriétaires
- `SkillPresentationBindingV10.visual.travel.trajectoryMode="skyfall"`, `fallHeightPx`, `fallOffsetXPx`. Pour les autres formes de trajectoire, V1–V9 restent strictement inchangés et valides ; V10 délègue la normalisation héritée à V9.
- L'éditeur `capture-editor-human-v2.js` lit/écrit exactement la même donnée au travers du draft et du transfert ; la source active `configuredSkills` reste le propriétaire des compétences.
- `capture-skill-presentation-assets-v2.js` résout les sprites et transporte uniquement ces métadonnées validées.
- `dom-skill-fx.js` détermine la position initiale : `targetCenter + (fallOffsetXPx, -fallHeightPx)`. Le même projectile descend vers `targetCenter` durant `action.travelMs`, sur le pipeline existant `projectile -> contact sensor -> Runtime -> Combat Session -> Presenter -> impact`.
- Les dégâts, les collisions de projetiles, le ciblage 1v1/2v2, la présence, les cooldowns, l'audio et les FX persistent chez leurs propriétaires existants. Aucune horloge, boucle ou deuxième système de dégâts.

## Tests et limites
`tests/unit/capture-skyfall-projectile-v1.test.mjs` :
- contrat V10 et domaines de valeurs, roundtrip JSON et interdiction des champs `fall*` dans un autre slot ;
- raccord jusqu'au resolved sprite avec scale/playback ;
- départ au-dessus de la cible sans ancrage lanceur, arrivée au centre cible et durée runtime ;
- projectile classique inchangé ;
- vrais `buildHumanSkillDraftV1` et `humanSkillEditorFieldsFromDraftV1` pour « Chute de pierre » et roundtrip ;
- sentinelles des contrôles éditeur (nouveau, modifier, charger, sauvegarder).

La descente vise le **centre de la cible** selon le mécanisme actuel de contact ; les zones multiples / pluies de pierres multi-projectiles ou un mode de visée au sol ne sont pas créés dans ce lot. Aucun média spécifique n'est ajouté. Vérification tactile Android réelle reste l'utilisateur après publication.

## Traçabilité
- Base : `gh-pages` `0a8eb1669cc8a9915acd79bf0099a99361ee2f64`, CI et Pages SUCCESS.
- Départ : `checkpoint/lab-start-skyfall-projectile-v1-2026-10-10`.
- Travail : `work/lab-skyfall-projectile-v1-2026-10-10`.
- RED : `3c34d61597a51747cf25e946b160e059f7adc2ce` (test avant contrat/rendu).
- GREEN, checkpoint et publication : uniquement si CI complète et Pages SUCCESS sur SHA de clôture.
