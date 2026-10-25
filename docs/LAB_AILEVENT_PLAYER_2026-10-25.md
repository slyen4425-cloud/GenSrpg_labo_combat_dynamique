# Ailevent dos joueur — 2026-10-25

Import du ZIP approuvé : AILEVENT_DOS_2_ANIMATIONS_PLUS_MODELE_JOUEUR.zip, 13416024 octets, SHA256 5a72b3644c8bc99ffe7f00c39f51551398824ca0d2651f9f6d7bea4f4cd25ee8. Modèle joueur strictement égal à l'image jointe 8221.png (SHA256 ab45843596adba23fd2b20a8383deb938ae7baed254e3205c853f761f7af9324). Remplacement du seul runtime player, conservation de opponent et icône. Vol 10f nettoyées, attaque 12f approuvées, vrais PNG RGBA 512px et atlas WebP, previews d'origine. Catalogue unique, 2 nouveaux IDs ; aucun changement moteur ni auto-affectation aux réglages auteur. Base global-assets 6b3162ec087c3e2b46f03cdb7fc905ee7c24e13a, checkpoint de départ dédié, branche work isolée. Gates : CI réelle, revue diff, GREEN et FF. Visuel en combat à tester manuellement.

## Import effectué et contrôle de périmètre

- Import Github Actions `40191497054` : SUCCESS, y compris `npm run ci` sur les fichiers physiques avant commit média.
- Commit média : `c91102809e7d36b4c37b05e5437fabfc7e510482` : 22 PNG exacts du ZIP, deux atlas, six previews, deux manifestes, copie PNG originale du modèle joueur et WebP runtime joueur exporté. Deux ID catalogue ; total 242 assets, 136 sprites, 48 créatures.
- Diff contre la base : 42 fichiers exclusivement autorisés, notamment le seul `runtime/ailevent_player.webp` remplacé ; modèle adversaire et icône inchangés. Fiche metadata revision mise à jour.
- Validation restante : CI du SHA final puis publication GREEN sur global-assets (et CI post-publication). Test de rendu Android distinct.
