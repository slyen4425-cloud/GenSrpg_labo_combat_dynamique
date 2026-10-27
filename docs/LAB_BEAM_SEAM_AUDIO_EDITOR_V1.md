# Rayon — continuité de la jonction et sons dans les trois phases V1

Date : 2026-10-08.

## Reprise et isolation

- Base GitHub Pages exacte : `0c2386aa8526bb74867259ee8a14a803a8cb9a9e` (travail Beam Continuity Sound Offsets V1).
- Checkpoint de départ : `checkpoint/lab-start-beam-seam-audio-editor-v1-2026-10-08`.
- Branche de travail : `work/lab-beam-seam-audio-editor-v1-2026-10-08`.
- Aucun développement sur `main`, aucun contact avec `Zombicide-40k`, Exploration ou global-assets.

## Défauts démontrés

1. Les trois sons canoniques `cast`, `travel`, `impact` existaient mais restaient dans la section Audio de la capacité, à distance du panneau « Rayon continu — 3 phases ». Les labels et contrôles visuels y étaient déjà relocalisés ; les sons n'y figuraient donc pas. Le comportement autoritaire du son de trajet Beam avait déjà été corrigé sur la base.
2. `DomSkillFxRenderer.positionBeam` plaçait le corps exactement entre les deux centres d'ancrage (sans sous-couche sous les parties « départ » et « extrémité »). Avec des sprites comportant des bords transparents, une séparation visible pouvait apparaître entre les éléments du même rayon.

## Correction minimale

- `CaptureBeamStageLayoutV1` déplace **les mêmes** sélecteurs et labels `data-skill-cast-audio`, `data-skill-travel-audio`, `data-skill-impact-audio` avec leurs boutons Écouter respectifs, dans les phases 1/2/3. Aucun duplicata d'identifiant, aucun second binding ou deuxième catalogue. Retour sur Projectile et `dispose()` restituent leurs positions, en gardant les valeurs choisies.
- Le libellé de trajet dit désormais « Son du trajet (projectile / rayon) ». Le choix se fait via les rôles audio actuels et l'Audio Adapter déjà propriétaire de la lecture.
- `DomSkillFxRenderer` garde la longueur, l'angle, le socket bouche et le point d'impact autoritaires, et allonge uniquement le **visuel du corps** sous les endcaps. Overlap par extrémité = 35 % de la largeur native du cap (96 px × échelle), limité à un tiers de la distance réelle pour les cibles proches. Les réglages sont centralisés dans le renderer, partagés par les deux équipes et réévalués lors du suivi des ancres sur chaque frame déjà existante ; aucune nouvelle boucle, aucun réglage jeu ou timer.
- Sans visuels d'extrémité, le rayon garde sa largeur héritée à 100 %. Le preset, ses sprites, l'Undo et les anciennes capacités ne sont pas modifiés.

## Tests RED → GREEN

- RED : CI `37830555903` et `37830560916`, nouveaux tests révélant l'absence de recouvrement et des contrôles audio dans le panneau. Le correctif initial a montré que la sentinelle Chromium historique attendait exactement 12 labels ; son assertion a été alignée sur les mêmes **15 labels canoniques** (7 + 4 + 4, incluant trois sons).
- GREEN : `37830808315`, **1296 tests Node PASS, 0 FAIL** ; vrai navigateur Chromium PASS en quatre scénarios dont source CDN bloquée ou suspendue, avec **103 créatures** dans chacun. La sentinelle Beam confirme 7/4/4 labels sans doubles contrôles ; la sentinelle géométrique vérifie le recouvrement et l'alignement source/cible en mouvement.
- Les tests d'audio runtime existants confirment le son `travel` pendant le trajet Beam et son arrêt au contact.

## Limites

Les tests valident le recouvrement CSS et le vrai chemin audio paramétré. Le rendu alpha/épaisseur exact selon le sprite, la lecture réelle sur Android, la qualité esthétique et le tactile doivent être validés par l'auteur sur le téléphone avant GREEN produit.

Le checkpoint final doit viser le SHA documentaire testé exact, puis la preview pourra être publiée avec garde de head sur `gh-pages`.
