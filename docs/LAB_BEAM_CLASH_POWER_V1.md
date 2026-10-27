# Capture — Beam Clash Power V1 : vraie collision rayons et projectiles

Date : 13 octobre 2026.

## Décision auteur et résolution du blocage
L'auteur a expressément demandé que **les rayons participent au même calcul de puissance de collision que les projectiles**. Le micro-lot antérieur a dû rétablir Arc électrique à la puissance 0 parce que `ProjectilePowerV1` interdisait un Beam positif et que le moteur détectait exclusivement deux projectiles. Ce document autorise et borne l'extension réelle, plutôt qu'un affichage trompeur de la puissance 2.

## Sources et isolation
- Base LIVE `gh-pages@5e1b9e6107cb49000a54e17c6d842753994b241b`, CI `38468795383`, Pages `38468795675` SUCCESS.
- Checkpoint de départ avant code `checkpoint/lab-start-beam-clash-power-v1-2026-10-13`.
- Branche `work/lab-beam-clash-power-v1-2026-10-13`.
- `SkillDefinition` conserve son champ natif `projectileClash.power`. Aucun champ dupliqué : `src/contracts/projectile-power-v1.js` autorise désormais `form=projectile | beam` si `power>0`, sans permettre `contact`, `area` ou `self`.
- `src/core/combat/projectile-clash.js` conserve le verdict autoritaire `left_survives/right_survives/mutual_cancel`, l'événement natif `projectile-clash` (nom historique), sa cancellation et le traitement `CombatRuntime` release / clash / impact. Aucun moteur secondaire ni timer nouveau.

## Règle temporelle et spatiale testée
- Projectile face à projectile : calcul historique inchangé : la rencontre se produit lorsque les deux positions en mouvement se croisent dans leur fenêtre commune.
- Rayon face à projectile opposé : un rayon occupe **le segment entier** depuis sa libération jusqu'à son impact ; il rencontre l'autre projectile dès l'instant où le rayon et le projectile sont tous deux actifs. Position du contact le long du rayon = `1 - progression réelle du projectile` ; l'événement de collision garde un `progress` cohérent pour son effet visuel.
- Rayon face à rayon opposé : segments opposés se croisent dès qu'ils sont simultanément actifs ; rencontre projetée au milieu du segment (50 %).
- Puissance 0 : collision inactive. À puissance égale, les deux actions sont annulées sans dégâts tardifs ; à puissance plus élevée, seule l'action la plus faible est annulée et la plus forte continue vers l'impact natif.
- La vérification d'acteurs réciproques `left.actorId===right.targetId && right.actorId===left.targetId` reste l'invariant V1 ; ce lot ne crée pas de collision spatiale arbitraire entre trajectoires croisées de quatre acteurs 2v2. Un rayon garde ses stages FX / ses sons / ses durées, et aucune conversion en projectile n'est effectuée.

## Arc électrique
- Unique fiche auteur : `data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json`.
- Seul paramètre modifié : `draft.definition.projectileClash.power` **0 → 2** ; `form=beam`, `preparationMs=800`, `travelMs=650`, 20 dégâts électriques, stun 3 s, quatre slots visuels, sons, feedback Glow / Trail / Impact et paramètres auteur intacts.
- Le Human Editor `readHumanProjectilePowerV1(root,form)` forçait silencieusement les rayons à 0 lors de la sauvegarde : il accepte maintenant les formes `beam` et `projectile`. Le libellé `data-skill-projectile-power` explique cette règle commune. Les autres types conservent 0, aucune nouvelle autorité de sauvegarde.

## TDD, tests et barrières
- Sentinelle initiale RED `tests/unit/capture-beam-clash-power-v1.test.mjs` sur beam2/shot, beam/beam, seuil 0, fenêtres de trajet, Arc auteur et vrai `CombatRuntime` sans dégâts tardifs, puis sentinelle de lecture de puissance dans le Human Editor.
- Première CI native après code `38470679530` : 1705 PASS / 1 FAIL, échec limité à la vieille affirmation « Beam 0 » de `tests/unit/capture-voltige-teleport-arc-stack-timer-v1.test.mjs`, valeur actualisée sur puissance2 après diagnostic ; tests nouveaux non fautifs.
- Restent à certifier sur SHA final : Foundation et Chromium Firestorm et bibliothèque créatures, checkpoint GREEN SHA identique, comparaison production sous lease, publication FF, CI+Pages post-publi.
- Protection stricte : 1v1/2v2 géométrie, 103 créatures, autre skill/JSON, Stun/Immobilisation/Silence, titres/FX et assets, sauvegarde Glow en dehors de la lecture de puissance, `main`, `global-assets`, GenSrpG et Exploration.
- Inspection visuelle Android réelle des impacts **beam↔projectile et beam↔beam** : ouverte ; GREEN CI ne certifie pas l'ergonomie des FX.
