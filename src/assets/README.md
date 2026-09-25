# Asset Input

Ce domaine possède le chargement, la validation et la normalisation des fichiers médias entrants du laboratoire.

État actuel :

- `image-source-manager.js` valide et charge PNG / WebP / JPEG ;
- le laboratoire ne possède pas encore d'Audio Asset Input ;
- il n'existe pas encore d'Asset Catalog runtime.

Cible :

- chargeur image ;
- chargeur audio ;
- validation de fichiers ;
- création / révocation propre des Object URLs ;
- aucune logique de combat ;
- aucune logique de catalogue ;
- aucune logique de stockage persistant.

La future bibliothèque créateur est décrite dans :

`docs/LAB_ASSET_LIBRARY.md`

Séparation obligatoire :

`Asset Input -> Asset Definition / Catalog -> Asset Binding -> Presenter / FX / Audio Adapter`

Le stockage futur des assets personnels appartient à un Storage Adapter séparé.
