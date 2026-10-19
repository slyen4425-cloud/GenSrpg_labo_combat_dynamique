# Monster Capture / GenSrpG — Charte officielle des modèles, animations et icônes V1

**Date :** 19 octobre 2026  
**Portée :** création artistique, import et validation des visuels de créatures et capacités de Monster Capture (laboratoire combat dynamique).  
**Statut :** contrat de production des NOUVEAUX visuels. Ne convertit, ne remplace et n'active aucun ancien asset automatiquement.  
**Référence prioritaire :** modèles approuvés de **Scarabacier** (appelé parfois « Scaracier » dans les échanges). Référence de pose = **les images de référence fournies et validées par l'auteur**, et NON les sprites d'attaque générés dans la conversation le 19/10/2026, qui ont été **refusés** pour changement de pose et d'orientation.

Cette charte complète [LAB_CHARTE.md](LAB_CHARTE.md), en particulier ses sections 6 (image unique compatible), 14 (portabilité des assets), 33 (données auteur) et 34 (vérification du contenu réel). La charte technique du laboratoire prime en cas de conflit de gouvernance.

## 1. Principe non négociable : animer LE modèle validé

- **Face — frame 01 = copie pixel pour pixel du fichier maître FACE approuvé** (RGBA et canvas identiques). L'animation reste dans **l'angle face approuvé**, même s'il est légèrement de trois-quarts.
- **Dos — frame 01 = copie pixel pour pixel du fichier maître DOS approuvé** (RGBA et canvas identiques). L'animation reste dans **l'angle dos approuvé**, même s'il est légèrement de trois-quarts.
- Aucun mouvement ne fait tourner la créature pour montrer une autre perspective. **Dos reste dos ; face reste face.** Une inclinaison locale de tête, un battement d'ailes ou une contraction sont possibles, sans modifier la perspective générale.
- La forme, l'identité, l'armure, les proportions, le nombre et l'attache des pattes, pinces, antennes/cornes, ailes et queue sont conservés d'une frame à l'autre. Pas de membre apparu/disparu, queue déplacée arbitrairement, palette recréée ni refonte du dessin.
- Pas d'inversion horizontale automatique d'un modèle approuvé, sauf demande et validation explicites. L'orientation du personnage ET la direction dans laquelle il regarde sont contractuelles.
- **La référence validée n'est pas approximée à la génération.** Si une source maîtresse détourée ne peut être obtenue de manière identique, livrer d'abord un modèle candidat à valider ; **ne pas prétendre** avoir une frame 01 exacte.
- Si le modèle initial approuvé n'est pas carré ou contient un décor, produire des fichiers maîtres RGBA détourés **à faire valider avant animation** ; ne pas utiliser le photomontage sur fond sombre comme PNG final.

### Application explicite à Scarabacier

Dans la planche de référence reçue le 19/10/2026 :
- **vue FACE :** créature montrée à gauche, dans sa perspective propre, avec la tête et les pinces tournées vers la **gauche de l'image**. Ce n'est pas une instruction de redessiner de face parfaitement symétrique ;
- **vue DOS :** créature montrée à droite, de dos **en léger trois-quarts**, tête dirigée vers la **droite de l'image**, dos/carape visibles, visage peu apparent. Garder cet angle et la direction de la tête ; **ne pas le retourner, le mettre face caméra ni changer la construction queue/pattes**.
- Les deux vues sont deux **modèles maîtres distincts**, et non un seul modèle pivoté artificiellement.
- Les séquences d'attaque précédemment produites sont **des contre-exemples non validés** : première pose incorrecte, changements de perspective et d'anatomie. Ne pas les cataloguer ni les intégrer sur cette seule base.

**Priorité :** si les PNG maîtres approuvés et détourés ne sont pas encore enregistrés, l'image de référence permet de définir la perspective mais **ne suffit pas** à prouver l'égalité pixel-à-pixel de la frame 01. Il faut d'abord établir et valider ces PNG maîtres.

## 2. Modèles de créatures : livrables de référence

Chaque créature destinée au combat nécessite, au minimum :

| Vue | Rôle | Spécifications |
|---|---|---|
| `face` | Adversaire | Perspective approuvée, regard et silhouette stables, corps entier |
| `dos` | Créature du joueur | Dos dominant, angle exact approuvé, corps entier et direction du regard préservée |
| `icon` / portrait | Sélection d'équipe, inventaire/éditeur | Visuel cohérent avec la même créature, identifiable à petite taille |

**Fichiers maîtres face/dos :** PNG RGBA **512 × 512 px**, pixels de fond réellement transparents (alpha 0), aucune ombre de décor rectangulaire, aucun texte, grille, numéro, contour de case ou watermark ajouté au modèle. Les ombres naturelles du sujet sont autorisées sur une couche transparente si elles sont nécessaires au rendu.

**Composition :** corps complet visible, centré avec marges de sécurité ; une griffe, aile ou queue ne doit pas être coupée. Garder une empreinte visuelle comparable entre les deux vues (ne pas agrandir systématiquement l'une par rapport à l'autre). La référence maître fait autorité pour l'échelle et l'ancrage.

**À sauvegarder avec chaque créature :** ID stable, nom, vues approuvées, dimensions, palette et signes distinctifs, direction de chaque vue, date/version d'approbation, ancrage pieds/sol, sockets face/dos si existants, provenance et statut de validation. Les sockets en données auteur restent intacts (voir LAB_CHARTE §33).

## 3. Animations de créature — spécifications techniques

| Propriété | Règle |
|---|---|
| Vues | **Deux animations indépendantes** : face et dos ; jamais l'une dérivée par rotation de l'autre |
| Longueur standard | **16 à 20 frames** ; 20 par défaut pour attaque élaborée, 16 si validé |
| Fichier source d'une frame | **PNG RGBA, 512 × 512 px**, même canevas et même ordre des frames |
| Transparence | Alpha réel sur toutes les frames, y compris zones d'effets ; **pas de fond noir/marron incrusté** |
| Frame 01 | **Identique bit par bit en pixels décodés (RGBA) au PNG maître** de la vue correspondante |
| Orientation | Stable sur **chaque frame**, y compris pendant l'attaque, l'impact et la récupération |
| Échelle / pivot | Ancrage sol constant ; aucun saut de position, zoom ou recadrage non voulu |
| Cadence | Paramétrable par l'Animation Core ; **prévisualisation suggérée à 12 FPS**, sans imposer ce timing au moteur |
| Animation finale | Retour à la pose initiale de la même vue sauf état final explicitement demandé |
| Atlas | Planche optionnelle **sans marge/gouttière** : 20 frames = grille 5 colonnes × 4 lignes (2560 × 2048) ; 16 frames = 4 × 4 (2048 × 2048) ; préciser ordre gauche→droite, haut→bas |
| Effets | Ailes/énergie/particules permis, mais sans altérer ni masquer durablement la créature ; effets séparables préférables lorsque réutilisables |

**Aucune légende, aucun numéro, aucun encadrement, aucune couleur de fond sur les frames ou l'atlas de production.** Ces éléments sont autorisés uniquement dans une planche de revue séparée.

### Exemple recommandé d'attaque ailée en 20 frames (pour chaque vue)

- **01–03 :** modèle approuvé au repos, tension légère, aucune dérive de perspective ;
- **04–07 :** ailes/carapace s'ouvrent depuis leurs véritables articulations, tête et pattes restent reconnaissables ;
- **08–12 :** battement, préparation/émission ou coup, mouvement local compatible avec la vue ;
- **13–16 :** suivi du mouvement/effet énergétique, sans rotation générale du corps ;
- **17–20 :** repli et récupération, retour au même ancrage et idéalement à la pose maître.

L'action peut être adaptée à la capacité (mêlée, distance, esquive, déplacement), mais jamais au prix d'un changement de vue. Un sprite d'attaque à distance ne modifie pas les règles de collision, de ciblage ou les timings de gameplay : il reste un média piloté par les propriétaires de présentation existants.

### Contrôles de cohérence inter-frames

Vérifier manuellement et, si possible, par tests automatiques :

1. Égalité RGBA de la frame 01 et de la vue maître associée ;
2. Dimensions 512 × 512 et canal alpha présent pour **toutes** les frames ;
3. Absence de couleur de fond uniforme opaque ou de bordure ; coins réellement transparents ;
4. Nombre et continuité des membres/appendices ; carapace, couleurs et éléments lumineux conservés ;
5. Direction du regard, orientation, anatomie des pattes et attache de la queue identiques au modèle maître ;
6. Ancrage bas des pattes constant ; absence de saut de cadrage et variation de taille involontaire ;
7. Lecture sur smartphone en paysage, y compris en réduction ;
8. Lecture en lecture continue ET en défilement frame par frame (les défauts rapides ne doivent pas être masqués par la cadence) ;
9. Cohérence dernière frame → idle/reprise du moteur ;
10. Aucun remplacement caché, duplication d'assetId ni reconstitution approximative.

Si un seul contrôle essentiel échoue : **REFUSÉ / À CORRIGER**, pas de raccord.

## 4. Icônes — modèle, capacité, statut

Les icônes partagent une identité visuelle « Monster Capture » : sujet principal unique, silhouette immédiatement distincte des autres, contraste marqué et **fond clair lisible lorsqu'il fait partie de la direction artistique** ; ne pas produire plusieurs pictogrammes presque identiques ni un enchevêtrement d'effets.

- **Master artistique conseillé :** carré 512 × 512 RGBA, conservé comme source de travail.
- **Export optimisé HUD constaté dans le labo :** **WebP 128 × 128 px**, avec transparence quand requise. Le PNG 128 × 128 est acceptable si le catalogue/contrat d'import le prévoit ; toujours contrôler le **format réellement attendu par la bibliothèque cible avant raccord**. Le 512 × 512 est une source de production, **pas une promesse de résolution runtime**.
- Le **fond clair graphique** d'une icône peut être inclus dans son dessin ; il ne faut pas confondre ce fond de vignette voulu avec un fond parasite provenant d'une capture/planche. Respecter la transparence hors vignette si requise.
- Icônes de capacités et portraits de créatures ne sont pas interchangeables : conserver leur usage et leurs identifiants de média distincts.
- Test obligatoire en taille réelle d'utilisation (icônes de HUD sur téléphone), lisibilité sans devoir zoomer, différence perceptible avec icônes voisines.
- Export sans texte, numéro ou watermark superposé sauf contrat UI particulier explicitement accepté.

## 5. Visualisation **OBLIGATOIRE AVANT** intégration

Pour **chaque animation et chaque vue** fournir **avant tout raccord catalogue/runtime** :

1. **La planche de poses** (contact sheet) montrant toutes les frames numérotées **pour revue uniquement**, sans contaminer les PNG de production ;
2. **Une vraie animation lisible en mouvement** : WebP animé ou GIF (ou vidéo dédiée), vitesse réaliste et éventuellement version au ralenti ;
3. **Une prévisualisation distincte FACE et DOS**, avec libellés explicites ;
4. **Les 16–20 PNG RGBA individuels** et **l'atlas optionnel** dans l'ordre de lecture documenté ;
5. Une comparaison visible **frame 01 à côté du maître approuvé**, avec contrôle d'égalité RGBA ;
6. Si possible un exemple d'affichage à l'échelle du combat sur un fond contrasté, **sans aplatir la transparence des médias sources**.

La visualisation doit permettre à l'auteur de voir clairement le mouvement complet, pas uniquement une image fixe, une spritesheet ou des vignettes. **Une animation produite n'est pas une animation approuvée.**

**POINT D'ARRÊT obligatoire :** attendre l'approbation **explicite** de l'auteur pour chacune des deux vues avant le découpage définitif/catalogage/raccord dans le jeu. Un refus ne doit jamais être transformé en intégration tacite. En cas de correction, refaire les aperçus et demander une nouvelle validation.

## 6. Nommage, dossiers et statut des livrables

Convention recommandée pour une créature (slug stable, par exemple `scarabacier`) :

```text
capture/creatures/scarabacier/
  masters/
    crea_scarabacier_face.png
    crea_scarabacier_dos.png
    crea_scarabacier_icon_source.png
  animations/
    attack_wings/
      face/
        crea_scarabacier_attack_wings_face_01.png
        ...
        crea_scarabacier_attack_wings_face_20.png
      dos/
        crea_scarabacier_attack_wings_dos_01.png
        ...
        crea_scarabacier_attack_wings_dos_20.png
      atlas/
        crea_scarabacier_attack_wings_face_atlas.png
        crea_scarabacier_attack_wings_dos_atlas.png
  previews/
    crea_scarabacier_attack_wings_face_preview.webp
    crea_scarabacier_attack_wings_dos_preview.webp
    crea_scarabacier_attack_wings_contact_sheet.png
  metadata/
    crea_scarabacier_visual_manifest.json
```

Cette arborescence est une **organisation de livraison**, pas une création obligatoire d'une nouvelle bibliothèque runtime. Le chemin canonique de stockage dans GitHub est à déterminer selon l'autorité média existante du labo (`assets/library/capture` / bibliothèque globale si applicable) ; utiliser **les catalogues et assetId existants**. Pas de copie silencieuse d'un binaire déjà possédé par une autre bibliothèque, ni de second résolveur.

Exemple de métadonnées de livraison (non un nouveau contrat runtime) :

```json
{
  "creatureId": "crea_scar_2",
  "creatureName": "Scarabacier",
  "action": "attack_wings",
  "views": {
    "face": { "master": "crea_scarabacier_face.png", "frameCount": 20, "width": 512, "height": 512, "approved": false },
    "dos": { "master": "crea_scarabacier_dos.png", "frameCount": 20, "width": 512, "height": 512, "approved": false }
  },
  "previewFps": 12,
  "reviewStatus": "pending_author_validation"
}
```

Le manifeste ne prend pas autorité sur `configuredCreatures`, les sockets, l'Animation Core ou les catalogues médias. Il documente la livraison et les validations.

### Statuts explicites

`DRAFT` → `PREVIEW_READY` → `APPROVED_FACE` / `APPROVED_DOS` → `APPROVED_BOTH` → `ASSET_VERIFIED` → `INTEGRATED`.

Un statut n'implique **pas** le suivant. `GREEN` artistique exige la validation utilisateur ; `GREEN` technique exige les sentinelles, le raccord réel et la CI du dépôt suivant sa charte. **Les anciennes animations Scarabacier refusées ne franchissent pas `DRAFT`.**

## 7. Procédure de production obligatoire

1. Lire `docs/LAB_CHARTE.md`, `docs/LAB_ROADMAP.md`, `docs/LAB_CURRENT_WORK.md` et la présente charte.
2. Identifier la créature par ID stable et les **deux fichiers maîtres approuvés**. Si absents, préparer **uniquement** les maîtres RGBA candidats, visualiser et faire valider.
3. Relever la branche, le SHA de base et les domaines protégés avant toute action sur les dépôts ; une branche et un checkpoint par lot selon la charte du labo.
4. Définir l'action et les parties autorisées à bouger (ex. ailes et pinces), sa durée, sa perspective et l'ancrage.
5. Produire la vue FACE depuis le maître FACE et la vue DOS depuis le maître DOS, sans changement d'angle ; ne pas utiliser l'une comme miroir de l'autre.
6. Inspecter chaque frame (dimensions, transparence, continuité, orientation, frame 01 exacte), corriger les écarts.
7. Fournir **systématiquement** deux animations lisibles + planches de poses + comparaison des maîtres ; **demander approbation**.
8. Après approbation des **deux** vues, préparer frames finales, atlas et métadonnées ; refaire les tests de qualité.
9. Déposer les médias dans l'autorité média vérifiée, référencer par `assetId` stable et raccorder via la chaîne existante ; aucun changement des règles gameplay.
10. Vérifier le contenu réel des fichiers sur GitHub, le chargement en preview dans l'éditeur et le test Android paysage ; CI et checkpoint GREEN technique si validés.
11. Fournir le rapport : lien des sources/aperçus, nombre de fichiers, noms, chemins, SHA, validations FACE/DOS, détails des contrôles. Signaler honnêtement les étapes en attente.

## 8. Checklist de blocage avant publication

- [ ] Source modèle FACE exacte, version approuvée
- [ ] Source modèle DOS exacte, version approuvée
- [ ] PNG maîtres réellement transparents, cadrés et 512 × 512
- [ ] Frame 01 FACE identique au maître FACE
- [ ] Frame 01 DOS identique au maître DOS
- [ ] **Aucune rotation/perspective nouvelle** pendant les deux animations
- [ ] Aucune mutation anatomique (pattes, ailes, queue, tête, armure)
- [ ] 16–20 frames par vue, 512 × 512 RGBA, numérotées et ordonnées
- [ ] Ancrage et proportions constants ; animation à cadence vérifiée
- [ ] Planche de poses et animation lisible pour chaque vue
- [ ] Aperçu comparatif au modèle initial, sans fond incrusté
- [ ] **Validation explicite FACE + DOS par l'auteur**
- [ ] Assets binaires réels inspectés ; pas de placeholders présentés comme finaux
- [ ] Icônes distinctes, lisibles en taille HUD, export adapté au labo
- [ ] Catalogue propriétaire/ID stable sans doublon et vrai raccord vérifié
- [ ] Tests CI, test Android si applicable et rapport SHA exact
- [ ] Aucun changement indu de `main`, de `Zombicide-40k` ou d'un autre dépôt

## 9. Règle de conclusion

> Un modèle validé n'est pas une suggestion. **La frame 01 est ce modèle exact ; l'animation ne change jamais de point de vue.** La prévisualisation animée des deux vues précède toute intégration, et le refus bloque le raccord.

**Évolution future :** tout changement de résolution ou de format d'atlas doit être décidé en lien avec les contrats réels de chargement et la charte technique, puis versionné ; cette V1 ne justifie aucune migration automatique des visuels déjà validés.
