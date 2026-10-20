# Ombre de créature penchée — centrage sur les appuis de silhouette

Date : 20 octobre 2026. Retour visuel : Scarabacier en vue joueur, corps et pattes désaxés dans sa pose 2.5D. L'ombre était bien redevenue visible après PR #37, mais son centre fixe `left:50%` visait le centre du rectangle d'image plutôt que les appuis de l'animal.

## Cause, autorité et correction

Le propriétaire `src/adapters/renderer/dom-ground-shadow-v2.js` savait déterminer la largeur et la hauteur de l'ombre et son contact vertical à partir du masque alpha ; son centre horizontal, en revanche, restait fixé par `demo.css`, indépendamment de la posture. La correction ajoute un **centre horizontal déduit du même masque**, pondérant les pixels opaques de la portion inférieure utile de l'animal. Le calcul utilise les bornes robustes déjà présentes (2 % de trim) pour écarter des éclats égarés. Aucun ID de créature n'est consulté, aucun nouveau registre n'est créé.

- `shadowGeometryFromOpaqueMaskV2` retourne désormais `centerXRatio`. Pour un masque vide, 0,5.
- `groundShadowLayoutFromOpaqueMaskV2` renvoie `centerXPct` ; le bas vertical, la largeur, la hauteur et l'opacité restent régis par leurs règles préexistantes.
- `createSlot.loadRuntimeAsset` applique `--creature-shadow-left` dans le même bloc **unique** qui règle déjà `--creature-shadow-bottom`, après chargement du masque existant. L'arène peut toujours être invisible lors du calcul.
- `.fighter__shadow` consomme cette unique valeur via `left: var(--creature-shadow-left, 50%)`. Ce n'est pas une superposition ni une rustine CSS : le centre effectif est dérivé de la silhouette par le même calculateur.
- `DomActorRenderer` conserve seul la translation/échelle temporelles de l'ombre. Le moteur de collision et les représentations front/back restent intacts. Les exports auteur et la banque d'assets de Scarabacier sont inchangés.

## Risques, limites et preuves

Le positionnement n'est **pas** un détecteur anatomique capable d'identifier des pieds dans n'importe quel sprite. Il infère le centre des appuis depuis la partie basse opaque ; sur un sprite artistique avec faux appuis ou beaucoup de décor transparent, une validation visuelle reste nécessaire. Il n'est donc pas promis que le premier calcul soit un réglage artistique parfait. Un point d'appui explicite par vue, si nécessaire plus tard, doit être défini dans le contrat visuel auteur et l'éditeur, pas comme une dérogation ID.

La sentinelle `combat-shadow-posture-footprint-2026-10-20.test.mjs` vérifie : modèle symétrique centré, silhouette penchée déplacée, pose miroir, résistance aux pixels parasites, masque vide, zéro changement de moteur d'animation, unique écriture CSS dans `loadRuntimeAsset`, prévention de la régression PR #37. Conserver les autres sentinelles d'ombre et la CI complète (cinq jobs), puis Pages et revue réelle Android (joueur/opposant, repos/mouvement/attaque/rappel).
