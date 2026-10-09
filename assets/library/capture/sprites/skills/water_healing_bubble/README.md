# Bulle de soin aquatique — Capture Monster

- Sprite visuel pour une aura entourant une créature, eau/soin.
- 20 frames séparées en WebP alpha de **512×512**; ordre 01 → 20.
- Atlas runtime WebP horizontal : 20 × 384×384 (= 7680×384), 70 ms/frame, boucle.
- Asset ID canonique : `pack:capture:sprite-water-healing-bubble-01`.
- Transparence conservée ; pas de fond ou de personnage.
- Provenance : planche générée à 1402×1122, cellules initiales ≈280×280 agrandies à 512×512 ; ce n'est pas une création native 512 par cellule.
- Cet asset **ne pilote aucun soin** ; seules les définitions des compétences/statuts détiennent les PV et les durées.
- N'écrase pas les assets existants `healing_aura` ou `regeneration`.
