# Fluide météorite — pack FX Capture

- Identifiant : `pack:capture:sprite-fluide-meteorite-01`.
- Nom d’affichage demandé : **Fluide météorite**.
- Catégories : `cast`, `projectile` (pluie de météorites / skyfall), `impact` (explosions multiples).
- Élément : feu.
- **60 images distinctes** : 20 par séquence, fichiers PNG transparents RGBA **512 × 512**.
- Source 5 × 4 : trois planches sources conservées dans le pack maître 1402 × 1122, donc les 512 px des frames sont obtenus par agrandissement de cellules de ~280 × 280 et NON par génération native à 512 px.
- Atlas optimisés WebP : 20 frames à 384 × 384, soit 7680 × 384 par séquence.
- Prévisualisations animées WebP fournies dans le pack maître local ; non nécessaires au runtime.
- Ordre chronologique de lecture : `_01` → `_20` pour chaque catégorie.
- Séquencement configurable et purement visuel : l'asset ne décide d'aucun dégât, effet de zone ou ciblage.
- Pour une pluie de météorites, le trajet des projectiles et la pose d'impacts multiples doivent être gérés par le moteur, et non déduits de la sprite sheet.
- Ne touche pas `Zombicide-40k`, n’intègre pas directement le gameplay ni le moteur combat.

Le fichier `sprite_skill_fluide_meteorite_sequences_01.json` donne les chemins, la cadence et les attributs des trois séquences. `provenance.csv` donne les empreintes de chaque frame.
