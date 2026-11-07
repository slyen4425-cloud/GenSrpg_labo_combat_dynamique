# 5 novembre 2026 — Cadence lisible de l'approche au contact

## Diagnostic source
Le `ground-attack` réutilisait directement `locomotion.phases` : le profil bipède proposait **3** contacts, le quadrupède **2**. La distance et les vrais impacts sont déjà contrôlés ailleurs : augmenter artificiellement la distance d'arène créerait un risque de contact erroné sur PC/téléphone et en 2v2.

## Correctif sans seconde autorité
Animation Core : `groundApproachLocomotionFromProfileV1` génère les phases `lift/land` et les footfalls à partir de **paramètres éditables** sous `data/profiles/<morphologie>.profile.json` → `locomotion.groundApproach` :
- Bipède : 5 petits pas (paires impulsion/retombée).
- Quadrupède : 3 bonds visibles.
- Intensité, hauteur verticale, compression, rotation et easing contrôlés par les données ; aucun identifiant manuel.
- Les autres profils conservent leurs phases et le mouvement tactique `move` garde sa configuration existante.
- Le temps exact de déplacement `travelMs` appartient au Combat Runtime. Le visuel répartit ses cinq/trois cycles **sur cette durée**, avec contacts sonores aux mêmes instants. Pas de second timer gameplay ; trajectoire, mur, collision, esquive, dégâts à l'impact et retour non modifiés.
- Retour visuel `ground-home` après le vrai point d'impact comme auparavant.

## Lisibilité et limite réelle
À `travelMs=700` ms : bipède 140ms/pas, quadrupède environ 233ms/bond ; à `travelMs=500` ms : 100ms/pas et 167ms/bond. Une compétence réglée extrêmement rapide peut néanmoins produire une cadence visuellement trop dense : ne pas créer de ralentissement exclusivement visuel qui désynchroniserait le contact; calibrer alors le **vrai** temps de trajet de la compétence ou envisager un réglage de tempo autoritaire dans un lot séparé.

## Preuves requises
Tests des phases et footfalls à 500/700/1500ms, des côtés joueur/adversaire, du point d'impact, du son, des ombres au sol et des autres profils. CI complète 5/5, puis essai smartphone paysage et PC en 1v1/2v2. Ne pas déclarer perceptuellement validé sans essai auteur.
