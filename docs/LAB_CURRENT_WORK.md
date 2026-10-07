# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Capture Skill Export Fidelity V1

Branche :
`work/lab-capture-skill-export-fidelity-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-capture-skill-export-fidelity-v1-2026-10-07`

Base :
`c2caf8c1067fa26e9b0c87c29ea46e43972966ff`

## Résultat

Le Human Editor ne remet plus silencieusement une référence de socket de capacité à `Centre par défaut` lorsque la créature courante ne possède pas ce socket.

Une référence déjà enregistrée est conservée comme référence sauvegardée, sans hardcode d'IDs de sockets dans le sélecteur.

Les sentinelles de fidélité couvrent désormais :
- socket ;
- X/Y joueur ;
- modes miroir / même / custom ;
- X/Y adversaire ;
- playback ;
- layers ;
- scales ;
- impact duration ;
- audio ;
- feedback FX ;
- status visuals ;
- principaux champs gameplay de la capacité ;
- round-trip draft -> export -> import -> projection éditeur -> réexport.

Cas de régression verrouillé :
`mouth + cast offsetX=30 + cast offsetY=0`.

## TDD

RED :
- commit `aa4faef85c066728c223e751fc14a0c541db70b7` ;
- CI `37630334223` ;
- 1219 tests / 1218 PASS / 1 FAIL ciblé ;
- socket `mouth` détruit en `""`.

Correction :
- `src/ui/capture-editor-human-v2.js` ;
- aucune modification Runtime/Combat/FX/Audio/Damage/Collision.

GREEN fonctionnel :
- commit `65c44d2d9ffb8b5ac8dad8517ee5a6264811d055` ;
- CI `37630829983` ;
- 1219 / 1219 PASS.

Rapport :
`docs/LAB_CAPTURE_SKILL_EXPORT_FIDELITY_V1.md`

## Note importante

Le chemin X/Y actuel est démontré fidèle. L'ancien export utilisateur contenant `offsetX=0 / offsetY=30` ne permet pas d'identifier rétroactivement avec certitude le commit historique qui a produit cette inversion ; à partir de ce lot, ce cas est protégé par CI.

Les presets d'interface restent des raccourcis : leurs valeurs résultantes sont exportées, pas l'identifiant du preset.

## Prochaine action

Créer le checkpoint GREEN et la preview sur le SHA final après CI complète.

La correction de la fiche Showcase Fireball elle-même doit rester un micro-lot auteur séparé, fondé sur le retour utilisateur explicite (`mouth`, X=30, Y=0), après fermeture du présent lot.

