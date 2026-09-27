# Pré-audit — éditeur Capture humain V1 — 2026-09-27

## Base autoritaire

Le chantier repart volontairement du dernier checkpoint contractuel GREEN :

`checkpoint/lab-capture-editor-exporter-v1-green-2026-09-27`

SHA :

`41c05bd0fa2e7029e3bdaae8174fe584a055f802`

La branche UI technique `work/lab-capture-editor-ui-v1-2026-09-27` est conservée comme preuve de raccord, mais n'est pas la base de la refonte ergonomique.

Aucun code de cette UI n'est patché pour masquer ses limites.

## Demande produit

L'éditeur cible doit être compréhensible comme un éditeur de jeu courant et séparer clairement :

1. Créature ;
2. Règles / environnement de combat ;
3. Capacités.

Les JSON internes, IDs techniques et structures de contrats ne doivent pas être l'interface normale du créateur.

## 1. Édition de créature

### Besoins confirmés

- image face ;
- image dos ;
- icône ;
- style/profil morphologique : bipède, serpent, volant, massif, etc. ;
- points de sortie de projectile / FX ;
- possibilité de choisir un socket prédéfini : tête, main, patte, queue, bouche, etc. ;
- possibilité plus générale de placer visuellement un socket sur les images face/dos ;
- quatre slots de capacités ;
- sons génériques de créature : attaque, hit, KO/mort ;
- liaison à des assets par `assetId`, jamais par chemin physique.

### État actuel

`CaptureCreatureEditorDraftV1` possède déjà :

- identité ;
- niveau ;
- stats éditoriales ;
- éléments ;
- résistances ;
- capture / apparition / évolution ;
- combat explicite ;
- skillIds ;
- presentationId.

Il ne possède pas le détail de présentation de la créature.

### Nouveau propriétaire nécessaire

Créer un contrat séparé :

`CreaturePresentationBindingV1`

Responsabilités proposées :

- `subjectType = creature` ;
- `subjectId` ;
- `profileId` ;
- assets logiques : `front`, `back`, `icon` ;
- `sockets[]` ;
- sons génériques : `attack`, `hit`, `ko`.

Chaque socket doit être une donnée indépendante du DOM :

```js
{
  id: "mouth",
  label: "Bouche",
  front: { x: 0.52, y: 0.22 },
  back:  { x: 0.48, y: 0.24 }
}
```

Les coordonnées sont normalisées 0..1 et peuvent être créées par clic/toucher dans une future UI.

Le renderer n'est pas modifié dans ce lot.

### Slots de capacités

Le produit demande 4 slots visibles.

Le contrat créature possède déjà `skillIds` sans limite métier.

Décision :

- ne pas casser le contrat pour imposer artificiellement quatre IDs partout ;
- créer plus tard une règle d'éditeur / loadout Capture V1 qui limite l'équipement actif à 4 slots ;
- le catalogue de capacités peut contenir plus de quatre compétences ;
- le combat reçoit seulement les quatre compétences équipées.

Aucune coupe silencieuse des IDs au-delà de quatre n'est autorisée.

## 2. Règles / environnement de combat

### Besoins confirmés

- énergie maximale ;
- méthode de récupération ;
- quantité récupérée ;
- vitesse / intervalle de récupération ;
- nombre de créatures engagées ;
- nombre de créatures / réserve ;
- autres règles globales futures.

### État actuel

Les valeurs suivantes sont actuellement **par créature** dans FighterConfig / brouillon créature :

- maxEnergy ;
- initialEnergy ;
- energyChargeAmount ;
- energyChargeIntervalMs ;
- movementEnergyPerStep ;
- chargeTimeModifierPct.

Le format du combat est séparé via `BattleFormatDefinition` / teams / actors / rosters.

### Décision d'autorité

Ne pas créer une deuxième source de vérité globale pour l'énergie.

Deux niveaux pourront exister plus tard :

- **valeurs créature** : énergie et recharge réellement utilisées par cette créature ;
- **preset/règle de partie** : seulement si l'on décide explicitement qu'une partie force une politique commune.

Tant que cette règle globale n'existe pas dans le moteur, l'éditeur affiche l'énergie dans la section « Combat de la créature », même si l'ergonomie générale regroupe cette partie sous un onglet « Règles de combat ».

Pour le nombre de créatures, un nouveau brouillon de configuration de bataille pourra composer :

- acteurs actifs par équipe ;
- réserves ;
- équipes ;
- contrôleurs.

Il devra produire les contrats existants de format/roster, jamais les contourner.

## 3. Édition de capacité

### Déjà supporté proprement

`SkillDefinition` couvre déjà :

- catégorie : offensive / defensive / heal / buff_debuff / counter ;
- forme : contact / projectile / beam / area / self / aura ;
- élément ;
- mode d'approche : none / ground / aerial / teleport ;
- coût énergie ;
- préparation ;
- temps de trajet ;
- récupération ;
- distances ;
- cibles ;
- esquive ;
- clash projectile ;
- réactions ;
- dégâts ;
- soin ;
- stun ;
- tags.

`SkillPresentationBindingV1` couvre déjà :

Visuel :
- icon ;
- cast ;
- travel ;
- impact ;
- hit ;
- miss ;
- ko ;
- vanish ;
- reappear ;
- return ;
- aura ;
- ground.

Audio :
- cast ;
- release ;
- travel ;
- impact ;
- vanish ;
- reappear ;
- hit ;
- miss.

Donc l'UI future pourra proposer des champs usuels sans JSON pour ces dimensions.

### Manques réels à ne pas masquer

#### Cooldown

Le roadmap documente un cooldown futur, mais le SkillDefinition / Combat Runtime courant ne possède pas encore une autorité de cooldown après utilisation.

Décision :

- ne pas afficher un faux champ « cooldown » qui ne ferait rien ;
- futur lot dédié :
  `SkillDefinition cooldown -> Combat Runtime cooldown state -> disponibilité -> UI` ;
- RED/implémentation/tests séparés.

#### Buff / Debuff génériques

La catégorie `buff_debuff` existe, mais il n'existe pas encore de système générique de statuts arbitraires suffisamment défini pour exposer un éditeur complet de debuffs.

Les effets déjà réels (stun, réactions, immunités, etc.) peuvent être édités.

Les debuffs génériques supplémentaires nécessiteront un contrat de Status Effect séparé avant UI.

## 4. Interface cible

La future UI ne montre plus le JSON comme voie normale.

Navigation recommandée :

### Onglet Créature

Sections :

- Identité ;
- Visuels ;
- Profil de mouvement ;
- Sockets ;
- Sons ;
- Stats / Capture ;
- Combat / énergie ;
- Capacités équipées (4 slots).

### Onglet Capacités

Bibliothèque à gauche / carte de compétence à droite.

Sections :

- Général ;
- Effet ;
- Ciblage ;
- Mouvement ;
- Timing ;
- Réactions / protection ;
- FX ;
- Audio ;
- Réglages avancés.

### Onglet Combat

Sections :

- format 1v1 / 2v2 / futur NxN data-driven ;
- équipe active ;
- réserve ;
- règles communes lorsqu'elles possèdent réellement un propriétaire moteur.

## 5. Aucun raccordement prématuré

Interdits :

- brancher cette UI directement au Combat Runtime ;
- modifier les données du combat en contournant les contrats ;
- réutiliser le vieux DOM Capture comme sous-écran ;
- cacher du JSON et écrire directement dedans avec des sélecteurs DOM ;
- ajouter un champ UI non consommé par une autorité réelle ;
- dupliquer maxEnergy/recharge dans deux contrats ;
- coder quatre compétences en dur dans le contrôleur 2v2 ;
- coder des sons/FX par URL physique ;
- déduire socket/profil/forme depuis le nom de la créature.

## 6. Découpage des prochains lots

Ordre recommandé conforme à la charte :

### Lot A — CreaturePresentationBindingV1

Contrat pur :

- front/back/icon ;
- profileId ;
- sockets normalisés ;
- audio creature attack/hit/ko.

Aucun renderer, aucune UI.

### Lot B — Capture creature editor composition V2

Étendre le brouillon éditeur Capture par référence vers le nouveau binding, sans dupliquer les assets dans le gameplay.

### Lot C — loadout actif 4 slots

Contrat explicite d'équipement des capacités :

- 4 slots ;
- aucun trim silencieux ;
- skill IDs référentiels.

### Lot D — Battle Setup Editor Draft V1

Brouillon pur :

- format ;
- acteurs ;
- équipes ;
- réserve ;
- produit BattleFormat + roster/export via adaptateurs existants.

### Lot E — cooldown réel

Seulement après lot contractuel et runtime dédié.

### Lot F — éditeur humain V2

L'UI devient enfin :

- formulaires communs ;
- sélecteurs ;
- boutons ;
- cartes ;
- previews ;
- aucun JSON requis en usage normal.

Validation mobile obligatoire avant GREEN final.

## Conclusion

La demande utilisateur est compatible avec l'architecture du laboratoire, mais plusieurs dimensions sont absentes des contrats actuels.

La refonte correcte est donc :

`besoin produit -> propriétaire contractuel -> tests -> implementation -> adaptateur éventuel -> UI`

et non :

`nouveau bouton -> champ caché -> patch runtime`.
