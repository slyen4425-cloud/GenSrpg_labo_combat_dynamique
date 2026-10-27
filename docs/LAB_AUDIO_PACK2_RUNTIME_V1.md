# LAB — Audio Pack2 Runtime V1

## Statut

GREEN technique. Lot intégré au laboratoire, sans publication des fichiers maîtres privés.

## Source audio privée

Dépôt maître : `slyen4425-cloud/GenSrpG_audio_prive`.

Lot utilisateur : `audio/genrpg_pack2`.

Source vérifiée : 30 fichiers classés par l'utilisateur :
- cast ;
- impact ;
- Projectile ;
- mouvement ;
- zone_persistante.

Le dépôt privé reste la source de vérité des originaux.

## Runtime privé

Build runtime privé :
- commit : `c3a175691900090b277ecded1066a2e947878238` ;
- workflow : `37338365590` — SUCCESS ;
- checkpoint : `checkpoint/audio-genrpg-pack2-runtime-v1-green-2026-10-05` ;
- 30 sources -> 30 MP3 runtime à noms opaques ;
- les WAV sont encodés en MP3 runtime ;
- les MP3 déjà déposés sont préservés ;
- aucun chemin maître `audio/genrpg_pack2/...` n'est publié dans le manifeste runtime du labo.

## Publication laboratoire

Les 30 MP3 runtime sont publiés sous :
`assets/runtime/audio/private-v1/genrpg-pack2-*.mp3`.

Le manifeste/runtime du labo passe de 173 à 203 sons.

Le catalogue éditeur passe également à 203 entrées.

Le resolver unique reste :
`src/assets/private-audio-runtime-library-v1.js`.

Aucun second loader audio n'a été créé.

## Rôles raccordés

- `cast` -> slot audio cast existant ;
- `travel` -> son de projectile/trajet existant ;
- `impact` -> son d'impact existant ;
- `aura` -> nouveau slot canonique pour zone persistante ;
- `movement` -> catalogué avec son vrai rôle.

Le fichier `Move_or_projectile_air.wav` porte correctement les rôles `movement` + `travel`.

Le son mouvement-only `ES_Wings, Insect, Tiny, Pass By - Epidemic Sound.wav` est livré et catalogué, mais n'est pas automatiquement déclenché par une animation de locomotion dans ce lot : le moteur ne possède pas encore d'événement audio de mouvement canonique. Il n'a pas été déguisé en cast/impact. Ce déclencheur devra faire l'objet d'un micro-lot séparé si souhaité.

## Zone persistante

Ajout propre du slot `audio.aura` dans SkillPresentation.

La lecture est pilotée par l'état canonique `persistentZones` :
- création de zone -> démarrage du loop ;
- renforcement de la même zone -> pas de redémarrage parasite ;
- disparition de la zone -> arrêt du loop ;
- dispose -> arrêt des loops actifs.

Aucun timer parallèle, observer global ou seconde autorité.

## UI

L'éditeur Capture expose maintenant :
- Cast ;
- Projectile ;
- Impact ;
- Zone / Aura ;

avec préécoute via le contrôleur audio privé existant.

## Tests

GREEN avant documentation finale :
- CI labo : `37340901726` — SUCCESS ;
- structure / boundaries / independence : OK ;
- **1045/1045 PASS** ;
- manifeste : 203/203 fichiers runtime présents ;
- catalogue : 203 entrées ;
- 30 nouveaux IDs uniques ;
- launcher de validation :
  `examples/dom-demo/lab-test-creator-shadow-audio-v1.html`.

## Périmètre protégé

Aucun changement :
- Combat Rules ;
- calcul des dégâts ;
- collision/contact ;
- Animation Core ;
- Zombicide-40k ;
- main.

## Note hors lot — Fireball 2

Retour utilisateur du 2026-10-05 : le scale du projectile Fireball 2 fonctionne désormais, mais le rendu reste très mauvais comparé aux projectiles Eau / Terre, qui sont propres.

Aucune correction Fireball n'a été effectuée dans ce lot.

Prochain audit recommandé, séparé :
- comparer source frames / atlas / crop / alpha / heading / coreAnchor / frame count / renderer path entre Fireball 2 et un projectile Eau/Terre validé ;
- identifier la divergence avant toute nouvelle génération ou rustine.
