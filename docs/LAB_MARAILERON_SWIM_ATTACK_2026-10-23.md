# Maraileron — deux animations validées (23/10/2026)

Source officielle: `global-assets/_incoming/CREATURE_AQUATIQUE_2_ANIMATIONS_NAGE_ATTAQUE.zip`, 6 196 877 octets, SHA256 `397e5435260bbb48f0c33591c1a2eb15c51942e4857a552e4e38e70ad018ea2a`, Git blob `fdb3d6219db341ad6a16259cbcc85110b7ae26ea`; ZIP CRC OK.

Créature identifiée par fiche: `maraileron`, profil `serpentine`, vue `player` (tête vers droite). Animation movement: 6 images PNG RGBA 512×512, 90ms/frame loop. Attack: 12 images RGBA 512×512, 100ms/frame once. Les 18 images sources sont conservées octet pour octet et contrôlées avec SHA256, marges ≥90 et ≥56 px. Deux atlas WebP 384px/frame, six previews (GIF/WebP/planche), deux manifestes, deux fichiers source/provenance. Aucun visuel régénéré.

IDs de catalogue: `pack:capture:creature-maraileron-movement-player-6-v1`, `pack:capture:creature-maraileron-attack-player-12-v1`. Unique catalogue `data/assets/catalog/global-visual-assets.v1.json`, médias `assets/library/capture/creatures/maraileron/animations/{movement,attack}/player/`.

Base `global-assets@279fa8a800549739c5e42bbda893cc1db5dbca99`, CI 40020043256 SUCCESS. Checkpoint début `checkpoint/global-assets-before-maraileron-swim-attack-2026-10-23`, branche `work/global-assets-maraileron-swim-attack-2026-10-23`. Protéger runtime Maraileron, autres créatures, UI/moteur/fiches auteur, main, gh-pages et GenSrpG. CI du SHA final, diff strict, checkpoint GREEN avant fast-forward. La sélection dans le catalogue n'affecte pas automatiquement le profil de combat et ne vaut pas validation manuelle smartphone.

## Import GitHub vérifié

- Workflow importer run `40020630295` **SUCCESS**, commit réel des médias `7838ca0e9e98c597924c9086a84325f509a7504d` : 18 PNG 512px RGBA physiquement présents, deux strips WebP et six previews, deux manifestes, deux fichiers provenance. Le `npm run ci` exécuté par l'importeur a réussi avant commit des médias.
- Catalogue de la branche après import : **222 assets, 121 sprites, 40 créatures** ; 2 IDs Maraileron uniques et résolvant vers des atlas existants.
- Revue Git diff par rapport à la base : **37 fichiers** strictement dans le lot attendu ; aucune modification des sprites runtime Maraileron, d'autres créatures, UI, moteur ou données auteur.
- Gate restant : CI séparée au SHA **contenant les médias** (après ce commit de documentation), puis checkpoint GREEN et fast-forward. La validation smartphone reste distincte.
