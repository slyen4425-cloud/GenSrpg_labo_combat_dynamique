# Monster InvoC — sauvegarde des sprites des joueurs et partage entre participants

**Chantier isolé (20 novembre 2026).** Suite de l'import simple, PR Combat #358.
La sauvegarde locale de sprites est réalisée en extension de l'unique
`CreatorVisualAssetSessionV1` : aucune nouvelle bibliothèque/autorité de
rendu. Le raccordement multijoueur **n'est pas publié ni activé** dans la PWA.

## Constat audit

- Capture Lab : l'importeur ne conservait que `Blob URL` de session, donc
  perte à fermeture ou changement d'origine. L'animation de la preview
  renvoyait même `frameCount:1` pour des sprites créateur.
- Le moteur Exploration possède déjà des stores IndexedDB pour les héros et PNJ.
  Ils ne sont PAS des stores de sprites de compétences et n'ont pas à changer.
- La PWA/Monster InvoC possède Supabase, salles authentifiées, membres et
  Realtime private `gensrpg-capture-room:<uuid>` ; le schéma en place comprend
  `gensrpg_capture_rooms`, `gensrpg_capture_room_members`, etc.
- Audit Supabase du 20/11 : zéro bucket Storage existant. Il est donc
  impossible d'annoncer un transfert d'images multijoueur déjà fonctionnel.
- Le Labo Combat et la PWA sont des **origines HTTP distinctes** : leurs
  IndexedDB sont isolés par navigateur et origine. Les sessions de chacun ne
  peuvent pas accéder directement aux fichiers de l'autre.

## Livré dans ce lot Combat, sans déploiement

1. Stockage en `IndexedDB` de Blob originaux, sur la même origine, avec
   scope d'univers `universeId` (ou preview laboratoire explicite), ID
   personnel `user:<uuid généré>`, rôle, format, nombre de frames, vitesse et
   SHA-256. Une transaction `readwrite` complète l'écriture avant le message
   « Sauvegardé ». En cas d'échec : message visible et rollback du nouvel asset
   de session, aucun effacement des anciens.
2. Ouverture de la fiche et relecture du Blob vérifiées SHA-256, y compris
   après un vrai rechargement de page. `blob:` URLs recréées en mémoire au
   lieu d'être stockées. Réinjection **dans le même** catalogue qui alimente
   les sélecteurs Créature / Compétence. Une animation conserve `frameCount`.
3. Contrôles : PNG/WebP/JPEG uniquement, signature réelle, max 24 Mio/asset,
   max 32 frames, tailles et durées bornées. Collision d'ID et altération
   détectées et refusées sans réinitialiser une sauvegarde.
4. Contrat de manifeste de salon `gensrpg.capture.room-sprites.v1` :
   `roomId`, `authorUserId`, et `assetId/role/mime/bytes/frameCount/frameMs/sha256`.
   **Aucune image, aucun chemin Storage, aucune URL de session ou donnée de
   progression** n'est envoyé dans ce manifeste. Partage explicitement validé,
   contrôle de budget 48 sprites / 96 Mio par annonce.

## Raccordement PWA/Supabase — chantier distinct à réaliser après accord

Le propriétaire de la sauvegarde d'univers est le module Monster InvoC de la
PWA (une fois intégré) ; le laboratoire ne reçoit jamais la maîtrise
de l'identité du joueur ni des permissions des salons.

**Une seule copie cloud par contenu** : bucket Supabase Storage privé
`gensrpg-capture-player-assets`, objets immuables
`<auth.uid()>/<sha256>.<extension>`, avec table de métadonnées
`gensrpg_capture_player_assets` et table de publication limitée à un salon
`gensrpg_capture_room_asset_shares`. Ces noms sont **proposés, non créés**.

Le propriétaire authentifié téléverse son Blob une seule fois (SHA-256 +
type/size vérifiés), enregistre son métadata et autorise **explicitement**
un partage à un salon existant. Les participants reçoivent un petit manifeste
par le canal Realtime **déjà existant**. Ils demandent ensuite uniquement les
octets manquants via Storage `download()` authentifié, vérifient hash et
métadonnées, les mettent en cache dans leur bibliothèque locale et
affichent via l'AssetResolver canonique. Pas de transfert binaire Broadcast,
pas de nouveau salon, pas de serveur WS, pas de contrôle de position retouché.

### Permissions non négociables

- RLS `storage.objects` activée ; bucket **privé**. Pas de `getPublicUrl`,
  pas de clé `service_role` dans le navigateur, pas d'URL signée durable.
- Upload path `<auth.uid()>/<sha256>.*` autorisé uniquement au propriétaire
  authentifié ; liste et lectures restreintes au propriétaire ou aux membres
  du **salon précis** associés à un partage actif. Écriture/retrait du lien
  de partage uniquement par l'auteur authentifié et encore membre du salon.
  Les admins ne sont pas déduits de métadonnées utilisateur modifiables.
- Vérifier le rôle du salon et `guest_permissions` **sur le serveur**, pas
  seulement via l'interface. Les UUID du manifeste ne font jamais preuve
  d'identité ; comparer au contexte authentifié du message.
- Aucun accès inter-univers ou inter-salon par simple connaissance d'un
  `assetId`, d'un SHA ou d'un code de salon. Interdire le listing global.
- Sur départ/exclusion : retirer le lien de partage pour bloquer les nouveaux
  téléchargements. Un fichier déjà téléchargé sur l'appareil du destinataire
  ne peut pas être révoqué a posteriori ; l'interface doit l'annoncer.
- Nettoyage d'assets non référencés **séparé**, sans suppressions implicites.

### Sauvegarde fiable au-delà de l'appareil

IndexedDB garantit la conservation normale et fonctionne hors ligne, mais
**n'est pas une sauvegarde hors appareil** : vidage des données du site,
navigation privée et certaines politiques d'éviction peuvent le supprimer.
Avant annonce de « sauvegarde garantie », ajouter une **sauvegarde cloud privée**
optionnelle par compte et un export portable complet (manifest JSON + octets
dans un ZIP). Importer ces sauvegardes via le même contrat vérifié.
Aucune réussite cloud ne doit être annoncée avant accusé de réception confirmé.

### Cas de test PWA avant GREEN

1. Deux navigateurs distincts (PC/Android), utilisateur A avec sprite privé
   et B sans le fichier : B ne reçoit l'image qu'après consentement et
   téléchargement autorisé ; animation identique après mouvement/attaque.
2. C non membre ne peut lire ni l'objet ni les métadonnées ; B expulsé ne
   peut plus demander un nouveau téléchargement.
3. Salon fermé, reconnexion B et changement d'univers : le cache valide ne
   saute pas, aucune fuite entre univers ni sessions.
4. Coupure réseau pendant l'upload, quota local plein, hash altéré,
   doublon d'ID, image > 24 Mio, MIME usurpé, plus de 48 fichiers, version
   inconnue : échec visible, aucune fausse réussite, aucune suppression.
5. Vraie reprise après refresh/PWA hors ligne, conflit multi-onglets,
   contrôles d'accès RLS réels, transport à faible débit, allers-retours de
   fichiers et test de deux appareils.

## Gate d'intégration

Combat : PR propre + test Node et Chromium réel à SHA final + checkpoint.
PWA : **autre** branche / PR / migration versionnée et sécurisée, audit RLS,
tests en base de test, intégration avec la connexion Supabase existante,
publication contrôlée puis essai PC/Android. Ne pas fusionner la PR
locale dans la PWA comme si la partie serveur était déjà opérationnelle.
