# Colorisation non destructive des sprites de capacités — 13 novembre 2026

## Source et périmètre
- Base officielle : `main@7f2f7977ca55725aa41e2b3730cee26941f64b3f`, checkpoint `checkpoint/lab-start-skill-sprite-recolor-2026-11-13`.
- Branche de travail : `work/lab-skill-sprite-recolor-2026-11-13`. Un seul propriétaire des images et un seul pipeline FX.
- Aucun PNG, atlas, catalogue global, moteur Combat, règle de gameplay, statistique, collision ou autre labo modifié.

## Contrat
- `SkillPresentationBindingV15` est une enveloppe facultative conservant la version historique exacte dans `recolorBaseVersion`.
- Les rôles visuels `cast`, `travel` (projectile), `impact`, `aura` (zone) peuvent porter `recolor: {hueRotateDeg, saturationPct}`.
- Validation stricte : teinte 0..360°, saturation 0..200 %. Absence du champ = sprite original.
- Aucun champ `recolor` sur les icônes, animations corporelles, données de combat, statuts ou assets partagés.
- La résolution du catalogue fournit la même URL officielle, enrichie uniquement de cette présentation locale.

## Éditeur et rendu
- L'éditeur offre deux contrôles par rôle ; valeurs neutres 0°/100 % ; roundtrip du brouillon et sauvegarde.
- Le renderer DOM existant combine `hue-rotate` et `saturate` sur le nœud FX du sprite et conserve les ombres FX préexistantes.
- Le traitement est purement visuel (filtre CSS), sans copie ni encodage d'image, sans modification d'alpha/collision/durée.
- Limite connue : un filtre CSS de rotation de teinte préserve la structure de couleur initiale, mais ne recolore pas des pixels entièrement blancs. Pour de nouveaux besoins de recoloration complète des sprites blancs, prévoir un lot validé séparément.

## Validation exigée
- Tests : bornes, anciens contrats stricts, unicité des assets, roundtrip auteur, relais resolver, rendu DOM, tous les contrôles HTML.
- CI exacte et vérifications Chromium PC/mobile, puis PR vers main et preuve de déploiement Pages sur SHA final.
- Les effets recolorés n'ont aucune incidence sur les marques, dégâts, durée, projectile clash, couches ou collisions.

## Correction ergonomique (13 novembre 2026)

La saisie numérique seule est remplacée par deux curseurs tactiles visibles par rôle (teinte et intensité) avec valeurs lisibles, cercle d'aperçu **indicatif** et bouton « Retrouver les couleurs d’origine ». L'aperçu est un exemple colorimétrique et n'usurpe pas le sprite réel ; tester la capacité dans le combat pour vérifier le rendu final. Les attributs `data-skill-*-hue-deg` / `data-skill-*-saturation-pct` sont inchangés et restent l'unique source d'édition, sauvegarde et export du V15. Uniquement l'UI et des tests changent, aucune copie d'asset ni seconde autorité.

## Vérification de la chaîne de cache (13 novembre, suite)

Les sentinelles de publication ont constaté que la nouvelle version HTML était plus récente que certains imports ESM encore estampillés avec le token précédent. Les mêmes chemins de modules canoniques (entrée, éditeur, manifeste d'assets, loader de preview et rendu Combat) utilisent maintenant un identifiant de sortie cohérent. Les tests historiques conservent leurs assertions d'égalité de chaîne ; seuls deux suffixes de version attendus sont avancés. Le contrat V15, les assets et le moteur sont intacts. Aucune CI rouge ne vaut validation.
