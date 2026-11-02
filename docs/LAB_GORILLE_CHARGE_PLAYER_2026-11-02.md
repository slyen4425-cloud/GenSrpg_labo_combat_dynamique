# Gorille des glaces — attaque chargée/canalisée, vue joueur (2 novembre 2026)

## Source vérifiée
- Branche propriétaire : `global-assets`, départ `bef5aaed06bc823ecafc43e2249310cb4c2ccfce`.
- Checkpoint START : `checkpoint/lab-start-gorille-glaces-charge-player-2026-11-02`.
- Lot : `work/lab-gorille-glaces-charge-player-2026-11-02`.
- Source auteur exacte : `_incoming/gorille_des_glaces_canalisation_corrigee_12f.zip`, 11535714 octets, Git blob `5891b83b944b9d7735d118fdc0e90c2367b4a91c`, SHA256 `379afd5861977a636059dd8453e67fb3d622fe78d52830a08f58562f6dba390b`.
- ZIP 17 entrées réelles : 12 frames RGBA 512×512, un atlas 4×3, une planche, deux WebP animés, un manifeste.
- Art : mouvement dirigé vers la droite, main offensive ouverte à droite, bras secondaire maintenu en arrière ; dessin et pixels de chaque frame préservés.

## Contrat et périmètre
- Autorité : unique catalogue visuel `global-assets/data/assets/catalog/global-visual-assets.v1.json`.
- Nouveau seul assetId : `pack:capture:creature-gorille-des-glaces-attack-player-12-charge-v1`.
- Cible : `assets/library/capture/creatures/gorille_des_glaces/animations/attack/player/`.
- Séquence : 12 images distinctes ; attaque `once`, dernière pose maintenable pendant la charge ou canalisation par le moteur (`holdLastFrame=true`, index 11). Ni boucle ni retour automatique à la frame 1 pendant la charge.
- Publication : atlas horizontal WebP sans perte (12×512 = 6144×512) vérifié pixel par pixel contre les PNG, preview WebP 12 frames et planche d'origine.
- Ne pas modifier les modèles `runtime`, l'icône, les autres créatures, les compétences, les fiches exportées ou le gameplay ; pas d'auto-affectation à Gorice ou à une capacité.
- Seuls changements permis : nouveaux médias et manifeste, catalogue central (+1 asset sprite créature), script import, workflow, sentinelle et journal de chantier.
- Prévoir une version cache du sélecteur `gh-pages` seulement dans un chantier ultérieur si nécessaire.

## Validation
1. Test sentinelle RED avant import, puis GREEN sur vrais octets.
2. ZIP Git SHA / SHA256 / CRC, chemins sûrs, 12 PNG 512×512 RGBA, alpha et marges, 12 poses distinctes, atlas strip lossless pixel-identique, previews vraiment animées.
3. `npm run ci`, CI Actions sur SHA final ; checkpoint GREEN uniquement si prouvé.
4. Diff limité au périmètre ; publication séparée vers `global-assets` après contrôle. Validation en jeu sur Android distincte.

Statut : import en préparation, pas encore déclaré GREEN.
