# GenSRPG — 18 icônes statistiques et éléments — intégration média (2026-11-09)

- Source approuvée : `global-assets/GenSRPG_UI_Icons_V1_2026-11-09_READY.zip`, SHA-256 `0f19d0e96898ee954f0d8b774ee5b018a0d976090f6e53baaafeb49126f3c724`.
- BASE `global-assets@bfe94ebccfe53ed1a01f759b343bb8751565302e`.
- START `checkpoint/lab-start-ui-icons-18-2026-11-09`.
- WORK `work/lab-ui-icons-18-2026-11-09`.
- Autorité unique : `global-assets/data/assets/catalog/global-visual-assets.v1.json`, jamais une copie côté `main`.
- Le ZIP contient 18 PNG maîtres 256 et 18 WebP 128 transparents. L'import n'ajoute que les 36 médias, 18 entrées de catalogue et un manifeste de provenance.
- Statistiques existantes : health, speed, physical, defense, fire, water, earth, air, electric, light, shadow, poison, acier, nature, esprit, glace.
- Symboles uniquement visuels : energy et endurance. Aucune nouvelle statistique.
- Aucun remplacement, aucun changement de mécanique, pas d'auto-affectation aux capacités, aux sauvegardes ou aux autres modules.
- Gate : contrôle CRC + SHA source + 36 images + compteurs et IDs uniques, sentinelle de médias réels, CI `npm run ci`, checkpoint GREEN, mise à jour fast-forward de `global-assets`.
- Lot client séparé sur `main` : conserver la cartographie de statistiques déjà existante, invalider la seule révision cache, CI et Pages puis vérification Android. Ne pas écrire de nouvelles valeurs gameplay.
